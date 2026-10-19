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
//
// ── 条目形态（批量上传「丢图」的第二个根因）─────────────────────────────────
// 单图记录 / imgmeta 里每张图只需 6 个多字节字符（key + 2×4 字节中文名约 40 字节），
// 清单把 size / uploadedAt / isPublic / name / basename / tags 全都复制一份，
// 一张图约 100 字节。清单是单个 KV 值（**硬上限 25 MB，D1 单值同样受此限制**），
// 于是「我的图库」在约 20 万字节（≈ 一万张）处突然写不进去：之后每张新图上传
// 都 201，但清单永远停在同一批 —— 用户看到的就是「一批一批地缺图」。
//
// 现在上传只往清单里写 `{ key, size, uploadedAt, isPublic }`（最小种子），
// 名字 / 标签等其余字段的唯一来源是单图记录。两种形态并存：
//   · 最小条目（上传写入、repair 回补）
//   · 完整条目（visibility / tags / restore 的 patch 合并进来，老数据本来就有）
// 读侧不在这里展开 —— 由 list.js 的 handleList 在「有最小条目」时按需补全，
// 从而把清单大小与库大小解耦（每张图在清单里只剩约 100 字节，且与文件名长度无关）。

export const IMG_INDEX_PREFIX = 'userimg:';

export function userImgRecordKey(owner, key) {
  return IMG_INDEX_PREFIX + owner + ':' + key;
}

// 上传时写入清单的「最小种子」字段。其余字段（name / basename / tags / deletedAt …）
// 只存在单图记录里，读时按需补全 —— 清单体积因此与图库大小解耦。
const MINIMAL_FIELDS = ['key', 'size', 'uploadedAt', 'isPublic'];

/** 只保留最小种子字段的清单条目 */
export function minimalEntry(e) {
  const out = { key: e.key };
  for (const f of MINIMAL_FIELDS.slice(1)) if (e[f] !== undefined) out[f] = e[f];
  return out;
}

// 上传时写入清单的种子字段（size / uploadedAt / isPublic 恒有值）。
// 读侧据此判断「这条种子的名字与标签需要从单图记录取」—— 只要缺了任一必填字段，
// 就说明它是重新上传时被 patch 合并出来的残条，同样要走补全。
const SEED_REQUIRED = ['size', 'uploadedAt', 'isPublic'];

// 兼容曾经试写过的短字段名（s / t / p，体积更小但可读性差，最终未采用）。
// 只在读到这种形态时才还原一次，其它情况原样返回（不复制对象，避免热路径分配）。
const SHORT_TO_LONG = { s: 'size', t: 'uploadedAt', p: 'isPublic' };

/** 短字段名 → 长字段名（幂等：已经是长名则原样返回） */
export function normalizeEntry(e) {
  if (!e) return e;
  let out = e;
  for (const [short, long] of Object.entries(SHORT_TO_LONG)) {
    if (short in e) {
      if (out === e) out = { ...e };
      if (out[long] === undefined) out[long] = e[short];
      delete out[short];
    }
  }
  return out;
}

/**
 * 判断条目是否「只有最小种子字段」—— 即 name/tags/deletedAt 等需要从单图记录读取。
 * 老数据与经过可见性/标签/恢复操作的条目都是完整形态，不会触发逐项读取。
 */
export function isMinimalEntry(e) {
  if (!e) return false;
  if (!SEED_REQUIRED.every(k => e[k] !== undefined)) return true;   // 残条：需要补全
  return Object.keys(e).every(k => MINIMAL_FIELDS.includes(k));
}

/**
 * 用单图记录补全清单条目。单图记录缺失（被彻底删除）时原样返回，
 * 由调用方决定是否丢弃 —— 这里不替调用方删数据。
 *
 * @param {object} entry  清单条目（最小形态）
 * @param {object|null} rec  单图记录（userimg:{owner}:{key} 的值）
 */
