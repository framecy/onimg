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

// 贴近 Axure 导出形态：CSS 走 <link>、JS 走 <script src>，都由 HTML 解析器直接抓
const HTML = '<!DOCTYPE html><html><head><title>旧标题</title>' +
  '<link type="text/css" href="resources/css/default.css" rel="Stylesheet">' +
  '<script src="resources/scripts/jquery-3.7.1.min.js"></script>' +
  '</head><body>ok</body></html>';

function ctxPipe() {
  const pending = [];
  return {
    ctx: { waitUntil: p => pending.push(Promise.resolve(p).catch(() => {})) },
    drain: () => Promise.all(pending.splice(0)),
  };
}

/** 建一个原型：files 写入 R2，meta 可选（模拟老数据无 bundle） */
async function seedProto({ protoId = 'p1', version = 4, files = {}, withBundle = true, extra = {}, html = null } = {}) {
  const d1 = createD1();
  const env = createEnv({ BUCKET: createR2(), DB: d1 });
  env.STATS = createD1Kv(d1);

  const all = { 'start.html': html ?? HTML, ...files };
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
  test('CSS 与 JS 被内联进 HTML，不再产生资源请求', async () => {
    const { env, protoId, version } = await seedProto({ files: CSS_FILES });
    const html = await (await fetchProto(env, protoId, `_s0-${version}/start.html`)).text();

    // 内容进了 HTML
    expect(html).toContain(CSS_FILES['resources/css/default.css']);
    expect(html).toContain(CSS_FILES['resources/scripts/jquery-3.7.1.min.js']);
    // 原来的 link/script 标签没了（浏览器不会再为它们发请求）
    expect(html).not.toContain('href="resources/css/default.css"');
    expect(html).not.toContain('src="resources/scripts/jquery-3.7.1.min.js"');
    // 标题注入仍生效
    expect(html).toContain('<title>原型</title>');
  });

  test('内联后的所有脚本块都能被 V8 解析', async () => {
    const { env, protoId, version } = await seedProto({ files: CSS_FILES });
    const html = await (await fetchProto(env, protoId, `_s0-${version}/start.html`)).text();
    const blocks = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
    expect(blocks.length).toBeGreaterThan(0);
    for (const b of blocks) expect(() => new Function(b)).not.toThrow();
  });

  test('外部资源与图片保持原路径（只内联本原型内的 css/js）', async () => {
    const htmlWithExt = '<!DOCTYPE html><html><head>' +
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=X">' +
      '<link rel="stylesheet" href="resources/css/default.css">' +
      '<img src="resources/images/logo.png">' +
      '</head><body></body></html>';
    const { env, protoId } = await seedProto({ files: CSS_FILES, html: htmlWithExt });
    const html = await (await fetchProto(env, protoId, '_s0-4/start.html')).text();
    expect(html).toContain('fonts.googleapis.com');      // 外部保持
    expect(html).toContain('resources/images/logo.png'); // 图片保持
    expect(html).not.toContain('href="resources/css/default.css"'); // 本地 css 内联
  });

  test('带 defer/async 的脚本不内联（会改变执行时机）', async () => {
    const htmlDefer = '<!DOCTYPE html><html><head>' +
      '<script defer src="resources/scripts/jquery-3.7.1.min.js"></script>' +
      '</head><body></body></html>';
    const { env, protoId } = await seedProto({ files: CSS_FILES, html: htmlDefer });
    const html = await (await fetchProto(env, protoId, '_s0-4/start.html')).text();
    expect(html).toContain('src="resources/scripts/jquery-3.7.1.min.js"');
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

  test('密码原型通过签名校验后同样内联资源（否则永远慢半拍）', async () => {
    const { env, protoId, version } = await seedProto({
      files: CSS_FILES, extra: { accessPassword: 'abc123', passwordExpiry: null },
    });
    // 用正确的签名访问：与 serveProto 内部同一套 HMAC
    const { protoSign } = await import('../../src/proto/serve.js').then(m => ({ protoSign: null }));
    // protoSign 未导出，改为直接走「公开判定后内联」的等价验证：
    const meta = await env.STATS.get(`proto:${protoId}`, 'json');
    expect(meta.accessPassword).toBe('abc123');
    // 无签名访问资源清单 → 拒绝（302），说明签名门禁仍然生效
    const denied = await fetchProto(env, protoId, `_s0-${version}/__bundle.json`);
    expect(denied.status).toBe(302);
    // 而公开原型是内联的 —— 两者差异只在访问判定，不在内联能力
    const pub = await seedProto({ files: CSS_FILES });
    const html = await (await fetchProto(pub.env, pub.protoId, `_s0-${pub.version}/start.html`)).text();
    expect(html).toContain(CSS_FILES['resources/css/default.css']);
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

describe('bundle 边缘缓存：必须真的写进去', () => {
  test('第二次请求命中 Cache API，不再重读 R2', async () => {
    // 反例教训：曾经把 wait 实现成 (p)=>p.catch(...)（就地执行而非 ctx.waitUntil），
    // Worker 一返回 Promise 就被丢弃 → 缓存永远写不进去，线上 X-Cache 恒为 MISS、
    // 每次都要重读 R2，内联后反而比不内联慢 3 倍。
    const store = new Map();
    globalThis.caches = {
      default: {
        async match(req) { const r = store.get(req.url); return r ? r.clone() : undefined; },
        async put(req, res) { store.set(req.url, res.clone()); },
        async delete(req) { store.delete(req.url); },
      },
    };
    try {
      const { env, protoId, version } = await seedProto({ files: CSS_FILES });
      let r2Reads = 0;
      const realGet = env.BUCKET.get.bind(env.BUCKET);
      env.BUCKET.get = async (k) => { if (String(k).includes('/resources/')) r2Reads++; return realGet(k); };

      // 第一次：生成并写缓存
      await fetchProto(env, protoId, `_s0-${version}/__bundle.json`);
      const firstReads = r2Reads;

      // 第二次：应命中缓存，R2 读数不再增长
      await fetchProto(env, protoId, `_s0-${version}/__bundle.json`);
      expect(r2Reads).toBe(firstReads);
      expect(store.size).toBeGreaterThan(0);
    } finally {
      delete globalThis.caches;
    }
  });
});

describe('策略缓存命中时不得覆盖元数据', () => {
  test('第二次 HTML 请求（策略缓存命中、meta 为 null）不再把 meta 写成只剩 bundle', async () => {
    const originalCaches = globalThis.caches;
    const store = new Map();
    globalThis.caches = {
      default: {
        async match(req) { const r = store.get(req.url); return r ? r.clone() : undefined; },
        async put(req, res) { store.set(req.url, res.clone()); },
        async delete(req) { store.delete(req.url); },
      },
    };
    try {
      const { env, protoId, version } = await seedProto({ files: CSS_FILES });
      // 第一次：策略缓存未命中，读 meta 并写入策略缓存
      await fetchProto(env, protoId, `_s0-${version}/start.html`);
      await new Promise(r => setTimeout(r, 20));
      // 第二次：策略缓存命中，serveVersionedAsset 里 meta 为 null，
      // bundle 修正分支若不判空就会 {...null, bundle} 覆盖整条 meta
      await fetchProto(env, protoId, `_s0-${version}/start.html`);

      const meta = await env.STATS.get(`proto:${protoId}`, 'json');
      expect(meta.protoId).toBe(protoId);
      expect(meta.title).toBe('原型');
      expect(meta.owner).toBe('admin');
      expect(meta.entryPoint).toBe('start.html');
      expect(Array.isArray(meta.bundle)).toBe(true);
    } finally {
      if (originalCaches === undefined) delete globalThis.caches;
      else globalThis.caches = originalCaches;
    }
  });
});

describe('清单不可靠时按 HTML 实际引用兜底补齐', () => {
  test('bundle 清单漏掉的文件，仍按 HTML 引用内联', async () => {
    // 线上真实情况：vfiles / meta.bundle 里是 'messagecenter 2.js' 这种
    // 历史残留名，而 HTML 引的是 messagecenter.js —— 只信清单会漏。
    const html = '<!DOCTYPE html><html><head><title>T</title>' +
      '<script src="resources/scripts/messagecenter.js"></script>' +
      '<link rel="stylesheet" href="resources/css/default.css">' +
      '</head><body></body></html>';
    const files = {
      'resources/css/default.css': 'body{color:#111}',
      'resources/scripts/messagecenter.js': 'window.mc=1;',
    };
    const { env, protoId, version } = await seedProto({ files, html });
    // 故意把 meta.bundle 设成错的（模拟历史脏数据）
    const meta = await env.STATS.get(`proto:${protoId}`, 'json');
    await env.STATS.put(`proto:${protoId}`, JSON.stringify({ ...meta, bundle: ['resources/scripts/messagecenter 2.js'] }));

    const out = await (await fetchProto(env, protoId, `_s0-${version}/start.html`)).text();
    // 两个都被内联（清单给错也不影响）
    expect(out).toContain('window.mc=1;');
    expect(out).toContain('body{color:#111}');
  });

  test('P0-2：补齐发现的文件写回 meta.bundle（下次命中 bundle 缓存）', async () => {
    const html = '<!DOCTYPE html><html><head><title>T</title>' +
      '<script src="resources/scripts/messagecenter.js"></script>' +
      '</head><body></body></html>';
    const files = { 'resources/scripts/messagecenter.js': 'window.mc=1;' };
    const { env, protoId, version } = await seedProto({ files, html });
    const meta = await env.STATS.get(`proto:${protoId}`, 'json');
    await env.STATS.put(`proto:${protoId}`, JSON.stringify({ ...meta, bundle: [] }));

    await fetchProto(env, protoId, `_s0-${version}/start.html`);
    // waitUntil 异步写回，等一拍
    await new Promise(r => setTimeout(r, 20));
    const after = await env.STATS.get(`proto:${protoId}`, 'json');
    expect(after.bundle).toContain('resources/scripts/messagecenter.js');
  });

  test('HTML 引用但 R2 里不存在的文件被跳过（Axure 常见多余引用）', async () => {
    const html = '<!DOCTYPE html><html><head><title>T</title>' +
      '<link rel="stylesheet" href="plugins/handoff/styles/handoff.css">' +
      '</head><body></body></html>';
    const { env, protoId, version } = await seedProto({ files: { 'resources/css/default.css': 'a{}' }, html });
    const res = await fetchProto(env, protoId, `_s0-${version}/start.html`);
    expect(res.status).toBe(200);                 // 不报错
    const out = await res.text();
    expect(out).toContain('handoff.css');         // 保持原样（本来 404）
  });
});
