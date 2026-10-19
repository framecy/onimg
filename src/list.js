import { verifyAdminToken } from './admin/auth.js';
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

    // 收集所有已软删除的 key + 公开状态（单次 KV list，metadata 含
    // deletedAt / isPublic / owner，无需额外读取）。管理端要显示和切换
    // 可见性，此前这里只取了 trashed，导致后台看不到图片是公开还是私密。
    const trashed = new Set();
    const metaOf = new Map();
    let kvCursor;
    do {
      const kv = await env.STATS.list({ prefix: 'imgmeta:', cursor: kvCursor, limit: 1000 });
      for (const k of kv.keys) {
        const key = k.name.slice('imgmeta:'.length);
        metaOf.set(key, k.metadata ?? null);
        if (k.metadata?.deletedAt) trashed.add(key);
      }
      kvCursor = kv.list_complete ? undefined : kv.cursor;
    } while (kvCursor);

    const result = await env.BUCKET.list({ limit, cursor });
    return Response.json({
      items: result.objects
        .filter(o => !o.key.startsWith('proto/') && !o.key.startsWith('manifests/') && !trashed.has(o.key))
        .map(o => {
          const md = metaOf.get(o.key);
          return {
            key: o.key, size: o.size, uploaded: o.uploaded, etag: o.etag,
            // 未索引的裸对象（老数据/手工上传）md 为 null，前端按私密处理
            isPublic: !!md?.isPublic,
            owner: md?.owner ?? null,
            indexed: !!md,
          };
        }),
      cursor: result.truncated ? result.cursor : null,
      truncated: result.truncated,
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
  const items = await expandEntries(env, user.username, manifest);

  // 排除已软删除（回收站）的图片
  return Response.json({ items: items.filter(e => !e.deletedAt), cursor: null, truncated: false });
}

// 单次 /list 最多补全多少条「最小种子」条目。超出预算的条目原样返回 ——
// 少了名字，但 key / 大小 / 时间 / 可见性都在，图库仍然完整可见。
// 绝不能为了省子请求直接丢条目，那正是「图片缺失」的老毛病。
const EXPAND_LIMIT = 200;
const EXPAND_CONCURRENCY = 10;

/**
 * 把清单里的「最小种子」按单图记录补全（名字 / 标签 / deletedAt）。
 * 完整条目直接用，不占读取名额。
 *
 * 预算只与**需要读取的条数**挂钩，所以图库 ≤ 200 张时一定能完整显示；
 * 更大的图库按时间倒序补前 200 张，其余条目仍完整列出（只是暂缺名字）。
 */
async function expandEntries(env, owner, manifest) {
  const out = new Array(manifest.length);
  let reads = 0;
  let i = 0;
  async function worker() {
    while (i < manifest.length) {
      const idx = i++;
      const e = manifest[idx];
      if (!e) continue;
      if (!isMinimalEntry(e) || reads >= EXPAND_LIMIT) { out[idx] = e; continue; }
      reads++;
      const rec = await env.STATS.get(userImgRecordKey(owner, e.key), 'json');
      out[idx] = mergeEntryWithRecord(e, rec);
    }
  }
  await Promise.all(Array.from({ length: Math.min(EXPAND_CONCURRENCY, manifest.length) }, worker));
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

// Public gallery — no auth required
export async function handlePublicGallery(env) {
  const kvList = await env.STATS.list({ prefix: 'imgmeta:' });
  const public_ = kvList.keys
    .filter(k => k.metadata?.isPublic && !k.metadata?.deletedAt)
    .map(k => ({
      key: k.name.slice(8),   // strip 'imgmeta:'
      owner: k.metadata.owner,
      isPublic: true,
    }));
  return Response.json({ items: public_ });
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
