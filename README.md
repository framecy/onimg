# Onimg

基于 Cloudflare Workers + R2 + D1 的个人图床与静态原型托管服务，运行于免费版额度之内。

线上：<https://img.diswant.space>　　📖 [CLI 使用手册](docs/cli-usage.md)　　🎨 [设计系统](docs/design-system.md)

---

## 功能

### 图床
- 上传：拖拽 / 点击 / 粘贴（Ctrl+V 截图直传），多文件 + 进度显示
- 存储：R2 对象 + KV 元数据，公开 / 私密可见性切换
- 我的图库：搜索（文件名 / 标签）、可见性筛选、排序（时间 / 体积 / 名称）、批量操作（删除 / 改可见性 / 复制地址）
- 复制地址：单张或批量复制直链、Markdown、BBCode；Markdown 带原始文件名，格式为 `![文件名](地址)`
- 标签系统：图片与原型自定义标签，按标签筛选
- 回收站：删除为软删除，保留 30 天可恢复，到期由每日 cron 彻底清理
- 公开图库、图片大图预览（lightbox）、一键复制直链 / Markdown / BBCode

### Typora 自动上传
- **一键安装**：`curl -fsSL https://img.diswant.space/install.sh | bash`
- **浏览器设备授权**：首次使用打开 `/auth/device` 授权页，登录后 token 自动缓存，7 天内无需重复操作
- **零配置凭据**：不存储密码，仅缓存 JWT token 至 `~/.config/onimg/token`
- **CLI 管理工具** `onimg`：查看状态、手动上传、最近记录、Token 管理

### 原型托管
- ZIP / 文件夹上传，分片上传（规避免费版单请求 50 subrequest 上限）
- **增量上传**：更新时按内容指纹只传变更文件，自动清理孤儿文件
- 版本管理、版本对比（diff）、密码保护与有效期

### 页面托管
- Markdown / HTML 页面，Vditor 编辑器，自定义 URL 后缀

### 管理后台
- **用户管理**：权限（上传/删除/编辑）、配额（总量/每日）、Token 有效期（1–365 天）
- **登录状态**：展示每位用户最近登录时间与 Token 是否活跃
- **审计日志**：独立标签页，按时间范围 / 操作类型 / 操作者筛选，记录登录、删除、用户与配置变更等敏感操作
- **趋势图**：仪表盘迷你趋势线读取服务端按天统计的真实历史（数据不足时显示「积累中」）
- 访问统计、Cloudflare 额度监控、来源国家分布

### 隐私说明

本服务会记录以下数据，用于统计与安全审计：

| 数据 | 来源 | 用途 | 保留 |
|---|---|---|---|
| 访问者 IP、国家/城市/运营商 | 图片 / 页面 / 原型被访问时 | 访问统计、异常排查 | 每对象最近 200 条 |
| 操作者 IP | 登录、删除、改配置等敏感操作 | 安全审计 | 92 天（每天最多 500 条） |
| 按天访问计数 | 同上，聚合为每日数字 | 趋势图 | 400 天 |

**不含**任何第三方分析脚本或 Cookie 追踪。若你不希望被记录，请勿访问本站资源。

> 自建部署时，上面这些记录都在你自己的 Cloudflare 账号里（D1 数据库），不会外发。

---

## CLI 工具快速上手

> 完整文档见 [docs/cli-usage.md](docs/cli-usage.md)

### 安装

```bash
curl -fsSL https://img.diswant.space/install.sh | bash
```

安装到 `~/.local/bin/`：`onimg`（CLI 入口）、`onimg-upload`（Typora 脚本）、`onimg-cli.py`（主程序，纯 Python 3 标准库）。

### 首次使用

```bash
onimg
# → [2] 登录 → 浏览器授权 → 输入账号密码 → token 自动缓存
```

### 功能速查

| 选项 | 功能 |
|---|---|
| `[1]` | 账号 / 配额 / Token 到期时间详情 |
| `[2]` | 浏览器设备授权，token 缓存 N 天 |
| `[3]` | 退出登录（清除 token 缓存） |
| `[4]` | 手动上传图片，返回 URL 与 Markdown |
| `[5]` | 最近上传记录（文件名 / 大小 / 时间） |
| `[6]` | 修改服务器地址 |
| `[?]` | 内置使用说明 |

### 配置 Typora

偏好设置 → 图像 → 上传服务 → **Custom Command**：

```
~/.local/bin/onimg-upload
```

之后粘贴或拖入图片自动上传，Markdown 链接自动替换：

```markdown
![](https://img.diswant.space/1234567890-xxxx.jpg)
```

### Token 管理

| 场景 | 操作 |
|---|---|
| Token 过期 | 下次使用自动打开浏览器重新授权 |
| 手动退出 | `rm ~/.config/onimg/token` 或 CLI 选 `[3]` |
| 调整有效期 | Admin → 用户管理 → 编辑用户 → Token 有效期（1–365 天） |

---

## 技术栈

