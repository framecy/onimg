# Onimg CLI & Typora 集成使用手册

> 适用版本：v1.4-a（2026-06）

---

## 安装

### 一键安装（推荐）

```bash
curl -fsSL https://img.diswant.space/install.sh | bash
```

脚本自动完成：
1. 检测 `python3` / `curl` 依赖
2. 下载 `onimg-cli.py`、`onimg-upload`、`onimg` 到 `~/.local/bin/`
3. 写入 `~/.config/onimg/config`（仅保存服务器地址，不存任何密码）
4. 输出 Typora 配置路径与首次使用指引

### 手动安装

```bash
# 从 Onimg 服务直接下载
curl -fsSL https://img.diswant.space/scripts/onimg-cli.py -o ~/.local/bin/onimg-cli.py
curl -fsSL https://img.diswant.space/scripts/typora-upload.sh -o ~/.local/bin/onimg-upload
chmod +x ~/.local/bin/onimg-cli.py ~/.local/bin/onimg-upload

# 写入 onimg 快捷入口
echo '#!/usr/bin/env bash' > ~/.local/bin/onimg
echo 'exec python3 "$HOME/.local/bin/onimg-cli.py" "$@"' >> ~/.local/bin/onimg
chmod +x ~/.local/bin/onimg

# 写入配置
mkdir -p ~/.config/onimg
echo 'ONIMG_URL=https://img.diswant.space' > ~/.config/onimg/config
```

### 将 `~/.local/bin` 加入 PATH

```bash
# 加入 ~/.zshrc 或 ~/.bashrc
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

## 首次使用

```bash
onimg
```

主界面显示「未登录」时，选 **`[2] 登录 / 重新授权`**：

1. 浏览器自动打开 `https://img.diswant.space/auth/device`
2. 输入 Admin 或管理员为你创建的账号密码
3. 点击「登录并授权」
4. 浏览器显示「授权成功，可以关闭此窗口」
5. CLI 自动继续，token 缓存至 `~/.config/onimg/token`

之后每次使用无需重复登录，直到 token 过期。

---

## CLI 功能详解

### 主界面布局

```
┌── Onimg  CLI ──────────────────────────────────────┐
│   服务器  img.diswant.space                         │
│   账  号  ● alice  用户                             │
│   有效期  6 天 22 小时后过期                         │
│   配  额  今日 3 次 · 累计 15 次                     │
└────────────────────────────────────────────────────┘

  [1]  刷新状态
  [2]  登录 / 重新授权  (浏览器)
  [3]  退出登录
  [4]  测试上传
  [5]  最近上传记录
  [6]  修改服务地址
  [?]  使用说明
  [q]  退出
```

### `[1]` 查看状态

显示：
- 服务器地址
- 账号名与角色（用户 / Admin）
- Token 精确过期时间（`YYYY-MM-DD HH:MM` + 剩余时间）
- 今日上传次数 / 累计上传次数
- 配置文件和 token 文件路径

### `[2]` 登录 / 重新授权

- 启动本地临时 HTTP 回调服务器（随机端口，仅监听 localhost）
- 打开浏览器至设备授权页
- 用户输入账号密码后，页面自动重定向 `http://localhost:<port>/cb?token=<jwt>`
- CLI 捕获 token，写入 `~/.config/onimg/token`（权限 600）
- **不存储密码**，仅缓存 JWT token

### `[3]` 退出登录

删除 `~/.config/onimg/token`，下次使用时重新触发浏览器授权。

也可手动执行：
```bash
rm ~/.config/onimg/token
```

### `[4]` 测试上传

```
▶ 图片路径（可拖入文件）: /path/to/image.jpg
```

- 支持直接输入路径或从 Finder 拖入（自动去除引号/空格）
- 显示文件大小、返回 URL 与 Markdown 格式：
  ```
  ✓  上传成功  (218.3 KB)

  URL:
  https://img.diswant.space/1780385729731-xxxx.jpg

  Markdown:
  ![](https://img.diswant.space/1780385729731-xxxx.jpg)
  ```

### `[5]` 最近上传记录

列出最近 20 条上传记录：

```
  最近上传  (共 12 条)

  文件名                               大小  时间            公开
  ─────────────────────────────────────────────────────────
  1780381443249-027496a2.png         70 B  06-02 14:24    私有
  Water Purification Plant.jpg    218 KB  06-02 18:38    私有
```

### `[6]` 修改服务地址

更新 `~/.config/onimg/config` 中的 `ONIMG_URL`，适用于切换不同 Onimg 实例或本地开发环境。

更换地址后建议删除旧 token（新服务的密钥不同）：
```bash
rm ~/.config/onimg/token
```

### `[?]` 使用说明

内置帮助，包含：快速开始、Typora 配置、Token 管理、文件路径、管理后台入口。

