import { unzipSync } from 'fflate';
import { cfBump, cfMonth } from '../admin/cfCounters.js';

const PROTO_MAX_SIZE_DEFAULT = 50 * 1024 * 1024; // 50 MB

// 查询策略缓存（src/proto/serve.js 里的 __proto-policy 键）：重传后必须作废，
// 否则入口快路径/版本化资产会继续按旧 stamp 服务最长 300 秒。
// 键构造与 serve.js 的 policyKey 保持一致（同源同路径），best-effort 失败不影响上传。
async function invalidateProtoPolicy(request, protoId) {
  try {
    const cache = (typeof caches !== 'undefined' && caches.default) ? caches.default : null;
    if (!cache) return;
    const key = new Request(new URL('/__proto-policy/' + encodeURIComponent(protoId),
      request.url).href, { method: 'GET' });
    await cache.delete(key);
  } catch {}
}

function randomId() {
  return Math.random().toString(36).slice(2, 9);
}

// Detect entry point from extracted file paths
function detectEntryPoint(paths) {
  // Root-level file check helpers
  const rootHtml = paths.filter(p => !p.includes('/') && p.toLowerCase().endsWith('.html'));

  if (rootHtml.find(p => p.toLowerCase() === 'start.html')) return 'start.html';
  if (rootHtml.find(p => p.toLowerCase() === 'index.html')) return 'index.html';
  if (rootHtml.length) return rootHtml[0];

  // Also check one level deep (some zips wrap in a folder)
  const oneLevelHtml = paths.filter(p => {
    const parts = p.split('/');
    return parts.length === 2 && parts[1].toLowerCase().endsWith('.html');
  });
  if (oneLevelHtml.find(p => p.toLowerCase().endsWith('start.html'))) {
    return oneLevelHtml.find(p => p.toLowerCase().endsWith('start.html'));
  }
  if (oneLevelHtml.find(p => p.toLowerCase().endsWith('index.html'))) {
    return oneLevelHtml.find(p => p.toLowerCase().endsWith('index.html'));
  }
  return null;
}

// Strip common top-level wrapper folder if all paths share one
function stripTopFolder(files) {
  const paths = Object.keys(files);
  if (!paths.length) return files;
  // Find common prefix segment
  const first = paths[0].split('/')[0];
  if (paths.every(p => p.startsWith(first + '/'))) {
    const stripped = {};
    for (const [p, data] of Object.entries(files)) {
      stripped[p.slice(first.length + 1)] = data;
    }
    return stripped;
  }
  return files;
}


// ── 资源打包清单 ────────────────────────────────────────────────────────────
// 一个 Axure 原型要发十几个资源请求，每个都要进 Worker 做一次访问判定，
// 浏览器同域并发只有 6 路 —— 这就是「原型打开 2–9 秒」的根因
//（见 src/proto/serve.js 末尾的 bundle 说明）。
//
// 上传时把「哪些文件该打包」算出来存进 meta.bundle，读时一次取回。
// 只收录文本类资源：HTML 入口会做标题注入、图片走原路径更划算（可被浏览器
// 各自缓存、也不必 base64 塞进 JSON）。
// 只打包「启动时必须同步拿到」的脚本与样式：它们数量少、体积固定、
// 是首屏阻塞项。图片类资源（尤其 .svg）绝不能进包 —— 实测某个原型有 717 个
// SVG 切图，全打包成 7 MB，比原来 16 个请求还糟；图片本来就该按需、懒加载、
// 各自被浏览器缓存。
const BUNDLE_EXTS = new Set(['css', 'js', 'mjs']);

// 打包体积上限：超过就不打包（宁可走原路径，也不能让首屏下载几十 MB）
const BUNDLE_MAX_BYTES = 2 * 1024 * 1024;

// 单个文件上限：超大 JS（如某些工具链产物）打包会拖慢首屏，留给浏览器单独取
const BUNDLE_MAX_FILE_BYTES = 1024 * 1024;

/**
 * 从原型文件清单里挑出可打包的资源（返回相对路径数组）。
 *
 * @param {string[]} paths
 * @param {Record<string, number>} [sizes] 可选：路径 → 字节数（有则按体积过滤）
 */
