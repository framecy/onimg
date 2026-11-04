import { MIME_MAP } from './upload.js';
import { bearerToken, timingSafeEqual } from '../admin/auth.js';
import { verifyUserToken } from '../user-auth.js';
import { canUseAgent } from '../agent-access.js';
import { cfBump, cfMonth } from '../admin/cfCounters.js';
import { bumpDaily } from '../admin/dailyStats.js';
import { recordAccess } from '../admin/access-stats.js';

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

// ── 版本化 URL 与签名层 ───────────────────────────────────────────────────────
//
// 入口路径 /proto/{id}/…：回答「存在吗 / 私有吗 / 密码对吗」，然后 302 到版本化 URL。
// 版本化路径 /proto/{id}/_s{sig}-{stamp}/…：资源热路径。
//
//   stamp = version          —— 只随重新上传递增。改标题 / 改标签不再让全站
//                               边缘缓存失效（旧实现用 updatedAt 做缓存键，
//                               改一次标题就把 120 个文件的缓存全冲掉）。
//   sig   = '0'              —— 公开原型。资产请求零 D1：靠机房内「策略缓存」
//                               判定（见下）。
//         = HMAC 前 16 hex   —— 密码 / 私有原型。HMAC 的输入是
//                               `id|version|访问标记`，访问标记 = 当前密码或
//                               'private'。资产请求实时读一次 meta 重算比对：
//                               改密码、转私有、重传都会让旧签名立刻失效
//                               （访问控制必须实时判定——与旧实现一致）。
//
// ⚠️ sig='0' 绝不能「无条件放行」。版本号是猜得出来的（1、2、3…），
// 一开始的实现就是无条件放行，等于任何人用 `_s0-1/` 就能读任何私有原型
//（上线后实测确认过这条越权）。所以公开路径多加一层「策略缓存」：
//
//   - 只有「当前确实公开」才会往策略缓存里写，TTL 5 分钟；
//   - sig='0' 先查策略缓存：命中则零 D1，未命中读 meta 实时判定；
//   - 私有 / 密码原型永远进不了策略缓存 —— 盲猜 `_s{n}` 必然落到 meta 校验，
//     当场被 302 回入口。
//
// 于是「转私有后已发出的链接还能用多久」被策略 TTL（5 分钟）封顶，
// 比资产 TTL（1 天）更紧；而不是像无条件放行那样「永久可读」。

function versionStampOf(meta) {
  return `${meta.version ?? 1}`;
}

/** 当前访问标记：密码（未过期）> 'private' > null（完全公开） */
function accessMarkerOf(meta) {
  const expired = meta.accessPassword && meta.passwordExpiry && Date.now() > meta.passwordExpiry;
  if (meta.accessPassword && !expired) return meta.accessPassword;
  if (meta.isPrivate) return 'private';
  return null;
}

function hexEncode(buf) {
  const u8 = new Uint8Array(buf);
  let out = '';
  for (let i = 0; i < u8.length; i++) out += u8[i].toString(16).padStart(2, '0');
  return out;
}

async function protoSign(secret, protoId, stamp, marker) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(String(secret ?? '')),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key,
    new TextEncoder().encode(`${protoId}|${stamp}|${marker}`));
  return hexEncode(mac).slice(0, 16);
}

