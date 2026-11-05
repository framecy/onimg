// 回归：onimg-agent 走单 ZIP 通道（POST /upload/proto → handleProtoUpload），
// 与网页分片通道（init/files/finalize）是两条独立实现。
// 历史 bug：分片通道更新内容会清除 deletedAt（见 incremental-upload.test.js），
// 单 ZIP 通道漏清 —— 已删除过的原型再用 agent --id 更新时，返回新地址、直链可开，
// 但所有列表都过滤 deletedAt，表现为「列表里查不到」。本文件锁定两条通道一致。
import { describe, test, expect, beforeEach } from 'vitest';
import { zipSync } from 'fflate';
import { handleProtoUpload } from '../../src/proto/upload.js';
import { listProtos } from '../../src/proto/manage.js';
import { createEnv } from '../helpers/mock-env.js';

const OWNER = 'alice';

async function seedV1(env, protoId, paths, extra = {}) {
  for (const p of paths) await env.BUCKET.put(`proto/${protoId}/${p}`, new Uint8Array(8).buffer);
  await env.STATS.put(`proto:${protoId}`, JSON.stringify({
    protoId, title: 'P', owner: OWNER, entryPoint: 'index.html',
    fileCount: paths.length, totalSize: paths.length * 8, version: 1,
    versions: [{ v: 1, at: Date.now(), files: paths.length, size: paths.length * 8 }],
    isPrivate: false,
    ...extra,
  }));
  await env.STATS.put(`proto:vfiles:${protoId}:v1`, JSON.stringify(paths));
}

function zipUploadRequest(files, fields = {}) {
  const bytes = zipSync(Object.fromEntries(
    Object.entries(files).map(([p, s]) => [p, new TextEncoder().encode(s)]),
  ));
  const fd = new FormData();
  fd.append('file', new File([bytes], 'site.zip', { type: 'application/zip' }));
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return new Request('http://localhost/upload/proto', { method: 'POST', body: fd });
}

describe('Proto single-ZIP upload (onimg-agent path)', () => {
  let env;
  beforeEach(() => { env = createEnv(); });

  test('updating a soft-deleted proto clears deletedAt and it reappears in list', async () => {
    const protoId = 'pid-zip-1';
    await seedV1(env, protoId, ['index.html', 'old.js'], { deletedAt: Date.now() });

    // sanity: while trashed, invisible in list
    expect(await listProtos(env, OWNER, false)).toEqual([]);

    const res = await handleProtoUpload(
      zipUploadRequest({ 'index.html': '<h1>v2</h1>', 'a.js': '1' }, { protoId, title: 'P' }),
      env, OWNER,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.protoId).toBe(protoId);

    const meta = await env.STATS.get(`proto:${protoId}`, 'json');
    expect(meta.deletedAt).toBeUndefined();
    expect(meta.owner).toBe(OWNER);
    expect(meta.version).toBe(2);

    const listed = await listProtos(env, OWNER, false);
    expect(listed.map(p => p.protoId)).toEqual([protoId]);
  });

  test('fresh create is immediately visible in list', async () => {
    const res = await handleProtoUpload(
      zipUploadRequest({ 'index.html': '<h1>hi</h1>' }, { title: '新原型' }),
      env, OWNER,
    );
    expect(res.status).toBe(201);
    const { protoId } = await res.json();
    expect(protoId).toBeTruthy();

    const listed = await listProtos(env, OWNER, false);
    expect(listed.map(p => p.protoId)).toEqual([protoId]);
    expect(listed[0].owner).toBe(OWNER);
  });

  test('listProtos paginates past the first list() page', async () => {
    // 把 STATS 包装成每页只给 2 个 key（模拟 1000 上限与 cursor 翻页），
    // 6 个原型 + 6 个 vfiles 辅助 key 必须全部返回，不能静默丢弃。
    const ids = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
    for (const id of ids) await seedV1(env, id, ['index.html']);

    const base = env.STATS;
    const paged = {
      get: (...a) => base.get(...a),
      getMany: (...a) => base.getMany(...a),
      put: (...a) => base.put(...a),
      delete: (...a) => base.delete(...a),
      async list({ prefix = '', cursor } = {}) {
        const all = [...base._store.keys()].filter(k => k.startsWith(prefix)).sort();
        const rest = cursor ? all.filter(k => k > cursor) : all;
        const page = rest.slice(0, 2);
        const more = rest.length > page.length;
        return {
          keys: page.map(name => ({ name, metadata: null })),
          list_complete: !more,
          ...(more ? { cursor: page[page.length - 1] } : {}),
        };
      },
    };

    const protos = await listProtos({ ...env, STATS: paged }, OWNER, false);
    expect(protos.map(p => p.protoId).sort()).toEqual([...ids].sort());
  });
});
