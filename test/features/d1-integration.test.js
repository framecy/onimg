// D1 接线的端到端集成测试。
//
// 与 kv-d1.test.js 的区别：那个测的是适配器自身的契约，这个测的是
// **整条业务链路在 env.STATS 被就地换成 D1 之后是否照常工作** ——
// 走的是 src/index.js 的 fetch 入口（也就是线上真实入口），而不是单独调某个 handler。
//
// 关键断言手法：test 手里同时握着「原始 KV 引用」和「D1 实例」。
// 接线生效的证据是：数据全部落在 D1，原始 KV 里一个 key 都没有。
import { describe, test, expect, beforeEach } from 'vitest';
import worker from '../../src/index.js';
import { createEnv, createD1, createKV, createR2, createTestUser } from '../helpers/mock-env.js';
import { createToken } from '../../src/admin/auth.js';
import { createD1Kv } from '../../src/kv-d1.js';

// 收集 ctx.waitUntil 的异步任务，测完统一 settle（cfBump / bumpGlobalStats 走这里）
function makeCtx() {
  const pending = [];
  return {
    ctx: {
      waitUntil: (p) => { pending.push(Promise.resolve(p).catch(() => {})); },
      passThroughOnException: () => {},
    },
    settle: () => Promise.all(pending),
  };
}

function pngBytes(n = 2048) {
  return new Uint8Array(n).fill(0x89);
}

async function makeEnv() {
  const kv = createKV();          // 原始 KV（接线后应当完全不被写）
  const d1 = createD1();          // 真实 SQLite 内核的内存 D1
  const env = createEnv({ STATS: kv, DB: d1 });

  // 刻意保持 env.STATS 为原始 KV，不在这里手动接线。
  //
  // 之前这里写过 `env.STATS = createD1Kv(d1)`，结果是假阳性：测试自己完成了接线，
  // 于是「src/index.js 的 withD1Stats 被删掉/写错」这类回归照样全绿（已实测复现）。
  // 现在只允许 worker.fetch 内部的接线把 env.STATS 换成 D1 适配器 —— 业务能读到
  // 用户，就证明接线真的生效了。
  //
  // 用户数据按线上搬迁后的真实形态直接写进 D1（部署前数据已搬到 D1，运行时 D1 里
  // 就有这份数据，不依赖业务代码写入）。
  const seed = createD1Kv(d1);
  await createTestUser({ STATS: seed }, 'alice', 'pass', { canUpload: true });
  const token = await createToken({ type: 'user', username: 'alice' }, 3600_000, env.TOKEN_SECRET);
  return { env, kv, d1, token };
}

async function upload(env, ctx, token, { name = 'photo.png', bytes = pngBytes(), mime = 'image/png' } = {}) {
  const req = new Request('http://localhost/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': mime,
      'Content-Length': String(bytes.byteLength),
      'X-File-Name': encodeURIComponent(name),
    },
    body: bytes.buffer,
  });
  return worker.fetch(req, env, ctx);
}

