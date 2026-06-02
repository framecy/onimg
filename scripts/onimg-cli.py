#!/usr/bin/env python3
"""Onimg CLI 管理工具 — 无外部依赖"""

import os, sys, json, base64, time, socket, threading, mimetypes, webbrowser
import urllib.request, urllib.parse, urllib.error, http.server, shutil

# ── 路径 ──────────────────────────────────────────────────────────────────────

_cfg_dir   = os.path.join(os.environ.get('XDG_CONFIG_HOME',
                           os.path.expanduser('~/.config')), 'onimg')
CONFIG_FILE = os.path.join(_cfg_dir, 'config')
TOKEN_FILE  = os.path.join(_cfg_dir, 'token')

# ── ANSI ──────────────────────────────────────────────────────────────────────

_tty = sys.stdout.isatty()

def _c(*codes): return f'\033[{";".join(str(c) for c in codes)}m' if _tty else ''

RST  = _c(0);  BOLD = _c(1);  DIM  = _c(2)
GRN  = _c(32); YLW  = _c(33); RED  = _c(31)
CYN  = _c(36); MAG  = _c(35); WHT  = _c(97)
BGRN = _c(92); BYLW = _c(93); BRED = _c(91); BCYN = _c(96)

def clr():
    if _tty:
        print('\033[2J\033[H', end='', flush=True)
    else:
        print('\n' + '─' * (W + 2))

# ── Config ────────────────────────────────────────────────────────────────────

def load_cfg():
    cfg = {'ONIMG_URL': 'https://img.diswant.space'}
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE) as f:
            for ln in f:
                ln = ln.strip()
                if '=' in ln and not ln.startswith('#'):
                    k, v = ln.split('=', 1)
                    cfg[k.strip()] = v.strip().strip("'\"")
    # 环境变量优先级最高
    for key in ('ONIMG_URL',):
        if key in os.environ:
            cfg[key] = os.environ[key]
    return cfg

def save_cfg(cfg: dict):
    os.makedirs(_cfg_dir, mode=0o700, exist_ok=True)
    with open(CONFIG_FILE, 'w') as f:
        for k, v in cfg.items():
            f.write(f'{k}={v}\n')

# ── Token ─────────────────────────────────────────────────────────────────────

def load_tok():
    return open(TOKEN_FILE).read().strip() if os.path.exists(TOKEN_FILE) else None

def save_tok(tok: str):
    os.makedirs(_cfg_dir, mode=0o700, exist_ok=True)
    with open(TOKEN_FILE, 'w') as f: f.write(tok)
    os.chmod(TOKEN_FILE, 0o600)

def del_tok():
    if os.path.exists(TOKEN_FILE): os.remove(TOKEN_FILE)

def parse_tok(tok):
    """→ (username, exp_ms, is_admin) or (None, 0, False)"""
    try:
        seg = tok.split('.')[0]
        seg += '=' * (-len(seg) % 4)
        p = json.loads(base64.b64decode(seg))
        return p.get('username'), p.get('exp', 0), bool(p.get('isAdmin'))
    except Exception:
        return None, 0, False

def tok_info(tok):
    if not tok:
        return {'ok': False}
    username, exp_ms, is_admin = parse_tok(tok)
    if not username:
        return {'ok': False}
    remaining = exp_ms / 1000 - time.time()
    return {
        'ok': remaining > 0,
        'username': username,
        'is_admin': is_admin,
        'remaining': remaining,
        'exp_ms': exp_ms,
    }

# ── HTTP ──────────────────────────────────────────────────────────────────────

