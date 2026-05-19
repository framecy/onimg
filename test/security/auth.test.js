import { describe, test, expect, beforeEach } from 'vitest';
import { handleUserLogin, verifyUserToken } from '../../src/user-auth.js';
import {
  handleAdminLogin,
  verifyAdminToken,
  createToken,
  hmacSign,
  timingSafeEqual,
} from '../../src/admin/auth.js';
import {
  createEnv,
  createRequest,
  authedRequest,
  createTestUser,
} from '../helpers/mock-env.js';

describe('Auth: Admin Login', () => {
  let env;
  beforeEach(() => { env = createEnv(); });

  test('succeeds with correct credentials', async () => {
    const req = createRequest('POST', 'http://localhost/admin/login', {
      body: { username: 'admin', password: 'AdminP@ss99!' },
    });
    const res = await handleAdminLogin(req, env);
    expect(res.status).toBe(200);
    const { token } = await res.json();
    expect(typeof token).toBe('string');
    expect(token).toMatch(/\./);
  });

  test('rejects wrong password', async () => {
    const req = createRequest('POST', 'http://localhost/admin/login', {
      body: { username: 'admin', password: 'wrong' },
    });
    const res = await handleAdminLogin(req, env);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Invalid credentials');
  });

  test('rejects wrong username', async () => {
    const req = createRequest('POST', 'http://localhost/admin/login', {
      body: { username: 'root', password: 'AdminP@ss99!' },
    });
    const res = await handleAdminLogin(req, env);
    expect(res.status).toBe(401);
  });

  test('rejects empty credentials', async () => {
    const req = createRequest('POST', 'http://localhost/admin/login', {
      body: { username: '', password: '' },
    });
    const res = await handleAdminLogin(req, env);
    expect(res.status).toBe(401);
  });

  test('returns 503 when TOKEN_SECRET is missing', async () => {
    const bare = createEnv({ TOKEN_SECRET: undefined });
    const req = createRequest('POST', 'http://localhost/admin/login', {
      body: { username: 'admin', password: 'AdminP@ss99!' },
    });
    const res = await handleAdminLogin(req, bare);
    expect(res.status).toBe(503);
  });

  test('rejects invalid JSON body', async () => {
    const req = new Request('http://localhost/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json{{{',
    });
    const res = await handleAdminLogin(req, env);
    expect(res.status).toBe(400);
  });
});

describe('Auth: User Login', () => {
  let env;
  beforeEach(async () => {
    env = createEnv();
    await createTestUser(env, 'alice', 'alicePass1!');
    await createTestUser(env, 'bob', 'bobPass1!', { disabled: true });
  });

  test('succeeds with correct credentials', async () => {
    const req = createRequest('POST', 'http://localhost/auth/login', {
      body: { username: 'alice', password: 'alicePass1!' },
    });
    const res = await handleUserLogin(req, env);
    expect(res.status).toBe(200);
    const { token, username } = await res.json();
    expect(username).toBe('alice');
    expect(typeof token).toBe('string');
  });

  test('rejects wrong password', async () => {
    const req = createRequest('POST', 'http://localhost/auth/login', {
      body: { username: 'alice', password: 'wrongpass' },
    });
    const res = await handleUserLogin(req, env);
    expect(res.status).toBe(401);
    // Error message must NOT reveal whether user exists
    const body = await res.json();
    expect(body.error).toBe('Invalid credentials');
  });

  test('rejects nonexistent user with same generic error', async () => {
    const req = createRequest('POST', 'http://localhost/auth/login', {
      body: { username: 'nobody', password: 'pass' },
    });
    const res = await handleUserLogin(req, env);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Invalid credentials');
  });

  test('rejects disabled user', async () => {
    const req = createRequest('POST', 'http://localhost/auth/login', {
      body: { username: 'bob', password: 'bobPass1!' },
    });
    const res = await handleUserLogin(req, env);
    expect(res.status).toBe(401);
  });

  test('returns 400 when username is missing', async () => {
    const req = createRequest('POST', 'http://localhost/auth/login', {
      body: { password: 'pass' },
    });
    const res = await handleUserLogin(req, env);
    expect(res.status).toBe(400);
  });

  test('returns 400 when password is missing', async () => {
    const req = createRequest('POST', 'http://localhost/auth/login', {
      body: { username: 'alice' },
    });
    const res = await handleUserLogin(req, env);
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid JSON', async () => {
    const req = new Request('http://localhost/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{{bad',
    });
    const res = await handleUserLogin(req, env);
    expect(res.status).toBe(400);
  });

  test('admin credentials grant isAdmin flag via user login', async () => {
    const req = createRequest('POST', 'http://localhost/auth/login', {
      body: { username: 'admin', password: 'AdminP@ss99!' },
    });
    const res = await handleUserLogin(req, env);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.isAdmin).toBe(true);
    expect(data.permissions.maxTotalUploads).toBe(-1);
  });
});

