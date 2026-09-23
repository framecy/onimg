import { sanitizeOriginalName } from './upload.js';

export async function handleGet(env, ctx, key, request) {
  if (!key) return new Response('Not Found', { status: 404 });

  const object = await env.BUCKET.get(key);
  if (!object) return new Response('Image Not Found', { status: 404 });

  // 后台记录访问，不阻塞响应
  ctx.waitUntil(recordAccess(env, key, request));

  const headers = {
    'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
    'Cache-Control': 'public, max-age=31536000',
    'ETag': object.etag,
  };
  // 带出原始文件名：右键「另存为」不再落成一个随机 key。
  // inline 保证 <img> 仍正常内联显示；有原名时附加 filename（ASCII）或
  // filename*=UTF-8（中文/特殊字符走 RFC 5987 转义）。
  const disp = contentDisposition(object.customMetadata?.name);
  if (disp) headers['Content-Disposition'] = disp;

  return new Response(object.body, { headers });
}

// 生成 Content-Disposition 值；无可安全表达的文件名时返回 null（不加该头）。
function contentDisposition(raw) {
  // 只取最后一个路径分量作为下载名；控制符/引号已由 sanitizeOriginalName 清掉，
  // 这里再挡一次引号与反斜杠，避免破坏 header 属性语法。
  const parts = sanitizeOriginalName(raw).split(/[\\/]/);
  const name = (parts[parts.length - 1] || '').replace(/["\\]/g, '');
  if (!name) return null;
  if (/^[\x20-\x7e]+$/.test(name)) return `inline; filename="${name}"`;
  return `inline; filename*=UTF-8''${rfc5987(name)}`;
}

// RFC 5987 的 attr-char 只允许 ALPHA/DIGIT/!#$%&'*+-.^_`|~，JS 的
// encodeURIComponent 恰好漏转义 ! ' ( ) 这四个字符，严格解析器（如 curl -J）
// 会因此判定整个 Content-Disposition 非法、回退成 URL 路径名。补转一次。
function rfc5987(s) {
  return encodeURIComponent(s).replace(/[!'()]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

async function recordAccess(env, key, request) {
  if (!env.STATS) return;

  const cf = request.cf ?? {};
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';

  const statsKey = 'stats:' + key;
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
  // 最多保留 200 条访问记录
  if (accesses.length > 200) accesses.length = 200;

  await env.STATS.put(statsKey, JSON.stringify(accesses), {
    metadata: { count, lastAccess: Date.now() },
  });
}
