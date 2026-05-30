import { verifyAdminToken } from './admin/auth.js';
import { verifyUserToken } from './user-auth.js';
import { cfBump, cfMonth } from './admin/cfCounters.js';
import { bumpGlobalStats } from './admin/gstats.js';
import { purgeProto } from './proto/manage.js';

export const TRASH_RETENTION_MS = 30 * 86400 * 1000; // 30 天保留期
export const TRASH_RETENTION_DAYS = 30;

async function resolveActor(request, env) {
  if (await verifyAdminToken(request, env)) return { isAdmin: true, username: env.ADMIN_USERNAME ?? 'admin' };
  const u = await verifyUserToken(request, env);
  return u ? { isAdmin: false, username: u.username } : null;
}

// ── GET /api/trash  (user: 自己；admin: 全部) ────────────────────────────────
export async function handleTrashList(request, env) {
  const actor = await resolveActor(request, env);
  if (!actor) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // 图片：扫描 imgmeta，取带 deletedAt 的（metadata 即可，无需读取 value）
  const kvList = await env.STATS.list({ prefix: 'imgmeta:' });
  const images = [];
  for (const k of kvList.keys) {
    const md = k.metadata;
    if (!md?.deletedAt) continue;
    if (!actor.isAdmin && md.owner !== actor.username) continue;
    images.push({ key: k.name.slice(8), owner: md.owner, isPublic: !!md.isPublic, deletedAt: md.deletedAt });
  }

  // 原型：扫描 proto:（排除 vfiles），取带 deletedAt 的
  const protoList = await env.STATS.list({ prefix: 'proto:' });
  const protos = [];
  for (const k of protoList.keys) {
    if (k.name.startsWith('proto:vfiles:')) continue;
    const p = await env.STATS.get(k.name, 'json');
    if (!p?.deletedAt) continue;
    if (!actor.isAdmin && p.owner !== actor.username) continue;
    protos.push({
      protoId: p.protoId, title: p.title, owner: p.owner,
      fileCount: p.fileCount, totalSize: p.totalSize, deletedAt: p.deletedAt,
    });
  }

  images.sort((a, b) => b.deletedAt - a.deletedAt);
  protos.sort((a, b) => b.deletedAt - a.deletedAt);
  return Response.json({ images, protos, retentionDays: TRASH_RETENTION_DAYS });
}

// ── POST /api/trash/restore  body { type, key|protoId } ──────────────────────
export async function handleTrashRestore(request, env, ctx) {
  const actor = await resolveActor(request, env);
  if (!actor) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (body.type === 'image') return restoreImage(env, actor, body.key, ctx);
  if (body.type === 'proto') return restoreProto(env, actor, body.protoId);
  return Response.json({ error: 'Invalid type' }, { status: 400 });
}

// ── DELETE /api/trash/purge  body { type, key|protoId } — 立即彻底删除 ────────
export async function handleTrashPurge(request, env, ctx) {
  const actor = await resolveActor(request, env);
  if (!actor) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (body.type === 'image') return purgeImageEndpoint(env, actor, body.key, ctx);
  if (body.type === 'proto') {
    const meta = await env.STATS.get(`proto:${body.protoId}`, 'json');
    if (!meta) return Response.json({ error: 'Not found' }, { status: 404 });
    if (!actor.isAdmin && meta.owner !== actor.username) return Response.json({ error: 'Forbidden' }, { status: 403 });
    await purgeProto(env, body.protoId);
    return Response.json({ purged: body.protoId });
  }
  return Response.json({ error: 'Invalid type' }, { status: 400 });
}

