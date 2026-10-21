import { describe, test, expect, beforeEach } from 'vitest';
import { listProtos, isProtoKey } from '../../src/proto/manage.js';
import { handleTrashList } from '../../src/trash.js';
import { createToken } from '../../src/admin/auth.js';
import { createEnv, authedRequest, createTestUser } from '../helpers/mock-env.js';

// 回归测试：上传暂存记录（proto:staging:…）泄漏成「原型」列表项。
//
// 复现路径：init 写好暂存记录后，上传被中断（关标签页 / 网关超时 / 批次重试
// 耗尽）→ finalize 没跑到 → proto:staging:<id> 留到 TTL（1h）过期。列表扫描
// prefix 'proto:' 时会把它当成原型元数据读出来，于是前端渲染出一行
// 「预览 → /proto/undefined/」，打开就是 Prototype Not Found；同名重传还会被
// 「已存在同名原型」挡住。

const stagingRecord = (owner, overrides = {}) => JSON.stringify({
  owner,
  existingId: null,
  entryPoint: 'index.html',
  totalSize: 2048,
  title: '我的原型',
  password: '',
  createdAt: Date.now(),
  ...overrides,
});

const protoRecord = (protoId, owner, overrides = {}) => JSON.stringify({
  protoId,
  title: '我的原型',
  owner,
  entryPoint: 'index.html',
  fileCount: 12,
  totalSize: 4096,
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
  version: 1,
  versions: [],
  isPrivate: false,
  ...overrides,
});

describe('原型列表不暴露上传暂存记录', () => {
  let env;

  beforeEach(async () => {
    env = createEnv();
    await createTestUser(env, 'alice', 'pass');
  });

  test('staging key 不会变成 protoId 为空的幽灵原型', async () => {
    await env.STATS.put('proto:staging:1700000000-abc1234', stagingRecord('alice'), { expirationTtl: 3600 });
    await env.STATS.put('proto:1700000001-xyz7890', protoRecord('1700000001-xyz7890', 'alice'));

    const protos = await listProtos(env, 'alice', true);

    expect(protos).toHaveLength(1);
    expect(protos[0].protoId).toBe('1700000001-xyz7890');
    expect(protos.some(p => !p.protoId)).toBe(false);
  });

  test('只有暂存记录时列表为空（不再渲染 /proto/undefined/ 行）', async () => {
    await env.STATS.put('proto:staging:1700000000-abc1234', stagingRecord('alice'), { expirationTtl: 3600 });

    expect(await listProtos(env, 'alice', true)).toEqual([]);
    expect(await listProtos(env, null, true)).toEqual([]);
  });

  test('版本文件清单（proto:vfiles:）同样不算原型', async () => {
    await env.STATS.put('proto:vfiles:1700000001-xyz7890:v1', JSON.stringify(['index.html']));
    await env.STATS.put('proto:1700000001-xyz7890', protoRecord('1700000001-xyz7890', 'alice'));

    const protos = await listProtos(env, 'alice', true);
    expect(protos.map(p => p.protoId)).toEqual(['1700000001-xyz7890']);
  });

  test('缺少 protoId 的残留元数据不会进列表', async () => {
    await env.STATS.put('proto:broken-record', JSON.stringify({ title: '半成品', owner: 'alice' }));

    expect(await listProtos(env, 'alice', true)).toEqual([]);
  });

  test('isProtoKey 只放行正式原型的 key', () => {
    expect(isProtoKey('proto:1700000001-xyz7890')).toBe(true);
    expect(isProtoKey('proto:staging:1700000000-abc1234')).toBe(false);
    expect(isProtoKey('proto:vfiles:1700000001-xyz7890:v1')).toBe(false);
  });

  test('回收站列表也不含暂存记录', async () => {
    await env.STATS.put('proto:staging:1700000000-abc1234', stagingRecord('alice'), { expirationTtl: 3600 });
    const token = await createToken({ type: 'user', username: 'alice' }, 3600_000, env.TOKEN_SECRET);

    const res = await handleTrashList(authedRequest('GET', 'http://localhost/api/trash', token), env);
    expect(res.status).toBe(200);
    expect((await res.json()).protos).toEqual([]);
  });
});