- **Cloudflare Workers** — 无服务运行时（路由 + API + 内联前端）
- **R2** — 对象存储（图片 / 原型文件 / 增量上传 manifest），无出口流量费
- **D1** — SQLite，承载全部元数据（用户、图片索引、页面、统计、配额、审计）
- **KV** — 保留绑定作为回滚路径；运行时读写已全部走 D1（见 `src/kv-d1.js`）
- **Cron Triggers** — 每日 03:00 UTC 清理过期回收站内容

---

## 开发

> 需要 Node.js ≥ 22（wrangler 4 要求）。

```bash
npm install
npm run dev        # 本地 wrangler dev
npm test           # vitest 单元测试（204 项）
npx wrangler deploy --dry-run   # 构建校验
```

本地凭据放在 `.dev.vars`（已 gitignore）：

```
ADMIN_USERNAME = admin
ADMIN_PASSWORD = your-password
TOKEN_SECRET   = at-least-32-bytes-secret
```

---

## 部署

**1. 准备配置**（`wrangler.toml` 含个人账号的资源 ID，不入仓库）

```bash
cp wrangler.toml.example wrangler.toml
# 按文件内注释填入 account_id / KV namespace id / D1 database id / 域名
```

创建资源并回填 ID：

```bash
npx wrangler whoami                        # 拿 account_id
npx wrangler kv namespace create STATS     # 拿 KV namespace id
npx wrangler d1 create onimg-stats         # 拿 D1 database id
npx wrangler r2 bucket create onimg-images
npx wrangler d1 execute onimg-stats --remote --file=docs/d1-schema.sql   # 建表
```

**2. 配置密钥**（`ADMIN_USERNAME` / `ADMIN_PASSWORD` / `TOKEN_SECRET`）

```bash
npx wrangler secret put ADMIN_USERNAME
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put TOKEN_SECRET       # ≥ 32 字节
```

**3. 部署**

```bash
npm run deploy     # wrangler deploy
```

> 走 GitHub Actions 的话，需要在仓库 Settings → Secrets 里配置
> `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`，以及 `WRANGLER_TOML`
> （内容就是本地 `wrangler.toml` 的全文，CI 会据此还原配置文件）。

---

## 架构

```
src/
  index.js          路由入口 + /install.sh + /auth/device + CORS/安全头
  upload.js         图片上传（multipart / raw binary，配额校验）
  get.js            图片访问（R2 流式响应 + 缓存头）
  list.js           图片列表（admin 过滤软删除 / 用户自有列表）
  delete.js         软删除（imgmeta + userimgs 标记 deletedAt）
  trash.js          回收站（恢复 / 彻底删除 / cron 清理）
  user-auth.js      登录（lastLoginAt / per-user tokenTtlDays）、权限、配额
  proto/            原型托管（分片+增量上传 / 服务 / 管理）
  pages/            页面托管（Markdown / HTML）
  admin/            管理后台 API（auth / users / stats / config）
  page.js           前端（内联 HTML/CSS/JS）
  admin-page.js     管理后台（用户登录状态 / Token 有效期 / 权限管理）

scripts/
  onimg-cli.py      CLI 管理工具（状态 / 登录 / 上传 / 帮助，纯标准库）
  typora-upload.sh  Typora 上传脚本（浏览器设备授权 / token 缓存 / 自动重试）
  onimg             CLI 入口包装（exec python3）
  install.sh        一键安装脚本（自托管于 /install.sh 路由）
  wrap-css.mjs      Tailwind 构建产物包装（build:css 调用）

test/               vitest 单元测试
```

> `scripts/` 里的 CLI 脚本同时以字符串常量内联在 `src/index.js` 中（避免运行时读文件），
> 改动后需要同步过去。`install.sh` 由 Worker 动态生成，源文件仅供维护参考。

### 元数据键空间（存于 D1 的 `kv_store` 表）

| 前缀 | 内容 |
|---|---|
| `imgmeta:` | 图片元数据（isPublic / owner / deletedAt / tags） |
| `userimg:` | 单图索引（「该用户拥有这张图」的权威来源，清单丢失时据此自愈） |
| `userimgs:` | 用户图片列表（读优化缓存，含软删除标记） |
| `user:` | 用户记录（passwordHash / permissions / tokenTtlDays / lastLoginAt） |
| `admin:lastLoginAt` | 管理员最近登录时间 |
| `ucount:` | 用户上传计数（总量 / 每日） |
| `page:` / `userpages:` | 页面内容 / 用户页面索引 |
| `proj:` / `grp:` | 项目 / 分组 |
| `proto:` | 原型元数据 |
| `proto:vfiles:` | 原型版本文件清单 |
| `stats:` / `pstats:` / `prstats:` | 图片 / 页面 / 原型访问统计 |
| `audit:` | 操作审计日志 |
| `gstats:` | 全局统计缓存 |

R2 前缀：图片对象（根）、`proto/`、`manifests/`。

---

## 约束

- 免费版单请求 ≤ 50 subrequest（分片上传、批量删除据此设计）
- KV 单值 25 MB / metadata 1 KB（大原型文件清单存 R2）
- R2 边缘图片缩放为付费功能，故缩略图 / WebP 暂未实现
- 访问统计写入 D1（按行计费，免费版 10 万行写/天），避免 KV 1000 写/天的额度瓶颈
