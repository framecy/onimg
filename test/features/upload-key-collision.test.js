import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { handleUpload } from '../../src/upload.js';
import { handleList } from '../../src/list.js';
import { userImgRecordKey } from '../../src/imglist.js';
import { createToken } from '../../src/admin/auth.js';
import { createEnv, createUploadRequest, createTestUser } from '../helpers/mock-env.js';

// 批量上传（20 张并发）时出现「重复图 / 缺图」的回归用例。
//
// 根因：key = `Date.now()-randomId().ext`，randomId 是 6 字节 = 48 位随机。
// 同一毫秒内并发上传 N 张，按生日悖论碰撞概率约 N²/2^49；再加上多用户、
// 多标签页同时上传，并且随机源在 isolate 复用时可能被复用 —— 一旦两个请求
// 拿到同一个 key，后写者覆盖前写者的 R2 对象和索引，表现为：
//   · 两张不同的图返回同一个 URL（重复图）
//   · 前一张图的内容被后一张覆盖（错图 / 缺图）
describe('批量上传：key 必须唯一', () => {
  let env;
  beforeEach(() => { env = createEnv(); });
  afterEach(() => { vi.restoreAllMocks(); });

  test('60 张并发的 jpeg 上传，key 全不重复', async () => {
    await createTestUser(env, 'bulk', 'pass');
    const token = await createToken({ type: 'user', username: 'bulk' }, 3600_000, env.TOKEN_SECRET);
    const N = 60;
    const results = await Promise.all(
      Array.from({ length: N }, () => handleUpload(createUploadRequest(token), env)),
    );
    const bodies = await Promise.all(results.map(r => r.json()));
    const keys = bodies.map(b => b.key);
    expect(new Set(keys).size).toBe(N);
    // 每张图都在 R2 里真实存在
    for (const k of keys) expect(await env.BUCKET.head(k)).toBeTruthy();
  });

  test('不同用户并发上传同样不会撞 key', async () => {
    await createTestUser(env, 'u1', 'pass');
    await createTestUser(env, 'u2', 'pass');
    const t1 = await createToken({ type: 'user', username: 'u1' }, 3600_000, env.TOKEN_SECRET);
    const t2 = await createToken({ type: 'user', username: 'u2' }, 3600_000, env.TOKEN_SECRET);
    const reqs = [...Array.from({ length: 20 }, () => createUploadRequest(t1)),
                  ...Array.from({ length: 20 }, () => createUploadRequest(t2))];
    const bodies = await Promise.all((await Promise.all(reqs.map(r => handleUpload(r, env)))).map(r => r.json()));
    expect(new Set(bodies.map(b => b.key)).size).toBe(40);
  });

  test('同一文件名上传两次得到两个不同 key', async () => {
    await createTestUser(env, 'dup', 'pass');
    const token = await createToken({ type: 'user', username: 'dup' }, 3600_000, env.TOKEN_SECRET);
    const mk = () => new Request('http://localhost/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/png', 'X-File-Name': encodeURIComponent('same.png') },
      body: new Uint8Array(16).fill(7).buffer,
    });
    const [a, b] = await Promise.all([handleUpload(mk(), env), handleUpload(mk(), env)]);
    const [ja, jb] = await Promise.all([a.json(), b.json()]);
    expect(ja.key).not.toBe(jb.key);
    expect(ja.basename).toBe('same.png');
    expect(jb.basename).toBe('same.png');
  });
});

