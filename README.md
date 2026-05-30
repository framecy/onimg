# Onimg

基于 Cloudflare Workers + R2 + KV 的个人图床与静态原型托管服务，运行于免费版额度之内。

线上：<https://img.diswant.space>

## 功能

### 图床
- 上传：拖拽 / 点击 / 粘贴（Ctrl+V 截图直传），多文件 + 进度显示
- 存储：R2 对象 + KV 元数据，公开 / 私密可见性切换
- 我的图库：搜索（文件名 / 标签）、可见性筛选、排序（时间 / 体积 / 名称）、批量操作
- 标签系统：图片与原型自定义标签，按标签筛选
- 回收站：删除为软删除，保留 30 天可恢复，到期由每日 cron 彻底清理
- 公开图库、图片大图预览（lightbox）、一键复制直链 / Markdown / BBCode

### 原型托管
- ZIP / 文件夹上传，分片上传（规避免费版单请求 50 subrequest 上限）
- **增量上传**：更新时按内容指纹只传变更文件，自动清理孤儿文件
- 版本管理、版本对比（diff）、密码保护与有效期

### 页面托管
- Markdown / HTML 页面，Vditor 编辑器，自定义 URL 后缀

### 管理后台
- 用户管理（权限、配额）、访问统计、Cloudflare 额度监控
- 访问趋势折线图（最近 14 天，按日聚合）、来源国家分布
- 操作审计日志（登录/删除/用户与配置变更），时间范围筛选 + CSV 导出

## 技术栈

- **Cloudflare Workers** — 无服务运行时（路由 + API + 内联前端）
- **R2** — 对象存储（图片 / 原型文件 / 增量上传 manifest），无出口流量费
- **KV** — 元数据、用户、统计、配额
- **Cron Triggers** — 每日 03:00 UTC 清理过期回收站内容

## 开发

> 需要 Node.js ≥ 22（wrangler 4 要求）。

```bash
npm install
npm run dev        # 本地 wrangler dev
npm test           # vitest 单元测试（85 项）
npx wrangler deploy --dry-run   # 构建校验
```

本地凭据放在 `.dev.vars`（已 gitignore）：

```
ADMIN_USERNAME = admin
ADMIN_PASSWORD = your-password
TOKEN_SECRET   = at-least-32-bytes-secret
```

## 部署

```bash
npm run deploy     # wrangler deploy
```

生产环境密钥用 `wrangler secret put` 配置（`ADMIN_USERNAME` / `ADMIN_PASSWORD` / `TOKEN_SECRET`）。

## 架构

```
src/
  index.js          路由入口 + scheduled() cron 入口 + CORS/安全头
  upload.js get.js list.js delete.js   图片 CRUD
  trash.js          回收站（软删除 / 恢复 / 彻底删除 / cron 清理）
  user-auth.js      用户登录、权限、配额、口令哈希
  proto/            原型托管（upload 分片+增量 / serve / manage）
  pages/            页面托管（Markdown / HTML）
  admin/            管理后台 API（auth / users / stats / config）
  page.js           前端（内联 HTML/CSS/JS）
  admin-page.js     管理后台前端
test/               vitest 单元测试
```

KV 键空间：`imgmeta:` `userimgs:` `proto:` `proto:vfiles:` `prstats:` `user:` `ucount:` `gstats:`；
R2 前缀：图片对象（根）、`proto/`、`manifests/`。

## 约束

- 免费版单请求 ≤ 50 subrequest（分片上传、批量删除据此设计）
- KV 单值 25 MB / metadata 1 KB（大原型文件清单存 R2）
- R2 边缘图片缩放为付费功能，故缩略图 / WebP 暂未实现

详见 `docs/roadmap.md`。
