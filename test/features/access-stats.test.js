// 访问统计的回归测试 —— 2026-11-04「越用越慢」事故的防线。
//
// 事故回顾：旧实现把每次访问 unshift 进一个最多 200 条的 JSON 数组，
// 每次请求「读整行 → 改 → 写回整行」。热门图的行涨到约 4 KB，每次访问重写 4 KB；
// 再叠加 d1u: 记账（2 读 2 写），单张图片访问 = 8 条 D1 语句、4 条写。
// 页面里几十张图并发加载，D1 被串行化，于是「越用越慢」。
//
// 这里钉死三件事：
//   1. 一次访问只产生 1 读 + 1 写（不再有明细数组读改写）
//   2. 计数行的体积与访问次数无关（恒定小行）
//   3. 旧数组形态仍能被读出来（升级不丢历史数据）
import { describe, test, expect } from 'vitest';
import { createEnv, createD1, createTestImage } from '../helpers/mock-env.js';
import { createD1Kv } from '../../src/kv-d1.js';
import { handleGet } from '../../src/get.js';
import {
  recordAccess, readAccessStats, readAllAccessStats, accessKey, deleteAccessStats,
} from '../../src/admin/access-stats.js';

function makeCtx() {
  const pending = [];
  return {
    ctx: { waitUntil: p => pending.push(Promise.resolve(p).catch(() => {})) },
    drain: () => Promise.all(pending.splice(0)),
  };
}

function imgReq(url = 'http://localhost/a.jpg', country = 'US') {
  return new Request(url, { headers: { 'CF-Connecting-IP': '1.2.3.4', 'CF-IPCountry': country } });
}

