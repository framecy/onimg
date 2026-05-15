import { renderMarkdown, extractHeadings } from './markdown.js';

export async function servePage(env, slug, ctx, request) {
  const page = await env.STATS.get('page:' + slug, 'json');
  if (!page) return new Response('Page Not Found', { status: 404 });
  if (!page.isPublic) return new Response('This page is private', { status: 403 });

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
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// ── Markdown page ─────────────────────────────────────────────────────────────

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
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body { font-family: -apple-system, system-ui, sans-serif; margin: 0; color: #1a1a1a; background: #fff; line-height: 1.75; }

  .page-layout { display: flex; max-width: 1080px; margin: 0 auto; padding: 0 24px; }

  /* ── Prose ── */
  .prose { flex: 1; min-width: 0; padding: 44px 0 80px; }
  h1,h2,h3,h4,h5,h6 { font-weight: 700; margin: 1.6em 0 .5em; line-height: 1.3; scroll-margin-top: 20px; }
  h1 { font-size: 2rem;   border-bottom: 2px solid #eee; padding-bottom: .4em; }
  h2 { font-size: 1.5rem; border-bottom: 1px solid #eee; padding-bottom: .3em; }
  p  { margin: .9em 0; }
  a  { color: #2563eb; text-decoration: none; }
  a:hover { text-decoration: underline; }
  code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: .88em; font-family: 'SF Mono', Consolas, monospace; }
  pre  { background: #1e1e1e; color: #d4d4d4; padding: 18px 20px; border-radius: 10px; overflow-x: auto; margin: 1.2em 0; }
  pre code { background: none; padding: 0; color: inherit; font-size: .9em; }
  blockquote { border-left: 4px solid #d1d5db; margin: 1em 0; padding: .5em 1em; color: #6b7280; background: #f9fafb; border-radius: 0 6px 6px 0; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 2em 0; }
  img { max-width: 100%; border-radius: 8px; }
  ul, ol { padding-left: 1.6em; margin: .8em 0; }
  li { margin: .3em 0; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid #e5e7eb; padding: 8px 14px; text-align: left; }
  th { background: #f9fafb; font-weight: 600; }
  .meta   { font-size: .82rem; color: #9ca3af; margin-top: -1em; margin-bottom: 2em; }
  .footer { margin-top: 4em; padding-top: 1.5em; border-top: 1px solid #e5e7eb; font-size: .78rem; color: #9ca3af; text-align: center; }

  /* ── TOC Sidebar ── */
  .toc-sidebar { width: 224px; flex-shrink: 0; padding: 44px 0 80px 36px; }
  .toc-inner   { position: sticky; top: 28px; max-height: calc(100vh - 56px); overflow-y: auto; }
  .toc-inner::-webkit-scrollbar { width: 3px; }
  .toc-inner::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 2px; }
  .toc-hd { font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #9ca3af; margin-bottom: 10px; padding-left: 10px; }
  .toc-nav { display: flex; flex-direction: column; gap: 1px; }
  .toc-a {
    display: block; font-size: .79rem; line-height: 1.55; color: #6b7280;
    text-decoration: none; padding: 4px 10px; border-radius: 5px;
    border-left: 2px solid transparent; transition: color .12s, background .12s, border-color .12s;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .toc-l0 { padding-left: 10px; }
  .toc-l1 { padding-left: 20px; }
  .toc-l2 { padding-left: 30px; }
  .toc-l3 { padding-left: 40px; }
  .toc-l4 { padding-left: 50px; }
  .toc-a:hover  { color: #374151; background: #f3f4f6; }
  .toc-a.active { color: #2563eb; border-left-color: #2563eb; background: #eff6ff; font-weight: 500; }

  @media (max-width: 1020px) { .toc-sidebar { display: none; } }
  @media (max-width:  640px) { .prose { padding-top: 28px; } body { line-height: 1.7; } }
</style>
</head>
<body>
<div class="page-layout">
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
  // Client-side script: builds the TOC sidebar dynamically
  const script = `<script>
(function(){
  var hh = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'));
  if (hh.length < 2) return;

  // Assign ids to headings that don't have one
  var idCount = {};
  hh.forEach(function(h) {
    if (!h.id) {
      var base = (h.textContent || '').toLowerCase()
        .replace(/[^\\w\\u4e00-\\u9fff\\s-]/g, '').replace(/\\s+/g, '-').replace(/-+/g, '-').trim() || 'h';
      var n = idCount[base] = (idCount[base] || 0) + 1;
      h.id = n === 1 ? base : base + '-' + n;
    }
  });

  var minLevel = Math.min.apply(null, hh.map(function(h){ return +h.tagName[1]; }));

  // Inject styles
  var style = document.createElement('style');
  style.textContent = [
    '#_toc_sb{position:fixed;top:0;right:0;width:220px;height:100vh;padding:28px 14px;overflow-y:auto;box-sizing:border-box;font-family:system-ui,sans-serif;z-index:9999}',
    '#_toc_sb *{box-sizing:border-box}',
    '._toc_hd{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:10px;padding-left:10px}',
    '._toc_nav{display:flex;flex-direction:column;gap:1px}',
    '._toc_a{display:block;font-size:.79rem;line-height:1.55;color:#6b7280;text-decoration:none;padding:4px 10px;border-radius:5px;border-left:2px solid transparent;transition:all .12s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '._toc_l0{padding-left:10px}._toc_l1{padding-left:20px}._toc_l2{padding-left:30px}._toc_l3{padding-left:40px}',
    '._toc_a:hover{color:#374151;background:#f3f4f6}',
    '._toc_a.active{color:#2563eb;border-left-color:#2563eb;background:#eff6ff;font-weight:500}',
    '@media(max-width:1020px){#_toc_sb{display:none}}',
  ].join('');
  document.head.appendChild(style);

  // Build sidebar
  var aside = document.createElement('aside');
  aside.id = '_toc_sb';
  var nav = document.createElement('nav');
  nav.className = '_toc_nav';
  hh.forEach(function(h) {
    var a = document.createElement('a');
    a.href = '#' + h.id;
    a.className = '_toc_a _toc_l' + Math.min(3, +h.tagName[1] - minLevel);
    a.textContent = h.textContent;
    a.addEventListener('click', function(e) {
      e.preventDefault();
      h.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.pushState(null, '', '#' + h.id);
    });
    nav.appendChild(a);
  });
  var hd = document.createElement('div');
  hd.className = '_toc_hd';
  hd.textContent = '目录';
  aside.appendChild(hd);
  aside.appendChild(nav);
  document.body.appendChild(aside);

  // Active tracking
  var links = nav.querySelectorAll('._toc_a');
  function update() {
    var atBottom = window.scrollY + window.innerHeight >= document.body.scrollHeight - 60;
    var threshold = atBottom ? window.innerHeight : 80;
    var active = null;
    for (var i = hh.length - 1; i >= 0; i--) {
      if (hh[i].getBoundingClientRect().top <= threshold) { active = hh[i]; break; }
    }
    links.forEach(function(a) {
      a.classList.toggle('active', !!active && a.getAttribute('href') === '#' + active.id);
    });
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();
<\/script>`;

  let content = page.content;
  if (content.includes('</body>')) {
    content = content.replace('</body>', script + '</body>');
  } else {
    content = content + script;
  }
  return new Response(content, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

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
