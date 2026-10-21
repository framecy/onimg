import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { hashPassword, randomSalt } from '../../src/user-auth.js';
import { createSqliteKv } from '../../src/kv-sqlite.js';
import { createDiskBucket } from '../../src/storage-disk.js';
import { D1_SCHEMA } from '../../src/schema.js';

// In-memory KV Namespace
export function createKV() {
  const store = new Map();    // key -> string value
  const metaStore = new Map(); // key -> metadata object
  return {
    async get(key, type) {
      const val = store.get(key) ?? null;
      if (type === 'json' && val !== null) {
        try { return JSON.parse(val); } catch { return null; }
      }
      return val;
    },
    async getWithMetadata(key, type) {
      const raw = store.get(key) ?? null;
      let value = raw;
      if (type === 'json' && raw !== null) {
        try { value = JSON.parse(raw); } catch { value = null; }
      }
      return { value, metadata: metaStore.get(key) ?? null };
    },
    async put(key, value, opts = {}) {
      store.set(key, String(value));
      if (opts.metadata !== undefined) metaStore.set(key, opts.metadata);
    },
    async delete(key) {
      store.delete(key);
      metaStore.delete(key);
    },
    async list(opts = {}) {
      const prefix = opts.prefix ?? '';
      const keys = [...store.keys()]
        .filter(k => k.startsWith(prefix))
        .map(name => ({ name, metadata: metaStore.get(name) ?? null }));
      return { keys, list_complete: true };
    },
    _store: store,
  };
}

// In-memory R2 Bucket
export function createR2() {
  const store = new Map();
  // 真实 R2 会把 ReadableStream 完整落盘；mock 需要同样物化，
  // 否则流式直传（src/upload.js、src/proto/upload.js）在测试里存进去的是流对象本身
  async function materialize(body) {
    if (body && typeof body.getReader === 'function') {
      const reader = body.getReader();
      const chunks = [];
      let total = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value); total += value.byteLength ?? 0;
      }
      const out = new Uint8Array(total);
      let off = 0;
      for (const c of chunks) { out.set(c, off); off += c.byteLength ?? 0; }
      return out.buffer;
    }
    return body;
  }
  return {
    async put(key, body, opts = {}) {
      body = await materialize(body);
      const isStr = typeof body === 'string';
      const size = isStr ? body.length : (body?.byteLength ?? 0);
      store.set(key, {
        key,
        size,
        body,                         // raw: string | ArrayBuffer | Uint8Array
        httpMetadata: opts.httpMetadata ?? {},
        customMetadata: opts.customMetadata ?? {},
        uploaded: new Date(),
      });
      return { key };
    },
    async get(key) {
      const obj = store.get(key);
      if (!obj) return null;
      const body = obj.body;
      return {
        ...obj,
        async text() { return typeof body === 'string' ? body : new TextDecoder().decode(body); },
        async json() { return JSON.parse(typeof body === 'string' ? body : new TextDecoder().decode(body)); },
        async arrayBuffer() {
          // 不能直接返回 body.buffer：Node 的 Buffer 常来自池化分配的 slab，
          // byteOffset/byteLength 才是这段字节的真实范围，否则会读到别人的数据
          // （原型上传的 gzip 嗅探就因此拿到错误字节）。
          if (body instanceof ArrayBuffer) return body;
          if (ArrayBuffer.isView(body)) return body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
          return new ArrayBuffer(0);
        },
      };
    },
    async head(key) {
      const obj = store.get(key);
      if (!obj) return null;
      return { key: obj.key, size: obj.size, customMetadata: obj.customMetadata, uploaded: obj.uploaded };
    },
    async delete(key) {
      // R2 supports deleting a single key or an array (≤1000) of keys
      if (Array.isArray(key)) { for (const k of key) store.delete(k); }
      else store.delete(key);
    },
    async list(opts = {}) {
      const { limit = 1000, cursor, prefix = '' } = opts;
      const objects = [...store.values()].filter(o => o.key.startsWith(prefix));
      return { objects, truncated: false };
    },
    _store: store,
  };
}

