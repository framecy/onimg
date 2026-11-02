import { describe, test, expect, beforeEach } from 'vitest';
import worker from '../../src/index.js';
import { serveProto } from '../../src/proto/serve.js';
import { handleUserLogin } from '../../src/user-auth.js';
import { createToken } from '../../src/admin/auth.js';
import { createEnv, createTestUser, createTestImage, createRequest, authedRequest } from '../helpers/mock-env.js';

// Agent / Skill 接入的权限面：/api/index、私有原型的属主通道、只读 token。
// 这三处都是新开的入口，任何一处放松过头都是越权，所以每条都要有反例。

const ctx = { waitUntil() {}, passThroughOnException() {} };

function call(method, path, { token, body, headers = {} } = {}) {
  const h = { ...headers };
  if (token) h.Authorization = 'Bearer ' + token;
  const req = createRequest(method, 'http://localhost' + path, { headers: h, body });
  return worker.fetch(req, envRef, ctx);
}
let envRef;

async function userToken(username, { scope } = {}) {
  return createToken(
    { type: 'user', username, ...(scope ? { scope } : {}) },
    3600_000,
    envRef.TOKEN_SECRET,
  );
}

async function seedProto(protoId, owner, { isPrivate = false } = {}) {
  await envRef.STATS.put('proto:' + protoId, JSON.stringify({
    protoId, title: '原型 ' + protoId, owner, entryPoint: 'index.html',
    fileCount: 1, totalSize: 8, version: 1,
    versions: [{ v: 1, at: Date.now(), files: 1, size: 8 }],
    isPrivate,
  }));
  await envRef.BUCKET.put('proto/' + protoId + '/index.html',
    new TextEncoder().encode('<html><body>ok</body></html>').buffer,
    { httpMetadata: { contentType: 'text/html' } });
}

beforeEach(async () => {
  envRef = createEnv();
  await createTestUser(envRef, 'alice', 'pass');
  await createTestUser(envRef, 'bob', 'pass');
});

describe('Agent 索引 /api/index', () => {
  test('未登录返回 401', async () => {
    const res = await call('GET', '/api/index');
    expect(res.status).toBe(401);
  });

  test('只返回本人名下的对象，且不含正文与密码', async () => {
    await createTestImage(envRef, 'mine.jpg', 'alice');
    await createTestImage(envRef, 'other.jpg', 'bob');
    await seedProto('p-alice', 'alice');
    await seedProto('p-bob', 'bob');
    await seedProto('p-locked', 'alice', { isPrivate: true });
    await envRef.STATS.put('page:my-note', JSON.stringify({
      title: '笔记', type: 'markdown', content: '# 很长的正文', owner: 'alice', isPublic: true,
    }));

    const token = await userToken('alice');
    const res = await call('GET', '/api/index', { token });
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.images.map(i => i.key)).toEqual(['mine.jpg']);
    expect(body.protos.map(p => p.protoId).sort()).toEqual(['p-alice', 'p-locked']);
    expect(body.pages.map(p => p.slug)).toEqual(['my-note']);
    // 正文与密码字段一律不下发
    expect(JSON.stringify(body)).not.toContain('# 很长的正文');
    expect(body.pages[0].content).toBeUndefined();
    expect(body.pages[0].contentLength).toBe('# 很长的正文'.length);
    expect(body.protos.find(p => p.protoId === 'p-locked').isPrivate).toBe(true);
    expect(body.account.username).toBe('alice');
  });

  test('账号 apiAccess=off 时拒绝（403 agent_access_denied）', async () => {
    await createTestUser(envRef, 'carol', 'pass', { apiAccess: 'off' });
    const token = await userToken('carol');
    const res = await call('GET', '/api/index', { token });
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe('agent_access_denied');
  });
});

