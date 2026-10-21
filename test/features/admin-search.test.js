// 管理端图库的搜索 / 筛选 / 排序，以及回收站按用户分级。
//
// 背景：后台图库原本只有 R2 列表，原始文件名和标签存在 imgmeta 的 value 里，
// 所以后台只能按 key 搜；用户端却能按文件名 / 标签 / 可见性筛 —— 同一个后台
// 面板里两套能力。这一版把索引读出来（src/admin/image-index.js）统一处理。
//
// 这里守住三件事：
//   1. /list 管理端分支带出 name / tags / views，且搜索覆盖 key、文件名、标签、归属用户
//   2. 排序是**全局**的（不是只排当前页），分页 offset 与 total 对得上
//   3. /api/trash 管理端能看到所有用户、带图片原名；普通用户仍只看自己的
import { describe, test, expect, beforeEach } from 'vitest';
import {
  createEnv, createRequest, authedRequest, createTestUser, createD1,
} from '../helpers/mock-env.js';
import { createD1Kv } from '../../src/kv-d1.js';
import { createToken } from '../../src/admin/auth.js';
import { handleList } from '../../src/list.js';
import { handleTrashList, handleTrashRestore } from '../../src/trash.js';
import { handleDelete } from '../../src/delete.js';

async function base() {
  const env = createEnv({ DB: createD1() });
  env.STATS = createD1Kv(env.DB);
  await createTestUser(env, 'alice', 'pass', { canUpload: true, canDelete: true });
  await createTestUser(env, 'bob', 'pass', { canUpload: true, canDelete: true });
  const adminToken = await createToken({ type: 'admin', username: 'admin' }, 3600_000, env.TOKEN_SECRET);
  const aliceToken = await createToken({ type: 'user', username: 'alice' }, 3600_000, env.TOKEN_SECRET);
  return { env, adminToken, aliceToken };
}

/** 直接写一条带名字/标签的图片索引（绕开上传，便于精确构造搜索场景） */
async function seedImage(env, { key, name, tags = [], owner = 'alice', size = 1024, views = 0, isPublic = true }) {
  await env.BUCKET.put(key, new Uint8Array(size).buffer, {});
  await env.STATS.put('imgmeta:' + key, JSON.stringify({
    uploadedAt: Date.now(), size, name, basename: name,
  }), { metadata: { owner, isPublic } });
  if (tags.length) {
    const v = JSON.parse(await env.STATS.get('imgmeta:' + key) || '{}');
    await env.STATS.put('imgmeta:' + key, JSON.stringify({ ...v, tags }), { metadata: { owner, isPublic } });
  }
  await env.STATS.put('stats:' + key, JSON.stringify({ count: views }), { metadata: { count: views } });
}

const adminList = async (env, token, qs = '') =>
  (await (await handleList(authedRequest('GET', `http://x/list${qs}`, token), env)).json());

