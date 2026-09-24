import { describe, test, expect, beforeEach } from 'vitest';
import { trackImage, handleUpload } from '../../src/upload.js';
import { handleList, handleToggleVisibility } from '../../src/list.js';
import { handleDelete } from '../../src/delete.js';
import { handleTrashPurge, purgeImage } from '../../src/trash.js';
import {
  repairUserManifest, listUserImgRecordKeys, userImgRecordKey,
  deleteImageRecords, mergeUserImgEntry,
} from '../../src/imglist.js';
import { createToken } from '../../src/admin/auth.js';
import { createEnv, createTestUser, createTestImage, authedRequest } from '../helpers/mock-env.js';

// ── 回归背景 ──────────────────────────────────────────────────────────────────
// 批量并发上传时，多个请求同时「读→改→写」同一个 userimgs:{owner} 键。KV 无
// 原子性，跨请求读还有传播延迟，合并+读后校验在重试预算内不收敛就放弃，而
// trackImage 过去忽略返回值 —— 上传返回 201、前端显示成功，图却永远不进
// 「我的图库」。
//
// 现在的结构：每张图另写一条单键原子记录 userimg:{owner}:{key}（权威索引，
// 不存在覆盖竞争），userimgs:{owner} 降级为读优化缓存；/list 读之前先用
// repairUserManifest 回补，所以清单写丢也不会让用户看到「图没了」。

const NOOP_CTX = { waitUntil: () => {} };

/**
 * 给 KV 的指定前缀加上「写后不可读」的滞后，模拟跨请求读延迟把清单写入全部打
 * 到重试上限之外。滞后只作用于 userimgs:，单图索引立即可见（现实中索引写在
 * 用户打开图库前早已传播完成），从而确定性地重现「清单丢了、图却应该在」。
 */
function kvWithManifestLag(kv, prefix = 'userimgs:', lagMs = 1500) {
  const visible = new Map();  // key -> 最后一个已可见的状态（raw|null / meta|null）
  const state = new Map();    // key -> { raw, meta, visibleAt }
  const eff = (key) => {
    const s = state.get(key);
    if (s && Date.now() >= s.visibleAt) return s;
    return visible.get(key) ?? { raw: null, meta: null };
  };
  const as = (key, type) => {
    const e = eff(key);
    if (e.raw === null) return type === 'json' ? null : null;
    if (type === 'json') { try { return JSON.parse(e.raw); } catch { return null; } }
    return e.raw;
  };
  return {
    async get(key, type) {
      return key.startsWith(prefix) ? as(key, type) : kv.get(key, type);
    },
    async getWithMetadata(key, type) {
      if (!key.startsWith(prefix)) return kv.getWithMetadata(key, type);
      const e = eff(key);
      if (e.raw === null) return { value: null, metadata: e.meta ?? null };
      let value = e.raw;
      if (type === 'json') { try { value = JSON.parse(e.raw); } catch { value = null; } }
      return { value, metadata: e.meta ?? null };
    },
    async put(key, value, opts = {}) {
      if (key.startsWith(prefix)) {
        const now = Date.now();
        const prev = state.get(key);
        if (prev && now >= prev.visibleAt) visible.set(key, prev);
        state.set(key, { raw: String(value), meta: opts.metadata ?? null, visibleAt: now + lagMs });
      }
      return kv.put(key, value, opts);
    },
    async delete(key) {
      if (key.startsWith(prefix)) {
        const now = Date.now();
        const prev = state.get(key);
        if (prev && now >= prev.visibleAt) visible.set(key, { raw: null, meta: null });
        state.delete(key);
      }
      return kv.delete(key);
    },
    async list(opts = {}) { return kv.list(opts); },
    _store: kv._store,   // 绕过滞后直接看最终落盘内容（测试断言用）
  };
}

async function makeAuthedEnv(lag = false) {
  const env = createEnv();
  if (lag) env.STATS = kvWithManifestLag(env.STATS);
  await createTestUser(env, 'alice', 'pass', { canUpload: true, canDelete: true });
  const token = await createToken({ type: 'user', username: 'alice' }, 3600_000, env.TOKEN_SECRET);
  return { env, token };
}

