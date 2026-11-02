import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { serveProto } from '../../src/proto/serve.js';
import { createEnv } from '../helpers/mock-env.js';

// 版本化 URL 下的边缘缓存。底线：
//   1. 公开资源第二次请求不再读 R2（版本化路径零 D1：缓存命中即返回）
//   2. 私有 / 带密码原型一次都不缓存（访问控制必须实时判定）
//   3. 重新上传（version 变化）→ 新 URL，旧缓存键自然作废
//   4. 改标题 / 改标签（updatedAt 变化但 version 不变）不再冲掉缓存
//      —— 旧实现缓存键含 updatedAt，改一次标题全站 MISS，这是要修的 bug
//   5. 404 有负缓存：Axure 每页发的 shouldShow*Hint 探测不再打穿 D1+R2
//   6. If-None-Match 命中回 304

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

const ctx = { waitUntil(p) { p?.catch?.(() => {}); } };

async function seed(env, {
  isPrivate = false, password, updatedAt = 1000, version = 1,
  body = '<html><body>ok</body></html>',
} = {}) {
  const meta = {
    protoId: 'p1', title: '原型', owner: 'alice', entryPoint: 'index.html',
    fileCount: 1, totalSize: 30, version, updatedAt,
    versions: [{ v: version, at: updatedAt, files: 1, size: 30 }],
    isPrivate,
    ...(password ? { accessPassword: password, passwordExpiry: Date.now() + 86400000 } : {}),
  };
  await env.STATS.put('proto:p1', JSON.stringify(meta));
  await env.BUCKET.put('proto/p1/index.html', new TextEncoder().encode(body).buffer,
    { httpMetadata: { contentType: 'text/html' } });
  return meta;
}

const req = (p, extra = {}) => new Request('http://localhost/proto/p1/' + p, {
  method: 'GET', ...extra,
});

/** 入口请求 → 302 → 返回版本化 URL（测试辅助） */
async function versionUrl(env, protoId = 'p1') {
  const r = await serveProto(env, protoId, '', req(''), ctx);
  return r.headers.get('Location');
}

