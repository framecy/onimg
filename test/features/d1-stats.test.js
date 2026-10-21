// D1 面板的数据层回归测试。
//
// 覆盖三件事：
//   1. 用量自追踪读的确实是 D1 返回的 meta.rows_read / rows_written
//      （这是「没配 CF API Token 也能显示真实用量」的全部依据，写错就成了假数据）
//   2. 前缀分布加总必须等于总行数 —— 前缀之间有包含关系（proto: 包含
//      proto:staging:），曾经想用 GROUP BY 一次算完，那会把同一行算进两组
//   3. 没有 D1 绑定时接口不 500，而是明确告诉前端「不可用」及其原因
import { describe, test, expect, beforeEach } from 'vitest';
import { createEnv, createD1, createKV } from '../helpers/mock-env.js';
import { createD1Kv } from '../../src/kv-d1.js';
import {
  D1_LIMITS, d1Day, readD1Overview, readD1Usage, recordD1Usage,
} from '../../src/admin/d1Stats.js';
import { handleD1Stats, handleCfQuota } from '../../src/admin/stats.js';

/** 建一个「已接线」的 env：STATS 走 D1 适配器，计数任务同步收集起来等 drain */
async function wiredEnv() {
  const d1 = createD1();
  const pending = [];
  const env = createEnv({ DB: d1 });
  env.STATS = createD1Kv(d1, { waitUntil: p => pending.push(p) });
  const drain = async () => {
    // 计数任务本身还会再触发计数，所以循环到队列见底（设上限防止意外死循环）
    for (let i = 0; i < 20 && pending.length; i++) {
      const batch = pending.splice(0, pending.length);
      await Promise.all(batch);
    }
  };
  return { d1, env, drain };
}

describe('用量自追踪：读 D1 的 meta 口径', () => {
  test('写入累加 rows_written，读取累加 rows_read', async () => {
    const { env, drain } = await wiredEnv();

    await env.STATS.put('imgmeta:a.jpg', JSON.stringify({ size: 10 }));
    await env.STATS.put('imgmeta:b.jpg', JSON.stringify({ size: 10 }));
    await drain();

    const afterWrite = await readD1Usage(env.STATS, 30);
    expect(afterWrite.today.rowsWritten).toBeGreaterThanOrEqual(2);

    await env.STATS.get('imgmeta:a.jpg');
    await env.STATS.list({ prefix: 'imgmeta:' });
    await drain();

    const afterRead = await readD1Usage(env.STATS, 30);
    expect(afterRead.today.rowsRead).toBeGreaterThan(0);
  });

  test('没有任何行读写时不产生计数（避免空转写）', async () => {
    const { env, drain } = await wiredEnv();
    await recordD1Usage(env.STATS, { rowsRead: 0, rowsWritten: 0 });
    await env.STATS.put('noop', '1');       // 只为让环境里有数据
    await drain();
    const before = (await readD1Usage(env.STATS, 30)).today.rowsRead;
    expect(before).toBe(0);
  });

  test('跨 UTC 日界分别归到各自的日记账', async () => {
    const { env } = await wiredEnv();
    const day1 = Date.parse('2026-03-01T12:00:00Z');
    const day2 = Date.parse('2026-03-02T12:00:00Z');

    await recordD1Usage(env.STATS, { rowsRead: 100, rowsWritten: 7 }, day1);
    await recordD1Usage(env.STATS, { rowsRead: 250, rowsWritten: 9 }, day2);

    const u = await readD1Usage(env.STATS, 30, day2);
    expect(u.today.rowsRead).toBe(250);
    expect(u.today.rowsWritten).toBe(9);
    const d1 = u.days.find(d => d.day === '2026-03-01');
    expect(d1).toEqual({ day: '2026-03-01', rowsRead: 100, rowsWritten: 7 });
  });

  test('区间内的天连成一条完整序列（缺的天补 0）', async () => {
    const { env } = await wiredEnv();
    const now = Date.parse('2026-05-10T12:00:00Z');
    await recordD1Usage(env.STATS, { rowsRead: 5 }, now);

    const u = await readD1Usage(env.STATS, 7, now);
    expect(u.days).toHaveLength(7);
    expect(u.days[6].day).toBe('2026-05-10');
    expect(u.days[6].rowsRead).toBe(5);
    expect(u.days[0].rowsRead).toBe(0);
    // 日期升序
    const days = u.days.map(d => d.day);
    expect([...days].sort()).toEqual(days);
  });
});

