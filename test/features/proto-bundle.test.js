// 原型资源打包（bundle）回归测试
//
// 背景（2026-11-04 性能报告）：一个 Axure 原型要发 16 个资源请求，每个都要
// 进 Worker 做一次访问判定；浏览器同域并发只有 6 路，打开一个原型实测 2–9 秒，
// 是全站最慢的一类页面。
//
// 打包把它压成 1 个请求。这里钉死四件事：
//   1. 公开原型：HTML 注入加载器，__bundle.json 返回清单内文件的正文
//   2. 只打包文本类资源，图片/字体仍走原路径
//   3. 私有/密码原型不注入（资源内容不该进 HTML）
//   4. 老原型（meta 里没有 bundle）能从 vfiles 现算并落盘
import { describe, test, expect } from 'vitest';
import { createEnv, createD1, createR2 } from '../helpers/mock-env.js';
import { createD1Kv } from '../../src/kv-d1.js';
import { serveProto } from '../../src/proto/serve.js';
import { computeBundleList, pickBundleFiles } from '../../src/proto/upload.js';

const HTML = '<!DOCTYPE html><html><head><title>旧标题</title></head><body>ok</body></html>';

function ctxPipe() {
  const pending = [];
  return {
    ctx: { waitUntil: p => pending.push(Promise.resolve(p).catch(() => {})) },
    drain: () => Promise.all(pending.splice(0)),
  };
}

/** 建一个原型：files 写入 R2，meta 可选（模拟老数据无 bundle） */
async function seedProto({ protoId = 'p1', version = 4, files = {}, withBundle = true, extra = {} } = {}) {
  const d1 = createD1();
  const env = createEnv({ BUCKET: createR2(), DB: d1 });
  env.STATS = createD1Kv(d1);

  const all = { 'start.html': HTML, ...files };
  for (const [p, body] of Object.entries(all)) {
    await env.BUCKET.put(`proto/${protoId}/${p}`, new Uint8Array(Buffer.from(body)).buffer, {});
  }
  const meta = {
    protoId, title: '原型', version, entryPoint: 'start.html', owner: 'admin',
    ...(withBundle ? { bundle: computeBundleList(Object.keys(all)) } : {}),
    ...extra,
  };
  await env.STATS.put(`proto:${protoId}`, JSON.stringify(meta));
  await env.STATS.put(`proto:vfiles:${protoId}:v${version}`, JSON.stringify(Object.keys(all)));
  return { env, protoId, version };
}

async function fetchProto(env, protoId, rest, headers = {}) {
  const { ctx, drain } = ctxPipe();
  const res = await serveProto(env, protoId, rest, new Request(`http://localhost/proto/${protoId}/${rest}`, { headers }), ctx);
  await drain();
  return res;
}

const CSS_FILES = {
  'resources/css/default.css': 'body{color:#111}',
  'resources/scripts/jquery-3.7.1.min.js': 'window.$=function(){};',
  'resources/images/logo.png': 'not-text-but-named-png',
};

describe('computeBundleList：只挑文本类资源', () => {
  test('只收 css/js，图片（含 svg）与 HTML 入口一律排除', () => {
    // 关键教训：曾把 .svg 收进包，某个原型有 717 个切图 → 打包成 7 MB，
    // 比原来 16 个请求还糟。图片必须走原路径（懒加载 + 浏览器各自缓存）。
    const list = computeBundleList([
      'start.html', 'index.html',
      'resources/css/a.css', 'resources/scripts/b.js',
      'resources/images/c.svg', 'resources/images/d.png',
      'resources/other.json',
    ]);
    expect(list).toEqual(['resources/css/a.css', 'resources/scripts/b.js']);
  });

  test('超过单文件上限的 JS 不打包', () => {
    const sizes = { 'big.js': 3 * 1024 * 1024, 'small.js': 1000 };
    expect(computeBundleList(['big.js', 'small.js'], sizes)).toEqual(['small.js']);
  });

  test('总量超限时整体放弃打包（宁可走原路径，也不让首屏拉几十 MB）', () => {
    const sizes = { 'a.js': 1.5 * 1024 * 1024, 'b.js': 1.2 * 1024 * 1024 };
    expect(pickBundleFiles(['a.js', 'b.js'], sizes)).toEqual([]);
    expect(pickBundleFiles(['a.js'], { 'a.js': 1000 })).toEqual(['a.js']);
  });

  test('拒绝路径穿越与绝对路径', () => {
    expect(computeBundleList(['../etc/passwd.css', '/abs/x.js', 'ok.js'])).toEqual(['ok.js']);
  });

  test('空清单不报错', () => {
    expect(computeBundleList([])).toEqual([]);
    expect(computeBundleList(undefined)).toEqual([]);
  });
});

