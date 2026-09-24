// R2Bucket → 本地磁盘适配器。
// 契约与 test/helpers/mock-env.js 的 createR2() 一致（put / get / head / delete / list），
// 字节落在数据根目录（key 原样映射为相对路径），对象元数据（contentType / cacheControl /
// customMetadata / etag / uploaded）落在 SQLite 的 r2_meta —— 这是 get.js 内联显示、
// Content-Disposition 原名、缓存头能继续工作的前提。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Readable } from 'node:stream';
import { DatabaseSync } from 'node:sqlite';
import { SCHEMA } from './schema.js';

const DEFAULT_LIMIT = 1000;

export function createDiskBucket({ dataDir, dbFile, db: shared } = {}) {
  if (!dataDir) throw new Error('createDiskBucket 需要 dataDir');
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const dataRoot = fs.realpathSync(dataDir);

  const own = !shared;
  let db = shared;
  if (!db) {
    db = new DatabaseSync(dbFile);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA synchronous = NORMAL');
    db.exec(SCHEMA);
  }

  const qMeta = db.prepare('SELECT * FROM r2_meta WHERE key = ?');
  const qPutMeta = db.prepare(`
    INSERT INTO r2_meta (key, size, md5, content_type, cache_control, custom_metadata, raw_metadata, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?, NULL, ?)
    ON CONFLICT(key) DO UPDATE SET size = excluded.size, md5 = excluded.md5,
      content_type = excluded.content_type, cache_control = excluded.cache_control,
      custom_metadata = excluded.custom_metadata, uploaded_at = excluded.uploaded_at`);
  const qDelMeta = db.prepare('DELETE FROM r2_meta WHERE key = ?');
  const qList = db.prepare('SELECT * FROM r2_meta WHERE key >= ? ORDER BY key LIMIT ?');

  // key 来自客户端（原型 ZIP 内的路径），落盘前必须证明它待在数据根内
  const resolve = (key) => {
    if (typeof key !== 'string' || !key) throw new Error(`非法 key: ${key}`);
    if (key.includes('\u0000')) throw new Error(`非法 key（含 NUL）: ${key}`);
    const full = path.resolve(dataRoot, key);
    if (full !== dataRoot && !full.startsWith(dataRoot + path.sep)) {
      throw new Error(`key 逃出数据根: ${key}`);
    }
    return full;
  };

  const toMeta = (row) => ({
    key: row.key,
    size: row.size,
    etag: row.md5 ?? row.key,
    httpMetadata: { contentType: row.content_type ?? undefined, cacheControl: row.cache_control ?? undefined },
    customMetadata: row.custom_metadata ? JSON.parse(row.custom_metadata) : {},
    uploaded: new Date(row.uploaded_at ?? Date.now()),
  });

  const materialize = async (body) => {
    if (body === null || body === undefined) return Buffer.alloc(0);
    if (typeof body === 'string') return Buffer.from(body);
    if (Buffer.isBuffer(body)) return body;
    if (body instanceof ArrayBuffer) return Buffer.from(body);
    if (ArrayBuffer.isView(body)) return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
    if (typeof body.getReader === 'function') {          // web ReadableStream
      const chunks = [];
      const reader = body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(Buffer.from(value));
      }
      return Buffer.concat(chunks);
    }
    if (typeof body.pipe === 'function') {               // node Readable
      const chunks = [];
      for await (const c of body) chunks.push(Buffer.from(c));
      return Buffer.concat(chunks);
    }
    throw new Error(`不支持的 body 类型: ${typeof body}`);
  };

  const writeFileAtomic = (full, buf) => {
    fs.mkdirSync(path.dirname(full), { recursive: true });
    const tmp = `${full}.tmp-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
    fs.writeFileSync(tmp, buf);
    fs.renameSync(tmp, full);
  };

  return {
    db,
    dataRoot,
    async put(key, body, { httpMetadata = {}, customMetadata = {} } = {}) {
      const buf = await materialize(body);
      const full = resolve(key);
      writeFileAtomic(full, buf);
      qPutMeta.run(key, buf.length, crypto.createHash('md5').update(buf).digest('hex'),
        httpMetadata.contentType ?? null, httpMetadata.cacheControl ?? null, JSON.stringify(customMetadata ?? {}), Date.now());
      return { key, size: buf.length };
    },
    async get(key) {
      const row = qMeta.get(key);
      const full = resolve(key);
      if (!row || !fs.existsSync(full)) return null;
      const meta = toMeta(row);
      const stat = fs.statSync(full);
      return {
        ...meta,
        size: stat.size,
        body: Readable.toWeb(fs.createReadStream(full)),
        async text() { return fs.readFileSync(full, 'utf8'); },
        async json() { return JSON.parse(fs.readFileSync(full, 'utf8')); },
        async arrayBuffer() {
          const b = fs.readFileSync(full);
          return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
        },
      };
    },
    async head(key) {
      const row = qMeta.get(key);
      const full = resolve(key);
      if (!row || !fs.existsSync(full)) return null;
      const meta = toMeta(row);
      return { ...meta, size: fs.statSync(full).size };
    },
    async delete(keys) {
      for (const key of Array.isArray(keys) ? keys : [keys]) {
        const full = resolve(key);
        try { fs.unlinkSync(full); } catch {}
        qDelMeta.run(key);
      }
    },
    async list({ prefix = '', limit = DEFAULT_LIMIT, cursor } = {}) {
      const take = Math.max(1, Math.min(Number(limit) || DEFAULT_LIMIT, DEFAULT_LIMIT));
      const bound = cursor ? Buffer.from(cursor, 'base64url').toString('utf8') : prefix;
      const rows = qList.all(bound, take + 1);
      const inPrefix = [];
      for (const r of rows) {
        if (!r.key.startsWith(prefix)) break;
        inPrefix.push(r);
      }
      const page = inPrefix.slice(0, take);
      const more = inPrefix.length > take;
      return {
        objects: page.map(toMeta).filter(m => fs.existsSync(path.join(dataRoot, ...m.key.split('/')))),
        truncated: more,
        ...(more ? { cursor: Buffer.from(page[page.length - 1].key + '\u0000', 'utf8').toString('base64url') } : {}),
      };
    },
    close() { if (own) db.close(); },
  };
}