describe('用量记账不能自激（回归）', () => {
  // 曾经的真实事故：记账本身是一次 D1 写，而适配器把每次写都拿去记账，
  // 于是「记一次账 → 产生一次写 → 再记一次账」无限循环。表现是第一次上传
  // 之后第二个请求直接卡死、CPU 打满 —— 单元测试全绿，只有真实多请求序列
  // 才会踩到。这里用「计数器写入次数必须有限」来钉死它。
  test('连续多次写入后，计数器写入次数有上限且不随写入次数爆炸', async () => {
    const d1 = createD1();
    const pending = [];
    const env = createEnv({ DB: d1 });
    const kv = createD1Kv(d1, { waitUntil: p => pending.push(p) });

    let counterWrites = 0;
    const origPrepare = d1.prepare;
    d1.prepare = (sql) => {
      const stmt = origPrepare(sql);
      const api = {
        bind(...a) { stmt.bind(...a); return api; },
        async run() {
          if (sql.includes('kv_store') && sql.includes('INSERT')) counterWrites++;
          return stmt.run();
        },
        all: (...a) => stmt.all(...a),
        first: (...a) => stmt.first(...a),
      };
      return api;
    };

    for (let i = 0; i < 5; i++) {
      await kv.put('imgmeta:' + i, '{}');
      await Promise.all(pending.splice(0, pending.length));
    }

    // 5 次业务写 + 少量计数写即可；自激时这个数会无限增长（根本跑不完）
    expect(counterWrites).toBeLessThan(20);
  });
});

