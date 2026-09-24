# Onimg 项目约定

本文件是 Onimg 仓库的项目级 agent 约定，只对本仓库生效。
通用工作规范见全局 `AGENTS.md`（`~/.dsh/AGENTS.md`）。

---

## 部署配置与 CI secret（重要）

`wrangler.toml` **不在仓库里**——它含 Cloudflare 个人账号的资源 ID（account_id /
KV namespace id / D1 database id），仓库对外公开，因此已加入 `.gitignore`。
仓库里放的是 `wrangler.toml.example`（占位符 + 注释）。

**CI 从 GitHub secret `WRANGLER_TOML` 还原配置文件**（见 `.github/workflows/deploy.yml`
的 `Restore wrangler.toml` 步骤）。

### ⚠️ 改了本地 wrangler.toml 后必须同步 secret

只要动过本地的 `wrangler.toml`（换域名、改配额、加绑定、改 vars……），**必须**同步更新
secret，否则 CI 部署用的还是旧配置：

```bash
gh secret set WRANGLER_TOML < wrangler.toml
```

GitHub 不提供读回 secret，所以**没法事后比对**——只能靠"改完立刻同步"的习惯。
判断线上跑的是哪份配置，看部署是否生效即可（比如改了域名后线上是否跟着变）。

### 相关事实

- 部署流程：push `main` → CI 跑测试 → `deploy` job 从 secret 还原 `wrangler.toml` → `wrangler deploy`
- 若 secret 缺失，`deploy` job 会**主动报错退出**（不会拿占位符部署到错误位置），线上服务不受影响
- 首次配置或换仓库时，需要的 secrets：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`、`WRANGLER_TOML`
- 写 CI 步骤时**不要**用 `"${{ secrets.X }}"` 直接内联进 `run` 脚本：配置文件含管道符 `|`、
  中文与换行，Actions 文本插值会破坏 shell 语法。要用 `env:` 传值再 `printf` 落盘。

---

## 代码约定

### ⚠️ `src/page.js` / `src/admin-page.js`：模板字符串转义（最容易踩的坑）

这两个文件的整体 HTML 是**在 Node 端拼出来的模板字符串**，里面嵌着要交给浏览器的 JS。
理解这一点是改这两个文件的前提：

- **`${...}` 是 Node 端插值**，会在渲染页面时立即求值
- **`\${...}` 是转义**，产物里留下 `${...}` 交给浏览器求值

**规则**：引用**浏览器端函数**（`esc` / `escAttr` / `jsStr` / `cp` / `openLb` …）时必须写 `\${fn(x)}`。

漏掉反斜杠的后果是**运行时 500**，不是语法错误：

```
{"error":"jsStr is not defined"}      # Node 端没有这个函数
```

**反引号同理**：内层反引号必须写成 `` \` ``，否则报 `SyntaxError: Unexpected token`。

#### 更隐蔽的一种：字符串里的反斜杠会被吃掉

模板字符串会解析 `\\` → `\`、`\n` → 换行。所以**在模板字符串里写的正则或转义序列会被破坏**：

```js
// 源码里这样写（看起来对，实际坏掉）：
.replace(/\\/g, '\\\\')     // 产物里变成 .replace(/\/g, '\\')  ← 正则坏了
.replace(/\r/g, '\\r')      // 产物里变成 .replace(/g, '\r')    ← 正则空了
```

**规避方式**：需要反斜杠时**别用字面量**，改用码点构造。`jsStr` 就是这么写的：

```js
var BS = String.fromCharCode(92);   // 反斜杠
var SQ = String.fromCharCode(39);   // 单引号
// 用 charCodeAt 判断 CR/LF/U+2028，源码里一个反斜杠都不出现
```

#### 改完必须真实渲染一次

**单元测试抓不到这类错误** —— 绝大多数测试直接调 handler，不走 `renderPage`。
发生过一次：243 项测试全绿，但线上页面直接 500。

```bash
node -e "import('./src/page.js').then(m=>console.log(m.renderPage({}).length))"
# 或起本地服务看首页是否 200
```

`test/features/render-smoke.test.js` 已覆盖这一点，改完这两个文件务必确认它通过。

#### 还有一类同族坑：浏览器端语法错误（Node 端完全无感）

上面那类是「Node 端误求值」。但产物里嵌的 JS 是**交给浏览器执行的**，只要它有任何
语法错误（哪怕只是大括号多写一个 `}`），浏览器就会**静默丢弃整段 `<script>`**：

- `renderPage` 正常返回、页面照常打开、HTTP 200、所有单元测试全绿
- 但**所有 `onclick` / `addEventListener` 都不会注册**
- 用户表现就是「点了没反应」—— 看起来像登录坏了、按钮坏了，其实是整段脚本没了

真实发生过一次：`jsStr()` 定义末尾多写一个 `}}`，**253 项测试全绿、CI 部署 success**，
线上前台后台的按钮（含登录）**全部点不动**。定位方法是 curl 线上页面、抓出所有
`<script>` 块、逐个 `node --check`，一步就指到了那一行。

`render-smoke.test.js` 现在会把产物里每个内联脚本块真实交给 V8 解析（用例名带
「浏览器端语法」），这类错误在提交前就会被拦住，不用等到线上才发现。

### 转义函数的选用（三种上下文）

| 上下文 | 用哪个 | 说明 |
|---|---|---|
| 文本节点 `<div>${esc(x)}</div>` | `esc()` | 只转 `& < >` |
| 属性值 `title="${escAttr(x)}"` | `escAttr()` | 额外转 `"`，防止突破属性边界 |
| `onclick="fn(\${jsStr(x)})"` | `jsStr()` | **属性 + JS 字符串双重上下文**，自带引号，不要再手写 `''` |