function redirectTo(url) {
  return new Response(null, {
    status: 302,
    headers: { Location: url, 'Cache-Control': 'no-store' },
  });
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

/**
 * 原型静态服务（入口 + 版本化资源两层）。
 *
 * @param {object} env
 * @param {string} protoId
 * @param {string} filePath  URL 里 /proto/{id}/ 之后的剩余部分
 * @param {Request} request
 * @param {{waitUntil?: Function}} [ctx]  把缓存写入 / 统计挪出关键路径
 */
export async function serveProto(env, protoId, filePath, request, ctx) {
  if (!protoId) return new Response('Not Found', { status: 404 });

  const wait = (p) => { if (ctx?.waitUntil) ctx.waitUntil(p); };

  // ── 版本化路径 ────────────────────────────────────────────────────────────
  if (filePath.startsWith('_s') && filePath.length > 2) {
    const slash = filePath.indexOf('/');
    const token = slash === -1 ? filePath.slice(2) : filePath.slice(2, slash);
    const rest  = slash === -1 ? '' : filePath.slice(slash + 1);
    const dash  = token.indexOf('-');
    if (dash <= 0) return new Response('Not Found', { status: 404 });
    const sig   = token.slice(0, dash);
    const stamp = token.slice(dash + 1);

    // ── 资源打包：把 HTML 里的十几个资源合成一次请求（见文件末尾说明）──────
    if (rest === '__bundle.json') {
      return serveVersionedBundle(env, protoId, sig, stamp, request);
    }
    return serveVersionedAsset(env, protoId, sig, stamp, rest, request, wait);
  }

  // ── 入口路径：一次元数据查询回答「存在吗 / 私有吗 / 密码对吗」 ──────────────
  const meta = await env.STATS.get(`proto:${protoId}`, 'json');
  if (!meta) return new Response('Prototype Not Found', { status: 404 });

  // ── 属主 token 通道 ────────────────────────────────────────────────────────
  // 私有 / 带密码的原型原本对所有人 403 —— 连属主自己用 token 也拿不到文件，
  // 「登录授权后完整拉取」于是走不通。带合法 token 且 username === meta.owner
  // 时放行。只认 Bearer token：Cookie 会话、?owner= 之类参数一律不认，
  // 避免绕过权限。账号被设为 apiAccess=off 时连属主也不放行。
  const ownerBypass = await isProtoOwner(env, request, meta);

  // ── Private check ─────────────────────────────────────────────────────────
  if (meta.isPrivate === true && !ownerBypass) {
    return new Response('This prototype is private', { status: 403 });
  }

  // ── Password protection ────────────────────────────────────────────────────
  // If password has expired, skip password check (treat as public)
  const marker = accessMarkerOf(meta);
  const needsPwd = !!meta.accessPassword && marker === meta.accessPassword && !ownerBypass;

  let sig = '0';
  if (marker && (needsPwd || (meta.isPrivate && ownerBypass))) {
    sig = await protoSign(env.TOKEN_SECRET, protoId, versionStampOf(meta), marker);
  }

  if (needsPwd) {
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
          'Cache-Control': 'no-store',
          // cookie 值仍是密码明文：与旧版兼容（原型内容本身不涉密），
          // Path 限定在本原型之下，7 天有效。
          'Set-Cookie': `${cname}=${encodeURIComponent(meta.accessPassword)}; Path=/proto/${protoId}/; Max-Age=${7 * 86400}; SameSite=Lax`,
        },
      });
    }

    const authed = cookies[cname] === meta.accessPassword;
    if (!authed) {
      let fp = filePath; try { fp = decodeURIComponent(filePath); } catch {}
      const ext = fp.split('.').pop()?.toLowerCase() ?? '';
      const isHtml = !fp || fp === '/' || ext === 'html' || ext === 'htm';
      if (isHtml) return servePasswordPrompt(protoId, meta.title, false);
      // Asset request without auth → 403
      return new Response('Forbidden', { status: 403 });
    }
  }

  // ── Resolve file path ──────────────────────────────────────────────────────
  // 解码后做一次路径检查：遍历攻击在入口就拦掉，不白做一次 302。
  let decodedEntry = filePath;
  try { decodedEntry = decodeURIComponent(filePath); } catch {}
  if (decodedEntry.includes('..') || decodedEntry.startsWith('/')) {
    return new Response('Not Found', { status: 404 });
  }

  // 浏览器落在版本化 URL 上之后，Axure 的相对路径（resources/…、files/…）
  // 天然解析到同一版本前缀下 —— 不需要 <base> 注入。
  const stamp  = versionStampOf(meta);
  const verBase = `/proto/${protoId}/_s${sig}-${stamp}/`;

  // 空路径 / 目录 → 302 到版本化的入口文件
  if (!filePath || filePath === '/' || decodedEntry.endsWith('/')) {
    const entry = meta.entryPoint || 'index.html';
    return redirectTo(verBase + encodePath(entry));
  }

  // 入口路径上直接请求具体文件（旧链接 / Agent 拉取）：转发到版本化路径。
  return redirectTo(verBase + filePath);
}

function encodePath(p) {
  return encodeURIComponent(p).replace(/%2F/gi, '/');
}

