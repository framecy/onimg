import { renderMarkdown, extractHeadings } from './markdown.js';

export async function servePage(env, slug, ctx, request) {
  const page = await env.STATS.get('page:' + slug, 'json');
  if (!page) return new Response('Page Not Found', { status: 404, headers: { 'Cache-Control': 'no-store' } });

  if (!page.isPublic) {
    if (!page.accessPassword) return new Response('This page is private', { status: 403 });
    const url = new URL(request.url);
    const urlPwd = url.searchParams.get('pwd');
    const cookies = parseCookies(request.headers.get('Cookie') || '');
    const cookieName = 'onimg_p_' + slug.replace(/[^a-zA-Z0-9]/g, '_');
    if (urlPwd !== null) {
      if (urlPwd !== page.accessPassword) return servePasswordPrompt(slug, page, true);
      const cleanUrl = url.origin + url.pathname;
      return new Response(null, {
        status: 302,
        headers: {
          Location: cleanUrl,
          'Set-Cookie': `${cookieName}=${encodeURIComponent(page.accessPassword)}; Path=/; Max-Age=${7 * 86400}; SameSite=Lax`,
        },
      });
    }
    if (cookies[cookieName] !== page.accessPassword) return servePasswordPrompt(slug, page, false);
  }

  if (ctx && request) ctx.waitUntil(recordPageAccess(env, slug, request));

  // Auto-detect HTML if type is ambiguous or content starts with a doctype/html tag
  const isHtml = page.type === 'html' ||
    (page.type !== 'markdown' && /^\s*(<\s*!DOCTYPE\s+html|<\s*html[\s>])/i.test(page.content));

  if (isHtml) {
    return serveHtmlPage(page);
  }

  const body = renderMarkdown(page.content);
  const headings = extractHeadings(page.content);
  return new Response(renderMdPage(page, body, headings), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate' },
  });
}

// ── HTML page ─────────────────────────────────────────────────────────────

