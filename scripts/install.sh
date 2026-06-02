#!/usr/bin/env bash
# Onimg CLI 安装脚本
# 用法：curl -fsSL https://img.diswant.space/install.sh | bash
#   或：bash install.sh --url https://img.diswant.space

set -euo pipefail

ONIMG_URL="${ONIMG_URL:-}"
INSTALL_DIR="${ONIMG_INSTALL_DIR:-$HOME/.local/bin}"
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/onimg"
REPO_RAW="https://raw.githubusercontent.com/framecy/onimg/main/scripts"

# ── 解析参数 ──────────────────────────────────────────────────────────────────

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url) ONIMG_URL="$2"; shift 2 ;;
    --dir) INSTALL_DIR="$2"; shift 2 ;;
    *) shift ;;
  esac
done

# ── 颜色 ─────────────────────────────────────────────────────────────────────

if [[ -t 1 ]]; then
  GRN='\033[92m'; YLW='\033[93m'; CYN='\033[96m'
  RED='\033[91m'; DIM='\033[2m';  RST='\033[0m'; BOLD='\033[1m'
else
  GRN=''; YLW=''; CYN=''; RED=''; DIM=''; RST=''; BOLD=''
fi

ok()  { echo -e "  ${GRN}✓${RST}  $*"; }
inf() { echo -e "  ${CYN}ℹ${RST}  $*"; }
err() { echo -e "  ${RED}✗${RST}  $*" >&2; }
hdr() { echo -e "\n${BOLD}$*${RST}"; }

# ── 检查依赖 ──────────────────────────────────────────────────────────────────

hdr "Onimg CLI 安装程序"
echo ""

for cmd in python3 curl; do
  if ! command -v "$cmd" &>/dev/null; then
    err "缺少依赖：$cmd"
    exit 1
  fi
done
ok "依赖检查通过 (python3 + curl)"

# ── 确定服务器地址 ────────────────────────────────────────────────────────────

if [[ -z "$ONIMG_URL" ]]; then
  # 尝试从已有配置读取
  if [[ -f "$CONFIG_DIR/config" ]]; then
    ONIMG_URL=$(grep '^ONIMG_URL=' "$CONFIG_DIR/config" | cut -d= -f2 | tr -d "'\"\n" || true)
  fi
fi

if [[ -z "$ONIMG_URL" ]]; then
  echo ""
  echo -e "  ${YLW}请输入 Onimg 服务器地址${RST}"
  read -rp "  URL [https://img.diswant.space]: " input_url
  ONIMG_URL="${input_url:-https://img.diswant.space}"
fi

ONIMG_URL="${ONIMG_URL%/}"
inf "服务器：${CYN}${ONIMG_URL}${RST}"

# ── 安装目录 ──────────────────────────────────────────────────────────────────

mkdir -p "$INSTALL_DIR"

# 下载脚本（优先本地 repo，否则从 raw.githubusercontent.com）
SCRIPT_SRC="$(dirname "${BASH_SOURCE[0]}" 2>/dev/null || echo '')"

download_or_copy() {
  local name="$1" dest="$2"
  if [[ -n "$SCRIPT_SRC" && -f "$SCRIPT_SRC/$name" ]]; then
    cp "$SCRIPT_SRC/$name" "$dest"
  else
    curl -fsSL "$REPO_RAW/$name" -o "$dest"
  fi
  chmod +x "$dest"
}

hdr "下载文件"
download_or_copy "onimg-cli.py"       "$INSTALL_DIR/onimg-cli.py"
ok "onimg-cli.py"
download_or_copy "typora-upload.sh"   "$INSTALL_DIR/onimg-upload"
ok "onimg-upload  (Typora 上传脚本)"

# 写入 onimg 入口包装
cat > "$INSTALL_DIR/onimg" <<WRAPPER
#!/usr/bin/env bash
exec python3 "$INSTALL_DIR/onimg-cli.py" "\$@"
WRAPPER
chmod +x "$INSTALL_DIR/onimg"
ok "onimg          (CLI 管理工具)"

# ── 写入配置 ──────────────────────────────────────────────────────────────────

hdr "写入配置"
mkdir -p "$CONFIG_DIR"
chmod 700 "$CONFIG_DIR"

cat > "$CONFIG_DIR/config" <<CFG
ONIMG_URL=${ONIMG_URL}
CFG
ok "~/.config/onimg/config"

# ── PATH 提示 ─────────────────────────────────────────────────────────────────

if ! echo "$PATH" | tr ':' '\n' | grep -qxF "$INSTALL_DIR"; then
  echo ""
  inf "${YLW}${INSTALL_DIR} 不在 PATH 中，请添加到 ~/.zshrc 或 ~/.bashrc：${RST}"
  echo ""
  echo -e "    ${DIM}export PATH=\"\$HOME/.local/bin:\$PATH\"${RST}"
fi

# ── Typora 配置提示 ───────────────────────────────────────────────────────────

hdr "Typora 配置"
echo -e "  在 Typora 偏好设置 → 图像 → 上传服务 → Custom Command 中填入：\n"
echo -e "    ${CYN}${INSTALL_DIR}/onimg-upload${RST}\n"
echo -e "  ${DIM}点击"验证图片上传选项"测试（首次会打开浏览器授权）${RST}"

# ── 完成 ──────────────────────────────────────────────────────────────────────

echo ""
echo -e "${GRN}${BOLD}安装完成！${RST}"
echo ""
echo -e "  ${BOLD}首次使用：${RST}"
echo -e "    ${CYN}onimg${RST}  → 选 [2] 登录 → 浏览器授权"
echo ""
