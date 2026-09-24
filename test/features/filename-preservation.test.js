import { describe, test, expect, beforeEach } from 'vitest';
import { handleUpload, trackImage, sanitizeOriginalName, baseName, MAX_NAME_LEN } from '../../src/upload.js';
import { handleGet } from '../../src/get.js';
import { createToken } from '../../src/admin/auth.js';
import { createEnv, createTestUser } from '../helpers/mock-env.js';

// ── 原始文件名保留 ────────────────────────────────────────────────────────────
//
// 背景：此前 key 由「时间戳-随机串.扩展名」生成，原始文件名在进入 R2 前就被丢弃。
// 现在 key 保持不变（不派生自文件名，避免破坏已分享直链 / 同名覆盖 / URL 编码），
// 原名存入 imgmeta value + userimgs 条目 + R2 自定义元数据，并在响应与列表里返回。

const NOOP_CTX = { waitUntil: () => {} };

async function makeAuthedEnv() {
  const env = createEnv();
  await createTestUser(env, 'alice', 'pass', { canUpload: true });
  const token = await createToken({ type: 'user', username: 'alice' }, 3600_000, env.TOKEN_SECRET);
  return { env, token };
}

// multipart 上传（浏览器拖拽 / 粘贴路径）
function multipartRequest(token, name, mimeType = 'image/png', bytes = 2048) {
  const fd = new FormData();
  fd.append('file', new File([new Uint8Array(bytes).buffer], name, { type: mimeType }));
  return new Request('http://localhost/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
}

// raw-body 上传（CLI / Typora 脚本路径）
function rawRequest(token, headers = {}, bytes = 2048) {
  return new Request('http://localhost/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'image/png',
      'Content-Length': String(bytes),
      ...headers,
    },
    body: new Uint8Array(bytes).buffer,
  });
}

describe('Original filename is preserved', () => {
  let env, token;
  beforeEach(async () => {
    ({ env, token } = await makeAuthedEnv());
  });

  test('multipart: name comes back in response, KV, and R2 metadata', async () => {
    const res = await handleUpload(multipartRequest(token, '截图 2024-01-02.png'), env, NOOP_CTX);
    expect(res.status).toBe(201);
    const body = await res.json();

    expect(body.name).toBe('截图 2024-01-02.png');
    expect(body.basename).toBe('截图 2024-01-02.png');
    // key 仍是随机串，不派生自文件名
    expect(body.key).not.toContain('截图');
    expect(body.key).toMatch(/^\d+-[0-9a-f]{12}\.png$/);

    // KV imgmeta value
    const meta = JSON.parse(await env.STATS.get('imgmeta:' + body.key));
    expect(meta.name).toBe('截图 2024-01-02.png');
    expect(meta.basename).toBe('截图 2024-01-02.png');

    // R2 对象自定义元数据
    const obj = await env.BUCKET.get(body.key);
    expect(obj.customMetadata.name).toBe('截图 2024-01-02.png');
  });

  test('user list entry carries the name (searchable by /list)', async () => {
    const body = await (await handleUpload(multipartRequest(token, '封面.png'), env, NOOP_CTX)).json();
    const list = await env.STATS.get('userimgs:alice', 'json');
    const entry = list.find(e => e.key === body.key);
    expect(entry.name).toBe('封面.png');
    expect(entry.basename).toBe('封面.png');
  });

  test('raw body: X-File-Name header (URL-encoded Chinese) is decoded and stored', async () => {
    const res = await handleUpload(
      rawRequest(token, { 'X-File-Name': encodeURIComponent('中文 图片.jpg') }),
      env, NOOP_CTX,
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe('中文 图片.jpg');
    expect(body.basename).toBe('中文 图片.jpg');
    const meta = JSON.parse(await env.STATS.get('imgmeta:' + body.key));
    expect(meta.name).toBe('中文 图片.jpg');
  });

  test('raw body without X-File-Name: key still works, name is empty', async () => {
    const res = await handleUpload(rawRequest(token), env, NOOP_CTX);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe('');
    expect(body.basename).toBe('');
    // KV 里不写入空字段，避免老客户端/老代码被空值干扰
    const meta = JSON.parse(await env.STATS.get('imgmeta:' + body.key));
    expect(meta.name).toBeUndefined();
    expect(meta.uploadedAt).toBeTruthy();
  });

  test('a full path is kept in name, last component exposed as basename', async () => {
    const res = await handleUpload(multipartRequest(token, 'assets/文稿/照片.png'), env, NOOP_CTX);
    const body = await res.json();
    expect(body.name).toBe('assets/文稿/照片.png');
    expect(body.basename).toBe('照片.png');
    expect(body.key).not.toContain('/');
  });

  test('X-File-Name overrides multipart file.name', async () => {
    const fd = new FormData();
    fd.append('file', new File([new Uint8Array(1024).buffer], 'from-editor.png', { type: 'image/png' }));
    const req = new Request('http://localhost/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'X-File-Name': 'declared-name.png' },
      body: fd,
    });
    const body = await (await handleUpload(req, env, NOOP_CTX)).json();
    expect(body.name).toBe('declared-name.png');
  });

  test('broken percent-encoding in X-File-Name falls back to the raw value', async () => {
    const body = await (await handleUpload(
      rawRequest(token, { 'X-File-Name': 'not-encoded-%zz.png' }),
      env, NOOP_CTX,
    )).json();
    expect(body.name).toBe('not-encoded-%zz.png');
  });

  test('name does not leak into the key (no path traversal / URL encoding risk)', async () => {
    for (const evil of ['../evil.png', '../../etc/passwd.png', 'a/b/c.png', '%2e%2e/x.png', 'x/../y.png']) {
      const body = await (await handleUpload(multipartRequest(token, evil), env, NOOP_CTX)).json();
      expect(body.key).not.toMatch(/[\\/]|\.\.|%2e/i);
      expect(env.BUCKET.list).toBeDefined();
    }
    const objects = await env.BUCKET.list({});
    expect(objects.objects.every(o => !o.key.includes('/'))).toBe(true);
  });
});

