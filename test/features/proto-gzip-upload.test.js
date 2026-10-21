import { describe, test, expect, beforeEach } from 'vitest';
import { gzipSync, gunzipSync } from 'node:zlib';
import {
  handleProtoUploadInit,
  handleProtoFileBatch,
  handleProtoFinalize,
} from '../../src/proto/upload.js';
import { serveProto } from '../../src/proto/serve.js';
import { createEnv, createRequest } from '../helpers/mock-env.js';

// 上行压缩（浏览器端 gzip → R2 原样存 → 回放带 Content-Encoding: gzip）。
// 这批断言的目的：压缩标记一旦丢失，原型在浏览器里就是一堆乱码，所以
// 「存进去的字节 / 放出来的头」必须成对验证。

const OWNER = 'alice';

function batchForm(protoId, entries) {
  // entries: [path, bytes, enc]
  const fd = new FormData();
  fd.append('protoId', protoId);
  for (const [path, bytes, enc] of entries) {
    fd.append('paths[]', path);
    fd.append('enc[]', enc ?? '');
    fd.append('files[]', new Blob([bytes]), path);
  }
  return new Request('http://localhost/upload/proto/files', { method: 'POST', body: fd });
}

async function startSession(env) {
  const res = await handleProtoUploadInit(createRequest('POST', 'http://localhost/upload/proto/init', {
    body: { title: 'Demo', entryPoint: 'index.html', totalSize: 100 },
  }), env, OWNER);
  return (await res.json()).protoId;
}

