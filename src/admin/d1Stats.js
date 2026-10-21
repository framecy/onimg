/**
 * D1 数据面板 —— 后台「Cloudflare 免费额度」里的 D1 分组。
 *
 * ── 为什么需要它 ─────────────────────────────────────────────────────────────
 * 元数据已整体从 Workers KV 迁到 D1（接线见 src/index.js 的 withD1Stats），
 * 原来那块「Workers KV（STATS 命名空间）」面板展示的读/写/列表/删除操作数
 * 全部来自 KV 的 GraphQL 指标，现在已经是 0 或不存在的指标，留着只会误导。
 * 换成 D1 面板后，后台回答的是这两个真问题：
 *   · 我的库有多大？距离免费版上限还有多远？
 *   · 今天读了多少行、写了多少行？会不会撞到日配额？
 *
 * ── 两个数据来源（都是真实值，不是估算）────────────────────────────────────
 * 1. 自追踪（d1u: 计数器）—— src/kv-d1.js 每次读写后累加，读的正是 D1 官方
 *    计费口径 `meta.rows_read` / `meta.rows_written`。没配 CF API Token 时，
 *    面板显示的就是这一份。
 * 2. CF Analytics GraphQL —— 配了 Token 时按官方口径再取一份，覆盖本地值。
 *
 * ── 日界 ────────────────────────────────────────────────────────────────────
 * Cloudflare 按 **UTC** 归日，所以这里统一用 UTC，与 src/admin/cfCounters.js、
 * src/admin/dailyStats.js 一致（北京时间 08:00 之后才算新的一天）。
 *
 * ── 为什么不用 DATE(updated_at) 做分布 ─────────────────────────────────────
 * kv_store 只有 expires_at 上有索引，updated_at 没有。按它分组等于多扫一遍全表，
 * 每次打开后台都要付这份行读取。真正影响配额的是**行数**，不是时间分布。
 *
 * ── 为什么统计时要排除 d1u: 这些 key ────────────────────────────────────────
 * 用量计数器本身也存在 kv_store 里，而**一次全表扫描会顺带把计数器行读出来**，
 * 于是「打开一次面板」会在浏览面板的同时把面板的数字改写掉：读到的是扫描开始前
 * 的行数，记下的却是扫描开始后的。观察性数据不该被观察行为扰动，所以在 SQL 层面
 * 把 d1u: 排除掉 —— 表自己的元数据（行数/体积/前缀）不包括「用来量它自己的尺子」。
 * 计费与配额仍然按 D1 返回的 meta 全量计算（那才是官方口径），两者互不影响。
 */

/** Workers 免费版 D1 额度（官方：https://developers.cloudflare.com/d1/platform/pricing/） */
export const D1_LIMITS = {
  rowsReadDaily:    5_000_000,          // 行读取 / 天
  rowsWrittenDaily: 100_000,            // 行写入 / 天
  storageBytes:     500 * 1024 * 1024,  // 单库上限 500 MB（免费版，见 D1 limits）
};

/** UTC 日期 / 月份 */
export const d1Day   = (ts = Date.now()) => new Date(ts).toISOString().slice(0, 10);
export const d1Month = (ts = Date.now()) => new Date(ts).toISOString().slice(0, 7);

/** 计数键（存于 env.STATS，与 cfCounters 同一套机制） */
const bumpKey  = (kind, day) => `d1u:${kind}:${day}`;
const BUMP_TTL = 62 * 86400;   // 62 天：够算「本月」与「最近 30 天」

/**
 * 「这次写是记账，别再为它记账」的标记。
 * src/kv-d1.js 的 track() 会检查 put 的第三个参数里有没有它。
 * 用 Symbol 而不是字符串键：它不会进入 metadata 的 JSON、也不会污染 KV 的惯例字段。
 */
export const NO_TRACK = Symbol('d1.noTrack');


/**
 * 记录一次 D1 查询的用量（best-effort，失败静默）。
 *
 * 由 src/kv-d1.js 在读写成功后调用，统一走 ctx.waitUntil，不阻塞业务响应。
 *
 * @param {KVNamespace} stats  env.STATS（D1 适配器）
 * @param {{rowsRead?: number, rowsWritten?: number}} usage
 * @param {number} now         时间戳（测试可注入，便于跨日边界断言）
 */
