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

    const res = await serveProto(env, protoId, 'css/site.css', new Request('http://localhost/proto/x/css/site.css'));
    expect(res.headers.get('Content-Encoding')).toBe('gzip');
    const body = Buffer.from(await res.arrayBuffer());
    expect(gunzipSync(body).toString()).toBe(src.toString());
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
});
