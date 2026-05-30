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