describe('访问统计：定长计数行', () => {
  test('单次访问 = 1 读 + 1 写，不读明细数组', async () => {
    let statements = [];
    const d1 = createD1();
    const origPrepare = d1.prepare.bind(d1);
    d1.prepare = (sql) => {
      statements.push(sql.trim().replace(/\s+/g, ' ').slice(0, 40));
      return origPrepare(sql);
    };
    const env = createEnv({ STATS: createD1Kv(d1), BUCKET: createEnv().BUCKET });
    await createTestImage(env, 'a.jpg', 'alice');

    // 先跑一次建立计数行（首次访问会多读一次旧 key 兜底，属兼容路径）
    await recordAccess(env.STATS, 'img', 'a.jpg', imgReq());

    // 稳态：一次读 + 一次写，不再有「读明细数组 → 改 → 写回整行」的第二轮
    statements = [];
    await recordAccess(env.STATS, 'img', 'a.jpg', imgReq());
    expect(statements.filter(s => s.startsWith('SELECT')).length).toBe(1);
    expect(statements.filter(s => s.startsWith('INSERT')).length).toBe(1);
  });

  test('计数行体积与访问次数无关（60 次后仍 < 1 KB）', async () => {
    const env = createEnv();
    for (let i = 0; i < 60; i++) {
      await recordAccess(env.STATS, 'img', 'hot.jpg', imgReq(undefined, i % 2 ? 'US' : 'JP'));
    }
    const row = await env.STATS.getWithMetadata(accessKey('img', 'hot.jpg'), 'json');
    expect(row.metadata.count).toBe(60);
    expect(JSON.stringify(row.metadata).length).toBeLessThan(1024);
    // 国家分布是聚合的，不是逐条
    expect(row.metadata.countries.JP + row.metadata.countries.US).toBe(60);
  });

  test('国家数量封顶，不会被随机国家撑爆行', async () => {
    const env = createEnv();
    for (let i = 0; i < 200; i++) {
      await recordAccess(env.STATS, 'img', 'many.jpg', imgReq(undefined, 'C' + String.fromCharCode(65 + (i % 26))));
    }
    const row = await env.STATS.getWithMetadata(accessKey('img', 'many.jpg'), 'json');
    expect(row.metadata.count).toBe(200);
    expect(Object.keys(row.metadata.countries).length).toBeLessThanOrEqual(24);
  });

  test('旧数组形态（stats:）能被读出来，并在下次写入时迁移', async () => {
    const env = createEnv();
    await env.STATS.put('stats:old.jpg', JSON.stringify([
      { ip: '1.1.1.1', country: 'US', ts: 1000 },
      { ip: '2.2.2.2', country: 'US', ts: 900 },
      { ip: '3.3.3.3', country: 'JP', ts: 800 },
    ]), { metadata: { count: 3, lastAccess: 1000 } });

    // 读：兜底解析旧数组
    const before = await readAccessStats(env.STATS, 'img', 'old.jpg');
    expect(before.count).toBe(3);
    expect(before.source).toBe('legacy');
    expect(before.countries.US).toBe(2);

    // 写：从旧计数接着累加，新 key 落定
    await recordAccess(env.STATS, 'img', 'old.jpg', imgReq());
    const after = await readAccessStats(env.STATS, 'img', 'old.jpg');
    expect(after.count).toBe(4);
    expect(after.source).toBe('new');
  });

  test('readAllAccessStats 合并新旧前缀，不重复计数', async () => {
    const env = createEnv();
    await env.STATS.put('stats:legacy.jpg', JSON.stringify([{ ip: '1', country: 'US', ts: 1 }]), {
      metadata: { count: 5, lastAccess: 10 },
    });
    await recordAccess(env.STATS, 'img', 'fresh.jpg', imgReq());

    const all = await readAllAccessStats(env.STATS, 'img');
    expect(all['legacy.jpg'].count).toBe(5);
    expect(all['fresh.jpg'].count).toBe(1);
  });

  test('deleteAccessStats 同时清掉新旧两种 key', async () => {
    const env = createEnv();
    await env.STATS.put('stats:x.jpg', JSON.stringify([]), { metadata: { count: 9 } });
    await recordAccess(env.STATS, 'img', 'x.jpg', imgReq());

    await deleteAccessStats(env.STATS, 'img', 'x.jpg');
    expect(await env.STATS.get(accessKey('img', 'x.jpg'))).toBe(null);
    expect(await env.STATS.get('stats:x.jpg')).toBe(null);
  });

  test('三种类型（img / page / proto）互不串号', async () => {
    const env = createEnv();
    await recordAccess(env.STATS, 'img', 'same', imgReq());
    await recordAccess(env.STATS, 'page', 'same', imgReq());
    await recordAccess(env.STATS, 'page', 'same', imgReq());

    expect((await readAccessStats(env.STATS, 'img', 'same')).count).toBe(1);
    expect((await readAccessStats(env.STATS, 'page', 'same')).count).toBe(2);
    expect((await readAccessStats(env.STATS, 'proto', 'same')).count).toBe(0);
  });
});

describe('图片访问链路：整条请求的 D1 写次数', () => {
  test('一次图片访问只产生 2 行小写入（计数行 + 按天计数），不再重写明细', async () => {
    const d1 = createD1();
    const env = createEnv({ STATS: createD1Kv(d1), BUCKET: createEnv().BUCKET });
    await createTestImage(env, 'w.jpg', 'alice');
    const { ctx, drain } = makeCtx();

    // 预热：第一次会创建计数行
    await handleGet(env, ctx, 'w.jpg', imgReq('http://localhost/w.jpg'));
    await drain();

    let inserts = 0;
    const origPrepare = d1.prepare.bind(d1);
    d1.prepare = (sql) => {
      const stmt = origPrepare(sql);
      const api = {
        bind(...a) { stmt.bind(...a); return api; },
        async run() { if (sql.includes('INSERT')) inserts++; return stmt.run(); },
        all: (...a) => stmt.all(...a),
        first: (...a) => stmt.first(...a),
      };
      return api;
    };

    await handleGet(env, ctx, 'w.jpg', imgReq('http://localhost/w.jpg'));
    await drain();

    // 两行都是定长小行：astat:img:{key} 与 daily:imgview:{day}。
    // 旧实现是「整行明细重写（最多 4 KB）+ daily + d1u 记账」，且随访问量增长。
    expect(inserts).toBe(2);
  });
});
