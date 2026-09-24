// 管理端功能补齐的回归测试。
//
// 覆盖这次修复的四类问题：
//   1. 上传勾选公开后，公开图库能看到刚传的图（清单刷新 + 公开状态写入）
//   2. 单张删除必须检查后端响应（此前不检查，失败也报「已删除」）
//   3. 管理端 /list 要带出 isPublic/owner/indexed（此前只回 R2 原生字段，
//      导致后台看不到图片是公开还是私密）
//   4. 单图元数据接口 /api/image/{key}/meta（管理端标签编辑的前置读取）
import { describe, test, expect, beforeEach } from 'vitest';
import {
  createEnv, createRequest, authedRequest, createUploadRequest,
  createTestUser, createTestImage, createD1, createKV, createR2,
} from '../helpers/mock-env.js';
import { createToken, verifyAdminToken } from '../../src/admin/auth.js';
import { handleList, handleGetImageMeta, handleToggleVisibility, handleSetImageTags, handlePublicGallery } from '../../src/list.js';
import { handleDelete } from '../../src/delete.js';
import { handleUpload } from '../../src/upload.js';

async function adminEnv() {
  const env = createEnv();
  await createTestUser(env, 'alice', 'pass', { canUpload: true, canDelete: true });
  const adminToken = await createToken({ type: 'admin', username: 'admin' }, 3600_000, env.TOKEN_SECRET);
  const userToken = await createToken({ type: 'user', username: 'alice' }, 3600_000, env.TOKEN_SECRET);
  return { env, adminToken, userToken };
}

describe('管理端图库：/list 带出可见性等字段', () => {
  let env, adminToken, userToken;
  beforeEach(async () => { ({ env, adminToken, userToken } = await adminEnv()); });

  test('公开图在 admin 列表里 isPublic=true，私密图 false', async () => {
    await createTestImage(env, 'pub.jpg', 'alice');      // 默认 metadata.isPublic = true
    await env.BUCKET.put('priv.jpg', new Uint8Array(64).buffer, {});
    await env.STATS.put('imgmeta:priv.jpg', JSON.stringify({ size: 64 }), {
      metadata: { isPublic: false, owner: 'alice' },
    });

    const res = await handleList(authedRequest('GET', 'http://x/list', adminToken), env);
    const { items } = await res.json();
    const byKey = Object.fromEntries(items.map(i => [i.key, i]));

    expect(byKey['pub.jpg'].isPublic).toBe(true);
    expect(byKey['priv.jpg'].isPublic).toBe(false);
    expect(byKey['pub.jpg'].owner).toBe('alice');
    expect(byKey['pub.jpg'].indexed).toBe(true);
  });

  test('未索引的裸 R2 对象标 indexed=false 且按私密处理', async () => {
    await env.BUCKET.put('orphan.jpg', new Uint8Array(32).buffer, {});
    const res = await handleList(authedRequest('GET', 'http://x/list', adminToken), env);
    const { items } = await res.json();
    const o = items.find(i => i.key === 'orphan.jpg');
    expect(o).toBeTruthy();
    expect(o.indexed).toBe(false);
    expect(o.isPublic).toBe(false);
  });

  test('软删除的图片不出现在 admin 列表里', async () => {
    await createTestImage(env, 'gone.jpg', 'alice');
    await handleDelete(authedRequest('DELETE', 'http://x/delete/gone.jpg', adminToken), env, 'gone.jpg');
    const res = await handleList(authedRequest('GET', 'http://x/list', adminToken), env);
    const { items } = await res.json();
    expect(items.find(i => i.key === 'gone.jpg')).toBeUndefined();
  });
});

