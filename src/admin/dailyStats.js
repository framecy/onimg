/**
 * 按天统计 —— 后台趋势图的真实数据源。
 *
 * ── 为什么需要它 ─────────────────────────────────────────────────────────────
 * 后台原有的迷你趋势线是「用 localStorage 记录每次打开后台时的数值」模拟出来的：
 * 只在管理员打开页面时采样、最多 10 个点、换浏览器就归零，画出来的曲线没有意义。
 * 这里改为在业务路径上真实累加每天的计数，读的时候按日期范围一次取出。
 *
 * ── 写入成本（重要）─────────────────────────────────────────────────────────
 * 每次计数 +1 行写。以图片访问为例：原先 1 行（stats:{key}），现在 2 行。
 * D1 免费版 10 万行写/天，按 500 次访问/天算是 1000 行（1%），可接受。
 * 所有写入都走 ctx.waitUntil，不阻塞响应。
 *
 * ── key 格式 ────────────────────────────────────────────────────────────────
 *   daily:{metric}:{YYYY-MM-DD}   值为十进制计数字符串
 *
 * metric 取值：
 *   imgview   图片被访问
 *   pageview  托管页面被访问
 *   protoview 原型 HTML 被访问
 *   upload    上传成功（图片 / 原型都算）
 *
 * TTL 400 天：够画一年趋势，也不会无限占用存储。
 */

const TTL_DAYS = 400;

/** UTC 日期字符串 "YYYY-MM-DD" */
export const utcDay = (ts = Date.now()) => new Date(ts).toISOString().slice(0, 10);

export const dailyKey = (metric, day = utcDay()) => `daily:${metric}:${day}`;

/** 已知的 metric 白名单：读取接口据此拒绝任意 key 扫描 */
export const DAILY_METRICS = ['imgview', 'pageview', 'protoview', 'upload'];

/**
 * 累加某天的某个计数（best-effort，失败静默）。
 *
 * 读-改-写不是原子的，高并发下可能丢极少量计数 —— 趋势图用途可接受，
 * 与 cfCounters 的取舍一致。
 *
 * @param {KVNamespace} stats  env.STATS（实际是 D1 适配器）
 * @param {string}      metric 见 DAILY_METRICS
 * @param {number}      delta  增量，默认 1
 */
export async function bumpDaily(stats, metric, delta = 1) {
  try {
    const key = dailyKey(metric);
    const cur = parseInt((await stats.get(key)) ?? '0', 10);
    await stats.put(key, String(cur + delta), { expirationTtl: TTL_DAYS * 86400 });
  } catch { /* 静默忽略，不影响主业务 */ }
}

/**
 * 读取最近 N 天的计数序列（含没有数据的日子，补 0）。
 *
 * 一次 D1 范围查询取回整段，而不是逐 key get —— 30 天只要 1 次查询。
 *
 * @param {KVNamespace} stats env.STATS
 * @param {string} metric     见 DAILY_METRICS
 * @param {number} days       天数（1–365）
 * @returns {Promise<Array<{day: string, count: number}>>} 按日期升序
 */
export async function readDailyRange(stats, metric, days = 30) {
  // 注意不能用 `Number(days) || 30` 兜底：days=0 是 falsy，会被误当成「没传」
  // 而退回 30，而不是按预期钳到下限 1。先判有效性，再钳区间。
  const num = Number(days);
  const n = Math.min(Math.max(Number.isFinite(num) ? num : 30, 1), 365);
  const today = utcDay();
  const from = utcDay(Date.now() - (n - 1) * 86400 * 1000);
  const prefix = `daily:${metric}:`;

  // D1 适配器支持 list()；单次最多 1000 个 key，一年 365 个足够
  const res = await stats.list({ prefix, limit: 1000 });
  const found = new Map();
  for (const k of res?.keys ?? []) {
    const day = k.name.slice(prefix.length);
    if (day >= from && day <= today) found.set(day, k.name);
  }

  // 只对落在区间内的 key 取值（通常就是 n 个）
  const values = await Promise.all(
    [...found.entries()].map(async ([day, name]) => [day, parseInt((await stats.get(name)) ?? '0', 10)]),
  );
  const byDay = new Map(values);

  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const day = utcDay(Date.now() - i * 86400 * 1000);
    out.push({ day, count: byDay.get(day) ?? 0 });
  }
  return out;
}