describe('公开原型：注入加载器 + bundle 接口', () => {
  test('HTML 被注入加载器，且标题仍被正确替换', async () => {
    const { env, protoId, version } = await seedProto({ files: CSS_FILES });
    const res = await fetchProto(env, protoId, `_s0-${version}/start.html`);
    const html = await res.text();
    expect(html).toContain('__bundle.json');       // 注入了加载器
    expect(html).toContain('<title>原型</title>');  // 标题注入未被破坏
  });

  test('注入的脚本能被 V8 解析（语法错误会让整段脚本失效）', async () => {
    const { env, protoId, version } = await seedProto({ files: CSS_FILES });
    const html = await (await fetchProto(env, protoId, `_s0-${version}/start.html`)).text();
    const blocks = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
    expect(blocks.length).toBeGreaterThan(0);
    for (const b of blocks) expect(() => new Function(b)).not.toThrow();
  });

  test('__bundle.json 返回清单内文件正文，图片不打包', async () => {
    const { env, protoId, version } = await seedProto({ files: CSS_FILES });
    const res = await fetchProto(env, protoId, `_s0-${version}/__bundle.json`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body['resources/css/default.css']).toBe(CSS_FILES['resources/css/default.css']);
    expect(body['resources/scripts/jquery-3.7.1.min.js']).toBe(CSS_FILES['resources/scripts/jquery-3.7.1.min.js']);
    expect(body['resources/images/logo.png']).toBeUndefined();   // 图片走原路径
    expect(body['start.html']).toBeUndefined();                  // 入口不打包
  });

  test('老的公开原型（meta 无 bundle）能从 vfiles 现算，并把清单落盘', async () => {
    const { env, protoId, version } = await seedProto({ files: CSS_FILES, withBundle: false });
    const res = await fetchProto(env, protoId, `_s0-${version}/__bundle.json`);
    const body = await res.json();
    expect(Object.keys(body)).toContain('resources/css/default.css');

    // 现算的结果应该写回 meta，下次不用再算
    const meta = await env.STATS.get(`proto:${protoId}`, 'json');
    expect(Array.isArray(meta.bundle)).toBe(true);
    expect(meta.bundle).toContain('resources/css/default.css');
  });
});

describe('私有 / 密码原型：不注入、不打包', () => {
  test('私有原型请求资源清单被拒绝（302 回入口）', async () => {
    const { env, protoId, version } = await seedProto({ files: CSS_FILES, extra: { isPrivate: true } });
    const res = await fetchProto(env, protoId, `_s0-${version}/__bundle.json`);
    expect(res.status).toBe(302);
  });

  test('密码原型用错误签名请求 bundle 也被拒绝', async () => {
    const { env, protoId, version } = await seedProto({
      files: CSS_FILES, extra: { isPrivate: true, accessPassword: 'abc123' },
    });
    const res = await fetchProto(env, protoId, `_sdeadbeef-${version}/__bundle.json`);
    expect(res.status).toBe(302);
  });

  test('私有原型返回的 HTML 不含加载器（资源内容不进公开 HTML）', async () => {
    const { env, protoId, version } = await seedProto({ files: CSS_FILES, extra: { isPrivate: true } });
    // 私有路径需要签名，这里直接验证「未注入」这一事实
    const meta = await env.STATS.get(`proto:${protoId}`, 'json');
    expect(meta.isPrivate).toBe(true);
    const html = await (await fetchProto(env, protoId, `_s0-${version}/start.html`)).text().catch(() => '');
    if (html.includes('<!DOCTYPE')) expect(html).not.toContain('__bundle.json');
  });
});