describe('sanitizeOriginalName / baseName', () => {
  test('strips control characters and normalizes whitespace', () => {
    // tab / 换行 / CR 属控制符，直接删除（不是折成空格）
    expect(sanitizeOriginalName('a\tb\nc\r.png')).toBe('abc.png');
    expect(sanitizeOriginalName('  a  b  ')).toBe('a b');
  });

  test('does not start with a dot or whitespace, does not end with a dot', () => {
    expect(sanitizeOriginalName('   .secret')).toBe('secret');
    expect(sanitizeOriginalName('name...')).toBe('name');
  });

  test('truncates by UTF-8 bytes without splitting a multi-byte character', () => {
    const s = '汉'.repeat(200); // 200 × 3 = 600 字节，截到 255 字节 = 85 个字
    const out = sanitizeOriginalName(s);
    const bytes = new TextEncoder().encode(out);
    expect(bytes.length).toBeLessThanOrEqual(MAX_NAME_LEN);
    expect(bytes.length).toBeGreaterThan(MAX_NAME_LEN - 3);
    expect(out).not.toContain('\uFFFD');
  });

  test('a character that fits exactly at the byte limit is kept, not dropped', () => {
    // 85 个单字 = 255 字节，恰好占满上限，不应少切一个字
    const s = '汉'.repeat(85);
    const out = sanitizeOriginalName(s);
    expect([...out].length).toBe(85);
    expect(new TextEncoder().encode(out).byteLength).toBe(MAX_NAME_LEN);
    expect(out).toBe(s);
    expect(out).not.toContain('\uFFFD');
  });

  test('pure ASCII long name is cut on a character boundary', () => {
    const out = sanitizeOriginalName('a'.repeat(400));
    expect(out).toBe('a'.repeat(MAX_NAME_LEN));
  });

  test('baseName takes the last component for both / and \\ separators', () => {
    expect(baseName('/a/b/c.png')).toBe('c.png');
    expect(baseName('C:\\Users\\x.png')).toBe('x.png');
    expect(baseName('plain.png')).toBe('plain.png');
    expect(baseName('')).toBe('');
    expect(baseName('dir/')).toBe('');
  });

  test('empty / null / non-string input yields an empty string', () => {
    expect(sanitizeOriginalName('')).toBe('');
    expect(sanitizeOriginalName(null)).toBe('');
    expect(sanitizeOriginalName(undefined)).toBe('');
    expect(sanitizeOriginalName('   ')).toBe('');
  });

  test('trackImage without a name keeps the legacy shape', async () => {
    const env = createEnv();
    await createTestUser(env, 'bob', 'pass', { canUpload: true });
    await trackImage(env, 'bob', 'legacy.png', 12, false);
    const meta = JSON.parse(await env.STATS.get('imgmeta:legacy.png'));
    // size 也在索引里（/list 自愈清单时不需要额外 head R2 就能恢复体积）；
    // 原名依旧缺省不写，避免老客户端/老代码被空值干扰。
    expect(meta).toEqual({ uploadedAt: expect.any(Number), size: 12 });
    const entry = (await env.STATS.get('userimgs:bob', 'json')).find(e => e.key === 'legacy.png');
    expect(entry.name).toBeUndefined();
  });
});