describe('管理端 /list：索引字段', () => {
  let env, adminToken, aliceToken;
  beforeEach(async () => { ({ env, adminToken, aliceToken } = await base()); });

  test('默认列表带出 name / tags / views / uploadedAt', async () => {
    await seedImage(env, { key: 'k1.jpg', name: '封面图.png', tags: ['设计', '首页'], views: 42 });
    const d = await adminList(env, adminToken);
    const it = d.items.find(i => i.key === 'k1.jpg');
    expect(it.name).toBe('封面图.png');
    expect(it.tags).toEqual(['设计', '首页']);
    expect(it.views).toBe(42);
    expect(typeof it.uploadedAt).toBe('number');
    expect(d.source).toBe('d1');
  });

  test('搜索文件名（子串、大小写不敏感）', async () => {
    await seedImage(env, { key: 'a1.jpg', name: 'Logo-Dark.png' });
    await seedImage(env, { key: 'a2.jpg', name: '封面.jpg' });
    const d = await adminList(env, adminToken, '?q=logo');
    expect(d.items.map(i => i.key)).toEqual(['a1.jpg']);
    expect(d.total).toBe(1);
  });

  test('搜索标签', async () => {
    await seedImage(env, { key: 'b1.jpg', name: 'x1.png', tags: ['活动', '2026'] });
    await seedImage(env, { key: 'b2.jpg', name: 'x2.png', tags: ['产品'] });
    const d = await adminList(env, adminToken, '?q=2026');
    expect(d.items.map(i => i.key)).toEqual(['b1.jpg']);
  });

  test('搜索归属用户', async () => {
    await seedImage(env, { key: 'c1.jpg', owner: 'alice' });
    await seedImage(env, { key: 'c2.jpg', owner: 'bob' });
    const d = await adminList(env, adminToken, '?q=bob');
    expect(d.items.map(i => i.key)).toEqual(['c2.jpg']);
  });

  test('按用户精确筛选 + 按标签筛选', async () => {
    await seedImage(env, { key: 'd1.jpg', owner: 'alice', tags: ['海报'] });
    await seedImage(env, { key: 'd2.jpg', owner: 'bob', tags: ['海报'] });
    const byOwner = await adminList(env, adminToken, '?owner=bob');
    expect(byOwner.items.map(i => i.key)).toEqual(['d2.jpg']);
    const byTag = await adminList(env, adminToken, '?tag=海报');
    expect(byTag.items.map(i => i.key).sort()).toEqual(['d1.jpg', 'd2.jpg']);
  });

  test('排序是全局的：按大小倒序 + 分页 offset', async () => {
    await seedImage(env, { key: 's1.jpg', size: 100 });
    await seedImage(env, { key: 's2.jpg', size: 300 });
    await seedImage(env, { key: 's3.jpg', size: 200 });

    const page1 = await adminList(env, adminToken, '?sort=size&order=desc&limit=2');
    expect(page1.items.map(i => i.key)).toEqual(['s2.jpg', 's3.jpg']);
    expect(page1.total).toBe(3);
    expect(page1.nextOffset).toBe(2);

    const page2 = await adminList(env, adminToken, '?sort=size&order=desc&limit=2&offset=2');
    expect(page2.items.map(i => i.key)).toEqual(['s1.jpg']);
    expect(page2.nextOffset).toBe(null);
  });

  test('按名称排序', async () => {
    await seedImage(env, { key: 'n1.jpg', name: 'b.png' });
    await seedImage(env, { key: 'n2.jpg', name: 'a.png' });
    const d = await adminList(env, adminToken, '?sort=name&order=asc');
    expect(d.items.map(i => i.name)).toEqual(['a.png', 'b.png']);
  });

  test('软删除的图不出现在搜索结果里', async () => {
    await seedImage(env, { key: 'gone.jpg', name: 'gone.png' });
    await handleDelete(authedRequest('DELETE', 'http://x/delete/gone.jpg', adminToken), env, 'gone.jpg');
    const d = await adminList(env, adminToken, '?q=gone');
    expect(d.items).toHaveLength(0);
  });

  test('用户端 /list 不认这些参数，仍只返回自己的图', async () => {
    await seedImage(env, { key: 'u1.jpg', owner: 'alice' });
    await seedImage(env, { key: 'u2.jpg', owner: 'bob' });
    const res = await handleList(
      authedRequest('GET', 'http://x/list?q=bob&sort=size', aliceToken), env,
    );
    const d = await res.json();
    expect(d.items.every(i => i.owner === 'alice')).toBe(true);
  });
});

describe('/api/trash：管理端按用户分级', () => {
  let env, adminToken, aliceToken;
  beforeEach(async () => { ({ env, adminToken, aliceToken } = await base()); });

  test('管理员能看到所有用户的回收站内容，并带图片原名', async () => {
    await seedImage(env, { key: 't1.jpg', name: '被删的封面.png', owner: 'alice' });
    await seedImage(env, { key: 't2.jpg', name: 'bob 的图.png', owner: 'bob' });
    await handleDelete(authedRequest('DELETE', 'http://x/delete/t1.jpg', adminToken), env, 't1.jpg');
    await handleDelete(authedRequest('DELETE', 'http://x/delete/t2.jpg', adminToken), env, 't2.jpg');

    const d = await (await handleTrashList(authedRequest('GET', 'http://x/api/trash', adminToken), env)).json();
    expect(d.images.map(i => i.key).sort()).toEqual(['t1.jpg', 't2.jpg']);
    expect(d.images.map(i => i.owner).sort()).toEqual(['alice', 'bob']);
    expect(d.images.find(i => i.key === 't1.jpg').name).toBe('被删的封面.png');
  });

  test('普通用户的回收站只含自己的图', async () => {
    await seedImage(env, { key: 'x1.jpg', owner: 'alice' });
    await seedImage(env, { key: 'x2.jpg', owner: 'bob' });
    await handleDelete(authedRequest('DELETE', 'http://x/delete/x1.jpg', aliceToken), env, 'x1.jpg');
    await handleDelete(authedRequest('DELETE', 'http://x/delete/x2.jpg', adminToken), env, 'x2.jpg');

    const d = await (await handleTrashList(authedRequest('GET', 'http://x/api/trash', aliceToken), env)).json();
    expect(d.images.map(i => i.key)).toEqual(['x1.jpg']);
  });

  test('管理员可以恢复任意用户的图', async () => {
    await seedImage(env, { key: 'r1.jpg', owner: 'bob' });
    await handleDelete(authedRequest('DELETE', 'http://x/delete/r1.jpg', adminToken), env, 'r1.jpg');

    const res = await handleTrashRestore(
      authedRequest('POST', 'http://x/api/trash/restore', adminToken, { body: { type: 'image', key: 'r1.jpg' } }),
      env, { waitUntil() {} },
    );
    expect(res.status).toBe(200);
    const d = await adminList(env, adminToken, '?q=r1');
    expect(d.items.map(i => i.key)).toEqual(['r1.jpg']);
  });
});
