import { handleUpload } from './upload.js';
import { handleGet } from './get.js';
import { handleDelete } from './delete.js';
import { handleList, handlePublicGallery, handleToggleVisibility } from './list.js';
import { renderPage } from './page.js';
import { renderAdminPage } from './admin-page.js';
import { handleAdminLogin, verifyAdminToken } from './admin/auth.js';
import { handleAdminStats, handleAllImageStats, handleImageStats, handleR2DetailedStats, handleMemberStats } from './admin/stats.js';
import { handleListUsers, handleCreateUser, handleUpdateUser, handleDeleteUser } from './admin/users.js';
import { handleGetConfig, handleUpdateConfig } from './admin/config-handler.js';
import { handleUserLogin, verifyUserToken, getUserQuotaInfo } from './user-auth.js';
import { servePage } from './pages/handler.js';
import { handleListPages, handleCreatePage, handleUpdatePage, handleDeletePage } from './pages/manage.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { method } = request;
    const path = url.pathname;

    if (method === 'OPTIONS') return corsResponse();

    try {
      // ── Public page hosting ──────────────────────────────────────────────────
      if (method === 'GET' && path.startsWith('/p/')) {
        const slug = decodeURIComponent(path.slice(3));
        return await servePage(env, slug);
      }

      // ── User auth ────────────────────────────────────────────────────────────
      if (method === 'POST' && path === '/auth/login') return withCors(await handleUserLogin(request, env));
      if (method === 'GET'  && path === '/auth/quota') {
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

      // ── Admin panel ──────────────────────────────────────────────────────────
      if (path === '/admin' || path === '/admin/') return new Response(renderAdminPage(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      if (method === 'POST' && path === '/admin/login') return withCors(await handleAdminLogin(request, env));

      if (path.startsWith('/admin/')) {
        if (!await verifyAdminToken(request, env)) return withCors(Response.json({ error: 'Unauthorized' }, { status: 401 }));

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
        // Admin pages
        if (method === 'GET'    && path === '/admin/pages')               return withCors(Response.json({ pages: await import('./pages/manage.js').then(m => m.listPages(env, null)) }));
        if (method === 'POST'   && path === '/admin/pages')               return withCors(await handleCreatePage(request, env, env.ADMIN_USERNAME ?? 'admin'));
        if (method === 'PATCH'  && path.startsWith('/admin/pages/'))      return withCors(await handleUpdatePage(request, env, decodeURIComponent(path.slice('/admin/pages/'.length)), env.ADMIN_USERNAME, true));
        if (method === 'DELETE' && path.startsWith('/admin/pages/'))      return withCors(await handleDeletePage(env, decodeURIComponent(path.slice('/admin/pages/'.length)), env.ADMIN_USERNAME, true));

        return withCors(new Response('Not Found', { status: 404 }));
      }

      // ── Core image routes ────────────────────────────────────────────────────
      if (method === 'POST'   && path === '/upload')           return withCors(await handleUpload(request, env));
      if (method === 'DELETE' && path.startsWith('/delete/'))  return withCors(await handleDelete(request, env, path.slice(8)));
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