describe('Content-Disposition carries the original filename', () => {
  test('ASCII name → quoted filename', async () => {
    const env = createEnv();
    await env.BUCKET.put('k.png', new Uint8Array(8).buffer, {
      customMetadata: { name: 'my photo.png' },
    });
    const res = await handleGet(env, NOOP_CTX, 'k.png', new Request('http://localhost/k.png'));
    expect(res.headers.get('content-disposition')).toBe('inline; filename="my photo.png"');
  });

  test('Chinese name → RFC 5987 filename* form', async () => {
    const env = createEnv();
    await env.BUCKET.put('k.png', new Uint8Array(8).buffer, {
      customMetadata: { name: '封面.png' },
    });
    const res = await handleGet(env, NOOP_CTX, 'k.png', new Request('http://localhost/k.png'));
    expect(res.headers.get('content-disposition')).toBe("inline; filename*=UTF-8''%E5%B0%81%E9%9D%A2.png");
  });

  test('RFC 5987 attr-char: ! ( ) are percent-encoded', async () => {
    // encodeURIComponent 不转义 ! ' ( )，但 RFC 5987 的 attr-char 不允许它们，
    // 严格解析器（curl -J）会因此丢掉整个 Content-Disposition
    const env = createEnv();
    await env.BUCKET.put('k.png', new Uint8Array(8).buffer, {
      customMetadata: { name: '封面(终版) v1!.png' },
    });
    const res = await handleGet(env, NOOP_CTX, 'k.png', new Request('http://localhost/k.png'));
    const got = res.headers.get('content-disposition');
    expect(got).toBe("inline; filename*=UTF-8''%E5%B0%81%E9%9D%A2%28%E7%BB%88%E7%89%88%29%20v1%21.png");
    expect(decodeURIComponent(got.split("UTF-8''")[1])).toBe('封面(终版) v1!.png');
  });

  test('a full path is reduced to the last component', async () => {
    const env = createEnv();
    await env.BUCKET.put('k.png', new Uint8Array(8).buffer, {
      customMetadata: { name: 'docs/images/照片.png' },
    });
    const res = await handleGet(env, NOOP_CTX, 'k.png', new Request('http://localhost/k.png'));
    expect(res.headers.get('content-disposition')).toBe("inline; filename*=UTF-8''%E7%85%A7%E7%89%87.png");
  });

  test('quote and backslash are stripped so the header value cannot break out', async () => {
    const env = createEnv();
    await env.BUCKET.put('k.png', new Uint8Array(8).buffer, {
      customMetadata: { name: 'a"b\\c.png' },
    });
    // 反斜杠按路径分隔符处理，取最后一个分量后引号被剥离
    const res = await handleGet(env, NOOP_CTX, 'k.png', new Request('http://localhost/k.png'));
    const disp = res.headers.get('content-disposition');
    expect(disp).toBe('inline; filename="c.png"');

    // 引号在最后一个分量内部：剥离后仍能安全表达
    await env.BUCKET.put('k2.png', new Uint8Array(8).buffer, {
      customMetadata: { name: 'a"b.png' },
    });
    const disp2 = (await handleGet(env, NOOP_CTX, 'k2.png', new Request('http://localhost/k2.png')))
      .headers.get('content-disposition');
    expect(disp2).toBe('inline; filename="ab.png"');
  });

  test('legacy image without a stored name gets no Content-Disposition header', async () => {
    const env = createEnv();
    await env.BUCKET.put('k.png', new Uint8Array(8).buffer, {
      customMetadata: { uploadedBy: 'alice' },
    });
    const res = await handleGet(env, NOOP_CTX, 'k.png', new Request('http://localhost/k.png'));
    expect(res.headers.get('content-disposition')).toBeNull();
    expect(res.headers.get('content-type')).toBe('application/octet-stream');
  });
});
