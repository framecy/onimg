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
 *   upload    图片上传成功（原型上传未计入，见下）
 *
 * 已知缺口：原型上传（src/proto/upload.js）目前不累加 upload。
 * 原型的上传链路是分批 + finalize 的，一个原型会产生多次请求，
 * 「上传次数」的口径需要先定义清楚（算一次原型还是算每批）再决定接在哪。
 * 在定义清楚之前先不接，避免指标含义含糊。
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
    const next = cur + delta;
    // 计数同时写进 metadata：读取时 list() 会带上 metadata，
    // 因此一次 list 就能拿到整段区间的计数，不必逐 key get。
    // 这不是锦上添花 —— 90 天 × 4 指标若逐 key 取，会是 360+ 次绑定调用，
    // 远超 Workers 免费版单请求 50 次子请求的上限，接口会直接失败。
    await stats.put(key, String(next), {
      metadata: { count: next },
      expirationTtl: TTL_DAYS * 86400,
    });
  } catch { /* 静默忽略，不影响主业务 */ }
}

/**
 * 读取最近 N 天的计数序列（含没有数据的日子，补 0）。
 *
 * 只做 1 次 list：计数冗余在 key 的 metadata 上，list 会一并返回，
 * 所以无论 days 多大，子请求数恒为 1。
 *
 * 兼容：早期写入的 key 没有 metadata（或 count 非数字）时，退回逐 key 取值。
 * 那种情况只会出现在升级前的历史数据上，且量很小。
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
  const byDay = new Map();
  const needFetch = [];

  for (const k of res?.keys ?? []) {
    const day = k.name.slice(prefix.length);
    if (day < from || day > today) continue;
    const c = k.metadata?.count;
    if (typeof c === 'number' && Number.isFinite(c)) byDay.set(day, c);
    else needFetch.push([day, k.name]);   // 老数据没有 metadata，单独取
  }

  if (needFetch.length) {
    const fetched = await Promise.all(
      needFetch.map(async ([day, name]) => [day, parseInt((await stats.get(name)) ?? '0', 10)]),
    );
    for (const [day, count] of fetched) byDay.set(day, count);
  }

  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const day = utcDay(Date.now() - i * 86400 * 1000);
    out.push({ day, count: byDay.get(day) ?? 0 });
  }
  return out;
}
