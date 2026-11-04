import { verifyAdminToken } from './admin/auth.js';
import { readImageIndex, queryImageIndex, listPublicImages } from './admin/image-index.js';
import { verifyUserToken } from './user-auth.js';
import {
  mergeUserImgEntry, putImageRecords, repairUserManifest,
  isMinimalEntry, mergeEntryWithRecord, userImgRecordKey,
} from './imglist.js';

export async function handleList(request, env) {
  const isAdmin = await verifyAdminToken(request, env);

  if (isAdmin) {
    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor') ?? undefined;
    const limit  = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 200);

    // 查询参数（管理端）：搜索 / 筛选 / 排序 / 分页。
    // 用户端不认这些参数（它只看自己的清单），所以不会因为这里多出参数而变行为。
    const q          = (url.searchParams.get('q') ?? '').trim();
    const owner      = (url.searchParams.get('owner') ?? '').trim();
    const tag        = (url.searchParams.get('tag') ?? '').trim();
    const visibility = url.searchParams.get('visibility') ?? '';
    const sort       = url.searchParams.get('sort') ?? 'uploaded';
    const order      = url.searchParams.get('order') ?? 'desc';
    const offset     = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10) || 0);

    // 索引视图：一次读出 imgmeta 的 name / tags / owner / 大小 / 访问次数。
    // 有 D1 时是一条 SQL；KV 回滚路径降级为只有 metadata（name/tags 为空）。
    const idx = await readImageIndex(env);
    const live = idx.items.filter(it => !it.deletedAt);
    const byKey = new Map(live.map(it => [it.key, it]));

    // 只要带了搜索 / 筛选 / 非默认排序，就走索引而不是 R2 列表：
    // R2 列表只能按 key 词法顺序翻页，搜不到名字和标签，也没法全局排序。
    const useIndex = !!(q || owner || tag || visibility || sort !== 'uploaded');
    if (useIndex) {
      const r = queryImageIndex(live, { q, owner, tag, visibility, sort, order, limit, offset });
      return Response.json({
        items: r.items,
        total: r.total,
        nextOffset: r.nextOffset,
        cursor: null,
        truncated: false,
        source: idx.source,
        // 回滚到 KV 时没有 name/tags：前端据此提示「搜索仅覆盖 key / 用户」
        degraded: idx.degraded,
      });
    }

    // 默认视图：R2 列表（能带出未索引的裸对象），再用索引补名字 / 标签 / 访问次数
    const trashed = new Set(idx.items.filter(it => it.deletedAt).map(it => it.key));
    const result = await env.BUCKET.list({ limit, cursor });
    return Response.json({
      items: result.objects
        .filter(o => !o.key.startsWith('proto/') && !o.key.startsWith('manifests/') && !trashed.has(o.key))
        .map(o => {
          const rec = byKey.get(o.key);
          return {
            key: o.key, size: o.size, uploaded: o.uploaded, etag: o.etag,
            name: rec?.name ?? null,
            tags: rec?.tags ?? [],
            views: rec?.views ?? 0,
            uploadedAt: rec?.uploadedAt ?? null,
            // 未索引的裸对象（老数据/手工上传）rec 为 undefined，前端按私密处理
            isPublic: rec ? rec.isPublic : false,
            owner: rec?.owner ?? null,
            indexed: !!rec,
          };
        }),
      cursor: result.truncated ? result.cursor : null,
      truncated: result.truncated,
      source: idx.source,
      degraded: idx.degraded,
    });
  }

  // Regular user: their own list from KV
  const user = await verifyUserToken(request, env);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // 读前先自愈：并发上传下清单可能被后写覆盖丢条目，用单图索引回补，
  // 保证「上传成功 → 图库可见」不会因为清单写入失败而静默消失。
  // 正常情况只多一次 list 调用（不带逐项读取），清单已完整时无写入。
  const { manifest } = await repairUserManifest(env, user.username);

  // 清单里的条目分两种形态（见 imglist.js 的「条目形态」注释）：
  //   · 完整条目：name / basename / tags 都在，直接用
  //   · 最小种子：只有 key/size/uploadedAt/isPublic，名字与标签要读单图记录
  // 这里把最小种子按需补全。用并发池限流，避免一次请求打出上百个子请求
  // （免费版单请求 KV 子请求上限 50）。
  //
  // ── 分页（2026-11-04）──────────────────────────────────────────────────────
  // 图库变大后，一次性把上千条全展开再返回，会同时压垮 Worker（展开是 D1 往返）
  // 和浏览器（一次渲染上千张卡片 + 图片请求）。现在支持 limit / offset：
  //   · 只对**当前页**的条目做补全，展开成本与页大小挂钩，不再与图库总量挂钩
  //   · 不传 limit 时行为与旧版完全一致（全量返回），CLI / Agent 不受影响
  const url = new URL(request.url);
  const rawLimit  = url.searchParams.get('limit');
  const rawOffset = url.searchParams.get('offset');
  const limit  = rawLimit == null ? null : Math.max(1, Math.min(parseInt(rawLimit, 10) || 200, 500));
  const offset = Math.max(0, parseInt(rawOffset ?? '0', 10) || 0);

  // 排除已软删除（回收站）的图片。
  //
  // ⚠️ 顺序要求：deletedAt 只写在单图记录里，清单存的是**最小种子**，
  // 所以「哪些图在回收站」必须先读过单图记录才知道。先按清单过滤等于
  // 「看不见 deletedAt」，回收站里的图会被当成正常图返回（历史 bug 的变体）。
  //
  // ── 但要避免为此付全量展开的代价 ────────────────────────────────────────
  // 展开的贵在于**把每条记录解析、合并成完整条目**（名字/标签/大小）。
  // 判断「在不在回收站」只需要看 deletedAt 一个字段。所以这里只做一次
  // 批量读取（与图库总量挂钩的仅此一次），拿到全量的存活标记，
  // 然后**只对当前页展开**。图库 1000 张时，单次请求的解析量从 1000 → 60。
  const { live, total } = await resolveLiveEntries(env, user.username, manifest, offset, limit);

  if (limit == null) {
    return Response.json({ items: live, cursor: null, truncated: false, total });
  }

  return Response.json({
    items: live,
    total,
    offset,
    limit,
    nextOffset: offset + live.length < total ? offset + live.length : null,
    cursor: null,
    truncated: false,
  });
}

