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

    const req = new Request('http://localhost/proto/id1/index.html');
    const res = await serveProto(env, 'id1', 'index.html', req);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('ok');
  });
});
