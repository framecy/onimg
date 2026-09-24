// 目标库 schema：迁移载入脚本、映射校验、以及运行时的 kv-sqlite / storage-disk adapter 共用。
// 放在 src/ 而不是 scripts/，是为了让「迁移工具依赖应用代码」，而不是反过来。
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS kv_store (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,          -- KV value 原文（本项目全部是 JSON 文本）
  metadata   TEXT,                   -- KV metadata 的 JSON 原文；无则 NULL
  expires_at INTEGER,                -- KV expiration（Unix 秒，KV 原生语义）；无则 NULL
  updated_at INTEGER NOT NULL        -- 导入/写入时间（ms）
);
CREATE INDEX IF NOT EXISTS idx_kv_expires ON kv_store(expires_at);

CREATE TABLE IF NOT EXISTS r2_meta (
  key             TEXT PRIMARY KEY,
  size            INTEGER NOT NULL,
  md5             TEXT,              -- 内容 MD5：既做完整性证明，也当 etag 用
  content_type    TEXT,              -- 对应 R2 httpMetadata.contentType
  cache_control   TEXT,              -- 对应 R2 httpMetadata.cacheControl
  custom_metadata TEXT,              -- 对应 R2 customMetadata（JSON，含上传原件名）
  raw_metadata    TEXT,              -- 迁移时 rclone 的原始 Metadata，不丢信息
  uploaded_at     INTEGER            -- 对象创建/修改时间（ms）
);

CREATE TABLE IF NOT EXISTS migration_log (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  phase  TEXT NOT NULL,
  at     INTEGER NOT NULL,
  detail TEXT
);
`;

// D1 版本：只含 KV 需要的 kv_store。
// r2_meta / migration_log 是本地磁盘适配器（storage-disk.js）与迁移工具专用，D1 上不需要。
// 建表命令：wrangler d1 execute <库名> --remote --file=scripts/d1-schema.sql
export const D1_SCHEMA = `
CREATE TABLE IF NOT EXISTS kv_store (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  metadata   TEXT,
  expires_at INTEGER,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_kv_expires ON kv_store(expires_at);
`;