describe('D1 接线：整条业务链路跑在 D1 上', () => {
  let env, kv, d1, token, c;
  beforeEach(async () => {
    ({ env, kv, d1, token } = await makeEnv());
    c = makeCtx();
  });

  test('上传后元数据全部落在 D1，原始 KV 一个 key 都没写', async () => {
    const res = await upload(env, c.ctx, token, { name: 'my photo.png' });
    expect(res.status).toBe(201);
    const body = await res.json();
    await c.settle();

    // 数据在 D1（env.STATS 已被接线换成 D1 适配器）
    expect(await env.STATS.get('imgmeta:' + body.key, 'json')).toMatchObject({
      size: body.size,
      name: 'my photo.png',
    });
    expect(await env.STATS.get(`userimg:alice:${body.key}`, 'json')).toMatchObject({ isPublic: false });
    const manifest = await env.STATS.get('userimgs:alice', 'json');
    expect(manifest.map(e => e.key)).toEqual([body.key]);
    expect(await env.STATS.get('ucount:total:alice')).toBe('1');
    expect(await env.STATS.get('cf:r2a:' + new Date().toISOString().slice(0, 7))).toBe('1');

    // 证据：原始 KV 全程没被碰过
    expect(await kv.get('imgmeta:' + body.key)).toBe(null);
    expect(await kv.get('userimgs:alice')).toBe(null);
    expect(await kv.get('ucount:total:alice')).toBe(null);

    // 文件本体照旧在 R2
    expect(await env.BUCKET.get(body.key)).not.toBeNull();
  });

  test('上传配额在 D1 上逐次累加，超限被拦', async () => {
    const token2 = await createToken({ type: 'user', username: 'bob' }, 3600_000, env.TOKEN_SECRET);
    // 用户也要落在 D1（线上搬迁后的形态），不能用 env.STATS（那是未接线的 KV）
    await createTestUser({ STATS: createD1Kv(d1) }, 'bob', 'pass', { canUpload: true, dailyUploadLimit: 2, maxTotalUploads: 2 });

    for (let i = 0; i < 2; i++) {
      const r = await upload(env, c.ctx, token2, { name: `b${i}.png` });
      expect(r.status).toBe(201);
    }
    const blocked = await upload(env, c.ctx, token2, { name: 'b3.png' });
    expect(blocked.status).toBe(429);
    expect(await env.STATS.get('ucount:total:bob')).toBe('2');
  });

  test('GET /list 从 D1 读回图库，条目数正确', async () => {
    const keys = [];
    for (let i = 0; i < 3; i++) {
      const r = await upload(env, c.ctx, token, { name: `pic${i}.png` });
      keys.push((await r.json()).key);
    }
    await c.settle();

    const res = await worker.fetch(
      new Request('http://localhost/list', { headers: { Authorization: `Bearer ${token}` } }),
      env, c.ctx,
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect((data.images ?? data.items ?? []).map(i => i.key).sort()).toEqual([...keys].sort());
  });

  test('图片被访问一次，访问统计写入 D1', async () => {
    const r = await upload(env, c.ctx, token, { name: 'seen.png' });
    const { key } = await r.json();
    await c.settle();

    const res = await worker.fetch(
      new Request(`http://localhost/${key}`, { headers: { 'CF-Connecting-IP': '1.2.3.4' } }),
      env, c.ctx,
    );
    expect(res.status).toBe(200);
    await c.settle();

    // 关键：访问统计进了 D1，而不是每次访问都写一次 KV
    const { value, metadata } = await env.STATS.getWithMetadata('stats:' + key, 'json');
    expect(metadata.count).toBe(1);
    expect(value[0].ip).toBe('1.2.3.4');
    expect(await kv.get('stats:' + key)).toBe(null);
  });

  test('走完整入口的删除链路：进回收站并在 D1 上标记', async () => {
    const r = await upload(env, c.ctx, token, { name: 'del.png' });
    const { key } = await r.json();
    await c.settle();

    const res = await worker.fetch(
      new Request(`http://localhost/delete/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }),
      env, c.ctx,
    );
    await c.settle();
    expect(res.status).toBeLessThan(400);

    const { metadata } = await env.STATS.getWithMetadata('imgmeta:' + key, 'json');
    expect(metadata.deletedAt).toBeGreaterThan(0);
  });

  test('未配置 DB 绑定时回退到原有 KV 行为（回滚路径可用）', async () => {
    const kvOnly = createKV();
    const plainEnv = createEnv({ STATS: kvOnly });   // 注意：不传 DB
    await createTestUser(plainEnv, 'alice', 'pass', { canUpload: true });
    const t = await createToken({ type: 'user', username: 'alice' }, 3600_000, plainEnv.TOKEN_SECRET);
    const c2 = makeCtx();

    const res = await upload(plainEnv, c2.ctx, t, { name: 'kv.png' });
    expect(res.status).toBe(201);
    const { key } = await res.json();
    await c2.settle();

    // 没有任何 D1，数据照旧落在 KV —— 证明删掉 DB 绑定即可回滚
    expect(await plainEnv.STATS.get('imgmeta:' + key, 'json')).not.toBe(null);
    expect(plainEnv.STATS).toBe(kvOnly);
  });
});

describe('D1 接线：cron 清理 TTL', () => {
  test('scheduled 会清掉 D1 上的过期行', async () => {
    const kv = createKV();
    const d1 = createD1();
    const env = createEnv({ STATS: kv, DB: d1 });   // 同样不手动接线
    const c = makeCtx();

    // 数据直接写 D1（模拟「部署前已搬迁」的真实形态）
    const seed = createD1Kv(d1);
    await seed.put('cf:req:2020-01-01', '9', { expirationTtl: -1 });
    await seed.put('ucount:daily:alice:2020-01-01', '1', { expirationTtl: -1 });
    await seed.put('audit:2999-01-01', '[1]', { expirationTtl: 86400 });

    await worker.scheduled({}, env, c.ctx);
    await c.settle();

    // scheduled 内部同样要完成接线，清理才是作用在 D1 上
    expect(await env.STATS.get('cf:req:2020-01-01')).toBe(null);
    expect(await env.STATS.get('ucount:daily:alice:2020-01-01')).toBe(null);
    expect(await env.STATS.get('audit:2999-01-01')).toBe('[1]');  // 未过期的保留
  });
});

// 这一组专门盯「接线本身」，防止两个方向的回归：
//   1. withD1Stats 被删掉/写错 → 业务悄悄退回 KV（写入额度问题复现）
//   2. 没有 DB 绑定时仍然强行替换 → 回滚路径失效
// 注意上面那组测试是「不自己接线」的，若这组被人为绕过，上面的测试会一起失败。
describe('D1 接线：withD1Stats 必须由 worker 入口完成', () => {
  test('调 fetch 前 env.STATS 是 KV，调完被换成读 D1 的适配器', async () => {
    const kv = createKV();
    const d1 = createD1();
    const env = createEnv({ STATS: kv, DB: d1 });
    const c = makeCtx();

    expect(env.STATS).toBe(kv);                       // 入口前：还是原始 KV

    await worker.fetch(new Request('http://localhost/install.sh'), env, c.ctx);

    expect(env.STATS).not.toBe(kv);                   // 入口后：已被替换
    // 替换后的对象确实读 D1：直接往 D1 塞一条，通过 env.STATS 要能读到
    await createD1Kv(d1).put('probe:wired', 'from-d1');
    expect(await env.STATS.get('probe:wired')).toBe('from-d1');
    // 反向：KV 侧塞的同名数据不应被读到（确认读的不是 KV）
    await kv.put('probe:wired', 'from-kv');
    expect(await env.STATS.get('probe:wired')).toBe('from-d1');
  });

  test('业务经入口写入的数据落在 D1，KV 侧零写入', async () => {
    const kv = createKV();
    const d1 = createD1();
    const env = createEnv({ STATS: kv, DB: d1 });
    const seed = createD1Kv(d1);
    await createTestUser({ STATS: seed }, 'bob', 'pass', { canUpload: true });
    const token = await createToken({ type: 'user', username: 'bob' }, 3600_000, env.TOKEN_SECRET);
    const c = makeCtx();

    const res = await upload(env, c.ctx, token, { name: 'wired.png' });
    expect(res.status).toBe(201);
    const { key } = await res.json();
    await c.settle();

    expect(await seed.get('imgmeta:' + key)).not.toBe(null);   // 落在 D1
    expect(await kv.get('imgmeta:' + key)).toBe(null);         // KV 一个字节没写
    expect(await kv.get('ucount:total:bob')).toBe(null);
  });

  test('没有 DB 绑定时不替换 env.STATS（回滚路径）', async () => {
    const kv = createKV();
    const env = createEnv({ STATS: kv });   // 不传 DB
    const c = makeCtx();

    await worker.fetch(new Request('http://localhost/install.sh'), env, c.ctx);

    expect(env.STATS).toBe(kv);             // 保持原样，业务继续走 KV
  });
});