function renderMdPage(page, body, headings) {
  const hasToc = headings.length >= 2;
  const minLevel = hasToc ? Math.min(...headings.map(h => h.level)) : 1;

  const tocItems = hasToc ? headings.map(h => {
    const indent = h.level - minLevel;
    return `        <a href="#${h.id}" class="toc-a toc-l${indent}">${esc(h.text)}</a>`;
  }).join('\n') : '';

  const tocSidebar = hasToc ? `
  <aside class="toc-sidebar" aria-label="目录">
    <div class="toc-inner">
      <div class="toc-hd">目录</div>
      <nav class="toc-nav">
${tocItems}
      </nav>
    </div>
  </aside>` : '';

  return `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(page.title || page.slug)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    font-family: 'Outfit', system-ui, -apple-system, sans-serif;
    margin: 0;
    color: #1c1c1c;
    background:
      radial-gradient(ellipse 90% 50% at 50% -10%, rgba(0,0,0,.035), transparent 55%),
      #f4f4f2;
    line-height: 1.8;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  .page-layout {
    display: flex;
    max-width: 1600px;
    margin: 0 auto;
    padding: 0 32px;
    gap: 48px;
    align-items: flex-start;
    justify-content: center;
  }
  /* 无目录时内容区水平居中 */
  .page-layout.no-toc { justify-content: center; }
  .page-layout.no-toc .prose { margin-left: auto; margin-right: auto; }

  .prose {
    flex: 0 1 1280px;
    width: 100%;
    min-width: 720px;
    max-width: 1280px;
    margin: 40px 0 80px;
    padding: 52px 56px 64px;
    background: #fffefb;
    border: 1px solid rgba(0,0,0,.06);
    border-radius: 18px;
    box-shadow:
      0 1px 0 rgba(255,255,255,.8) inset,
      0 18px 50px rgba(0,0,0,.05),
      0 2px 8px rgba(0,0,0,.03);
  }
  .prose > :first-child { margin-top: 0; }

  h1,h2,h3,h4,h5,h6 {
    font-weight: 700; line-height: 1.28; scroll-margin-top: 28px;
    letter-spacing: -.025em; color: #111;
  }
  h1 { font-size: 2.15rem; margin: 0 0 .55em; padding-bottom: .45em; border-bottom: 1px solid #eceae4; }
  h2 { font-size: 1.45rem; margin: 2.1em 0 .55em; padding-bottom: .35em; border-bottom: 1px solid #f0eee8; }
  h3 { font-size: 1.15rem; margin: 1.7em 0 .45em; }
  h4 { font-size: 1.02rem; margin: 1.4em 0 .4em; color: #2a2a2a; }
  p  { margin: 1em 0; color: #2e2e2e; }
  a  {
    color: #171717;
    text-decoration: underline;
    text-decoration-color: #d4d0c8;
    text-underline-offset: 3px;
    text-decoration-thickness: 1px;
    transition: text-decoration-color .15s;
  }
  a:hover { text-decoration-color: #171717; }
  strong { color: #111; font-weight: 700; }
  em { color: #3a3a3a; }

  code {
    background: #f3f1eb;
    padding: 2px 6px;
    border-radius: 5px;
    font-size: .86em;
    font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
    color: #2a2a2a;
    border: 1px solid rgba(0,0,0,.04);
  }
  pre {
    background: #161616;
    color: #ececec;
    padding: 20px 22px;
    border-radius: 12px;
    overflow-x: auto;
    margin: 1.5em 0;
    border: 1px solid #222;
    box-shadow: 0 8px 24px rgba(0,0,0,.12);
  }
  pre code { background: none; padding: 0; border: none; color: inherit; font-size: .88em; }

  blockquote {
    border-left: 3px solid #d8d4cc;
    margin: 1.4em 0;
    padding: .7em 1.1em;
    color: #5a5a5a;
    background: #f7f5f0;
    border-radius: 0 10px 10px 0;
  }
  blockquote p { color: inherit; margin: .4em 0; }
  hr { border: none; border-top: 1px solid #ebe8e1; margin: 2.4em 0; }
  img {
    max-width: 100%;
    border-radius: 12px;
    margin: 1.2em 0;
    box-shadow: 0 8px 28px rgba(0,0,0,.06);
  }
  ul, ol { padding-left: 1.35em; margin: 1em 0; color: #2e2e2e; }
  li { margin: .4em 0; padding-left: .15em; }
  li::marker { color: #a8a49c; }

  table {
    border-collapse: separate; border-spacing: 0;
    width: 100%; margin: 1.5em 0;
    border: 1px solid #ebe8e1; border-radius: 12px; overflow: hidden;
    font-size: .94em;
  }
  th, td { border-bottom: 1px solid #f0eee8; padding: 11px 16px; text-align: left; }
  th { background: #f7f5f0; font-weight: 600; color: #3a3a3a; font-size: .88em; letter-spacing: .01em; }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: #fcfbf8; }

  .meta {
    font-size: .8rem; color: #9a968e; margin: -.4em 0 2em;
    font-weight: 500; letter-spacing: .02em;
  }
  .footer {
    margin-top: 3.5em; padding-top: 1.5em;
    border-top: 1px solid #ebe8e1;
    font-size: .76rem; color: #9a968e; text-align: center; letter-spacing: .02em;
  }
  .footer a { color: #6e6a62; text-decoration: none; }
  .footer a:hover { color: #171717; }

  .toc-sidebar {
    width: 200px; flex-shrink: 0;
    padding: 56px 0 80px;
    position: sticky; top: 0;
    align-self: flex-start;
    max-height: 100vh;
  }
  .toc-inner { max-height: calc(100vh - 80px); overflow-y: auto; padding-right: 4px; }
  .toc-inner::-webkit-scrollbar { width: 3px; }
  .toc-inner::-webkit-scrollbar-thumb { background: #ddd9d0; border-radius: 2px; }
  .toc-hd {
    font-size: .6rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: .14em; color: #a8a49c; margin-bottom: 12px; padding-left: 12px;
  }
  .toc-nav { display: flex; flex-direction: column; gap: 2px; border-left: 1px solid #e6e2d9; }
  .toc-a {
    display: block; font-size: .76rem; line-height: 1.5; color: #7a766e;
    text-decoration: none; padding: 5px 12px; border-radius: 0 8px 8px 0;
    border-left: 2px solid transparent; margin-left: -1px;
    transition: color .12s, background .12s, border-color .12s;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .toc-l0 { padding-left: 12px; }
  .toc-l1 { padding-left: 22px; font-size: .74rem; }
  .toc-l2 { padding-left: 32px; font-size: .72rem; }
  .toc-l3 { padding-left: 40px; font-size: .72rem; }
  .toc-l4 { padding-left: 48px; font-size: .72rem; }
  .toc-a:hover  { color: #2a2a2a; background: rgba(0,0,0,.03); }
  .toc-a.active { color: #111; border-left-color: #1a1a1a; background: rgba(0,0,0,.045); font-weight: 600; }

  @media (max-width: 1020px) {
    .toc-sidebar { display: none; }
    .page-layout { padding: 0 20px; justify-content: center; max-width: 1280px; }
    .prose { min-width: 0; max-width: 1280px; }
  }
  @media (max-width: 760px) {
    .prose { min-width: 0; }
  }
  @media (max-width: 640px) {
    body { line-height: 1.75; }
    .page-layout { padding: 0 12px; }
    .prose { margin: 16px 0 40px; padding: 28px 20px 40px; border-radius: 14px; min-width: 0; max-width: 100%; }
    h1 { font-size: 1.7rem; }
    h2 { font-size: 1.25rem; }
  }
</style>
</head>
<body>
<div class="page-layout${hasToc ? '' : ' no-toc'}">
  <article class="prose">
${body}
<div class="footer">Powered by <a href="/">Onimg</a>${page.owner ? ' · @' + esc(page.owner) : ''}</div>
  </article>${tocSidebar}
</div>
<script>
(function() {
  var tocLinks = document.querySelectorAll('.toc-nav a');
  if (!tocLinks.length) return;
  var headings = Array.from(document.querySelectorAll('article h1[id],article h2[id],article h3[id],article h4[id],article h5[id],article h6[id]'));

  // Click: smooth scroll
  tocLinks.forEach(function(a) {
    a.addEventListener('click', function(e) {
      e.preventDefault();
      var target = document.getElementById(a.getAttribute('href').slice(1));
      if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); history.pushState(null, '', a.getAttribute('href')); }
    });
  });

  // Scroll: highlight active section.
  // Near the bottom of the page the last heading may never scroll past the 80px
  // threshold (too little content below it), so we widen the net when atBottom.
  function update() {
    var atBottom = window.scrollY + window.innerHeight >= document.body.scrollHeight - 60;
    var threshold = atBottom ? window.innerHeight : 80;
    var active = null;
    for (var i = headings.length - 1; i >= 0; i--) {
      if (headings[i].getBoundingClientRect().top <= threshold) { active = headings[i]; break; }
    }
    tocLinks.forEach(function(a) {
      a.classList.toggle('active', !!active && a.getAttribute('href') === '#' + active.id);
    });
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();
</script>
</body>
</html>`;
}

