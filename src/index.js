import { handleUpload } from './upload.js';
import { handleGet } from './get.js';
import { handleDelete } from './delete.js';
import { handleList, handlePublicGallery, handleToggleVisibility } from './list.js';
import { renderPage } from './page.js';
import { renderAdminPage } from './admin-page.js';
import { handleAdminLogin, verifyAdminToken } from './admin/auth.js';
import { handleAdminStats, handleAllImageStats, handleImageStats, handleR2DetailedStats, handleMemberStats, handleAllPageStats, handlePageStats } from './admin/stats.js';
import { handleListUsers, handleCreateUser, handleUpdateUser, handleDeleteUser } from './admin/users.js';
import { handleGetConfig, handleUpdateConfig } from './admin/config-handler.js';
import { handleUserLogin, verifyUserToken, getUserQuotaInfo } from './user-auth.js';
import { servePage } from './pages/handler.js';
import { listPages, handleListPages, handleCreatePage, handleUpdatePage, handleDeletePage } from './pages/manage.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { method } = request;
    const path = url.pathname;

    // ── 根域名重定向 ──────────────────────────────────────────────────────────
    if (url.hostname === 'diswant.space') {
      return Response.redirect('https://ping.diswant.space' + path + url.search, 301);
    }

    if (method === 'OPTIONS') return corsResponse(request);

    try {
      // ── Public page hosting ──────────────────────────────────────────────────
      if (method === 'GET' && path.startsWith('/p/')) {
        const slug = decodeURIComponent(path.slice(3));
        return await servePage(env, slug, ctx, request);
      }

      // ── User auth ────────────────────────────────────────────────────────────
      if (method === 'POST' && path === '/auth/login') return withCors(await handleUserLogin(request, env), request);
      if (method === 'GET'  && path === '/auth/quota') {
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
      // User pages
      if (method === 'GET'    && path === '/api/pages')            return withCors(await userPagesHandler(request, env), request);
      if (method === 'POST'   && path === '/api/pages')            return withCors(await userPageCreate(request, env), request);
      if (method === 'PATCH'  && path.startsWith('/api/pages/'))   return withCors(await userPageUpdate(request, env, path.slice('/api/pages/'.length)), request);
      if (method === 'DELETE' && path.startsWith('/api/pages/'))   return withCors(await userPageDelete(request, env, path.slice('/api/pages/'.length)), request);

      // ── Admin panel ──────────────────────────────────────────────────────────
      if (path === '/admin' || path === '/admin/') return addSecurityHeaders(new Response(renderAdminPage(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
      if (method === 'POST' && path === '/admin/login') return withCors(await handleAdminLogin(request, env), request);

      if (path.startsWith('/admin/')) {
        if (!await verifyAdminToken(request, env)) return withCors(Response.json({ error: 'Unauthorized' }, { status: 401 }), request);

        if (method === 'GET'  && path === '/admin/stats')           return withCors(await handleAdminStats(env), request);
        if (method === 'GET'  && path === '/admin/all-image-stats') return withCors(await handleAllImageStats(env), request);
        if (method === 'GET'  && path.startsWith('/admin/image-stats/')) {
          return withCors(await handleImageStats(env, decodeURIComponent(path.slice('/admin/image-stats/'.length))), request);
        }
        if (method === 'GET'    && path === '/admin/users')               return withCors(await handleListUsers(env), request);
        if (method === 'POST'   && path === '/admin/users')               return withCors(await handleCreateUser(request, env), request);
        if (method === 'PATCH'  && path.startsWith('/admin/users/'))      return withCors(await handleUpdateUser(request, env, decodeURIComponent(path.slice('/admin/users/'.length))), request);
        if (method === 'DELETE' && path.startsWith('/admin/users/'))      return withCors(await handleDeleteUser(env, decodeURIComponent(path.slice('/admin/users/'.length))), request);
        if (method === 'GET'    && path === '/admin/config')              return withCors(await handleGetConfig(env), request);
        if (method === 'POST'   && path === '/admin/config')              return withCors(await handleUpdateConfig(request, env), request);
        if (method === 'GET'    && path === '/admin/r2-stats')            return withCors(await handleR2DetailedStats(env), request);
        if (method === 'GET'    && path === '/admin/member-stats')        return withCors(await handleMemberStats(env), request);
        if (method === 'GET'    && path === '/admin/all-page-stats')      return withCors(await handleAllPageStats(env), request);
        if (method === 'GET'    && path.startsWith('/admin/page-stats/')) return withCors(await handlePageStats(env, decodeURIComponent(path.slice('/admin/page-stats/'.length))), request);
        // Admin pages
        if (method === 'GET'    && path === '/admin/pages')               return withCors(Response.json({ pages: await listPages(env, null) }), request);
        if (method === 'POST'   && path === '/admin/pages')               return withCors(await handleCreatePage(request, env, env.ADMIN_USERNAME ?? 'admin'), request);
        if (method === 'PATCH'  && path.startsWith('/admin/pages/'))      return withCors(await handleUpdatePage(request, env, decodeURIComponent(path.slice('/admin/pages/'.length)), env.ADMIN_USERNAME, true), request);
        if (method === 'DELETE' && path.startsWith('/admin/pages/'))      return withCors(await handleDeletePage(env, decodeURIComponent(path.slice('/admin/pages/'.length)), env.ADMIN_USERNAME, true), request);

        return withCors(new Response('Not Found', { status: 404 }), request);
      }

      // ── Core image routes ────────────────────────────────────────────────────
      if (method === 'POST'   && path === '/upload')           return withCors(await handleUpload(request, env), request);
      if (method === 'DELETE' && path.startsWith('/delete/'))  return withCors(await handleDelete(request, env, path.slice(8)), request);
      if (method === 'GET'    && path === '/list')             return withCors(await handleList(request, env), request);
      if (method === 'GET'    && path === '/')                 return addSecurityHeaders(new Response(renderPage(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
      if (method === 'GET'    && path.startsWith('/'))         return withCors(await handleGet(env, ctx, path.slice(1), request), request);

      return withCors(new Response('Not Found', { status: 404 }), request);
    } catch (err) {
      return withCors(Response.json({ error: err.message }, { status: 500 }), request);
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
    "default-src 'self'; img-src 'self' blob: data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'",
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
