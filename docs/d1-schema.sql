-- Onimg D1 建表（kv_store 与 src/schema.js 的 D1_SCHEMA 保持一致）
-- 用法：wrangler d1 execute onimg-stats --remote --file=docs/d1-schema.sql
--
-- 为什么把 KV 整体搬进 D1：全站 KV 写入的大头是「图片每次被访问写一条访问记录」，
-- 外链页面每加载一次就打过来一次，用户自己完全无感；KV 免费版 1000 写/天扛不住。
-- D1 免费版是 10 万行写/天，且强一致，imglist 的写后校验不再需要退避重试。

CREATE TABLE IF NOT EXISTS kv_store (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,          -- KV value 原文（本项目全部是 JSON 文本）
  metadata   TEXT,                   -- KV metadata 的 JSON 原文；无则 NULL
  expires_at INTEGER,                -- KV expiration（Unix 秒）；无则 NULL
  updated_at INTEGER NOT NULL        -- 写入时间（ms）
);

CREATE INDEX IF NOT EXISTS idx_kv_expires ON kv_store(expires_at);
