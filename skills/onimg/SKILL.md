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

## 0. 装（只做一次，AI 可自助完成）

用户只给仓库地址 `https://github.com/framecy/onimg` 时，Agent 自己按下图装完，
不要让用户手动复制命令、不要先问「装没装」——能自助就自助。

**前置（缺一不可，缺了就地补，不要直接报错）**：`python3`、`curl`、可写目录
`~/.local/bin`、能打开浏览器的环境（仅授权和登录那一步需要）、一个已开通
Agent 访问的 Onimg 账号（管理员在后台「用户管理 → Agent / API」设为只读/读写；
未开通时 `auth login` 会被服务端拒绝，要告诉用户找管理员开）。

```bash
command -v python3 curl          # 缺哪个先装哪个（单文件、纯标准库，无 pip 依赖）
mkdir -p ~/.local/bin
# 方式 A（有线上实例时优先）：从服务器下发
curl -fsSL https://img.diswant.space/scripts/onimg-agent.py -o ~/.local/bin/onimg-agent
# 方式 B（只有仓库地址、或服务器不可达时）：AI 直接从 GitHub 仓库取
curl -fsSL https://raw.githubusercontent.com/framecy/onimg/main/scripts/onimg-agent.py -o ~/.local/bin/onimg-agent
chmod +x ~/.local/bin/onimg-agent
```

Skill 文本本身也从仓库取，保存到 Agent 的技能目录后按本文执行：

```bash
curl -fsSL https://raw.githubusercontent.com/framecy/onimg/main/skills/onimg/SKILL.md -o /tmp/onimg-SKILL.md
```

装完立刻验（`~/.local/bin` 不在 PATH 时用全路径 `~/.local/bin/onimg-agent`）：

```bash
onimg-agent --help        # 能出帮助即装好
onimg-agent --version
```

**配置（默认不用配）**：未写配置时默认连 `https://img.diswant.space`，自建实例
用环境变量 `ONIMG_URL=<你的域名>` 或写 `~/.config/onimg/config`（一行
`ONIMG_URL=<域名>`）。`onimg-agent auth status --json` 能返回 JSON 即通路正常；
未登录按 §1 授权（浏览器回调，用户自己登录，不要索要密码）。

**保持最新**：脚本本身就是服务器下发的静态资源，一条命令自更新（会先校验语法，
再原子替换，半截文件不会覆盖掉自己）：

```bash
onimg-agent update --json      # {"changed": true, "from": "1.0.0", "to": "1.1.0"}
onimg-agent --version
```

Skill 文本本身不会自动更新——它只是本地的一份说明书。命令有变化时重新拉取
（仓库路径即上文的 raw 链接，`skills/onimg/SKILL.md`）。

## 1. 黄金原则（先读这三条，路径都从这来）

`ls` / `tree` / `pull` 每次都会整量拉取 `/api/index`（图片 + 页面 + 原型全索引，
实测 3–25 秒，服务端忙时更久）；`--q` 是**本地**过滤，不省这一次拉取。
`auth status` 是本地解析 JWT（~0.1 秒）；`get` / `push` / `edit` / `rm` 不拉索引。

1. **索引一次拉取，落盘复用**：同一次会话里，第一次需要「找对象 / 查冲突 /
   找项目分组」时，用 `--save-index` 把**原始索引**落盘到 `/tmp/onimg-index.json`，
   之后 `ls` / `tree` 都加 `--index-file /tmp/onimg-index.json` 读它，零网络
   （原始索引一份同时供 ls 和 tree 用；`ls` / `tree` 的输出格式推不出原始索引，
   所以必须在在线拉取那一刻存）。禁止裸打 `ls --json` / `tree --json` 到屏幕——
   动辄 7–15 万字符会被截断截掉关键信息，逼得反复重拉。
   缓存只对**当前登录账号 + 服务器**有效：换账号/换服务器、或用户在网页端
   改过内容后，必须重拉一次（`--index-file` 不给就是在线拉）。