def api(url, method='GET', data=None, token=None, content_type='application/json',
        binary_path=None):
    """→ (status_code, response_body_dict | None)"""
    try:
        if binary_path:
            with open(binary_path, 'rb') as f:
                body = f.read()
        elif data is not None:
            body = json.dumps(data).encode()
        else:
            body = None

        req = urllib.request.Request(url, data=body, method=method)
        req.add_header('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        if token:
            req.add_header('Authorization', f'Bearer {token}')
        if body:
            req.add_header('Content-Type', content_type)

        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, None
    except Exception as e:
        return 0, {'error': str(e)}

# ── Browser login ─────────────────────────────────────────────────────────────

def _free_port() -> int:
    s = socket.socket(); s.bind(('', 0)); p = s.getsockname()[1]; s.close(); return p

def browser_login(base_url):
    port = _free_port()
    cb   = f'http://localhost:{port}/cb'
    result = {'token': None}
    srv = None

    class H(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            tok = params.get('token', [''])[0]
            ok_html = ('<html><body style="font-family:system-ui;text-align:center;'
                       'padding:60px;background:#0a0a0a;color:#f5f5f5">'
                       '<h2 style="color:#34d399">授权成功</h2>'
                       '<p style="color:#b5b5b5">可以关闭此窗口，返回终端继续操作。</p>'
                       '</body></html>').encode()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(ok_html)))
            self.end_headers()
            self.wfile.write(ok_html)
            if tok:
                result['token'] = tok
                threading.Thread(target=srv.shutdown, daemon=True).start()
        def log_message(self, *_): pass

    srv = http.server.HTTPServer(('localhost', port), H)

    auth_url = f"{base_url.rstrip('/')}/auth/device?callback={urllib.parse.quote(cb, safe='')}"
    print(f'\n  {DIM}正在打开浏览器…{RST}')
    print(f'  {DIM}如未自动打开，请访问：{RST}')
    print(f'  {CYN}{auth_url}{RST}\n')
    webbrowser.open(auth_url)

    print(f'  {YLW}等待授权（最多 120 秒）…{RST}', end='', flush=True)
    t = threading.Thread(target=srv.serve_forever)
    t.daemon = True
    t.start()

    deadline = time.time() + 120
    while not result['token'] and time.time() < deadline:
        time.sleep(0.5)
        print('.', end='', flush=True)

    srv.shutdown()
    print()
    return result['token']

# ── 格式化 ────────────────────────────────────────────────────────────────────

