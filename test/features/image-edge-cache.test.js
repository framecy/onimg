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

    // 2026-11-04：统计从「最多 200 条的访问明细数组」改为定长计数行
    // （astat:img:{key}），单次访问 1 读 + 1 写、行体积恒定，不再整行重写。
    // 见 src/admin/access-stats.js 文件头。
    const row = await env.STATS.getWithMetadata('astat:img:c.jpg', 'json');
    expect(row?.metadata?.count).toBe(2);
    expect(row?.metadata?.lastAccess).toBeGreaterThan(0);
    // 旧数组 key 不再被写入（历史数据仍在，读取侧兜底）
    expect(await env.STATS.get('stats:c.jpg')).toBe(null);
  });

  test('统计行体积恒定：访问 60 次后仍是几百字节', async () => {
    const env = createEnv();
    await createTestImage(env, 'hot.jpg', 'alice');
    const { ctx, drain } = makeCtx();
    const url = 'http://localhost/hot.jpg';
    for (let i = 0; i < 60; i++) {
      await handleGet(env, ctx, 'hot.jpg', req(url));
      await drain();
    }
    const row = await env.STATS.getWithMetadata('astat:img:hot.jpg', 'json');
    expect(row?.metadata?.count).toBe(60);
    // 旧实现每张图最多存 200 条明细（约 4 KB）；新实现只有计数 + 国家分布
    expect(JSON.stringify(row.metadata).length).toBeLessThan(1024);
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