2. **写完不重查，信 JSON**：`push` / `edit` 的返回里已有 `ok` + `url` /
   `slug` / `key` / `protoId`，这就是验证结果。禁止为了「确认一下」再打
   `ls` / `tree`。写操作会让缓存里的该类对象过期：后续还要查同类时，
   用响应中的新 ref 就地补进缓存，或重拉一次（仅一次）。
3. **本地检查先行，网络调用不串联**：文件存在 / 大小 / 类型、slug 冲突、
   ref 来源，全部在本地查完再发请求。多个**独立**的网络调用放同一 step
   并行发出，禁止用 `;` 把几个网络命令串成一条长链（耗时线性叠加）。

**每次开工（所有任务共用，1 次）**：

```bash
onimg-agent auth status --json
```

- `loggedIn: true` 且 scope 够用 → 直接干活（`auth status` 是本地解析，极快）
- 写任务但 `scope: read` → 先 `auth login --scope write`（见下），别先跑写命令碰 403
- 退出码 3 / `loggedIn: false` → 需要授权：

```bash
onimg-agent auth login --scope write --json   # 只读任务用 --scope read
```

这条会打印一个授权 URL（`--json` 时打在 **stderr**）并等待浏览器回调，最多 180 秒。
**把 URL 原样给用户，让用户自己在浏览器里登录**——不要询问、不要记录账号密码。

| 任务 | scope |
|---|---|
| 查看 / 搜索 / 备份 / 导出 / 读取图片 | `read` |
| 上传 / 更新 / 改标签 / 改可见性 / 删除 | `write` |

只读 token 在服务端一律拒绝写操作，这是硬约束，不是提示。

**按需拉索引（同会话只拉一次）**：

```bash
# 第一次需要找对象/查冲突/找项目分组时（在线拉一次 + 存原始索引）：
onimg-agent ls --save-index /tmp/onimg-index.json --json > /dev/null
# 之后所有 ls / tree 都读文件，零网络：
onimg-agent ls proto --index-file /tmp/onimg-index.json --json
onimg-agent tree --index-file /tmp/onimg-index.json --json > /dev/null
```

之后本地查（毫秒级，可反复跑；查的是原始索引文件）：

```bash
python3 -c "
import json
d=json.load(open('/tmp/onimg-index.json'))
for p in d['pages']:
    if '配型台' in (p.get('title') or ''): print('page:' + p['slug'], '|', p.get('title'))
for p in d['protos']:
    if 'SDW' in (p.get('title') or ''): print('proto:' + p['protoId'], '|', p.get('title'))
"
python3 -c "
import json
d=json.load(open('/tmp/onimg-index.json'))
for p in d['projects']:
    print(p['id'], '|', p['name'])
    for g in d['groups']:
        if g.get('projectId') == p['id']:
            n = sum(1 for pg in d['pages'] if pg.get('groupId') == g['id'])
            print('  ', g['id'], '|', g['name'], '|', n, '页')
"
```

## 2. 命令速查

| 目标 | 命令 |
|---|---|
| 看有什么 | `onimg-agent ls --json`（或 `ls img` / `ls page` / `ls proto`） |
| 按关键字找 | `onimg-agent ls --index-file /tmp/onimg-index.json --q 关键字 --json`（本地过滤，零网络） |
| 目录结构 | `onimg-agent tree --json`（项目 / 分组 → 页面） |
| 取单个对象 | `onimg-agent get img:<key> -o out.png` |
| 批量拉取 | `onimg-agent pull --all -o ./backup --json` |
| 只拉某一类 | `onimg-agent pull --kind proto -o ./protos` |
| 只拉一个 | `onimg-agent pull page:<slug> -o ./out --json`（img/page 不拉索引；proto 仍需索引） |
| 上传图片 | `onimg-agent push img a.png b.jpg --json`（批量默认并发 4） |
| 上传原型 | `onimg-agent push proto ./site --title 首页改版` |
| 更新已有原型 | `onimg-agent push proto ./site --id <protoId>` |
| 新建文档 | `onimg-agent push page ./周报.md --title 周报` |
| 替换文档正文 | `onimg-agent edit page:<slug> --file ./v2.html` |
| 定点改一处 | `onimg-agent edit page:<slug> --replace "旧=新"` |
| 读文档正文 | `onimg-agent get page:<slug> -o -` |
| 改标题/标签/可见性 | `onimg-agent edit proto:<id> --title X --tags 甲,乙 --private` |
| 新建分组 | `onimg-agent group create --name <名称> [--project <pr_xxx>] --json` |
| 移动页面到分组 | `onimg-agent edit page:<slug> --group <gr_xxx> --index-file /tmp/onimg-index.json --json` |
| 删除 | `onimg-agent rm img:<key>`（dry-run）→ 加 `--yes` 执行 |
| 原型版本 | `onimg-agent versions <protoId> --json` |
| 更新自己 | `onimg-agent update` |