def fmt_dur(secs: float) -> str:
    if secs <= 0: return f'{RED}已过期{RST}'
    d = int(secs // 86400)
    h = int((secs % 86400) // 3600)
    m = int((secs % 3600) // 60)
    if d: return f'{d} 天 {h} 小时后过期'
    if h: return f'{h} 小时 {m} 分钟后过期'
    return f'{m} 分钟后过期'

def fmt_size(b: int) -> str:
    if b < 1024: return f'{b} B'
    if b < 1024**2: return f'{b/1024:.1f} KB'
    return f'{b/1024**2:.1f} MB'

def fmt_time(ms: int) -> str:
    import datetime
    return datetime.datetime.fromtimestamp(ms / 1000).strftime('%m-%d %H:%M')

# ── 界面组件 ──────────────────────────────────────────────────────────────────

W = 52  # 框宽

def box_top(title=''):
    inner = f'  {BOLD}{title}{RST}  ' if title else ''
    pad = W - 2 - len(title) - (4 if title else 0)
    if title:
        return f'┌── {BOLD}{title}{RST} {"─" * max(pad, 0)}┐'
    return '┌' + '─' * W + '┐'

def box_row(left, right='', w=W):
    raw_left  = _strip_ansi(left)
    raw_right = _strip_ansi(right)
    gap = w - len(raw_left) - len(raw_right)
    return f'│ {left}{" " * max(gap - 2, 0)}{right} │'

def box_sep():  return '├' + '─' * W + '┤'
def box_bot():  return '└' + '─' * W + '┘'
def box_blank(): return f'│{" " * W}  │'

import re
def _strip_ansi(s): return re.sub(r'\033\[[0-9;]*m', '', s)

def header(cfg, tok_i, quota):
    url = cfg.get('ONIMG_URL', '?')
    print(box_top('Onimg  CLI'))

    # 服务器
    srv_display = url.replace('https://','').replace('http://','')
    print(box_row(f'  {DIM}服务器{RST}  {CYN}{srv_display}{RST}'))

    # 登录状态
    if tok_i.get('ok'):
        uname = tok_i['username']
        role  = f'{MAG}Admin{RST}' if tok_i['is_admin'] else f'{DIM}用户{RST}'
        print(box_row(f'  {DIM}账  号{RST}  {BGRN}● {BOLD}{uname}{RST}  {role}'))
        print(box_row(f'  {DIM}有效期{RST}  {fmt_dur(tok_i["remaining"])}'))
    else:
        print(box_row(f'  {DIM}账  号{RST}  {BRED}○ 未登录{RST}'))

    # 配额
    if quota:
        daily = quota.get('daily', 0)
        total = quota.get('total', 0)
        # 从 token 读不到配额上限，只展示使用量
        print(box_row(f'  {DIM}配  额{RST}  今日 {BCYN}{daily}{RST} 次 · 累计 {BCYN}{total}{RST} 次'))

    print(box_bot())

def menu(items):
    print()
    for key, label in items:
        k_str = f'{BOLD}{YLW}[{key}]{RST}'
        print(f'  {k_str}  {label}')
    print()

def prompt(text='选择') -> str:
    try:
        return input(f'  {BOLD}▶ {RST}{text}: ').strip()
    except (EOFError, KeyboardInterrupt):
        return 'q'

def msg_ok(text):  print(f'\n  {BGRN}✓{RST}  {text}')
def msg_err(text): print(f'\n  {BRED}✗{RST}  {text}')
def msg_inf(text): print(f'\n  {CYN}ℹ{RST}  {text}')
def pause():       input(f'\n  {DIM}按 Enter 返回…{RST}')

# ── 动作 ──────────────────────────────────────────────────────────────────────

def do_login(cfg):
    tok = browser_login(cfg['ONIMG_URL'])
    if tok:
        save_tok(tok)
        info = tok_info(tok)
        msg_ok('已登录为 %s%s%s' % (BOLD, info.get('username','?'), RST))
    else:
        msg_err('授权超时或取消')

def do_logout():
    del_tok()
    msg_ok('已退出登录，Token 已清除')

def do_upload(cfg, tok):
    if not tok:
        msg_err('请先登录'); return
    path = prompt('图片路径（可拖入文件）').strip().strip("'\"")
    if not path or not os.path.isfile(path):
        msg_err('文件不存在'); return

    mime, _ = mimetypes.guess_type(path)
    if not mime: mime = 'application/octet-stream'
    url = '%s/upload' % cfg['ONIMG_URL'].rstrip('/')
    print('\n  %s上传中…%s' % (DIM, RST), end='', flush=True)
    status, resp = api(url, method='POST', token=tok,
                       content_type=mime, binary_path=path)
    print()
    if status == 201 and resp and 'url' in resp:
        img_url = resp['url']
        size    = fmt_size(resp.get('size', 0))
        msg_ok('上传成功  (%s)' % size)
        print('\n  %sURL:%s' % (BOLD, RST))
        print('  %s%s%s' % (BCYN, img_url, RST))
        print('\n  %sMarkdown:%s' % (DIM, RST))
        print('  %s![](%s)%s' % (DIM, img_url, RST))
    elif status == 401:
        msg_err('Token 已失效，请重新登录')
    else:
        msg_err('上传失败 (%s)：%s' % (status, resp))

def do_recent(cfg, tok):
    if not tok:
        msg_err('请先登录'); return
    url = '%s/list' % cfg['ONIMG_URL'].rstrip('/')
    status, resp = api(url, token=tok)
    if status != 200 or not resp:
        msg_err('获取失败 (%s)' % status); return
    items = resp.get('items', [])
    if not items:
        msg_inf('暂无上传记录'); return

    print('\n  %s最近上传%s  %s(共 %d 条)%s\n' % (BOLD, RST, DIM, len(items), RST))
    w_key = min(max(len(it['key']) for it in items), 44)
    print('  %s%-*s  %8s  %-14s  公开%s' % (DIM, w_key, '文件名', '大小', '时间', RST))
    print('  ' + '─' * (w_key + 36))
    for it in items[:20]:
        key  = it['key'][:w_key]
        size = fmt_size(it.get('size', 0))
        ts   = fmt_time(it.get('uploadedAt', 0))
        pub  = '%s公开%s' % (BGRN, RST) if it.get('isPublic') else '%s私有%s' % (DIM, RST)
        print('  %-*s  %8s  %-14s  %s' % (w_key, key, size, ts, pub))
    if resp.get('truncated'):
        print('\n  %s（仅展示前 20 条）%s' % (DIM, RST))

def do_change_url(cfg):
    current = cfg.get('ONIMG_URL', '')
    print('\n  %s当前地址：%s%s' % (DIM, current, RST))
    new_url = prompt('新地址（留空取消）')
    if not new_url:
        msg_inf('已取消'); return
    if not new_url.startswith('http'):
        new_url = 'https://' + new_url
    cfg['ONIMG_URL'] = new_url.rstrip('/')
    save_cfg(cfg)
    msg_ok('已更新为 %s' % new_url)
    msg_inf('建议删除旧 token 后重新登录：rm ' + TOKEN_FILE)

def do_help(cfg):
    install_dir = os.path.expanduser('~/.local/bin')
    url = cfg.get('ONIMG_URL', 'https://img.diswant.space')
    host = url.replace('https://','').replace('http://','')
    print('\n  %s使用说明%s\n' % (BOLD, RST))

    print('  %s── 快速开始%s' % (BOLD, RST))
    print('  %s[2]%s 登录        → 浏览器打开授权页，输入账号密码' % (YLW, RST))
    print('  %s[4]%s 上传图片    → 输入路径或拖入文件，返回 URL' % (YLW, RST))
    print('  %s[5]%s 上传记录    → 查看历史文件、大小、时间' % (YLW, RST))
    print('  %s[1]%s 状态详情    → 账号、配额、Token 到期时间' % (YLW, RST))
    print('  %s[6]%s 换服务地址  → 切换不同 Onimg 实例' % (YLW, RST))

    print()
    print('  %s── Typora 自动上传%s' % (BOLD, RST))
    print('  偏好设置 → 图像 → Custom Command:')
    print('  %s%s/onimg-upload%s' % (BCYN, install_dir, RST))
    print('  %s粘贴或拖入图片 → Typora 自动调用脚本 → 图片链接自动替换%s' % (DIM, RST))

    print()
    print('  %s── Token 管理%s' % (BOLD, RST))
    print('  有效期: 默认 %s7 天%s（Admin → 用户管理 可调整至 1–365 天）' % (CYN, RST))
    print('  过期后: 下次上传时 %s自动重新授权%s（无需手动操作）' % (DIM, RST))
    print('  手动退出: %s[3] 退出登录%s  或  %srm %s%s' % (YLW, RST, DIM, TOKEN_FILE, RST))

    print()
    print('  %s── 文件路径%s' % (BOLD, RST))
    print('  配置   %s%s%s' % (DIM, CONFIG_FILE, RST))
    print('  Token  %s%s%s' % (DIM, TOKEN_FILE, RST))
    print('  上传   %s%s/onimg-upload%s' % (DIM, install_dir, RST))
    print('  CLI    %s%s/onimg%s' % (DIM, install_dir, RST))

    print()
    print('  %s── 管理后台%s' % (BOLD, RST))
    print('  %s%s/admin%s' % (CYN, url, RST))
    print('  %s用户管理 / 配额设置 / 图库管理 / 系统配置%s' % (DIM, RST))

def do_status_detail(cfg, tok, quota):
    info = tok_info(tok)
    print('\n  %s详细状态%s\n' % (BOLD, RST))
    print('  服务器    %s%s%s' % (CYN, cfg.get('ONIMG_URL','?'), RST))
    if info.get('ok'):
        uname = info['username']
        role  = 'Admin' if info['is_admin'] else '普通用户'
        print('  账  号    %s%s%s  (%s)' % (BGRN, uname, RST, role))
        exp_str = time.strftime('%Y-%m-%d %H:%M', time.localtime(info['exp_ms'] / 1000))
        print('  过期时间  %s  (%s)' % (exp_str, fmt_dur(info['remaining'])))
    else:
        print('  账  号    %s未登录%s' % (BRED, RST))
    if quota:
        print('  配  额    今日 %d 次 · 累计 %d 次' % (quota.get('daily',0), quota.get('total',0)))
    print('  Token 路径  %s%s%s' % (DIM, TOKEN_FILE, RST))
    print('  配置路径    %s%s%s' % (DIM, CONFIG_FILE, RST))

# ── 主循环 ────────────────────────────────────────────────────────────────────

def main():
    while True:
        cfg   = load_cfg()
        tok   = load_tok()
        t_inf = tok_info(tok)
        quota = None

        # 拉配额（仅登录状态下，快速超时避免卡界面）
        if t_inf.get('ok'):
            try:
                url = f"{cfg['ONIMG_URL'].rstrip('/')}/auth/quota"
                st, q = api(url, token=tok)
                if st == 200 and q: quota = q
            except Exception:
                pass

        clr()
        print()
        header(cfg, t_inf, quota)

        # 未登录时在菜单上方显示首屏提示
        if not t_inf.get('ok'):
            print('  %s提示: 选 [2] 登录 → 浏览器授权 → 开始使用%s' % (YLW, RST))
            print()

        menu([
            ('1', '刷新状态'),
            ('2', '登录 / 重新授权  (浏览器)'),
            ('3', '退出登录'),
            ('4', '测试上传'),
            ('5', '最近上传记录'),
            ('6', '修改服务地址'),
            ('?', '使用说明'),
            ('q', '%s退出%s' % (DIM, RST)),
        ])

        ch = prompt()

        if ch == '1':
            do_status_detail(cfg, tok, quota)
            pause()
        elif ch == '2':
            do_login(cfg)
            pause()
        elif ch == '3':
            do_logout()
            pause()
        elif ch == '4':
            do_upload(cfg, tok)
            pause()
        elif ch == '5':
            do_recent(cfg, tok)
            pause()
        elif ch == '6':
            do_change_url(cfg)
            pause()
        elif ch == '?':
            do_help(cfg)
            pause()
        elif ch in ('q', 'Q', '0'):
            clr()
            print('\n  %s再见。%s\n' % (DIM, RST))
            sys.exit(0)
        else:
            msg_err('无效输入')
            time.sleep(0.8)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        clr()
        print(f'\n  {DIM}已退出。{RST}\n')
        sys.exit(0)