// 单次 /list 最多补全多少条「最小种子」条目。超出预算的条目原样返回 ——
// 少了名字，但 key / 大小 / 时间 / 可见性都在，图库仍然完整可见。
// 绝不能为了省子请求直接丢条目，那正是「图片缺失」的老毛病。
const EXPAND_LIMIT = 200;
const EXPAND_CONCURRENCY = 10;

/**
 * 挑出「存活（不在回收站）」的条目，只对目标页做完整展开。
 *
 * ── 为什么分成两步 ──────────────────────────────────────────────────────────
 * 判断存活只需要单图记录的 deletedAt 一个字段，而「补全」要把整条记录解析、
 * 合并出名字/标签/大小。图库上千张时，全量补全等于给每张图都付一次解析成本，
 * 而这正是分页要消掉的压力。
 *
 * 所以：
 *   1. 一次批量读拿全量记录（D1 上按 99 个 key 分块，1000 张 = 11 次查询）
 *   2. 只按 deletedAt 过滤出存活条目，并记下总数
 *   3. 只对 `[offset, offset+limit)` 这一段做完整展开
 *
 * 老条目（已是完整形态、不在清单里存种子）没有可读的记录时按存活处理，
 * 与旧口径一致：只补不删。
 *
 * @returns {Promise<{live: object[], total: number}>}
 */