export function mergeEntryWithRecord(entry, rec) {
  const seed = normalizeEntry(entry) ?? {};
  const out = { ...(rec ?? {}) };
  // 种子里值为 undefined 的字段不能盖掉单图记录里的真实值（否则名字会时有时无）
  for (const [k, v] of Object.entries(seed)) if (v !== undefined) out[k] = v;
  return out;
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
 * 用单图索引回补缺失的清单条目，并顺带把「胖条目」瘦回最小形态。
 *
 * 写入只在下面任一情况发生（正常情况是 1 次 get + 1 次 list，无写入、无逐项读取）：
 *   · 清单缺条目 → 用单图记录回补
 *   · 清单里还有带 name / basename / tags / deletedAt 等冗余字段的条目
 *     → 就地瘦身成 { key, size, uploadedAt, isPublic }（信息在单图记录里有）
 * 第二条是给老数据的自动瘦身：升级前清单把文件名 / 标签也复制了一份（每张约
 * 200 字节，且中文名越长约占越多），瘦身后约 100 字节且与名字长度无关 ——
 * 已经逼近 KV 25 MB 单值上限的图库，靠一次 /list 就能自动回落到安全体积。
 *
 * 只补不删：升级前的老图没有单图记录，但已在清单中，保持不动（只是瘦身）。
 *
 * @returns {Promise<{repaired: number, compacted: number, manifest: object[]}>}
 */
export async function repairUserManifest(env, owner) {
  const imgsKv = 'userimgs:' + owner;
  const manifest = (await env.STATS.get(imgsKv, 'json')) ?? [];
  const have = new Set(manifest.map(e => e.key));
  const compacted = manifest.filter(e => e && !isMinimalEntry(e)).length;

  const recordKeys = await listUserImgRecordKeys(env, owner);
  const missing = recordKeys.filter(k => !have.has(k));

  let filled = [];
  if (missing.length) {
    const gap = missing.slice(0, REPAIR_FETCH_BUDGET);
    filled = (await Promise.all(gap.map(async key => {
      const rec = (await env.STATS.get(userImgRecordKey(owner, key), 'json')) ?? {};
      // 只写最小种子：名字 / 标签等由 /list 从单图记录补全
      return minimalEntry({
        key,
        size: rec.size ?? 0,
        uploadedAt: rec.uploadedAt ?? 0,
        isPublic: !!rec.isPublic,
      });
    })));
  }

  if (!filled.length && !compacted) return { repaired: 0, compacted: 0, manifest };

  // 防御性去重 + 原有条目瘦身 + 按上传时间倒序（清单约定：最新在前）
  const seen = new Set();
  const next = manifest.concat(filled)
    .filter(e => (e && e.key && seen.has(e.key)) ? false : (seen.add(e.key), true))
    .map(minimalEntry);
  next.sort((a, b) => (b.t ?? b.uploadedAt ?? 0) - (a.t ?? a.uploadedAt ?? 0));
  await env.STATS.put(imgsKv, JSON.stringify(next));
  return { repaired: filled.length, compacted, manifest: next };
}

// 清单读取入口：原始值可能带历史短字段名（s/t/p），统一还原成长名后再用
function unpackManifest(raw) {
  return (raw ?? []).map(normalizeEntry);
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
    const list = unpackManifest(await env.STATS.get(imgsKv, 'json'));

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

    // 写回统一压成最小种子，清单体积与图库大小解耦
    await env.STATS.put(imgsKv, JSON.stringify(next.map(minimalEntry)));

    // 写后校验：确认本次 patch 在最新状态上生效；未生效则用最新状态重试
    const after = unpackManifest(await env.STATS.get(imgsKv, 'json'));
    const mine = after.find(e => e.key === key);
    if (remove ? !mine : matchesPatch(mine)) return true;

    // 指数退避（封顶 300ms）：并发时每个写者都会让别人的读后校验失效，
    // 需要给 KV 的跨请求传播留出窗口。
    await new Promise(r => setTimeout(r, Math.min(40 * 2 ** attempt, 300)));
  }
  return false;
}
