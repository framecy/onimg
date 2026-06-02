import { handleUpload } from './upload.js';
import { handleGet } from './get.js';
import { handleDelete } from './delete.js';
import { handleList, handlePublicGallery, handleToggleVisibility, handleSetImageTags } from './list.js';
import { renderPage } from './page.js';
import { renderAdminPage } from './admin-page.js';
import { handleAdminLogin, verifyAdminToken, timingSafeEqual } from './admin/auth.js';
import { handleAdminStats, handleReconcileStats, handleAllImageStats, handleImageStats, handleR2DetailedStats, handleMemberStats, handleAllPageStats, handlePageStats, handleAllProtoStats, handleProtoStats, handleCfQuota } from './admin/stats.js';
import { cfBump, cfDay } from './admin/cfCounters.js';
import { handleListUsers, handleCreateUser, handleUpdateUser, handleDeleteUser } from './admin/users.js';
import { handleGetConfig, handleUpdateConfig } from './admin/config-handler.js';
import { handleUserLogin, verifyUserToken, getUserQuotaInfo, getUser, putUser, hashPassword, randomSalt } from './user-auth.js';
import { servePage } from './pages/handler.js';
import { listPages, handleListPages, handleCreatePage, handleUpdatePage, handleDeletePage } from './pages/manage.js';
import { handleProtoUpload, handleProtoUploadInit, handleProtoFileBatch, handleProtoFinalize } from './proto/upload.js';
import { serveProto } from './proto/serve.js';
import { listProtos, deleteProto, updateProtoMeta, deleteProtoVersion } from './proto/manage.js';
import { handleTrashList, handleTrashRestore, handleTrashPurge, purgeExpiredTrash } from './trash.js';
import { logAudit, clientIp, handleAuditLog } from './admin/audit.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { method } = request;
    const path = url.pathname;

    // ── 根域名重定向 ──────────────────────────────────────────────────────────
    if (url.hostname === 'diswant.space') {
      const dest = 'https://ping.diswant.space' + (path || '/') + url.search;
      return new Response(null, { status: 301, headers: { Location: dest } });
    }

    if (method === 'OPTIONS') return corsResponse(request);

    // Workers 请求计数 — 1% 采样，展示时 × 100
    if (Math.random() < 0.01) {
      ctx.waitUntil(cfBump(env.STATS, 'cf:req:' + cfDay(), 1));
    }

    try {
      // ── Prototype hosting ────────────────────────────────────────────────────
      if (method === 'GET' && path.startsWith('/proto/')) {
        const rest    = path.slice(7);                    // strip '/proto/'
        const slashIdx = rest.indexOf('/');
        const protoId  = slashIdx === -1 ? rest : rest.slice(0, slashIdx);
        const filePath = slashIdx === -1 ? '' : rest.slice(slashIdx + 1);
        return await serveProto(env, protoId, filePath, request);
      }

      // ── Public page hosting ──────────────────────────────────────────────────
      if (method === 'GET' && path.startsWith('/p/')) {
        const slug = decodeURIComponent(path.slice(3));
        return await servePage(env, slug, ctx, request);
      }

      // ── User auth ────────────────────────────────────────────────────────────
      if (method === 'GET'   && path === '/auth/device') return serveDeviceAuthPage(url);
      if (method === 'POST'  && path === '/auth/login') {
        const uname = await peekUsername(request);
        const res = await handleUserLogin(request, env);
        ctx.waitUntil(logAudit(env.STATS, { action: 'user.login', actor: uname, status: res.status < 400 ? 'ok' : 'fail', ip: clientIp(request) }));
        return withCors(res, request);
      }
      if (method === 'PATCH' && path === '/auth/password')        return withCors(await handleChangePassword(request, env), request);
      if (method === 'GET'   && path === '/auth/quota') {
        const user = await verifyUserToken(request, env);
        if (!user) return withCors(Response.json({ error: 'Unauthorized' }, { status: 401 }), request);
        return withCors(Response.json(await getUserQuotaInfo(env, user.username)), request);
      }

      // ── User API ─────────────────────────────────────────────────────────────
      if (method === 'GET'    && path === '/api/gallery')          return withCors(await handlePublicGallery(env), request);
      if (method === 'PATCH'  && path.startsWith('/api/image/') && path.endsWith('/visibility')) {
        const key = decodeURIComponent(path.slice('/api/image/'.length, -'/visibility'.length));
        return withCors(await handleToggleVisibility(request, env, key), request);
      }
      if (method === 'PATCH'  && path.startsWith('/api/image/') && path.endsWith('/tags')) {
        const key = decodeURIComponent(path.slice('/api/image/'.length, -'/tags'.length));
        return withCors(await handleSetImageTags(request, env, key), request);
      }
      // Trash / recycle bin（handler 内部按 admin-or-user 解析身份）
      if (method === 'GET'    && path === '/api/trash')           return withCors(await handleTrashList(request, env), request);
      if (method === 'POST'   && path === '/api/trash/restore')   return withCors(await handleTrashRestore(request, env, ctx), request);
      if (method === 'DELETE' && path === '/api/trash/purge') {
        const actor = await resolveActorName(request, env);
        const res = await handleTrashPurge(request, env, ctx);
        const body = await res.clone().json().catch(() => ({}));
        ctx.waitUntil(logAudit(env.STATS, { action: 'trash.purge', actor, target: body?.purged, status: res.status < 400 ? 'ok' : 'fail', ip: clientIp(request) }));
        return withCors(res, request);
      }
      // User pages
      if (method === 'GET'    && path === '/api/pages')            return withCors(await userPagesHandler(request, env), request);
      if (method === 'POST'   && path === '/api/pages')            return withCors(await userPageCreate(request, env), request);
      if (method === 'PATCH'  && path.startsWith('/api/pages/'))   return withCors(await userPageUpdate(request, env, path.slice('/api/pages/'.length)), request);
      if (method === 'DELETE' && path.startsWith('/api/pages/'))   return withCors(await userPageDelete(request, env, path.slice('/api/pages/'.length)), request);
      // User prototypes
      if (method === 'POST'   && path === '/upload/proto')              return withCors(await protoUploadHandler(request, env), request);
      if (method === 'POST'   && path === '/upload/proto/init')         return withCors(await protoUploadInitHandler(request, env), request);
      if (method === 'POST'   && path === '/upload/proto/files')        return withCors(await protoFileBatchHandler(request, env), request);
      if (method === 'POST'   && path === '/upload/proto/finalize')     return withCors(await protoFinalizeHandler(request, env), request);
      if (method === 'GET'    && path === '/api/protos')                return withCors(await protoListHandler(request, env), request);
      if (method === 'DELETE' && path.startsWith('/api/protos/'))       return withCors(await protoDeleteHandler(request, env, path.slice('/api/protos/'.length)), request);
      if (method === 'PATCH'  && path.startsWith('/api/protos/'))       return withCors(await protoUpdateMetaHandler(request, env, path.slice('/api/protos/'.length)), request);
      // User proto version files (for diff viewer)
      if (method === 'GET'    && path.startsWith('/api/proto-vfiles/')) return withCors(await protoVfilesHandler(request, env, path.slice('/api/proto-vfiles/'.length)), request);
      // User proto version delete
      if (method === 'DELETE' && path.startsWith('/api/proto-versions/')) return withCors(await protoVersionDeleteHandler(request, env, path.slice('/api/proto-versions/'.length)), request);

      // ── Admin panel ──────────────────────────────────────────────────────────
      if (path === '/admin' || path === '/admin/') return addSecurityHeaders(new Response(renderAdminPage(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
      if (method === 'POST' && path === '/admin/login') {
        const uname = await peekUsername(request);
        const res = await handleAdminLogin(request, env);
        ctx.waitUntil(logAudit(env.STATS, { action: 'admin.login', actor: uname, status: res.status < 400 ? 'ok' : 'fail', ip: clientIp(request) }));
        return withCors(res, request);
      }

      if (path.startsWith('/admin/')) {
        if (!await verifyAdminToken(request, env)) return withCors(Response.json({ error: 'Unauthorized' }, { status: 401 }), request);

        if (method === 'GET'  && path === '/admin/cf-quota')         return withCors(await handleCfQuota(env), request);
        if (method === 'GET'  && path === '/admin/audit')            return withCors(await handleAuditLog(env, url), request);
        if (method === 'GET'  && path === '/admin/stats')           return withCors(await handleAdminStats(env), request);
        if (method === 'POST' && path === '/admin/stats/reconcile') return withCors(await handleReconcileStats(env), request);
        if (method === 'GET'  && path === '/admin/all-image-stats') return withCors(await handleAllImageStats(env), request);
        if (method === 'GET'  && path.startsWith('/admin/image-stats/')) {
          return withCors(await handleImageStats(env, decodeURIComponent(path.slice('/admin/image-stats/'.length))), request);
        }
        if (method === 'GET'    && path === '/admin/users')               return withCors(await handleListUsers(env), request);
        if (method === 'POST'   && path === '/admin/users') {
          const uname = await peekUsername(request);
          const res = await handleCreateUser(request, env);
          ctx.waitUntil(logAudit(env.STATS, { action: 'user.create', actor: 'admin', target: uname, status: res.status < 400 ? 'ok' : 'fail', ip: clientIp(request) }));
          return withCors(res, request);
        }
        if (method === 'PATCH'  && path.startsWith('/admin/users/')) {
          const target = decodeURIComponent(path.slice('/admin/users/'.length));
          const res = await handleUpdateUser(request, env, target);
          ctx.waitUntil(logAudit(env.STATS, { action: 'user.update', actor: 'admin', target, status: res.status < 400 ? 'ok' : 'fail', ip: clientIp(request) }));
          return withCors(res, request);
        }
        if (method === 'DELETE' && path.startsWith('/admin/users/')) {
          const target = decodeURIComponent(path.slice('/admin/users/'.length));
          const res = await handleDeleteUser(env, target);
          ctx.waitUntil(logAudit(env.STATS, { action: 'user.delete', actor: 'admin', target, status: res.status < 400 ? 'ok' : 'fail', ip: clientIp(request) }));
          return withCors(res, request);
        }
        if (method === 'GET'    && path === '/admin/config')              return withCors(await handleGetConfig(env), request);
        if (method === 'POST'   && path === '/admin/config') {
          const res = await handleUpdateConfig(request, env);
          ctx.waitUntil(logAudit(env.STATS, { action: 'config.update', actor: 'admin', status: res.status < 400 ? 'ok' : 'fail', ip: clientIp(request) }));
          return withCors(res, request);
        }
        if (method === 'GET'    && path === '/admin/r2-stats')            return withCors(await handleR2DetailedStats(env), request);
        if (method === 'GET'    && path === '/admin/member-stats')        return withCors(await handleMemberStats(env), request);
        if (method === 'GET'    && path === '/admin/all-page-stats')      return withCors(await handleAllPageStats(env), request);
        if (method === 'GET'    && path.startsWith('/admin/page-stats/')) return withCors(await handlePageStats(env, decodeURIComponent(path.slice('/admin/page-stats/'.length))), request);
        // DELETE /admin/proto-versions/{protoId}/v{n}
        if (method === 'DELETE' && path.startsWith('/admin/proto-versions/')) {
          const rest       = decodeURIComponent(path.slice('/admin/proto-versions/'.length));
          const lastSlash  = rest.lastIndexOf('/v');
          const protoId    = rest.slice(0, lastSlash);
          const versionNum = rest.slice(lastSlash + 2); // strip '/v'
          return withCors(await deleteProtoVersion(env, protoId, versionNum, null, true), request);
        }
        if (method === 'GET'    && path === '/admin/all-proto-stats')      return withCors(await handleAllProtoStats(env), request);
        if (method === 'GET'    && path.startsWith('/admin/proto-stats/')) return withCors(await handleProtoStats(env, decodeURIComponent(path.slice('/admin/proto-stats/'.length))), request);
        if (method === 'GET'    && path.startsWith('/admin/proto-vfiles/')) {
          const rest = decodeURIComponent(path.slice('/admin/proto-vfiles/'.length));
          const lastSlash = rest.lastIndexOf('/');
          const protoId   = rest.slice(0, lastSlash);
          const verToken  = rest.slice(lastSlash + 1);
          const files = await env.STATS.get(`proto:vfiles:${protoId}:${verToken}`, 'json');
          return withCors(Response.json({ files: files ?? null, version: verToken }), request);
        }
        // Admin prototype upload (chunked)
        if (method === 'POST'   && path === '/admin/proto/init')           return withCors(await handleProtoUploadInit(request, env, env.ADMIN_USERNAME ?? 'admin'), request);
        if (method === 'POST'   && path === '/admin/proto/files')          return withCors(await handleProtoFileBatch(request, env, env.ADMIN_USERNAME ?? 'admin'), request);
        if (method === 'POST'   && path === '/admin/proto/finalize')       return withCors(await handleProtoFinalize(request, env, env.ADMIN_USERNAME ?? 'admin'), request);
        // Admin prototypes
        if (method === 'GET'    && path === '/admin/protos')               return withCors(await adminProtoListHandler(env), request);
        if (method === 'DELETE' && path.startsWith('/admin/protos/')) {
          const target = decodeURIComponent(path.slice('/admin/protos/'.length));
          const res = await deleteProto(env, target, null, true);
          ctx.waitUntil(logAudit(env.STATS, { action: 'proto.delete', actor: 'admin', target, status: res.status < 400 ? 'ok' : 'fail', ip: clientIp(request) }));
          return withCors(res, request);
        }
        if (method === 'PATCH'  && path.startsWith('/admin/protos/'))      return withCors(await updateProtoMeta(env, decodeURIComponent(path.slice('/admin/protos/'.length)), null, true, await request.json()), request);
        // Admin pages
        if (method === 'GET'    && path === '/admin/pages')               return withCors(Response.json({ pages: await listPages(env, null) }), request);
        if (method === 'POST'   && path === '/admin/pages')               return withCors(await handleCreatePage(request, env, env.ADMIN_USERNAME ?? 'admin'), request);
        if (method === 'PATCH'  && path.startsWith('/admin/pages/'))      return withCors(await handleUpdatePage(request, env, decodeURIComponent(path.slice('/admin/pages/'.length)), env.ADMIN_USERNAME, true), request);
        if (method === 'DELETE' && path.startsWith('/admin/pages/')) {
          const target = decodeURIComponent(path.slice('/admin/pages/'.length));
          const res = await handleDeletePage(env, target, env.ADMIN_USERNAME, true);
          ctx.waitUntil(logAudit(env.STATS, { action: 'page.delete', actor: 'admin', target, status: res.status < 400 ? 'ok' : 'fail', ip: clientIp(request) }));
          return withCors(res, request);
        }

        return withCors(new Response('Not Found', { status: 404 }), request);
      }

      // ── Core image routes ────────────────────────────────────────────────────
      if (method === 'POST'   && path === '/upload')           return withCors(await handleUpload(request, env, ctx), request);
      if (method === 'DELETE' && path.startsWith('/delete/')) {
        const target = path.slice(8);
        const actor = await resolveActorName(request, env);
        const res = await handleDelete(request, env, target, ctx);
        ctx.waitUntil(logAudit(env.STATS, { action: 'image.delete', actor, target: decodeURIComponent(target), status: res.status < 400 ? 'ok' : 'fail', ip: clientIp(request) }));
        return withCors(res, request);
      }
      if (method === 'GET'    && path === '/list')             return withCors(await handleList(request, env), request);
      if (method === 'GET'    && path === '/')                 return addSecurityHeaders(new Response(renderPage(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
      if (method === 'GET'    && path.startsWith('/'))         return withCors(await handleGet(env, ctx, path.slice(1), request), request);

      return withCors(new Response('Not Found', { status: 404 }), request);
    } catch (err) {
      return withCors(Response.json({ error: err.message }, { status: 500 }), request);
    }
  },

  // Cron Trigger：每日清理超过 30 天保留期的回收站内容（见 wrangler.toml [triggers]）
  async scheduled(event, env, ctx) {
    ctx.waitUntil(purgeExpiredTrash(env).catch(() => {}));
  },
};

// ── Audit helpers ───────────────────────────────────────────────────────────

// 从登录请求体读取 username 用于审计（克隆请求，避免消耗给 handler 的 body）。
async function peekUsername(request) {
  try {
    const body = await request.clone().json();
    return String(body?.username ?? '—').slice(0, 64);
  } catch { return '—'; }
}

// 解析当前操作者名（admin token → admin；user token → username；否则匿名）。
async function resolveActorName(request, env) {
  if (await verifyAdminToken(request, env)) return env.ADMIN_USERNAME ?? 'admin';
  const user = await verifyUserToken(request, env);
  return user?.username ?? '—';
}

// ── User page helpers ─────────────────────────────────────────────────────────

async function requireUser(request, env) {
  const user = await verifyUserToken(request, env);
  if (!user) return [null, Response.json({ error: 'Unauthorized' }, { status: 401 })];
  return [user, null];
}

async function userPagesHandler(request, env) {
  const [user, err] = await requireUser(request, env);
  if (err) return err;
  return handleListPages(request, env, user.username);
}
async function userPageCreate(request, env) {
  const [user, err] = await requireUser(request, env);
  if (err) return err;
  return handleCreatePage(request, env, user.username);
}
async function userPageUpdate(request, env, slug) {
  const [user, err] = await requireUser(request, env);
  if (err) return err;
  return handleUpdatePage(request, env, slug, user.username, false);
}
async function userPageDelete(request, env, slug) {
  const [user, err] = await requireUser(request, env);
  if (err) return err;
  return handleDeletePage(env, slug, user.username, false);
}

// ── Proto helpers ─────────────────────────────────────────────────────────────

async function protoUploadHandler(request, env) {
  const [user, err] = await requireUser(request, env);
  if (err) return err;
  if (user.permissions && user.permissions.canUpload === false) {
    return Response.json({ error: 'No upload permission' }, { status: 403 });
  }
  return handleProtoUpload(request, env, user.username);
}

async function protoListHandler(request, env) {
  const [user, err] = await requireUser(request, env);
  if (err) return err;
  const protos = await listProtos(env, user.username, true);
  // Merge visit counts from KV metadata (single list call, no per-item reads)
  const statsList = await env.STATS.list({ prefix: 'prstats:' });
  const statsMap = {};
  for (const k of statsList.keys) statsMap[k.name.slice(8)] = k.metadata?.count ?? 0; // 'prstats:' = 8 字符
  protos.forEach(p => { p.visitCount = statsMap[p.protoId] ?? 0; });
  return Response.json({ protos });
}

async function adminProtoListHandler(env) {
  const protos = await listProtos(env, null, true);
  const statsList = await env.STATS.list({ prefix: 'prstats:' });
  const statsMap = {};
  for (const k of statsList.keys) statsMap[k.name.slice(8)] = k.metadata?.count ?? 0; // 'prstats:' = 8 字符
  protos.forEach(p => { p.visitCount = statsMap[p.protoId] ?? 0; });
  return Response.json({ protos });
}

async function protoVfilesHandler(request, env, tail) {
  const [user, err] = await requireUser(request, env);
  if (err) return err;
  const rest       = decodeURIComponent(tail);
  const lastSlash  = rest.lastIndexOf('/v');
  const protoId    = rest.slice(0, lastSlash);
  const verToken   = rest.slice(lastSlash + 1); // e.g. 'v3'
  const meta = await env.STATS.get(`proto:${protoId}`, 'json');
  if (!meta || meta.owner !== user.username) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const files = await env.STATS.get(`proto:vfiles:${protoId}:${verToken}`, 'json');
  return Response.json({ files: files ?? null });
}

async function protoVersionDeleteHandler(request, env, tail) {
  const [user, err] = await requireUser(request, env);
  if (err) return err;
  const rest       = decodeURIComponent(tail);
  const lastSlash  = rest.lastIndexOf('/v');
  const protoId    = rest.slice(0, lastSlash);
  const versionNum = rest.slice(lastSlash + 2); // strip '/v'
  return deleteProtoVersion(env, protoId, versionNum, user.username, false);
}

async function protoUpdateMetaHandler(request, env, protoId) {
  const [user, err] = await requireUser(request, env);
  if (err) return err;
  return updateProtoMeta(env, decodeURIComponent(protoId), user.username, false, await request.json());
}

async function protoDeleteHandler(request, env, protoId) {
  const [user, err] = await requireUser(request, env);
  if (err) return err;
  return deleteProto(env, decodeURIComponent(protoId), user.username, false);
}

async function protoUploadInitHandler(request, env) {
  const [user, err] = await requireUser(request, env);
  if (err) return err;
  if (user.permissions && user.permissions.canUpload === false) return Response.json({ error: 'No upload permission' }, { status: 403 });
  return handleProtoUploadInit(request, env, user.username);
}
async function protoFileBatchHandler(request, env) {
  const [user, err] = await requireUser(request, env);
  if (err) return err;
  if (user.permissions && user.permissions.canUpload === false) return Response.json({ error: 'No upload permission' }, { status: 403 });
  return handleProtoFileBatch(request, env, user.username);
}
async function protoFinalizeHandler(request, env) {
  const [user, err] = await requireUser(request, env);
  if (err) return err;
  if (user.permissions && user.permissions.canUpload === false) return Response.json({ error: 'No upload permission' }, { status: 403 });
  return handleProtoFinalize(request, env, user.username);
}

// ── Change password ───────────────────────────────────────────────────────────

async function handleChangePassword(request, env) {
  const user = await verifyUserToken(request, env);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { currentPassword, newPassword } = body;
  if (!currentPassword || !newPassword) return Response.json({ error: 'Missing fields' }, { status: 400 });
  if (newPassword.length < 6) return Response.json({ error: '新密码至少 6 位' }, { status: 400 });
  if (newPassword.length > 64) return Response.json({ error: '新密码最多 64 位' }, { status: 400 });

  const stored = await getUser(env, user.username);
  if (!stored) return Response.json({ error: 'User not found' }, { status: 404 });
  if (stored.disabled) return Response.json({ error: 'Account disabled' }, { status: 403 });

  // Verify current password
  const currentHash = await hashPassword(currentPassword, stored.salt);
  if (!timingSafeEqual(currentHash, stored.passwordHash)) {
    return Response.json({ error: '当前密码错误' }, { status: 401 });
  }

  // Set new password
  const newSalt = randomSalt();
  const newHash = await hashPassword(newPassword, newSalt);
  stored.salt = newSalt;
  stored.passwordHash = newHash;
  await putUser(env, user.username, stored);

  return Response.json({ ok: true });
}

// ── CORS + Security helpers ───────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  'https://img.diswant.space',
  'https://ping.diswant.space',
  'https://diswant.space',
];

function getAllowedOrigin(req) {
  const origin = req?.headers?.get('Origin') ?? '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

function corsResponse(req) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': getAllowedOrigin(req),
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Vary': 'Origin',
    },
  });
}

