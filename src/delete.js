import { mergeUserImgEntry } from './imglist.js';
import { verifyAdminToken } from './admin/auth.js';
import { verifyUserToken } from './user-auth.js';
import { bumpGlobalStats } from './admin/gstats.js';
import { cfBump, cfMonth } from './admin/cfCounters.js';

// 软删除：标记 deletedAt，保留 R2 对象，移入回收站（30 天后由 cron 彻底清理）。
// 见 trash.js 的恢复/彻底删除，index.js 的 scheduled() cron。
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

  // 读取元数据（确定归属与当前状态）
  const metaKey  = 'imgmeta:' + key;
  const existing = await env.STATS.getWithMetadata(metaKey, 'json');
  if (!existing?.metadata) {
    // 索引缺失（多为后台原始 R2 对象）。无元数据无法软删，管理员直接硬删除清理；普通用户拒绝。
    const object = await env.BUCKET.head(key);
    if (!object) return Response.json({ error: 'Image not found' }, { status: 404 });
    if (!isAdmin) return Response.json({ error: 'Image not indexed' }, { status: 409 });
    await env.BUCKET.delete(key);
    ctx?.waitUntil(cfBump(env.STATS, 'cf:r2a:' + cfMonth(), 1, true));
    if (!key.startsWith('proto/')) ctx?.waitUntil(bumpGlobalStats(env, -1, -(object.size ?? 0)));
    return Response.json({ deleted: key });
  }

  const md = existing.metadata;
  if (!isAdmin && md.owner !== username) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (md.deletedAt) return Response.json({ trashed: key, alreadyTrashed: true });

  const now = Date.now();
  const owner = md.owner ?? username;
  const size  = await imageSize(env, key);

  // 标记软删除：imgmeta metadata + value，并在 userimgs 列表项打标
  await Promise.all([
    env.STATS.put(metaKey, JSON.stringify({ ...(existing.value ?? {}), deletedAt: now }), {
      metadata: { ...md, deletedAt: now },
    }),
    owner ? markUserListTrashed(env, owner, key, now, size) : Promise.resolve(),
  ]);

  // 全局计数缓存：移入回收站后不再计入「在用」统计（排除 proto/）
  if (!key.startsWith('proto/')) ctx?.waitUntil(bumpGlobalStats(env, -1, -(size ?? 0)));

  return Response.json({ trashed: key });
}

async function imageSize(env, key) {
  try { const o = await env.BUCKET.head(key); return o?.size ?? 0; } catch { return 0; }
}

async function markUserListTrashed(env, username, key, deletedAt, size) {
  // 并发安全更新：批量删除并发执行时防止互相覆盖
  const patch = { deletedAt };
  if (size) patch.size = size;
  await mergeUserImgEntry(env, username, key, patch);
}
