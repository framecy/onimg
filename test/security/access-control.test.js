import { describe, test, expect, beforeEach } from 'vitest';
import { handleUpload } from '../../src/upload.js';
import { handleDelete } from '../../src/delete.js';
import { createToken, verifyAdminToken } from '../../src/admin/auth.js';
import {
  createEnv,
  authedRequest,
  createUploadRequest,
  createTestUser,
  createTestImage,
} from '../helpers/mock-env.js';

// ── Upload access control ─────────────────────────────────────────────────────

describe('Access Control: Upload', () => {
  let env;
  beforeEach(async () => {
    env = createEnv();
    await createTestUser(env, 'alice', 'pass', { canUpload: true });
    await createTestUser(env, 'noupload', 'pass', { canUpload: false });
  });

  test('rejects unauthenticated upload (401)', async () => {
    const req = new Request('http://localhost/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'image/jpeg' },
      body: new Uint8Array(100).buffer,
    });
    const res = await handleUpload(req, env);
    expect(res.status).toBe(401);
  });

  test('rejects expired token (401)', async () => {
    const expired = await createToken(
      { type: 'user', username: 'alice' },
      -1,
      env.TOKEN_SECRET,
    );
    const req = createUploadRequest(expired);
    const res = await handleUpload(req, env);
    expect(res.status).toBe(401);
  });

  test('rejects upload when canUpload is false (403)', async () => {
    const token = await createToken(
      { type: 'user', username: 'noupload' },
      3600_000,
      env.TOKEN_SECRET,
    );
    const req = createUploadRequest(token);
    const res = await handleUpload(req, env);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/permission/i);
  });

  test('allows upload when canUpload is true', async () => {
    const token = await createToken(
      { type: 'user', username: 'alice' },
      3600_000,
      env.TOKEN_SECRET,
    );
    const req = createUploadRequest(token);
    const res = await handleUpload(req, env);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.key).toBeTruthy();
  });

  test('admin token bypasses canUpload restriction', async () => {
    const adminToken = await createToken({ type: 'admin' }, 3600_000, env.TOKEN_SECRET);
    const req = createUploadRequest(adminToken);
    const res = await handleUpload(req, env);
    expect(res.status).toBe(201);
  });
});

// ── Delete access control ─────────────────────────────────────────────────────

describe('Access Control: Delete', () => {
  let env;
  const imgKey = 'test-image.jpg';

  beforeEach(async () => {
    env = createEnv();
    await createTestUser(env, 'alice', 'pass', { canDelete: true });
    await createTestUser(env, 'bob', 'pass', { canDelete: false });
    await createTestUser(env, 'carol', 'pass', { canDelete: true });
    await createTestImage(env, imgKey, 'alice');
  });

  test('rejects unauthenticated delete (401)', async () => {
    const req = new Request('http://localhost/delete/' + imgKey, { method: 'DELETE' });
    const res = await handleDelete(req, env, imgKey);
    expect(res.status).toBe(401);
  });

  test('rejects delete when canDelete is false (403)', async () => {
    const token = await createToken(
      { type: 'user', username: 'bob' },
      3600_000,
      env.TOKEN_SECRET,
    );
    const req = authedRequest('DELETE', 'http://localhost/delete/' + imgKey, token);
    const res = await handleDelete(req, env, imgKey);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/permission/i);
  });

  test('owner with canDelete can delete own image', async () => {
    const token = await createToken(
      { type: 'user', username: 'alice' },
      3600_000,
      env.TOKEN_SECRET,
    );
    const req = authedRequest('DELETE', 'http://localhost/delete/' + imgKey, token);
    const res = await handleDelete(req, env, imgKey);
    expect(res.status).toBe(200);
  });

  test('admin can delete any image', async () => {
    const adminToken = await createToken({ type: 'admin' }, 3600_000, env.TOKEN_SECRET);
    const req = authedRequest('DELETE', 'http://localhost/delete/' + imgKey, adminToken);
    const res = await handleDelete(req, env, imgKey);
    expect(res.status).toBe(200);
  });

  // SECURITY NOTE: current implementation does NOT enforce ownership for non-admin users.
  // A user with canDelete=true can delete images belonging to other users (IDOR).
  // This test documents the current behaviour; a future fix should add an ownership check.
  test('[IDOR] user with canDelete can delete another user\'s image (known limitation)', async () => {
    const carolToken = await createToken(
      { type: 'user', username: 'carol' },
      3600_000,
      env.TOKEN_SECRET,
    );
    const req = authedRequest('DELETE', 'http://localhost/delete/' + imgKey, carolToken);
    const res = await handleDelete(req, env, imgKey);
    // Currently succeeds — this documents the missing ownership check
    expect(res.status).toBe(200);
  });

  test('returns 404 for nonexistent image', async () => {
    const token = await createToken(
      { type: 'user', username: 'alice' },
      3600_000,
      env.TOKEN_SECRET,
    );
    const req = authedRequest('DELETE', 'http://localhost/delete/no-such-key.jpg', token);
    const res = await handleDelete(req, env, 'no-such-key.jpg');
    expect(res.status).toBe(404);
  });

  test('returns 400 when key is missing', async () => {
    const token = await createToken(
      { type: 'user', username: 'alice' },
      3600_000,
      env.TOKEN_SECRET,
    );
    const req = authedRequest('DELETE', 'http://localhost/delete/', token);
    const res = await handleDelete(req, env, '');
    expect(res.status).toBe(400);
  });
});

// ── Admin route protection ────────────────────────────────────────────────────

describe('Access Control: Admin routes require admin token', () => {
  let env;
  beforeEach(async () => {
    env = createEnv();
    await createTestUser(env, 'alice', 'pass');
  });

  test('user token does not satisfy verifyAdminToken', async () => {
    const userToken = await createToken(
      { type: 'user', username: 'alice' },
      3600_000,
      env.TOKEN_SECRET,
    );
    const req = authedRequest('GET', 'http://localhost/admin/stats', userToken);
    expect(await verifyAdminToken(req, env)).toBe(false);
  });

  test('isAdmin user token does not satisfy verifyAdminToken', async () => {
    // Even if user payload has isAdmin:true, admin route still needs type:'admin'
    const elevatedToken = await createToken(
      { type: 'user', username: 'alice', isAdmin: true },
      3600_000,
      env.TOKEN_SECRET,
    );
    const req = authedRequest('GET', 'http://localhost/admin/stats', elevatedToken);
    expect(await verifyAdminToken(req, env)).toBe(false);
  });
});