async function resolveLiveEntries(env, owner, manifest, offset, limit) {
  // 预算内的种子才需要读记录；完整条目直接算存活
  const seedIdx = [];
  for (let i = 0; i < manifest.length; i++) {
    const e = manifest[i];
    if (e && isMinimalEntry(e)) seedIdx.push(i);
  }

  let recs = null;
  if (seedIdx.length && typeof env.STATS.getMany === 'function') {
    recs = await env.STATS.getMany(
      seedIdx.map(i => userImgRecordKey(owner, manifest[i].key)), 'json');
  }

  const recOf = (idx) => {
    if (!recs) return undefined;
    return recs.get(userImgRecordKey(owner, manifest[idx].key)) ?? null;
  };

  // 第一步：只判断存活
  const alive = [];
  for (let i = 0; i < manifest.length; i++) {
    const e = manifest[i];
    if (!e) continue;
    if (!isMinimalEntry(e)) { alive.push(i); continue; }   // 完整条目：自带 deletedAt
    if (!recs) { alive.push(i); continue; }                // 没有批量 API：按存活处理，下面回退展开
    const rec = recOf(i);
    if (rec && rec.deletedAt) continue;                    // 在回收站
    alive.push(i);
  }
  const total = alive.length;

  // 第二步：只展开目标页
  const start = limit == null ? 0 : Math.max(0, offset);
  const end   = limit == null ? alive.length : Math.min(alive.length, start + limit);
  const slice = alive.slice(start, end);

  const out = [];
  for (const i of slice) {
    const e = manifest[i];
    if (!isMinimalEntry(e)) { out.push(e); continue; }
    const rec = recOf(i);
    if (rec === undefined) {
      // 回退路径（KV 绑定无 getMany）：逐条读
      out.push(mergeEntryWithRecord(e, await env.STATS.get(userImgRecordKey(owner, e.key), 'json')));
    } else {
      out.push(mergeEntryWithRecord(e, rec));
    }
  }
  return { live: out, total };
}

/**
 * 把清单里的「最小种子」按单图记录补全（名字 / 标签 / deletedAt）。
 * 完整条目直接用，不占读取名额。
 *
 * 预算只与**需要读取的条数**挂钩，所以图库 ≤ 200 张时一定能完整显示；
 * 更大的图库按时间倒序补前 200 张，其余条目仍完整列出（只是暂缺名字）。
 *
 * ── 为什么走批量读（这里是全站最大的一处可消除延迟）──────────────────────
 * 旧实现是「每张图一次 env.STATS.get」的并发池。换成 D1 之后每个 get 是
 * 一次**跨区网络往返**（约 20–60 ms），并发池又受子请求上限约束，实测
 * 120 张图的图库要打 123 次查询、白屏约 3 秒；图库越大越慢。
 * 现在一次 `getMany` 拿满一整批（D1 内部按 100 个 key 分块），
 * 200 张图的补全从 200 次往返降到 2 次。
 *
 * 保留逐条读的回退路径：KV 绑定（回滚路径）没有同语义的批量 API，
 * 检测到没有 getMany 时按老路走，行为不变。
 */
async function expandEntries(env, owner, manifest) {
  const out = new Array(manifest.length);
  // 先按预算挑出需要补全的下标，保证「补前 200 条」的口径与旧实现一致
  const todo = [];
  for (let idx = 0; idx < manifest.length; idx++) {
    const e = manifest[idx];
    if (!e) continue;
    if (!isMinimalEntry(e) || todo.length >= EXPAND_LIMIT) { out[idx] = e; continue; }
    todo.push(idx);
  }
  if (!todo.length) return out;

  if (typeof env.STATS.getMany === 'function') {
    const recs = await env.STATS.getMany(
      todo.map(idx => userImgRecordKey(owner, manifest[idx].key)), 'json');
    for (const idx of todo) {
      out[idx] = mergeEntryWithRecord(manifest[idx], recs.get(userImgRecordKey(owner, manifest[idx].key)) ?? null);
    }
    return out;
  }

  // 回退路径（Workers KV 绑定）：没有批量 API，仍用限流并发逐条读。
  let i = 0;
  async function worker() {
    while (i < todo.length) {
      const idx = todo[i++];
      const rec = await env.STATS.get(userImgRecordKey(owner, manifest[idx].key), 'json');
      out[idx] = mergeEntryWithRecord(manifest[idx], rec);
    }
  }
  await Promise.all(Array.from({ length: Math.min(EXPAND_CONCURRENCY, todo.length) }, worker));
  return out;
}