**引用格式一律是 `kind:id`**：`img:<key>`、`page:<slug>`、`proto:<protoId>`、
`project:<id>`、`group:<id>`。`ls` 输出的 `ref` 字段可以直接当参数用，不要自己拼。

## 3. 操作路径（每条都是最短链路：鉴权 → 本地查 → 写 → 信 JSON）

单对象操作**不要建 todo 清单**，直接按路径走。路径里的「查缓存」指 §1 的
`/tmp/onimg-index.json`（原始索引）；缓存不存在或已过期时才拉一次。

### 3.1 上传图片

```bash
ls -lh <本地图片路径>          # 本地核对存在 + 大小（CLI 也会查，提前查省一次往返）
onimg-agent push img <文件...> --json
```

- 图片不需要项目 / 分组，**不拉索引、不查任何目录**。
- 批量传图默认并发 4（`--concurrency N`，`1` = 串行）；返回 `results[]` 按输入
  顺序，`results[].key` / `url` 即完成；批量时看 `uploaded` 与 `results[].error`
  （退出码 4 = 部分成功，只重试失败文件）。401/403 是账号级错误，整批按授权错误退出。
- 大文件（几十 MB 起）先和用户确认站点单文件上限再传，别传到一半才撞 `文件过大`。
- 防错：同名重复上传会生成新 key。用户说的是「上传新图」就直接传；
  说「确保有这张图」才先查缓存里有没有同名 key。

### 3.2 读取图片（看图 / 下载）

```bash
# 已知 key：直接下载，不拉索引
onimg-agent get img:<key> -o /tmp/<name>.png
# 不知道 key：先查缓存（没有才按 §1 拉一次原始索引）
python3 -c "...按文件名/key 匹配..."   # 见 §1 本地查法
```

- 下载到本地后用文件读取工具看图。`get img:` 走的是图片直链，不依赖索引。
- 图片直链永远可访问，**不要给读取加 token 校验**（见全局约定，这是设计）。

### 3.3 上传文档 / HTML（新建 page）

```bash
# 1) 本地核对：文件存在、大小
ls -lh <file.html>
# 2) 查缓存：目标项目的分组 ID + slug 冲突（原始索引 pages[].slug）
#    --slug 省略时取文件名 slugify（中文字符会被保留进 slug）；显式给 --slug 时以它为准
onimg-agent push page <file.html> --title "..." --slug <slug> --type html \
    --project <pr_xxx> --group <gr_xxx> --public --json
```

- `--type` 按扩展名自动判定（`.html/.htm`→html，`.md/.txt`→markdown），
  显式传 `--type` 更保险，尤其文件是 stdin / 临时文件时。
- **对外分享的页面必须显式 `--slug`（ASCII）**：默认 slugify 会把中文保留进
  slug，URL 里带中文可打开但难复制、易在聊天工具里被截断。文件名无可用字符时
  CLI 会直接报参数错误（退出码 2），不会静默生成 `page-<时间戳>`。
- `--public` 是默认值，显式写出；私有才加 `--private`（不进公开列表）。
- **slug 冲突即停**：slug 已存在时不要硬 `push`——先判断意图：要替换正文走
  §3.4 的 `edit`；要新建就换 slug。凭缓存里的 slug 列表判断，不凭记忆。
