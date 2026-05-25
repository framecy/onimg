import { MIME_MAP } from './upload.js';
import { cfBump, cfMonth } from '../admin/cfCounters.js';

function parseCookies(header) {
  const out = {};
  for (const part of (header || '').split(';')) {
    const eq = part.indexOf('=');
    if (eq < 1) continue;
    out[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return out;
}

function cookieName(protoId) {
  return 'onimg_proto_' + protoId.replace(/[^a-zA-Z0-9]/g, '_');
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function servePasswordPrompt(protoId, title, wrong) {
  const t = esc(title || protoId);
  return new Response(`<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${t}</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#e0e0e0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
  .card{background:#111;border:1px solid #1e1e1e;border-radius:20px;padding:40px 36px;width:100%;max-width:380px}
  .icon{font-size:2.2rem;margin-bottom:16px;line-height:1}
  h1{font-size:1.1rem;font-weight:600;margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .sub{font-size:.82rem;color:#555;margin-bottom:28px}
  .err{color:#ef4444;font-size:.82rem;margin-bottom:12px}
  input{width:100%;padding:12px 14px;background:#0a0a0a;border:1px solid #222;border-radius:10px;color:#e0e0e0;font-size:1.1rem;letter-spacing:.25em;text-align:center;outline:none;transition:border .15s;margin-bottom:14px;font-family:monospace}
  input:focus{border-color:#3b82f6}
  button{width:100%;padding:12px;background:#3b82f6;color:#fff;border:none;border-radius:10px;font-size:.95rem;font-weight:600;cursor:pointer;transition:background .15s}
  button:hover{background:#2563eb}
  .footer{margin-top:24px;text-align:center;font-size:.72rem;color:#333}
  .footer a{color:#444;text-decoration:none}
</style>
</head>
<body>
<div class="card">
  <div class="icon">🔒</div>
  <h1>${t}</h1>
  <div class="sub">此原型已加密，请输入访问密码</div>
  ${wrong ? '<div class="err">密码错误，请重试</div>' : ''}
  <form action="/proto/${protoId}/" method="get">
    <input type="password" name="pwd" placeholder="• • • • • •" maxlength="6" autocomplete="off" autofocus>
    <button type="submit">验证访问</button>
  </form>
  <div class="footer">Powered by <a href="/">Onimg</a></div>
</div>
</body>
</html>`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    status: wrong ? 401 : 403,
  });
}

export async function serveProto(env, protoId, filePath, request) {
  if (!protoId) return new Response('Not Found', { status: 404 });

  // Load metadata
  const meta = await env.STATS.get(`proto:${protoId}`, 'json');
  if (!meta) return new Response('Prototype Not Found', { status: 404 });

  // ── Private check ─────────────────────────────────────────────────────────
  if (meta.isPrivate === true) {
    return new Response('This prototype is private', { status: 403 });
  }

  // ── Password protection ────────────────────────────────────────────────────
  // If password has expired, skip password check (treat as public)
  const pwdExpired = meta.accessPassword && meta.passwordExpiry && Date.now() > meta.passwordExpiry;
  if (meta.accessPassword && !pwdExpired) {
    const url     = new URL(request.url);
    const urlPwd  = url.searchParams.get('pwd');
    const cookies = parseCookies(request.headers.get('Cookie') || '');
    const cname   = cookieName(protoId);

    if (urlPwd !== null) {
      // Password submitted via query string
      if (urlPwd !== meta.accessPassword) {
        return servePasswordPrompt(protoId, meta.title, true);
      }
      // Correct — set cookie and redirect to entry
      const dest = `/proto/${protoId}/`;
      return new Response(null, {
        status: 302,
        headers: {
          Location: dest,
          'Set-Cookie': `${cname}=${encodeURIComponent(meta.accessPassword)}; Path=/proto/${protoId}/; Max-Age=${7 * 86400}; SameSite=Lax`,
        },
      });
    }

    const authed = cookies[cname] === meta.accessPassword;
    if (!authed) {
      let fp = filePath; try { fp = decodeURIComponent(filePath); } catch {}
      const ext = fp.split('.').pop()?.toLowerCase() ?? '';
      const isHtml = !fp || ext === 'html' || ext === 'htm';
      if (isHtml) return servePasswordPrompt(protoId, meta.title, false);
      // Asset request without auth → 403
      return new Response('Forbidden', { status: 403 });
    }
  }

  // ── Resolve file path ──────────────────────────────────────────────────────
  // Empty path → redirect to entry point
  if (!filePath || filePath === '/') {
    return Response.redirect(
      new URL(`/proto/${protoId}/${meta.entryPoint}`, request.url).href,
      302
    );
  }

  // Decode percent-encoded path (browsers encode non-ASCII chars in URLs,
  // but R2 keys are stored with the raw UTF-8 filenames from the ZIP)
  let decodedPath = filePath;
  try { decodedPath = decodeURIComponent(filePath); } catch {}

  // Fetch from R2
  const r2Key = `proto/${protoId}/${decodedPath}`;
  const obj   = await env.BUCKET.get(r2Key);
  if (!obj) return new Response('Not Found', { status: 404 });

  const ext  = decodedPath.split('.').pop()?.toLowerCase() ?? '';
  const ct   = MIME_MAP[ext] ?? obj.httpMetadata?.contentType ?? 'application/octet-stream';
  const isHtml = ext === 'html' || ext === 'htm';

  // ── Track access (HTML requests only, fire-and-forget) ─────────────────────
  if (isHtml) {
    const statsKey = 'prstats:' + protoId;
    const country  = request.cf?.country ?? 'XX';
    const ip       = request.headers.get('CF-Connecting-IP') ?? '';
    const now      = Date.now();
    // Non-blocking: don't await
    (async () => {
      try {
        const existing = await env.STATS.getWithMetadata(statsKey, 'json');
        const count    = (existing?.metadata?.count ?? 0) + 1;
        const accesses = Array.isArray(existing?.value) ? existing.value : [];
        accesses.unshift({ ts: now, country, ip });
        if (accesses.length > 200) accesses.length = 200;
        await env.STATS.put(statsKey, JSON.stringify(accesses), {
          metadata: { count, lastAccess: now },
        });
        // R2 Class B 追踪：附带在同一个 async 块，不额外消耗 KV 写入配额
        await cfBump(env.STATS, 'cf:r2b:' + cfMonth(), 1, true);
      } catch {}
    })();
  }

  const headers = new Headers({
    'Content-Type': ct,
    'Cache-Control': isHtml ? 'no-cache' : 'public, max-age=31536000',
  });

  // Inject prototype title into HTML files (AxureRP exports default to "Untitled Document")
  if (isHtml && meta.title) {
    const safeTitle = meta.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    let html = await obj.text();
    if (/<title>/i.test(html)) {
      html = html.replace(/<title>[^<]*<\/title>/i, `<title>${safeTitle}</title>`);
    } else {
      html = html.replace(/<head>/i, `<head><title>${safeTitle}</title>`);
    }
    return new Response(html, { headers });
  }

  return new Response(obj.body, { headers });
}
