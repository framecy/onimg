// 管理端图片索引 —— 把「所有图片」一次性读进内存，供后台的搜索 / 筛选 / 排序用。
//
// ── 为什么需要这一层 ────────────────────────────────────────────────────────
// 后台图库此前是 R2 list 出来的：只有 key/size/uploaded，原始文件名和标签都存在
// imgmeta 的 value 里（见 list.js 的注释：不放进 metadata 是为了不撞 KV 的 1KB
// 上限）。结果是后台只能按 key 搜，用户端却能按文件名 / 标签 / 可见性筛 —— 同一套
// 数据两个面板能力不一样。
//
// 现在统一走这个索引：D1 可用时一次 SQL 把 imgmeta 的 key/value/metadata 全取
// 出来（本站规模 1.6k 行，等值于一次全表扫，远低于免费版 500 万行读/天），
// 在 Node 侧过滤排序；KV 回滚路径降级为「只读 metadata」——列表仍完整，但
// name / tags 缺失（搜索只认 key / owner），这是回滚路径的已知代价。
//
// ── 口径 ────────────────────────────────────────────────────────────────────
// · 同一张图在 imgmeta 里 key 是 `imgmeta:{key}`，value 是
//   { uploadedAt, size, name?, basename?, tags? }，metadata 是
//   { owner, isPublic, deletedAt? }
// · 访问次数在 `stats:{key}` 的 metadata.count
// · 未索引的裸对象（老数据 / 手工上传）不在这份索引里，后台仍通过 R2 列表看到

const IMG_PREFIX = 'imgmeta:';
const STATS_PREFIX = 'stats:';

function parseJson(value) {
  if (value == null) return null;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return null; }
}

/** D1 路径：一次 batch 取全量索引 + 访问次数 */
async function readViaD1(env) {
  const [img, stats] = await env.DB.batch([
    env.DB.prepare(`SELECT key, value, metadata FROM kv_store WHERE key LIKE 'imgmeta:%'`),
    env.DB.prepare(`SELECT key, metadata FROM kv_store WHERE key LIKE 'stats:%'`),
  ]);
  return { rows: img?.results ?? [], statRows: stats?.results ?? [] };
}

/** KV 回滚路径：只有 metadata，没有 value（name/tags 拿不到） */
async function readViaKv(env) {
  const rows = [];
  let cursor;
  do {
    const r = await env.STATS.list({ prefix: IMG_PREFIX, cursor, limit: 1000 });
    for (const k of r.keys ?? []) rows.push({ key: k.name, value: null, metadata: k.metadata ?? null });
    cursor = r.list_complete ? undefined : r.cursor;
  } while (cursor);

  const statRows = [];
  cursor = undefined;
  do {
    const r = await env.STATS.list({ prefix: STATS_PREFIX, cursor, limit: 1000 });
    for (const k of r.keys ?? []) statRows.push({ key: k.name, metadata: k.metadata ?? null });
    cursor = r.list_complete ? undefined : r.cursor;
  } while (cursor);

  return { rows, statRows };
}

/**
 * 读取全部图片索引。
 *
 * @returns {Promise<{items: Array<object>, source: 'd1'|'kv', degraded: boolean}>}
 *   degraded=true 表示走的是 KV 回滚路径：name / tags 不可用。
 */
export async function readImageIndex(env) {
  const useD1 = !!(env.DB && typeof env.DB.batch === 'function');
  const { rows, statRows } = useD1 ? await readViaD1(env) : await readViaKv(env);

  const views = new Map();
  for (const s of statRows) {
    const n = Number(parseJson(s.metadata)?.count) || 0;
    if (s.key.startsWith(STATS_PREFIX)) views.set(s.key.slice(STATS_PREFIX.length), n);
  }

  const items = [];
  for (const row of rows) {
    if (!row?.key?.startsWith(IMG_PREFIX)) continue;
    const key = row.key.slice(IMG_PREFIX.length);
    const md = parseJson(row.metadata) ?? {};
    const v = parseJson(row.value) ?? {};
    items.push({
      key,
      name: v.name || v.basename || null,
      tags: Array.isArray(v.tags) ? v.tags : [],
      size: Number(v.size) || 0,
      uploadedAt: Number(v.uploadedAt) || null,
      owner: md.owner ?? null,
      isPublic: !!md.isPublic,
      deletedAt: md.deletedAt ?? null,
      views: views.get(key) ?? 0,
      indexed: true,
    });
  }

  return { items, source: useD1 ? 'd1' : 'kv', degraded: !useD1 };
}