describe('单图元数据接口（管理端标签编辑的前置读取）', () => {
  let env, adminToken, userToken;
  beforeEach(async () => { ({ env, adminToken, userToken } = await adminEnv()); });

  test('管理员可读任意图，返回 isPublic / tags / owner', async () => {
    await createTestImage(env, 'a.jpg', 'alice');
    await handleSetImageTags(
      authedRequest('PATCH', 'http://x/api/image/a.jpg/tags', adminToken, { body: { tags: ['风景', '测试'] } }),
      env, 'a.jpg',
    );

    const res = await handleGetImageMeta(authedRequest('GET', 'http://x/api/image/a.jpg/meta', adminToken), env, 'a.jpg');
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.indexed).toBe(true);
    expect(d.isPublic).toBe(true);
    expect(d.owner).toBe('alice');
    expect(d.tags).toEqual(['风景', '测试']);
  });

  test('未索引的图返回 indexed=false 而不是 404（管理端据此提示）', async () => {
    const res = await handleGetImageMeta(authedRequest('GET', 'http://x/api/image/nope.jpg/meta', adminToken), env, 'nope.jpg');
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.indexed).toBe(false);
    expect(d.tags).toEqual([]);
  });

  test('普通用户不能读别人的图（403）', async () => {
    await createTestImage(env, 'other.jpg', 'bob');
    const res = await handleGetImageMeta(authedRequest('GET', 'http://x/api/image/other.jpg/meta', userToken), env, 'other.jpg');
    expect(res.status).toBe(403);
  });

  test('未登录 401', async () => {
    const res = await handleGetImageMeta(createRequest('GET', 'http://x/api/image/a.jpg/meta'), env, 'a.jpg');
    expect(res.status).toBe(401);
  });
});

describe('删除链路：失败必须能被前端识别', () => {
  let env, adminToken, userToken;
  beforeEach(async () => { ({ env, adminToken, userToken } = await adminEnv()); });

  test('删除别人的图返回 403（而非静默成功）', async () => {
    await createTestImage(env, 'bob.jpg', 'bob');
    const res = await handleDelete(authedRequest('DELETE', 'http://x/delete/bob.jpg', userToken), env, 'bob.jpg');
    expect(res.status).toBe(403);
  });

  test('重复删除返回 alreadyTrashed 标记', async () => {
    await createTestImage(env, 'dup.jpg', 'alice');
    const r1 = await handleDelete(authedRequest('DELETE', 'http://x/delete/dup.jpg', userToken), env, 'dup.jpg');
    expect(r1.status).toBe(200);
    const r2 = await handleDelete(authedRequest('DELETE', 'http://x/delete/dup.jpg', userToken), env, 'dup.jpg');
    const d2 = await r2.json();
    expect(d2.alreadyTrashed).toBe(true);
  });

  test('删除成功后该图不再出现在公开图库', async () => {
    await createTestImage(env, 'pubdel.jpg', 'alice');
    const before = await (await handlePublicGallery(env)).json();
    expect(before.items.map(i => i.key)).toContain('pubdel.jpg');

    await handleDelete(authedRequest('DELETE', 'http://x/delete/pubdel.jpg', adminToken), env, 'pubdel.jpg');

    const after = await (await handlePublicGallery(env)).json();
    expect(after.items.map(i => i.key)).not.toContain('pubdel.jpg');
  });
});

describe('上传公开：写入的公开状态要能被公开图库读到', () => {
  test('勾选公开上传后，/api/gallery 立刻包含这张图', async () => {
    const env = createEnv();
    await createTestUser(env, 'alice', 'pass', { canUpload: true });
    const token = await createToken({ type: 'user', username: 'alice' }, 3600_000, env.TOKEN_SECRET);

    const req = createUploadRequest(token, { mimeType: 'image/png', size: 512 });
    // createUploadRequest 不带 makePublic，这里手工补一个 multipart 场景
    const fd = new FormData();
    fd.append('file', new File([new Uint8Array(512)], 'pub.png', { type: 'image/png' }));
    fd.append('makePublic', '1');
    const up = new Request('http://x/upload', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
      body: fd,
    });
    const res = await handleUpload(up, env);
    expect(res.status).toBe(201);
    const { key } = await res.json();

    // 公开图库应立刻能读到（前端上传后调用 loadPublicGallery 的前提）
    const gal = await (await handlePublicGallery(env)).json();
    expect(gal.items.map(i => i.key)).toContain(key);

    // 且 metadata 上确实是公开
    const { metadata } = await env.STATS.getWithMetadata('imgmeta:' + key, 'json');
    expect(metadata.isPublic).toBe(true);
  });

  test('不勾选公开时，上传的图不进公开图库', async () => {
    const env = createEnv();
    await createTestUser(env, 'bob', 'pass', { canUpload: true });
    const token = await createToken({ type: 'user', username: 'bob' }, 3600_000, env.TOKEN_SECRET);

    const fd = new FormData();
    fd.append('file', new File([new Uint8Array(256)], 'priv.png', { type: 'image/png' }));
    const res = await handleUpload(new Request('http://x/upload', {
      method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: fd,
    }), env);
    const { key } = await res.json();

    const gal = await (await handlePublicGallery(env)).json();
    expect(gal.items.map(i => i.key)).not.toContain(key);
  });
});