// ── 清单体积上限（批量上传「图片缺失」的第二个根因）────────────────────────────
//
// userimgs:{owner} 是单个 KV 值，KV / D1 的单值上限 25 MB。此前清单把
// name / basename / tags 全都复制一份（每张约 100 字节），图库到约一万张时
// 清单就写不进去：之后每张新图都返回 201，却永远不进「我的图库」——
// 用户看到的就是「一批一批地缺图」。
describe('清单体积与图库大小解耦', () => {
  test('上传只写最小种子字段，清单每张图约 100 字节', async () => {
    const env = createEnv();
    await createTestUser(env, 'alice', 'pass');
    const token = await createToken({ type: 'user', username: 'alice' }, 3600_000, env.TOKEN_SECRET);
    const longName = '一份特别特别长的中文文件名截图-2026-01-01-最终版-FINAL.png';
    for (let i = 0; i < 5; i++) {
      await handleUpload(new Request('http://localhost/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/png', 'X-File-Name': encodeURIComponent(longName) },
        body: new Uint8Array(16).fill(i).buffer,
      }), env);
    }
    const raw = await env.STATS.get('userimgs:alice');
    const entries = JSON.parse(raw);
    expect(entries).toHaveLength(5);
    // 每张图在清单里只占 { key,size,uploadedAt,isPublic } 这一份
    for (const e of entries) {
      expect(Object.keys(e).sort()).toEqual(['isPublic', 'key', 'size', 'uploadedAt']);
    }
    // 约 100 字节/张，而不是再复制一份名字后的 ~200 字节/张
    expect(raw.length / entries.length).toBeLessThan(120);
    // 名字仍然能被 /list 拿到（来自单图记录）
    const token2 = token;
    const items = (await (await handleList(new Request('http://localhost/list', {
      headers: { Authorization: `Bearer ${token2}` },
    }), env)).json()).items;
    expect(items).toHaveLength(5);
    for (const it of items) expect(it.name).toBe(longName);
  });

  test('老清单里的胖条目会被 /list 自动瘦身，name 依然可见', async () => {
    const env = createEnv();
    await createTestUser(env, 'bob', 'pass');
    const token = await createToken({ type: 'user', username: 'bob' }, 3600_000, env.TOKEN_SECRET);
    // 模拟升级前写下的「胖条目」
    await env.STATS.put('userimgs:bob', JSON.stringify([
      { key: 'old.png', size: 10, uploadedAt: 5, isPublic: false, name: '旧截图.png', basename: '旧截图.png', tags: ['x'] },
    ]));
    await env.STATS.put(userImgRecordKey('bob', 'old.png'), JSON.stringify({
      uploadedAt: 5, size: 10, isPublic: false, name: '旧截图.png', basename: '旧截图.png', tags: ['x'],
    }));
    const items = (await (await handleList(new Request('http://localhost/list', {
      headers: { Authorization: `Bearer ${token}` },
    }), env)).json()).items;
    expect(items).toHaveLength(1);
    expect(items[0].basename).toBe('旧截图.png');
    expect(items[0].tags).toEqual(['x']);
    // 回写后的清单已经瘦身（丢掉 name / basename / tags）
    const saved = JSON.parse(await env.STATS.get('userimgs:bob'));
    expect(Object.keys(saved[0]).sort()).toEqual(['isPublic', 'key', 'size', 'uploadedAt']);
  });
});

// 回归：/list 的补全名额必须覆盖中等规模图库。
// 曾经把名额设成 40，导致 100 张图时第 41 张以后全部丢文件名。
describe('/list 补全名额', () => {
  test('100 张图全部带回文件名（不再有第 41 张后丢名的问题）', async () => {
    const env = createEnv();
    await createTestUser(env, 'many', 'pass');
    const token = await createToken({ type: 'user', username: 'many' }, 3600_000, env.TOKEN_SECRET);
    for (let i = 0; i < 100; i++) {
      await handleUpload(new Request('http://localhost/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'image/png',
          'X-File-Name': encodeURIComponent(`截图-${i}.png`),
        },
        body: new Uint8Array(8).buffer,
      }), env);
    }
    const { items } = await (await handleList(new Request('http://localhost/list', {
      headers: { Authorization: `Bearer ${token}` },
    }), env)).json();
    expect(items).toHaveLength(100);
    expect(items.filter(i => !i.basename)).toHaveLength(0);
    // 条目本身也一个不少（补全名额不足时也不能丢图）
    expect(new Set(items.map(i => i.key)).size).toBe(100);
  });
});