// ── 版本化路径的资源服务 ─────────────────────────────────────────────────────
async function serveVersionedAsset(env, protoId, sig, stamp, filePath, request, wait) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // ── 访问判定 ──────────────────────────────────────────────────────────────
  // 两条路，唯一的区别是「能不能省掉这次 meta 读」：
  //
  //   sig ≠ '0'（私有 / 密码）→ 每次实时读 meta 重算 HMAC，一秒都不缓存。
  //     改密码 → marker 变；转公开 → 期望值变 '0'；重传 → version 变。
  //     任何一条都会让旧签名立刻失效，随后 302 回入口重新走访问控制。
  //
  //   sig = '0'（公开）→ 先查策略缓存。策略缓存里只可能有「公开」这一种
  //     结论，所以命中即等价于「刚刚确认过是公开」，可以零 D1 放行；
  //     未命中就老老实实读一次 meta 判定，公开才写回缓存。
  //     私有原型从不写策略缓存 → 盲猜 `_s0-{n}` 一定落到 meta 校验被拒。
  const cache = edgeCache();
  const cacheable = !!cache && request.method === 'GET'
    && !request.headers.get('Cookie') && !request.headers.get('Authorization');

  let meta = null;
  let policy = null;      // 策略缓存命中的 { title }
  let isPublic = false;   // 当前已确认公开

  if (sig === '0') {
    if (cacheable) policy = await policyGet(cache, request, protoId);
    if (policy) {
      isPublic = true;
    } else {
      meta = await env.STATS.get(`proto:${protoId}`, 'json');
      if (!meta) return new Response('Not Found', { status: 404 });
      if (accessMarkerOf(meta) !== null) {
        return redirectTo(`/proto/${protoId}/`);
      }
      isPublic = true;
      if (cacheable) {
        wait(policyPut(cache, request, protoId, meta.title).catch(() => {}));
      }
    }
  } else {
    meta = await env.STATS.get(`proto:${protoId}`, 'json');
    const marker = meta ? accessMarkerOf(meta) : null;
    const expect = marker
      ? await protoSign(env.TOKEN_SECRET, protoId, versionStampOf(meta), marker)
      : '0';
    if (!meta || !timingSafeEqual(sig, expect)) {
      return redirectTo(`/proto/${protoId}/`);
    }
  }

  // Decode percent-encoded path (browsers encode non-ASCII chars in URLs,
  // but R2 keys are stored with the raw UTF-8 filenames from the ZIP)
  let decodedPath = filePath;
  try { decodedPath = decodeURIComponent(filePath); } catch {}

  // 路径遍历防护：拒绝 .. 与绝对路径，避免跨原型读取其他 proto 的文件
  //（R2 键为 `proto/{id}/{path}`，`..` 会拼出 `proto/{id}/../other/...` 逃逸出当前原型）。
  if (decodedPath.includes('..') || decodedPath.startsWith('/') || !decodedPath) {
    return new Response('Not Found', { status: 404 });
  }

  // ── 边缘缓存（Cache API，机房本地） ────────────────────────────────────────
  // 只缓存「当前确认为公开」的资源：私有 / 密码原型的访问控制必须实时判定
  //（与旧版一致）。URL 已含内容指纹（version），缓存键不再需要额外版本参数。
  const cacheKey = (isPublic && cacheable)
    ? new Request(request.url.split('?')[0], { method: 'GET' })
    : null;

  if (cacheKey) {
    const hit = await cache.match(cacheKey);
    if (hit) {
      const etag = hit.headers.get('ETag');
      const notMod = maybe304(request, etag, hit.headers);
      if (notMod) return notMod;
      const res = new Response(request.method === 'HEAD' ? null : hit.body, hit);
      res.headers.set('X-Cache', 'HIT');
      return res;
    }
    // 负缓存：这个版本里确实没有这个文件。Axure 每页固定发 2 个
    // shouldShow*Hint 404 探测，不缓存的话每次都要跑完 D1+R2 全链路。
    const neg = await cache.match(negKey(cacheKey));
    if (neg) return new Response('Not Found', { status: 404, headers: { 'X-Cache': 'HIT' } });
  }

  // 打包清单（公开原型才注入加载器；见 injectBundleLoader）
  let bundlePaths = [];
  if (isPublic) {
    bundlePaths = bundleListOf(meta);
    if (!bundlePaths.length) {
      const vfiles = await env.STATS.get(`proto:vfiles:${protoId}:v${stamp}`, 'json').catch(() => null);
      if (Array.isArray(vfiles)) bundlePaths = bundleListOf({ bundle: vfiles });
    }
  }

  // Fetch from R2
  const r2Key = `proto/${protoId}/${decodedPath}`;
  const obj   = await env.BUCKET.get(r2Key);
  if (!obj) {
    if (cacheKey) {
      wait(cache.put(negKey(cacheKey), new Response('nf', {
        status: 404,
        headers: { 'Cache-Control': 'public, max-age=60' },
      })).catch(() => {}));
    }
    return new Response('Not Found', { status: 404 });
  }

  const ext    = decodedPath.split('.').pop()?.toLowerCase() ?? '';
  const ct     = MIME_MAP[ext] ?? obj.httpMetadata?.contentType ?? 'application/octet-stream';
  const isHtml = ext === 'html' || ext === 'htm';
  // 上行压缩的文件在 R2 里存的就是 gzip 字节（见 src/proto/upload.js）。
  // 为什么不能只认元数据：线上实测发现这条流式 put 路径下 R2 的
  // customMetadata 会丢（同一条链路的图片上传却正常），于是「压缩标记在
  // 写入侧有、读取侧没有」，浏览器把 gzip 字节当 JS 解析 —— 原型直接白屏。
  // 所以这里三层兜底：R2 一等字段 contentEncoding → customMetadata → 瞄一眼
  // gzip magic（1f 8b）。最后一层顺带把历史上已经写坏的按原样救回来。
  const gz = await resolveGzip(obj, ext);

  // ── Track access (HTML requests only) ──────────────────────────────────────
  // HTML 恒 no-store（Worker 必跑），「打开原型」的统计口径不受缓存影响；
  // 资产命中缓存后不再执行到这里——资产本来也不计访问量。
  // 旧实现是裸 IIFE 既不 await 也不 waitUntil：Worker 一返回 promise 随时
  // 被丢弃，访问统计一直在随机丢。现在挂 ctx.waitUntil。
  //
  // 2026-11-04：原来这里把最多 200 条访问记录整行 JSON 读出来再写回去，
  // 行体积随热度增长，是「越用越慢」的根因之一。现在改走 access-stats 的
  // 定长计数行（1 读 + 1 写，行体积恒定，见 admin/access-stats.js 文件头）。
  if (isHtml) {
    wait((async () => {
      try {
        await recordAccess(env.STATS, 'proto', protoId, request);
        // R2 Class B 追踪：附带在同一个 async 块，不额外消耗 KV 写入配额
        await cfBump(env.STATS, 'cf:r2b:' + cfMonth(), 1, true);
        // 按天计数：后台趋势图的真实数据源
        await bumpDaily(env.STATS, 'protoview');
      } catch {}
    })());
  }

  // ETag：同一版本化 URL 下实体不变，stamp 即版本。If-None-Match 命中回 304。
  const etag = `"${stamp}"`;
  const headers = new Headers({
    'Content-Type': ct,
    'ETag': etag,
    // HTML 恒不缓存：统计与访问控制在 Worker 里。资产 1 天：
    // 「曾经公开后来转私有」的撤销窗口与重传后旧链接的存活时间都由此封顶
    //（重传后 version 变化 → 新 URL，浏览器/边缘都会重新拉取）。
    'Cache-Control': isHtml
      ? 'no-store'
      : 'public, max-age=86400',
  });
  // 只有「回放字节就是存储字节」时 Content-Length 才准确；
  // gzip 存储要走解压（长度变了），HTML 字符串响应由运行时自带。
  if (!gz.gzip && !isHtml && obj.size != null) headers.set('Content-Length', String(obj.size));

  const notMod = maybe304(request, etag, headers);
  if (notMod) return notMod;

  // Inject prototype title into HTML files (AxureRP exports default to "Untitled Document")
  if (isHtml) {
    // 必须走 gz.body：嗅探已经把 R2 的流读过一块了，再 obj.arrayBuffer() 会抛
    // 「Body has already been used」。gz.body 是已经把那一块拼回去的可读流。
    const buf = await new Response(gz.body).arrayBuffer();
    const bytes = gz.gzip
      ? new Uint8Array(await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer())
      : new Uint8Array(buf);

    // 只有「确实是 UTF-8 文本」才敢改标题。
    //
    // decode() 默认是有损的：非 UTF-8 字节会被替换成 U+FFFD，再编码回去就**永久
    // 改坏了内容**。真实场景不是没有 —— 中文版 Axure 导出的 HTML 有 GBK 的，
    // 任何以 .html 结尾的二进制资源也会走这里。2026-10 的 900 文件回环测试就是
    // 这么发现 162 个 .html 的字节被改掉的。
    // fatal:true 让非法字节直接抛错，此时原样回放（不注入标题），宁可少个标题也不改坏文件。
    let html;
    try {
      html = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      return new Response(bytes, { headers });
    }

    // 标题来源：私有 / 密码路径上 meta 已读；公开路径来自策略缓存（含标题），
    // 两者都没有时才补读一次。命中策略缓存时整个请求零 D1。
    const title = meta?.title ?? policy?.title
      ?? (await env.STATS.get(`proto:${protoId}`, 'json'))?.title ?? '';
    if (title) {
      const safeTitle = esc(title);
      if (/<title>/i.test(html)) {
        html = html.replace(/<title>[^<]*<\/title>/i, `<title>${safeTitle}</title>`);
      } else {
        html = html.replace(/<head>/i, `<head><title>${safeTitle}</title></head>`);
      }
    }

    // ── 资源内联（把 15 个资源请求合成 1 个 HTML 请求）────────────────────
    // 只对公开原型做：私有/密码原型的资源不该被塞进一份可能被缓存的 HTML。
    // 失败（R2 读不到 / 解析异常）就原样返回 HTML，退化成优化前的行为。
    if (isPublic && bundlePaths.length) {
      try {
        const files = await readBundleFiles(env, protoId, bundlePaths);
        if (Object.keys(files).length) {
          const r = inlineBundleResources(html, files);
          html = r.html;
        }
      } catch { /* 内联失败不影响页面本身 */ }
    }

    return new Response(html, { headers });
  }

  if (!gz.gzip) return finish(new Response(gz.body, { headers }), cache, cacheKey, wait);

  // 压缩只用于「上传上行」，回放一律给明文。
  //
  // 为什么不直接回 Content-Encoding: gzip 让浏览器解：线上实测 Cloudflare
  // 会剥掉这个头却保留压缩字节（不带 Accept-Encoding 的请求），
  // 还会对这条流式 gzip 响应再压一层（带 Accept-Encoding 时拿到的其实是
  // 套了两层的字节）—— 两条路都会把原型打坏。
  // 回放明文交给 Cloudflare 自己按标准协商压缩，行为可预测；
  // 代价是每次资源请求多一次解压（原生 DecompressionStream，几十 KB 级文件可忽略）。
  const src = typeof gz.body?.pipeThrough === 'function' ? gz.body : new Blob([gz.body]).stream();
  return finish(new Response(src.pipeThrough(new DecompressionStream('gzip')), { headers }), cache, cacheKey, wait);
}