export async function recordD1Usage(stats, usage, now = Date.now()) {
  const read    = Number(usage?.rowsRead)    || 0;
  const written = Number(usage?.rowsWritten) || 0;
  if (read <= 0 && written <= 0) return;
  const day = d1Day(now);
  try {
    // 读/写落在不同的 key 上，并行累加互不影响。
    //
    // ⚠️ 计数写入本身也是一次 D1 写。适配器必须认出「这次写是记账」并且不再
    // 为它记账 —— 否则每记一次账都会触发一次新的记账，形成自激循环（曾经真的
    // 这样了：第一次上传之后第二个请求直接卡死，CPU 打满）。识别方式是给这次
    // 写打上 NO_TRACK 标记，见 src/kv-d1.js 的 track()。
    await Promise.all([
      read    > 0 ? _addCounter(stats, bumpKey('r', day), read)    : null,
      written > 0 ? _addCounter(stats, bumpKey('w', day), written) : null,
    ]);
  } catch { /* 监控用途，静默忽略 */ }
}

async function _addCounter(stats, key, delta) {
  const cur = parseInt((await stats.get(key)) ?? '0', 10) || 0;
  await stats.put(key, String(cur + delta), { expirationTtl: BUMP_TTL, [NO_TRACK]: true });
}

/**
 * 读回最近 N 天的自追踪用量序列。
 *
 * 先一次 list 定位区间内的 key（62 天 × 2 类远低于单页 1000 的上限），再取当月
 * 全部与今日的 key 的值 —— 不做全量逐 key get，理由与 dailyStats.readDailyRange
 * 相同：Workers 免费版单请求子请求数只有 50。
 *
 * @returns {Promise<{days: Array<{day:string, rowsRead:number, rowsWritten:number}>,
 *                    today: {rowsRead:number, rowsWritten:number},
 *                    month: {rowsRead:number, rowsWritten:number}}>}
 */
export async function readD1Usage(stats, days = 30, now = Date.now()) {
  const list = await stats.list({ prefix: 'd1u:', limit: 1000 });

  const today = d1Day(now);
  const month = d1Month(now);
  const from  = d1Day(now - (days - 1) * 86400 * 1000);

  const byDay = new Map();   // day → { day, rowsRead, rowsWritten }
  const monthSum = { rowsRead: 0, rowsWritten: 0 };
  const todaySum = { rowsRead: 0, rowsWritten: 0 };
  const needValue = [];

  for (const k of list?.keys ?? []) {
    const m = /^d1u:([rw]):(\d{4}-\d{2}-\d{2})$/.exec(k.name);
    if (!m) continue;
    const [, kind, day] = m;

    const inMonth = day.startsWith(month);
    const isToday = day === today;
    const inRange = day >= from && day <= today;
    if (!inMonth && !inRange) continue;   // 与本月、趋势窗口都无关，跳过取值

    needValue.push({ kind, day, inMonth, isToday, inRange });
  }

  const values = await Promise.all(
    needValue.map(async ({ kind, day }) => {
      const key = bumpKey(kind, day);
      return [kind, day, parseInt((await stats.get(key)) ?? '0', 10) || 0];
    }),
  );

  for (const [kind, day, n] of values) {
    if (day.startsWith(month)) {
      if (kind === 'r') monthSum.rowsRead += n; else monthSum.rowsWritten += n;
    }
    if (day === today) {
      if (kind === 'r') todaySum.rowsRead += n; else todaySum.rowsWritten += n;
    }
    if (day < from || day > today) continue;
    const slot = byDay.get(day) ?? { day, rowsRead: 0, rowsWritten: 0 };
    if (kind === 'r') slot.rowsRead += n; else slot.rowsWritten += n;
    byDay.set(day, slot);
  }

  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = d1Day(now - i * 86400 * 1000);
    series.push(byDay.get(day) ?? { day, rowsRead: 0, rowsWritten: 0 });
  }

  return { days: series, today: todaySum, month: monthSum };
}

/**
 * 元数据键前缀 → 归类名。顺序有意义：查询时按这个顺序逐个 LIKE，
 * 「原型暂存」必须排在「原型」前面。
 */