export function computeBundleList(paths, sizes = null) {
  const out = [];
  for (const p of paths ?? []) {
    if (!p || p.includes('..') || p.startsWith('/')) continue;
    const ext = p.split('.').pop()?.toLowerCase() ?? '';
    // 入口 HTML 不打包：它要单独回一份可注入标题的文档
    if (!BUNDLE_EXTS.has(ext)) continue;
    if (sizes) {
      const n = Number(sizes[p]) || 0;
      if (n > BUNDLE_MAX_FILE_BYTES) continue;
    }
    out.push(p);
  }
  return out.sort();
}

/**
 * 打包清单的最终裁决：在 computeBundleList 之上再做总量闸门。
 * 体积未知时（老原型）只按扩展名过滤，总量由 R2 侧兜底（超限则不打包）。
 */
export function pickBundleFiles(paths, sizes = null) {
  const list = computeBundleList(paths, sizes);
  if (!sizes || !list.length) return list;
  const total = list.reduce((s, p) => s + (Number(sizes[p]) || 0), 0);
  return total <= BUNDLE_MAX_BYTES ? list : [];
}

export async function handleProtoUpload(request, env, owner) {
  const maxSize = parseInt(env.PROTO_MAX_SIZE ?? PROTO_MAX_SIZE_DEFAULT);

  let formData;
  try { formData = await request.formData(); }
  catch { return Response.json({ error: 'Invalid form data' }, { status: 400 }); }

  const file       = formData.get('file');
  const title      = (formData.get('title') || '').trim().slice(0, 100) || '未命名原型';
  const password   = formData.get('password') || '';
  const existingId = (formData.get('protoId') || '').trim();  // update mode if set

  if (!file || typeof file === 'string') {
    return Response.json({ error: 'Missing file field' }, { status: 400 });
  }

  // Validate MIME
  const mime = file.type || '';
  const validMimes = ['application/zip', 'application/x-zip-compressed', 'application/x-zip', 'application/octet-stream'];
  const isZipName  = file.name?.toLowerCase().endsWith('.zip');
  if (!validMimes.includes(mime) && !isZipName) {
    return Response.json({ error: '仅支持 ZIP 格式文件' }, { status: 400 });
  }

  // Validate size
  if (file.size > maxSize) {
    return Response.json({
      error: `文件过大，上限 ${Math.round(maxSize / 1048576)} MB，当前 ${(file.size / 1048576).toFixed(1)} MB`
    }, { status: 413 });
  }

  // If update mode, verify ownership and load existing meta
  let existingMeta = null;
  if (existingId) {
    existingMeta = await env.STATS.get(`proto:${existingId}`, 'json');
    if (!existingMeta) return Response.json({ error: 'Prototype not found' }, { status: 404 });
    if (existingMeta.owner !== owner) return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Read bytes
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Extract ZIP
  let rawFiles;
  try { rawFiles = unzipSync(bytes); }
  catch (e) { return Response.json({ error: '解压失败，请确认文件为有效 ZIP：' + e.message }, { status: 400 }); }

  // Fix filename encoding: if the ZIP doesn't have the UTF-8 flag (bit 11), fflate
  // reads Chinese/non-ASCII filenames as Latin-1. We detect this by checking if all
  // code points are ≤ 255 (Latin-1 range) and try to re-decode as UTF-8.
  function fixZipEncoding(path) {
    if ([...path].every(c => c.charCodeAt(0) <= 255)) {
      try {
        const b = new Uint8Array([...path].map(c => c.charCodeAt(0)));
        const decoded = new TextDecoder('utf-8', { fatal: true }).decode(b);
        if (decoded !== path) return decoded;
      } catch {}
    }
    return path;
  }
  const fixedFiles = {};
  for (const [p, data] of Object.entries(rawFiles)) fixedFiles[fixZipEncoding(p)] = data;

  // Strip wrapper folder if present
  const files = stripTopFolder(fixedFiles);

  // Security: filter dangerous paths
  const safePaths = Object.keys(files).filter(p => {
    if (!p || p.startsWith('/') || p.includes('..') || p.endsWith('/')) return false;
    // Skip macOS metadata
    if (p.startsWith('__MACOSX/') || p.includes('/.DS_Store') || p === '.DS_Store') return false;
    return true;
  });

  if (!safePaths.length) {
    return Response.json({ error: 'ZIP 中未找到有效文件' }, { status: 400 });
  }

  // Detect entry point
  const entryPoint = detectEntryPoint(safePaths);
  if (!entryPoint) {
    return Response.json({ error: '未找到原型入口文件（start.html 或 index.html）' }, { status: 400 });
  }

  // Determine protoId
  const protoId = existingId || `${Date.now()}-${randomId()}`;

  // If update: delete old R2 files first
  if (existingMeta) {
    const prefix = `proto/${protoId}/`;
    let cursor;
    do {
      const result = await env.BUCKET.list({ prefix, limit: 1000, cursor });
      if (result.objects.length) {
        // R2 批量删除：单次 delete 接受 ≤1000 个 key = 1 个 subrequest
        await env.BUCKET.delete(result.objects.map(o => o.key));
      }
      cursor = result.truncated ? result.cursor : undefined;
    } while (cursor);
    // 单次上传整原型替换：作废旧增量 manifest，下次 chunked 更新退化为全量（保证正确性）
    try { await env.BUCKET.delete(`manifests/${protoId}.json`); } catch {}
  }

  // Upload all files to R2 in batches of 20
  let totalSize = 0;
  const BATCH = 20;
  for (let i = 0; i < safePaths.length; i += BATCH) {
    const batch = safePaths.slice(i, i + BATCH);
    await Promise.all(batch.map(async p => {
      const data = files[p];
      totalSize += data.byteLength;
      const ext  = p.split('.').pop()?.toLowerCase() ?? '';
      const ct   = MIME_MAP[ext] ?? 'application/octet-stream';
      const cacheCtrl = ext === 'html' || ext === 'htm'
        ? 'no-cache'
        : 'public, max-age=31536000';
      await env.BUCKET.put(`proto/${protoId}/${p}`, data, {
        httpMetadata: { contentType: ct, cacheControl: cacheCtrl },
      });
    }));
  }

  // Validate and sanitize password
  const cleanPwd = password
    ? String(password).replace(/[^A-Za-z0-9]/g, '').slice(0, 6)
    : '';

  const now = Date.now();

  // Build version entry
  const newVersion = existingMeta ? (existingMeta.version ?? 1) + 1 : 1;
  const versionEntry = { v: newVersion, at: now, files: safePaths.length, size: totalSize };

  // Build versions array (cap at 20)
  let versions = existingMeta ? [...(existingMeta.versions ?? [])] : [];
  versions.push(versionEntry);
  if (versions.length > 20) versions = versions.slice(versions.length - 20);

  // Determine password/expiry: preserve existing if updating and no new password provided
  let accessPassword = cleanPwd;
  let passwordExpiry = null;

  if (existingMeta) {
    // Preserve existing password settings unless new password was explicitly provided in form
    if (!cleanPwd && existingMeta.accessPassword) {
      accessPassword = existingMeta.accessPassword;
      passwordExpiry = existingMeta.passwordExpiry ?? null;
    } else if (cleanPwd) {
      // New password on update: don't reset expiry unless it was already set
      passwordExpiry = existingMeta.passwordExpiry ?? (now + 14 * 86400 * 1000);
    }
    // isPrivate preserved from existing
  } else {
    // Create mode: set default expiry of 14 days if password set
    if (cleanPwd) {
      passwordExpiry = now + 14 * 86400 * 1000;
    }
  }

  // Store metadata in KV
  const meta = existingMeta
    ? {
        ...existingMeta,
        entryPoint,
        fileCount: safePaths.length,
        totalSize,
        updatedAt: now,
        version: newVersion,
        versions,
        bundle: pickBundleFiles(safePaths),
        ...(accessPassword ? { accessPassword, passwordExpiry } : { accessPassword: undefined, passwordExpiry: null }),
      }
    : {
        protoId,
        title,
        owner,
        entryPoint,
        fileCount: safePaths.length,
        totalSize,
        createdAt: now,
        updatedAt: now,
        version: 1,
        versions: [versionEntry],
        bundle: pickBundleFiles(safePaths),
        isPrivate: false,
        ...(accessPassword ? { accessPassword, passwordExpiry } : {}),
      };

  // Clean up undefined fields
  if (!meta.accessPassword) {
    delete meta.accessPassword;
    meta.passwordExpiry = null;
  }
  // 更新内容即视为复活：清除回收站标记，避免更新后仍被列表过滤而「消失」
  // （与分片通道 handleProtoFinalize 的处理保持一致；Agent 走本单 ZIP 通道，
  // 漏清会：返回新地址、直链可开、但所有列表都查不到）
  if (meta.deletedAt) delete meta.deletedAt;

  await env.STATS.put(`proto:${protoId}`, JSON.stringify(meta));

  // Store file path list for this version (used by version diff viewer)
  // Key is kept separate to stay within KV 25KB per-value limit
  await env.STATS.put(`proto:vfiles:${protoId}:v${newVersion}`, JSON.stringify(safePaths));

  // 版本已变：作废策略缓存，下一次入口/资产请求按新 stamp 判定
  await invalidateProtoPolicy(request, protoId);

  return Response.json({
    protoId,
    title: meta.title,
    url: `/proto/${protoId}/`,
    fileCount: safePaths.length,
    totalSize,
    version: newVersion,
  }, { status: existingMeta ? 200 : 201 });
}

// ── Chunked upload API ───────────────────────────────────────────────────────
// 免费版预算：每批 ≤ 45 文件（45 R2 put + staging KV get + cfBump KV get/put
// = 48 ≤ 50 subrequest/request）。客户端（src/page.js）按「文件数 ≤ 45 且
// 单批 ≤ 24 MB」双约束切批，服务端不依赖具体批大小。

/**
 * Step 1 — init: create/validate protoId, store lightweight staging record.
 * Body: { title, password, entryPoint, totalSize, protoId? }
 */
export async function handleProtoUploadInit(request, env, owner) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { title, password, protoId: existingId, entryPoint, totalSize } = body;
  if (!entryPoint) return Response.json({ error: '未找到入口文件（start.html 或 index.html）' }, { status: 400 });

  // Update mode: verify ownership
  if (existingId) {
    const meta = await env.STATS.get(`proto:${existingId}`, 'json');
    if (!meta) return Response.json({ error: 'Prototype not found' }, { status: 404 });
    if (meta.owner !== owner) return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const protoId = existingId || `${Date.now()}-${randomId()}`;
  const cleanPwd = password ? String(password).replace(/[^A-Za-z0-9]/g, '').slice(0, 6) : '';

  // Store staging record (auto-expires in 1 h via KV TTL)
  await env.STATS.put(`proto:staging:${protoId}`, JSON.stringify({
    owner,
    existingId: existingId || null,
    entryPoint,
    totalSize: Number(totalSize) || 0,
    title: String(title || '').trim().slice(0, 100) || '未命名原型',
    password: cleanPwd,
    createdAt: Date.now(),
  }), { expirationTtl: 3600 });

  // 增量上传：更新模式下回传上一版本的内容指纹清单（{path: hash}），
  // 客户端据此只上传新增/变更的文件。首次启用或旧原型无清单时返回 null（退化为全量上传）。
  let manifest = null;
  if (existingId) {
    manifest = await readManifest(env, protoId);
  }

  return Response.json({ ok: true, protoId, manifest });
}

// 内容指纹清单存于 R2 `manifests/{protoId}.json`（KV 25KB 单值上限放不下大原型清单）。
export async function readManifest(env, protoId) {
  try {
    const obj = await env.BUCKET.get(`manifests/${protoId}.json`);
    if (!obj) return null;
    const data = await obj.json();
    return data && typeof data === 'object' ? data : null;
  } catch { return null; }
}

/**
 * Step 2 — files: upload one batch (客户端按 ≤45 文件且 ≤24 MB 切批，服务端不依赖具体批大小).
 * FormData fields: protoId, paths[] (strings), files[] (blobs)
 */
export async function handleProtoFileBatch(request, env, owner) {
  let fd;
  try { fd = await request.formData(); } catch { return Response.json({ error: 'Invalid form data' }, { status: 400 }); }

  const protoId = fd.get('protoId');
  if (!protoId) return Response.json({ error: 'Missing protoId' }, { status: 400 });

  // Verify session
  const staging = await env.STATS.get(`proto:staging:${protoId}`, 'json');
  if (!staging) return Response.json({ error: '上传会话已过期，请重新上传' }, { status: 410 });
  if (staging.owner !== owner) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const paths = fd.getAll('paths[]');
  const files = fd.getAll('files[]');
  // 上行压缩标记：与 paths[]/files[] 同序，'gzip' 表示该文件在浏览器端已压缩。
  // 服务端不做解压——原样存进 R2，回放时带上 Content-Encoding: gzip，
  // 由浏览器自己解。这样省的是跨境上行字节，服务端零额外 CPU。
  const encs = fd.getAll('enc[]');

  // 先过滤（安全检查 + 配对），再按组限流写入。
  // 原实现 Promise.all 让整批所有文件的 arrayBuffer() 同时物化在内存里，
  // 一批大图就能把 128 MB 的 isolate 顶到内存墙；改用 file.stream() 直传
  // R2（零整文件物化），并发固定为每组 4 个，组间串行，错误语义不变。
  const items = [];
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i], file = files[i];
    if (!path || path.startsWith('/') || path.includes('..') || path.endsWith('/')) continue;
    if (path.startsWith('__MACOSX/') || path.includes('/.DS_Store') || path === '.DS_Store') continue;
    if (!file) continue;
    items.push([path, file, encs[i] === 'gzip' ? 'gzip' : '']);
  }

  const PUT_CONCURRENCY = 4;
  let uploaded = 0;
  for (let g = 0; g < items.length; g += PUT_CONCURRENCY) {
    await Promise.all(items.slice(g, g + PUT_CONCURRENCY).map(async ([path, file, enc]) => {
      const ext = path.split('.').pop()?.toLowerCase() ?? '';
      const ct = MIME_MAP[ext] ?? 'application/octet-stream';
      const cacheCtrl = ext === 'html' || ext === 'htm' ? 'no-cache' : 'public, max-age=31536000';
      const body = typeof file.stream === 'function' ? file.stream() : await file.arrayBuffer();
      // contentEncoding 是 R2 的一等字段，回放侧优先认它；customMetadata.ce 留作
      // 兼容（本地磁盘适配器没有 content_encoding 列）。两个都写：线上实测这条
      // 流式 put 路径的 customMetadata 会丢，只写它等于没写（原型因此白屏过）。
      await env.BUCKET.put(`proto/${protoId}/${path}`, body, {
        httpMetadata: { contentType: ct, cacheControl: cacheCtrl, ...(enc ? { contentEncoding: enc } : {}) },
        ...(enc ? { customMetadata: { ce: enc } } : {}),
      });
      uploaded++;
    }));
  }

  // R2 Class A 追踪：批量上传的文件数
  if (uploaded > 0) {
    await cfBump(env.STATS, 'cf:r2a:' + cfMonth(), uploaded, true);
  }

  return Response.json({ ok: true, uploaded });
}

