// src/kv-d1.js 的契约测试。
//
// 核心思路是「差分」：同一组操作分别跑在
//   (a) 业务代码一直在用的 createKV() 内存 KV
//   (b) 新的 createD1Kv()（底层真实 SQLite，契约对齐真 D1）
// 上，断言两边结果一致。只要差分全绿，替换 env.STATS 就不会改变业务行为。
//
// 另外单独覆盖 KV mock 不支持、但真实 KV 有、且业务代码依赖的语义：
// TTL 过期、list 的 limit / cursor / list_complete、带 metadata 的 list。
import { describe, it, expect } from 'vitest';
import { createD1, createKV, createEnv } from '../helpers/mock-env.js';
import { createD1Kv } from '../../src/kv-d1.js';

const kvEnv = () => createKV();
const d1Env = () => createD1Kv(createD1());

describe('createD1Kv：与 KV 契约的差分对比', () => {
  it('基本读写与 JSON 反序列化结果一致', async () => {
    const kv = kvEnv();
    const d1 = d1Env();

    for (const [k, v] of [['imgmeta:a.jpg', { size: 1, uploadedAt: 2 }], ['user:alice', { disabled: false }]]) {
      await kv.put(k, JSON.stringify(v));
      await d1.put(k, JSON.stringify(v));
    }
    await kv.put('plain', 'hello');
    await d1.put('plain', 'hello');

    for (const k of ['imgmeta:a.jpg', 'user:alice']) {
      expect(await d1.get(k, 'json')).toEqual(await kv.get(k, 'json'));
    }
    expect(await d1.get('plain')).toBe(await kv.get('plain'));
  });

  it('传对象时两边都按 JSON 文本落盘', async () => {
    const kv = kvEnv();
    const d1 = d1Env();
    await kv.put('k', JSON.stringify({ a: 1 }));
    await d1.put('k', { a: 1 });
    expect(await d1.get('k')).toBe(await kv.get('k'));
    expect(await d1.get('k', 'json')).toEqual({ a: 1 });
  });

  it('get 未命中都返回 null', async () => {
    expect(await kvEnv().get('nope')).toBe(null);
    expect(await d1Env().get('nope')).toBe(null);
  });

  it('get("json") 遇到坏 JSON 都返回 null 而不抛异常', async () => {
    const kv = kvEnv();
    const d1 = d1Env();
    await kv.put('bad', '{not json');
    await d1.put('bad', '{not json');
    expect(await d1.get('bad', 'json')).toBe(await kv.get('bad', 'json'));
    expect(await d1.get('bad', 'json')).toBe(null);
  });

  it('getWithMetadata 命中与未命中的形状一致', async () => {
    const kv = kvEnv();
    const d1 = d1Env();
    const meta = { isPublic: true, owner: 'alice' };
    await kv.put('imgmeta:a.jpg', JSON.stringify({ size: 7 }), { metadata: meta });
    await d1.put('imgmeta:a.jpg', JSON.stringify({ size: 7 }), { metadata: meta });

    const a = await kv.getWithMetadata('imgmeta:a.jpg', 'json');
    const b = await d1.getWithMetadata('imgmeta:a.jpg', 'json');
    expect(b.value).toEqual(a.value);
    expect(b.metadata).toEqual(a.metadata);

    expect(await d1.getWithMetadata('missing', 'json')).toEqual({ value: null, metadata: null });
  });

  it('put 覆盖写后读到新值（D1 强一致）', async () => {
    const d1 = d1Env();
    await d1.put('k', 'v1');
    await d1.put('k', 'v2');
    expect(await d1.get('k')).toBe('v2');
  });

  it('delete 幂等，删不存在的 key 不抛异常', async () => {
    const d1 = d1Env();
    await d1.put('k', 'v');
    await d1.delete('k');
    expect(await d1.get('k')).toBe(null);
    await expect(d1.delete('k')).resolves.toBeUndefined();
  });

  it('list 的 prefix 过滤与 KV 结果集一致', async () => {
    const kv = kvEnv();
    const d1 = d1Env();
    const keys = ['imgmeta:a', 'imgmeta:b', 'user:alice', 'userimgs:alice'];
    for (const k of keys) {
      await kv.put(k, 'x');
      await d1.put(k, 'x');
    }

    for (const prefix of ['imgmeta:', 'user:', 'userimgs:', '', 'zzz:']) {
      const a = (await kv.list({ prefix })).keys.map(x => x.name).sort();
      const b = (await d1.list({ prefix })).keys.map(x => x.name).sort();
      expect(b).toEqual(a);
    }
  });
});