export const KEY_GROUPS = [
  { prefix: 'imgmeta:',       label: '图片索引' },
  { prefix: 'stats:',         label: '图片访问记录' },
  { prefix: 'userimgs:',      label: '图库清单' },
  { prefix: 'ucount:',        label: '上传计数' },
  { prefix: 'page:',          label: '托管页面' },
  { prefix: 'pstats:',        label: '页面访问记录' },
  { prefix: 'proto:staging:', label: '原型暂存' },
  { prefix: 'proto:',         label: '原型元数据' },
  { prefix: 'prstats:',       label: '原型访问记录' },
  { prefix: 'proj:',          label: '项目' },
  { prefix: 'grp:',           label: '分组' },
  { prefix: 'user:',          label: '用户' },
  { prefix: 'audit:',         label: '审计日志' },
  { prefix: 'daily:',         label: '按天统计' },
  { prefix: 'cf:',            label: 'CF 用量计数' },
  { prefix: 'd1u:',           label: 'D1 用量计数' },
  { prefix: 'gstats:',        label: '全局计数缓存' },
];

const BYTES_EXPR =
  'LENGTH(key) + LENGTH(value) + COALESCE(LENGTH(metadata), 0)';

/** 元数据统计的可见范围：排除用量计数器自身（见文件头说明） */
const NOT_SELF = "key NOT LIKE 'd1u:%'";

/**
 * D1 元数据概览：总行数、占用体积、前缀分布、最近写入时间。
 *
 * 一次 batch 里发 N+1 条 SELECT，batch 保证它们看到同一份数据快照，
 * 总数与分布不会因为并发写而互相矛盾（分布加总必须等于总数）。
 *
 * 每条前缀一条独立 SELECT 而不是一条 SUM(CASE...)：
 * 前缀天然前缀重叠（proto: 包含 proto:staging:），用 GROUP BY 会把同一行
 * 算进两组，加总就重复了；独立查询各自算各自的，加总才等于总数。
 *
 * @param {D1Database} db  env.DB
 */
export async function readD1Overview(db) {
  // d1u: 不参与「元数据」统计，所以 KEY_GROUPS 里那一项在这里被过滤掉
  const groups = KEY_GROUPS.filter(g => g.prefix !== 'd1u:');

  const stmts = [
    db.prepare(`SELECT COUNT(*) AS total_rows,
                       COALESCE(SUM(${BYTES_EXPR}), 0) AS total_bytes,
                       MAX(updated_at) AS last_write,
                       MIN(updated_at) AS first_write
                FROM kv_store WHERE ${NOT_SELF}`),
    ...groups.map(g =>
      db.prepare(`SELECT COUNT(*) AS n, COALESCE(SUM(${BYTES_EXPR}), 0) AS b
                  FROM kv_store WHERE ${NOT_SELF} AND key LIKE ?`)
        .bind(g.prefix + '%'),
    ),
  ];

  const results = await db.batch(stmts);
  const head = results?.[0]?.results?.[0] ?? {};

  const byPrefix = groups.map((g, i) => {
    const row = results?.[i + 1]?.results?.[0] ?? {};
    return {
      prefix: g.prefix,
      label: g.label,
      count: Number(row.n) || 0,
      // SUM 在新版 SQLite 上可能以双精度返回，统一取整
      bytes: Math.round(Number(row.b) || 0),
    };
  }).filter(p => p.count > 0 || p.bytes > 0);

  const knownRows = byPrefix.reduce((s, p) => s + p.count, 0);
  // 不把 head.total_rows 单独暴露成 totalRows：batch 里每条 SELECT 仍是一次独立
  // 扫描，中途有写入时它与分布可能差几行。对外只给一个总数（= 已知分布之和），
  // 保证「条目构成」的每一段加总起来永远等于卡片上的数字。
  const totalRows  = knownRows;
  const headRows   = Number(head.total_rows) || 0;

  return {
    totalRows,
    totalBytes:   Math.round(Number(head.total_bytes) || 0),
    lastWriteAt:  head.last_write  == null ? null : Number(head.last_write),
    firstWriteAt: head.first_write == null ? null : Number(head.first_write),
    byPrefix,
    // 未登记前缀的行数：>0 说明代码里出现了新的 key 前缀，面板上会显示「其他」。
    // 正常情况下 headRows === knownRows；并发写入时会略有出入，取正差。
    unknownRows: Math.max(0, headRows - knownRows),
  };
}