// If-None-Match → 304（列表语义 + * + W/ 弱匹配，RFC 9110）
function maybe304(request, etag, srcHeaders) {
  const inm = request.headers.get('If-None-Match');
  if (!inm || !etag) return null;
  const tags = inm.split(',').map(s => s.trim());
  if (tags.includes(etag) || tags.includes('*') || tags.includes(`W/${etag}`)) {
    const headers = new Headers();
    headers.set('ETag', etag);
    const cc = srcHeaders?.get?.('Cache-Control');
    if (cc) headers.set('Cache-Control', cc);
    return new Response(null, { status: 304, headers });
  }
  return null;
}

/**
 * 给公开版本化资源套上边缘缓存：响应带 X-Cache，副本存 1 天。
 * 缓存写入挂 ctx.waitUntil —— 不再阻塞响应。旧实现里 await cache.put()
 * 的注释说「serveProto 没有 ctx」，实际 fetch() 一直都有，只是没传进来。
 */
function finish(res, cache, cacheKey, wait) {
  res.headers.set('X-Cache', 'MISS');
  if (!cacheKey) return res;
  const storeHeaders = new Headers(res.headers);
  // set 而不是 append：append 会留下两个 Cache-Control，Cache API 取第一个
  //（线上实测 HTML 一直 MISS 就是这个坑）。
  storeHeaders.set('Cache-Control', 'public, max-age=86400');
  wait(cache.put(cacheKey, new Response(res.clone().body, { headers: storeHeaders })).catch(() => {}));
  return res;
}

