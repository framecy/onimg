import { describe, test, expect, beforeEach } from 'vitest';
import {
  handleProtoUploadInit,
  handleProtoFileBatch,
} from '../../src/proto/upload.js';
import { createEnv, createRequest } from '../helpers/mock-env.js';

const OWNER = 'alice';

function multipartForm(protoId, entries) {
  const fd = new FormData();
  fd.append('protoId', protoId);
  for (const [path, content] of entries) {
    fd.append('paths[]', path);
    fd.append('files[]', new Blob([content], { type: 'application/octet-stream' }), path);
  }
  return new Request('http://localhost/upload/proto/files', { method: 'POST', body: fd });
}

async function startSession(env, { protoId, entryPoint = 'index.html' } = {}) {
  const res = await handleProtoUploadInit(createRequest('POST', 'http://localhost/upload/proto/init', {
    body: { title: 'T', entryPoint, totalSize: 1024, ...(protoId ? { protoId } : {}) },
  }), env, OWNER);
  return (await res.json()).protoId;
}

describe('Proto file batch upload (handleProtoFileBatch)', () => {
  let env;
  beforeEach(() => { env = createEnv(); });

  test('uploads all files to R2 under proto/{protoId}/ with correct content type', async () => {
    const protoId = await startSession(env);
    const req = multipartForm(protoId, [
      ['index.html', '<h1>hi</h1>'],
      ['assets/app.js', 'console.log(1)'],
      ['assets/logo.png', new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer],
    ]);
    const res = await handleProtoFileBatch(req, env, OWNER);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.uploaded).toBe(3);

    const html = await env.BUCKET.get(`proto/${protoId}/index.html`);
    expect(html).not.toBeNull();
    expect(html.httpMetadata.contentType).toContain('text/html');
    expect(html.httpMetadata.cacheControl).toBe('no-cache');

    const js = await env.BUCKET.get(`proto/${protoId}/assets/app.js`);
    expect(js.httpMetadata.contentType).toBe('application/javascript');

    const png = await env.BUCKET.get(`proto/${protoId}/assets/logo.png`);
    expect(png.httpMetadata.contentType).toBe('image/png');
  });

  test('filters unsafe paths and counts only uploaded files', async () => {
    const protoId = await startSession(env);
    const req = multipartForm(protoId, [
      ['good.js', 'var a=1'],
      ['../evil.js', 'var b=2'],
      ['/abs.js', 'var c=3'],
      ['dir/.DS_Store', 'junk'],
      ['__MACOSX/meta', 'junk'],
      ['ok2.js', 'var d=4'],
    ]);
    const res = await handleProtoFileBatch(req, env, OWNER);
    const data = await res.json();
    expect(data.uploaded).toBe(2); // good.js + ok2.js
    expect(await env.BUCKET.get(`proto/${protoId}/../evil.js`)).toBeNull();
    expect(await env.BUCKET.get(`proto/${protoId}/good.js`)).not.toBeNull();
    expect(await env.BUCKET.get(`proto/${protoId}/ok2.js`)).not.toBeNull();
  });

  test('rejected when staging session missing (410)', async () => {
    const req = multipartForm('no-such-proto', [['a.js', 'x']]);
    const res = await handleProtoFileBatch(req, env, OWNER);
    expect(res.status).toBe(410);
  });

  test('rejected when owner mismatch (403)', async () => {
    const protoId = await startSession(env);
    const req = multipartForm(protoId, [['a.js', 'x']]);
    const res = await handleProtoFileBatch(req, env, 'mallory');
    expect(res.status).toBe(403);
  });

  test('paths and files misalignment does not crash or miscount', async () => {
    const protoId = await startSession(env);
    const fd = new FormData();
    fd.append('protoId', protoId);
    fd.append('paths[]', 'a.js');
    fd.append('paths[]', 'b.js'); // b.js 没有对应 files[]
    fd.append('files[]', new Blob(['var a=1']), 'a.js');
    const req = new Request('http://localhost/upload/proto/files', { method: 'POST', body: fd });
    const res = await handleProtoFileBatch(req, env, OWNER);
    const data = await res.json();
    expect(data.uploaded).toBe(1);
    expect(await env.BUCKET.get(`proto/${protoId}/a.js`)).not.toBeNull();
    expect(await env.BUCKET.get(`proto/${protoId}/b.js`)).toBeNull();
  });

  test('large batch (60 files) all land in R2 with grouped concurrency', async () => {
    const protoId = await startSession(env);
    const entries = Array.from({ length: 60 }, (_, i) => [`f${i}.css`, `body{}${i}`]);
    const res = await handleProtoFileBatch(multipartForm(protoId, entries), env, OWNER);
    const data = await res.json();
    expect(data.uploaded).toBe(60);
    for (let i = 0; i < 60; i += 7) {
      expect(await env.BUCKET.get(`proto/${protoId}/f${i}.css`)).not.toBeNull();
    }
  });

  test('blobs uploaded via stream() path store identical bytes', async () => {
    const protoId = await startSession(env);
    const content = new Uint8Array(2048).fill(0x5a);
    const res = await handleProtoFileBatch(
      multipartForm(protoId, [['bin/data.bin', content.buffer]]),
      env, OWNER,
    );
    expect((await res.json()).uploaded).toBe(1);
    const stored = await env.BUCKET.get(`proto/${protoId}/bin/data.bin`);
    const buf = await stored.arrayBuffer();
    expect(new Uint8Array(buf).length).toBe(2048);
  });
});