// 标签规范化：去重、trim、去空、长度上限，最多 10 个，每个 ≤ 24 字符。
// 安全：剥离可破坏 HTML 属性/标签的字符（< > " ' & ` \ 及控制符），
// 因前端在 onclick 等属性上下文中插值标签，仅 HTML 实体转义不足以防注入。
export function normalizeTags(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of input) {
    const t = String(raw ?? '')
      .replace(/[<>\"'`\\&\x00-\x1f]/g, '')  // 去除可破坏 HTML 属性的字符与控制符（保留空格、连字符等）
      .trim()
      .slice(0, 24);
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
    if (out.length >= 10) break;
  }
  return out;
}

// 设置单张图片标签：PATCH /api/image/{key}/tags  body { tags: string[] }
export async function handleSetImageTags(request, env, key) {
  const user = await verifyUserToken(request, env);
  const isAdmin = !user && await verifyAdminToken(request, env);
  if (!user && !isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const tags = normalizeTags(body.tags);

  const metaKey = 'imgmeta:' + key;
  const existing = await env.STATS.getWithMetadata(metaKey, 'json');
  if (!existing?.metadata) return Response.json({ error: 'Image not found in index' }, { status: 404 });
  if (!isAdmin && existing.metadata.owner !== user.username) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (existing.metadata.deletedAt) return Response.json({ error: '图片在回收站中，请先恢复' }, { status: 409 });

  // 持久来源：imgmeta value + 单图索引（metadata 保持不变，避免超出 1KB 上限）
  await putImageRecords(env, key, { ...(existing.value ?? {}), tags }, existing.metadata);

  // 冗余进 userimgs 列表项，供前端筛选无需逐项读取（并发安全更新）
  const owner = existing.metadata.owner;
  await mergeUserImgEntry(env, owner, key, { tags });

  return Response.json({ key, tags });
}

// 单张图片的元数据（公开状态 / 标签 / 归属）。
// 管理端的图库列表来自 R2 原生 list，只有 key/size/uploaded，标签存在
// imgmeta 的 value 里、不在 list 返回的 metadata 中，所以编辑标签前需要
// 单独取一次。避免在列表接口里为每张图逐项读取（那会打爆子请求预算）。
export async function handleGetImageMeta(request, env, key) {
  const user = await verifyUserToken(request, env);
  const isAdmin = !user && await verifyAdminToken(request, env);
  if (!user && !isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await env.STATS.getWithMetadata('imgmeta:' + key, 'json');
  if (!existing?.metadata) {
    return Response.json({ key, indexed: false, isPublic: false, tags: [], owner: null });
  }
  if (!isAdmin && existing.metadata.owner !== user.username) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  return Response.json({
    key,
    indexed: true,
    isPublic: !!existing.metadata.isPublic,
    owner: existing.metadata.owner ?? null,
    deletedAt: existing.metadata.deletedAt ?? null,
    tags: Array.isArray(existing.value?.tags) ? existing.value.tags : [],
    name: existing.value?.name ?? '',
    size: existing.value?.size ?? 0,
    uploadedAt: existing.value?.uploadedAt ?? null,
  });
}

// Public gallery — no auth required.
// 清单来源见 image-index.js 的 listPublicImages：必须翻页（旧实现只取第一页，
// 图库超 1000 张就静默少图），且按前缀一次扫描，不逐条读 value。
export async function handlePublicGallery(env) {
  const { items, truncated } = await listPublicImages(env);
  return Response.json({ items, ...(truncated ? { truncated: true } : {}) });
}

// Toggle visibility of a single image
export async function handleToggleVisibility(request, env, key) {
  const user = await verifyUserToken(request, env);
  const isAdmin = !user && await verifyAdminToken(request, env);
  if (!user && !isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const metaKey = 'imgmeta:' + key;
  const existing = await env.STATS.getWithMetadata(metaKey, 'json');
  if (!existing?.metadata) return Response.json({ error: 'Image not found in index' }, { status: 404 });

  if (!isAdmin && existing.metadata.owner !== user.username) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (existing.metadata.deletedAt) return Response.json({ error: '图片在回收站中，请先恢复' }, { status: 409 });

  const newPublic = !existing.metadata.isPublic;
  await putImageRecords(env, key, existing.value ?? {}, { ...existing.metadata, isPublic: newPublic });

  // Update userimgs list entry too（并发安全更新：上传回写公开状态与本切换并发时防覆盖）
  const owner = existing.metadata.owner;
  await mergeUserImgEntry(env, owner, key, { isPublic: newPublic });

  return Response.json({ key, isPublic: newPublic });
}
