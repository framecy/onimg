#!/usr/bin/env bash
# Typora custom uploader for Onimg — browser-based device auth
#
# First run: opens browser to log in; token cached for 7 days.
# No credentials stored locally.
#
# Setup:
#   1. chmod +x scripts/typora-upload.sh
#   2. Set ONIMG_URL (env var or ~/.config/onimg/config):
#        ONIMG_URL=https://img.diswant.space
#   3. In Typora → Preferences → Image → Upload Service → Custom Command:
#        /path/to/scripts/typora-upload.sh

set -uo pipefail

CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/onimg"
CONFIG_FILE="$CONFIG_DIR/config"
TOKEN_FILE="$CONFIG_DIR/token"

[[ -f "$CONFIG_FILE" ]] && source "$CONFIG_FILE"  # shellcheck source=/dev/null

ONIMG_URL="${ONIMG_URL:-https://img.diswant.space}"
ONIMG_URL="${ONIMG_URL%/}"

mkdir -p "$CONFIG_DIR"
chmod 700 "$CONFIG_DIR"

# ── Helpers ──────────────────────────────────────────────────────────────────

json_get() {
  python3 -c "import json,sys; print(json.loads(sys.argv[1])[sys.argv[2]])" "$1" "$2"
}

mime_type() {
  python3 -c "
import mimetypes, sys
t, _ = mimetypes.guess_type(sys.argv[1])
print(t or 'application/octet-stream')
" "$1"
}

url_encode() {
  python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$1"
}

# ── Browser device auth flow ──────────────────────────────────────────────────

browser_login() {
  # Pick a free port
  local port
  port=$(python3 -c "
import socket
s = socket.socket()
s.bind(('', 0))
print(s.getsockname()[1])
s.close()
")

  local token_file
  token_file=$(mktemp)
  local cb="http://localhost:${port}/cb"

  # Start a one-shot local callback server
  python3 - "$token_file" "$port" <<'PYEOF' &
import http.server, urllib.parse, sys, threading

token_file, port = sys.argv[1], int(sys.argv[2])
server = None

class H(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/cb'):
            params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            token = params.get('token', [''])[0]
            body = ('<html><body style="font-family:system-ui;text-align:center;padding:60px;background:#0a0a0a;color:#f5f5f5">'
                    '<h2 style="color:#34d399">授权成功</h2><p style="color:#b5b5b5">可以关闭此窗口，返回继续操作。</p>'
                    '</body></html>').encode()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            if token:
                open(token_file, 'w').write(token)
                threading.Thread(target=server.shutdown, daemon=True).start()
        else:
            self.send_response(404); self.end_headers()
    def log_message(self, *a): pass

server = http.server.HTTPServer(('localhost', port), H)
server.serve_forever()
PYEOF

  local server_pid=$!

  local auth_url="${ONIMG_URL}/auth/device?callback=$(url_encode "$cb")"
  echo "正在打开浏览器授权... 如未自动打开，请访问：" >&2
  echo "  $auth_url" >&2

  # Open browser (macOS)
  open "$auth_url" 2>/dev/null || true

  # Wait for token (up to 120 s)
  local waited=0
  while [[ ! -s "$token_file" && $waited -lt 120 ]]; do
    sleep 1
    (( waited++ )) || true
  done

  kill "$server_pid" 2>/dev/null || true
  wait "$server_pid" 2>/dev/null || true

  if [[ ! -s "$token_file" ]]; then
    rm -f "$token_file"
    echo "ERROR: 登录超时（120 秒内未完成授权）" >&2
    return 1
  fi

  local token
  token=$(cat "$token_file")
  rm -f "$token_file"
  echo "$token"
}

# ── Token management ──────────────────────────────────────────────────────────

get_token() {
  if [[ -f "$TOKEN_FILE" ]]; then
    local tok exp
    tok=$(cat "$TOKEN_FILE")
    # Check JWT expiry (field 0 = header, 1 = payload)
    exp=$(python3 -c "
import base64, json, sys, time
try:
    # Token format: base64(payload).hmac_sig  (2 parts, exp in ms)
    seg = sys.argv[1].split('.')[0]
    seg += '=' * (-len(seg) % 4)
    payload = json.loads(base64.b64decode(seg))
    exp_ms = payload.get('exp', 0)
    print('ok' if exp_ms / 1000 - 60 > time.time() else 'expired')
except Exception:
    print('expired')
" "$tok" 2>/dev/null || echo 'expired')
    if [[ "$exp" == "ok" ]]; then
      echo "$tok"
      return
    fi
  fi

  echo "token 已过期或不存在，需要重新登录" >&2
  local tok
  tok=$(browser_login) || return 1
  printf '%s' "$tok" > "$TOKEN_FILE"
  chmod 600 "$TOKEN_FILE"
  echo "$tok"
}

# ── Upload ────────────────────────────────────────────────────────────────────

upload_one() {
  local path="$1" token="$2"
  local mime http_code resp tmp
  mime=$(mime_type "$path")
  tmp=$(mktemp)

  http_code=$(curl -sf -o "$tmp" -w "%{http_code}" -X POST "$ONIMG_URL/upload" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: $mime" \
    --data-binary "@$path") || http_code="000"

  resp=$(cat "$tmp"); rm -f "$tmp"

  if [[ "$http_code" == "401" ]]; then
    return 2  # signal: token rejected, re-auth needed
  fi

  if [[ "$http_code" == "000" ]]; then
    echo "ERROR: 网络错误，上传失败: $path" >&2
    return 1
  fi

  if [[ "$http_code" != "201" ]]; then
    echo "ERROR: 上传失败 ($http_code): $path — $resp" >&2
    return 1
  fi

  json_get "$resp" "url"
}

# ── Main ──────────────────────────────────────────────────────────────────────

if [[ $# -eq 0 ]]; then
  echo "Usage: $(basename "$0") image-path [image-path ...]" >&2
  exit 1
fi

TOKEN=$(get_token) || exit 1

urls=()
for img in "$@"; do
  url=$(upload_one "$img" "$TOKEN") && {
    urls+=("$url")
    continue
  }
  exit_code=$?

  if [[ $exit_code -eq 2 ]]; then
    # Token rejected by server — clear cache and re-auth once
    rm -f "$TOKEN_FILE"
    echo "token 被服务端拒绝，重新登录..." >&2
    TOKEN=$(browser_login) || exit 1
    printf '%s' "$TOKEN" > "$TOKEN_FILE"
    chmod 600 "$TOKEN_FILE"
    url=$(upload_one "$img" "$TOKEN") || exit 1
    urls+=("$url")
  else
    exit 1
  fi
done

echo "Upload Success:"
for u in "${urls[@]}"; do
  echo "$u"
done
