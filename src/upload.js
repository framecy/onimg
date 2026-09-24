import { verifyUserToken, checkAndIncrementQuota } from './user-auth.js';
import { mergeUserImgEntry, putImageRecords } from './imglist.js';
import { verifyAdminToken as checkAdmin } from './admin/auth.js';
import { getUploadConfig } from './admin/config-handler.js';
import { cfBump, cfMonth } from './admin/cfCounters.js';
import { bumpGlobalStats } from './admin/gstats.js';

// ── 原始文件名 ───────────────────────────────────────────────────────────────
//
// key 仍然由时间戳 + 随机串生成（不派生自文件名），因此原名只作「展示 / 匹配」
// 用途：存入 imgmeta value、userimgs 条目、R2 自定义元数据，并在响应与列表里
// 返回。这样既不破坏已分享出去的直链，也不需要处理 URL 编码、同名覆盖与路径
// 穿越问题。
//
// 来源：multipart 取 file.name；raw-body（CLI / Typora）取 X-File-Name 请求头
// —— 该头由客户端 URL 编码后发送（HTTP 头只能承载 latin-1，中文名必须编码）。

export const MAX_NAME_LEN = 255;

const UTF8 = new TextEncoder();

function safeDecode(value) {
  if (!value) return '';
  const s = String(value);
  try { return decodeURIComponent(s); } catch { return s; }
}

// 按 UTF-8 字节截断：逐个字符累加字节数，放不下的整字丢弃，
// 保证结果里不会出现半个多字节字符（U+FFFD）。
function truncateByBytes(s, max) {
  const bytes = UTF8.encode(s);
  if (bytes.length <= max) return s;
  let out = '';
  let used = 0;
  for (const ch of s) {
    const len = UTF8.encode(ch).byteLength;
    if (used + len > max) break;
    out += ch;
    used += len;
  }
  return out;
}

export function sanitizeOriginalName(raw) {
  if (!raw) return '';
  const s = truncateByBytes(
    String(raw)
      .replace(/[\u0000-\u001f\u007f]/g, '')  // 控制符（含 tab / 换行 / DEL）
      .replace(/\s+/g, ' ')                   // 连续空白折成一个空格
      .trim(),
    MAX_NAME_LEN,
  );
  // 不以点或空白开头（隐藏文件语义），末尾不留点或空白
  return s.replace(/^[\s.]+/, '').replace(/[\s.]+$/, '');
}

// 取最后一个路径分量（同时兼容 / 与 \ 分隔），供界面展示与下载名使用。
export function baseName(name) {
  if (!name) return '';
  const parts = String(name).split(/[\\/]/);
  return parts[parts.length - 1] || '';
}

