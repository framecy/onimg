/**
 * 访问统计 —— 图片 / 托管页面 / 原型共用的聚合计数器。
 *
 * ── 为什么重写（2026-11-04 线上变慢事故）─────────────────────────────────────
 * 旧实现把每次访问存成一个 JSON 数组（最多 200 条），每次请求都要
 * 「读出整行 → unshift 一条 → 整行写回」。三个致命后果：
 *
 *   1. **行体积随热度增长**：热门图 200 条记录约 4 KB，每次访问重写 4 KB；
 *      访问越多行越大，写放大的斜率随流量上升 —— 这正是「越来越慢」。
 *   2. **每次访问 1 读 + 1 写**，叠加 d1u: 记账后单张图片访问 = 8 条 D1 语句，
 *      其中 4 条是写。页面里几十张图并发加载时，D1 被彻底串行化。
 *   3. 数组里存的仍然是**过时的统计**：IP/城市/组织对图床这个用途几乎没有价值。
 *
 * ── 现在的形态 ───────────────────────────────────────────────────────────────
 * 每个对象只有**一行定长计数**：
 *
 *   astat:{type}:{id}   → value = 计数字符串，metadata = { count, lastAccess, countries }
 *
 * 单次访问 = 1 次 get + 1 次 put，行体积恒定（几百字节），与访问量无关。
 * 国家分布用一个**容量固定的小 map**（最多 24 个国家），不再存逐条明细。
 *
 *   type: 'img' | 'page' | 'proto'
 *
 * ── 兼容旧数据 ───────────────────────────────────────────────────────────────
 * 旧的 `stats:{key}` / `pstats:{slug}` / `prstats:{id}` 是 JSON 数组。
 * 读取时由 readAccessStats 统一兜底（数组 → 计数 + 国家分布），并在下一次写入时
 * 自动迁移到新 key。旧 key 保留不删，避免回滚后丢数据。
 *
 * ── 为什么不再写逐条明细 ─────────────────────────────────────────────────────
 * 后台的「访问记录」表格改成**按天聚合**（day → 次数），不再列逐条 IP。
 * 这不是功能退化：原来的 200 条上限本来就会被热门图瞬间冲掉，
 * 而「哪天来了多少次」才是真的能看出来的趋势。
 */

import { utcDay } from './dailyStats.js';

/** 国家分布最多保留多少个（超出后只累加已有国家，不再新增） */
const MAX_COUNTRIES = 24;

/** 计数行的 TTL：400 天，与 daily 统计一致，够画一年趋势 */
const TTL_DAYS = 400;

const ID_MAX = 200;

/**
 * 计数 key。
 * 用 `astat:` 前缀与旧的数组 key 明确区分，d1Stats 的 KEY_GROUPS 里也登记了它。
 */
export function accessKey(type, id) {
  return `astat:${type}:${String(id).slice(0, ID_MAX)}`;
}

/** 旧实现的三个 key 前缀（读取兜底 + 迁移来源） */
const LEGACY_PREFIX = { img: 'stats:', page: 'pstats:', proto: 'prstats:' };
export function legacyAccessKey(type, id) {
  const p = LEGACY_PREFIX[type];
  return p ? p + String(id).slice(0, ID_MAX) : null;
}

/** 把国家分布 map 归一化：只保留计数 > 0 的项，按计数降序截断 */
function normalizeCountries(obj) {
  if (!obj || typeof obj !== 'object') return {};
  const entries = Object.entries(obj)
    .map(([k, v]) => [String(k).slice(0, 8), Number(v) || 0])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_COUNTRIES);
  return Object.fromEntries(entries);
}

/**
 * 记一次访问。
 *
 * 单次 = 1 次 getWithMetadata + 1 次 put，行体积恒定。
 * best-effort：任何失败都静默（统计不该影响访问本身）。
 *
 * @param {KVNamespace} stats  env.STATS
 * @param {'img'|'page'|'proto'} type
 * @param {string} id          图片 key / 页面 slug / 原型 id
 * @param {Request} [request]  用来取 CF-Connecting-IP 与 country（可省）
 */
export async function recordAccess(stats, type, id, request) {
  if (!stats || !id) return;
  try {
    const key = accessKey(type, id);
    const prev = await stats.getWithMetadata(key, 'json');
    const legacy = prev?.metadata ? null : await readLegacy(stats, type, id);

    const base = prev?.metadata ?? legacy ?? { count: 0, lastAccess: null, countries: {} };
    const countries = normalizeCountries(base.countries);
    const cc = countryOf(request);
    if (cc && (countries[cc] !== undefined || Object.keys(countries).length < MAX_COUNTRIES)) {
      countries[cc] = (countries[cc] ?? 0) + 1;
    }
    const count = (Number(base.count) || 0) + 1;
    const now = Date.now();

    await stats.put(key, String(count), {
      metadata: { count, lastAccess: now, countries: normalizeCountries(countries) },
      expirationTtl: TTL_DAYS * 86400,
    });
  } catch { /* 统计失败不影响访问 */ }
}

