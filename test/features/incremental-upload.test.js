import { describe, test, expect, beforeEach } from 'vitest';
import { handleProtoUploadInit, handleProtoFinalize, readManifest } from '../../src/proto/upload.js';
import { createEnv, createRequest } from '../helpers/mock-env.js';

const OWNER = 'alice';

// Seed a "v1" prototype directly in KV/R2 to exercise the update path.
async function seedV1(env, protoId, paths) {
  for (const p of paths) await env.BUCKET.put(`proto/${protoId}/${p}`, new Uint8Array(8).buffer);
  await env.STATS.put(`proto:${protoId}`, JSON.stringify({
    protoId, title: 'P', owner: OWNER, entryPoint: 'index.html',
    fileCount: paths.length, totalSize: paths.length * 8, version: 1,
    versions: [{ v: 1, at: Date.now(), files: paths.length, size: paths.length * 8 }],
    isPrivate: false,
  }));
  await env.STATS.put(`proto:vfiles:${protoId}:v1`, JSON.stringify(paths));
  await env.BUCKET.put(`manifests/${protoId}.json`, JSON.stringify(
    Object.fromEntries(paths.map(p => [p, 'h-' + p])),
  ));
}

describe('Incremental prototype upload', () => {
  let env;
  beforeEach(() => { env = createEnv(); });

  test('init returns previous manifest on update', async () => {
    const protoId = 'pid1';
    await seedV1(env, protoId, ['index.html', 'a.js', 'b.css']);
    const req = createRequest('POST', 'http://localhost/upload/proto/init', {
      body: { title: 'P', entryPoint: 'index.html', totalSize: 24, protoId },
    });
    const res = await handleProtoUploadInit(req, env, OWNER);
    const data = await res.json();
    expect(data.protoId).toBe(protoId);
    expect(data.manifest).toEqual({ 'index.html': 'h-index.html', 'a.js': 'h-a.js', 'b.css': 'h-b.css' });
  });

  test('init returns null manifest on fresh create', async () => {
    const req = createRequest('POST', 'http://localhost/upload/proto/init', {
      body: { title: 'New', entryPoint: 'index.html', totalSize: 10 },
    });
    const data = await (await handleProtoUploadInit(req, env, OWNER)).json();
    expect(data.manifest).toBeNull();
    expect(data.protoId).toBeTruthy();
  });

  test('finalize deletes orphaned files and writes new manifest', async () => {
    const protoId = 'pid2';
    await seedV1(env, protoId, ['index.html', 'old.js', 'b.css']);
    // simulate an init that created staging for update mode
    await handleProtoUploadInit(createRequest('POST', 'http://localhost/upload/proto/init', {
      body: { title: 'P', entryPoint: 'index.html', totalSize: 16, protoId },
    }), env, OWNER);

    // new version drops old.js, adds new.js
    const newPaths = ['index.html', 'b.css', 'new.js'];
    const newManifest = { 'index.html': 'h2', 'b.css': 'h-b.css', 'new.js': 'h3' };
    const fReq = createRequest('POST', 'http://localhost/upload/proto/finalize', {
      body: { protoId, filePaths: newPaths, manifest: newManifest },
    });
    const res = await handleProtoFinalize(fReq, env, OWNER);
    expect(res.status).toBe(200);

    // orphan removed from R2
    expect(await env.BUCKET.head(`proto/${protoId}/old.js`)).toBeNull();
    // kept files remain
    expect(await env.BUCKET.head(`proto/${protoId}/b.css`)).not.toBeNull();
    // manifest updated
    expect(await readManifest(env, protoId)).toEqual(newManifest);
    // version bumped
    const meta = await env.STATS.get(`proto:${protoId}`, 'json');
    expect(meta.version).toBe(2);
  });

  test('updating content clears the trash (deletedAt) flag', async () => {
    const protoId = 'pid3';
    await seedV1(env, protoId, ['index.html', 'a.js']);
    // mark it soft-deleted, then update its content directly (without restore)
    const meta0 = await env.STATS.get(`proto:${protoId}`, 'json');
    meta0.deletedAt = Date.now();
    await env.STATS.put(`proto:${protoId}`, JSON.stringify(meta0));

    await handleProtoUploadInit(createRequest('POST', 'http://localhost/upload/proto/init', {
      body: { title: 'P', entryPoint: 'index.html', totalSize: 16, protoId },
    }), env, OWNER);
    const fReq = createRequest('POST', 'http://localhost/upload/proto/finalize', {
      body: { protoId, filePaths: ['index.html', 'a.js'], manifest: { 'index.html': 'h', 'a.js': 'h' } },
    });
    const res = await handleProtoFinalize(fReq, env, OWNER);
    expect(res.status).toBe(200);
    const meta = await env.STATS.get(`proto:${protoId}`, 'json');
    expect(meta.deletedAt).toBeUndefined();
  });
});
