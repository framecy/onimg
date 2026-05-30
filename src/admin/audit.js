/**
 * 审计日志：记录敏感操作（登录、删除、彻底删除、用户增删改、配置变更）。
 *
 * 存储：按 UTC 天滚动写入单个 KV key `audit:{YYYY-MM-DD}`（JSON 数组，最新在前），
 * 每天最多保留 AUDIT_CAP 条，TTL 92 天自动过期。免费版 1000 KV 写/天，
 * 仅记敏感操作 + best-effort（waitUntil 非阻塞），配额可控。
 *
 * 注意：KV 无原子 CAS，高并发下可能丢失极少量日志（审计用途可接受，个人站并发极低）。
 */

const AUDIT_CAP = 500;        // 每天最多保留条数
const AUDIT_TTL = 92 * 86400; // 保留 92 天

const auditKey = (day) => 'audit:' + day;
const utcDay   = (ts = Date.now()) => new Date(ts).toISOString().slice(0, 10);

/**
 * 写入一条审计日志（best-effort，失败静默）。
 * @param {KVNamespace} stats   env.STATS
 * @param {object} entry  { action, actor, target?, status?, ip?, detail? }
 */
export async function logAudit(stats, entry) {
  try {
    const now = Date.now();
    const key = auditKey(utcDay(now));
    const list = (await stats.get(key, 'json')) ?? [];
    list.unshift({
      ts:     now,
      action: String(entry.action ?? '').slice(0, 40),
      actor:  String(entry.actor ?? '—').slice(0, 64),
      target: entry.target != null ? String(entry.target).slice(0, 200) : undefined,
      status: entry.status ?? 'ok',
      ip:     entry.ip ? String(entry.ip).slice(0, 64) : undefined,
      detail: entry.detail != null ? String(entry.detail).slice(0, 200) : undefined,
    });
    if (list.length > AUDIT_CAP) list.length = AUDIT_CAP;
    await stats.put(key, JSON.stringify(list), { expirationTtl: AUDIT_TTL });
  } catch { /* 静默忽略，不影响主业务 */ }
}

/** 从请求提取客户端 IP（CF 头优先） */
export function clientIp(request) {
  return request?.headers?.get('CF-Connecting-IP') ?? '—';
}

/**
 * 读取审计日志：GET /admin/audit?days=7
 * 合并最近 N 天（默认 7，上限 31）的 audit:{day} 数组，按时间倒序返回。
 */
export async function handleAuditLog(env, url) {
  const daysParam = parseInt(url?.searchParams?.get('days') ?? '7', 10);
  const days = Math.min(Math.max(Number.isFinite(daysParam) ? daysParam : 7, 1), 31);

  const keys = [];
  for (let i = 0; i < days; i++) {
    keys.push(auditKey(utcDay(Date.now() - i * 86400 * 1000)));
  }
  const arrays = await Promise.all(keys.map(k => env.STATS.get(k, 'json')));
  const entries = arrays.flat().filter(Boolean);
  entries.sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));

  return Response.json({ entries, days, cap: AUDIT_CAP });
}
