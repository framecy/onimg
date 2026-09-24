# Changelog

所有重要变更均记录于此，格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

---

## [未发布] — 2026-09-24

### Added
- **审计日志后台界面**：新增「审计日志」标签页，支持按时间范围（今天 / 7 / 30 / 31 天）、操作类型、操作者筛选，展示时间 / 操作 / 操作者 / 对象 / 状态 / 来源 IP。此前只有后端接口，后台没有入口
- **趋势图改用真实数据**：新增按天计数 `daily:{metric}:{YYYY-MM-DD}`（图片访问 / 页面访问 / 原型访问 / 上传）与 `GET /admin/trend` 接口，仪表盘迷你趋势线读取真实历史。数据未积累够时显示「趋势数据积累中」，不再画模拟曲线
- **管理端图片管理补齐**：lightbox 增加复制 BBCode、可见性切换、标签编辑；`/list` 的管理员分支带出 `isPublic` / `owner` / `indexed`；新增 `GET /api/image/{key}/meta`
- **上传保留原始文件名**：`key` 仍为随机串（直链路径不变），原名额外存入 `imgmeta` value、`userimgs` 条目与 R2 对象自定义元数据
- 上传响应新增 `name`（原样，含路径前缀）与 `basename`（展示用）字段；`/list` 条目同步带出
- `X-File-Name` 请求头：raw-body 上传（CLI / Typora 脚本）用它声明原名（URL 编码，兼容中文名）
- `GET /{key}` 响应新增 `Content-Disposition`，浏览器「另存为」可得原文件名（中文名走 RFC 5987 `filename*=`）
- 前端「我的图库」：卡片显示原文件名、搜索支持按原名匹配、按名排序、大图预览显示原名
- CLI `onimg`：上传回显原名，「最近上传」列表的文件名列改为原名

### Changed
- **存储层从 KV 迁移到 D1**：新增 `src/kv-d1.js`（KVNamespace 契约 + D1 内核），在请求入口把 `env.STATS` 就地替换，业务代码零改动。写入额度从 KV 免费版 1000 次/天提升到 D1 的 10 万行/天，并摆脱 KV 的最终一致性读延迟。KV 绑定保留作回滚路径
- 审计日志、访问统计等数据统一存于 D1 的 `kv_store` 表（键格式不变）

### Fixed
- **公开图库空白**：骨架屏样式常量用 `const` 声明在文件后段，首屏初始化早于它执行，命中暂时性死区抛 ReferenceError 导致整个初始化链中断。改为 `var` 提升
- **上传勾选公开后图库不刷新**：上传完成后只刷新结果列表，未刷新图库
- **单张删除不检查响应**：后端失败也提示「已移至回收站」，刷新后图片复现
- **复制按钮反馈时高度跳动**：原先整体替换按钮内容为图标，改为文字与图标叠放、只切换可见性；编辑按钮固定宽度不足导致的折行一并修正
- 图库搜索框标注「搜索文件名」但实际只匹配随机 key，现可按真实文件名检索
- CLI「文件名」列实际显示的是随机 key，现显示上传时记录的原名
- 按字节截断超长文件名时会切出半个多字节字符（U+FFFD），改为整字丢弃

---

## [v1.4-b] — 2026-06-04

### Added
- **ByteMD 编辑器**：以 ByteMD 双栏编辑器（GFM + highlight 插件）完整替换 Admin 后台的 Vditor，更接近 Typora 的写作体验
- **亮色/暗色预览切换**：编辑区右上角切换按钮，默认亮色预览
- **锚点跳转**：编辑器内点击目录标题链接，平滑滚动到对应预览区段落
- **Worker `/static/` 路由**：从 R2 `_static/` 前缀读取静态资源（JS/CSS），带 1 年强缓存，无需外部 CDN

### Changed
- ByteMD bundle（bytemd.bundle.js / bytemd.css / highlight.css）由 esbuild 预构建为 IIFE，存入 R2，通过 Worker 同域提供，消除跨域加载延迟
- CSP 移除 `http://localhost:9000`，bundle 由 `'self'` 覆盖

### Fixed
- 编辑器全屏模式只占半屏（`height: 100vh !important` 覆盖固定高度）
- 暗色主题下表格文字与背景同色不可见

---

## [v1.4-a] — 2026-06-02

