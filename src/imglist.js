// userimgs:{username} 清单的并发安全更新 + 单图索引 userimg:{owner}:{key}。
//
// ── 历史问题 ─────────────────────────────────────────────────────────────────
// userimgs:{owner} 是单个 KV JSON 数组，6 处（上传 trackImage、公开切换、标签、
// 软删除、恢复、彻底删除）都在做「读 → 改 → 写」。KV 没有原子性，跨请求读还有
// 传播延迟：并发上传时后写者覆盖先写者（last-writer-wins），读后校验在重试预算
// 内不收敛就放弃 —— 而 trackImage 忽略了返回值，于是上传返回 201、前端显示成功，
// 图却永远不进「我的图库」。
//
// ── 现在的结构 ───────────────────────────────────────────────────────────────
// 1. userimg:{owner}:{key}  —— 每张图一条「单键原子记录」，与 imgmeta 同内容。
//    单键写不存在覆盖竞争、不受读延迟影响，**永不丢**。它是「该用户拥有这张图」
//    的权威来源（权威索引）。
// 2. userimgs:{owner}       —— 读优化缓存：一次 get 拿全表，避免按图逐项读取
//    （免费版单请求 KV 子请求上限 50，逐图取值撑不住上千张图库）。写入仍走
//    合并 + 读后校验 + 重试；万一没写进去，/list 时 repairUserManifest 用单图
//    索引回补，用户一打开「我的图库」就见到 —— 数据不会静默消失。
//
// 兼容：repair 只「补」不「删」。升级前上传的老图没有 userimg: 记录但已在清单
// 里，不会被误删；被彻底删除的图由 purge 路径直接移除清单项。
//
// patch 语义：值为 null/undefined 的字段会被从条目上删除（用于恢复时清
// deletedAt）；ensure=true 且条目不存在时以 patch 新建最小条目。

export const IMG_INDEX_PREFIX = 'userimg:';

export function userImgRecordKey(owner, key) {
  return IMG_INDEX_PREFIX + owner + ':' + key;
}

/**
 * 写图片索引（imgmeta）+ 该用户的单图记录。
 * 两个 put 键不同、互不覆盖；任一失败都会 reject —— 由调用方决定重试。
 *
 * 单图记录不带 metadata，且把 isPublic 冗余进 value：KV 的 list 一定会带上
 * 每个 key 的 metadata，而单次 list 的 metadata 总量有上限（约 1KB），上千张
 * 图库会因 metadata 撑爆而被迫多页、多花子请求。不带 metadata 则一页可返
 * 回 1000 个 key，读取成本稳定。
 *
 * @param {object} env
 * @param {string} key   图片 key
 * @param {object} value imgmeta 的 JSON 值（uploadedAt / size / name / basename / tags / deletedAt …）
 * @param {object} meta  metadata（isPublic / owner / deletedAt）
 */
export async function putImageRecords(env, key, value, meta) {
  const rec = value ?? {};
  const owner = meta?.owner;
  const jobs = [env.STATS.put('imgmeta:' + key, JSON.stringify(rec), { metadata: meta })];
  if (owner) {
    jobs.push(env.STATS.put(
      userImgRecordKey(owner, key),
      JSON.stringify({ ...rec, isPublic: !!meta?.isPublic }),
    ));
  }
  await Promise.all(jobs);
}

/** 删除图片索引（imgmeta）+ 该用户的单图记录。 */
export async function deleteImageRecords(env, key, owner) {
  const jobs = [env.STATS.delete('imgmeta:' + key)];
  if (owner) jobs.push(env.STATS.delete(userImgRecordKey(owner, key)));
  await Promise.all(jobs);
}

/** 列出某用户全部单图索引的 key（自动翻页）。 */
export async function listUserImgRecordKeys(env, owner) {
  const prefix = IMG_INDEX_PREFIX + owner + ':';
  const out = [];
  let cursor;
  do {
    const r = await env.STATS.list({ prefix, cursor, limit: 1000 });
    for (const k of r.keys ?? []) out.push(k.name.slice(prefix.length));
    cursor = r.list_complete ? undefined : r.cursor;
  } while (cursor);
  return out;
}

// 一次 repair 最多额外读取的单图记录数。/list 已用掉 1 次 get + 1~n 次 list，
// 留出余量避免撞上免费版单请求 50 次 KV/R2 子请求上限。
const REPAIR_FETCH_BUDGET = 40;

