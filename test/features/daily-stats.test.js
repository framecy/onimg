// 按天统计与趋势接口的测试。
//
// 背景：后台的趋势线原本是 localStorage 模拟的假数据（只在打开后台时采样、
// 最多 10 点、换浏览器归零）。改为在业务路径上真实累加每日计数，
// 这里验证「累加正确、区间补齐、越界拒绝」。
import { describe, test, expect, beforeEach } from 'vitest';
import { createEnv, authedRequest, createTestUser, createTestImage } from '../helpers/mock-env.js';
import { createToken } from '../../src/admin/auth.js';
import { bumpDaily, readDailyRange, dailyKey, utcDay, DAILY_METRICS } from '../../src/admin/dailyStats.js';
import { handleTrend } from '../../src/admin/stats.js';
import { handleGet } from '../../src/get.js';
import { handleUpload } from '../../src/upload.js';
import { servePage } from '../../src/pages/handler.js';

function mkCtx() {
  const p = [];
  return { ctx: { waitUntil: (x) => p.push(Promise.resolve(x).catch(() => {})), passThroughOnException: () => {} }, settle: () => Promise.all(p) };
}

describe('dailyStats：累加与读取', () => {
  let env;
  beforeEach(() => { env = createEnv(); });

  test('bumpDaily 累加同一天的计数', async () => {
    await bumpDaily(env.STATS, 'imgview');
    await bumpDaily(env.STATS, 'imgview');
    await bumpDaily(env.STATS, 'imgview', 3);
    expect(await env.STATS.get(dailyKey('imgview'))).toBe('5');
  });

  test('不同 metric 互不干扰', async () => {
    await bumpDaily(env.STATS, 'imgview', 2);
    await bumpDaily(env.STATS, 'pageview', 7);
    expect(await env.STATS.get(dailyKey('imgview'))).toBe('2');
    expect(await env.STATS.get(dailyKey('pageview'))).toBe('7');
  });

  test('readDailyRange 补齐没有数据的日子为 0，且按日期升序', async () => {
    const seq = await readDailyRange(env.STATS, 'imgview', 7);
    expect(seq).toHaveLength(7);
    expect(seq.every(p => p.count === 0)).toBe(true);
    // 升序：最后一项是今天
    expect(seq[seq.length - 1].day).toBe(utcDay());
    const days = seq.map(p => p.day);
    expect([...days].sort()).toEqual(days);
  });

  test('readDailyRange 只取区间内的数据', async () => {
    await bumpDaily(env.STATS, 'imgview', 4);
    const seq = await readDailyRange(env.STATS, 'imgview', 3);
    expect(seq[seq.length - 1].count).toBe(4);
    expect(seq.slice(0, -1).every(p => p.count === 0)).toBe(true);
  });

  test('days 参数被钳制在 1–365', async () => {
    expect(await readDailyRange(env.STATS, 'imgview', 0)).toHaveLength(1);
    expect(await readDailyRange(env.STATS, 'imgview', 9999)).toHaveLength(365);
  });
});

describe('业务路径真的会累加计数', () => {
  test('访问图片 → imgview +1', async () => {
    const env = createEnv();
    await createTestImage(env, 'a.jpg', 'alice');
    const c = mkCtx();
    await handleGet(env, c.ctx, 'a.jpg', new Request('http://x/a.jpg'));
    await c.settle();
    expect(await env.STATS.get(dailyKey('imgview'))).toBe('1');
  });

  test('图片不存在时不计数（404 不该算访问）', async () => {
    const env = createEnv();
    const c = mkCtx();
    const res = await handleGet(env, c.ctx, 'nope.jpg', new Request('http://x/nope.jpg'));
    await c.settle();
    expect(res.status).toBe(404);
    expect(await env.STATS.get(dailyKey('imgview'))).toBe(null);
  });

  test('访问托管页面 → pageview +1', async () => {
    const env = createEnv();
    await env.STATS.put('page:p1', JSON.stringify({
      slug: 'p1', title: 'P', content: '# hi', type: 'markdown', isPublic: true, owner: 'alice',
    }));
    const c = mkCtx();
    await servePage(env, 'p1', c.ctx, new Request('http://x/p/p1'));
    await c.settle();
    expect(await env.STATS.get(dailyKey('pageview'))).toBe('1');
  });

  test('上传成功 → upload +1', async () => {
    const env = createEnv();
    await createTestUser(env, 'alice', 'pass', { canUpload: true });
    const token = await createToken({ type: 'user', username: 'alice' }, 3600_000, env.TOKEN_SECRET);
    const fd = new FormData();
    fd.append('file', new File([new Uint8Array(256)], 'u.png', { type: 'image/png' }));
    const c = mkCtx();
    const res = await handleUpload(new Request('http://x/upload', {
      method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: fd,
    }), env, c.ctx);
    await c.settle();
    expect(res.status).toBe(201);
    expect(await env.STATS.get(dailyKey('upload'))).toBe('1');
  });
});