describe('原型上行 gzip 压缩', () => {
  let env;
  beforeEach(() => { env = createEnv(); });

  test('enc=gzip 的文件原样存 gzip 字节并记下标记', async () => {
    const protoId = await startSession(env);
    const src = Buffer.from('console.log("压缩我");'.repeat(200));
    const gz = gzipSync(src);
    const res = await handleProtoFileBatch(
      batchForm(protoId, [['js/app.js', gz, 'gzip']]), env, OWNER,
    );
    expect((await res.json()).uploaded).toBe(1);

    const obj = await env.BUCKET.get(`proto/${protoId}/js/app.js`);
    expect(obj.customMetadata?.ce).toBe('gzip');
    expect(obj.httpMetadata.contentType).toBe('application/javascript');
    // 存的就是压缩字节（体积明显小于原文）
    expect(obj.size).toBe(gz.length);
    expect(obj.size).toBeLessThan(src.length);
  });

  test('普通文件的回放不带 Content-Encoding', async () => {
    const protoId = await startSession(env);
    await handleProtoFileBatch(batchForm(protoId, [['a.css', 'body{}', '']]), env, OWNER);
    await handleProtoFinalize(createRequest('POST', 'http://localhost/upload/proto/finalize', {
      body: { protoId, filePaths: ['index.html', 'a.css'] },
    }), env, OWNER);
    const res = await serveProto(env, protoId, 'a.css', new Request('http://localhost/proto/x/a.css'));
    expect(res.headers.get('Content-Encoding')).toBeNull();
    expect(await res.text()).toBe('body{}');
  });

  test('压缩过的静态资源回放时带 Content-Encoding: gzip', async () => {
    const protoId = await startSession(env);
    const src = Buffer.from('body{color:red}'.repeat(300));
    await handleProtoFileBatch(batchForm(protoId, [['css/site.css', gzipSync(src), 'gzip']]), env, OWNER);
    await handleProtoFinalize(createRequest('POST', 'http://localhost/upload/proto/finalize', {
      body: { protoId, filePaths: ['index.html', 'css/site.css'] },
    }), env, OWNER);

    const res = await serveProto(env, protoId, 'css/site.css', new Request('http://localhost/proto/x/css/site.css', { headers: { 'Accept-Encoding': 'gzip' } }));
    // 回放一律明文：压缩只用于上行，响应交给 Cloudflare 自己协商压缩
    expect(res.headers.get('Content-Encoding')).toBeNull();
    expect(await res.text()).toBe(src.toString());
  });

  test('压缩过的 HTML 仍能注入标题并返回明文', async () => {
    const protoId = await startSession(env);
    const html = '<html><head><title>Untitled Document</title></head><body>hi</body></html>';
    await handleProtoFileBatch(
      batchForm(protoId, [['index.html', gzipSync(Buffer.from(html)), 'gzip']]), env, OWNER,
    );
    await handleProtoFinalize(createRequest('POST', 'http://localhost/upload/proto/finalize', {
      body: { protoId, filePaths: ['index.html'] },
    }), env, OWNER);

    const res = await serveProto(env, protoId, 'index.html', new Request('http://localhost/proto/x/index.html'));
    expect(res.headers.get('Content-Encoding')).toBeNull();
    const text = await res.text();
    expect(text).toContain('<title>Demo</title>');
    expect(text).toContain('<body>hi</body>');
  });

  test('enc[] 与 paths[]/files[] 对齐，混批时各取各的标记', async () => {
    const protoId = await startSession(env);
    const js = gzipSync(Buffer.from('var a=1;'.repeat(100)));
    await handleProtoFileBatch(batchForm(protoId, [
      ['a.js', js, 'gzip'],
      ['b.png', new Uint8Array([0x89, 0x50]), ''],
    ]), env, OWNER);

    expect((await env.BUCKET.get(`proto/${protoId}/a.js`)).customMetadata?.ce).toBe('gzip');
    expect((await env.BUCKET.get(`proto/${protoId}/b.png`)).customMetadata?.ce).toBeUndefined();
  });
  test('R2 元数据丢失时靠 gzip magic 兜底（线上踩过的坑）', async () => {
    // 线上实测：流式 put 的 customMetadata 会丢，回放就成了「压缩字节当 JS 用」
    // → 原型白屏。这里模拟「只有 gzip 字节、没有任何标记」的历史对象。
    const protoId = await startSession(env);
    const src = Buffer.from('var a=1;\n'.repeat(100));
    const gz = gzipSync(src);
    await env.BUCKET.put(`proto/${protoId}/legacy.js`, gz, {
      httpMetadata: { contentType: 'application/javascript', cacheControl: 'public, max-age=31536000' },
    });
    await handleProtoFinalize(createRequest('POST', 'http://localhost/upload/proto/finalize', {
      body: { protoId, filePaths: ['index.html', 'legacy.js'] },
    }), env, OWNER);

    const res = await serveProto(env, protoId, 'legacy.js', new Request('http://localhost/proto/x/legacy.js', { headers: { 'Accept-Encoding': 'gzip' } }));
    expect(await res.text()).toBe(src.toString());
  });

  test('只有 httpMetadata.contentEncoding 也能正确回放', async () => {
    const protoId = await startSession(env);
    const src = Buffer.from('body{color:#333}'.repeat(200));
    await env.BUCKET.put(`proto/${protoId}/only-ce.css`, gzipSync(src), {
      httpMetadata: { contentType: 'text/css', contentEncoding: 'gzip' },
    });
    await handleProtoFinalize(createRequest('POST', 'http://localhost/upload/proto/finalize', {
      body: { protoId, filePaths: ['index.html', 'only-ce.css'] },
    }), env, OWNER);

    const res = await serveProto(env, protoId, 'only-ce.css', new Request('http://localhost/proto/x/only-ce.css', { headers: { 'Accept-Encoding': 'gzip' } }));
    expect(await res.text()).toBe(src.toString());
  });

  test('图片等二进制不做 magic 嗅探，避免误判', async () => {
    const protoId = await startSession(env);
    // 一个恰好以 1f 8b 开头的 PNG（真实 PNG 不可能，但用来验证扩展名白名单）
    await env.BUCKET.put(`proto/${protoId}/pic.png`, new Uint8Array([0x1f, 0x8b, 0x00, 0x01]), {});
    await handleProtoFinalize(createRequest('POST', 'http://localhost/upload/proto/finalize', {
      body: { protoId, filePaths: ['index.html', 'pic.png'] },
    }), env, OWNER);
    const res = await serveProto(env, protoId, 'pic.png', new Request('http://localhost/proto/x/pic.png'));
    expect(res.headers.get('Content-Encoding')).toBeNull();
  });
  test('回放一律明文（不再依赖 Content-Encoding 协商）', async () => {
    // Cloudflare 会把没有协商 gzip 的响应的 Content-Encoding 头剥掉，
    // body 却仍是压缩字节 —— 那类客户端（CLI / 抓取工具）会读到乱码。
    const protoId = await startSession(env);
    const src = Buffer.from('var b=2;\n'.repeat(120));
    await env.BUCKET.put(`proto/${protoId}/plain.js`, gzipSync(src), {
      httpMetadata: { contentType: 'application/javascript', contentEncoding: 'gzip' },
    });
    await handleProtoFinalize(createRequest('POST', 'http://localhost/upload/proto/finalize', {
      body: { protoId, filePaths: ['index.html', 'plain.js'] },
    }), env, OWNER);

    const res = await serveProto(env, protoId, 'plain.js', new Request('http://localhost/proto/x/plain.js'));
    expect(res.headers.get('Content-Encoding')).toBeNull();
    expect(await res.text()).toBe(src.toString());
  });
});
