/**
 * Cloudflare 免费额度自追踪工具
 *
 * 注意：KV 不支持原子 CAS，高并发下计数可能丢失极少量请求（监控用途可接受）。
 * 所有写入使用 expirationTtl 自动过期，不会长期占用 KV 存储。
 *
 * 追踪的计数器 key 格式：
 *   cf:req:{YYYY-MM-DD}   — Workers 每日请求数（10% 采样，实际 × 10 显示）
 *   cf:r2a:{YYYY-MM}      — R2 Class A 月度操作数（写入/删除/列表）
 *   cf:r2b:{YYYY-MM}      — R2 Class B 月度操作数（读取：原型 HTML 页面）
 *   cf:kvw:{YYYY-MM-DD}   — KV 写入次数（每日，推导值）
 *   cf:kvl:{YYYY-MM-DD}   — KV list() 调用次数（每日）
 *   cf:kvd:{YYYY-MM-DD}   — KV delete() 调用次数（每日）
 */

/** 返回 UTC 日期字符串 "YYYY-MM-DD" */
export const cfDay = () => new Date().toISOString().slice(0, 10);

/** 返回 UTC 月份字符串 "YYYY-MM" */
export const cfMonth = () => new Date().toISOString().slice(0, 7);

const TTL_DAY = 92 * 86400;  // 日计数器保留 92 天
const TTL_MON = 62 * 86400;  // 月计数器保留 62 天（超过一个完整计费周期）

/**
 * 增加指定计数器（best-effort，失败静默）。
 * 在高并发场景下可能有极少量丢失，监控精度可接受。
 *
 * @param {KVNamespace} stats  env.STATS
 * @param {string}      key    完整 KV key
 * @param {number}      delta  增量，默认 1
 * @param {boolean}     monthly 是否为月度计数器（影响 TTL）
 */
export async function cfBump(stats, key, delta = 1, monthly = false) {
  try {
    const cur = parseInt((await stats.get(key)) ?? '0', 10);
    await stats.put(key, String(cur + delta), { expirationTtl: monthly ? TTL_MON : TTL_DAY });
  } catch { /* 静默忽略，不影响主业务逻辑 */ }
}

/** 读取计数器，不存在返回 0 */
export async function cfRead(stats, key) {
  return parseInt((await stats.get(key)) ?? '0', 10);
}

/**
 * 批量读取多个计数器，返回 key → number 映射。
 * 比多次 cfRead 更高效（并发读取）。
 */
export async function cfReadMany(stats, keys) {
  const entries = await Promise.all(keys.map(async k => [k, await cfRead(stats, k)]));
  return Object.fromEntries(entries);
}