// 真实存储模式（ONIMG_REAL_STORAGE=1）：同一批测试跑在 SQLite + 磁盘 adapter 上，
// 用来证明「迁移后的存储形态能被现有代码原样读出来」。默认仍是内存 mock。
// 隔离策略：每个 vitest worker 一个根目录（并行 worker 不能共用，否则会互相删掉正在写的文件），
// 每次 createEnv 一份全新存储 —— 与内存 mock 的「每次 createEnv 都是干净环境」语义对齐。
let workerDir = null;
let envSeq = 0;
function realStorage() {
  if (!workerDir) {
    const base = process.env.ONIMG_TEST_ROOT ?? path.join(os.tmpdir(), 'onimg-real-storage-test');
    workerDir = path.join(base, `w${process.pid}`);
    fs.rmSync(workerDir, { recursive: true, force: true });
    fs.mkdirSync(workerDir, { recursive: true });
  }
  const dir = path.join(workerDir, `env${++envSeq}`);
  fs.mkdirSync(dir, { recursive: true });
  const kv = createSqliteKv({ dbFile: path.join(dir, 'onimg.db') });
  const bucket = createDiskBucket({ dataDir: path.join(dir, 'data'), db: kv.db });
  return { kv, bucket };
}

// Build a test environment
export function createEnv(overrides = {}) {
  const store = process.env.ONIMG_REAL_STORAGE === '1'
    ? (() => { const { kv, bucket } = realStorage(); return { STATS: kv, BUCKET: bucket }; })()
    : { STATS: createKV(), BUCKET: createR2() };
  return {
    ...store,
    ADMIN_USERNAME: 'admin',
    ADMIN_PASSWORD: 'AdminP@ss99!',
    TOKEN_SECRET: 'test-secret-at-least-32-bytes!!',
    MAX_FILE_SIZE: '10485760',  // 与线上默认一致的 10MB；streaming 测试按此断言 413
    ALLOWED_TYPES: 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml',
    ...overrides,
  };
}

// Build a Request with optional JSON body and headers
export function createRequest(method, url, { headers = {}, body } = {}) {
  const hdrs = new Headers(headers);
  const init = { method, headers: hdrs };
  if (body !== undefined) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
    if (!hdrs.has('Content-Type')) hdrs.set('Content-Type', 'application/json');
  }
  return new Request(url, init);
}

// Build an authenticated Request (Bearer token)
export function authedRequest(method, url, token, opts = {}) {
  return createRequest(method, url, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, ...(opts.headers ?? {}) },
  });
}

// Build a binary upload Request (raw body, not multipart)
export function createUploadRequest(token, { mimeType = 'image/jpeg', size = 1024 } = {}) {
  const body = new Uint8Array(size).fill(0xff).buffer;
  return new Request('http://localhost/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': mimeType,
    },
    body,
  });
}

// Create and store a test user in KV; returns the plaintext password
export async function createTestUser(env, username, password, {
  canUpload = true,
  canDelete = true,
  canEdit = true,
  maxTotalUploads = -1,
  dailyUploadLimit = -1,
  disabled = false,
} = {}) {
  const salt = randomSalt();
  const passwordHash = await hashPassword(password, salt);
  const user = {
    passwordHash,
    salt,
    disabled,
    permissions: { canUpload, canDelete, canEdit, maxTotalUploads, dailyUploadLimit },
  };
  await env.STATS.put('user:' + username, JSON.stringify(user));
  return user;
}

// Store a fake image in both R2 and KV
export async function createTestImage(env, key, owner) {
  await env.BUCKET.put(key, new Uint8Array(512).buffer, {
    customMetadata: { uploadedBy: owner },
  });
  await env.STATS.put('imgmeta:' + key, JSON.stringify({ uploadedAt: Date.now() }), {
    metadata: { isPublic: true, owner },
  });
  const list = await env.STATS.get('userimgs:' + owner, 'json') ?? [];
  list.unshift({ key, size: 512, uploadedAt: Date.now(), isPublic: true });
  await env.STATS.put('userimgs:' + owner, JSON.stringify(list));
}

