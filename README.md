# Onimg

基于 Cloudflare Workers + R2 + KV 的个人图床与静态原型托管服务，运行于免费版额度之内。

线上：<https://img.diswant.space>

---

## 功能

### 图床
- 上传：拖拽 / 点击 / 粘贴（Ctrl+V 截图直传），多文件 + 进度显示
- 存储：R2 对象 + KV 元数据，公开 / 私密可见性切换
- 我的图库：搜索（文件名 / 标签）、可见性筛选、排序（时间 / 体积 / 名称）、批量操作
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
- 访问统计、Cloudflare 额度监控、来源国家分布
- 操作审计日志后端记录，`/admin/audit` 查询接口

---

## CLI 工具快速上手

### 安装

```bash
curl -fsSL https://img.diswant.space/install.sh | bash
```

安装内容：
| 文件 | 路径 | 说明 |
|---|---|---|
| `onimg` | `~/.local/bin/onimg` | CLI 管理工具入口 |
| `onimg-cli.py` | `~/.local/bin/onimg-cli.py` | CLI 主程序（Python 3，无需 pip） |
| `onimg-upload` | `~/.local/bin/onimg-upload` | Typora 上传脚本 |
| config | `~/.config/onimg/config` | 服务器地址配置 |

### 首次使用

```bash
onimg         # 启动 CLI
# → 选 [2] 登录  →  浏览器打开授权页  →  输入账号密码  →  授权成功
```

### CLI 功能

```
[1] 查看状态      账号 / 配额 / Token 到期时间
[2] 登录授权      浏览器设备授权，token 缓存 N 天（按 admin 设置）
[3] 退出登录      清除 token 缓存
[4] 测试上传      输入文件路径或拖入文件，返回 URL 与 Markdown 格式
[5] 最近记录      列出文件名、大小、上传时间、公开状态
[6] 修改地址      切换 Onimg 实例
[?] 使用说明      完整帮助
```

### 配置 Typora

> 偏好设置 → 图像 → 上传服务 → **Custom Command**

```
~/.local/bin/onimg-upload
```

点击"验证图片上传选项"测试，首次验证会自动打开浏览器完成授权。

之后在 Typora 中粘贴或拖入图片，自动上传并替换为：
```markdown
![](https://img.diswant.space/1234567890-xxxx.jpg)
```

### Token 管理

| 场景 | 操作 |
|---|---|
| Token 过期（默认 7 天） | 下次使用时自动打开浏览器重新授权 |
| 手动退出 | `rm ~/.config/onimg/token` 或 CLI 选 `[3]` |
| 调整有效期 | Admin → 用户管理 → 编辑用户 → Token 有效期（1–365 天） |

---

## 技术栈

- **Cloudflare Workers** — 无服务运行时（路由 + API + 内联前端）
- **R2** — 对象存储（图片 / 原型文件 / 增量上传 manifest），无出口流量费
- **KV** — 元数据、用户、统计、配额
- **Cron Triggers** — 每日 03:00 UTC 清理过期回收站内容

---

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

---

## 部署

```bash
npm run deploy     # wrangler deploy
```

生产环境密钥用 `wrangler secret put` 配置（`ADMIN_USERNAME` / `ADMIN_PASSWORD` / `TOKEN_SECRET`）。

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

test/               vitest 单元测试
```

### KV 键空间

| 前缀 | 内容 |
|---|---|
| `imgmeta:` | 图片元数据（isPublic / owner / deletedAt / tags） |
| `userimgs:` | 用户图片列表（含软删除标记） |
| `user:` | 用户记录（passwordHash / permissions / tokenTtlDays / lastLoginAt） |
| `admin:lastLoginAt` | 管理员最近登录时间 |
| `ucount:` | 用户上传计数（总量 / 每日） |
| `proto:` | 原型元数据 |
| `proto:vfiles:` | 原型版本文件清单 |
| `prstats:` | 原型访问统计 |
| `gstats:` | 全局统计缓存 |

R2 前缀：图片对象（根）、`proto/`、`manifests/`。

---

## 约束

- 免费版单请求 ≤ 50 subrequest（分片上传、批量删除据此设计）
- KV 单值 25 MB / metadata 1 KB（大原型文件清单存 R2）
- R2 边缘图片缩放为付费功能，故缩略图 / WebP 暂未实现

详见 `docs/roadmap.md`。
