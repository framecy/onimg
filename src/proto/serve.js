import { MIME_MAP } from './upload.js';
import { cfBump, cfMonth } from '../admin/cfCounters.js';
import { bumpDaily } from '../admin/dailyStats.js';

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

  // 路径遍历防护：拒绝 .. 与绝对路径，避免跨原型读取其他 proto 的文件
  //（R2 键为 `proto/{id}/{path}`，`..` 会拼出 `proto/{id}/../other/...` 逃逸出当前原型）。
  if (decodedPath.includes('..') || decodedPath.startsWith('/')) {
    return new Response('Not Found', { status: 404 });
  }

  // Fetch from R2
  const r2Key = `proto/${protoId}/${decodedPath}`;
  const obj   = await env.BUCKET.get(r2Key);
  if (!obj) return new Response('Not Found', { status: 404 });

  const ext  = decodedPath.split('.').pop()?.toLowerCase() ?? '';
  const ct   = MIME_MAP[ext] ?? obj.httpMetadata?.contentType ?? 'application/octet-stream';
  const isHtml = ext === 'html' || ext === 'htm';
  // 上行压缩的文件在 R2 里存的就是 gzip 字节（见 src/proto/upload.js），
  // 回放时带上 Content-Encoding 让浏览器自己解 —— 服务端不做解压，省 CPU。
  //
  // 为什么不能只认元数据：线上实测发现这条流式 put 路径下 R2 的
  // customMetadata 会丢（同一条链路的图片上传却正常），于是「压缩标记在
  // 写入侧有、读取侧没有」，浏览器把 gzip 字节当 JS 解析 —— 原型直接白屏。
  // 所以这里三层兜底：R2 一等字段 contentEncoding → customMetadata → 瞄一眼
  // gzip magic（1f 8b）。最后一层顺带把历史上已经写坏的按原样救回来。
  const gz = await resolveGzip(obj, ext);

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
        // 按天计数：后台趋势图的真实数据源
        await bumpDaily(env.STATS, 'protoview');
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
    // HTML 需要改文本，压缩过就得先解（回给浏览器的是明文，不再带 Content-Encoding）
    const buf = await obj.arrayBuffer();
    let html;
    if (gz.gzip) {
      html = await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    } else {
      html = new TextDecoder().decode(buf);
    }
    if (/<title>/i.test(html)) {
      html = html.replace(/<title>[^<]*<\/title>/i, `<title>${safeTitle}</title>`);
    } else {
      html = html.replace(/<head>/i, `<head><title>${safeTitle}</title>`);
    }
    return new Response(html, { headers });
  }

  if (gz.gzip) headers.set('Content-Encoding', 'gzip');
  return new Response(gz.body, { headers });
}

// 判断一个原型对象是不是以 gzip 字节存储的；返回可安全回放的 body。
// 见 serveProto 里关于「元数据三层兜底」的说明。
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
