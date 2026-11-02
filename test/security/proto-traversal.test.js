import { describe, test, expect } from 'vitest';
import { serveProto } from '../../src/proto/serve.js';
import { createEnv } from '../helpers/mock-env.js';

// 回归测试：prototype 静态服务的路径遍历防护（src/proto/serve.js）。
// 修复前，`GET /proto/{id}/../other/secret.html` 会拼出 R2 键
// `proto/{id}/../other/secret.html`，从而跨原型读取文件、绕过密码保护。

async function seedProto(env, protoId) {
  await env.STATS.put(`proto:${protoId}`, JSON.stringify({
    protoId,
    title: '',
    owner: 'alice',
    entryPoint: 'index.html',
    fileCount: 1,
    totalSize: 8,
    version: 1,
    versions: [{ v: 1, at: Date.now(), files: 1, size: 8 }],
    isPrivate: false,
  }));
  await env.BUCKET.put(
    `proto/${protoId}/index.html`,
    new TextEncoder().encode('<html><body>ok</body></html>').buffer,
    { httpMetadata: { contentType: 'text/html' } },
  );
}

describe('Proto serve: path traversal protection', () => {
  test('blocks ../ traversal escaping to another proto', async () => {
    const env = createEnv();
    await seedProto(env, 'id1');
    await env.BUCKET.put(
      'proto/victim/secret.html',
      new TextEncoder().encode('<html><body>SECRET</body></html>').buffer,
      { httpMetadata: { contentType: 'text/html' } },
    );

    const req = new Request('http://localhost/proto/id1/../victim/secret.html');
    const res = await serveProto(env, 'id1', '../victim/secret.html', req);
    expect(res.status).toBe(404);
  });

  test('blocks percent-encoded traversal (%2e%2e)', async () => {
    const env = createEnv();
    await seedProto(env, 'id1');

    const req = new Request('http://localhost/proto/id1/%2e%2e/victim/secret.html');
    const res = await serveProto(env, 'id1', '%2e%2e/victim/secret.html', req);
    expect(res.status).toBe(404);
  });

  test('blocks absolute path', async () => {
    const env = createEnv();
    await seedProto(env, 'id1');

    const req = new Request('http://localhost/proto/id1//etc/passwd');
    const res = await serveProto(env, 'id1', '/etc/passwd', req);
    expect(res.status).toBe(404);
  });

  test('still serves legitimate files', async () => {
    const env = createEnv();
    await seedProto(env, 'id1');

    // 入口路径 302 到版本化 URL（/proto/{id}/_s0-1/…），再读才是 200
    const req = new Request('http://localhost/proto/id1/index.html');
    const res = await serveProto(env, 'id1', 'index.html', req);
    expect(res.status).toBe(302);
    const loc = res.headers.get('Location');
    expect(loc).toMatch(/^\/proto\/id1\/_s0-1\/index\.html$/);

    const res2 = await serveProto(env, 'id1', loc.slice('/proto/id1/'.length),
      new Request('http://localhost' + loc));
    expect(res2.status).toBe(200);
    const body = await res2.text();
    expect(body).toContain('ok');
  });

  test('版本化路径同样拦截遍历（不因多一层前缀而放松）', async () => {
    const env = createEnv();
    await seedProto(env, 'id1');

    const res = await serveProto(env, 'id1', '_s0-1/../../victim/secret.html',
      new Request('http://localhost/proto/id1/_s0-1/../../victim/secret.html'));
    expect(res.status).toBe(404);

    const res2 = await serveProto(env, 'id1', '_s0-1/%2e%2e/victim/secret.html',
      new Request('http://localhost/proto/id1/_2e%2e%2e/x'));
    expect(res2.status).toBe(404);
  });
});