// 负缓存键：加一段查询参数，与正向缓存永不冲突
function negKey(cacheKey) {
  return new Request(cacheKey.url + (cacheKey.url.includes('?') ? '&' : '?') + '__neg=1', { method: 'GET' });
}

// ── 策略缓存：只缓存「这个原型当前是公开的」这一条结论 ────────────────────
// 存在的意义：让公开原型的资产热路径不必每个请求都读一次 meta，
// 同时保证私有原型永远不会被这条捷径放行（私有从不写入）。
// TTL 5 分钟 = 「转私有后旧链接还能活多久」的上限，比资产 TTL 更紧。
const POLICY_TTL = 300;

function policyKey(request, protoId) {
  return new Request(new URL('/__proto-policy/' + encodeURIComponent(protoId),
    request.url).href, { method: 'GET' });
}

async function policyGet(cache, request, protoId) {
  const hit = await cache.match(policyKey(request, protoId));
  if (!hit) return null;
  try {
    return { title: (await hit.json()).title ?? '' };
  } catch {
    return { title: '' };
  }
}

function policyPut(cache, request, protoId, title) {
  return cache.put(policyKey(request, protoId), new Response(
    JSON.stringify({ title: title ?? '' }),
    { headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${POLICY_TTL}` } },
  ));
}

function edgeCache() {
  try {
    return (typeof caches !== 'undefined' && caches.default) ? caches.default : null;
  } catch {
    return null;
  }
}

// 判断一个原型对象是不是以 gzip 字节存储的；返回可安全回放的 body。
// 见 serveVersionedAsset 里关于「元数据三层兜底」的说明。
const GZIP_MAGIC = [0x1f, 0x8b];
// 只对文本类做 magic 嗅探：图片/字体等二进制偶尔也可能以 1f8b 开头，
// 而文本类被压过必然以 1f8b 开头，判错概率可以忽略。
const SNIFF_EXT = new Set(['html', 'htm', 'js', 'mjs', 'css', 'json', 'xml', 'svg', 'txt', 'md', 'map']);

function looksGzip(bytes) {
  return !!bytes && bytes.length >= 2 && bytes[0] === GZIP_MAGIC[0] && bytes[1] === GZIP_MAGIC[1];
}

async function resolveGzip(obj, ext) {
  if (obj.httpMetadata?.contentEncoding === 'gzip' || obj.customMetadata?.ce === 'gzip') {
    return { gzip: true, body: obj.body };
  }
  if (!SNIFF_EXT.has(ext)) return { gzip: false, body: obj.body };

  // 非流式 body（本地磁盘适配器 / 测试替身）：直接看头两个字节
  if (typeof obj.body?.getReader !== 'function') {
    const buf = await obj.arrayBuffer();
    const u8 = new Uint8Array(buf);
    return { gzip: looksGzip(u8), body: u8 };
  }

  // 流式 body：读第一块判魔数，再把这一块拼回去，后续按需拉取
  const reader = obj.body.getReader();
  const { value: head } = await reader.read();
  let probe = head || new Uint8Array(0);
  const isGz = looksGzip(probe);
  const body = new ReadableStream({
    start(c) { if (probe && probe.length) c.enqueue(probe); },
    async pull(c) {
      const { done, value } = await reader.read();
      if (done) c.close(); else c.enqueue(value);
    },
    cancel(reason) { return reader.cancel(reason); },
  });
  return { gzip: isGz, body };
}

// 属主判定：必须同时满足「带 Bearer token」「token 有效」「username 等于原型 owner」
// 「账号未关闭 Agent 访问」。任何一条不满足都返回 false，走原来的公开/密码流程。
async function isProtoOwner(env, request, meta) {
  if (!meta?.owner) return false;
  if (!bearerToken(request)) return false;
  const user = await verifyUserToken(request, env);
  if (!user || user.username !== meta.owner) return false;
  return canUseAgent(user);
}

// ── 资源打包（bundle）────────────────────────────────────────────────────────
//
// ── 为什么需要它 ────────────────────────────────────────────────────────────
// Axure 导出的原型，一个页面就要发 16 个资源请求（jQuery、axplayer、7 个 CSS、
// 若干插件样式……）。每个请求都要进 Worker 做一次访问判定（policy 缓存或 D1），
// 再回源 R2 —— 即使边缘全都 HIT，也要为每个请求付一次「进 Worker + 判定」的
// 开销。浏览器对同域名并发只有 6 路，16 个资源 = 至少 3 轮，实测一个原型
// 打开要 2–9 秒，是全站最慢的一类页面（2026-11-04 性能报告的结论）。
//
// 打包把「16 次请求 × 每次一次判定」压成「1 次请求 × 一次判定」：
//   GET /proto/{id}/_s{sig}-{stamp}/__bundle.json
// 回包是 { "resources/css/default.css": "<内容>", ... }，前端一次取回、
// 注入 <style>/<script>，不再发那 16 个请求。
//
// ── 安全 ────────────────────────────────────────────────────────────────────
// 复用与单文件完全相同的访问判定（sig 校验 / 私有原型拒绝），并且只接受
// 显式列在 meta.bundle 里的路径 —— 不接受调用方传任意路径列表，
// 否则就成了「读任意文件」的接口。
//
// ── 体积 ────────────────────────────────────────────────────────────────────
// 典型原型 633 KB，gzip 后约 180 KB（Cloudflare 自动协商压缩）。
// 比 16 个请求的往返开销划算得多。

/**
 * 读出一组原型资源的文本内容（并发读 R2，gzip 存储就地解压）。
 *
 * 体积闸门：单文件 >1MB、总量 >2MB 的文件被跳过 —— 宁可让浏览器单独去取，
 * 也不能让首屏 HTML 膨胀到几十 MB（实测某个原型有 717 个 SVG，全打包 7 MB）。
 *
 * @param {object} env
 * @param {string} protoId
 * @param {string[]} paths     候选路径
 * @param {Array} [heads]      可选的 R2 head 结果（已有就复用，省一轮请求）
 * @param {string[]} [allPaths] heads 对应的完整路径数组
 * @returns {Promise<Record<string,string>>}
 */
async function readBundleFiles(env, protoId, paths, heads = null, allPaths = null) {
  if (!paths.length) return {};

  // 体积闸门：先 head 取大小。已有 heads（来自 serveBundle）就复用。
  let sizeOf;
  if (heads) {
    const map = new Map();
    for (let i = 0; i < (allPaths ?? []).length; i++) map.set(allPaths[i], heads[i]?.size ?? 0);
    sizeOf = (p) => map.get(p) ?? 0;
  } else {
    const h = await Promise.all(paths.map(p =>
      env.BUCKET.head(`proto/${protoId}/${p}`).catch(() => null)));
    sizeOf = (p) => h[paths.indexOf(p)]?.size ?? 0;
  }

  const allowed = [];
  let total = 0;
  for (const p of paths) {
    const size = sizeOf(p);
    if (size > BUNDLE_MAX_FILE) continue;
    if (total + size > BUNDLE_MAX_TOTAL) continue;
    total += size;
    allowed.push(p);
  }

  const entries = await Promise.all(allowed.map(async (p) => {
    const obj = await env.BUCKET.get(`proto/${protoId}/${p}`).catch(() => null);
    if (!obj) return null;
    const ext = p.split('.').pop()?.toLowerCase() ?? '';
    const gz = await resolveGzip(obj, ext);
    const buf = await new Response(gz.gzip
      ? gz.body.pipeThrough(new DecompressionStream('gzip'))
      : gz.body).arrayBuffer();
    return [p, new TextDecoder('utf-8').decode(new Uint8Array(buf))];
  }));

  const out = {};
  for (const e of entries) if (e) out[e[0]] = e[1];
  return out;
}

/**
 * 版本化路径上的打包请求：先做与单文件**完全相同**的访问判定，再打包。
 *
 * 判定逻辑与 serveVersionedAsset 保持一致：
 *   sig='0' → 公开，查策略缓存判定（零 D1）
 *   sig≠'0' → 私有/密码，实时读 meta 重算 HMAC 比对
 * 判定通过后只打 meta.bundle 里显式声明的文件（不接受任意路径）。
 */
async function serveVersionedBundle(env, protoId, sig, stamp, request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  const cache = edgeCache();
  const cacheable = !!cache && request.method === 'GET'
    && !request.headers.get('Cookie') && !request.headers.get('Authorization');

  let meta = null;
  if (sig === '0') {
    if (cacheable) {
      const policy = await policyGet(cache, request, protoId);
      if (policy) {
        // 策略缓存只有结论（公开 + 标题），没有 bundle 清单 —— 仍要读一次 meta
        meta = await env.STATS.get(`proto:${protoId}`, 'json');
      }
    }
    if (!meta) {
      meta = await env.STATS.get(`proto:${protoId}`, 'json');
      if (!meta) return new Response('Not Found', { status: 404 });
      if (accessMarkerOf(meta) !== null) return redirectTo(`/proto/${protoId}/`);
      if (cacheable) {
        const p = policyPut(cache, request, protoId, meta.title);
        p.catch?.(() => {});
      }
    }
  } else {
    meta = await env.STATS.get(`proto:${protoId}`, 'json');
    const marker = meta ? accessMarkerOf(meta) : null;
    const expect = marker
      ? await protoSign(env.TOKEN_SECRET, protoId, versionStampOf(meta), marker)
      : '0';
    if (!meta || !timingSafeEqual(sig, expect)) {
      return redirectTo(`/proto/${protoId}/`);
    }
  }

  let paths = bundleListOf(meta);
  if (!paths.length) {
    // 老原型（本次升级前上传的）没有 bundle 清单：用该版本的 vfiles 现算一次并落盘，
    // 之后同一版本直接命中。vfiles 本身就是当初上传的文件清单，不需要扫 R2。
    const vfiles = await env.STATS.get(`proto:vfiles:${protoId}:v${versionStampOf(meta)}`, 'json')
      .catch(() => null);
    if (Array.isArray(vfiles) && vfiles.length) {
      paths = bundleListOf({ bundle: vfiles });
      // 写回 meta，避免每次打开都重算（best-effort，失败不影响本次响应）
      if (paths.length) {
        env.STATS.put(`proto:${protoId}`, JSON.stringify({ ...meta, bundle: paths }))
          .catch(() => {});
      }
    }
  }
  if (!paths.length) {
    return new Response('{}', {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  return serveBundle(env, protoId, stamp, paths, request);
}

/** 打包允许的扩展名（与 upload.js 的 BUNDLE_EXTS 保持一致） */
const BUNDLE_TYPES = {
  css: 'text/css', js: 'application/javascript', mjs: 'application/javascript',
};

/** 打包总量上限：超过就放弃打包（走原路径），绝不让首屏拉几十 MB */
const BUNDLE_MAX_TOTAL = 2 * 1024 * 1024;
/** 单文件上限：超大 JS 单独走，避免拖慢首屏 */
const BUNDLE_MAX_FILE = 1024 * 1024;

/** 从原型元数据里取打包清单：只认显式声明，且过滤掉 HTML 与非文本类型 */
function bundleListOf(meta) {
  const list = Array.isArray(meta?.bundle) ? meta.bundle : [];
  return list
    .map(p => String(p))
    .filter(p => {
      if (!p || p.includes('..') || p.startsWith('/')) return false;
      const ext = p.split('.').pop()?.toLowerCase() ?? '';
      return Object.prototype.hasOwnProperty.call(BUNDLE_TYPES, ext);
    });
}

/**
 * 产出打包响应。调用方已完成访问判定（与单文件同一套）。
 *
 * @param {object} env
 * @param {string} protoId
 * @param {string} stamp   版本戳，作为缓存键的一部分
 * @param {string[]} paths 清单里的相对路径
 * @param {Request} request
 */
async function serveBundle(env, protoId, stamp, paths, request) {
  const cache = edgeCache();
  const cacheable = !!cache && request.method === 'GET'
    && !request.headers.get('Cookie') && !request.headers.get('Authorization');

  const cacheKey = cacheable
    ? new Request(new URL(`/proto/${protoId}/_b${stamp}/__bundle.json`, request.url).href, { method: 'GET' })
    : null;

  if (cacheKey) {
    const hit = await cache.match(cacheKey);
    if (hit) {
      const res = new Response(request.method === 'HEAD' ? null : hit.body, hit);
      res.headers.set('X-Cache', 'HIT');
      return res;
    }
  }

  // 体积闸门：先用 head 取大小，剔除超大单文件与超总量的文件组合。
  // 老原型（bundle 清单是现算的）没有上传时的体积信息，只能在这里兜底。
  const heads = await Promise.all(paths.map(p =>
    env.BUCKET.head(`proto/${protoId}/${p}`).catch(() => null)));
  const allowed = [];
  let total = 0;
  for (let i = 0; i < paths.length; i++) {
    const size = heads[i]?.size ?? 0;
    if (size > BUNDLE_MAX_FILE) continue;
    if (total + size > BUNDLE_MAX_TOTAL) continue;
    total += size;
    allowed.push(paths[i]);
  }

  const body = await readBundleFiles(env, protoId, allowed, heads, paths);

  const res = new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });

  if (cacheKey) {
    // 复用 finish 的缓存写入语义：X-Cache: MISS、waitUntil 写缓存、
    // Cache-Control 覆盖为 1 天（bundle 与 stamp 绑定，重传即换 URL，可安全长缓存）
    return finish(res, cache, cacheKey, (p) => p.catch(() => {}));
  }
  res.headers.set('X-Cache', 'MISS');
  return res;
}

// ── 原型资源打包：服务端内联 ────────────────────────────────────────────────
//
// ── 为什么不用 JS 拦截 ──────────────────────────────────────────────────────
// 最初想过注入脚本重写 XHR / appendChild 来拦截资源请求。实测行不通：
// Axure 导出的 HTML 里是 6 个 <script src> + 13 个 <link href>，这些**由浏览器
// HTML 解析器直接抓取**，既不经过 XHR，也不经过 appendChild —— JS 拿不到。
//
// ── 现在的做法 ──────────────────────────────────────────────────────────────
// 服务端把 HTML 里的 <link href="…css"> 换成 <style>…</style>、
// <script src="…js"> 换成行内 <script>…</script>，内容取自 bundle。
// 浏览器因此只发 1 个 HTML 请求，不再发那 15 个资源请求。
//
// 这些内联内容与 HTML 同源同体（都是同一个原型的资源），不改变任何暴露面；
// 且整页仍受与单文件相同的访问判定保护（公开才内联）。
//
// ── 体积 ────────────────────────────────────────────────────────────────────
// 典型原型：HTML 6.8 KB → 约 440 KB（gzip 后约 130 KB，Cloudflare 自动压缩）。
// 换来的是「1 次请求」而不是「1 + 15 次」，这是原型打开慢的唯一大头。
//
// 只内联 bundle 清单内的文件（css/js，见 upload.js 的 BUNDLE_EXTS）。
// 图片、字体、页面片段 HTML 一律保持原路径：它们要么该懒加载，
// 要么各自被浏览器缓存，塞进 HTML 反而更慢。

/**
 * 把 HTML 里对 bundle 资源的 <link>/<script src> 就地替换成内联内容。
 *
 * @param {string} html
 * @param {Record<string,string>} files 路径 → 内容（bundle 的产物）
 * @returns {{ html: string, inlined: number }}
 */
function inlineBundleResources(html, files) {
  if (!files || !Object.keys(files).length) return { html, inlined: 0 };

  // 归一化：把 HTML 里的 href/src 转成 bundle 的 key（去掉前导 ./ 与查询串）
  const norm = (u) => String(u).replace(/^\s+|\s+$/g, '').replace(/^\.\//, '').split('?')[0];
  let inlined = 0;

  // 1) <link ... href="xxx.css" ...>  →  <style>…</style>
  html = html.replace(/<link\b[^>]*>/gi, (tag) => {
    const m = /href\s*=\s*["']([^"']+)["']/i.exec(tag);
    if (!m) return tag;
    const key = norm(m[1]);
    const css = files[key];
    if (css == null) return tag;
    inlined++;
    // 保留 media 属性语义：non-screen 的样式表不内联（避免打印样式串到屏幕）
    if (/media\s*=\s*["'](?!all|screen)[^"']+["']/i.test(tag)) return tag;
    return `<style data-bundled="${esc(key)}">${css}</style>`;
  });

  // 2) <script src="xxx.js"></script>  →  <script>…</script>
  html = html.replace(/<script\b([^>]*)><\/script>/gi, (tag, attrs) => {
    const m = /src\s*=\s*["']([^"']+)["']/i.exec(attrs);
    if (!m) return tag;
    const key = norm(m[1]);
    const js = files[key];
    if (js == null) return tag;
    // 有 defer/async 的脚本语义不同，内联会改变执行时机 —— 保守起见跳过
    if (/\b(defer|async)\b/i.test(attrs)) return tag;
    inlined++;
    // </script> 出现在 JS 字符串里会提前结束标签，必须转义
    return `<script data-bundled="${esc(key)}">${js.replace(/<\/script/gi, '<\\/script')}</script>`;
  });

  return { html, inlined };
}
