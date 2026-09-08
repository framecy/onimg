import { describe, test, expect, beforeEach } from 'vitest';
import { trackImage, handleUpload } from '../../src/upload.js';
import { handleToggleVisibility } from '../../src/list.js';
import { mergeUserImgEntry } from '../../src/imglist.js';
import { createToken } from '../../src/admin/auth.js';
import { createEnv, createTestImage, authedRequest, createTestUser } from '../helpers/mock-env.js';

// ── 回归背景 ──────────────────────────────────────────────────────────────────
// userimgs:{username} 是单个 KV JSON 数组，此前 6 处裸「读→改→写」。
// 浏览器端上传改并发后，并发写入互相覆盖（last-writer-wins）：
// 传 4 张只显示 3 张、上传时勾选公开被回写覆盖（表现为无效）。
// 以下测试断言并发更新后所有 patch 都收敛生效。

describe('userimgs concurrent merge (mergeUserImgEntry)', () => {
  let env;
  beforeEach(() => { env = createEnv(); });

  test('4 concurrent adds all land in the list (repro of "传4张只显示3张")', async () => {
    await Promise.all(
      Array.from({ length: 4 }, (_, i) =>
        trackImage(env, 'alice', `k${i}.png`, 100 + i, false),
      ),
    );
    const list = await env.STATS.get('userimgs:alice', 'json');
    expect(list).toHaveLength(4);
    expect(new Set(list.map(e => e.key))).toEqual(new Set(['k0.png', 'k1.png', 'k2.png', 'k3.png']));
    // 所有条目字段完整
    for (const e of list) {
      expect(e.size).toBeGreaterThan(0);
      expect(e.uploadedAt).toBeGreaterThan(0);
      expect(e.isPublic).toBe(false);
    }
  });

  test('20 concurrent adds all land', async () => {
    await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        trackImage(env, 'bob', `f${i}.jpg`, i, false),
      ),
    );
    const list = await env.STATS.get('userimgs:bob', 'json');
    expect(list).toHaveLength(20);
    expect(new Set(list.map(e => e.key)).size).toBe(20);
  });

  test('concurrent visibility toggles on 4 keys all apply (repro of 公开无效)', async () => {
    const env2 = env;
    await createTestUser(env2, 'alice', 'pass', { canUpload: true });
    const token = await createToken({ type: 'user', username: 'alice' }, 3600_000, env2.TOKEN_SECRET);
    // 种 4 张「默认私密」的图（与真实上传一致：上传后 isPublic=false，再切换为公开）
    for (const k of ['a', 'b', 'c', 'd']) {
      const prev = await env2.STATS.get('userimgs:alice', 'json') ?? [];
      await Promise.all([
        env2.STATS.put('imgmeta:' + k, JSON.stringify({ uploadedAt: 1 }), { metadata: { isPublic: false, owner: 'alice' } }),
        env2.STATS.put('userimgs:alice', JSON.stringify([
          { key: k, size: 512, uploadedAt: 1, isPublic: false }, ...prev,
        ])),
      ]);
    }
    await Promise.all(
      ['a', 'b', 'c', 'd'].map(async k => {
        const res = await handleToggleVisibility(
          authedRequest('PATCH', 'http://localhost/x', token), env2, k,
        );
        expect(res.status).toBe(200);
      }),
    );
    const list = await env2.STATS.get('userimgs:alice', 'json');
    for (const k of ['a', 'b', 'c', 'd']) {
      expect(list.find(e => e.key === k)?.isPublic).toBe(true);
    }
    // imgmeta（公共图库的判定来源）同样全为公开
    for (const k of ['a', 'b', 'c', 'd']) {
      const md = (await env.STATS.getWithMetadata('imgmeta:' + k)).metadata;
      expect(md.isPublic).toBe(true);
    }
  });

  test('merge with null patch value removes the field (restore path)', async () => {
    await trackImage(env, 'alice', 'x.png', 10, false);
    await mergeUserImgEntry(env, 'alice', 'x.png', { deletedAt: 12345 });
    let list = await env.STATS.get('userimgs:alice', 'json');
    expect(list[0].deletedAt).toBe(12345);
    await mergeUserImgEntry(env, 'alice', 'x.png', { deletedAt: null });
    list = await env.STATS.get('userimgs:alice', 'json');
    expect(list[0].deletedAt).toBeUndefined();
    expect(list[0].size).toBe(10); // 其余字段保留
  });

  test('remove option deletes the entry (purge path)', async () => {
    await trackImage(env, 'alice', 'gone.png', 10, false);
    await mergeUserImgEntry(env, 'alice', 'gone.png', {}, { remove: true });
    const list = await env.STATS.get('userimgs:alice', 'json');
    expect(list.find(e => e.key === 'gone.png')).toBeUndefined();
  });

  test('dedupes pre-existing duplicate entries', async () => {
    // 模拟历史竞态产生的重复条目
    await env.STATS.put('userimgs:alice', JSON.stringify([
      { key: 'dup.png', size: 1, uploadedAt: 1, isPublic: false },
      { key: 'dup.png', size: 1, uploadedAt: 1, isPublic: true },
      { key: 'ok.png', size: 2, uploadedAt: 2, isPublic: false },
    ]));
    await mergeUserImgEntry(env, 'alice', 'dup.png', { isPublic: false });
    const list = await env.STATS.get('userimgs:alice', 'json');
    expect(list.filter(e => e.key === 'dup.png')).toHaveLength(1);
    expect(list).toHaveLength(2);
    expect(list.find(e => e.key === 'ok.png')).toBeTruthy();
  });

  test('non-ensure merge on missing entry is a no-op (old behavior kept)', async () => {
    await mergeUserImgEntry(env, 'alice', 'ghost.png', { isPublic: true });
    const list = await env.STATS.get('userimgs:alice', 'json') ?? [];
    expect(list).toHaveLength(0);
  });
});

// ── 端到端：并发走完整 handleUpload ──────────────────────────────────────────

describe('concurrent handleUpload keeps the full list', () => {
  test('4 concurrent raw uploads all tracked', async () => {
    const env = createEnv();
    await createTestUser(env, 'alice', 'pass', { canUpload: true });
    const token = await createToken({ type: 'user', username: 'alice' }, 3600_000, env.TOKEN_SECRET);

    const reqs = Array.from({ length: 4 }, (_, i) =>
      new Request('http://localhost/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'image/png',
          'Content-Length': String(256 + i),
        },
        body: new Uint8Array(256 + i).fill(7).buffer,
      }),
    );
    const results = await Promise.all(reqs.map(r => handleUpload(r, env, { waitUntil: () => {} })));
    for (const r of results) expect(r.status).toBe(201);

    const list = await env.STATS.get('userimgs:alice', 'json');
    expect(list).toHaveLength(4);
    expect(new Set(list.map(e => e.key)).size).toBe(4);
    // imgmeta 每张都在（公共图库判定来源）
    for (const e of list) {
      const md = (await env.STATS.getWithMetadata('imgmeta:' + e.key)).metadata;
      expect(md?.owner).toBe('alice');
    }
  });
});