/**
 * Step 3 — finalize: write KV metadata and clean up staging.
 * Body: { protoId, filePaths: string[] }
 */
export async function handleProtoFinalize(request, env, owner) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { protoId, filePaths, manifest } = body;
  if (!protoId) return Response.json({ error: 'Missing protoId' }, { status: 400 });

  const staging = await env.STATS.get(`proto:staging:${protoId}`, 'json');
  if (!staging) return Response.json({ error: '上传会话已过期，请重新上传' }, { status: 410 });
  if (staging.owner !== owner) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const existingMeta = staging.existingId ? await env.STATS.get(`proto:${protoId}`, 'json') : null;
  const safePaths = Array.isArray(filePaths) ? filePaths : [];

  // 增量上传：删除上一版本存在、但本次清单中已不存在的 orphan 文件（同时修复历史 orphan）。
  if (existingMeta) {
    const prevVer  = existingMeta.version ?? 1;
    const prevList = await env.STATS.get(`proto:vfiles:${protoId}:v${prevVer}`, 'json');
    if (Array.isArray(prevList)) {
      const nowSet  = new Set(safePaths);
      const orphans = prevList.filter(p => !nowSet.has(p)).map(p => `proto/${protoId}/${p}`);
      // R2 批量删除：每次 ≤1000 key = 1 个 subrequest
      for (let i = 0; i < orphans.length; i += 1000) {
        try { await env.BUCKET.delete(orphans.slice(i, i + 1000)); } catch {}
      }
    }
  }
  const now = Date.now();
  const newVersion = existingMeta ? (existingMeta.version ?? 1) + 1 : 1;
  const versionEntry = { v: newVersion, at: now, files: safePaths.length, size: staging.totalSize };

  let versions = existingMeta ? [...(existingMeta.versions ?? [])] : [];
  versions.push(versionEntry);
  if (versions.length > 20) versions = versions.slice(versions.length - 20);

  // Password / expiry logic (mirrors handleProtoUpload)
  const cleanPwd = staging.password || '';
  let accessPassword = cleanPwd;
  let passwordExpiry = null;
  if (existingMeta) {
    if (!cleanPwd && existingMeta.accessPassword) {
      accessPassword = existingMeta.accessPassword;
      passwordExpiry = existingMeta.passwordExpiry ?? null;
    } else if (cleanPwd) {
      passwordExpiry = existingMeta.passwordExpiry ?? (now + 14 * 86400 * 1000);
    }
  } else if (cleanPwd) {
    passwordExpiry = now + 14 * 86400 * 1000;
  }

  const meta = existingMeta
    ? { ...existingMeta, entryPoint: staging.entryPoint, fileCount: safePaths.length, totalSize: staging.totalSize, updatedAt: now, version: newVersion, versions, bundle: computeBundleList(safePaths) }
    : { protoId, title: staging.title, owner, entryPoint: staging.entryPoint, fileCount: safePaths.length, totalSize: staging.totalSize, createdAt: now, updatedAt: now, version: 1, versions: [versionEntry], bundle: pickBundleFiles(safePaths, manifest), isPrivate: false };

  if (accessPassword) { meta.accessPassword = accessPassword; meta.passwordExpiry = passwordExpiry; }
  else { delete meta.accessPassword; meta.passwordExpiry = null; }
  // 更新内容即视为复活：清除回收站标记，避免更新后仍被列表过滤而「消失」
  if (meta.deletedAt) delete meta.deletedAt;

  const tasks = [
    env.STATS.put(`proto:${protoId}`, JSON.stringify(meta)),
    env.STATS.put(`proto:vfiles:${protoId}:v${newVersion}`, JSON.stringify(safePaths)),
    env.STATS.delete(`proto:staging:${protoId}`),
  ];
  // 写入本次内容指纹清单，供下次增量上传 diff（仅保留本次实际存在的文件）
  if (manifest && typeof manifest === 'object') {
    const clean = {};
    for (const p of safePaths) if (manifest[p] !== undefined) clean[p] = manifest[p];
    tasks.push(env.BUCKET.put(`manifests/${protoId}.json`, JSON.stringify(clean), {
      httpMetadata: { contentType: 'application/json' },
    }));
  }
  await Promise.all(tasks);

  // 版本已变：作废策略缓存（与 ZIP 单包通道一致）
  await invalidateProtoPolicy(request, protoId);

  return Response.json({
    protoId, title: meta.title, url: `/proto/${protoId}/`,
    fileCount: safePaths.length, totalSize: staging.totalSize, version: newVersion, entryPoint: staging.entryPoint,
  }, { status: existingMeta ? 200 : 201 });
}

// Shared MIME map used by serve.js too
export const MIME_MAP = {
  html: 'text/html; charset=utf-8',
  htm:  'text/html; charset=utf-8',
  css:  'text/css',
  js:   'application/javascript',
  mjs:  'application/javascript',
  json: 'application/json',
  xml:  'application/xml',
  txt:  'text/plain; charset=utf-8',
  png:  'image/png',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  gif:  'image/gif',
  webp: 'image/webp',
  svg:  'image/svg+xml',
  ico:  'image/x-icon',
  avif: 'image/avif',
  woff:  'font/woff',
  woff2: 'font/woff2',
  ttf:   'font/ttf',
  otf:   'font/otf',
  eot:   'application/vnd.ms-fontobject',
  mp4:   'video/mp4',
  webm:  'video/webm',
  mp3:   'audio/mpeg',
  wav:   'audio/wav',
  pdf:   'application/pdf',
  zip:   'application/zip',
};
