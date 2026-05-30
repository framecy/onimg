import { describe, test, expect, beforeEach } from 'vitest';
import { handleDelete } from '../../src/delete.js';
import { handleList, handleSetImageTags, handleToggleVisibility, normalizeTags, handlePublicGallery } from '../../src/list.js';
import { handleTrashList, handleTrashRestore, handleTrashPurge, purgeExpiredTrash, TRASH_RETENTION_MS } from '../../src/trash.js';
import { createToken } from '../../src/admin/auth.js';
import {
  createEnv,
  authedRequest,
  createRequest,
  createTestUser,
  createTestImage,
} from '../helpers/mock-env.js';

async function userToken(env, username) {
  return createToken({ type: 'user', username }, 3600_000, env.TOKEN_SECRET);
}

// ── Soft delete + recycle bin ─────────────────────────────────────────────────

describe('Trash: soft delete, restore, purge', () => {
  let env, token;
  beforeEach(async () => {
    env = createEnv();
    await createTestUser(env, 'alice', 'pass', { canDelete: true });
    await createTestImage(env, 'a.png', 'alice');
    token = await userToken(env, 'alice');
  });

  test('delete soft-deletes (marks deletedAt), keeps R2 object', async () => {
    const req = authedRequest('DELETE', 'http://localhost/delete/a.png', token);
    const res = await handleDelete(req, env, 'a.png');
    expect(res.status).toBe(200);
    expect((await res.json()).trashed).toBe('a.png');
    // R2 object still present
    expect(await env.BUCKET.head('a.png')).not.toBeNull();
    // imgmeta metadata has deletedAt
    const meta = await env.STATS.getWithMetadata('imgmeta:a.png', 'json');
    expect(meta.metadata.deletedAt).toBeTruthy();
  });

  test('soft-deleted image is excluded from /list', async () => {
    await handleDelete(authedRequest('DELETE', 'http://localhost/delete/a.png', token), env, 'a.png');
    const res = await handleList(authedRequest('GET', 'http://localhost/list', token), env);
    const { items } = await res.json();
    expect(items.find(i => i.key === 'a.png')).toBeUndefined();
  });

  test('soft-deleted image is excluded from public gallery', async () => {
    await handleDelete(authedRequest('DELETE', 'http://localhost/delete/a.png', token), env, 'a.png');
    const { items } = await (await handlePublicGallery(env)).json();
    expect(items.find(i => i.key === 'a.png')).toBeUndefined();
  });

  test('trash list shows the soft-deleted image', async () => {
    await handleDelete(authedRequest('DELETE', 'http://localhost/delete/a.png', token), env, 'a.png');
    const res = await handleTrashList(authedRequest('GET', 'http://localhost/api/trash', token), env);
    const { images } = await res.json();
    expect(images.map(i => i.key)).toContain('a.png');
  });

  test('restore brings image back to /list', async () => {
    await handleDelete(authedRequest('DELETE', 'http://localhost/delete/a.png', token), env, 'a.png');
    const restoreReq = authedRequest('POST', 'http://localhost/api/trash/restore', token, { body: { type: 'image', key: 'a.png' } });
    const res = await handleTrashRestore(restoreReq, env);
    expect(res.status).toBe(200);
    const { items } = await (await handleList(authedRequest('GET', 'http://localhost/list', token), env)).json();
    expect(items.find(i => i.key === 'a.png')).toBeDefined();
  });

  test('purge permanently deletes R2 object + KV index', async () => {
    await handleDelete(authedRequest('DELETE', 'http://localhost/delete/a.png', token), env, 'a.png');
    const purgeReq = authedRequest('DELETE', 'http://localhost/api/trash/purge', token, { body: { type: 'image', key: 'a.png' } });
    const res = await handleTrashPurge(purgeReq, env);
    expect(res.status).toBe(200);
    expect(await env.BUCKET.head('a.png')).toBeNull();
    expect(await env.STATS.get('imgmeta:a.png')).toBeNull();
  });

  test('another user cannot see or restore my trashed image', async () => {
    await createTestUser(env, 'bob', 'pass', { canDelete: true });
    const bobToken = await userToken(env, 'bob');
    await handleDelete(authedRequest('DELETE', 'http://localhost/delete/a.png', token), env, 'a.png');
    // bob's trash list is empty
    const { images } = await (await handleTrashList(authedRequest('GET', 'http://localhost/api/trash', bobToken), env)).json();
    expect(images.length).toBe(0);
    // bob cannot restore
    const res = await handleTrashRestore(authedRequest('POST', 'http://localhost/api/trash/restore', bobToken, { body: { type: 'image', key: 'a.png' } }), env);
    expect(res.status).toBe(403);
  });

  test('cron purges items older than retention, keeps recent', async () => {
    await createTestImage(env, 'old.png', 'alice');
    await createTestImage(env, 'recent.png', 'alice');
    // soft delete both
    await handleDelete(authedRequest('DELETE', 'http://localhost/delete/old.png', token), env, 'old.png');
    await handleDelete(authedRequest('DELETE', 'http://localhost/delete/recent.png', token), env, 'recent.png');
    // backdate "old.png" beyond retention in both metadata and userimgs
    const m = await env.STATS.getWithMetadata('imgmeta:old.png', 'json');
    const past = Date.now() - TRASH_RETENTION_MS - 86400000;
    await env.STATS.put('imgmeta:old.png', JSON.stringify({ ...(m.value ?? {}), deletedAt: past }), { metadata: { ...m.metadata, deletedAt: past } });

    const result = await purgeExpiredTrash(env);
    expect(result.imagesPurged).toBeGreaterThanOrEqual(1);
    expect(await env.BUCKET.head('old.png')).toBeNull();
    expect(await env.BUCKET.head('recent.png')).not.toBeNull(); // within retention
  });
});