describe('只读 token（scope=read）', () => {
  test('能读索引，但任何写操作都 403', async () => {
    const token = await userToken('alice', { scope: 'read' });

    const read = await call('GET', '/api/index', { token });
    expect(read.status).toBe(200);

    const write = await call('POST', '/upload', {
      token,
      headers: { 'Content-Type': 'image/jpeg' },
      body: new Uint8Array(64).buffer,
    });
    expect(write.status).toBe(403);
    expect((await write.json()).code).toBe('read_only_scope');
  });

  test('网页登录（不带 scope）签出的 token 仍是读写，不受影响', async () => {
    const res = await handleUserLogin(createRequest('POST', 'http://localhost/auth/login', {
      body: { username: 'alice', password: 'pass' },
    }), envRef);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.scope).toBe('write');
  });

  test('设备授权申请只读，签出的 token 带 scope=read', async () => {
    const res = await handleUserLogin(createRequest('POST', 'http://localhost/auth/login', {
      body: { username: 'alice', password: 'pass', scope: 'read' },
    }), envRef);
    const body = await res.json();
    expect(body.scope).toBe('read');

    const write = await call('POST', '/upload', {
      token: body.token,
      headers: { 'Content-Type': 'image/jpeg' },
      body: new Uint8Array(64).buffer,
    });
    expect(write.status).toBe(403);
  });

  test('账号上限是 read 时，申请 write 也会被降级为只读', async () => {
    await createTestUser(envRef, 'dave', 'pass', { apiAccess: 'read' });
    const res = await handleUserLogin(createRequest('POST', 'http://localhost/auth/login', {
      body: { username: 'dave', password: 'pass', scope: 'write' },
    }), envRef);
    const body = await res.json();
    expect(body.scope).toBe('read');
  });

  test('账号 apiAccess=off 时设备授权直接被拒（403）', async () => {
    await createTestUser(envRef, 'erin', 'pass', { apiAccess: 'off' });
    const res = await handleUserLogin(createRequest('POST', 'http://localhost/auth/login', {
      body: { username: 'erin', password: 'pass', scope: 'read' },
    }), envRef);
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe('agent_access_denied');
  });
});

describe('管理端设置账号的 Agent 权限', () => {
  async function adminToken() {
    return createToken({ type: 'admin' }, 3600_000, envRef.TOKEN_SECRET);
  }

  test('新建用户可指定 apiAccess，缺省是 write', async () => {
    const at = await adminToken();
    const res = await call('POST', '/admin/users', {
      token: at,
      body: { username: 'gina', password: 'pass', permissions: { apiAccess: 'read' } },
    });
    expect(res.status).toBe(201);
    expect((await res.json()).permissions.apiAccess).toBe('read');

    const res2 = await call('POST', '/admin/users', {
      token: at,
      body: { username: 'hank', password: 'pass' },
    });
    expect((await res2.json()).permissions.apiAccess).toBe('write');
  });

  test('非法 apiAccess 值被拒绝（400）', async () => {
    const at = await adminToken();
    const res = await call('PATCH', '/admin/users/alice', {
      token: at,
      body: { permissions: { apiAccess: 'all' } },
    });
    expect(res.status).toBe(400);
  });
});

describe('私有原型的属主读取通道', () => {
  test('无 token 仍然 403', async () => {
    await seedProto('secret', 'alice', { isPrivate: true });
    const res = await serveProto(envRef, 'secret', 'index.html',
      createRequest('GET', 'http://localhost/proto/secret/index.html'));
    expect(res.status).toBe(403);
  });

  test('属主 token 可以读到文件字节', async () => {
    await seedProto('secret', 'alice', { isPrivate: true });
    const token = await userToken('alice');
    // 入口：属主 token 放行 → 302 到签名 URL（私有原型 sig ≠ '0'）
    const r0 = await serveProto(envRef, 'secret', 'index.html',
      authedRequest('GET', 'http://localhost/proto/secret/index.html', token));
    expect(r0.status).toBe(302);
    const loc = r0.headers.get('Location');
    expect(loc).toMatch(/^\/proto\/secret\/_s[0-9a-f]{16}-1\/index\.html$/);
    // 跟随重定向：带 token 的第二跳仍要过属主判定（签名 + Authorization 均可）
    const res = await serveProto(envRef, 'secret', loc.slice('/proto/secret/'.length),
      authedRequest('GET', 'http://localhost' + loc, token));
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('ok');
  });

  test('别人的 token 读不到（403）', async () => {
    await seedProto('secret', 'alice', { isPrivate: true });
    const token = await userToken('bob');
    const res = await serveProto(envRef, 'secret', 'index.html',
      authedRequest('GET', 'http://localhost/proto/secret/index.html', token));
    expect(res.status).toBe(403);
  });

  test('属主被设成 apiAccess=off 后读不到', async () => {
    await seedProto('secret2', 'frank', { isPrivate: true });
    await createTestUser(envRef, 'frank', 'pass', { apiAccess: 'off' });
    const token = await userToken('frank');
    const res = await serveProto(envRef, 'secret2', 'index.html',
      authedRequest('GET', 'http://localhost/proto/secret2/index.html', token));
    expect(res.status).toBe(403);
  });

  test('公开原型带 token 也照常返回（不因属主通道而改变行为）', async () => {
    await seedProto('public1', 'alice');
    const r0 = await serveProto(envRef, 'public1', 'index.html',
      createRequest('GET', 'http://localhost/proto/public1/index.html'));
    expect(r0.status).toBe(302);
    const res = await serveProto(envRef, 'public1',
      r0.headers.get('Location').slice('/proto/public1/'.length),
      createRequest('GET', 'http://localhost' + r0.headers.get('Location')));
    expect(res.status).toBe(200);
  });
});
