import { cfBump, cfMonth } from '../admin/cfCounters.js';
import { normalizeTags } from '../list.js';

// proto: 前缀下混着两类辅助 key：版本文件清单 proto:vfiles:… 与上传暂存
// proto:staging:…（init 写入、finalize 删除、TTL 1h）。两者都没有 protoId，
// 被当成正式原型返回时前端会渲染出一行「预览」指向 /proto/undefined/ ——
// 打开就是 Prototype Not Found；而且它会占住标题，让同名重传被
// 「已存在同名原型」挡住。上传被中断（关标签页 / 网关超时 / 批次重试耗尽）
// 时暂存记录会留到 TTL 过期，这期间列表里就会出现这种幽灵行。
const PROTO_AUX_PREFIXES = ['proto:vfiles:', 'proto:staging:'];

/** proto: 前缀下是否为正式原型元数据 key（辅助 key 一律排除） */
export function isProtoKey(name) {
  return !PROTO_AUX_PREFIXES.some(p => name.startsWith(p));
}

export async function listProtos(env, ownerFilter, includePasswords = false) {
  const list = await env.STATS.list({ prefix: 'proto:' });
  const protos = await Promise.all(
    list.keys
      .filter(k => isProtoKey(k.name))
      .map(async k => {
      const p = await env.STATS.get(k.name, 'json');
      // 兜底：没有 protoId 的记录不是可访问的原型（历史残留 / 半成品元数据）
      if (!p || !p.protoId) return null;
      const obj = {
        protoId:         p.protoId,
        title:           p.title,
        owner:           p.owner,
        entryPoint:      p.entryPoint,
        fileCount:       p.fileCount,
        totalSize:       p.totalSize,
        createdAt:       p.createdAt,
        updatedAt:       p.updatedAt ?? p.createdAt,
        hasPassword:     !!p.accessPassword,
        version:         p.version ?? 1,
        versions:        p.versions ?? [],
        passwordExpiry:  p.passwordExpiry ?? null,
        isPrivate:       p.isPrivate ?? false,
        tags:            Array.isArray(p.tags) ? p.tags : [],
        deletedAt:       p.deletedAt ?? null,
      };
      if (includePasswords && p.accessPassword) {
        obj.accessPassword = p.accessPassword;
      }
      return obj;
    })
  );
  // 排除已软删除（在回收站中）的原型
  const all = protos.filter(p => p && !p.deletedAt);
  return ownerFilter ? all.filter(p => p.owner === ownerFilter) : all;
}

export async function updateProtoMeta(env, protoId, callerUsername, isAdmin, updates) {
  if (!protoId) return Response.json({ error: 'Missing protoId' }, { status: 400 });

  const meta = await env.STATS.get(`proto:${protoId}`, 'json');
  if (!meta) return Response.json({ error: 'Prototype not found' }, { status: 404 });
  if (!isAdmin && meta.owner !== callerUsername) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body = updates;
  if (!(body && typeof body === 'object')) {
    return Response.json({ error: 'Invalid updates' }, { status: 400 });
  }

  if (body.title !== undefined) {
    meta.title = String(body.title).slice(0, 100) || meta.title;
  }
  if (body.isPrivate !== undefined) {
    meta.isPrivate = !!body.isPrivate;
  }
  if (body.tags !== undefined) {
    meta.tags = normalizeTags(body.tags);
  }

  // Password handling
  if ('password' in body) {
    const pwd = body.password ? String(body.password).replace(/[^A-Za-z0-9]/g, '').slice(0, 6) : '';
    if (pwd) {
      meta.accessPassword = pwd;
      // Set expiry: use provided passwordExpiry, or 14 days from now if not specified
      if (body.passwordExpiry !== undefined) {
        meta.passwordExpiry = body.passwordExpiry ? Number(body.passwordExpiry) : null;
      } else {
        meta.passwordExpiry = Date.now() + 14 * 86400 * 1000;
      }
    } else {
      delete meta.accessPassword;
      meta.passwordExpiry = null;
    }
  } else if (body.passwordExpiry !== undefined) {
    meta.passwordExpiry = body.passwordExpiry ? Number(body.passwordExpiry) : null;
  }

  meta.updatedAt = Date.now();
  await env.STATS.put(`proto:${protoId}`, JSON.stringify(meta));

  return Response.json({ ok: true, protoId, updatedAt: meta.updatedAt });
}

