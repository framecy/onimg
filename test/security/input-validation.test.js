import { describe, test, expect, beforeEach } from 'vitest';
import { handleUpload } from '../../src/upload.js';
import { createToken } from '../../src/admin/auth.js';
import {
  createEnv,
  createUploadRequest,
  createTestUser,
} from '../helpers/mock-env.js';

// ── MIME type validation ──────────────────────────────────────────────────────

describe('Input Validation: MIME type', () => {
  let env, token;

  beforeEach(async () => {
    env = createEnv();
    await createTestUser(env, 'alice', 'pass');
    token = await createToken({ type: 'user', username: 'alice' }, 3600_000, env.TOKEN_SECRET);
  });

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  const blockedTypes = [
    'application/javascript',
    'text/html',
    'application/octet-stream',
    'text/php',
    'application/xml',
    'image/tiff',   // not in default allowed list
    'image/x-unknown',
  ];

  for (const mime of allowedTypes) {
    test(`accepts ${mime}`, async () => {
      const req = createUploadRequest(token, { mimeType: mime });
      const res = await handleUpload(req, env);
      expect(res.status).toBe(201);
    });
  }

  for (const mime of blockedTypes) {
    test(`rejects ${mime} (415)`, async () => {
      const req = createUploadRequest(token, { mimeType: mime });
      const res = await handleUpload(req, env);
      expect(res.status).toBe(415);
    });
  }

  test('Content-Type header is authoritative — body content is not inspected', async () => {
    // An attacker sends HTML bytes but claims image/jpeg; the server accepts by Content-Type.
    // This test documents current behaviour: MIME validation relies solely on Content-Type.
    const htmlBody = new TextEncoder().encode('<script>alert(1)</script>').buffer;
    const req = new Request('http://localhost/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/jpeg' },
      body: htmlBody,
    });
    const res = await handleUpload(req, env);
    // Server accepts because Content-Type is allowed — no magic-byte inspection
    expect(res.status).toBe(201);
  });
});

// ── File size validation ──────────────────────────────────────────────────────

describe('Input Validation: File size', () => {
  let env, token;

  beforeEach(async () => {
    env = createEnv({ MAX_FILE_SIZE: String(1024 * 1024) }); // 1 MB limit
    await createTestUser(env, 'alice', 'pass');
    token = await createToken({ type: 'user', username: 'alice' }, 3600_000, env.TOKEN_SECRET);
  });

  test('accepts file within limit', async () => {
    const req = createUploadRequest(token, { size: 512 * 1024 }); // 512 KB
    const res = await handleUpload(req, env);
    expect(res.status).toBe(201);
  });

  test('rejects file exceeding limit (413)', async () => {
    const req = createUploadRequest(token, { size: 2 * 1024 * 1024 }); // 2 MB
    const res = await handleUpload(req, env);
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body.error).toMatch(/too large/i);
  });

  test('rejects exactly-on-limit + 1 byte', async () => {
    const req = createUploadRequest(token, { size: 1024 * 1024 + 1 });
    const res = await handleUpload(req, env);
    expect(res.status).toBe(413);
  });

  test('accepts exactly at limit', async () => {
    const req = createUploadRequest(token, { size: 1024 * 1024 });
    const res = await handleUpload(req, env);
    expect(res.status).toBe(201);
  });
});

// ── Quota enforcement ─────────────────────────────────────────────────────────

describe('Input Validation: Upload quota', () => {
  let env;

  test('enforces maxTotalUploads limit', async () => {
    env = createEnv();
    await createTestUser(env, 'limited', 'pass', { maxTotalUploads: 2, dailyUploadLimit: -1 });
    const token = await createToken({ type: 'user', username: 'limited' }, 3600_000, env.TOKEN_SECRET);

    // First two uploads succeed
    for (let i = 0; i < 2; i++) {
      const res = await handleUpload(createUploadRequest(token), env);
      expect(res.status).toBe(201);
    }
    // Third upload must be refused
    const res = await handleUpload(createUploadRequest(token), env);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toMatch(/总量|limit/i);
  });

  test('enforces dailyUploadLimit', async () => {
    env = createEnv();
    await createTestUser(env, 'daily', 'pass', { maxTotalUploads: -1, dailyUploadLimit: 1 });
    const token = await createToken({ type: 'user', username: 'daily' }, 3600_000, env.TOKEN_SECRET);

    const res1 = await handleUpload(createUploadRequest(token), env);
    expect(res1.status).toBe(201);

    const res2 = await handleUpload(createUploadRequest(token), env);
    expect(res2.status).toBe(429);
    const body = await res2.json();
    expect(body.error).toMatch(/今日|daily/i);
  });

  test('admin token bypasses quota entirely', async () => {
    env = createEnv();
    // Even with a user that has maxTotalUploads:0, admin bypasses it
    const adminToken = await createToken({ type: 'admin' }, 3600_000, env.TOKEN_SECRET);

    for (let i = 0; i < 5; i++) {
      const res = await handleUpload(createUploadRequest(adminToken), env);
      expect(res.status).toBe(201);
    }
  });

  test('isAdmin user token also bypasses quota', async () => {
    env = createEnv();
    // Users who logged in with admin credentials get isAdmin:true token
    const adminUserToken = await createToken(
      { type: 'user', username: 'admin', isAdmin: true },
      3600_000,
      env.TOKEN_SECRET,
    );
    for (let i = 0; i < 3; i++) {
      const res = await handleUpload(createUploadRequest(adminUserToken), env);
      expect(res.status).toBe(201);
    }
  });

  test('-1 limits mean unlimited', async () => {
    env = createEnv();
    await createTestUser(env, 'unlimited', 'pass', { maxTotalUploads: -1, dailyUploadLimit: -1 });
    const token = await createToken({ type: 'user', username: 'unlimited' }, 3600_000, env.TOKEN_SECRET);

    for (let i = 0; i < 5; i++) {
      const res = await handleUpload(createUploadRequest(token), env);
      expect(res.status).toBe(201);
    }
  });
});

// ── Missing file field ─────────────────────────────────────────────────────────

describe('Input Validation: Upload request structure', () => {
  let env, token;

  beforeEach(async () => {
    env = createEnv();
    await createTestUser(env, 'alice', 'pass');
    token = await createToken({ type: 'user', username: 'alice' }, 3600_000, env.TOKEN_SECRET);
  });

  test('returns 400 when multipart request has no file field', async () => {
    const formData = new FormData();
    formData.append('other', 'data');
    const req = new Request('http://localhost/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const res = await handleUpload(req, env);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/file/i);
  });
});
