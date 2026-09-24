// 本机 Node 入口：把 Worker 的 fetch(request, env, ctx) 原样跑在 Node 上。
// 业务代码零改动 —— 这一层只做三件事：
//   1. Node IncomingMessage → Web Request（body 保持流式，multipart 上传才能不落内存）
//   2. Web Response → Node res（流式回写，图片/原型资源不整块读进内存）
//   3. ctx.waitUntil → 待办队列 + 退出前 drain（否则重启会丢访问统计/审计日志这类后台写）
//
//   ONIMG_ROOT=~/onimg-migrate node src/node-server.js      # 默认监听 127.0.0.1:8787
//
// 环境变量：PORT / HOST / ONIMG_ROOT / ADMIN_USERNAME / ADMIN_PASSWORD / TOKEN_SECRET /
//          MAX_FILE_SIZE / ALLOWED_TYPES / PROTO_MAX_SIZE / CF_*
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import worker from './index.js';
import { createSqliteKv } from './kv-sqlite.js';
import { createDiskBucket } from './storage-disk.js';

const ROOT = process.env.ONIMG_ROOT ?? path.join(process.env.HOME ?? '.', 'onimg-migrate');
const HOST = process.env.HOST ?? '127.0.0.1';   // 只监听回环：由 Caddy/Nginx 反代并注入 X-Forwarded-For
const PORT = parseInt(process.env.PORT ?? '8787', 10);

export function buildEnv({ root = ROOT } = {}) {
  const dbFile = process.env.ONIMG_DB ?? path.join(root, 'db', 'onimg.db');
  const dataDir = process.env.ONIMG_DATA ?? path.join(root, 'data');
  fs.mkdirSync(path.dirname(dbFile), { recursive: true, mode: 0o700 });
  const STATS = createSqliteKv({ dbFile });
  const BUCKET = createDiskBucket({ dataDir, db: STATS.db });
  return {
    STATS, BUCKET, _close: () => STATS.close(),
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    TOKEN_SECRET: process.env.TOKEN_SECRET,
    MAX_FILE_SIZE: process.env.MAX_FILE_SIZE ?? '52428800',
    ALLOWED_TYPES: process.env.ALLOWED_TYPES ?? 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml',
    PROTO_MAX_SIZE: process.env.PROTO_MAX_SIZE ?? '52428800',
    SITE_NOTES: process.env.SITE_NOTES,
    CF_ACCOUNT_ID: process.env.CF_ACCOUNT_ID,
    CF_API_TOKEN: process.env.CF_API_TOKEN,
    CF_KV_STATS_ID: process.env.CF_KV_STATS_ID,
    CF_R2_BUCKET: process.env.CF_R2_BUCKET,
    CF_WORKER_NAME: process.env.CF_WORKER_NAME,
  };
}

/** 客户端真实 IP：只有来自本机反代时才信 X-Forwarded-For，否则用它自己的地址 */
function clientIp(req) {
  const remote = req.socket.remoteAddress ?? '';
  const fromProxy = remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1';
  if (fromProxy) {
    const xff = req.headers['x-forwarded-for'];
    if (xff) return String(xff).split(',')[0].trim();
    if (req.headers['cf-connecting-ip']) return String(req.headers['cf-connecting-ip']);
  }
  return remote.replace(/^::ffff:/, '');
}

export function createServer(env = buildEnv()) {
  const pending = new Set();
  const ctx = {
    waitUntil(p) { const t = Promise.resolve(p).catch(() => {}).finally(() => pending.delete(t)); pending.add(t); },
    passThroughOnException() {},
  };

  const server = http.createServer(async (req, res) => {
    let request;
    try {
      const url = `http://${req.headers.host ?? `${HOST}:${PORT}`}${req.url}`;
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) {
        if (Array.isArray(v)) for (const x of v) headers.append(k, x);
        else if (v !== undefined) headers.set(k, v);
      }
      // 反代场景下把真实 IP 透给业务代码（等价 CF 的 CF-Connecting-IP）
      headers.set('CF-Connecting-IP', clientIp(req));
      const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
      request = new Request(url, {
        method: req.method,
        headers,
        ...(hasBody ? { body: Readable.toWeb(req), duplex: 'half' } : {}),
      });
    } catch (e) {
      res.writeHead(400).end(`bad request: ${e.message}`);
      return;
    }

    try {
      const response = await worker.fetch(request, env, ctx);
      const out = new Headers(response.headers);
      out.set('X-Served-By', 'onimg-node');
      res.writeHead(response.status, response.statusText || undefined, Object.fromEntries(out));
      if (req.method === 'HEAD' || !response.body) { res.end(); return; }
      await new Promise((resolve, reject) => {
        Readable.fromWeb(response.body).pipe(res).on('finish', resolve).on('error', reject);
      });
    } catch (e) {
      console.error(`[onimg] ${req.method} ${req.url} → ${e.stack ?? e}`);
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal Error');
    }
  });

  // 重启不能丢后台写：先停止收新连接，再把 waitUntil 待办跑完
  const drain = async () => {
    server.close();
    if (pending.size) console.log(`[onimg] 等待 ${pending.size} 个后台任务落盘…`);
    await Promise.allSettled([...pending]);
    env._close?.();
  };
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { drain().then(() => process.exit(0)); });

  return { server, env, pending, drain };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { server, env } = createServer();
  server.listen(PORT, HOST, () => {
    console.log(`onimg 本机服务 http://${HOST}:${PORT}`);
    console.log(`  数据根 ${process.env.ONIMG_ROOT ?? ROOT}（R2 镜像 data/ + SQLite db/onimg.db）`);
    if (!env.TOKEN_SECRET) console.log('  ⚠️ TOKEN_SECRET 未设置：登录/token 校验不可用（从 .dev.vars 或线上 secret 取值）');
  });
}