export async function handleUpload(request, env, ctx) {
  const actor = await resolveActor(request, env);
  if (!actor) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  if (!actor.isAdmin && !actor.permissions.canUpload) {
    return Response.json({ error: 'Upload permission denied' }, { status: 403 });
  }
  if (!actor.isAdmin) {
    const quota = await checkAndIncrementQuota(env, actor.username, actor.permissions);
    if (!quota.allowed) return Response.json({ error: quota.reason }, { status: 429 });
  }

  const config = await getUploadConfig(env);
  const allowedTypes = config.allowedTypes.split(',').map(t => t.trim());
  const maxSize = config.maxFileSize;

  const contentType = request.headers.get('Content-Type') ?? '';
  let file;
  let originalName = '';
  // 「设为公开」在上传时一次写入（前端传 makePublic=1 / X-Make-Public: 1）。
  // 此前是上传成功后再 PATCH 一次可见性：两个写者改同一张图的清单条目，
  // 上传的合并写落晚时把公开标记盖回 false（表现为「勾选公开无效」）。
  let makePublic = /^(1|true)$/i.test(request.headers.get('X-Make-Public') ?? '');
  // 流式直传：raw-body 请求（CLI --data-binary / Typora 脚本）不再把整个文件
  // arrayBuffer() 读进内存。Workers 单 isolate 内存上限 128 MB，10 MB 级文件
  // × 少量并发请求就可能顶到内存墙；request.body 直接交给 R2 put 零拷贝。
  // R2 put 传 ReadableStream 需要已知长度，Content-Length 缺失时退回缓冲。
  const contentLength = parseInt(request.headers.get('Content-Length') ?? '0', 10);
  const rawBody = !contentType.includes('multipart/form-data')
    && Number.isFinite(contentLength) && contentLength > 0
    && request.body != null;

  if (rawBody) {
    const mime = contentType.split(';')[0].trim();
    // 流式路径没有 file.name，原名只能靠 X-File-Name 请求头带入
    originalName = sanitizeOriginalName(safeDecode(request.headers.get('X-File-Name')));
    file = { type: mime, size: contentLength, stream: () => request.body, name: 'upload.' + (mime.split('/')[1] ?? 'bin') };
  } else if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    file = formData.get('file');
    if (!file) return Response.json({ error: 'Missing file field' }, { status: 400 });
    const mp = formData.get('makePublic');
    if (mp === '1' || mp === 'true') makePublic = true;
    // X-File-Name 优先（Vditor 等编辑器会改写上传文件名），否则用 File.name
    originalName = sanitizeOriginalName(
      safeDecode(request.headers.get('X-File-Name')) || (typeof file.name === 'string' ? file.name : ''),
    );
  } else {
    const buffer = await request.arrayBuffer();
    const mime = contentType.split(';')[0].trim();
    originalName = sanitizeOriginalName(safeDecode(request.headers.get('X-File-Name')));
    file = { type: mime, size: buffer.byteLength, stream: () => buffer, name: 'upload.' + (mime.split('/')[1] ?? 'bin') };
  }

  if (!allowedTypes.includes(file.type)) {
    return Response.json({ error: `File type not allowed: ${file.type}` }, { status: 415 });
  }
  const size = file.size;
  if (size > maxSize) {
    return Response.json({ error: `File too large (max ${(maxSize/1048576).toFixed(0)}MB)` }, { status: 413 });
  }

  const ext = file.type.split('/')[1].replace('jpeg','jpg').replace('svg+xml','svg');
  const key = `${Date.now()}-${randomId()}.${ext}`;
  const body = typeof file.stream === 'function' ? file.stream() : await file.arrayBuffer();

  await env.BUCKET.put(key, body, {
    httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000' },
    // 原名也落 R2 对象元数据：直接 wrangler / 控制台看 bucket 时也能对上文件
    customMetadata: { uploadedBy: actor.username, ...(originalName ? { name: originalName } : {}) },
  });

  // 流式路径下 Content-Length 只是声明值，以 R2 落盘结果为准（head 多一次读，
  // 开销可忽略）。用 || 兜底：R2 返回 0 仅可能是空文件，mock 环境对流返回 0。
  const storedSize = rawBody
    ? ((await env.BUCKET.head(key))?.size || size)
    : size;

  // R2 Class A 操作追踪（best-effort，不阻塞响应）
  ctx?.waitUntil(cfBump(env.STATS, 'cf:r2a:' + cfMonth(), 1, true));
  // 全局计数缓存增量（best-effort，不阻塞响应）
  ctx?.waitUntil(bumpGlobalStats(env, 1, storedSize));

  // Track in KV: imgmeta + userimg 单图索引 + userimgs 清单
  await trackImage(env, actor.username, key, storedSize, makePublic, originalName);

  const origin = new URL(request.url).origin;
  return Response.json({
    url: `${origin}/${key}`,
    key,
    name: originalName,        // 原始文件名（含目录前缀，供匹配）
    basename: baseName(originalName),  // 展示用
    size: storedSize,
    type: file.type,
    uploadedBy: actor.username,
  }, { status: 201 });
}

export async function trackImage(env, username, key, size, isPublic, name) {
  const uploadedAt = Date.now();
  // 原名为可选：老图片 / 未声明名的客户端上传时不写入，读侧用 key 兜底
  const withName = n => (n ? { name: n, basename: baseName(n) } : {});
  const value = { uploadedAt, size, ...withName(name) };
  // 单图索引 + imgmeta：两个不同的键各写一次，不存在读改写，永不互相覆盖。
  // 单图索引是「该用户拥有这张图」的权威来源（/list 靠它自愈清单）。
  await putImageRecords(env, key, value, { isPublic, owner: username });
  // userimgs 清单：读优化缓存（一次 get 拿全表）。合并 + 读后校验 + 重试；
  // 返回 false 时数据并未丢失，下次 /list 的 repairUserManifest 会补进来。
  await mergeUserImgEntry(env, username, key, { size, uploadedAt, isPublic, ...withName(name) }, { ensure: true });
}

async function resolveActor(request, env) {
  if (await checkAdmin(request, env)) return { isAdmin: true, username: env.ADMIN_USERNAME ?? 'admin', permissions: null };
  const user = await verifyUserToken(request, env);
  if (user) return { isAdmin: false, ...user };
  return null;
}

function randomId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(6))).map(b => b.toString(16).padStart(2, '0')).join('');
}