- 返回 `slug` / `url` 即完成，不再 `ls` 验证。

### 3.4 更新文档 / HTML

```bash
# 整篇替换（本地已改好新版）
onimg-agent edit page:<slug> --file <v2.html> --json
# 只改一处（服务端取回原文替换，找不到 OLD 直接报错退出，不会静默不改）
onimg-agent edit page:<slug> --replace "旧=新" --json
# 改标题 / 可见性（可与正文同一次调用）
onimg-agent edit page:<slug> --title "..." --public --json
```

- slug 必须来自缓存或用户原话，**不要凭记忆拼**；不确定就查一次缓存。
- 改类型：`edit page:<slug> --type html`（markdown ↔ html）。
- 返回 `changed` 字段即完成。

### 3.5 上传原型 / 更新原型 / 匹配原型

```bash
# 新建：目录或 zip 均可，服务端解压
onimg-agent push proto ./dist --title "客户方案页" --json
# 更新已有：增量覆盖，--id 必须来自 ls 缓存里的 ref（proto:<protoId>）
onimg-agent push proto ./dist --id <protoId> --json
# 匹配 / 找原型：查 ls 缓存（name 含关键字），拿到 ref 直接用
onimg-agent versions <protoId> --json   # 只看版本元数据，不拉历史字节
```

- 返回 `protoId` / `url` / `version` / `files` 即完成，不重查。
- 大目录先看总大小（`du -sh`），超站点单文件上限先拆包/压缩再传。
- 历史版本只有元数据，文件字节已被覆盖——**不要承诺拉回旧版本**。
- 原型只有一个整包重传路径，没有单文件编辑；页面改正文走 `edit page:`。

### 3.6 改图片 / 原型的标题、标签、可见性

```bash
onimg-agent ls img --index-file /tmp/onimg-index.json --q logo --json  # 先拿 key
onimg-agent edit img:<key> --public --json  # 幂等：已是公开就不动
onimg-agent edit proto:<id> --title X --tags 甲,乙 --private --json
```

批量改（一次拉索引拿全部 ref，逐条 edit；edit 本身幂等、可重复）：

```bash
python3 -c "
import json
d=json.load(open('/tmp/onimg-index.json'))
for i in d['images']:
    if 'logo' in (i.get('name') or ''): print('img:' + i['key'])
" > /tmp/refs.txt
while read -r ref; do onimg-agent edit "$ref" --public --json; done < /tmp/refs.txt
```

- 匹配只按名字子串（CLI 的 `--q` 就是本地子串过滤）：近名对象（`DMv5.1.1` vs
  `DMv5.1.1_v1.3`）必须把候选清单先给用户确认，别直接取第一个。

### 3.7 删除（永远 dry-run 先行）

```bash
onimg-agent rm <ref...>                     # dry-run：纯本地打印清单，不发请求
# 人工核对清单无误后：
onimg-agent rm <ref...> --yes
```

- dry-run **不校验 ref 是否存在**，所以 ref 必须来自索引缓存，禁止凭记忆拼。
- 删除进回收站，30 天内可恢复——但**CLI 没有恢复命令**，恢复只能去后台回收站
  操作；agent 不要承诺能自己恢复，也不要因此跳过 dry-run。
- 批量删除：先 dry-run 全部，再一次 `--yes` 执行全部，不要逐条确认。

### 3.8 备份整个账号

```bash
onimg-agent pull --all -o ~/onimg-backup --json
```

产物：`index.json`（完整索引，用它检索）、`tree.json`（目录）、`images/`、
`pages/`、`protos/<id>/...`。这条本身会拉一次索引，拉完后本地直接查
`index.json`，不要再打 `ls` / `tree`。

### 3.9 读文档正文

```bash
onimg-agent get page:<slug> -o -            # 正文打到 stdout（可管道 / 重定向）
```

### 3.10 新建分组

```bash
# 挂在项目下（--project 给项目 ID，来自索引缓存 projects）：
onimg-agent group create --name 客户方案 --project <pr_xxx> --json
# 独立分组（不挂项目）：去掉 --project 即可
```