// ── 内存 D1 模拟 ──────────────────────────────────────────────────────────────
// 契约与真实 D1 完全一致（用 miniflare 的 workerd 实测对齐过）：
//   run()   → { success, meta: { changes, last_row_id, ... }, results: [] }
//   all()   → { success, meta, results: [ {col: val}, ... ] }
//   first() → 行对象；**未命中返回 null**（不是 undefined）
//   raw()   → 列值的二维数组
//   batch() → 数组，每项同 run()/all() 结构；在同一事务内，任一失败全部回滚
//   exec()  → { count, duration }，支持一个字符串里的多条语句
// 底层是真实 SQLite（node:sqlite），所以能测出 src/kv-d1.js 里 SQL 的真实行为。
export function createD1({ schema = D1_SCHEMA } = {}) {
  const db = new DatabaseSync(':memory:');
  if (schema) db.exec(schema);

  // 真实 D1 对每条语句都返回 meta，其中 rows_read 是这条查询**扫描**的行数
  // （计费口径，不是返回行数）。
  //
  // 模拟层怎么给这个数：先跑一遍 EXPLAIN，数出这条语句的**扫描型指令**
  // （Rewind/Last 开循环、Next 推进、SeekRowid 等值定位、VFilter 虚拟表过滤）。
  // 主键等值查找没有 Rewind 也没有 Next，只有 SeekRowid —— 计 1 行；
  // 前缀范围扫是 Rewind + Next 一对 —— 也只计 1。这样「读也会产生行读取」
  // 在测试里才断言得到；写死 0 会让读路径的用量计数永远测不出来。
  //
  // 不能用 EXPLAIN QUERY PLAN：它只给「SEARCH table USING INDEX (key>?)」，
  // 不含行数（只有跑过 ANALYZE 才有 ~N rows 提示），据此估算恒为 0。
  const scanRows = (sql, args) => {
    // 只统计读语句。写语句的 rows_read 在真实 D1 上也非零，但用量计数器本身
    // 是写在 kv_store 里的，给写路径再记账会变成「记账→再写→再记账」的自我放大。
    // 写由 meta.changes 覆盖，already 计入 rows_written。
    if (!/^\s*SELECT\b/i.test(sql)) return 0;
    let plan;
    try { plan = db.prepare('EXPLAIN ' + sql).all(...args); }
    catch { return 0; }
    const opcodeOf = (r) => String(r.opcode_name ?? r.opcode ?? '');
    // SeekGE/SeekGT/SeekLE/SeekLT：索引定位。主键等值查找在本版 sqlite 上编译成
    // SeekGE + IdxGT 一对（不是 SeekRowid），所以这几个都要算作「定位到一行」。
    const SCAN_OPS = new Set([
      'Next', 'Rewind', 'VNext', 'VFilter', 'Last',
      'SeekRowid', 'SeekGE', 'SeekGT', 'SeekLE', 'SeekLT',
    ]);
    let n = 0;
    for (const r of plan) {
      if (!SCAN_OPS.has(opcodeOf(r))) continue;
      n++;
      // Rewind/Last 与它对应的 Next 是同一次扫描的两端，只算一次
      const isNext = opcodeOf(r) === 'Next' || opcodeOf(r) === 'VNext';
      if (isNext && Number.isFinite(Number(r.p2))) {
        const target = plan.find(x => Number(x.addr) === Number(r.p2));
        if (target && (opcodeOf(target) === 'Rewind' || opcodeOf(target) === 'Last')) n--;
      }
    }
    return Math.max(0, n);
  };

  const metaOf = (info, changes = 0, rowsRead = 0) => ({
    served_by: 'mock.d1',
    duration: 0,
    changes: Number(changes),
    last_row_id: Number(info?.lastInsertRowid ?? 0),
    changed_db: Number(changes) > 0,
    size_after: 0,
    rows_read: Number(rowsRead) || 0,
    rows_written: Number(changes),
  });

  const prepare = (sql) => {
    const stmt = db.prepare(sql);
    let bound = [];
    const api = {
      bind(...args) { bound = args.map(a => (a === undefined ? null : a)); return api; },
      async run() {
        const info = stmt.run(...bound);
        return { success: true, meta: metaOf(info, info.changes, scanRows(sql, bound)), results: [] };
      },
      async all() {
        const results = stmt.all(...bound);
        return { success: true, meta: metaOf(null, 0, scanRows(sql, bound)), results };
      },
      async first() {
        const rows = stmt.all(...bound);
        return rows.length ? rows[0] : null;
      },
      async raw() {
        const rows = stmt.all(...bound);
        return rows.map(r => Object.values(r));
      },
    };
    return api;
  };

  return {
    prepare,
    /** 事务性批量：与真实 D1 一致，任一语句失败则整批回滚 */
    async batch(stmts) {
      db.exec('BEGIN');
      try {
        const out = [];
        for (const s of stmts) out.push(await s.all());
        db.exec('COMMIT');
        return out;
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
    async exec(sql) {
      db.exec(sql);
      return { count: 1, duration: 0 };
    },
    _db: db,
  };
}
