import { sanitizeOriginalName } from './upload.js';
import { bumpDaily } from './admin/dailyStats.js';

// ⚠️ 这里**故意没有鉴权**，不是漏了。
//
// 图片的可见性（imgmeta.isPublic）只决定「是否出现在公开图库 / 列表里」，
// 不影响直链能不能访问 —— 图床的核心用途就是把直链发给别人看（Markdown、
// 邮件、IM、文档里嵌）。一旦按 isPublic 给直链加 token 校验，所有已经发出去
// 的链接会立刻全部失效，分享场景直接废掉。
//
// 所以：不要在这里加 Authorization 校验，也不要把「私密」理解成「需要登录」。
// 原型那边同理：isPrivate 才拦截，普通原型按 URL 公开。
export async function handleGet(env, ctx, key, request) {
  if (!key) return new Response('Not Found', { status: 404 });

  // ── 边缘缓存 ────────────────────────────────────────────────────────────────
  // 图片 key 是不可变的随机串（内容永不改写），直链本来就公开（见文件顶部注释），
  // 所以缓存**不改变任何暴露面**，只是把「每个访客都打一次 Worker + R2」
  // 变成命中边缘。实测改造前响应里连 cf-cache-status 都没有，等于 0 命中。
  //
  // 只缓存「GET 且不带 Authorization」的请求：带凭据的一律绕过缓存。
  const cache = edgeCache();
  const cacheKey = (cache && request.method === 'GET' && !request.headers.get('Authorization'))
    ? new Request(request.url, { method: 'GET' })
    : null;

  if (cacheKey) {
    const hit = await cache.match(cacheKey);
    if (hit) {
      // 命中也要记访问统计：计数口径与改造前完全一致
      ctx.waitUntil(recordAccess(env, key, request));
      ctx.waitUntil(bumpDaily(env.STATS, 'imgview'));
      const res = new Response(hit.body, hit);
      res.headers.set('X-Cache', 'HIT');
      return res;
    }
  }

  const object = await env.BUCKET.get(key);
  if (!object) return new Response('Image Not Found', { status: 404 });

  // 后台记录访问，不阻塞响应
  ctx.waitUntil(recordAccess(env, key, request));
  // 按天计数：后台趋势图的真实数据源（localStorage 那套模拟已废弃）
  ctx.waitUntil(bumpDaily(env.STATS, 'imgview'));

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

  const res = new Response(object.body, { headers });
  res.headers.set('X-Cache', 'MISS');

  if (cacheKey) {
    // 存一份「1 天过期」的副本，而不是响应里那年的长缓存：
    // Cache API 的 delete 只作用于当前 colo，彻底删除图片后其他 PoP 最多残留
    // 1 天，而不是 1 年。浏览器侧拿到的仍是长缓存（key 不可变，安全）。
    // 必须用 set 覆盖：直接 append 会留下两个 Cache-Control（原值 + 新值），
    // Cache API 取第一个，等于边缘 TTL 仍是浏览器那一年。
    const storeHeaders = new Headers(res.headers);
    storeHeaders.set('Cache-Control', 'public, max-age=86400');
    const stored = new Response(res.clone().body, { headers: storeHeaders });
    ctx.waitUntil(cache.put(cacheKey, stored).catch(() => {}));
  }
  return res;
}

/** Cache API 只在 Workers 运行时存在；本地 node-server / 单测里没有，返回 null。 */
function edgeCache() {
  try {
    return (typeof caches !== 'undefined' && caches.default) ? caches.default : null;
  } catch {
    return null;
  }
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
