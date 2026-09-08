import { verifyUserToken, checkAndIncrementQuota } from './user-auth.js';
import { verifyAdminToken as checkAdmin } from './admin/auth.js';
import { getUploadConfig } from './admin/config-handler.js';
import { cfBump, cfMonth } from './admin/cfCounters.js';
import { bumpGlobalStats } from './admin/gstats.js';

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
    file = { type: mime, size: contentLength, stream: () => request.body, name: 'upload.' + (mime.split('/')[1] ?? 'bin') };
  } else if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    file = formData.get('file');
    if (!file) return Response.json({ error: 'Missing file field' }, { status: 400 });
  } else {
    const buffer = await request.arrayBuffer();
    const mime = contentType.split(';')[0].trim();
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
    customMetadata: { uploadedBy: actor.username },
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

  // Track in KV: imgmeta + userimgs
  await trackImage(env, actor.username, key, storedSize, false); // default private

  const origin = new URL(request.url).origin;
  return Response.json({ url: `${origin}/${key}`, key, size: storedSize, type: file.type, uploadedBy: actor.username }, { status: 201 });
}

export async function trackImage(env, username, key, size, isPublic) {
  const uploadedAt = Date.now();
  const imgsKv = 'userimgs:' + username;
  const list = await env.STATS.get(imgsKv, 'json') ?? [];
  list.unshift({ key, size, uploadedAt, isPublic });
  await Promise.all([
    env.STATS.put(imgsKv, JSON.stringify(list)),
    env.STATS.put('imgmeta:' + key, JSON.stringify({ uploadedAt }), {
      metadata: { isPublic, owner: username },
    }),
  ]);
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