describe('createD1Kv：真实 KV 有而内存 mock 没有的语义', () => {
  it('list 的 limit / cursor / list_complete 分页正确且不重不漏', async () => {
    const d1 = d1Env();
    const names = Array.from({ length: 25 }, (_, i) => `imgmeta:${String(i).padStart(3, '0')}`);
    for (const n of names) await d1.put(n, 'x');
    await d1.put('other:1', 'x');

    const seen = [];
    let cursor;
    let pages = 0;
    do {
      const r = await d1.list({ prefix: 'imgmeta:', limit: 10, cursor });
      seen.push(...r.keys.map(k => k.name));
      pages++;
      cursor = r.list_complete ? undefined : r.cursor;
      if (pages > 10) throw new Error('分页未收敛');
    } while (cursor);

    expect(seen).toEqual(names);            // 顺序：字节序升序
    expect(new Set(seen).size).toBe(25);    // 不重
    expect(pages).toBe(3);                  // 25 条 / 每页 10 → 3 页
  });

  it('list 带出每个 key 的 metadata', async () => {
    const d1 = d1Env();
    await d1.put('stats:a.jpg', '[]', { metadata: { count: 3, lastAccess: 111 } });
    await d1.put('stats:b.jpg', '[]', { metadata: { count: 9, lastAccess: 222 } });

    const r = await d1.list({ prefix: 'stats:' });
    const byName = Object.fromEntries(r.keys.map(k => [k.name, k.metadata]));
    expect(byName['stats:a.jpg']).toEqual({ count: 3, lastAccess: 111 });
    expect(byName['stats:b.jpg']).toEqual({ count: 9, lastAccess: 222 });
  });

  it('metadata 缺省时 list 返回 null，不抛异常', async () => {
    const d1 = d1Env();
    await d1.put('userimg:alice:a.jpg', '{}');
    const r = await d1.list({ prefix: 'userimg:' });
    expect(r.keys[0].metadata).toBe(null);
  });

  it('TTL 过期后读不到，且不出现在 list 里', async () => {
    const d1 = d1Env();
    await d1.put('ucount:daily:alice:2020-01-01', '5', { expirationTtl: -1 }); // 已过期
    await d1.put('ucount:daily:alice:today', '6', { expirationTtl: 3600 });

    expect(await d1.get('ucount:daily:alice:2020-01-01')).toBe(null);
    const names = (await d1.list({ prefix: 'ucount:daily:' })).keys.map(k => k.name);
    expect(names).toEqual(['ucount:daily:alice:today']);
  });

  it('sweepExpired 物理清掉过期行并返回条数', async () => {
    const d1 = d1Env();
    await d1.put('expired:a', 'x', { expirationTtl: -1 });
    await d1.put('expired:b', 'x', { expirationTtl: -1 });
    await d1.put('alive:c', 'x', { expirationTtl: 3600 });

    expect(await d1.sweepExpired()).toBe(2);
    expect(await d1.sweepExpired()).toBe(0);
    expect(await d1.get('alive:c')).toBe('x');
  });
});

describe('createD1Kv：接线到业务 env 后能被现有代码原样使用', () => {
  it('createEnv 里换成 D1 适配器后，createTestImage 链路可读回', async () => {
    const env = createEnv({ STATS: createD1Kv(createD1()) });
    const { createTestImage } = await import('../helpers/mock-env.js');

    await createTestImage(env, 'a.jpg', 'alice');
    expect(await env.STATS.get('imgmeta:a.jpg', 'json')).toEqual({ uploadedAt: expect.any(Number) });
    const manifest = await env.STATS.get('userimgs:alice', 'json');
    expect(manifest.map(e => e.key)).toEqual(['a.jpg']);
  });

  it('未接入 D1 绑定时抛明确错误，而不是静默降级', () => {
    expect(() => createD1Kv(undefined)).toThrow(/需要 D1 绑定/);
    expect(() => createD1Kv({})).toThrow(/需要 D1 绑定/);
  });
});