async function restoreImage(env, actor, key, ctx) {
  if (!key) return Response.json({ error: 'Missing key' }, { status: 400 });
  const metaKey  = 'imgmeta:' + key;
  const existing = await env.STATS.getWithMetadata(metaKey, 'json');
  if (!existing?.metadata) return Response.json({ error: 'Not found' }, { status: 404 });
  const md = existing.metadata;
  if (!actor.isAdmin && md.owner !== actor.username) return Response.json({ error: 'Forbidden' }, { status: 403 });
  if (!md.deletedAt) return Response.json({ restored: key, alreadyActive: true });

  const value = existing.value ?? {};
  delete value.deletedAt;
  const newMd = { ...md }; delete newMd.deletedAt;
  await env.STATS.put(metaKey, JSON.stringify(value), { metadata: newMd });

  // userimgs 列表项清除 deletedAt
  const owner  = md.owner;
  const imgsKv = 'userimgs:' + owner;
  const list = await env.STATS.get(imgsKv, 'json') ?? [];
  const idx = list.findIndex(e => e.key === key);
  let size = 0;
  if (idx !== -1) { delete list[idx].deletedAt; size = list[idx].size ?? 0; await env.STATS.put(imgsKv, JSON.stringify(list)); }

  // 恢复进「在用」统计
  ctx?.waitUntil(bumpGlobalStats(env, 1, size));
  return Response.json({ restored: key });
}

async function restoreProto(env, actor, protoId) {
  if (!protoId) return Response.json({ error: 'Missing protoId' }, { status: 400 });
  const meta = await env.STATS.get(`proto:${protoId}`, 'json');
  if (!meta) return Response.json({ error: 'Not found' }, { status: 404 });
  if (!actor.isAdmin && meta.owner !== actor.username) return Response.json({ error: 'Forbidden' }, { status: 403 });
  if (!meta.deletedAt) return Response.json({ restored: protoId, alreadyActive: true });
  delete meta.deletedAt;
  await env.STATS.put(`proto:${protoId}`, JSON.stringify(meta));
  return Response.json({ restored: protoId });
}

async function purgeImageEndpoint(env, actor, key, ctx) {
  if (!key) return Response.json({ error: 'Missing key' }, { status: 400 });
  const metaKey  = 'imgmeta:' + key;
  const existing = await env.STATS.getWithMetadata(metaKey, 'json');
  const md = existing?.metadata;
  if (md && !actor.isAdmin && md.owner !== actor.username) return Response.json({ error: 'Forbidden' }, { status: 403 });
  await purgeImage(env, key, md?.owner ?? actor.username);
  ctx?.waitUntil(cfBump(env.STATS, 'cf:r2a:' + cfMonth(), 1, true));
  return Response.json({ purged: key });
}

// 彻底删除单张图片：R2 对象 + imgmeta + userimgs 列表项 + 访问统计
export async function purgeImage(env, key, owner) {
  await env.BUCKET.delete(key);
  const tasks = [
    env.STATS.delete('imgmeta:' + key),
    env.STATS.delete('stats:' + key),
  ];
  if (owner) {
    tasks.push((async () => {
      const imgsKv = 'userimgs:' + owner;
      const list = await env.STATS.get(imgsKv, 'json') ?? [];
      const updated = list.filter(e => e.key !== key);
      if (updated.length !== list.length) await env.STATS.put(imgsKv, JSON.stringify(updated));
    })());
  }
  await Promise.all(tasks);
}

// ── Cron：彻底清理超过保留期的回收站内容 ─────────────────────────────────────
export async function purgeExpiredTrash(env) {
  const cutoff = Date.now() - TRASH_RETENTION_MS;
  let imagesPurged = 0, protosPurged = 0;

  // 图片
  let cursor;
  do {
    const r = await env.STATS.list({ prefix: 'imgmeta:', cursor });
    for (const k of r.keys) {
      const md = k.metadata;
      if (md?.deletedAt && md.deletedAt < cutoff) {
        try { await purgeImage(env, k.name.slice(8), md.owner); imagesPurged++; } catch {}
      }
    }
    cursor = r.list_complete ? undefined : r.cursor;
  } while (cursor);

  // 原型
  cursor = undefined;
  do {
    const r = await env.STATS.list({ prefix: 'proto:', cursor });
    for (const k of r.keys) {
      if (k.name.startsWith('proto:vfiles:')) continue;
      const p = await env.STATS.get(k.name, 'json');
      if (p?.deletedAt && p.deletedAt < cutoff) {
        try { await purgeProto(env, p.protoId); protosPurged++; } catch {}
      }
    }
    cursor = r.list_complete ? undefined : r.cursor;
  } while (cursor);

  return { imagesPurged, protosPurged };
}