// 软删除：标记 deletedAt，保留 R2 内容，移入回收站（30 天后 cron 彻底清理）。
// 永久删除见 purgeProto（由回收站「彻底删除」与 cron 调用）。
export async function deleteProto(env, protoId, callerUsername, isAdmin) {
  if (!protoId) return Response.json({ error: 'Missing protoId' }, { status: 400 });

  const meta = await env.STATS.get(`proto:${protoId}`, 'json');
  if (!meta) return Response.json({ error: 'Prototype not found' }, { status: 404 });
  if (!isAdmin && meta.owner !== callerUsername) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (meta.deletedAt) return Response.json({ trashed: protoId, alreadyTrashed: true });

  meta.deletedAt = Date.now();
  await env.STATS.put(`proto:${protoId}`, JSON.stringify(meta));
  return Response.json({ trashed: protoId });
}

// 永久删除：清空 R2 前缀下所有对象 + KV 元数据 / 版本清单 / 访问计数 / 增量上传 manifest。
export async function purgeProto(env, protoId) {
  if (!protoId) return;

  // Delete all R2 objects with this proto prefix (paginated)
  let cursor, totalDeleted = 0;
  const prefix = `proto/${protoId}/`;
  do {
    const result = await env.BUCKET.list({ prefix, limit: 1000, cursor });
    if (result.objects.length) {
      // R2 批量删除：单次 delete 接受 ≤1000 个 key = 1 个 subrequest
      await env.BUCKET.delete(result.objects.map(o => o.key));
      totalDeleted += result.objects.length;
    }
    cursor = result.truncated ? result.cursor : undefined;
  } while (cursor);

  // 增量上传 manifest（位于 proto 前缀之外，需单独删除）
  try { await env.BUCKET.delete(`manifests/${protoId}.json`); } catch {}

  // R2 Class A 追踪：删除的文件数（best-effort）
  if (totalDeleted > 0) {
    try { await cfBump(env.STATS, 'cf:r2a:' + cfMonth(), totalDeleted, true); } catch {}
  }

  // Delete KV metadata + all version file lists + 访问计数（prstats），避免概览残留
  const vList = await env.STATS.list({ prefix: `proto:vfiles:${protoId}:` });
  await Promise.all([
    env.STATS.delete(`proto:${protoId}`),
    env.STATS.delete(`prstats:${protoId}`),
    ...vList.keys.map(k => env.STATS.delete(k.name)),
  ]);
}

// Delete a single historical version record (metadata + vfiles KV).
// The latest (current) version cannot be deleted — only historical ones.
export async function deleteProtoVersion(env, protoId, versionNum, callerUsername, isAdmin) {
  if (!protoId) return Response.json({ error: 'Missing protoId' }, { status: 400 });

  const meta = await env.STATS.get(`proto:${protoId}`, 'json');
  if (!meta) return Response.json({ error: 'Prototype not found' }, { status: 404 });
  if (!isAdmin && meta.owner !== callerUsername) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const ver = Number(versionNum);
  if (!Number.isInteger(ver) || ver < 1) {
    return Response.json({ error: 'Invalid version number' }, { status: 400 });
  }
  if (ver === (meta.version ?? 1)) {
    return Response.json({ error: '不能删除当前最新版本' }, { status: 400 });
  }

  const before = meta.versions ?? [];
  const after  = before.filter(v => v.v !== ver);
  if (after.length === before.length) {
    return Response.json({ error: '版本不存在' }, { status: 404 });
  }

  meta.versions = after;
  await Promise.all([
    env.STATS.put(`proto:${protoId}`, JSON.stringify(meta)),
    env.STATS.delete(`proto:vfiles:${protoId}:v${ver}`),
  ]);

  return Response.json({ deleted: ver, remaining: after.length });
}