function addSecurityHeaders(response) {
  const res = new Response(response.body, response);
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "img-src 'self' blob: data:",
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
      "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net",
      "connect-src 'self' https://cdn.jsdelivr.net",
      "worker-src blob:",
      "frame-ancestors 'none'",
    ].join('; '),
  );
  return res;
}

function withCors(response, req) {
  const res = new Response(response.body, response);
  res.headers.set('Access-Control-Allow-Origin', getAllowedOrigin(req));
  res.headers.set('Vary', 'Origin');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return res;
}

// ── Device auth page (/auth/device) ──────────────────────────────────────────
// Used by CLI tools (e.g. Typora uploader). Opens in browser, redirects to
// localhost callback with ?token=<jwt> after successful login.

function serveDeviceAuthPage(url) {
  const cb = url.searchParams.get('callback') ?? '';
  if (cb && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(cb)) {
    return new Response('Invalid callback — must be localhost', { status: 400 });
  }
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Onimg — 设备授权</title>
<style>
:root{--bg:#0a0a0a;--bg-2:#141414;--bg-3:#1a1a1a;--bd:#2e2e2e;--bd-2:#3a3a3a;--tx:#f5f5f5;--tx-2:#b5b5b5;--tx-3:#858585;--green:#34d399;--green-g:rgba(52,211,153,.12);--green-r:rgba(52,211,153,.22);--red:#f87171;--red-g:rgba(248,113,113,.1);--shadow:0 24px 60px rgba(0,0,0,.92);--font:'Outfit',system-ui,-apple-system,sans-serif}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--font);background:var(--bg);color:var(--tx);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;-webkit-font-smoothing:antialiased}
.card{background:var(--bg-3);border:1px solid var(--bd);border-radius:14px;padding:40px 36px;width:100%;max-width:360px;box-shadow:var(--shadow)}
.logo{width:40px;height:40px;background:linear-gradient(135deg,#2e2e2e,#1a1a1a);border:1px solid var(--bd-2);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:.88rem;font-weight:800;color:var(--tx);margin-bottom:20px;box-shadow:0 3px 10px rgba(0,0,0,.5)}
h1{font-size:1.1rem;font-weight:800;letter-spacing:-.025em;margin-bottom:6px}
.sub{font-size:.8rem;color:var(--tx-2);margin-bottom:26px;line-height:1.5}
input{width:100%;background:var(--bg-2);border:1px solid var(--bd);border-radius:8px;padding:10px 13px;color:var(--tx);font-size:.88rem;font-family:var(--font);outline:none;transition:border-color .15s;margin-bottom:10px}
input:focus{border-color:var(--bd-2)}
input::placeholder{color:var(--tx-3)}
button{width:100%;padding:11px;background:var(--tx);color:var(--bg);border:none;border-radius:8px;font-size:.9rem;font-weight:700;cursor:pointer;font-family:var(--font);transition:opacity .15s;margin-top:4px}
button:hover{opacity:.88}
button:disabled{opacity:.45;cursor:default}
.err{color:var(--red);font-size:.78rem;margin-top:10px;min-height:18px;text-align:center}
.ok{background:var(--green-g);border:1px solid var(--green-r);border-radius:8px;padding:14px;text-align:center;color:var(--green);font-size:.85rem;font-weight:600;margin-top:14px;display:none}
.notice{font-size:.7rem;color:var(--tx-3);text-align:center;margin-top:18px;line-height:1.5}
@keyframes spin{to{transform:rotate(360deg)}}
.spin::before{content:'';display:inline-block;width:13px;height:13px;border:2px solid rgba(0,0,0,.2);border-top-color:#000;border-radius:50%;animation:spin .6s linear infinite;margin-right:8px;vertical-align:middle}
</style>
</head>
<body>
<div class="card">
  <div class="logo">Oi</div>
  <h1>设备授权</h1>
  <p class="sub">登录后，访问令牌将自动返回给调用方（仅限本机）。</p>
  <input id="u" type="text" placeholder="用户名" autocomplete="username">
  <input id="p" type="password" placeholder="密码" autocomplete="current-password">
  <button id="btn">登录并授权</button>
  <div class="err" id="err"></div>
  <div class="ok" id="ok">授权成功！可以关闭此窗口。</div>
  <p class="notice">令牌仅发送至 localhost，不经过任何第三方</p>
</div>
<script>
const CB = ${JSON.stringify(cb)};
const btn = document.getElementById('btn');
const err = document.getElementById('err');
document.getElementById('u').addEventListener('keydown', e => e.key === 'Enter' && document.getElementById('p').focus());
document.getElementById('p').addEventListener('keydown', e => e.key === 'Enter' && btn.click());
btn.addEventListener('click', async () => {
  const u = document.getElementById('u').value.trim();
  const p = document.getElementById('p').value;
  err.textContent = '';
  if (!u || !p) { err.textContent = '请填写账号和密码'; return; }
  btn.disabled = true; btn.classList.add('spin'); btn.textContent = '登录中…';
  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({username: u, password: p})
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '登录失败');
    if (CB) {
      window.location.href = CB + (CB.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(data.token);
    } else {
      document.getElementById('ok').style.display = 'block';
      btn.textContent = '已授权';
    }
  } catch(e) {
    err.textContent = e.message;
    btn.disabled = false; btn.classList.remove('spin'); btn.textContent = '登录并授权';
  }
});
</script>
</body>
</html>`;
  return addSecurityHeaders(new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
}
