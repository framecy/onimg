// Workers KVNamespace → Cloudflare D1 适配器。
//
// 契约与 test/helpers/mock-env.js 的 createKV()、以及 src/kv-sqlite.js 完全一致
// （get / getWithMetadata / put / delete / list），底层换成 D1 的异步 API。
//
// ── 为什么需要这个文件 ───────────────────────────────────────────────────────
// 全站的 KV 写入都走 env.STATS：访问统计（get.js / pages/handler.js / proto/serve.js）、
// 上传链路的配额与索引（user-auth.js / upload.js / imglist.js）、审计日志、CF 用量计数。
// 把这些写入整体搬到 D1，业务代码一行不用改（接线见 src/index.js），换来：
//   · 写入额度：KV 免费版 1000 次/天 → D1 免费版 10 万行/天
//   · 摆脱 KV 的最终一致性读延迟：mergeUserImgEntry 的「写后校验」在强一致的 D1 上
//     一次即成，不再需要最多 6 轮的退避重试（那是最坏 6 次写放大的来源）
//   · 不再为了一次图片访问把最多 200 条访问记录整体重写成一个大 JSON
//
// ── 与 kv-sqlite.js 的差异（运行时约束，不是设计选择）──────────────────────
// 1. D1 拒绝 PRAGMA（实测报 SQLITE_AUTH: not authorized），所以这里不设 journal_mode。
// 2. D1 的取数 API 全是 async，SQL 逻辑照搬 kv-sqlite.js（那套已在真实 SQLite 上验证）。
// 3. D1 的 .first() 未命中返回 null（实测确认），与 KV 的 get() 语义天然对齐。
//
// ── 表结构 ───────────────────────────────────────────────────────────────────
// 复用 src/schema.js 的 kv_store（key / value / metadata / expires_at / updated_at）。
// 建表由部署前的一次性命令完成，适配器不在请求路径里执行 DDL：
//   wrangler d1 execute <库名> --remote --file=scripts/d1-schema.sql

const DEFAULT_LIMIT = 1000;   // 与真实 KV 的 list 默认上限一致
const MAX_LIMIT = 1000;

/** 存活条件：无过期时间，或尚未到期（expires_at 为 Unix 秒） */
const LIVE = 'expires_at IS NULL OR expires_at > ?';

/**
 * 把 KVNamespace 契约实现在 D1 上。
 *
 * @param {D1Database} db  Workers 的 env.DB 绑定
 * @returns KVNamespace 外形（get / getWithMetadata / put / delete / list / sweepExpired）
 */
export function createD1Kv(db) {
  if (!db || typeof db.prepare !== 'function') {
    throw new Error('createD1Kv 需要 D1 绑定（env.DB）');
  }

  const nowSec = () => Math.floor(Date.now() / 1000);

  const decode = (raw, type) => {
    if (raw === null || raw === undefined) return null;
    if (type === 'json') { try { return JSON.parse(raw); } catch { return null; } }
    return raw;
  };

  // cursor = 「最后一个 key + \0」：在字节序里紧跟在它之后，既排除自身又不漏掉
  // 以它为前缀的 key。与 kv-sqlite.js 同一套编码，保证两端行为一致。
  const encodeCursor = (key) =>
    (typeof btoa === 'function'
      ? btoa(String.fromCharCode(...new TextEncoder().encode(key + '\u0000')))
      : Buffer.from(key + '\u0000', 'utf8').toString('base64'))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const decodeCursor = (cursor) => {
    if (!cursor) return null;
    const b64 = cursor.replace(/-/g, '+').replace(/_/g, '/');
    if (typeof atob === 'function') {
      const bin = atob(b64);
      const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    }
    return Buffer.from(b64, 'base64').toString('utf8');
  };

  return {
    /** 读单个 key；type='json' 时反序列化，解析失败返回 null（与 KV 一致） */
    async get(key, type = 'text') {
      const row = await db
        .prepare(`SELECT value FROM kv_store WHERE key = ? AND (${LIVE})`)
        .bind(key, nowSec())
        .first();
      if (!row) return null;
      return decode(row.value, type);
    },

    /** 读 key + metadata；未命中返回 { value: null, metadata: null }（与 KV 一致） */
    async getWithMetadata(key, type = 'text') {
      const row = await db
        .prepare(`SELECT value, metadata FROM kv_store WHERE key = ? AND (${LIVE})`)
        .bind(key, nowSec())
        .first();
      if (!row) return { value: null, metadata: null };
      return {
        value: decode(row.value, type),
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
      };
    },

    /**
     * 写 key。value 非字符串时 JSON 序列化；metadata 序列化后存 TEXT。
     * expirationTtl 单位秒，与 KV 一致；不传则永不过期。
     */
    async put(key, value, { metadata, expirationTtl } = {}) {
      const val = typeof value === 'string' ? value : JSON.stringify(value);
      const expiresAt = Number.isFinite(expirationTtl) ? nowSec() + expirationTtl : null;
      await db
        .prepare(
          `INSERT INTO kv_store (key, value, metadata, expires_at, updated_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET
             value = excluded.value,
             metadata = excluded.metadata,
             expires_at = excluded.expires_at,
             updated_at = excluded.updated_at`,
        )
        .bind(
          key,
          val,
          metadata === undefined || metadata === null ? null : JSON.stringify(metadata),
          expiresAt,
          Date.now(),
        )
        .run();
    },

    /** 删单个 key（幂等，删不存在的 key 不报错） */
    async delete(key) {
      await db.prepare('DELETE FROM kv_store WHERE key = ?').bind(key).run();
    },

    /**
     * 按前缀列出 key（带 metadata），支持 limit / cursor / list_complete，
     * 语义与真实 KV 的 list() 一致。
     *
     * 实现：同前缀的 key 在字节序里必然连续，所以直接做 key >= bound 的范围扫描，
     * 多取一条即可判断是否还有下一页。
     */
    async list({ prefix = '', limit = DEFAULT_LIMIT, cursor } = {}) {
      const take = Math.max(1, Math.min(Number(limit) || DEFAULT_LIMIT, MAX_LIMIT));
      const bound = decodeCursor(cursor) ?? prefix;  // 首页从 prefix 起，续页从「上个 key+\0」起

      const { results } = await db
        .prepare(
          `SELECT key, metadata FROM kv_store
           WHERE key >= ? AND (${LIVE})
           ORDER BY key LIMIT ?`,
        )
        .bind(bound, nowSec(), take + 1)
        .all();

      // 断在前缀边界上：跨出 prefix 的第一条不属于本次结果
      const inPrefix = [];
      for (const r of results ?? []) {
        if (!r.key.startsWith(prefix)) break;
        inPrefix.push(r);
      }

      const page = inPrefix.slice(0, take);
      const more = inPrefix.length > take;
      return {
        keys: page.map(r => ({
          name: r.key,
          metadata: r.metadata ? JSON.parse(r.metadata) : null,
        })),
        list_complete: !more,
        ...(more ? { cursor: encodeCursor(page[page.length - 1].key) } : {}),
      };
    },

    /**
     * 清理已过期的 key。
     * D1 不像 KV 那样自动过期，交给每日 cron 调用（src/index.js 的 scheduled）。
     * @returns 删除的行数
     */
    async sweepExpired() {
      const r = await db
        .prepare('DELETE FROM kv_store WHERE expires_at IS NOT NULL AND expires_at <= ?')
        .bind(nowSec())
        .run();
      return r?.meta?.changes ?? 0;
    },
  };
}
