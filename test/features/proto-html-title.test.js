import { describe, test, expect } from 'vitest';
import { serveProto } from '../../src/proto/serve.js';
import { createEnv } from '../helpers/mock-env.js';

// 回归测试：标题注入不能改坏文件。
// serveProto 会给 HTML 注入原型标题，做法是 decode → 替换 → 重新编码。
// TextDecoder 默认有损：非 UTF-8 字节变成 U+FFFD 后再编码回去，文件就被永久改坏。
// 900 文件回环测试就是这么发现 162 个 .html 的字节与源文件不一致的。

async function seed(env, { body, gzip = false }) {
  // mock 的 R2 .arrayBuffer() 只认 ArrayBuffer/TypedArray，传字符串会拿到空 buffer
  if (typeof body === 'string') body = new TextEncoder().encode(body).buffer;
  const meta = {
    protoId: 'p1', title: '我的原型', owner: 'alice', entryPoint: 'index.html',
    fileCount: 1, totalSize: 10, version: 1, versions: [{ v: 1, at: Date.now(), files: 1, size: 10 }],
    isPrivate: false,
  };
  await env.STATS.put('proto:p1', JSON.stringify(meta));
  await env.BUCKET.put('proto/p1/index.html', body, {
    httpMetadata: { contentType: 'text/html', ...(gzip ? { contentEncoding: 'gzip' } : {}) },
  });
  return meta;
}

const req = () => new Request('http://localhost/proto/p1/index.html');

describe('原型 HTML 标题注入', () => {
  test('UTF-8 的 HTML 会被注入标题', async () => {
    const env = createEnv();
    await seed(env, { body: '<html><head><title>Untitled Document</title></head><body>正文</body></html>' });
    const res = await serveProto(env, 'p1', 'index.html', req());
    const text = await res.text();
    expect(text).toContain('<title>我的原型</title>');
    expect(text).toContain('正文');
  });

  test('没有 <title> 时插到 <head> 后面', async () => {
    const env = createEnv();
    await seed(env, { body: '<html><head><meta charset="utf-8"></head><body>x</body></html>' });
    const text = await (await serveProto(env, 'p1', 'index.html', req())).text();
    expect(text).toContain('<head><title>我的原型</title>');
  });

  test('非 UTF-8 的 .html 原样返回，一个字节都不改', async () => {
    const env = createEnv();
    // GBK 的「中文」= D6 D0 CE C4，在 UTF-8 下非法
    const bytes = new Uint8Array([0x3c, 0x68, 0x74, 0x6d, 0x6c, 0x3e, 0xd6, 0xd0, 0xce, 0xc4, 0x3c, 0x2f, 0x68, 0x74, 0x6d, 0x6c, 0x3e]);
    await seed(env, { body: bytes.buffer });
    const res = await serveProto(env, 'p1', 'index.html', req());
    expect(res.status).toBe(200);
    const got = new Uint8Array(await res.arrayBuffer());
    expect(Array.from(got)).toEqual(Array.from(bytes));
  });

  test('二进制内容但扩展名是 .html 时同样不改字节', async () => {
    const env = createEnv();
    const bytes = new Uint8Array(256).map((_, i) => (i * 37) % 256);   // 含大量非法 UTF-8
    await seed(env, { body: bytes.buffer });
    const got = new Uint8Array(await (await serveProto(env, 'p1', 'index.html', req())).arrayBuffer());
    expect(got.length).toBe(bytes.length);
    expect(Array.from(got.slice(0, 32))).toEqual(Array.from(bytes.slice(0, 32)));
  });
});
