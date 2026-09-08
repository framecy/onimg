// 前端原型上传共享引擎 —— page.js（用户端）与 admin-page.js（管理端）共用。
//
// 导出源码字符串，由两个页面以 <script>${PROTO_ENGINE_JS}</script> 注入
// （与 fflate-inline.js 的 FFLATE_UMD 同一模式），注入后页面脚本作用域内
// 可直接调用 _protoChunkedUpload 等函数。
//
// 注意：字符串内不使用反引号与 ${（用 + 拼接），避免与页面外层模板字面量冲突。
//
// 引擎特性：双约束切批（文件数 ≤ 45 且单批 ≤ 24 MB）、3 路批间并发、
// 单批 3 次指数退避重试（4xx 除 429 不重试）、增量上传（内容指纹 diff）。
// 认证与解压通过参数注入：authToken + fetchImpl（用户端传 fetch，
// 管理端传 adminFetch 以复用 401 处理），unzip（用户端传 Worker 解压，
// 管理端传同步解压）。
export const PROTO_ENGINE_JS = `
// ── 原型上传共享引擎（page.js / admin-page.js 共用） ─────────────────────────
// 双约束切批：文件数受服务端 subrequest 预算约束（45 R2 put + staging KV 读取
// + cfBump 两次 KV = 48 ≤ 免费版 50），字节数受请求体与内存约束（Cloudflare
// 免费站点套餐单请求体上限 100 MB；服务端批内按组物化，单 isolate 上限 128 MB）。
// 只按个数切会让「45 张 3MB 大图」凑成 135 MB 的一批，内存和请求体双双爆掉。
var PROTO_BATCH_MAX_FILES = 45;
var PROTO_BATCH_MAX_BYTES = 24 * 1024 * 1024;
function _protoPlanBatches(paths, files) {
  var batches = [];
  var cur = [], curBytes = 0;
  for (var i = 0; i < paths.length; i++) {
    var p = paths[i];
    var size = (files[p] && files[p].byteLength) || 0;
    if (cur.length && (cur.length >= PROTO_BATCH_MAX_FILES || curBytes + size > PROTO_BATCH_MAX_BYTES)) {
      batches.push(cur); cur = []; curBytes = 0;
    }
    cur.push(p); curBytes += size;
  }
  if (cur.length) batches.push(cur);
  return batches;
}

function _protoDetectEntry(paths) {
  var rootHtml = paths.filter(function (p) { return !p.includes('/') && p.toLowerCase().endsWith('.html'); });
  var find = function (arr, name) { return arr.find(function (p) { return p.toLowerCase() === name; }); };
  if (find(rootHtml, 'start.html')) return 'start.html';
  if (find(rootHtml, 'index.html')) return 'index.html';
  if (rootHtml.length) return rootHtml[0];
  var deep = paths.filter(function (p) { var s = p.split('/'); return s.length === 2 && s[1].toLowerCase().endsWith('.html'); });
  return deep.find(function (p) { return p.toLowerCase().endsWith('start.html'); })
      || deep.find(function (p) { return p.toLowerCase().endsWith('index.html'); })
      || null;
}

// ZIP 内文件名可能是 Latin-1 误编码的 UTF-8，尝试修正
function _protoFixEnc(path) {
  if ([...path].every(function (c) { return c.charCodeAt(0) <= 255; })) {
    try {
      var b = new Uint8Array([...path].map(function (c) { return c.charCodeAt(0); }));
      var d = new TextDecoder('utf-8', { fatal: true }).decode(b);
      if (d !== path) return d;
    } catch (e) {}
  }
  return path;
}

function _protoStrip(files) {
  var paths = Object.keys(files); if (!paths.length) return files;
  var first = paths[0].split('/')[0];
  if (paths.every(function (p) { return p.startsWith(first + '/'); })) {
    var out = {}; for (var p in files) out[p.slice(first.length + 1)] = files[p]; return out;
  }
  return files;
}

function _protoFilter(files) {
  return Object.keys(files).filter(function (p) {
    if (!p || p.startsWith('/') || p.includes('..') || p.endsWith('/')) return false;
    if (p.startsWith('__MACOSX/') || p.includes('/.DS_Store') || p === '.DS_Store') return false;
    return true;
  });
}

// 内容指纹：FNV-1a 32-bit（含长度前缀防碰撞），返回 hex 字符串。
// 仅用于「内容是否变化」的快速判断，非加密用途。
function _fnv1a(bytes) {
  var h = 0x811c9dc5;
  for (var i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return (bytes.length >>> 0).toString(16) + '-' + h.toString(16);
}

// 共享分片上传引擎。
// 参数：
//   zipFile / filesMap  二选一：ZIP 文件对象，或 {相对路径: Uint8Array}
//   unzip(bytes, zipFile) -> Promise<files>   解压实现（两端各自注入）
//   authToken / fetchImpl                     认证与请求实现（两端各自注入）
//   setStatus(msg, pct)                       进度回调
//   initUrl / filesUrl / finalizeUrl          三段接口地址（两端不同）
async function _protoChunkedUpload(opts) {
  var zipFile = opts.zipFile, filesMap = opts.filesMap, unzip = opts.unzip;
  var title = opts.title, password = opts.password, existingProtoId = opts.existingProtoId;
  var authToken = opts.authToken;
  var doFetch = opts.fetchImpl || fetch;
  var setStatus = opts.setStatus || function () {};
  var initUrl = opts.initUrl, filesUrl = opts.filesUrl, finalizeUrl = opts.finalizeUrl;
  var CONCURRENCY = 3;  // 批间并发：多个独立 Worker 调用并行，各自独立预算

  var files;
  if (filesMap) {
    files = filesMap;
    setStatus('分析文件结构… ' + Object.keys(files).length + ' 个文件', 8);
  } else {
    setStatus('正在解压 ZIP…', 3);
    var bytes = new Uint8Array(await zipFile.arrayBuffer());
    try {
      var raw = await unzip(bytes, zipFile);
      var fixed = {}; for (var p in raw) fixed[_protoFixEnc(p)] = raw[p];
      files = _protoStrip(fixed);
    } catch (e) { throw new Error('解压失败：' + (e && e.message || e)); }
    setStatus('分析文件结构… 发现 ' + Object.keys(files).length + ' 个文件', 8);
  }

  var safePaths = _protoFilter(files);
  if (!safePaths.length) throw new Error('ZIP 中未找到有效文件');
  var entryPoint = _protoDetectEntry(safePaths);
  if (!entryPoint) throw new Error('未找到入口文件（start.html 或 index.html）');
  var totalSize = safePaths.reduce(function (s, p) { return s + ((files[p] && files[p].byteLength) || 0); }, 0);

  // 计算本次所有文件的内容指纹（用于增量 diff 与写回 manifest）
  var newManifest = {};
  for (var pi = 0; pi < safePaths.length; pi++) newManifest[safePaths[pi]] = _fnv1a(files[safePaths[pi]] || new Uint8Array(0));

  // Step 1: init（更新模式下后端回传上一版本 manifest）
  setStatus('初始化上传会话…', 12);
  var initRes = await doFetch(initUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken },
    body: JSON.stringify({ title: title, password: password, entryPoint: entryPoint, totalSize: totalSize, protoId: existingProtoId || undefined }),
  });
  var initData = await initRes.json().catch(function () { return {}; });
  if (!initRes.ok) throw new Error(initData.error || '初始化失败');
  var protoId = initData.protoId, prevManifest = initData.manifest;

  // 增量上传：仅上传新增 / 内容变更的文件。无历史 manifest 时退化为全量上传。
  var uploadPaths = prevManifest
    ? safePaths.filter(function (p) { return prevManifest[p] !== newManifest[p]; })
    : safePaths;
  var skipped = safePaths.length - uploadPaths.length;

  // Step 2: upload in batches —— 双约束切批 + 并发池 + 单批重试
  var batches = _protoPlanBatches(uploadPaths, files);
  var totalBatches = batches.length;
  if (skipped > 0) setStatus('增量上传：' + uploadPaths.length + ' 个变更，跳过 ' + skipped + ' 个未变文件', 15);

  // 单批上传：最多重试 3 次（指数退避）；4xx（除 429）不重试
  async function uploadBatch(b) {
    var batchPaths = batches[b];
    var fd = new FormData();
    fd.append('protoId', protoId);
    batchPaths.forEach(function (p) { fd.append('paths[]', p); fd.append('files[]', new Blob([files[p]]), p); });
    var lastErr = null;
    for (var attempt = 0; attempt < 3; attempt++) {
      try {
        var bRes = await doFetch(filesUrl, { method: 'POST', headers: { 'Authorization': 'Bearer ' + authToken }, body: fd });
        if (bRes.ok) return;
        var d = await bRes.json().catch(function () { return {}; });
        lastErr = new Error(d.error || ('批次 ' + (b + 1) + ' 上传失败'));
        if (bRes.status >= 400 && bRes.status < 500 && bRes.status !== 429) throw lastErr; // 不可重试
      } catch (e) { lastErr = e; }
      if (attempt < 2) await new Promise(function (r) { setTimeout(r, 400 * (attempt + 1)); });
    }
    throw lastErr || new Error('批次 ' + (b + 1) + ' 上传失败');
  }

  // 并发池：CONCURRENCY 个 worker 从队列取批次；任一批彻底失败则中止
  var queue = [];
  for (var qi = 0; qi < totalBatches; qi++) queue.push(qi);
  var done = 0, abortErr = null;
  async function poolWorker() {
    while (queue.length && !abortErr) {
      var b = queue.shift();
      try { await uploadBatch(b); }
      catch (e) { abortErr = e; return; }
      done++;
      var pct = Math.round(15 + (done / totalBatches) * 75);
      var filesDone = batches.slice(0, done).reduce(function (s, b) { return s + b.length; }, 0);
      setStatus('已上传 ' + done + '/' + totalBatches + ' 批（' + filesDone + ' / ' + uploadPaths.length + ' 个变更文件 · 并发 ' + CONCURRENCY + '）', pct);
    }
  }
  if (totalBatches > 0) {
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, totalBatches) }, function () { return poolWorker(); }));
    if (abortErr) throw abortErr;
  }

  // Step 3: finalize（filePaths 记录完整清单，manifest 写回供下次 diff）
  setStatus('正在写入元数据…', 93);
  var fRes = await doFetch(finalizeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken },
    body: JSON.stringify({ protoId: protoId, filePaths: safePaths, manifest: newManifest }),
  });
  var fData = await fRes.json().catch(function () { return {}; });
  if (!fRes.ok) throw new Error(fData.error || '最终化失败');
  setStatus(skipped > 0
    ? '完成！增量上传 ' + uploadPaths.length + ' 个文件（节省 ' + skipped + ' 个）'
    : '上传完成！', 100);
  return Object.assign({}, fData, { protoId: protoId, safePaths: safePaths, totalSize: totalSize });
}
`;
