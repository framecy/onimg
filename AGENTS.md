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

### `src/page.js` 与 `src/admin-page.js` 的反引号转义

这两个文件的内联 JS 整体嵌在外层模板字符串里，**内层反引号必须写成 `` \` ``，
`${}` 必须写成 `\${}`**。漏转义会导致语法错误、服务起不来：

```
SyntaxError: Unexpected token 'class'
```

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
- 提交前跑 `npx vitest run`（当前 204 项）
- CI 顺序要求 `build:css` 在 `npm test` 之前：`src/ui/aperture.generated.js` 是
  Tailwind 生成物且被 gitignore，而 `d1-integration` 测试会 import `src/index.js`，
  顺着 `index → page` 链条要求该文件存在
