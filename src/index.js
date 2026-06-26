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
import { listPages, handleGetPage, handleListPages, handleCreatePage, handleUpdatePage, handleDeletePage, handleReorderPages, handleImportPage } from './pages/manage.js';
import { handleCreateProject, handleListProjects, handleUpdateProject, handleDeleteProject, handleReorderProjects } from './pages/project.js';
import { handleCreateGroup, handleListGroups, handleUpdateGroup, handleDeleteGroup, handleReorderGroups } from './pages/group.js';
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

      // ── Install script & CLI assets ──────────────────────────────────────────
      if (method === 'GET'   && path === '/install.sh')                  return serveInstallScript(url);
      if (method === 'GET'   && path === '/scripts/onimg-cli.py')        return serveStaticScript(env, 'onimg-cli.py', 'text/plain');
      if (method === 'GET'   && path === '/scripts/typora-upload.sh')    return serveStaticScript(env, 'typora-upload.sh', 'text/plain');

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
      if (method === 'POST'   && path === '/api/pages/import')    return withCors(await userPageImportHandler(request, env), request);
      if (method === 'GET'    && path.startsWith('/api/pages/') && path !== '/api/pages/')   return withCors(await userPageGet(request, env, decodeURIComponent(path.slice('/api/pages/'.length))), request);
      if (method === 'PATCH'  && path === '/api/pages/reorder')   return withCors(await userPageReorderHandler(request, env), request);
      if (method === 'PATCH'  && path.startsWith('/api/pages/'))   return withCors(await userPageUpdate(request, env, path.slice('/api/pages/'.length)), request);
      if (method === 'DELETE' && path.startsWith('/api/pages/'))   return withCors(await userPageDelete(request, env, path.slice('/api/pages/'.length)), request);
      // User projects
      if (method === 'GET'    && path === '/api/projects')         return withCors(await userProjectListHandler(request, env), request);
      if (method === 'POST'   && path === '/api/projects')         return withCors(await userProjectCreateHandler(request, env), request);
      if (method === 'PATCH'  && path === '/api/projects/reorder') return withCors(await userProjectReorderHandler(request, env), request);
      if (method === 'PATCH'  && path.startsWith('/api/projects/')) return withCors(await userProjectUpdateHandler(request, env, path.slice('/api/projects/'.length)), request);
      if (method === 'DELETE' && path.startsWith('/api/projects/')) return withCors(await userProjectDeleteHandler(request, env, path.slice('/api/projects/'.length)), request);
      // User groups
      if (method === 'GET'    && path === '/api/groups')           return withCors(await userGroupListHandler(request, env), request);
      if (method === 'POST'   && path === '/api/groups')           return withCors(await userGroupCreateHandler(request, env), request);
      if (method === 'PATCH'  && path === '/api/groups/reorder')   return withCors(await userGroupReorderHandler(request, env), request);
      if (method === 'PATCH'  && path.startsWith('/api/groups/'))  return withCors(await userGroupUpdateHandler(request, env, path.slice('/api/groups/'.length)), request);
      if (method === 'DELETE' && path.startsWith('/api/groups/'))  return withCors(await userGroupDeleteHandler(request, env, path.slice('/api/groups/'.length)), request);
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
        if (method === 'GET'    && path === '/admin/pages')               return withCors(await handleListPages(request, env, null), request);
        if (method === 'GET'    && path.startsWith('/admin/pages/') && path !== '/admin/pages/')  return withCors(await handleGetPage(env, decodeURIComponent(path.slice('/admin/pages/'.length)), env.ADMIN_USERNAME, true), request);
        if (method === 'POST'   && path === '/admin/pages')               return withCors(await handleCreatePage(request, env, env.ADMIN_USERNAME ?? 'admin'), request);
        if (method === 'POST'   && path === '/admin/pages/import')        return withCors(await adminPageImportHandler(request, env), request);
        if (method === 'PATCH'  && path === '/admin/pages/reorder')      return withCors(await handleReorderPages(request, env, env.ADMIN_USERNAME ?? 'admin', true), request);
        if (method === 'PATCH'  && path.startsWith('/admin/pages/'))      return withCors(await handleUpdatePage(request, env, decodeURIComponent(path.slice('/admin/pages/'.length)), env.ADMIN_USERNAME, true), request);
        if (method === 'DELETE' && path.startsWith('/admin/pages/')) {
          const target = decodeURIComponent(path.slice('/admin/pages/'.length));
          const res = await handleDeletePage(env, target, env.ADMIN_USERNAME, true);
          ctx.waitUntil(logAudit(env.STATS, { action: 'page.delete', actor: 'admin', target, status: res.status < 400 ? 'ok' : 'fail', ip: clientIp(request) }));
          return withCors(res, request);
        }
        // Admin projects
        if (method === 'GET'    && path === '/admin/projects')           return withCors(await handleListProjects(request, env, null, true), request);
        if (method === 'POST'   && path === '/admin/projects')          return withCors(await handleCreateProject(request, env, env.ADMIN_USERNAME ?? 'admin', true), request);
        if (method === 'PATCH'  && path === '/admin/projects/reorder')  return withCors(await handleReorderProjects(request, env, null, true), request);
        if (method === 'PATCH'  && path.startsWith('/admin/projects/')) return withCors(await handleUpdateProject(request, env, decodeURIComponent(path.slice('/admin/projects/'.length)), env.ADMIN_USERNAME ?? 'admin', true), request);
        if (method === 'DELETE' && path.startsWith('/admin/projects/')) return withCors(await handleDeleteProject(env, decodeURIComponent(path.slice('/admin/projects/'.length)), env.ADMIN_USERNAME ?? 'admin', true), request);
        // Admin groups
        if (method === 'GET'    && path === '/admin/groups')             return withCors(await handleListGroups(request, env, null, true), request);
        if (method === 'POST'   && path === '/admin/groups')             return withCors(await handleCreateGroup(request, env, env.ADMIN_USERNAME ?? 'admin', true), request);
        if (method === 'PATCH'  && path === '/admin/groups/reorder')     return withCors(await handleReorderGroups(request, env, null, true), request);
        if (method === 'PATCH'  && path.startsWith('/admin/groups/'))    return withCors(await handleUpdateGroup(request, env, decodeURIComponent(path.slice('/admin/groups/'.length)), env.ADMIN_USERNAME ?? 'admin', true), request);
        if (method === 'DELETE' && path.startsWith('/admin/groups/'))    return withCors(await handleDeleteGroup(env, decodeURIComponent(path.slice('/admin/groups/'.length)), env.ADMIN_USERNAME ?? 'admin', true), request);

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
      if (method === 'GET'    && path.startsWith('/static/'))  return serveStaticAsset(env, path.slice('/static/'.length));
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
async function userPageGet(request, env, slug) {
  const [user, err] = await requireUser(request, env);
  if (err) return err;
  return handleGetPage(env, slug, user.username, false);
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
async function userPageReorderHandler(request, env) {
  const [user, err] = await requireUser(request, env);
  if (err) return err;
  return handleReorderPages(request, env, user.username, false);
}
async function userPageImportHandler(request, env) {
  const [user, err] = await requireUser(request, env);
  if (err) return err;
  return handleImportPage(request, env, user.username);
}
async function adminPageImportHandler(request, env) {
  return handleImportPage(request, env, env.ADMIN_USERNAME ?? 'admin');
}

// ── User project/group helpers ──────────────────────────────────────────────

async function userProjectListHandler(request, env) {
  const [user, err] = await requireUser(request, env);
  if (err) return err;
  return handleListProjects(request, env, user.username, false);
}
async function userProjectCreateHandler(request, env) {
  const [user, err] = await requireUser(request, env);
  if (err) return err;
  return handleCreateProject(request, env, user.username, false);
}
async function userProjectUpdateHandler(request, env, id) {
  const [user, err] = await requireUser(request, env);
  if (err) return err;
  return handleUpdateProject(request, env, decodeURIComponent(id), user.username, false);
}
async function userProjectDeleteHandler(request, env, id) {
  const [user, err] = await requireUser(request, env);
  if (err) return err;
  return handleDeleteProject(env, decodeURIComponent(id), user.username, false);
}
async function userProjectReorderHandler(request, env) {
  const [user, err] = await requireUser(request, env);
  if (err) return err;
  return handleReorderProjects(request, env, user.username, false);
}
async function userGroupListHandler(request, env) {
  const [user, err] = await requireUser(request, env);
  if (err) return err;
  return handleListGroups(request, env, user.username, false);
}
async function userGroupCreateHandler(request, env) {
  const [user, err] = await requireUser(request, env);
  if (err) return err;
  return handleCreateGroup(request, env, user.username, false);
}
async function userGroupUpdateHandler(request, env, id) {
  const [user, err] = await requireUser(request, env);
  if (err) return err;
  return handleUpdateGroup(request, env, decodeURIComponent(id), user.username, false);
}
async function userGroupDeleteHandler(request, env, id) {
  const [user, err] = await requireUser(request, env);
  if (err) return err;
  return handleDeleteGroup(env, decodeURIComponent(id), user.username, false);
}
async function userGroupReorderHandler(request, env) {
  const [user, err] = await requireUser(request, env);
  if (err) return err;
  return handleReorderGroups(request, env, user.username, false);
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

// ── Static asset hosting (/static/*) ──────────────────────────────────────────
// ByteMD bundle files stored in R2 under _static/ prefix.

async function serveStaticAsset(env, name) {
  const obj = await env.BUCKET.get('_static/' + name);
  if (!obj) return new Response('Not Found', { status: 404 });
  const ext = name.split('.').pop();
  const ct = { js: 'application/javascript', css: 'text/css' }[ext] ?? 'application/octet-stream';
  return new Response(obj.body, {
    headers: { 'Content-Type': ct, 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
}

// ── Script file hosting (/scripts/*) ─────────────────────────────────────────
// Files are embedded inline so the private repo doesn't block downloads.

function serveStaticScript(env, name, contentType) {
  const content = name === 'onimg-cli.py' ? ONIMG_CLI_PY : TYPORA_UPLOAD_SH;
  return new Response(content, {
    headers: { 'Content-Type': contentType + '; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

// ── Install script (/install.sh) ─────────────────────────────────────────────

function serveInstallScript(url) {
  const o = url.origin;
  const lines = [
    '#!/usr/bin/env bash',
    '# Onimg CLI 安装脚本',
    '# 用法: curl -fsSL ' + o + '/install.sh | bash',
    '',
    'set -euo pipefail',
    '',
    'ONIMG_URL=' + JSON.stringify(o),
    'INSTALL_DIR="${ONIMG_INSTALL_DIR:-$HOME/.local/bin}"',
    'CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/onimg"',
    '',
    'if [[ -t 1 ]]; then',
    "  GRN='\\033[92m'; YLW='\\033[93m'; CYN='\\033[96m'",
    "  RED='\\033[91m'; DIM='\\033[2m';  RST='\\033[0m'; BOLD='\\033[1m'",
    'else',
    "  GRN=''; YLW=''; CYN=''; RED=''; DIM=''; RST=''; BOLD=''",
    'fi',
    'ok()  { echo -e "  ${GRN}✓${RST}  $*"; }',
    'inf() { echo -e "  ${CYN}ℹ${RST}  $*"; }',
    'err() { echo -e "  ${RED}✗${RST}  $*" >&2; }',
    'hdr() { echo -e "\\n${BOLD}$*${RST}"; }',
    '',
    'while [[ $# -gt 0 ]]; do',
    '  case "$1" in',
    '    --url) ONIMG_URL="$2"; shift 2 ;;',
    '    --dir) INSTALL_DIR="$2"; shift 2 ;;',
    '    *) shift ;;',
    '  esac',
    'done',
    '',
    'hdr "Onimg CLI 安装程序"',
    'echo ""',
    'for cmd in python3 curl; do',
    '  command -v "$cmd" &>/dev/null || { err "缺少依赖：$cmd"; exit 1; }',
    'done',
    'ok "依赖检查通过 (python3 + curl)"',
    '',
    'hdr "下载文件"',
    'mkdir -p "$INSTALL_DIR"',
    '',
    'curl -fsSL ' + JSON.stringify(o + '/scripts/onimg-cli.py') + ' -o "$INSTALL_DIR/onimg-cli.py"',
    'chmod +x "$INSTALL_DIR/onimg-cli.py"',
    'ok "onimg-cli.py"',
    '',
    'curl -fsSL ' + JSON.stringify(o + '/scripts/typora-upload.sh') + ' -o "$INSTALL_DIR/onimg-upload"',
    'chmod +x "$INSTALL_DIR/onimg-upload"',
    'ok "onimg-upload  (Typora 上传脚本)"',
    '',
    "cat > \"$INSTALL_DIR/onimg\" <<'WRAPPER'",
    '#!/usr/bin/env bash',
    'exec python3 "$HOME/.local/bin/onimg-cli.py" "$@"',
    'WRAPPER',
    'chmod +x "$INSTALL_DIR/onimg"',
    'ok "onimg          (CLI 管理工具)"',
    '',
    'hdr "写入配置"',
    'mkdir -p "$CONFIG_DIR"',
    'chmod 700 "$CONFIG_DIR"',
    'cat > "$CONFIG_DIR/config" <<CFG',
    'ONIMG_URL=${ONIMG_URL}',
    'CFG',
    'ok "~/.config/onimg/config"',
    '',
    'if ! echo "$PATH" | tr \':\' \'\\n\' | grep -qxF "$INSTALL_DIR"; then',
    '  echo ""',
    '  inf "${YLW}${INSTALL_DIR} 不在 PATH，请添加到 ~/.zshrc:${RST}"',
    '  echo -e "    ${DIM}export PATH=\\"\\$HOME/.local/bin:\\$PATH\\"${RST}"',
    'fi',
    '',
    'hdr "Typora 配置"',
    'echo -e "  偏好设置 → 图像 → Custom Command:\\n"',
    'echo -e "    ${CYN}${INSTALL_DIR}/onimg-upload${RST}\\n"',
    '',
    'echo -e "${GRN}${BOLD}安装完成！${RST}"',
    'echo -e "  首次使用: ${CYN}onimg${RST}  → 选 [2] 登录 → 浏览器授权"',
    'echo ""',
  ];
  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

// ── Device auth page (/auth/device) ──────────────────────────────────────────

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

// onimg-cli.py — embedded inline (Python, no ${} conflicts)
const ONIMG_CLI_PY = `\
#!/usr/bin/env python3
"""Onimg CLI 管理工具 — 无外部依赖"""

import os, sys, json, base64, time, socket, threading, mimetypes, webbrowser
import urllib.request, urllib.parse, urllib.error, http.server, shutil

# ── 路径 ──────────────────────────────────────────────────────────────────────

_cfg_dir   = os.path.join(os.environ.get('XDG_CONFIG_HOME',
                           os.path.expanduser('~/.config')), 'onimg')
CONFIG_FILE = os.path.join(_cfg_dir, 'config')
TOKEN_FILE  = os.path.join(_cfg_dir, 'token')

# ── ANSI ──────────────────────────────────────────────────────────────────────

_tty = sys.stdout.isatty()

def _c(*codes): return f'\\033[{";".join(str(c) for c in codes)}m' if _tty else ''

RST  = _c(0);  BOLD = _c(1);  DIM  = _c(2)
GRN  = _c(32); YLW  = _c(33); RED  = _c(31)
CYN  = _c(36); MAG  = _c(35); WHT  = _c(97)
BGRN = _c(92); BYLW = _c(93); BRED = _c(91); BCYN = _c(96)

def clr():
    if _tty:
        print('\\033[2J\\033[H', end='', flush=True)
    else:
        print('\\n' + '─' * (W + 2))

# ── Config ────────────────────────────────────────────────────────────────────

def load_cfg():
    cfg = {'ONIMG_URL': 'https://img.diswant.space'}
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE) as f:
            for ln in f:
                ln = ln.strip()
                if '=' in ln and not ln.startswith('#'):
                    k, v = ln.split('=', 1)
                    cfg[k.strip()] = v.strip().strip("'\\"")
    # 环境变量优先级最高
    for key in ('ONIMG_URL',):
        if key in os.environ:
            cfg[key] = os.environ[key]
    return cfg

def save_cfg(cfg: dict):
    os.makedirs(_cfg_dir, mode=0o700, exist_ok=True)
    with open(CONFIG_FILE, 'w') as f:
        for k, v in cfg.items():
            f.write(f'{k}={v}\\n')

# ── Token ─────────────────────────────────────────────────────────────────────

def load_tok():
    return open(TOKEN_FILE).read().strip() if os.path.exists(TOKEN_FILE) else None

def save_tok(tok: str):
    os.makedirs(_cfg_dir, mode=0o700, exist_ok=True)
    with open(TOKEN_FILE, 'w') as f: f.write(tok)
    os.chmod(TOKEN_FILE, 0o600)

def del_tok():
    if os.path.exists(TOKEN_FILE): os.remove(TOKEN_FILE)

def parse_tok(tok):
    """→ (username, exp_ms, is_admin) or (None, 0, False)"""
    try:
        seg = tok.split('.')[0]
        seg += '=' * (-len(seg) % 4)
        p = json.loads(base64.b64decode(seg))
        return p.get('username'), p.get('exp', 0), bool(p.get('isAdmin'))
    except Exception:
        return None, 0, False

def tok_info(tok):
    if not tok:
        return {'ok': False}
    username, exp_ms, is_admin = parse_tok(tok)
    if not username:
        return {'ok': False}
    remaining = exp_ms / 1000 - time.time()
    return {
        'ok': remaining > 0,
        'username': username,
        'is_admin': is_admin,
        'remaining': remaining,
        'exp_ms': exp_ms,
    }

# ── HTTP ──────────────────────────────────────────────────────────────────────

def api(url, method='GET', data=None, token=None, content_type='application/json',
        binary_path=None):
    """→ (status_code, response_body_dict | None)"""
    try:
        if binary_path:
            with open(binary_path, 'rb') as f:
                body = f.read()
        elif data is not None:
            body = json.dumps(data).encode()
        else:
            body = None

        req = urllib.request.Request(url, data=body, method=method)
        req.add_header('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        if token:
            req.add_header('Authorization', f'Bearer {token}')
        if body:
            req.add_header('Content-Type', content_type)

        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, None
    except Exception as e:
        return 0, {'error': str(e)}

# ── Browser login ─────────────────────────────────────────────────────────────

def _free_port() -> int:
    s = socket.socket(); s.bind(('', 0)); p = s.getsockname()[1]; s.close(); return p

def browser_login(base_url):
    port = _free_port()
    cb   = f'http://localhost:{port}/cb'
    result = {'token': None}
    srv = None

    class H(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            tok = params.get('token', [''])[0]
            ok_html = ('<html><body style="font-family:system-ui;text-align:center;'
                       'padding:60px;background:#0a0a0a;color:#f5f5f5">'
                       '<h2 style="color:#34d399">授权成功</h2>'
                       '<p style="color:#b5b5b5">可以关闭此窗口，返回终端继续操作。</p>'
                       '</body></html>').encode()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(ok_html)))
            self.end_headers()
            self.wfile.write(ok_html)
            if tok:
                result['token'] = tok
                threading.Thread(target=srv.shutdown, daemon=True).start()
        def log_message(self, *_): pass

    srv = http.server.HTTPServer(('localhost', port), H)

    auth_url = f"{base_url.rstrip('/')}/auth/device?callback={urllib.parse.quote(cb, safe='')}"
    print(f'\\n  {DIM}正在打开浏览器…{RST}')
    print(f'  {DIM}如未自动打开，请访问：{RST}')
    print(f'  {CYN}{auth_url}{RST}\\n')
    webbrowser.open(auth_url)

    print(f'  {YLW}等待授权（最多 120 秒）…{RST}', end='', flush=True)
    t = threading.Thread(target=srv.serve_forever)
    t.daemon = True
    t.start()

    deadline = time.time() + 120
    while not result['token'] and time.time() < deadline:
        time.sleep(0.5)
        print('.', end='', flush=True)

    srv.shutdown()
    print()
    return result['token']

# ── 格式化 ────────────────────────────────────────────────────────────────────

def fmt_dur(secs: float) -> str:
    if secs <= 0: return f'{RED}已过期{RST}'
    d = int(secs // 86400)
    h = int((secs % 86400) // 3600)
    m = int((secs % 3600) // 60)
    if d: return f'{d} 天 {h} 小时后过期'
    if h: return f'{h} 小时 {m} 分钟后过期'
    return f'{m} 分钟后过期'

def fmt_size(b: int) -> str:
    if b < 1024: return f'{b} B'
    if b < 1024**2: return f'{b/1024:.1f} KB'
    return f'{b/1024**2:.1f} MB'

def fmt_time(ms: int) -> str:
    import datetime
    return datetime.datetime.fromtimestamp(ms / 1000).strftime('%m-%d %H:%M')

# ── 界面组件 ──────────────────────────────────────────────────────────────────

W = 52  # 框宽

def box_top(title=''):
    inner = f'  {BOLD}{title}{RST}  ' if title else ''
    pad = W - 2 - len(title) - (4 if title else 0)
    if title:
        return f'┌── {BOLD}{title}{RST} {"─" * max(pad, 0)}┐'
    return '┌' + '─' * W + '┐'

def box_row(left, right='', w=W):
    raw_left  = _strip_ansi(left)
    raw_right = _strip_ansi(right)
    gap = w - len(raw_left) - len(raw_right)
    return f'│ {left}{" " * max(gap - 2, 0)}{right} │'

def box_sep():  return '├' + '─' * W + '┤'
def box_bot():  return '└' + '─' * W + '┘'
def box_blank(): return f'│{" " * W}  │'

import re
def _strip_ansi(s): return re.sub(r'\\033\\[[0-9;]*m', '', s)

def header(cfg, tok_i, quota):
    url = cfg.get('ONIMG_URL', '?')
    print(box_top('Onimg  CLI'))

    # 服务器
    srv_display = url.replace('https://','').replace('http://','')
    print(box_row(f'  {DIM}服务器{RST}  {CYN}{srv_display}{RST}'))

    # 登录状态
    if tok_i.get('ok'):
        uname = tok_i['username']
        role  = f'{MAG}Admin{RST}' if tok_i['is_admin'] else f'{DIM}用户{RST}'
        print(box_row(f'  {DIM}账  号{RST}  {BGRN}● {BOLD}{uname}{RST}  {role}'))
        print(box_row(f'  {DIM}有效期{RST}  {fmt_dur(tok_i["remaining"])}'))
    else:
        print(box_row(f'  {DIM}账  号{RST}  {BRED}○ 未登录{RST}'))

    # 配额
    if quota:
        daily = quota.get('daily', 0)
        total = quota.get('total', 0)
        # 从 token 读不到配额上限，只展示使用量
        print(box_row(f'  {DIM}配  额{RST}  今日 {BCYN}{daily}{RST} 次 · 累计 {BCYN}{total}{RST} 次'))

    print(box_bot())

def menu(items):
    print()
    for key, label in items:
        k_str = f'{BOLD}{YLW}[{key}]{RST}'
        print(f'  {k_str}  {label}')
    print()

def prompt(text='选择') -> str:
    try:
        return input(f'  {BOLD}▶ {RST}{text}: ').strip()
    except (EOFError, KeyboardInterrupt):
        return 'q'

def msg_ok(text):  print(f'\\n  {BGRN}✓{RST}  {text}')
def msg_err(text): print(f'\\n  {BRED}✗{RST}  {text}')
def msg_inf(text): print(f'\\n  {CYN}ℹ{RST}  {text}')
def pause():       input(f'\\n  {DIM}按 Enter 返回…{RST}')

# ── 动作 ──────────────────────────────────────────────────────────────────────

def do_login(cfg):
    tok = browser_login(cfg['ONIMG_URL'])
    if tok:
        save_tok(tok)
        info = tok_info(tok)
        msg_ok('已登录为 %s%s%s' % (BOLD, info.get('username','?'), RST))
    else:
        msg_err('授权超时或取消')

def do_logout():
    del_tok()
    msg_ok('已退出登录，Token 已清除')

def do_upload(cfg, tok):
    if not tok:
        msg_err('请先登录'); return
    path = prompt('图片路径（可拖入文件）').strip().strip("'\\"")
    if not path or not os.path.isfile(path):
        msg_err('文件不存在'); return

    mime, _ = mimetypes.guess_type(path)
    if not mime: mime = 'application/octet-stream'
    url = '%s/upload' % cfg['ONIMG_URL'].rstrip('/')
    print('\\n  %s上传中…%s' % (DIM, RST), end='', flush=True)
    status, resp = api(url, method='POST', token=tok,
                       content_type=mime, binary_path=path)
    print()
    if status == 201 and resp and 'url' in resp:
        img_url = resp['url']
        size    = fmt_size(resp.get('size', 0))
        msg_ok('上传成功  (%s)' % size)
        print('\\n  %sURL:%s' % (BOLD, RST))
        print('  %s%s%s' % (BCYN, img_url, RST))
        print('\\n  %sMarkdown:%s' % (DIM, RST))
        print('  %s![](%s)%s' % (DIM, img_url, RST))
    elif status == 401:
        msg_err('Token 已失效，请重新登录')
    else:
        msg_err('上传失败 (%s)：%s' % (status, resp))

def do_recent(cfg, tok):
    if not tok:
        msg_err('请先登录'); return
    url = '%s/list' % cfg['ONIMG_URL'].rstrip('/')
    status, resp = api(url, token=tok)
    if status != 200 or not resp:
        msg_err('获取失败 (%s)' % status); return
    items = resp.get('items', [])
    if not items:
        msg_inf('暂无上传记录'); return

    print('\\n  %s最近上传%s  %s(共 %d 条)%s\\n' % (BOLD, RST, DIM, len(items), RST))
    w_key = min(max(len(it['key']) for it in items), 44)
    print('  %s%-*s  %8s  %-14s  公开%s' % (DIM, w_key, '文件名', '大小', '时间', RST))
    print('  ' + '─' * (w_key + 36))
    for it in items[:20]:
        key  = it['key'][:w_key]
        size = fmt_size(it.get('size', 0))
        ts   = fmt_time(it.get('uploadedAt', 0))
        pub  = '%s公开%s' % (BGRN, RST) if it.get('isPublic') else '%s私有%s' % (DIM, RST)
        print('  %-*s  %8s  %-14s  %s' % (w_key, key, size, ts, pub))
    if resp.get('truncated'):
        print('\\n  %s（仅展示前 20 条）%s' % (DIM, RST))

def do_change_url(cfg):
    current = cfg.get('ONIMG_URL', '')
    print('\\n  %s当前地址：%s%s' % (DIM, current, RST))
    new_url = prompt('新地址（留空取消）')
    if not new_url:
        msg_inf('已取消'); return
    if not new_url.startswith('http'):
        new_url = 'https://' + new_url
    cfg['ONIMG_URL'] = new_url.rstrip('/')
    save_cfg(cfg)
    msg_ok('已更新为 %s' % new_url)
    msg_inf('建议删除旧 token 后重新登录：rm ' + TOKEN_FILE)

def do_help(cfg):
    install_dir = os.path.expanduser('~/.local/bin')
    url = cfg.get('ONIMG_URL', 'https://img.diswant.space')
    host = url.replace('https://','').replace('http://','')
    print('\\n  %s使用说明%s\\n' % (BOLD, RST))

    print('  %s── 快速开始%s' % (BOLD, RST))
    print('  %s[2]%s 登录        → 浏览器打开授权页，输入账号密码' % (YLW, RST))
    print('  %s[4]%s 上传图片    → 输入路径或拖入文件，返回 URL' % (YLW, RST))
    print('  %s[5]%s 上传记录    → 查看历史文件、大小、时间' % (YLW, RST))
    print('  %s[1]%s 状态详情    → 账号、配额、Token 到期时间' % (YLW, RST))
    print('  %s[6]%s 换服务地址  → 切换不同 Onimg 实例' % (YLW, RST))

    print()
    print('  %s── Typora 自动上传%s' % (BOLD, RST))
    print('  偏好设置 → 图像 → Custom Command:')
    print('  %s%s/onimg-upload%s' % (BCYN, install_dir, RST))
    print('  %s粘贴或拖入图片 → Typora 自动调用脚本 → 图片链接自动替换%s' % (DIM, RST))

    print()
    print('  %s── Token 管理%s' % (BOLD, RST))
    print('  有效期: 默认 %s7 天%s（Admin → 用户管理 可调整至 1–365 天）' % (CYN, RST))
    print('  过期后: 下次上传时 %s自动重新授权%s（无需手动操作）' % (DIM, RST))
    print('  手动退出: %s[3] 退出登录%s  或  %srm %s%s' % (YLW, RST, DIM, TOKEN_FILE, RST))

    print()
    print('  %s── 文件路径%s' % (BOLD, RST))
    print('  配置   %s%s%s' % (DIM, CONFIG_FILE, RST))
    print('  Token  %s%s%s' % (DIM, TOKEN_FILE, RST))
    print('  上传   %s%s/onimg-upload%s' % (DIM, install_dir, RST))
    print('  CLI    %s%s/onimg%s' % (DIM, install_dir, RST))

    print()
    print('  %s── 管理后台%s' % (BOLD, RST))
    print('  %s%s/admin%s' % (CYN, url, RST))
    print('  %s用户管理 / 配额设置 / 图库管理 / 系统配置%s' % (DIM, RST))

def do_status_detail(cfg, tok, quota):
    info = tok_info(tok)
    print('\\n  %s详细状态%s\\n' % (BOLD, RST))
    print('  服务器    %s%s%s' % (CYN, cfg.get('ONIMG_URL','?'), RST))
    if info.get('ok'):
        uname = info['username']
        role  = 'Admin' if info['is_admin'] else '普通用户'
        print('  账  号    %s%s%s  (%s)' % (BGRN, uname, RST, role))
        exp_str = time.strftime('%Y-%m-%d %H:%M', time.localtime(info['exp_ms'] / 1000))
        print('  过期时间  %s  (%s)' % (exp_str, fmt_dur(info['remaining'])))
    else:
        print('  账  号    %s未登录%s' % (BRED, RST))
    if quota:
        print('  配  额    今日 %d 次 · 累计 %d 次' % (quota.get('daily',0), quota.get('total',0)))
    print('  Token 路径  %s%s%s' % (DIM, TOKEN_FILE, RST))
    print('  配置路径    %s%s%s' % (DIM, CONFIG_FILE, RST))

# ── 主循环 ────────────────────────────────────────────────────────────────────

def main():
    while True:
        cfg   = load_cfg()
        tok   = load_tok()
        t_inf = tok_info(tok)
        quota = None

        # 拉配额（仅登录状态下，快速超时避免卡界面）
        if t_inf.get('ok'):
            try:
                url = f"{cfg['ONIMG_URL'].rstrip('/')}/auth/quota"
                st, q = api(url, token=tok)
                if st == 200 and q: quota = q
            except Exception:
                pass

        clr()
        print()
        header(cfg, t_inf, quota)

        # 未登录时在菜单上方显示首屏提示
        if not t_inf.get('ok'):
            print('  %s提示: 选 [2] 登录 → 浏览器授权 → 开始使用%s' % (YLW, RST))
            print()

        menu([
            ('1', '刷新状态'),
            ('2', '登录 / 重新授权  (浏览器)'),
            ('3', '退出登录'),
            ('4', '测试上传'),
            ('5', '最近上传记录'),
            ('6', '修改服务地址'),
            ('?', '使用说明'),
            ('q', '%s退出%s' % (DIM, RST)),
        ])

        ch = prompt()

        if ch == '1':
            do_status_detail(cfg, tok, quota)
            pause()
        elif ch == '2':
            do_login(cfg)
            pause()
        elif ch == '3':
            do_logout()
            pause()
        elif ch == '4':
            do_upload(cfg, tok)
            pause()
        elif ch == '5':
            do_recent(cfg, tok)
            pause()
        elif ch == '6':
            do_change_url(cfg)
            pause()
        elif ch == '?':
            do_help(cfg)
            pause()
        elif ch in ('q', 'Q', '0'):
            clr()
            print('\\n  %s再见。%s\\n' % (DIM, RST))
            sys.exit(0)
        else:
            msg_err('无效输入')
            time.sleep(0.8)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        clr()
        print(f'\\n  {DIM}已退出。{RST}\\n')
        sys.exit(0)
`;

// typora-upload.sh — embedded inline
const TYPORA_UPLOAD_SH = `\
#!/usr/bin/env bash
# Typora custom uploader for Onimg — browser-based device auth
#
# First run: opens browser to log in; token cached for 7 days.
# No credentials stored locally.
#
# Setup:
#   1. chmod +x scripts/typora-upload.sh
#   2. Set ONIMG_URL (env var or ~/.config/onimg/config):
#        ONIMG_URL=https://img.diswant.space
#   3. In Typora → Preferences → Image → Upload Service → Custom Command:
#        /path/to/scripts/typora-upload.sh

set -uo pipefail

CONFIG_DIR="${'$'}{XDG_CONFIG_HOME:-$HOME/.config}/onimg"
CONFIG_FILE="$CONFIG_DIR/config"
TOKEN_FILE="$CONFIG_DIR/token"

[[ -f "$CONFIG_FILE" ]] && source "$CONFIG_FILE"  # shellcheck source=/dev/null

ONIMG_URL="${'$'}{ONIMG_URL:-https://img.diswant.space}"
ONIMG_URL="${'$'}{ONIMG_URL%/}"

mkdir -p "$CONFIG_DIR"
chmod 700 "$CONFIG_DIR"

# ── Helpers ──────────────────────────────────────────────────────────────────

json_get() {
  python3 -c "import json,sys; print(json.loads(sys.argv[1])[sys.argv[2]])" "$1" "$2"
}

mime_type() {
  python3 -c "
import mimetypes, sys
t, _ = mimetypes.guess_type(sys.argv[1])
print(t or 'application/octet-stream')
" "$1"
}

url_encode() {
  python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$1"
}

# ── Browser device auth flow ──────────────────────────────────────────────────

browser_login() {
  # Pick a free port
  local port
  port=$(python3 -c "
import socket
s = socket.socket()
s.bind(('', 0))
print(s.getsockname()[1])
s.close()
")

  local token_file
  token_file=$(mktemp)
  local cb="http://localhost:${'$'}{port}/cb"

  # Start a one-shot local callback server
  python3 - "$token_file" "$port" <<'PYEOF' &
import http.server, urllib.parse, sys, threading

token_file, port = sys.argv[1], int(sys.argv[2])
server = None

class H(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/cb'):
            params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            token = params.get('token', [''])[0]
            body = ('<html><body style="font-family:system-ui;text-align:center;padding:60px;background:#0a0a0a;color:#f5f5f5">'
                    '<h2 style="color:#34d399">授权成功</h2><p style="color:#b5b5b5">可以关闭此窗口，返回继续操作。</p>'
                    '</body></html>').encode()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            if token:
                open(token_file, 'w').write(token)
                threading.Thread(target=server.shutdown, daemon=True).start()
        else:
            self.send_response(404); self.end_headers()
    def log_message(self, *a): pass

server = http.server.HTTPServer(('localhost', port), H)
server.serve_forever()
PYEOF

  local server_pid=$!

  local auth_url="${'$'}{ONIMG_URL}/auth/device?callback=$(url_encode "$cb")"
  echo "正在打开浏览器授权... 如未自动打开，请访问：" >&2
  echo "  $auth_url" >&2

  # Open browser (macOS)
  open "$auth_url" 2>/dev/null || true

  # Wait for token (up to 120 s)
  local waited=0
  while [[ ! -s "$token_file" && $waited -lt 120 ]]; do
    sleep 1
    (( waited++ )) || true
  done

  kill "$server_pid" 2>/dev/null || true
  wait "$server_pid" 2>/dev/null || true

  if [[ ! -s "$token_file" ]]; then
    rm -f "$token_file"
    echo "ERROR: 登录超时（120 秒内未完成授权）" >&2
    return 1
  fi

  local token
  token=$(cat "$token_file")
  rm -f "$token_file"
  echo "$token"
}

# ── Token management ──────────────────────────────────────────────────────────

get_token() {
  if [[ -f "$TOKEN_FILE" ]]; then
    local tok exp
    tok=$(cat "$TOKEN_FILE")
    # Check JWT expiry (field 0 = header, 1 = payload)
    exp=$(python3 -c "
import base64, json, sys, time
try:
    # Token format: base64(payload).hmac_sig  (2 parts, exp in ms)
    seg = sys.argv[1].split('.')[0]
    seg += '=' * (-len(seg) % 4)
    payload = json.loads(base64.b64decode(seg))
    exp_ms = payload.get('exp', 0)
    print('ok' if exp_ms / 1000 - 60 > time.time() else 'expired')
except Exception:
    print('expired')
" "$tok" 2>/dev/null || echo 'expired')
    if [[ "$exp" == "ok" ]]; then
      echo "$tok"
      return
    fi
  fi

  echo "token 已过期或不存在，需要重新登录" >&2
  local tok
  tok=$(browser_login) || return 1
  printf '%s' "$tok" > "$TOKEN_FILE"
  chmod 600 "$TOKEN_FILE"
  echo "$tok"
}

# ── Upload ────────────────────────────────────────────────────────────────────

upload_one() {
  local path="$1" token="$2"
  local mime http_code resp tmp
  mime=$(mime_type "$path")
  tmp=$(mktemp)

  http_code=$(curl -sf -o "$tmp" -w "%{http_code}" -X POST "$ONIMG_URL/upload" \\
    -H "Authorization: Bearer $token" \\
    -H "Content-Type: $mime" \\
    --data-binary "@$path") || http_code="000"

  resp=$(cat "$tmp"); rm -f "$tmp"

  if [[ "$http_code" == "401" ]]; then
    return 2  # signal: token rejected, re-auth needed
  fi

  if [[ "$http_code" == "000" ]]; then
    echo "ERROR: 网络错误，上传失败: $path" >&2
    return 1
  fi

  if [[ "$http_code" != "201" ]]; then
    echo "ERROR: 上传失败 ($http_code): $path — $resp" >&2
    return 1
  fi

  json_get "$resp" "url"
}

# ── Main ──────────────────────────────────────────────────────────────────────

if [[ $# -eq 0 ]]; then
  echo "Usage: $(basename "$0") image-path [image-path ...]" >&2
  exit 1
fi

TOKEN=$(get_token) || exit 1

urls=()
for img in "$@"; do
  url=$(upload_one "$img" "$TOKEN") && {
    urls+=("$url")
    continue
  }
  exit_code=$?

  if [[ $exit_code -eq 2 ]]; then
    # Token rejected by server — clear cache and re-auth once
    rm -f "$TOKEN_FILE"
    echo "token 被服务端拒绝，重新登录..." >&2
    TOKEN=$(browser_login) || exit 1
    printf '%s' "$TOKEN" > "$TOKEN_FILE"
    chmod 600 "$TOKEN_FILE"
    url=$(upload_one "$img" "$TOKEN") || exit 1
    urls+=("$url")
  else
    exit 1
  fi
done

echo "Upload Success:"
for u in "${'$'}{urls[@]}"; do
  echo "$u"
done
`;