/**
 * 用单图索引回补缺失的清单条目，并把清单写回。
 *
 * 只在清单确实缺条目时才写（正常情况是 1 次 get + 1 次 list，无写入、无逐项读取）。
 * 只补不删：升级前的老图没有单图记录，但已在清单中，保持不动。
 *
 * @returns {Promise<{repaired: number, manifest: object[]}>}
 */
export async function repairUserManifest(env, owner) {
  const imgsKv = 'userimgs:' + owner;
  const manifest = (await env.STATS.get(imgsKv, 'json')) ?? [];
  const have = new Set(manifest.map(e => e.key));

  const recordKeys = await listUserImgRecordKeys(env, owner);
  const missing = recordKeys.filter(k => !have.has(k));
  if (!missing.length) return { repaired: 0, manifest };

  const gap = missing.slice(0, REPAIR_FETCH_BUDGET);
  const filled = (await Promise.all(gap.map(async key => {
    const rec = (await env.STATS.get(userImgRecordKey(owner, key), 'json')) ?? {};
    const entry = { key, size: rec.size ?? 0, uploadedAt: rec.uploadedAt ?? 0, isPublic: !!rec.isPublic };
    if (rec.deletedAt) entry.deletedAt = rec.deletedAt;
    if (rec.name) { entry.name = rec.name; if (rec.basename) entry.basename = rec.basename; }
    if (Array.isArray(rec.tags) && rec.tags.length) entry.tags = rec.tags;
    return entry;
  }))).filter(Boolean);

  if (!filled.length) return { repaired: 0, manifest };

  // 防御性去重 + 按上传时间倒序（清单约定：最新在前）
  const seen = new Set();
  const next = manifest.concat(filled)
    .filter(e => (e.key && seen.has(e.key)) ? false : (seen.add(e.key), true));
  next.sort((a, b) => (b.uploadedAt ?? 0) - (a.uploadedAt ?? 0));
  await env.STATS.put(imgsKv, JSON.stringify(next));
  return { repaired: filled.length, manifest: next };
}

/**
 * @param {object} env  Workers env（STATS KV 绑定）
 * @param {string} username
 * @param {string} key  图片 key
 * @param {object} patch 要合并的字段（null 值删除该字段）
 * @param {object} opts  ensure: 条目缺失时是否新建（默认 false）；
 *                       remove: true 表示从列表移除该条目（patch 忽略）；
 *                       tries: 最大尝试次数（默认 6）
 * @returns {Promise<boolean>} 是否确认生效；false 不代表数据丢失
 *                            （单图索引已持久化，下次 /list 会自愈）
 */
export async function mergeUserImgEntry(env, username, key, patch = {}, opts = {}) {
  const imgsKv = 'userimgs:' + username;
  const ensure = opts.ensure ?? false;
  const remove = opts.remove ?? false;
  const tries  = opts.tries ?? 6;

  const matchesPatch = (entry) => {
    if (!entry) return false;
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === undefined) { if (entry[k] !== undefined) return false; }
      else if (entry[k] !== v) return false;
    }
    return true;
  };

  for (let attempt = 0; attempt < tries; attempt++) {
    const list = await env.STATS.get(imgsKv, 'json') ?? [];

    let next;
    if (remove) {
      next = list.filter(e => e.key !== key);
    } else {
      const idx = list.findIndex(e => e.key === key);
      if (idx === -1) {
        if (!ensure) {
          // 条目不存在且不新建：无 op，直接视为成功（与旧行为一致）
          return true;
        }
        next = [{ key, uploadedAt: patch.uploadedAt ?? 0, ...patch }, ...list];
      } else {
        next = list.map((e, j) => {
          if (j !== idx) return e;
          const merged = { ...e, ...patch };
          for (const k of Object.keys(patch)) {
            if (patch[k] === null || patch[k] === undefined) delete merged[k];
          }
          return merged;
        });
      }
      // 防御性去重：修复历史上可能已产生的重复条目
      const seen = new Set();
      next = next.filter(e => (seen.has(e.key) ? false : (seen.add(e.key), true)));
    }

    await env.STATS.put(imgsKv, JSON.stringify(next));

    // 写后校验：确认本次 patch 在最新状态上生效；未生效则用最新状态重试
    const after = await env.STATS.get(imgsKv, 'json') ?? [];
    const mine = after.find(e => e.key === key);
    if (remove ? !mine : matchesPatch(mine)) return true;

    // 指数退避（封顶 300ms）：并发时每个写者都会让别人的读后校验失效，
    // 需要给 KV 的跨请求传播留出窗口。
    await new Promise(r => setTimeout(r, Math.min(40 * 2 ** attempt, 300)));
  }
  return false;
}
