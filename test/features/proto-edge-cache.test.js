import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { serveProto } from '../../src/proto/serve.js';
import { createEnv } from '../helpers/mock-env.js';

// 公开原型资源的边缘缓存。三条底线：
//   1. 公开资源第二次请求不再读 R2
//   2. 私有 / 带密码原型一次都不缓存（访问控制必须实时判定）
//   3. 原型一改（updatedAt 变化）旧缓存自动失效 —— 缓存键里带着它

function fakeCaches() {
  const store = new Map();
  return {
    default: {
      async match(req) { const r = store.get(req.url); return r ? r.clone() : undefined; },
      async put(req, res) { store.set(req.url, res.clone()); },
      async delete(req) { store.delete(req.url); },
    },
    _store: store,
  };
}

let originalCaches;
beforeEach(() => { originalCaches = globalThis.caches; globalThis.caches = fakeCaches(); });
afterEach(() => {
  if (originalCaches === undefined) delete globalThis.caches;
  else globalThis.caches = originalCaches;
});

async function seed(env, { isPrivate = false, password, updatedAt = 1000, body = '<html><body>ok</body></html>' } = {}) {
  const meta = {
    protoId: 'p1', title: '原型', owner: 'alice', entryPoint: 'index.html',
    fileCount: 1, totalSize: 30, version: 1, updatedAt,
    versions: [{ v: 1, at: updatedAt, files: 1, size: 30 }],
    isPrivate,
    ...(password ? { accessPassword: password, passwordExpiry: Date.now() + 86400000 } : {}),
  };
  await env.STATS.put('proto:p1', JSON.stringify(meta));
  await env.BUCKET.put('proto/p1/index.html', new TextEncoder().encode(body).buffer,
    { httpMetadata: { contentType: 'text/html' } });
  return meta;
}

const req = (p = 'index.html') => new Request('http://localhost/proto/p1/' + p);

describe('原型边缘缓存', () => {
  test('公开资源第二次命中，不再读 R2', async () => {
    const env = createEnv();
    await seed(env);
    let reads = 0;
    const real = env.BUCKET.get.bind(env.BUCKET);
    env.BUCKET.get = async (k) => { reads++; return real(k); };

    const r1 = await serveProto(env, 'p1', 'index.html', req());
    expect(r1.headers.get('X-Cache')).toBe('MISS');
    const r2 = await serveProto(env, 'p1', 'index.html', req());
    expect(r2.headers.get('X-Cache')).toBe('HIT');
    expect(reads).toBe(1);
    expect(await r2.text()).toContain('ok');
  });

  test('私有原型不缓存', async () => {
    const env = createEnv();
    await seed(env, { isPrivate: true });
    const r1 = await serveProto(env, 'p1', 'index.html', req());
    expect(r1.status).toBe(403);
    expect(globalThis.caches._store.size).toBe(0);
  });

  test('带密码原型不缓存（公开读也要先过密码）', async () => {
    const env = createEnv();
    await seed(env, { password: '123456' });
    const r1 = await serveProto(env, 'p1', 'index.html', req());
    expect(r1.status).toBe(403);
    expect(globalThis.caches._store.size).toBe(0);
  });

  test('原型更新后（updatedAt 变化）旧缓存失效', async () => {
    const env = createEnv();
    await seed(env, { updatedAt: 1000, body: '<html><body>旧</body></html>' });
    await serveProto(env, 'p1', 'index.html', req());

    await seed(env, { updatedAt: 2000, body: '<html><body>新</body></html>' });
    const r2 = await serveProto(env, 'p1', 'index.html', req());
    expect(r2.headers.get('X-Cache')).toBe('MISS');
    expect(await r2.text()).toContain('新');
  });

  test('没有 Cache API 时行为不变', async () => {
    delete globalThis.caches;
    const env = createEnv();
    await seed(env);
    const res = await serveProto(env, 'p1', 'index.html', req());
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cache')).toBe('MISS');
  });
});