// ── Tags ──────────────────────────────────────────────────────────────────────

describe('Tags: normalize + set image tags', () => {
  let env, token;
  beforeEach(async () => {
    env = createEnv();
    await createTestUser(env, 'alice', 'pass', { canDelete: true });
    await createTestImage(env, 'a.png', 'alice');
    token = await userToken(env, 'alice');
  });

  test('normalizeTags dedupes (case-insensitive), trims, caps at 10', () => {
    const out = normalizeTags(['  Foo ', 'foo', 'BAR', '', null, 'x'.repeat(40), ...Array(15).fill(0).map((_, i) => 't' + i)]);
    expect(out).toContain('Foo');
    expect(out.filter(t => t.toLowerCase() === 'foo').length).toBe(1); // dedupe
    expect(out.every(t => t.length <= 24)).toBe(true);
    expect(out.length).toBeLessThanOrEqual(10);
  });

  test('normalizeTags strips HTML/attribute-breaking chars but keeps spaces/hyphens', () => {
    const out = normalizeTags(["x'); alert(1)//", 'a"b', '<script>', 'a&b', 'front-end', 'high res', '正常标签']);
    // no quote/angle/amp/backslash survives → safe to interpolate into onclick attrs
    expect(out.every(t => !/[<>"'`\\&]/.test(t))).toBe(true);
    expect(out).toContain('front-end');
    expect(out).toContain('high res');
    expect(out).toContain('正常标签');
  });

  test('set tags persists to imgmeta value and userimgs entry', async () => {
    const req = authedRequest('PATCH', 'http://localhost/api/image/a.png/tags', token, { body: { tags: ['壁纸', 'hd', '壁纸'] } });
    const res = await handleSetImageTags(req, env, 'a.png');
    expect(res.status).toBe(200);
    const { tags } = await res.json();
    expect(tags).toEqual(['壁纸', 'hd']);
    // appears in /list
    const { items } = await (await handleList(authedRequest('GET', 'http://localhost/list', token), env)).json();
    expect(items.find(i => i.key === 'a.png').tags).toEqual(['壁纸', 'hd']);
  });

  test('non-owner cannot set tags (403)', async () => {
    await createTestUser(env, 'bob', 'pass');
    const bobToken = await userToken(env, 'bob');
    const req = authedRequest('PATCH', 'http://localhost/api/image/a.png/tags', bobToken, { body: { tags: ['x'] } });
    const res = await handleSetImageTags(req, env, 'a.png');
    expect(res.status).toBe(403);
  });

  test('cannot tag an image that is in the trash (409)', async () => {
    await handleDelete(authedRequest('DELETE', 'http://localhost/delete/a.png', token), env, 'a.png');
    const req = authedRequest('PATCH', 'http://localhost/api/image/a.png/tags', token, { body: { tags: ['x'] } });
    const res = await handleSetImageTags(req, env, 'a.png');
    expect(res.status).toBe(409);
  });

  test('cannot toggle visibility of a trashed image (409)', async () => {
    await handleDelete(authedRequest('DELETE', 'http://localhost/delete/a.png', token), env, 'a.png');
    const res = await handleToggleVisibility(authedRequest('PATCH', 'http://localhost/api/image/a.png/visibility', token), env, 'a.png');
    expect(res.status).toBe(409);
  });
});