describe('Auth: Token Security', () => {
  let env;
  beforeEach(async () => {
    env = createEnv();
    await createTestUser(env, 'alice', 'alicePass1!');
  });

  test('verifyAdminToken accepts valid admin token', async () => {
    const token = await createToken({ type: 'admin' }, 3600_000, env.TOKEN_SECRET);
    const req = authedRequest('GET', 'http://localhost/', token);
    expect(await verifyAdminToken(req, env)).toBe(true);
  });

  test('rejects token signed with wrong secret', async () => {
    const forged = await createToken({ type: 'admin' }, 3600_000, 'completely-wrong-secret');
    const req = authedRequest('GET', 'http://localhost/', forged);
    expect(await verifyAdminToken(req, env)).toBe(false);
  });

  test('rejects expired token', async () => {
    // ttl of -1ms makes exp in the past
    const expired = await createToken({ type: 'admin' }, -1, env.TOKEN_SECRET);
    const req = authedRequest('GET', 'http://localhost/', expired);
    expect(await verifyAdminToken(req, env)).toBe(false);
  });

  test('user token does NOT grant admin access', async () => {
    const userToken = await createToken(
      { type: 'user', username: 'alice' },
      3600_000,
      env.TOKEN_SECRET,
    );
    const req = authedRequest('GET', 'http://localhost/admin/', userToken);
    expect(await verifyAdminToken(req, env)).toBe(false);
  });

  test('admin token does NOT authenticate as user', async () => {
    const adminToken = await createToken({ type: 'admin' }, 3600_000, env.TOKEN_SECRET);
    const req = authedRequest('GET', 'http://localhost/', adminToken);
    const user = await verifyUserToken(req, env);
    expect(user).toBeNull();
  });

  test('rejects token with tampered payload (sig mismatch)', async () => {
    const token = await createToken({ type: 'user', username: 'alice' }, 3600_000, env.TOKEN_SECRET);
    const [, sig] = token.split('.');
    // Craft a payload that escalates alice to admin
    const tamperedB64 = btoa(JSON.stringify({
      type: 'user', username: 'alice', isAdmin: true,
      iat: Date.now(), exp: Date.now() + 3600_000,
    }));
    const tampered = tamperedB64 + '.' + sig;
    const req = authedRequest('GET', 'http://localhost/', tampered);
    const user = await verifyUserToken(req, env);
    expect(user).toBeNull();
  });

  test('rejects token with missing Bearer prefix', async () => {
    const token = await createToken({ type: 'admin' }, 3600_000, env.TOKEN_SECRET);
    const req = new Request('http://localhost/', {
      headers: { Authorization: token },  // no "Bearer " prefix
    });
    expect(await verifyAdminToken(req, env)).toBe(false);
  });

  test('rejects request with no Authorization header', async () => {
    const req = new Request('http://localhost/');
    expect(await verifyAdminToken(req, env)).toBe(false);
    expect(await verifyUserToken(req, env)).toBeNull();
  });

  test('rejects token with no dot separator', async () => {
    const req = authedRequest('GET', 'http://localhost/', 'notavalidtoken');
    expect(await verifyAdminToken(req, env)).toBe(false);
  });

  test('rejects token when TOKEN_SECRET is missing', async () => {
    const bare = createEnv({ TOKEN_SECRET: undefined });
    const token = await createToken({ type: 'admin' }, 3600_000, env.TOKEN_SECRET);
    const req = authedRequest('GET', 'http://localhost/', token);
    expect(await verifyAdminToken(req, bare)).toBe(false);
    expect(await verifyUserToken(req, bare)).toBeNull();
  });

  test('disabled user token is rejected even if cryptographically valid', async () => {
    // Token is valid, but user gets disabled after issuance
    const token = await createToken(
      { type: 'user', username: 'alice' },
      3600_000,
      env.TOKEN_SECRET,
    );
    // Disable alice in KV
    const aliceRaw = await env.STATS.get('user:alice', 'json');
    await env.STATS.put('user:alice', JSON.stringify({ ...aliceRaw, disabled: true }));

    const req = authedRequest('GET', 'http://localhost/', token);
    const user = await verifyUserToken(req, env);
    expect(user).toBeNull();
  });
});

describe('Auth: timingSafeEqual', () => {
  test('equal strings return true', () => {
    expect(timingSafeEqual('hello', 'hello')).toBe(true);
  });

  test('different strings return false', () => {
    expect(timingSafeEqual('hello', 'world')).toBe(false);
  });

  test('prefix match returns false', () => {
    expect(timingSafeEqual('abc', 'abcd')).toBe(false);
  });

  test('empty strings are equal', () => {
    expect(timingSafeEqual('', '')).toBe(true);
  });

  test('empty vs non-empty returns false', () => {
    expect(timingSafeEqual('', 'a')).toBe(false);
  });
});