describe('元数据概览：行数 / 体积 / 前缀分布', () => {
  let env, d1, drain;
  beforeEach(async () => { ({ env, d1, drain } = await wiredEnv()); });

  async function seed() {
    for (let i = 0; i < 12; i++) await env.STATS.put('imgmeta:' + i + '.jpg', JSON.stringify({ size: 1 }), { metadata: { owner: 'a' } });
    for (let i = 0; i < 30; i++) await env.STATS.put('stats:' + i + '.jpg', JSON.stringify([{ ip: '1' }]));
    for (let i = 0; i < 4; i++) await env.STATS.put('user:u' + i, JSON.stringify({ u: i }));
    await env.STATS.put('page:hello', JSON.stringify({ slug: 'hello' }));
    await env.STATS.put('proto:p1', JSON.stringify({ id: 'p1' }));
    await env.STATS.put('proto:staging:abc', 'x', { expirationTtl: 60 });
    await drain();
  }

  test('分布加总等于总行数（前缀包含关系不能重复计数）', async () => {
    await seed();
    const m = await readD1Overview(d1);
    const sum = m.byPrefix.reduce((s, p) => s + p.count, 0);
    expect(sum).toBe(m.totalRows);
    expect(m.unknownRows).toBe(0);
  });

  test('用量计数器自己不参与「元数据」统计', async () => {
    // 观察性数据不该被观察行为扰动：面板每打开一次都会写出 d1u: 行，
    // 若把它算进元数据，这个数字会随着「你看了几次面板」而变。
    await seed();
    const m = await readD1Overview(d1);
    expect(m.byPrefix.some(p => p.prefix === 'd1u:')).toBe(false);
    const imgRows = m.byPrefix.find(p => p.prefix === 'imgmeta:').count;
    expect(imgRows).toBe(12);   // 播种的 12 张，不多不少
  });

  test('proto:staging: 归到「原型暂存」，不被 proto: 吞掉', async () => {
    await seed();
    const m = await readD1Overview(d1);
    const staging = m.byPrefix.find(p => p.prefix === 'proto:staging:');
    const proto   = m.byPrefix.find(p => p.prefix === 'proto:');
    // proto: 是前缀包含关系：proto:staging:abc 同时以 proto: 开头，
    // 所以 proto: 组里会算进它（2 行）。这正是为什么不能用一个 GROUP BY 分组，
    // 而要给每个前缀各发一条 COUNT —— 否则 staging 那一行会被数两遍。
    expect(staging?.count).toBe(1);
    expect(staging?.label).toBe('原型暂存');
    expect(proto?.count).toBe(2);

    // 加总口径：原型类 = 专属行数 + 被包含的 1 行 = 2，与实际存在的 2 个 key 一致
    const protoKeys = m.byPrefix.filter(p => p.prefix === 'proto:')[0].count;
    expect(protoKeys).toBe(2);
  });

  test('体积 > 0 且随内容增长', async () => {
    await seed();
    const small = await readD1Overview(d1);
    expect(small.totalBytes).toBeGreaterThan(0);

    await env.STATS.put('imgmeta:big.jpg', 'x'.repeat(5000));
    await drain();
    const big = await readD1Overview(d1);
    expect(big.totalBytes).toBeGreaterThan(small.totalBytes + 4000);
    expect(big.totalRows).toBe(small.totalRows + 1);
  });

  test('最近写入时间取 updated_at 的最大值', async () => {
    await seed();
    const before = Date.now();
    await env.STATS.put('imgmeta:fresh.jpg', '{}');
    await drain();
    const m = await readD1Overview(d1);
    expect(m.lastWriteAt).toBeGreaterThanOrEqual(before - 1000);
    expect(m.firstWriteAt).toBeLessThanOrEqual(m.lastWriteAt);
  });

  test('空库不报错，返回 0 而不是 null', async () => {
    const m = await readD1Overview(d1);
    expect(m.totalRows).toBe(0);
    expect(m.totalBytes).toBe(0);
    expect(m.byPrefix).toEqual([]);
    expect(m.lastWriteAt).toBeNull();
  });

  test('未登记的前缀计入 unknownRows，不会从总数里悄悄消失', async () => {
    await env.STATS.put('brandnew:thing', '1');
    await drain();
    const m = await readD1Overview(d1);
    // totalRows 口径 = 已知分布之和，未登记的行单独由 unknownRows 报告，
    // 前端会把它们画成「其他」那一段，所以不会丢
    expect(m.unknownRows).toBe(1);
    expect(m.byPrefix).toEqual([]);
  });
});

describe('/admin/d1-stats 响应形状', () => {
  test('有 D1：返回额度、用量、库规模', async () => {
    const { env, drain } = await wiredEnv();
    await env.STATS.put('imgmeta:a.jpg', '{}');
    await drain();

    const d = await (await handleD1Stats(env)).json();
    expect(d.available).toBe(true);
    expect(d.limits).toEqual(D1_LIMITS);
    expect(d.usage.today.rowsWritten).toBeGreaterThan(0);
    expect(d.meta.totalRows).toBeGreaterThan(0);
    expect(d.usage.days).toHaveLength(30);
  });

  test('元数据表不存在时不 500，而是给出 metaError', async () => {
    const env = createEnv({ DB: createD1({ schema: null }) });
    env.STATS = createD1Kv(env.DB);
    const res = await handleD1Stats(env);
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.available).toBe(true);
    expect(d.meta).toBeNull();
    expect(typeof d.metaError).toBe('string');
  });

  test('没有 D1 绑定（回滚到 KV / 本地 Node）时 available=false 且说明原因', async () => {
    const env = createEnv({ STATS: createKV() });
    delete env.DB;
    const d = await (await handleD1Stats(env)).json();
    expect(d.available).toBe(false);
    expect(d.reason).toBe('kv');
    expect(d.meta).toBeNull();
  });
});

