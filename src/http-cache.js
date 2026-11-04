// 服务端 HTTP 缓存小工具（Node / Workers 通用，不进浏览器端共享层）。
//
// ── 为什么需要它 ─────────────────────────────────────────────────────────────
// 主页与后台的整份 HTML 是**一次拼出来的静态壳**：主页 372 KB、后台 430 KB
//（br 压缩后各约 85 KB / 95 KB）。它们此前一律带 `Cache-Control: no-store`，
// 于是每次访问都要：跑一遍 Worker → 重传几百 KB → 浏览器重新解析。
//
// 而这两份壳对**所有访客逐字节相同**（实测连抓两次 diff 完全一致：
// renderPage 只用 env.SITE_NOTES 这类部署期变量，renderAdminPage 不接任何参数，
// 产物里没有任何 token / 密码哈希）。所以它们本该被缓存。
//
// ── 为什么是 ETag 而不是「缓存很久」───────────────────────────────────────
// 壳里嵌着整站前端 JS。缓存时间太长，会让刚部署完的用户继续跑旧脚本 ——
// 页面是新的、行为是旧的，最难排查。这里的做法：
//
//   · 短 max-age（默认 60 秒）：同一会话内反复切换标签 / 刷新几乎零流量；
//   · must-revalidate：过期后必须回源校验，不许自作主张续用；
//   · 强 ETag：校验命中时响应 304、**不带 body**，回源也只花几 KB。
//
// ETag 用 FNV-1a 对整段 HTML 求摘要（372 KB 约 1–3 ms，且只在真正渲染时算一次，
// 缓存命中时直接复用响应头里那份）。不用构建号 / 时间戳：Workers 没有现成的
// 部署版本变量，用时间戳会让校验永不可能命中。

/** FNV-1a 32 位摘要 → 与长度组合成强 ETag */
export function shortEtag(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `"${(h >>> 0).toString(16)}-${text.length.toString(16)}"`;
}

/**
 * If-None-Match 命中 → 304（不返回 body）。
 * 匹配语义遵循 RFC 9110：支持列表、`*`、以及弱匹配前缀 `W/`。
 *
 * @param {Request} request
 * @param {string}  etag          强 ETag（带引号）
 * @param {Headers} [srcHeaders]  需要一并回带的响应头（Cache-Control / Vary 等）
 * @returns {Response|null}       null 表示未命中，调用方继续正常返回
 */
export function notModified(request, etag, srcHeaders) {
  const inm = request.headers.get('If-None-Match');
  if (!inm || !etag) return null;
  const tags = inm.split(',').map(s => s.trim());
  if (tags.includes(etag) || tags.includes('*') || tags.includes(`W/${etag}`)) {
    const headers = new Headers();
    headers.set('ETag', etag);
    const cc = srcHeaders?.get?.('Cache-Control');
    if (cc) headers.set('Cache-Control', cc);
    const vary = srcHeaders?.get?.('Vary');
    if (vary) headers.set('Vary', vary);
    return new Response(null, { status: 304, headers });
  }
  return null;
}

/**
 * 静态壳的缓存头：短 max-age + must-revalidate，配合 ETag 让回源只花 304。
 * 为什么不给更长的 max-age：见文件顶部「ETag 而不是缓存很久」。
 */
export const SHELL_CACHE_CONTROL = 'public, max-age=60, must-revalidate';
