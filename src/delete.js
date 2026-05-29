import { verifyAdminToken } from './admin/auth.js';
import { verifyUserToken } from './user-auth.js';
import { cfBump, cfMonth } from './admin/cfCounters.js';
import { bumpGlobalStats } from './admin/gstats.js';

export async function handleDelete(request, env, key, ctx) {
  const isAdmin = await verifyAdminToken(request, env);
  let username = null;

  if (!isAdmin) {
    const user = await verifyUserToken(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!user.permissions.canDelete) return Response.json({ error: 'Delete permission denied' }, { status: 403 });
    username = user.username;
  }

  if (!key) return Response.json({ error: 'Missing key' }, { status: 400 });

  const object = await env.BUCKET.head(key);
  if (!object) return Response.json({ error: 'Image not found' }, { status: 404 });

  await env.BUCKET.delete(key);

  // R2 Class A 操作追踪（删除）
  ctx?.waitUntil(cfBump(env.STATS, 'cf:r2a:' + cfMonth(), 1, true));
  // 全局计数缓存增量（排除 proto/ 文件，与统计口径一致）
  if (!key.startsWith('proto/')) ctx?.waitUntil(bumpGlobalStats(env, -1, -(object.size ?? 0)));

  // Clean up KV metadata
  const owner = object.customMetadata?.uploadedBy ?? username;
  await Promise.all([
    env.STATS.delete('imgmeta:' + key),
    owner ? removeFromUserList(env, owner, key) : Promise.resolve(),
  ]);

  return Response.json({ deleted: key });
}

async function removeFromUserList(env, username, key) {
  const imgsKv = 'userimgs:' + username;
  const list = await env.STATS.get(imgsKv, 'json') ?? [];
  const updated = list.filter(e => e.key !== key);
  if (updated.length !== list.length) {
    await env.STATS.put(imgsKv, JSON.stringify(updated));
  }
}
