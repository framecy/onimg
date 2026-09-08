import { describe, test, expect, beforeEach } from 'vitest';
import { handleUpload } from '../../src/upload.js';
import { createToken } from '../../src/admin/auth.js';
import { createEnv, createTestUser } from '../helpers/mock-env.js';

// ── 流式直传路径（CLI --data-binary / Typora 脚本，带 Content-Length） ─────────

async function makeAuthedEnv() {
  const env = createEnv();
  await createTestUser(env, 'alice', 'pass', { canUpload: true });
  const token = await createToken({ type: 'user', username: 'alice' }, 3600_000, env.TOKEN_SECRET);
  return { env, token };
}

describe('Streaming upload (raw body with Content-Length)', () => {
  let env, token;
  beforeEach(async () => {
    ({ env, token } = await makeAuthedEnv());
  });

  test('stores the file and reports real byte size', async () => {
    const bytes = new Uint8Array(4096).fill(0xab);
    const req = new Request('http://localhost/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'image/png',
        'Content-Length': String(bytes.byteLength),
      },
      body: bytes.buffer,
    });
    const res = await handleUpload(req, env);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.size).toBe(4096);
    expect(body.type).toBe('image/png');

    const stored = await env.BUCKET.get(body.key);
    expect(stored).not.toBeNull();
  });

  test('response size matches Content-Length declaration', async () => {
    const bytes = new Uint8Array(1024).fill(1);
    const req = new Request('http://localhost/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'image/jpeg',
        'Content-Length': '1024',
      },
      body: bytes.buffer,
    });
    const res = await handleUpload(req, env);
    const body = await res.json();
    expect(body.size).toBe(1024);
    // KV 元数据里的 size 与响应一致（供用户列表/用量统计使用）
    const meta = await env.STATS.get('imgmeta:' + body.key);
    expect(meta).not.toBeNull();
  });

  test('rejects oversize streaming upload before consuming body (413)', async () => {
    const req = new Request('http://localhost/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'image/jpeg',
        'Content-Length': String(11 * 1048576),
      },
      body: new Uint8Array(1024).buffer, // 实际字节远小于声明，413 必须在读取前触发
    });
    const res = await handleUpload(req, env);
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body.error).toContain('too large');
  });

  test('no Content-Length → falls back to buffered path (still works)', async () => {
    // undici/测试环境不会自动补 Content-Length；缺省时应退回 arrayBuffer 路径
    const bytes = new Uint8Array(2048).fill(2);
    const req = new Request('http://localhost/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/webp' },
      body: bytes.buffer,
    });
    const res = await handleUpload(req, env);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.size).toBe(2048);
  });
});