describe('repairUserManifest 用单图索引回补清单', () => {
  let env;
  beforeEach(() => { env = createEnv(); });

  test('清单缺条目时按单图索引补齐，且保留原有条目', async () => {
    await env.STATS.put('userimgs:alice', JSON.stringify([
      { key: 'a.png', size: 10, uploadedAt: 100, isPublic: false },
    ]));
    for (const [k, n, size, uploadedAt] of [['b.png','b',11,110],['c.png','c',12,120]]) {
      await env.STATS.put(userImgRecordKey('alice', k), JSON.stringify({
        uploadedAt, size, isPublic: false, name: n, basename: n,
      }));
    }

    const { repaired, manifest } = await repairUserManifest(env, 'alice');
    expect(repaired).toBe(2);
    expect(manifest).toHaveLength(3);
    expect(new Set(manifest.map(e => e.key))).toEqual(new Set(['a.png','b.png','c.png']));

    const b = manifest.find(e => e.key === 'b.png');
    expect(b).toMatchObject({ size: 11, uploadedAt: 110, isPublic: false, name: 'b', basename: 'b' });
    expect(manifest.find(e => e.key === 'a.png')).toMatchObject({ size: 10 }); // 原有条目未被覆盖

    // 写回 KV，且按上传时间倒序（最新在前）
    const saved = await env.STATS.get('userimgs:alice', 'json');
    expect(saved.map(e => e.key)).toEqual(['c.png', 'b.png', 'a.png']);
  });

  test('清单完整时不写入、不逐项读取', async () => {
    await env.STATS.put('userimgs:alice', JSON.stringify([
      { key: 'a.png', size: 1, uploadedAt: 1, isPublic: false },
    ]));
    await env.STATS.put(userImgRecordKey('alice', 'a.png'), JSON.stringify({
      uploadedAt: 1, size: 1, isPublic: false,
    }));
    const before = env.STATS._store.get('userimgs:alice');
    const { repaired, manifest } = await repairUserManifest(env, 'alice');
    expect(repaired).toBe(0);
    expect(manifest).toHaveLength(1);
    expect(env.STATS._store.get('userimgs:alice')).toBe(before); // 未写回
  });

  test('只补不删：没有单图索引的老图不会被清掉', async () => {
    await env.STATS.put('userimgs:alice', JSON.stringify([
      { key: 'legacy.png', size: 99, uploadedAt: 999, isPublic: true },
    ]));
    await env.STATS.put(userImgRecordKey('alice', 'new.png'), JSON.stringify({
      uploadedAt: 2, size: 2, isPublic: false,
    }));
    const { manifest } = await repairUserManifest(env, 'alice');
    expect(new Set(manifest.map(e => e.key))).toEqual(new Set(['legacy.png', 'new.png']));
    expect(manifest.find(e => e.key === 'legacy.png').size).toBe(99);
  });

  test('回收站中的图补回后仍带 deletedAt，不会重新出现在可见列表', async () => {
    await env.STATS.put(userImgRecordKey('alice', 't.png'), JSON.stringify({
      uploadedAt: 5, size: 5, isPublic: false, deletedAt: 42,
    }));
    const { manifest } = await repairUserManifest(env, 'alice');
    expect(manifest).toHaveLength(1);
    expect(manifest[0].deletedAt).toBe(42);
  });
});

describe('端到端：清单写入被并发全部打丢时，图库仍能看到全部图', () => {
  test('10 张并发上传 + userimgs 完全滞后 → /list 仍返回 10 张', async () => {
    const { env, token } = await makeAuthedEnv(true);
    const keys = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        trackImage(env, 'alice', `k${i}.png`, 100 + i, false, `图片 ${i}.png`).then(() => `k${i}.png`),
      ),
    );

    // 清单键在滞后窗口内读不到 → 合并写全部放弃，实际只剩最后写入者的 1 条
    // （用 _store 绕过滞后直接看落盘内容）
    const landed = JSON.parse(env.STATS._store.get('userimgs:alice') ?? 'null');
    expect(landed).toHaveLength(1);

    const res = await handleList(authedRequest('GET', 'http://localhost/list', token), env);
    expect(res.status).toBe(200);
    const { items } = await res.json();
    expect(new Set(items.map(i => i.key))).toEqual(new Set(keys));
    expect(items).toHaveLength(10);
    // 补齐的条目字段完整（不是只剩 key）
    for (const it of items) {
      expect(it.size).toBeGreaterThan(0);
      expect(it.uploadedAt).toBeGreaterThan(0);
      expect(it.name).toBeDefined();
    }
  });

  test('handleUpload 走完整链路后 /list 可见（原始 bug 复现）', async () => {
    const { env, token } = await makeAuthedEnv(true);
    const reqs = Array.from({ length: 6 }, (_, i) =>
      new Request('http://localhost/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'image/png',
          'Content-Length': String(200 + i),
        },
        body: new Uint8Array(200 + i).fill(1).buffer,
      }),
    );
    const results = await Promise.all(reqs.map(r => handleUpload(r, env, NOOP_CTX)));
    // 上传一律显示成功（数据已持久化在单图索引里）
    for (const r of results) expect(r.status).toBe(201);

    const { items } = await (await handleList(authedRequest('GET', 'http://localhost/list', token), env)).json();
    expect(items).toHaveLength(6);
    // imgmeta 每张都在（公共图库判定来源）
    for (const it of items) {
      const md = (await env.STATS.getWithMetadata('imgmeta:' + it.key)).metadata;
      expect(md.owner).toBe('alice');
    }
  });
});

