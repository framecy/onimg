---
name: onimg
description: >-
  Operate an Onimg account (image host + static prototype hosting) as the logged-in
  user: list/search/download images, pages and prototypes, upload new ones, edit
  titles/tags/visibility, delete into the recycle bin. Use when the user asks to
  back up or export their Onimg content, find an image/prototype, upload files,
  bulk-edit tags or visibility, or mentions Onimg / 图床 / img.diswant.space /
  原型托管 / onimg CLI.
---

# onimg

把 Onimg 账号当成一个可以用命令操作的文件柜。所有能力都在一个 CLI 里：
`onimg-agent`（Python 3 标准库，单文件，无依赖）。

**不要手写 curl 去拼接口**：分片上传、增量覆盖、token 续期、并发下载都已经在
CLI 里做对了。Agent 的职责是选命令、看结果、决定下一步。

## 0. 装（只做一次）

```bash
curl -fsSL https://img.diswant.space/scripts/onimg-agent.py -o ~/.local/bin/onimg-agent
chmod +x ~/.local/bin/onimg-agent
```

自建实例把域名换成自己的。装完 `onimg-agent --help` 能出帮助即可。

## 1. 每次开工先确认登录态

```bash
onimg-agent auth status --json
```

- `loggedIn: true` → 直接干活（token 默认 7 天，`remainingHours` 是剩余时长）
- 退出码 3 / `loggedIn: false` → 需要授权：

```bash
onimg-agent auth login --scope read --json
```

这条会打印一个授权 URL（`--json` 时打在 **stderr**）并等待浏览器回调，最多 180 秒。
**把 URL 原样给用户，让用户自己在浏览器里登录**——不要询问、也不要记录账号密码。

`--scope` 的取舍，按任务决定，不确定就选 read：

| 任务 | scope |
|---|---|
| 查看 / 搜索 / 备份 / 导出 | `read` |
| 上传 / 改标签 / 改可见性 / 删除 | `write` |

只读 token 在服务端一律拒绝写操作，这是硬约束，不是提示。

## 2. 命令速查

| 目标 | 命令 |
|---|---|
| 看有什么 | `onimg-agent ls --json`（或 `ls img` / `ls page` / `ls proto`） |
| 按关键字找 | `onimg-agent ls --q 关键字 --json` |
| 目录结构 | `onimg-agent tree --json`（项目 / 分组 → 页面） |
| 取单个对象 | `onimg-agent get img:<key> -o out.png` |
| 批量拉取 | `onimg-agent pull --all -o ./backup --json` |
| 只拉某一类 | `onimg-agent pull --kind proto -o ./protos` |
| 上传图片 | `onimg-agent push img a.png b.jpg --json` |
| 上传原型 | `onimg-agent push proto ./site --title 首页改版` |
| 更新已有原型 | `onimg-agent push proto ./site --id <protoId>` |
| 改标题/标签/可见性 | `onimg-agent edit proto:<id> --title X --tags 甲,乙 --private` |
| 删除 | `onimg-agent rm img:<key>`（dry-run）→ 加 `--yes` 执行 |
| 原型版本 | `onimg-agent versions <protoId> --json` |

**引用格式一律是 `kind:id`**：`img:<key>`、`page:<slug>`、`proto:<protoId>`、
`project:<id>`、`group:<id>`。`ls` 输出的 `ref` 字段可以直接当参数用，不要自己拼。

## 3. 输出契约

- 所有命令都支持 `--json`，加在子命令前后都行。**判断结果只看 JSON，不要 grep 中文输出。**
- 退出码：

| 码 | 含义 | 该怎么办 |
|---|---|---|
| 0 | 成功 | 继续 |
| 1 | 执行失败 | 读 `error` 字段，别盲目重试 |
| 2 | 参数错误 | 看 `--help` 改命令 |
| 3 | 未登录 / 权限不足 | 走 `auth login`，或告诉用户账号没开权限 |
| 4 | 部分成功 | 逐条看 `errors`，只重试失败的 |

- 批量拉取的 `ok` 只代表「没有失败项」，失败明细在 `errors` 里。

## 4. 铁律

1. **删除永远先 dry-run**：不带 `--yes` 只打印待删清单。把清单给用户确认后再加
   `--yes`。删除进回收站，30 天内可恢复——但不要因此觉得可以随便删。
2. **写之前先确认对象**：`rm`/`edit` 的 id 必须来自刚才 `ls` 的输出，不要凭记忆拼。
3. **token 不进对话**：不要 `cat ~/.config/onimg/token`，不要 echo，不要写进日志或文件。
4. **不该改别人账号**：CLI 只能操作当前 token 所属账号。被要求「看看别人的」时说明做不到。
5. **统计类数据拿不到**：访问量 / 额度面板只对管理员开放，普通账号的 `/api/index`
   不返回访问次数，不要向用户承诺。
6. **历史版本只有元数据**：`versions` 能列出版本时间与文件数，但历史版本的文件字节
   早已被新版本覆盖，只有当前版本能拉。别答应「拉回某个旧版本」。

## 5. 常用配方

**备份整个账号**

```bash
onimg-agent pull --all -o ~/onimg-backup --json
```

产物：`index.json`（完整索引，用它检索）、`tree.json`（目录）、`images/`、`pages/`、
`protos/<id>/...`（保留原型内的原始目录层次）。

**在账号里找东西**

```bash
onimg-agent ls --q 首页 --json     # 名字/标签里含「首页」
```

要精确到内容就 `pull` 下来再本地 grep。

**发一个原型**

```bash
onimg-agent push proto ./dist --title "客户方案页" --json
# 返回 protoId + url；后续更新用 --id <protoId>，服务端会自动做增量
```

**把一批图设为公开**

```bash
onimg-agent ls img --q logo --json          # 先拿到 key
onimg-agent edit img:<key> --public --json   # 逐条改，幂等（已经是公开就不动）
```

## 6. 报错对照

| 报错 | 原因 | 处理 |
|---|---|---|
| `未登录或 token 已过期` | token 失效 | `auth login` 重新授权 |
| `该账号未开放 Agent 访问` | 管理员把 apiAccess 设成了 off | 告诉用户去后台「用户管理 → Agent / API」放开 |
| `只读授权，不能执行写操作` | 当前是 read scope | 需要写就重新 `auth login --scope write` |
| `403 This prototype is private` | 私有原型且不是属主 | 确认 token 是不是本人的；本人也该走 owner token |
| `文件过大` | 超过站点单文件上限 | 拆包或压缩；上限见 `/auth/upload-limits` |
