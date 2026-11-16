// 管理端图库「最新上传 / 最早上传」排序回归（2026-11-06）
//
// Bug：默认视图（不带搜索/筛选、sort=uploaded）走 R2 list，而 R2 只按
// key 词序返回 —— 「最新上传」实际显示的是词序最靠前（≈最老）的一批图，
// 新上传的图反而不在第一页；order 参数被完全忽略，「最早上传」与
// 「最新上传」返回同一份列表。
//
// 为什么旧测试没抓到：mock-env.js 的内存 R2 list() 既不按词序排、也不翻页
// （一次返回全部、truncated 恒为 false），恰好掩盖了真实 R2 的行为。
// 这个文件里的 realOrderR2() 给内存 R2 补上真实语义（词序 + limit + cursor），
// 把这个坑钉死。
import { describe, test, expect, beforeEach } from 'vitest';
import { createEnv, authedRequest, createTestUser, createD1 } from '../helpers/mock-env.js';
import { createD1Kv } from '../../src/kv-d1.js';
import { createToken } from '../../src/admin/auth.js';
import { handleList } from '../../src/list.js';
import { handleDelete } from '../../src/delete.js';

/** 给内存 R2 补上真实语义：key 词序 + limit 翻页 + truncated/cursor */
function realOrderR2(bucket) {
  bucket.list = async (opts = {}) => {
    const { limit = 1000, cursor, prefix = '' } = opts;
    const keys = [...bucket._store.values()]
      .map(o => o.key)
      .filter(k => k.startsWith(prefix))
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const start = cursor ? Number(cursor) : 0;
    const page = keys.slice(start, start + limit).map(k => bucket._store.get(k));
    const truncated = start + page.length < keys.length;
    return { objects: page, truncated, cursor: truncated ? String(start + page.length) : undefined };
  };
  return bucket;
}

async function base() {
  const env = createEnv({ DB: createD1() });
  env.STATS = createD1Kv(env.DB);
  realOrderR2(env.BUCKET);
  await createTestUser(env, 'alice', 'pass', { canUpload: true });
  const adminToken = await createToken({ type: 'admin', username: 'admin' }, 3600_000, env.TOKEN_SECRET);
  return { env, adminToken };
}

/** 写一条带上传时间的图片（imgmeta + R2 对象），便于精确构造时间序 vs 词序不一致的场景 */
async function seedImage(env, { key, owner = 'alice', size = 1024, uploadedAt, isPublic = true }) {
  await env.BUCKET.put(key, new Uint8Array(size).buffer, {});
  await env.STATS.put('imgmeta:' + key, JSON.stringify({
    uploadedAt, size, name: 'n-' + key, basename: key,
  }), { metadata: { owner, isPublic } });
}

const adminList = async (env, token, qs = '') =>
  (await (await handleList(authedRequest('GET', `http://x/list${qs}`, token), env)).json());

describe('管理端 /list 默认视图按上传时间排序（不是 R2 词序）', () => {
  let env, adminToken;
  beforeEach(async () => { ({ env, adminToken } = await base()); });

  test('「最新上传」全局倒序，且分页不重不漏', async () => {
    // 词序 a<b<c<d；上传时间序 b<d<a<c —— 故意让两套顺序互相错开
    await seedImage(env, { key: 'b.png', uploadedAt: 1000 });
    await seedImage(env, { key: 'd.png', uploadedAt: 2000 });
    await seedImage(env, { key: 'a.png', uploadedAt: 3000 });
    await seedImage(env, { key: 'c.png', uploadedAt: 4000 });

    const page1 = await adminList(env, adminToken, '?limit=2');
    expect(page1.items.map(i => i.key)).toEqual(['c.png', 'a.png']); // 时间倒序，不是词序 a,b
    expect(page1.total).toBe(4);
    expect(page1.nextOffset).toBe(2);

    const page2 = await adminList(env, adminToken, '?limit=2&offset=2');
    expect(page2.items.map(i => i.key)).toEqual(['d.png', 'b.png']);
    expect(page2.nextOffset).toBe(null);
  });

  test('「最早上传」（order=asc）是时间正序，与「最新上传」不同', async () => {
    await seedImage(env, { key: 'b.png', uploadedAt: 1000 });
    await seedImage(env, { key: 'd.png', uploadedAt: 2000 });
    await seedImage(env, { key: 'a.png', uploadedAt: 3000 });
    await seedImage(env, { key: 'c.png', uploadedAt: 4000 });

    const d = await adminList(env, adminToken, '?sort=uploaded&order=asc&limit=2');
    expect(d.items.map(i => i.key)).toEqual(['b.png', 'd.png']);
  });

  test('未索引的裸对象仍在默认图库里，按 R2 uploaded 参与排序', async () => {
    await seedImage(env, { key: 'a.png', uploadedAt: 3000 });
    await env.BUCKET.put('zzz-bare.png', new Uint8Array(64).buffer, {});
    env.BUCKET._store.get('zzz-bare.png').uploaded = new Date(9000); // 比 a.png 新

    const d = await adminList(env, adminToken, '?limit=10');
    expect(d.items[0].key).toBe('zzz-bare.png');
    expect(d.items[0].indexed).toBe(false);
    expect(d.items.map(i => i.key)).toContain('a.png');
    expect(d.total).toBe(2);
  });

  test('软删除（回收站）的图不出现在默认视图', async () => {
    await seedImage(env, { key: 'keep.png', uploadedAt: 2000 });
    await seedImage(env, { key: 'gone.png', uploadedAt: 1000 });
    await handleDelete(authedRequest('DELETE', 'http://x/delete/gone.png', adminToken), env, 'gone.png');

    const d = await adminList(env, adminToken, '?limit=10');
    expect(d.items.map(i => i.key)).toEqual(['keep.png']);
    expect(d.total).toBe(1);
  });

  test('proto/ 与 manifests/ 前缀对象不出现在默认图库', async () => {
    await seedImage(env, { key: 'ok.png', uploadedAt: 1000 });
    await env.BUCKET.put('proto/x.zip', new Uint8Array(16).buffer, {});
    await env.BUCKET.put('manifests/m.json', new Uint8Array(16).buffer, {});

    const d = await adminList(env, adminToken, '?limit=10');
    expect(d.items.map(i => i.key)).toEqual(['ok.png']);
  });
});