---

## Typora 集成配置

### 步骤

1. 打开 Typora → **偏好设置**（`Cmd+,`）
2. 左侧点击「**图像**」
3. 「上传服务」选择 **Custom Command**
4. 命令栏填入：
   ```
   ~/.local/bin/onimg-upload
   ```
5. 点击「**验证图片上传选项**」

验证时 CLI 会自动打开浏览器完成首次授权（如尚未登录）。

### 日常使用

配置完成后，在 Typora 中：

| 操作 | 结果 |
|---|---|
| 粘贴截图（Cmd+V） | 自动上传，链接替换 |
| 拖入图片文件 | 自动上传，链接替换 |
| 右键图片 → 上传图片 | 单张上传 |
| 编辑 → 上传所有本地图片 | 批量上传文档内所有图片 |

上传完成后，Markdown 文档中的本地图片路径自动替换为：
```markdown
![](https://img.diswant.space/1780385729731-xxxx.jpg)
```

### Typora 上传脚本说明

`onimg-upload`（即 `typora-upload.sh`）的工作流：

```
Typora 调用: onimg-upload "img1.png" "img2.jpg"
      ↓
读取 ~/.config/onimg/config 获取服务器地址
      ↓
检查 ~/.config/onimg/token 是否有效（解析 JWT exp 字段）
      ↓
  ┌ 有效 → 直接上传
  └ 无效 → 启动浏览器授权 → 获取新 token → 上传
      ↓
输出（Typora 读最后 N 行作为 URL）：
  Upload Success:
  https://img.diswant.space/...
  https://img.diswant.space/...
```

---

## Token 管理

### 有效期

Token 默认有效期 **7 天**，由管理员在 Admin → 用户管理 → 编辑用户 中为每位用户单独设置（1–365 天）。

### 自动续期

- Typora 上传时：若 token 过期，脚本自动打开浏览器重新授权后继续上传，全程无需手动干预
- CLI 使用时：主界面直接显示剩余有效期，到期前可手动选 `[2]` 提前刷新

### 手动操作

```bash
# 查看 token 信息
python3 -c "
import base64, json, time
tok = open('$HOME/.config/onimg/token').read().strip()
seg = tok.split('.')[0]; seg += '=' * (-len(seg) % 4)
p = json.loads(base64.b64decode(seg))
rem = (p.get('exp',0)/1000 - time.time()) / 86400
print(f'账号: {p[\"username\"]}  剩余: {rem:.1f} 天')
"

# 清除 token（强制重新登录）
rm ~/.config/onimg/token
```

---

## 文件路径参考

| 路径 | 说明 |
|---|---|
| `~/.local/bin/onimg` | CLI 入口（exec wrapper） |
| `~/.local/bin/onimg-cli.py` | CLI 主程序 |
| `~/.local/bin/onimg-upload` | Typora 上传脚本 |
| `~/.config/onimg/config` | 配置文件（仅含服务器地址） |
| `~/.config/onimg/token` | JWT token 缓存（自动管理） |

---

## 故障排查

### 上传失败 403 / error 1010

Cloudflare Bot 防护拦截。确认使用的是最新版 `onimg-cli.py`（v1.4-a+），该版本已加入正确的 User-Agent。

重新安装：
```bash
curl -fsSL https://img.diswant.space/install.sh | bash
```

### 浏览器授权超时

脚本最多等待 120 秒。若超时，重新运行 CLI 或 Typora 上传即可重新触发授权。

### Token 与服务器不匹配

更换服务器地址后，旧 token 无法在新服务器验证。清除后重新授权：
```bash
rm ~/.config/onimg/token
onimg  # 选 [2] 重新登录
```

### PATH 中找不到 onimg 命令

```bash
# 确认文件存在
ls ~/.local/bin/onimg

# 确认 PATH 包含该目录
echo $PATH | tr ':' '\n' | grep local

# 临时修复（当前会话）
export PATH="$HOME/.local/bin:$PATH"

# 永久修复（写入 shell 配置）
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

## 服务端接口（供脚本/自动化使用）

### 认证

```bash
# 登录获取 token
TOKEN=$(curl -sf -X POST https://img.diswant.space/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"..."}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
```

### 上传图片

```bash
curl -sf -X POST https://img.diswant.space/upload \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: image/jpeg" \
  --data-binary "@photo.jpg"
# → {"url":"https://img.diswant.space/...","key":"...","size":...}
```

### 设备授权（CLI 流程）

```
GET /auth/device?callback=http://localhost:<PORT>/cb
```

浏览器端完成登录后，页面 JS 重定向至 callback URL，携带 `?token=<jwt>` 参数。callback 必须是 `http://localhost:*` 或 `http://127.0.0.1:*`，其他地址返回 400。