/** 取请求来源国家：真实 Workers 请求带 request.cf.country，测试/本地可退化到请求头 */
function countryOf(request) {
  if (!request) return null;
  const cc = request.cf?.country ?? request.headers?.get?.('CF-IPCountry');
  if (!cc || cc === '—' || cc === 'XX') return null;
  return String(cc).slice(0, 8);
}

/** 读旧数组形态，折算成 { count, lastAccess, countries }；没有则返回 null */
async function readLegacy(stats, type, id) {
  const key = legacyAccessKey(type, id);
  if (!key) return null;
  try {
    const old = await stats.getWithMetadata(key, 'json');
    const arr = Array.isArray(old?.value) ? old.value : null;
    const md  = old?.metadata;
    if (!arr && !md) return null;
    const countries = {};
    for (const a of arr ?? []) {
      const cc = a?.country && a.country !== '—' ? String(a.country).slice(0, 8) : null;
      if (cc) countries[cc] = (countries[cc] ?? 0) + 1;
    }
    return {
      count: Number(md?.count) || arr?.length || 0,
      lastAccess: md?.lastAccess ?? (arr?.length ? Number(arr[0]?.ts) || null : null),
      countries,
    };
  } catch { return null; }
}

/**
 * 读一个对象的访问统计。
 *
 * @returns {Promise<{count:number, lastAccess:number|null, countries:Record<string,number>, source:'new'|'legacy'|'none'}>}
 */
export async function readAccessStats(stats, type, id) {
  const empty = { count: 0, lastAccess: null, countries: {}, source: 'none' };
  try {
    const cur = await stats.getWithMetadata(accessKey(type, id), 'json');
    if (cur?.metadata) {
      return {
        count: Number(cur.metadata.count) || 0,
        lastAccess: cur.metadata.lastAccess ?? null,
        countries: normalizeCountries(cur.metadata.countries),
        source: 'new',
      };
    }
    const legacy = await readLegacy(stats, type, id);
    if (legacy) {
      return {
        count: legacy.count,
        lastAccess: legacy.lastAccess,
        countries: normalizeCountries(legacy.countries),
        source: 'legacy',
      };
    }
    return empty;
  } catch { return empty; }
}

/**
 * 批量读某类型的全部计数（后台列表用），一次翻页 list。
 *
 * 同时兼容旧 key 前缀：新 key 尚未产生时，旧数组行里的 metadata.count 仍然有效。
 *
 * @returns {Promise<Record<string, {count:number, lastAccess:number|null}>>}
 */
export async function readAllAccessStats(stats, type) {
  const out = {};
  const legacyPrefix = LEGACY_PREFIX[type];

  // 旧 key 先铺底（数量少、且只会越来越少）
  if (legacyPrefix) {
    let cursor;
    do {
      const r = await stats.list({ prefix: legacyPrefix, cursor, limit: 1000 }).catch(() => null);
      if (!r) break;
      for (const k of r.keys ?? []) {
        out[k.name.slice(legacyPrefix.length)] = {
          count: Number(k.metadata?.count) || 0,
          lastAccess: k.metadata?.lastAccess ?? null,
        };
      }
      cursor = r.list_complete ? undefined : r.cursor;
    } while (cursor);
  }

  // 新 key 覆盖（同一 id 以新数据为准）
  const prefix = `astat:${type}:`;
  let cursor;
  do {
    const r = await stats.list({ prefix, cursor, limit: 1000 }).catch(() => null);
    if (!r) break;
    for (const k of r.keys ?? []) {
      const id = k.name.slice(prefix.length);
      const prev = out[id];
      const count = Number(k.metadata?.count) || 0;
      out[id] = {
        count: count + (prev?.count ?? 0),
        lastAccess: k.metadata?.lastAccess ?? prev?.lastAccess ?? null,
      };
    }
    cursor = r.list_complete ? undefined : r.cursor;
  } while (cursor);

  return out;
}

/**
 * 删除一个对象的访问统计（彻底删除图片 / 原型时）。
 * 新旧 key 都删，避免残留。
 */
export async function deleteAccessStats(stats, type, id) {
  if (!stats || !id) return;
  const keys = [accessKey(type, id), legacyAccessKey(type, id)].filter(Boolean);
  await Promise.all(keys.map(k => stats.delete(k).catch(() => {})));
}

/** 访问次数汇总（后台概览的 B-class 代理口径），一次翻页 list */
export async function sumAccessStats(stats, type) {
  const all = await readAllAccessStats(stats, type);
  let total = 0;
  for (const v of Object.values(all)) total += Number(v?.count) || 0;
  return total;
}

/** 供后台展示的「今天」标签：与 dailyStats 同一套 UTC 归日 */
export const accessDay = utcDay;