describe('原型边缘缓存（版本化 URL）', () => {
  test('入口 /proto/{id}/ 302 到版本化 URL，随后资源零 D1 命中', async () => {
    const env = createEnv();
    await seed(env);

    const loc = await versionUrl(env);
    expect(loc).toMatch(/^\/proto\/p1\/_s0-1\/index\.html$/);

    // 计数：版本化路径上的 D1 读（meta get）与 R2 读
    let metaReads = 0, r2Reads = 0;
    const realGet = env.STATS.get.bind(env.STATS);
    env.STATS.get = async (k, ...a) => { if (k === 'proto:p1') metaReads++; return realGet(k, ...a); };
    const realR2 = env.BUCKET.get.bind(env.BUCKET);
    env.BUCKET.get = async (k) => { r2Reads++; return realR2(k); };

    const u = 'http://localhost' + loc;
    const r1 = await serveProto(env, 'p1', loc.slice('/proto/p1/'.length), new Request(u), ctx);
    expect(r1.status).toBe(200);
    expect(r1.headers.get('Cache-Control')).toBe('no-store');   // HTML 不缓存
    const r2 = await serveProto(env, 'p1', loc.slice('/proto/p1/'.length), new Request(u), ctx);
    expect(r2.status).toBe(200);

    // HTML 恒不缓存 → 两次都回源（R2 读 2 次）。
    // D1 只读 1 次：第一次读 meta 并写策略缓存，第二次直接吃策略缓存 ——
    // 策略缓存里带着标题，所以连标题注入都不再额外读库。
    expect(metaReads).toBe(1);
    expect(r2Reads).toBe(2);
    expect(await r2.text()).toContain('ok');
  });

  test('公开资产：第二次命中边缘缓存，不再读 R2，也不读 meta', async () => {
    const env = createEnv();
    await seed(env);
    await env.BUCKET.put('proto/p1/app.js', new TextEncoder().encode('ok()').buffer,
      { httpMetadata: { contentType: 'application/javascript' } });

    let metaReads = 0, r2Reads = 0;
    const realGet = env.STATS.get.bind(env.STATS);
    env.STATS.get = async (k, ...a) => { if (k === 'proto:p1') metaReads++; return realGet(k, ...a); };
    const realR2 = env.BUCKET.get.bind(env.BUCKET);
    env.BUCKET.get = async (k) => { r2Reads++; return realR2(k); };

    const path = '_s0-1/app.js';
    const r1 = await serveProto(env, 'p1', path, req(path), ctx);
    expect(r1.headers.get('X-Cache')).toBe('MISS');
    // 策略缓存与资产缓存都经 waitUntil 异步落盘，等一拍再测稳态
    await new Promise(r => setTimeout(r, 20));
    metaReads = 0; r2Reads = 0;       // 只统计热路径这一跳
    const r2 = await serveProto(env, 'p1', path, req(path), ctx);
    expect(r2.headers.get('X-Cache')).toBe('HIT');
    expect(r2Reads).toBe(0);            // 命中边缘缓存 → 不碰 R2
    expect(metaReads).toBe(0);          // 命中策略缓存 → 不碰 D1
    expect(await r2.text()).toBe('ok()');
    expect(r2.headers.get('Cache-Control')).toBe('public, max-age=86400');
  });

  test('私有原型不缓存且签名错误会被拒', async () => {
    const env = createEnv();
    await seed(env, { isPrivate: true });

    // 入口：无属主 token → 403
    const r0 = await serveProto(env, 'p1', '', req(''), ctx);
    expect(r0.status).toBe(403);

    // 直接猜版本化路径：签名对不上 → 302 回入口（再被 403）
    const bad = await serveProto(env, 'p1', '_sdeadbeef-1/index.html', req('_sdeadbeef-1/index.html'), ctx);
    expect(bad.status).toBe(302);
    expect(bad.headers.get('Location')).toBe('/proto/p1/');
    expect(globalThis.caches._store.size).toBe(0);
  });

  test('带密码原型不缓存（公开读也要先过密码）', async () => {
    const env = createEnv();
    await seed(env, { password: '123456' });

    const r1 = await serveProto(env, 'p1', '', req(''), ctx);
    expect(r1.status).toBe(403);
    expect(globalThis.caches._store.size).toBe(0);

    // 伪造签名直连资产：302 回入口重新走密码流程
    const bad = await serveProto(env, 'p1', '_sdeadbeef-1/app.js', req('_sdeadbeef-1/app.js'), ctx);
    expect(bad.status).toBe(302);
  });

  test('密码正确后 302 到签名 URL，签名 URL 可读资产，改密码后立刻失效', async () => {
    const env = createEnv();
    await seed(env, { password: '123456' });
    await env.BUCKET.put('proto/p1/app.js', new TextEncoder().encode('ok()').buffer,
      { httpMetadata: { contentType: 'application/javascript' } });

    // 提交正确密码 → 302 回入口（带 cookie）→ 入口再 302 到签名 URL
    const submit = await serveProto(env, 'p1', '', req('?pwd=123456'), ctx);
    expect(submit.status).toBe(302);
    const entry = await serveProto(env, 'p1', '', new Request('http://localhost/proto/p1/', {
      headers: { Cookie: 'onimg_proto_p1=123456' },
    }), ctx);
    expect(entry.status).toBe(302);
    const loc = entry.headers.get('Location');
    expect(loc).toMatch(/^\/proto\/p1\/_s[0-9a-f]{16}-1\/index\.html$/);

    // 签名 URL 可读资产
    const assetPath = loc.slice('/proto/p1/'.length).replace('index.html', 'app.js');
    const asset = await serveProto(env, 'p1', assetPath, req(assetPath), ctx);
    expect(asset.status).toBe(200);
    expect(await asset.text()).toBe('ok()');

    // 改密码：meta 变化 → 旧签名立刻失效（实时判定）
    const meta = JSON.parse(await env.STATS.get('proto:p1'));
    meta.accessPassword = '654321';
    await env.STATS.put('proto:p1', JSON.stringify(meta));
    const stale = await serveProto(env, 'p1', assetPath, req(assetPath), ctx);
    expect(stale.status).toBe(302);
    expect(stale.headers.get('Location')).toBe('/proto/p1/');
  });

  test('重新上传（version 变化）→ 新 URL；旧 URL 缓存键不同', async () => {
    const env = createEnv();
    await seed(env, { updatedAt: 1000, version: 1, body: '<html><body>旧</body></html>' });
    const loc1 = await versionUrl(env);
    expect(loc1).toContain('_s0-1/');

    await seed(env, { updatedAt: 2000, version: 2, body: '<html><body>新</body></html>' });
    const loc2 = await versionUrl(env);
    expect(loc2).toContain('_s0-2/');
    expect(loc2).not.toBe(loc1);

    // 旧版本化 URL 读到的是新内容（R2 已被覆盖）—— 正确性由 URL 更迭保证
    const r = await serveProto(env, 'p1', '_s0-1/index.html', req('_s0-1/index.html'), ctx);
    expect(await r.text()).toContain('新');
  });

  test('改标题（updatedAt 变、version 不变）不再让资产缓存失效', async () => {
    const env = createEnv();
    await seed(env);
    await env.BUCKET.put('proto/p1/app.js', new TextEncoder().encode('ok()').buffer,
      { httpMetadata: { contentType: 'application/javascript' } });

    const path = '_s0-1/app.js';
    await serveProto(env, 'p1', path, req(path), ctx);   // 填充缓存
    const meta = JSON.parse(await env.STATS.get('proto:p1'));
    meta.title = '改个标题'; meta.updatedAt = 9999;
    await env.STATS.put('proto:p1', JSON.stringify(meta));

    let r2Reads = 0;
    const realR2 = env.BUCKET.get.bind(env.BUCKET);
    env.BUCKET.get = async (k) => { r2Reads++; return realR2(k); };

    // URL 没变（version 没变）→ 缓存键没变 → 命中
    const hit = await serveProto(env, 'p1', path, req(path), ctx);
    expect(hit.headers.get('X-Cache')).toBe('HIT');
    expect(r2Reads).toBe(0);
  });

  test('404 负缓存：第二次探测不再读 R2', async () => {
    const env = createEnv();
    await seed(env);

    const path = '_s0-1/shouldShowSitemapHint';
    let r2Reads = 0;
    const realR2 = env.BUCKET.get.bind(env.BUCKET);
    env.BUCKET.get = async (k) => { r2Reads++; return realR2(k); };

    const r1 = await serveProto(env, 'p1', path, req(path), ctx);
    expect(r1.status).toBe(404);
    // waitUntil 是异步落缓存，等一拍
    await new Promise(r => setTimeout(r, 10));
    const r2 = await serveProto(env, 'p1', path, req(path), ctx);
    expect(r2.status).toBe(404);
    expect(r2.headers.get('X-Cache')).toBe('HIT');
    expect(r2Reads).toBe(1);
  });

  test('If-None-Match 命中回 304', async () => {
    const env = createEnv();
    await seed(env);
    await env.BUCKET.put('proto/p1/app.js', new TextEncoder().encode('ok()').buffer,
      { httpMetadata: { contentType: 'application/javascript' } });

    const path = '_s0-1/app.js';
    const r1 = await serveProto(env, 'p1', path, req(path), ctx);
    const etag = r1.headers.get('ETag');
    expect(etag).toBe('"1"');

    const r2 = await serveProto(env, 'p1', path, req(path, {
      headers: { 'If-None-Match': etag },
    }), ctx);
    expect(r2.status).toBe(304);
  });

  test('没有 Cache API 时行为不变', async () => {
    delete globalThis.caches;
    const env = createEnv();
    await seed(env);
    await env.BUCKET.put('proto/p1/app.js', new TextEncoder().encode('ok()').buffer,
      { httpMetadata: { contentType: 'application/javascript' } });
    const res = await serveProto(env, 'p1', '_s0-1/app.js', req('_s0-1/app.js'), ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cache')).toBe('MISS');
    expect(await res.text()).toBe('ok()');
  });

  test('入口路径上的旧式直链 302 到版本化路径（URL 兼容）', async () => {
    const env = createEnv();
    await seed(env);
    const r = await serveProto(env, 'p1', 'index.html', req('index.html'), ctx);
    expect(r.status).toBe(302);
    expect(r.headers.get('Location')).toBe('/proto/p1/_s0-1/index.html');
  });
});

// ═══ 安全回归：sig='0' 绝不能成为私有原型的后门 ═══════════════════════════
// 上线后实测发现的越权：版本号可以枚举（_s0-1、_s0-2…），
// 最初实现里 sig='0' 被无条件放行 —— 于是任何人用 `_s0-1/start.html`
// 就能读到私有原型的完整内容。下面这组用例锁死这个行为。
describe('安全：版本化路径不得绕过私有 / 密码保护', () => {
  test('私有原型：猜 sig=0 直连 → 302 回入口，且不缓存', async () => {
    const env = createEnv();
    await seed(env, { isPrivate: true });

    for (const p of ['_s0-1/index.html', '_s0-2/index.html', '_s0-99/index.html']) {
      const res = await serveProto(env, 'p1', p, req(p), ctx);
      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toBe('/proto/p1/');
      expect(await res.text()).not.toContain('ok');
    }
    expect(globalThis.caches._store.size).toBe(0);
  });

  test('带密码原型：猜 sig=0 直连 → 302 回入口', async () => {
    const env = createEnv();
    await seed(env, { password: '123456' });

    const res = await serveProto(env, 'p1', '_s0-1/app.js', req('_s0-1/app.js'), ctx);
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/proto/p1/');
  });

  test('私有原型的策略缓存永不写入（否则 5 分钟内会持续放行）', async () => {
    const env = createEnv();
    await seed(env, { isPrivate: true });

    await serveProto(env, 'p1', '_s0-1/index.html', req('_s0-1/index.html'), ctx);
    await new Promise(r => setTimeout(r, 20));

    // 策略缓存键形如 /__proto-policy/p1
    const keys = [...globalThis.caches._store.keys()];
    expect(keys.filter(k => k.includes('__proto-policy'))).toHaveLength(0);
  });

  test('公开 → 转私有：旧链接最多被策略缓存放行到 TTL 到期', async () => {
    const env = createEnv();
    await seed(env, { isPrivate: false });

    // 公开时正常读取，同时写入策略缓存
    const ok = await serveProto(env, 'p1', '_s0-1/index.html', req('_s0-1/index.html'), ctx);
    expect(ok.status).toBe(200);
    await new Promise(r => setTimeout(r, 20));

    // 转私有
    const meta = JSON.parse(await env.STATS.get('proto:p1'));
    meta.isPrivate = true;
    await env.STATS.put('proto:p1', JSON.stringify(meta));

    // 策略缓存还在 → 仍放行（这是已知的 5 分钟窗口，HTML 本身 no-store）
    const still = await serveProto(env, 'p1', '_s0-1/index.html', req('_s0-1/index.html'), ctx);
    expect(still.status).toBe(200);

    // 清掉策略缓存后（模拟 TTL 到期）→ 立刻落回访问控制
    for (const k of [...globalThis.caches._store.keys()]) {
      if (k.includes('__proto-policy')) globalThis.caches._store.delete(k);
    }
    const denied = await serveProto(env, 'p1', '_s0-1/index.html', req('_s0-1/index.html'), ctx);
    expect(denied.status).toBe(302);
    expect(denied.headers.get('Location')).toBe('/proto/p1/');
  });

  test('公开原型的资产仍走缓存（策略缓存不削弱性能收益）', async () => {
    const env = createEnv();
    await seed(env);
    await env.BUCKET.put('proto/p1/app.js', new TextEncoder().encode('ok()').buffer,
      { httpMetadata: { contentType: 'application/javascript' } });

    const path = '_s0-1/app.js';
    await serveProto(env, 'p1', path, req(path), ctx);
    await new Promise(r => setTimeout(r, 20));

    let metaReads = 0;
    const realGet = env.STATS.get.bind(env.STATS);
    env.STATS.get = async (k, ...a) => { if (k === 'proto:p1') metaReads++; return realGet(k, ...a); };

    const hit = await serveProto(env, 'p1', path, req(path), ctx);
    expect(hit.headers.get('X-Cache')).toBe('HIT');
    expect(metaReads).toBe(0);
  });
});
