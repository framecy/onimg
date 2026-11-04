// Workers KVNamespace → SQLite 适配器。
// 契约与 test/helpers/mock-env.js 的 createKV() 完全一致（get / getWithMetadata / put / delete / list），
// 额外实现真实 KV 的两个语义：list 的 limit+cursor+list_complete、以及 TTL 过期后读写都不可见。
//
// 用法：const kv = await createSqliteKv({ dbFile: '/path/onimg.db' });
import { DatabaseSync } from 'node:sqlite';
import { SCHEMA } from './schema.js';

const DEFAULT_LIMIT = 1000;   // 真实 KV 的 list 默认上限
const MAX_LIMIT = 1000;

// 与 src/kv-d1.js 的 GET_MANY_CHUNK 同值：批量读的 IN (…) 分块大小。
// 99 而不是 100：查询还要绑 1 个时间参数（见 kv-d1.js 的注释，D1 上限 100）。
const GET_MANY_CHUNK = 99;

export function createSqliteKv({ dbFile, db: shared } = {}) {
  const own = !shared;
  let db = shared;
  if (!db) {
    if (!dbFile) throw new Error('createSqliteKv 需要 dbFile 或已打开的 db');
    db = new DatabaseSync(dbFile);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA synchronous = NORMAL');
    db.exec(SCHEMA);
  }

  const nowSec = () => Math.floor(Date.now() / 1000);
  const live = 'expires_at IS NULL OR expires_at > ?';

  const qGet = db.prepare(`SELECT value, metadata, expires_at FROM kv_store WHERE key = ? AND (${live})`);
  const qPut = db.prepare(`
    INSERT INTO kv_store (key, value, metadata, expires_at, updated_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, metadata = excluded.metadata,
      expires_at = excluded.expires_at, updated_at = excluded.updated_at`);
  const qDel = db.prepare('DELETE FROM kv_store WHERE key = ?');
  const qList = db.prepare(`SELECT key, metadata FROM kv_store
    WHERE key >= ? AND (${live}) ORDER BY key LIMIT ?`);
  const qSweep = db.prepare('DELETE FROM kv_store WHERE expires_at IS NOT NULL AND expires_at <= ?');

  const decode = (raw, type) => {
    if (raw === null) return null;
    if (type === 'json') { try { return JSON.parse(raw); } catch { return null; } }
    return raw;
  };

  // cursor = 「最后一个 key + \0」：在字节序里紧跟在它之后，既排除自身又不漏掉以它为前缀的 key
  const encodeCursor = (key) => Buffer.from(key + '\u0000', 'utf8').toString('base64url');
  const decodeCursor = (cursor) => (cursor ? Buffer.from(cursor, 'base64url').toString('utf8') : null);

  return {
    db,
    async get(key, type = 'text') {
      const row = qGet.get(key, nowSec());
      return row ? decode(row.value, type) : null;
    },
    async getWithMetadata(key, type = 'text') {
      const row = qGet.get(key, nowSec());
      if (!row) return { value: null, metadata: null };
      return { value: decode(row.value, type), metadata: row.metadata ? JSON.parse(row.metadata) : null };
    },
    /**
     * 批量读 key —— 与 src/kv-d1.js 的 getMany 同语义、同返回值（Map，缺失为 null）。
     *
     * 本地 SQLite 没有网络往返，这里提速意义不大；保留它是为了让 /list 的展开逻辑
     * 在两种存储上走**同一条代码路径**，不会出现「线上修了、自托管没修」。
     */
    async getMany(keys, type = 'text') {
      const out = new Map();
      const uniq = [...new Set(keys)];
      if (!uniq.length) return out;
      for (let i = 0; i < uniq.length; i += GET_MANY_CHUNK) {
        const chunk = uniq.slice(i, i + GET_MANY_CHUNK);
        const ph = chunk.map(() => '?').join(', ');
        const rows = db.prepare(`SELECT key, value FROM kv_store WHERE key IN (${ph}) AND (${live})`)
          .all(...chunk, nowSec());
        for (const r of rows) out.set(r.key, decode(r.value, type));
      }
      for (const k of uniq) if (!out.has(k)) out.set(k, null);
      return out;
    },
    async put(key, value, { metadata, expirationTtl } = {}) {
      const val = typeof value === 'string' ? value : JSON.stringify(value);
      const expiresAt = Number.isFinite(expirationTtl) ? nowSec() + expirationTtl : null;
      qPut.run(key, val, metadata === undefined || metadata === null ? null : JSON.stringify(metadata), expiresAt, Date.now());
    },
    async delete(key) {
      qDel.run(key);
    },
    async list({ prefix = '', limit = DEFAULT_LIMIT, cursor } = {}) {
      const take = Math.max(1, Math.min(Number(limit) || DEFAULT_LIMIT, MAX_LIMIT));
      const bound = decodeCursor(cursor) ?? prefix;   // 首页从 prefix 起，续页从「上个 key+\0」起
      // 同前缀的 key 在字节序里必然连续，所以多取一条就能判断是否还有下一页
      const rows = qList.all(bound, nowSec(), take + 1);
      const inPrefix = [];
      for (const r of rows) {
        if (!r.key.startsWith(prefix)) break;
        inPrefix.push(r);
      }
      const page = inPrefix.slice(0, take);
      const more = inPrefix.length > take;
      return {
        keys: page.map(r => ({ name: r.key, metadata: r.metadata ? JSON.parse(r.metadata) : null })),
        list_complete: !more,
        ...(more ? { cursor: encodeCursor(page[page.length - 1].key) } : {}),
      };
    },
    /** 清理已过期的 key（等价 KV 的自动过期，供 cron 调用） */
    async sweepExpired() {
      qSweep.run(nowSec());
    },
    close() { if (own) db.close(); },
  };
}
