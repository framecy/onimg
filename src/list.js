import { verifyAdminToken } from './admin/auth.js';
import { verifyUserToken } from './user-auth.js';

export async function handleList(request, env) {
  const isAdmin = await verifyAdminToken(request, env);

  if (isAdmin) {
    // Admin: full R2 list — exclude proto/ objects (they are prototype files, not images)
    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor') ?? undefined;
    const limit  = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 200);
    const result = await env.BUCKET.list({ limit, cursor });
    return Response.json({
      items: result.objects
        .filter(o => !o.key.startsWith('proto/'))
        .map(o => ({ key: o.key, size: o.size, uploaded: o.uploaded, etag: o.etag })),
      cursor: result.truncated ? result.cursor : null,
      truncated: result.truncated,
    });
  }

  // Regular user: their own list from KV
  const user = await verifyUserToken(request, env);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const list = await env.STATS.get('userimgs:' + user.username, 'json') ?? [];
  // 排除回收站中（软删除）的图片
  return Response.json({ items: list.filter(e => !e.deletedAt), cursor: null, truncated: false });
}

// 标签规范化：去重、trim、去空、长度上限，最多 10 个，每个 ≤ 24 字符
export function normalizeTags(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of input) {
    const t = String(raw ?? '').trim().slice(0, 24);
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

  // 持久来源：imgmeta value（metadata 保持不变，避免超出 1KB metadata 上限）
  await env.STATS.put(metaKey, JSON.stringify({ ...(existing.value ?? {}), tags }), {
    metadata: existing.metadata,
  });

  // 冗余进 userimgs 列表项，供前端筛选无需逐项读取
  const owner = existing.metadata.owner;
  const imgsKv = 'userimgs:' + owner;
  const list = await env.STATS.get(imgsKv, 'json') ?? [];
  const idx = list.findIndex(e => e.key === key);
  if (idx !== -1) { list[idx].tags = tags; await env.STATS.put(imgsKv, JSON.stringify(list)); }

  return Response.json({ key, tags });
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

  const newPublic = !existing.metadata.isPublic;
  await env.STATS.put(metaKey, JSON.stringify(existing.value ?? {}), {
    metadata: { ...existing.metadata, isPublic: newPublic },
  });

  // Update userimgs list entry too
  const owner = existing.metadata.owner;
  const imgsKv = 'userimgs:' + owner;
  const list = await env.STATS.get(imgsKv, 'json') ?? [];
  const idx = list.findIndex(e => e.key === key);
  if (idx !== -1) { list[idx].isPublic = newPublic; await env.STATS.put(imgsKv, JSON.stringify(list)); }

  return Response.json({ key, isPublic: newPublic });
}