describe('/admin/trend 接口', () => {
  let env, adminToken;
  beforeEach(async () => {
    env = createEnv();
    adminToken = await createToken({ type: 'admin', username: 'admin' }, 3600_000, env.TOKEN_SECRET);
  });

  test('返回四个指标的序列，长度等于请求天数', async () => {
    const res = await handleTrend(env, new URL('http://x/admin/trend?days=14'));
    const d = await res.json();
    expect(d.days).toBe(14);
    for (const m of DAILY_METRICS) {
      expect(d.series[m]).toHaveLength(14);
    }
  });

  test('刚上线无数据时 collectedMetrics=0（前端据此显示「积累中」）', async () => {
    const d = await (await handleTrend(env, new URL('http://x/admin/trend'))).json();
    expect(d.collectedMetrics).toBe(0);
    expect(d.series.imgview.every(p => p.count === 0)).toBe(true);
  });

  test('有数据后 collectedMetrics 反映有值的指标数', async () => {
    await bumpDaily(env.STATS, 'imgview', 3);
    await bumpDaily(env.STATS, 'upload', 1);
    const d = await (await handleTrend(env, new URL('http://x/admin/trend'))).json();
    expect(d.collectedMetrics).toBe(2);
    expect(d.series.imgview[d.series.imgview.length - 1].count).toBe(3);
    expect(d.series.upload[d.series.upload.length - 1].count).toBe(1);
  });

  test('days 越界被钳制（7–90）', async () => {
    const a = await (await handleTrend(env, new URL('http://x/admin/trend?days=1'))).json();
    expect(a.days).toBe(7);
    const b = await (await handleTrend(env, new URL('http://x/admin/trend?days=999'))).json();
    expect(b.days).toBe(90);
  });

  test('非法 days 退回默认 30', async () => {
    const d = await (await handleTrend(env, new URL('http://x/admin/trend?days=abc'))).json();
    expect(d.days).toBe(30);
  });
});

describe('读取的子请求预算（免费版单请求上限 50）', () => {
  // 这不是理论问题：90 天 × 4 指标若逐 key 取值 = 360+ 次绑定调用，接口会直接失败。
  // 计数冗余进 metadata 后，list() 一次带回全部计数，子请求数与天数无关。
  test('readDailyRange 只做 1 次 list，不随天数增长', async () => {
    const env = createEnv();
    for (let i = 0; i < 40; i++) {
      await env.STATS.put(dailyKey('imgview', utcDay(Date.now() - i * 86400000)), String(i), {
        metadata: { count: i },
      });
    }
    let lists = 0, gets = 0;
    const spy = {
      list: (...a) => { lists++; return env.STATS.list(...a); },
      get: (...a) => { gets++; return env.STATS.get(...a); },
    };
    const seq = await readDailyRange(spy, 'imgview', 90);
    expect(seq).toHaveLength(90);
    expect(lists).toBe(1);
    expect(gets).toBe(0);            // metadata 命中，完全不需要逐 key 取
    expect(seq[seq.length - 1].count).toBe(0);
    expect(seq[seq.length - 2].count).toBe(1);
  });

  test('bumpDaily 把计数同时写进 metadata', async () => {
    const env = createEnv();
    await bumpDaily(env.STATS, 'imgview', 7);
    const { value, metadata } = await env.STATS.getWithMetadata(dailyKey('imgview'));
    expect(value).toBe('7');
    expect(metadata).toEqual({ count: 7 });
  });

  test('老数据没有 metadata 时退回逐 key 取值（兼容升级前）', async () => {
    const env = createEnv();
    const day = utcDay();
    await env.STATS.put(dailyKey('pageview', day), '42');   // 故意不带 metadata
    let gets = 0;
    const spy = { list: (...a) => env.STATS.list(...a), get: (...a) => { gets++; return env.STATS.get(...a); } };
    const seq = await readDailyRange(spy, 'pageview', 3);
    expect(gets).toBe(1);                                    // 只对缺 metadata 的那 1 个补取
    expect(seq[seq.length - 1].count).toBe(42);
  });
});