### Added
- **浏览器设备授权**：`GET /auth/device` 页面，本地回调获取 JWT token，不存储密码
- **Typora 上传脚本** `scripts/typora-upload.sh`：token 缓存 + 过期自动重授权 + Typora stdout 协议输出
- **CLI 管理工具** `scripts/onimg-cli.py`：状态/登录/上传/记录/帮助，纯标准库无需 pip
- **一键安装脚本** `GET /install.sh`：由 Worker 动态生成并注入当前 origin，避免依赖外部 CDN 的可用性与访问限制
- **用户 Token 有效期**：per-user `tokenTtlDays`（1–365 天，默认 7 天），用户编辑弹窗支持配置
- **登录状态展示**：admin 用户表新增「登录状态」列（活跃/离线 + 最近登录时间 + N 天后过期）
- `docs/cli-usage.md` — CLI 与 Typora 集成完整使用手册

### Fixed
- Admin 列表不过滤软删除图片，导致删除后刷新重现
- Python `urllib` 默认 UA 会被边缘节点的 Bot 防护拦截，CLI 请求统一带浏览器 UA

---

## [v1.3（部分）] — 2026-05-31

### Added
- **审计日志后端**：按 UTC 天滚动写入（`audit:{day}`，cap 500，TTL 92 天），路由层集中埋点，记录 actor / target / status / IP
- `GET /admin/audit` 查询接口（支持日期/操作类型/actor 过滤）
- 覆盖范围：登录、删除、彻底清除、用户增删改、配置变更
- 新增 8 项单测（共 93 项）

---

## [v1.2] — 2026-05-30

### Added
- **回收站**：删除改为软删除，保留 30 天可恢复；每日 03:00 UTC cron 彻底清理到期内容
- **标签系统**：图片与原型支持自定义标签，admin/用户端标签筛选栏（AND 语义）；`normalizeTags` 去重/限长/XSS 清理
- **我的图库增强**：按名称/标签搜索 + 可见性筛选 + 排序（时间/体积/名称），全客户端
- **原型增量上传**：按内容指纹（FNV-1a）diff，仅传新增/变更文件；finalize 清理 orphan 文件，写回 manifest
- 新增 35 项单测（共 85 项）

### Performance
- **批间并发上传**：浏览器端并发池（CONCURRENCY=3）并行发多个批次，约 3× 提速，含指数退避重试
- **解析移出主线程**：`fflate.unzipSync` 移入 Blob Web Worker，大 ZIP 解压不再冻结 UI
- **批大小 40→45**：减少批次数（45 put + 3 KV ≤ 50 subrequest 免费版上限）
- **文件夹上传**：拖拽/选择文件夹直接构建 filesMap，跳过 zipSync + 服务端解压双重耗时

### Fixed
- 代码审查修复：标签 XSS、回收站操作防护（409）、孤儿状态异常

---

## [v1.2-a] — 2026-05-29

### Performance
- **全局图片计数缓存**（`gstats:v1` KV）：替代后台概览 O(n) R2 全桶扫描；上传/删除时 `waitUntil` 增量维护，冷启动/手动 reconcile 兜底

### Fixed
- 后台原型列表字段与前台对齐
- `prstats` slice 越界
- Slug 即时校验 + 保存前拦截重复/非法后缀

---

## [v1.1] — 2026-05-29

### Added
- **粘贴上传**：全局 `paste` 捕获剪贴板截图直传
- **批量操作**：图库多选 → 批量删除 / 批量改可见性
- **上传失败重试**：失败条目显示「重试」按钮
- **加载骨架屏**：图库/列表加载态骨架占位
- Vditor / fflate 懒加载 + 字体非阻塞加载（提升首屏性能）

---

## [v1.0] — 2026-05-15

### Added
- **图床**：拖拽/点击/多文件上传，R2 存储 + KV 元数据，公开/私密可见性，图片大图预览（lightbox），一键复制直链/Markdown/BBCode
- **用户系统**：登录/改密/`canUpload` 权限/配额（总量+每日）
- **页面托管**：Markdown/HTML 页面，Vditor 编辑器，`/p/:slug` 路由，密码保护，访问统计
- **原型托管**：ZIP 分片上传，多版本管理，版本对比 diff，密码保护与有效期，`/proto/:id` 静态服务
- **管理后台**：统计仪表盘，CF 额度监控，用户 CRUD（权限/配额/Token），配置管理，R2/成员/页面/原型统计
- **设计系统**：前后台统一侧边栏 + CSS 变量 token + Outfit/JetBrains Mono 字体
- **安全**：CSP allowlist，CORS 白名单，自定义 token，security headers