describe('公开状态：上传时一次写入，不再靠二次 PATCH', () => {
  test('makePublic 字段：一次请求落定 isPublic，清单/索引/imgmeta 一致', async () => {
    const { env, token } = await makeAuthedEnv();
    const fd = new FormData();
    fd.append('file', new File([new Uint8Array(512).buffer], '封面.png', { type: 'image/png' }));
    fd.append('makePublic', '1');
    const res = await handleUpload(new Request('http://localhost/upload', {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
    }), env, NOOP_CTX);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect((await env.STATS.getWithMetadata('imgmeta:' + body.key)).metadata.isPublic).toBe(true);
    expect((await env.STATS.get(userImgRecordKey('alice', body.key), 'json')).isPublic).toBe(true);
    expect((await env.STATS.get('userimgs:alice', 'json')).find(e => e.key === body.key).isPublic).toBe(true);
    // 单图记录不带 metadata：KV list 的 metadata 有总量上限，
    // 上千张图库会因 metadata 撑爆而被迫多页、多花子请求
    expect((await env.STATS.getWithMetadata(userImgRecordKey('alice', body.key))).metadata).toBeNull();
  });

  test('不传 makePublic 时默认私密', async () => {
    const { env, token } = await makeAuthedEnv();
    const res = await handleUpload(
      new Request('http://localhost/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'image/png',
          'Content-Length': '256',
        },
        body: new Uint8Array(256).fill(1).buffer,
      }),
      env, NOOP_CTX,
    );
    const body = await res.json();
    expect((await env.STATS.getWithMetadata('imgmeta:' + body.key)).metadata.isPublic).toBe(false);
  });

  test('切换可见性同步更新单图索引', async () => {
    const { env, token } = await makeAuthedEnv();
    await createTestImage(env, 'a.png', 'alice');
    await env.STATS.put(userImgRecordKey('alice', 'a.png'), JSON.stringify({
      uploadedAt: 1, size: 512, isPublic: true,
    }));
    const res = await handleToggleVisibility(authedRequest('PATCH', 'http://localhost/x', token), env, 'a.png');
    expect(res.status).toBe(200);
    expect((await env.STATS.get(userImgRecordKey('alice', 'a.png'), 'json')).isPublic).toBe(false);
  });
});

describe('删除路径同步单图索引', () => {
  let env, token;
  beforeEach(async () => { ({ env, token } = await makeAuthedEnv()); });

  test('彻底删除同时移除 imgmeta 与 userimg 记录', async () => {
    await createTestImage(env, 'gone.png', 'alice');
    await env.STATS.put(userImgRecordKey('alice', 'gone.png'), JSON.stringify({
      uploadedAt: 1, size: 512, isPublic: true,
    }));
    await purgeImage(env, 'gone.png', 'alice');
    expect(await env.STATS.get('imgmeta:gone.png')).toBeNull();
    expect(await env.STATS.get(userImgRecordKey('alice', 'gone.png'))).toBeNull();
    await expect(listUserImgRecordKeys(env, 'alice')).resolves.toEqual([]);
  });

  test('软删除把 deletedAt 写进单图索引，回收站列表仍可见', async () => {
    await createTestImage(env, 't.png', 'alice');
    await env.STATS.put(userImgRecordKey('alice', 't.png'), JSON.stringify({
      uploadedAt: 1, size: 512, isPublic: true,
    }));
    await handleDelete(authedRequest('DELETE', 'http://localhost/api/image/t.png', token), env, 't.png', NOOP_CTX);
    const rec = await env.STATS.get(userImgRecordKey('alice', 't.png'), 'json');
    expect(rec.deletedAt).toBeGreaterThan(0);
    // 清单项也带标
    expect((await env.STATS.get('userimgs:alice', 'json')).find(e => e.key === 't.png').deletedAt).toBeGreaterThan(0);
  });

  test('deleteImageRecords 幂等（重复调用不报错）', async () => {
    await deleteImageRecords(env, 'x.png', 'alice');
    await deleteImageRecords(env, 'x.png', 'alice');
    await deleteImageRecords(env, 'x.png', null);
  });
});

describe('mergeUserImgEntry 的返回语义不变', () => {
  test('tries 用尽返回 false，调用方据此走自愈而非报错', async () => {
    const env = createEnv();
    await env.STATS.put('userimgs:bob', JSON.stringify([]));
    const env2 = { STATS: kvWithManifestLag(env.STATS, 'userimgs:', 999_999) };
    // tries: 2 让重试预算快速耗尽（被测的是返回值语义，不是重试次数）
    const ok = await mergeUserImgEntry(env2, 'bob', 'z.png', { size: 1, uploadedAt: 1, isPublic: false }, { ensure: true, tries: 2 });
    expect(ok).toBe(false);
  });
});