- 名称 1–64 字符（CLI 本地校验，空/超长直接退出码 2，不发请求）。
- 返回 `ref: group:<id>` + `projectId` 即完成；id 来自服务端随机生成，不要拼。

### 3.11 移动已有页面到分组

```bash
# 只给 --group（推荐）：CLI 按索引自动补上该分组所属的 projectId
onimg-agent edit page:<slug> --group <gr_xxx> --index-file /tmp/onimg-index.json --json
# 同时显式给两者（必须一致，否则 CLI 直接报错退出）：
onimg-agent edit page:<slug> --project <pr_xxx> --group <gr_xxx> --index-file /tmp/onimg-index.json --json
# 移出分组（回到项目根目录）：--group none；彻底未归类：再加 --project none
onimg-agent edit page:<slug> --group none --index-file /tmp/onimg-index.json --json
```

- 带 `--index-file` 时 CLI 会校验：分组存在、项目存在、分组归属与 `--project`
  一致（不一致直接退出码 2，不会写出脏归属）。不带索引则盲传，信任所给 ID。
- 返回 `changed` 含 `groupId`（以及自动补的 `projectId`）即完成，不重查索引。
- 刚新建的分组不在旧缓存里：先重拉一次索引（§1）再移动，别报「分组不在缓存里」
  就硬写。

## 4. 输出契约

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

## 5. 铁律

1. **索引同会话只拉一次**：不带 `--index-file` 的 `ls` / `tree` / `pull`
   每次都是全量 `/api/index`。第一次用 `--save-index` 落盘原始索引，之后
   全部加 `--index-file` 复用（§1）。禁止一条任务里反复在线 `ls` / `tree`
   探结构、猜字段。要看结构就把 JSON 存盘后本地 python 打印 keys，
   **永不裸打全量 JSON**。
2. **删除永远先 dry-run**：不带 `--yes` 只打印待删清单（纯本地，毫秒级）。
   人工核对清单后再加 `--yes`。CLI 没有恢复命令，恢复走后台回收站。
3. **写之前先确认对象**：`rm` / `edit` / `push proto --id` 的 id 必须来自刚才
   落盘的索引缓存（或本次写的返回），不要凭记忆拼。
   `push page` 前先在缓存 `pages[].slug` 里查 slug 冲突。
4. **写完信 JSON，不重查**：`push` / `edit` 返回 `ok:true` + `url` 就是成功，
   不再拉索引验证。需要写后状态时，用响应里的新 ref 补缓存。
5. **token 不进对话**：不要 `cat ~/.config/onimg/token`，不要 echo，不要写进日志或文件。
6. **不该改别人账号**：CLI 只能操作当前 token 所属账号。被要求「看看别人的」时说明做不到。
7. **统计类数据拿不到**：访问量 / 额度面板只对管理员开放，普通账号的 `/api/index`
   不返回访问次数，不要向用户承诺。
8. **历史版本只有元数据**：`versions` 能列出版本时间与文件数，但历史版本的文件字节
   早已被新版本覆盖，只有当前版本能拉。别答应「拉回某个旧版本」。

## 6. 报错对照

| 报错 | 原因 | 处理 |
|---|---|---|
| `未登录或 token 已过期` | token 失效 | `auth login` 重新授权 |
| `该账号未开放 Agent 访问` | 管理员把 apiAccess 设成了 off | 告诉用户去后台「用户管理 → Agent / API」放开 |
| `只读授权，不能执行写操作` | 当前是 read scope | 需要写就重新 `auth login --scope write` |
| `403 This prototype is private` | 私有原型且不是属主 | 确认 token 是不是本人的；本人也该走 owner token |
| `文件过大` | 超过站点单文件上限 | 拆包或压缩；上限见 `/auth/upload-limits` |
| `原文里找不到要替换的内容` | `--replace` 的 OLD 不在正文里 | 先 `get page:<slug> -o -` 看原文再改，别硬套 |
| `文件不存在` | 本地路径错 / 文件没落盘 | 先 `ls -lh` 核对路径再重传 |