// ── HTML page ─────────────────────────────────────────────────────────────────

function serveHtmlPage(page) {
  // HTML pages are served as-is — no injected TOC sidebar
  return new Response(page.content, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate' },
  });
}

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function parseCookies(header) {
  const out = {};
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 1) continue;
    out[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return out;
}

function servePasswordPrompt(slug, page, wrong) {
  const title = esc(page.title || slug);
  return new Response(`<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Outfit',system-ui,-apple-system,sans-serif;background:#121212;color:#f7f7f7;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;-webkit-font-smoothing:antialiased}
  .card{background:#222;border:1px solid #333;border-radius:16px;padding:40px 36px;width:100%;max-width:380px;box-shadow:0 24px 60px rgba(0,0,0,.85)}
  .icon{font-size:2.2rem;margin-bottom:16px;line-height:1}
  h1{font-size:1.1rem;font-weight:700;margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:-.02em}
  .sub{font-size:.82rem;color:#9a9a9a;margin-bottom:28px}
  .err{color:#f87171;font-size:.82rem;margin-bottom:12px}
  input{width:100%;padding:12px 14px;background:#1a1a1a;border:1px solid #333;border-radius:8px;color:#f7f7f7;font-size:1.1rem;letter-spacing:.25em;text-align:center;outline:none;transition:border .15s,box-shadow .15s;margin-bottom:14px;font-family:'JetBrains Mono',monospace}
  input:focus{border-color:#7a7a7a;box-shadow:0 0 0 3px rgba(255,255,255,.10)}
  button{width:100%;padding:12px;background:#f0f0f0;color:#121212;border:none;border-radius:8px;font-size:.95rem;font-weight:700;cursor:pointer;transition:background .15s,transform .15s;font-family:inherit}
  button:hover{background:#fff;transform:translateY(-1px)}
  .footer{margin-top:24px;text-align:center;font-size:.72rem;color:#9a9a9a}
  .footer a{color:#c2c2c2;text-decoration:none}
  .footer a:hover{color:#f7f7f7}
</style>
</head>
<body>
<div class="card">
  <div class="icon">🔒</div>
  <h1>${title}</h1>
  <div class="sub">此页面已加密，请输入 6 位访问密码</div>
  ${wrong ? '<div class="err">密码错误，请重试</div>' : ''}
  <form action="/p/${slug}" method="get">
    <input type="password" name="pwd" placeholder="• • • • • •" maxlength="6" autocomplete="off" autofocus>
    <button type="submit">验证访问</button>
  </form>
  <div class="footer">Powered by <a href="/">Onimg</a></div>
</div>
</body>
</html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }, status: wrong ? 401 : 403 });
}

async function recordPageAccess(env, slug, request) {
  if (!env.STATS) return;
  const cf = request.cf ?? {};
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const statsKey = 'pstats:' + slug;
  const existing = await env.STATS.getWithMetadata(statsKey, 'json');
  const accesses = existing?.value ?? [];
  const count = (existing?.metadata?.count ?? 0) + 1;
  accesses.unshift({
    ip,
    country: cf.country ?? '—',
    city: cf.city ?? '—',
    region: cf.region ?? '—',
    org: cf.asOrganization ?? '—',
    ts: Date.now(),
  });
  if (accesses.length > 200) accesses.length = 200;
  await env.STATS.put(statsKey, JSON.stringify(accesses), {
    metadata: { count, lastAccess: Date.now() },
  });
}
