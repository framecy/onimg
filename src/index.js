import { handleUpload } from './upload.js';
import { handleGet } from './get.js';
import { handleDelete } from './delete.js';
import { handleList, handlePublicGallery, handleToggleVisibility } from './list.js';
import { renderPage } from './page.js';
import { renderAdminPage } from './admin-page.js';
import { handleAdminLogin, verifyAdminToken, timingSafeEqual } from './admin/auth.js';
import { handleAdminStats, handleAllImageStats, handleImageStats, handleR2DetailedStats, handleMemberStats, handleAllPageStats, handlePageStats, handleAllProtoStats, handleProtoStats, handleCfQuota } from './admin/stats.js';
import { cfBump, cfDay } from './admin/cfCounters.js';
import { handleListUsers, handleCreateUser, handleUpdateUser, handleDeleteUser } from './admin/users.js';
import { handleGetConfig, handleUpdateConfig } from './admin/config-handler.js';
import { handleUserLogin, verifyUserToken, getUserQuotaInfo, getUser, putUser, hashPassword, randomSalt } from './user-auth.js';
import { servePage } from './pages/handler.js';
import { listPages, handleListPages, handleCreatePage, handleUpdatePage, handleDeletePage } from './pages/manage.js';
import { handleProtoUpload, handleProtoUploadInit, handleProtoFileBatch, handleProtoFinalize } from './proto/upload.js';
import { serveProto } from './proto/serve.js';
import { listProtos, deleteProto, updateProtoMeta, deleteProtoVersion } from './proto/manage.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { method } = request;
    const path = url.pathname;

    if (method === 'OPTIONS') return corsResponse();

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
      if (method === 'POST'  && path === '/auth/login')           return withCors(await handleUserLogin(request, env));
      if (method === 'PATCH' && path === '/auth/password')        return withCors(await handleChangePassword(request, env));
      if (method === 'GET'   && path === '/auth/quota') {
        const user = await verifyUserToken(request, env);
        if (!user) return withCors(Response.json({ error: 'Unauthorized' }, { status: 401 }));
        return withCors(Response.json(await getUserQuotaInfo(env, user.username)));
      }

      // ── User API ─────────────────────────────────────────────────────────────
      if (method === 'GET'    && path === '/api/gallery')          return withCors(await handlePublicGallery(env));
      if (method === 'PATCH'  && path.startsWith('/api/image/') && path.endsWith('/visibility')) {
        const key = decodeURIComponent(path.slice('/api/image/'.length, -'/visibility'.length));
        return withCors(await handleToggleVisibility(request, env, key));
      }
      // User pages
      if (method === 'GET'    && path === '/api/pages')            return withCors(await userPagesHandler(request, env));
      if (method === 'POST'   && path === '/api/pages')            return withCors(await userPageCreate(request, env));
      if (method === 'PATCH'  && path.startsWith('/api/pages/'))   return withCors(await userPageUpdate(request, env, path.slice('/api/pages/'.length)));
      if (method === 'DELETE' && path.startsWith('/api/pages/'))   return withCors(await userPageDelete(request, env, path.slice('/api/pages/'.length)));
      // User prototypes
      if (method === 'POST'   && path === '/upload/proto')              return withCors(await protoUploadHandler(request, env));
      if (method === 'POST'   && path === '/upload/proto/init')         return withCors(await protoUploadInitHandler(request, env));
      if (method === 'POST'   && path === '/upload/proto/files')        return withCors(await protoFileBatchHandler(request, env));
      if (method === 'POST'   && path === '/upload/proto/finalize')     return withCors(await protoFinalizeHandler(request, env));
      if (method === 'GET'    && path === '/api/protos')                return withCors(await protoListHandler(request, env));
      if (method === 'DELETE' && path.startsWith('/api/protos/'))       return withCors(await protoDeleteHandler(request, env, path.slice('/api/protos/'.length)));
      if (method === 'PATCH'  && path.startsWith('/api/protos/'))       return withCors(await protoUpdateMetaHandler(request, env, path.slice('/api/protos/'.length)));
      // User proto version files (for diff viewer)
      if (method === 'GET'    && path.startsWith('/api/proto-vfiles/')) return withCors(await protoVfilesHandler(request, env, path.slice('/api/proto-vfiles/'.length)));
      // User proto version delete
      if (method === 'DELETE' && path.startsWith('/api/proto-versions/')) return withCors(await protoVersionDeleteHandler(request, env, path.slice('/api/proto-versions/'.length)));

      // ── Admin panel ──────────────────────────────────────────────────────────
      if (path === '/admin' || path === '/admin/') return new Response(renderAdminPage(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      if (method === 'POST' && path === '/admin/login') return withCors(await handleAdminLogin(request, env));

      if (path.startsWith('/admin/')) {
        if (!await verifyAdminToken(request, env)) return withCors(Response.json({ error: 'Unauthorized' }, { status: 401 }));

        if (method === 'GET'  && path === '/admin/cf-quota')         return withCors(await handleCfQuota(env));
        if (method === 'GET'  && path === '/admin/stats')           return withCors(await handleAdminStats(env));
        if (method === 'GET'  && path === '/admin/all-image-stats') return withCors(await handleAllImageStats(env));
        if (method === 'GET'  && path.startsWith('/admin/image-stats/')) {
          return withCors(await handleImageStats(env, decodeURIComponent(path.slice('/admin/image-stats/'.length))));
        }
        if (method === 'GET'    && path === '/admin/users')               return withCors(await handleListUsers(env));
        if (method === 'POST'   && path === '/admin/users')               return withCors(await handleCreateUser(request, env));
        if (method === 'PATCH'  && path.startsWith('/admin/users/'))      return withCors(await handleUpdateUser(request, env, decodeURIComponent(path.slice('/admin/users/'.length))));
        if (method === 'DELETE' && path.startsWith('/admin/users/'))      return withCors(await handleDeleteUser(env, decodeURIComponent(path.slice('/admin/users/'.length))));
        if (method === 'GET'    && path === '/admin/config')              return withCors(await handleGetConfig(env));
        if (method === 'POST'   && path === '/admin/config')              return withCors(await handleUpdateConfig(request, env));
        if (method === 'GET'    && path === '/admin/r2-stats')            return withCors(await handleR2DetailedStats(env));
        if (method === 'GET'    && path === '/admin/member-stats')        return withCors(await handleMemberStats(env));
        if (method === 'GET'    && path === '/admin/all-page-stats')       return withCors(await handleAllPageStats(env));
        if (method === 'GET'    && path.startsWith('/admin/page-stats/'))  return withCors(await handlePageStats(env, decodeURIComponent(path.slice('/admin/page-stats/'.length))));
        // DELETE /admin/proto-versions/{protoId}/v{n}
        if (method === 'DELETE' && path.startsWith('/admin/proto-versions/')) {
          const rest       = decodeURIComponent(path.slice('/admin/proto-versions/'.length));
          const lastSlash  = rest.lastIndexOf('/v');
          const protoId    = rest.slice(0, lastSlash);
          const versionNum = rest.slice(lastSlash + 2); // strip '/v'
          return withCors(await deleteProtoVersion(env, protoId, versionNum, null, true));
        }
        if (method === 'GET'    && path === '/admin/all-proto-stats')      return withCors(await handleAllProtoStats(env));
        if (method === 'GET'    && path.startsWith('/admin/proto-stats/')) return withCors(await handleProtoStats(env, decodeURIComponent(path.slice('/admin/proto-stats/'.length))));
        if (method === 'GET'    && path.startsWith('/admin/proto-vfiles/')) {
          // /admin/proto-vfiles/{protoId}/v{n}  — last segment is the version token "v{n}"
          const rest = decodeURIComponent(path.slice('/admin/proto-vfiles/'.length));
          const lastSlash = rest.lastIndexOf('/');
          const protoId   = rest.slice(0, lastSlash);
          const verToken  = rest.slice(lastSlash + 1);          // e.g. "v3"
          const files = await env.STATS.get(`proto:vfiles:${protoId}:${verToken}`, 'json');
          return withCors(Response.json({ files: files ?? null, version: verToken }));
        }
        // Admin prototype upload (chunked — same endpoints, admin token used as auth)
        if (method === 'POST'   && path === '/admin/proto/init')           return withCors(await handleProtoUploadInit(request, env, env.ADMIN_USERNAME ?? 'admin'));
        if (method === 'POST'   && path === '/admin/proto/files')          return withCors(await handleProtoFileBatch(request, env, env.ADMIN_USERNAME ?? 'admin'));
        if (method === 'POST'   && path === '/admin/proto/finalize')       return withCors(await handleProtoFinalize(request, env, env.ADMIN_USERNAME ?? 'admin'));
        // Admin prototypes
        if (method === 'GET'    && path === '/admin/protos')               return withCors(Response.json({ protos: await listProtos(env, null, true) }));
        if (method === 'DELETE' && path.startsWith('/admin/protos/'))      return withCors(await deleteProto(env, decodeURIComponent(path.slice('/admin/protos/'.length)), null, true));
        if (method === 'PATCH'  && path.startsWith('/admin/protos/'))      return withCors(await updateProtoMeta(env, decodeURIComponent(path.slice('/admin/protos/'.length)), null, true, await request.json()));
        // Admin pages
        if (method === 'GET'    && path === '/admin/pages')               return withCors(Response.json({ pages: await listPages(env, null) }));
        if (method === 'POST'   && path === '/admin/pages')               return withCors(await handleCreatePage(request, env, env.ADMIN_USERNAME ?? 'admin'));
        if (method === 'PATCH'  && path.startsWith('/admin/pages/'))      return withCors(await handleUpdatePage(request, env, decodeURIComponent(path.slice('/admin/pages/'.length)), env.ADMIN_USERNAME, true));
        if (method === 'DELETE' && path.startsWith('/admin/pages/'))      return withCors(await handleDeletePage(env, decodeURIComponent(path.slice('/admin/pages/'.length)), env.ADMIN_USERNAME, true));

        return withCors(new Response('Not Found', { status: 404 }));
      }

      // ── Core image routes ────────────────────────────────────────────────────
      if (method === 'POST'   && path === '/upload')           return withCors(await handleUpload(request, env, ctx));
      if (method === 'DELETE' && path.startsWith('/delete/'))  return withCors(await handleDelete(request, env, path.slice(8), ctx));
      if (method === 'GET'    && path === '/list')             return withCors(await handleList(request, env));
      if (method === 'GET'    && path === '/')                 return new Response(renderPage(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      if (method === 'GET'    && path.startsWith('/'))         return withCors(await handleGet(env, ctx, path.slice(1), request));

      return withCors(new Response('Not Found', { status: 404 }));
    } catch (err) {
      return withCors(Response.json({ error: err.message }, { status: 500 }));
    }
  }
};

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
  for (const k of statsList.keys) statsMap[k.name.slice(9)] = k.metadata?.count ?? 0;
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

// ── CORS helpers ─────────────────────────────────────────────────────────────

function corsResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
function withCors(response) {
  const res = new Response(response.body, response);
  res.headers.set('Access-Control-Allow-Origin', '*');
  return res;
}