describe('/admin/d1-stats 的用量来源', () => {
  const withCf = (env) => Object.assign(env, {
    CF_API_TOKEN: 'test-token', CF_ACCOUNT_ID: 'acct', CF_D1_DB_ID: 'db-id',
  });

  test('配了 CF_D1_DB_ID：用量取自 CF Analytics，并标注来源', async () => {
    const { env } = await wiredEnv();
    withCf(env);

    const today = d1Day();
    const origFetch = global.fetch;
    global.fetch = async () => new Response(JSON.stringify({
      data: { viewer: { accounts: [{
        d1AnalyticsAdaptiveGroups: [
          { dimensions: { date: today }, sum: { rowsRead: 1234, rowsWritten: 56 } },
        ],
      }] } },
    }), { status: 200 });

    try {
      const d = await (await handleD1Stats(env)).json();
      expect(d.usageSource).toBe('cf-api');
      // CF 的口径覆盖所有客户端，比自追踪计数器权威 —— 面板必须以它为准，
      // 否则额度卡片和趋势图会各显示一套数字（线上真出现过 6.9 万 vs 4.6 千）
      expect(d.usage.today.rowsRead).toBe(1234);
      expect(d.usage.today.rowsWritten).toBe(56);
      expect(d.usage.month.rowsRead).toBeGreaterThanOrEqual(1234);
      expect(d.usage.days).toHaveLength(30);
      expect(d.usage.days[29].day).toBe(today);
      expect(d.usage.days[29].rowsRead).toBe(1234);
    } finally {
      global.fetch = origFetch;
    }
  });

  test('CF 查询失败（缺权限 / 数据集不可用）时退回自追踪，而不是显示成 0', async () => {
    const { env, drain } = await wiredEnv();
    withCf(env);
    await env.STATS.put('imgmeta:a.jpg', '{}');
    await drain();

    const origFetch = global.fetch;
    global.fetch = async () => new Response(JSON.stringify({
      data: null, errors: [{ message: 'no dataset' }],
    }), { status: 200 });

    try {
      const d = await (await handleD1Stats(env)).json();
      expect(d.usageSource).toBe('self');
      expect(d.usage.today.rowsWritten).toBeGreaterThan(0);
    } finally {
      global.fetch = origFetch;
    }
  });
});

describe('/admin/cf-quota 里的 D1 段', () => {
  test('降级模式下 d1 字段来自自追踪，且保留免费版额度常量', async () => {
    const { env, drain } = await wiredEnv();
    await env.STATS.put('imgmeta:a.jpg', '{}');
    await drain();

    const d = await (await handleCfQuota(env)).json();
    expect(d.source).toBe('self-tracked');
    expect(d.d1.rowsWrittenToday).toBeGreaterThan(0);
    expect(d.d1.rowsWrittenDaily).toBe(D1_LIMITS.rowsWrittenDaily);
    expect(d.d1.rowsReadDaily).toBe(D1_LIMITS.rowsReadDaily);
    // KV 段应彻底消失
    expect(d.kv).toBeUndefined();
  });
});

describe('额度常量与官方口径一致', () => {
  // 来源：https://developers.cloudflare.com/d1/platform/pricing/
  //       https://developers.cloudflare.com/d1/platform/limits/
  test('免费版：500 万行读/天、10 万行写/天、单库 500 MB', () => {
    expect(D1_LIMITS.rowsReadDaily).toBe(5_000_000);
    expect(D1_LIMITS.rowsWrittenDaily).toBe(100_000);
    expect(D1_LIMITS.storageBytes).toBe(500 * 1024 * 1024);
  });

  test('日界按 UTC 归日', () => {
    expect(d1Day(Date.parse('2026-01-01T23:59:59Z'))).toBe('2026-01-01');
    expect(d1Day(Date.parse('2026-01-02T00:00:00Z'))).toBe('2026-01-02');
  });
});
