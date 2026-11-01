import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { handleGet } from '../../src/get.js';
import { createEnv, createTestImage } from '../helpers/mock-env.js';

// 图片边缘缓存：key 不可变、直链公开，所以缓存不改变暴露面，只减少回源。
// 这里用内存版 Cache API 替身验证三件事：
//   1. 同一个 URL 第二次请求不再读 R2
//   2. 带 Authorization 的请求一律绕过缓存
//   3. 访问统计在命中时仍然照记（计数口径不能因为缓存而变）

function fakeCaches() {
  const store = new Map();
  return {
    default: {
      async match(req) {
        const r = store.get(req.url);
        return r ? r.clone() : undefined;
      },
      async put(req, res) {
        store.set(req.url, res.clone());
      },
      async delete(req) {
        store.delete(req.url);
      },
    },
    _store: store,
  };
}

let originalCaches;

beforeEach(() => {
  originalCaches = globalThis.caches;
  globalThis.caches = fakeCaches();
});
afterEach(() => {
  if (originalCaches === undefined) delete globalThis.caches;
  else globalThis.caches = originalCaches;
});

// waitUntil 在真实 Workers 里会等请求结束后执行；测试里要手动 await，否则统计写不进去
function makeCtx() {
  const pending = [];
  return { ctx: { waitUntil(p) { pending.push(p); } }, drain: () => Promise.all(pending) };
}

function req(url, { auth } = {}) {
  const headers = {};
  if (auth) headers.Authorization = 'Bearer t';
  return new Request(url, { headers });
}

describe('图片边缘缓存', () => {
  test('第二次请求命中缓存，不再读 R2', async () => {
    const env = createEnv();
    await createTestImage(env, 'a.jpg', 'alice');
    let reads = 0;
    const realGet = env.BUCKET.get.bind(env.BUCKET);
    env.BUCKET.get = async (k) => { reads++; return realGet(k); };

    const { ctx, drain } = makeCtx();
    const url = 'http://localhost/a.jpg';
    const first = await handleGet(env, ctx, 'a.jpg', req(url));
    expect(first.headers.get('X-Cache')).toBe('MISS');
    expect(await first.text()).toContain('');
    await drain();

    const second = await handleGet(env, ctx, 'a.jpg', req(url));
    expect(second.headers.get('X-Cache')).toBe('HIT');
    await drain();
    expect(reads).toBe(1);
  });

  test('带 Authorization 的请求不走缓存', async () => {
    const env = createEnv();
    await createTestImage(env, 'b.jpg', 'alice');
    let reads = 0;
    const realGet = env.BUCKET.get.bind(env.BUCKET);
    env.BUCKET.get = async (k) => { reads++; return realGet(k); };

    const { ctx } = makeCtx();
    const url = 'http://localhost/b.jpg';
    const r1 = await handleGet(env, ctx, 'b.jpg', req(url, { auth: true }));
    const r2 = await handleGet(env, ctx, 'b.jpg', req(url, { auth: true }));
    expect(r1.headers.get('X-Cache')).toBe('MISS');
    expect(r2.headers.get('X-Cache')).toBe('MISS');
    expect(reads).toBe(2);
    expect(globalThis.caches._store.size).toBe(0);
  });

  test('缓存命中时仍然记访问统计', async () => {
    const env = createEnv();
    await createTestImage(env, 'c.jpg', 'alice');
    const { ctx, drain } = makeCtx();
    const url = 'http://localhost/c.jpg';
    await handleGet(env, ctx, 'c.jpg', req(url));
    await drain();
    const hit = await handleGet(env, ctx, 'c.jpg', req(url));
    expect(hit.headers.get('X-Cache')).toBe('HIT');
    await drain();

    // recordAccess 把访问记录存成数组（value 本身），不是 { accesses: [...] }
    const stats = await env.STATS.get('stats:c.jpg', 'json');
    expect(Array.isArray(stats)).toBe(true);
    expect(stats.length).toBe(2);
  });

  test('没有 Cache API 时（本地 / 单测）行为不变', async () => {
    delete globalThis.caches;
    const env = createEnv();
    await createTestImage(env, 'd.jpg', 'alice');
    const { ctx } = makeCtx();
    const res = await handleGet(env, ctx, 'd.jpg', req('http://localhost/d.jpg'));
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cache')).toBe('MISS');
  });
});