**不要用 `escAttr()` 去替换 onclick 里的 `esc()`** —— 转成 `&quot;` 后 JS 拿到的不是引号，
参数值会出错。同理不要用 `esc()` 处理属性值。

新增这类代码时，`test/features/js-attr-escaping.test.js` 里的往返验证
（HTML 解析 → JS 求值应等于原值）是判断转义是否正确的可靠手段。

### 内联脚本的双份维护

`scripts/onimg-cli.py` 与 `scripts/typora-upload.sh` 同时以字符串常量
（`ONIMG_CLI_PY` / `TYPORA_UPLOAD_SH`）内联在 `src/index.js` 中，运行时用的是内联副本。
**改动这两个脚本后要同步更新 `index.js` 里的常量**，否则线上行为不变。

### 存储层

- 元数据全部走 D1（`src/kv-d1.js` 是 KVNamespace 契约 + D1 内核，在 `src/index.js`
  的 `withD1Stats` 里把 `env.STATS` 就地替换）
- 业务代码只认 `env.STATS` 的 KV 接口，所以换存储不用改调用点
- KV 绑定保留着作回滚路径；删掉 `wrangler.toml` 的 `[[d1_databases]]` 段即退回 KV

---

## 提交与验证

- 推 `main` 会自动触发 CI 部署（`.github/workflows/deploy.yml`）
- 提交前跑 `npx vitest run`（当前 256 项 / 21 个文件）
- CI 顺序要求 `build:css` 在 `npm test` 之前：`src/ui/aperture.generated.js` 是
  Tailwind 生成物且被 gitignore，而 `d1-integration` 测试会 import `src/index.js`，
  顺着 `index → page` 链条要求该文件存在

### 改动 `page.js` / `admin-page.js` 后的必查项

1. `node --check src/page.js`（语法，只覆盖 Node 端）
2. `npx vitest run test/features/render-smoke.test.js`（**真实渲染 + 浏览器端脚本解析**，
   一个文件同时抓两类坑：Node 端误求值、浏览器端脚本语法错误）
3. 起本地服务看首页与管理端是否 200（最终确认）

第 2 步**不能省**，而且它是唯一能同时抓住两类坑的测试：

- 「模板字符串里漏写反斜杠」→ Node 端误求值，线上 500
- 「浏览器端脚本有多余的 `}`」→ 整段 `<script>` 被静默丢弃，页面 200 但所有按钮点不动

两者在源码里都不报错、`node --check` 也查不出来（第二类甚至能蒙混过关），
只有真实渲染产物再交给 V8 解析才能发现。历史上 253 项全绿、CI success，线上登录却点不动。