/**
 * 在索引上做搜索 / 筛选 / 排序 / 分页。
 *
 * 搜索字段：key、原始文件名、标签、归属用户（大小写不敏感，子串匹配）。
 * 排序字段：uploaded（默认，新→旧）、size、name、views。
 *
 * @param {Array} items  readImageIndex 的结果
 * @param {object} opts
 * @param {string} [opts.q]        搜索词
 * @param {string} [opts.owner]    按归属用户精确筛选
 * @param {string} [opts.tag]      按标签精确筛选
 * @param {string} [opts.visibility] 'public' | 'private'
 * @param {string} [opts.sort]     uploaded | size | name | views
 * @param {string} [opts.order]    desc（默认） | asc
 * @param {number} [opts.limit]
 * @param {number} [opts.offset]
 */
export function queryImageIndex(items, opts = {}) {
  const q = String(opts.q ?? '').trim().toLowerCase();
  const owner = String(opts.owner ?? '').trim();
  const tag = String(opts.tag ?? '').trim().toLowerCase();
  const vis = opts.visibility;
  const sort = ['uploaded', 'size', 'name', 'views'].includes(opts.sort) ? opts.sort : 'uploaded';
  const asc = opts.order === 'asc';
  const limit = Math.max(1, Math.min(Number(opts.limit) || 50, 200));
  const offset = Math.max(0, Number(opts.offset) || 0);

  let out = items;

  if (q) {
    out = out.filter(it =>
      it.key.toLowerCase().includes(q)
      || (it.name || '').toLowerCase().includes(q)
      || (it.owner || '').toLowerCase().includes(q)
      || (it.tags || []).some(t => String(t).toLowerCase().includes(q)));
  }
  if (owner) out = out.filter(it => it.owner === owner);
  if (tag) out = out.filter(it => (it.tags || []).some(t => String(t).toLowerCase() === tag));
  if (vis === 'public') out = out.filter(it => it.isPublic);
  if (vis === 'private') out = out.filter(it => !it.isPublic);

  const cmp = (a, b) => {
    switch (sort) {
      case 'size':     return a.size - b.size;
      case 'views':    return a.views - b.views;
      case 'name':     return String(a.name || a.key).localeCompare(String(b.name || b.key), 'zh');
      default:         return (a.uploadedAt || 0) - (b.uploadedAt || 0);
    }
  };
  out = [...out].sort(asc ? cmp : (a, b) => cmp(b, a));

  const total = out.length;
  const page = out.slice(offset, offset + limit);
  return { items: page, total, nextOffset: offset + page.length < total ? offset + page.length : null };
}

/** 供 /api/trash 补图片名用：按 key 取 imgmeta 的 value（只读少量已删除条目） */
export async function readImageNames(env, keys) {
  const out = new Map();
  if (!keys.length) return out;
  if (env.DB && typeof env.DB.batch === 'function') {
    // D1：一条 SQL 拿全部（避免逐 key 一次子请求）
    const marks = keys.map(() => '?').join(',');
    const { results } = await env.DB
      .prepare(`SELECT key, value FROM kv_store WHERE key IN (${marks})`)
      .bind(...keys.map(k => IMG_PREFIX + k))
      .all();
    for (const r of results ?? []) {
      const v = parseJson(r.value) ?? {};
      out.set(String(r.key).slice(IMG_PREFIX.length), v.name || v.basename || null);
    }
    return out;
  }
  // KV 回滚：逐 key 读取，限制在预算内
  for (const k of keys.slice(0, 40)) {
    const v = await env.STATS.get(IMG_PREFIX + k, 'json').catch(() => null);
    if (v) out.set(k, v.name || v.basename || null);
  }
  return out;
}
