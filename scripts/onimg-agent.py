#!/usr/bin/env python3
"""onimg-agent —— Onimg 的非交互 CLI（给 Agent / Skill 用）。

和 ~/.local/bin/onimg（交互式菜单，给人用）共用同一份配置与 token：
  ~/.config/onimg/config   ONIMG_URL=<服务器地址>
  ~/.config/onimg/token    JWT（600 权限）

设计约束（改这个文件前先读）：
  · 只用 Python 3 标准库，单文件分发，不做版本依赖。
  · 默认人类可读输出；加 --json 输出机器可解析的 JSON，退出码见 EXIT_*。
  · token 永远不打印、不写进日志；只读授权(scope=read)拿到的 token 服务端会
    拒绝一切写操作，客户端不再重复判断。
  · 删除类操作默认 dry-run，必须显式 --yes 才执行。
"""

import os, sys, json, time, base64, argparse, mimetypes, webbrowser, threading
import urllib.request, urllib.parse, urllib.error, http.server, http.client, socket, zipfile, tempfile
from concurrent.futures import ThreadPoolExecutor

EXIT_OK, EXIT_ERR, EXIT_USAGE, EXIT_AUTH, EXIT_PARTIAL = 0, 1, 2, 3, 4

_cfg_dir = os.path.join(os.environ.get('XDG_CONFIG_HOME', os.path.expanduser('~/.config')), 'onimg')
CONFIG_FILE = os.path.join(_cfg_dir, 'config')
TOKEN_FILE = os.path.join(_cfg_dir, 'token')
DEFAULT_URL = 'https://img.diswant.space'


# ── 配置 / token ─────────────────────────────────────────────────────────────

def load_config():
    cfg = {'ONIMG_URL': DEFAULT_URL}
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE) as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    k, v = line.split('=', 1)
                    cfg[k.strip()] = v.strip().strip('"\'')
    if os.environ.get('ONIMG_URL'):
        cfg['ONIMG_URL'] = os.environ['ONIMG_URL']
    cfg['ONIMG_URL'] = cfg['ONIMG_URL'].rstrip('/')
    return cfg


def save_config(cfg):
    os.makedirs(_cfg_dir, mode=0o700, exist_ok=True)
    with open(CONFIG_FILE, 'w') as f:
        f.write('ONIMG_URL=%s\n' % cfg['ONIMG_URL'])


def load_token():
    if os.environ.get('ONIMG_TOKEN'):
        return os.environ['ONIMG_TOKEN'].strip()
    if not os.path.exists(TOKEN_FILE):
        return ''
    with open(TOKEN_FILE) as f:
        return f.read().strip()


def save_token(token):
    os.makedirs(_cfg_dir, mode=0o700, exist_ok=True)
    fd = os.open(TOKEN_FILE, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'w') as f:
        f.write(token)


def token_claims(token):
    """解析 JWT payload（不验签，只用来显示账号 / 到期 / scope）。"""
    try:
        seg = token.split('.')[0]
        seg += '=' * (-len(seg) % 4)
        return json.loads(base64.urlsafe_b64decode(seg))
    except Exception:
        return {}


# ── HTTP ─────────────────────────────────────────────────────────────────────

# 重试策略：只在「网络抖动」和「服务端临时错误」上重试。
# 线上实测：对 Cloudflare 连续请求时会偶发 SSL UNEXPECTED_EOF / IncompleteRead
# （同一个 URL 三次里坏一次），重试一次就好。4xx 一律不重试 —— 401/403/404 重试
# 只会把错误放大成更长的等待。
# 单次请求超时（秒）。线上实测：对 Cloudflare 偶发 30s+ 的挂起，把超时压到
# 20s 让坏连接尽快失败并重试，比「等 60 秒再重试」快得多。
TIMEOUT = 20

RETRY_STATUS = {408, 429, 500, 502, 503, 504}
RETRY_ATTEMPTS = 3
RETRY_BACKOFF = (0.6, 1.8)


def _retryable(exc):
    if isinstance(exc, urllib.error.HTTPError):
        return exc.code in RETRY_STATUS
    if isinstance(exc, urllib.error.URLError):
        return True
    if isinstance(exc, http.client.HTTPException):   # IncompleteRead / BadStatusLine …
        return True
    return isinstance(exc, (TimeoutError, ConnectionError))


class ApiError(Exception):
    def __init__(self, status, body, path=''):
        self.status, self.body, self.path = status, body, path
        msg = body.get('error') if isinstance(body, dict) else (body or '')
        super().__init__('%s %s' % (status, msg or path))


def api(method, path, body=None, raw=None, headers=None, base=None, token=None):
    base = base or load_config()['ONIMG_URL']
    tok = load_token() if token is None else token
    url = base + path
    hdrs = {'User-Agent': 'onimg-agent/1.0'}
    if tok:
        hdrs['Authorization'] = 'Bearer ' + tok
    if headers:
        hdrs.update(headers)
    data = None
    if raw is not None:
        data = raw
    elif body is not None:
        data = json.dumps(body).encode()
        hdrs['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    for attempt in range(RETRY_ATTEMPTS):
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                payload = r.read()
                ctype = r.headers.get('Content-Type', '')
                if 'application/json' in ctype:
                    return json.loads(payload.decode() or '{}')
                return payload
        except urllib.error.HTTPError as e:
            body = e.read()
            try:
                parsed = json.loads(body.decode() or '{}')
            except Exception:
                parsed = {'error': body.decode('utf-8', 'replace')[:300]}
            if _retryable(e) and attempt < RETRY_ATTEMPTS - 1:
                time.sleep(RETRY_BACKOFF[min(attempt, len(RETRY_BACKOFF) - 1)])
                continue
            raise ApiError(e.code, parsed, path)
        except Exception as e:  # 网络层：超时 / 断连 / 半包
            if _retryable(e) and attempt < RETRY_ATTEMPTS - 1:
                time.sleep(RETRY_BACKOFF[min(attempt, len(RETRY_BACKOFF) - 1)])
                continue
            raise ApiError(0, {'error': '%s: %s' % (type(e).__name__, e)}, path)


def api_form(path, fields, files):
    """multipart/form-data 上传（原型 ZIP）。纯标准库实现。"""
    boundary = '----onimgagent%d' % int(time.time() * 1000)
    body = bytearray()
    for k, v in fields.items():
        if v is None:
            continue
        body += ('--%s\r\nContent-Disposition: form-data; name="%s"\r\n\r\n%s\r\n' % (boundary, k, v)).encode()
    for k, (filename, data, ctype) in files.items():
        body += ('--%s\r\nContent-Disposition: form-data; name="%s"; filename="%s"\r\nContent-Type: %s\r\n\r\n'
                 % (boundary, k, filename, ctype)).encode()
        body += data
        body += b'\r\n'
    body += ('--%s--\r\n' % boundary).encode()
    return api('POST', path, raw=bytes(body), headers={'Content-Type': 'multipart/form-data; boundary=' + boundary})


def download(url, dest, use_auth=True):
    """下载到本地文件。

    use_auth=False 时不带 Authorization：公共图片 / 公共原型走 Cloudflare 边缘缓存，
    又快又稳；带上 token 反而会被判定为「私有请求」绕过缓存，每次都回源。
    线上实测（本机链路很差的时段）：同一张图不带 token 2.6s 成功、带 token 15s 超时。
    需要鉴权的资源由调用方传 True，或在 401/403 后用 True 重试一次。
    """
    hdrs = {'User-Agent': 'onimg-agent/1.0'}
    tok = load_token() if use_auth else ''
    if tok:
        hdrs['Authorization'] = 'Bearer ' + tok
    req = urllib.request.Request(url, headers=hdrs)
    os.makedirs(os.path.dirname(dest) or '.', exist_ok=True)
    for attempt in range(RETRY_ATTEMPTS):
        try:
            with urllib.request.urlopen(req, timeout=max(TIMEOUT, 30)) as r, open(dest, 'wb') as f:
                total = 0
                while True:
                    chunk = r.read(65536)
                    if not chunk:
                        break
                    f.write(chunk)
                    total += len(chunk)
            return total
        except urllib.error.HTTPError as e:
            # 没带 token 被拒（私有资源）→ 带 token 再试一次，这条对调用方透明。
            if e.code in (401, 403) and not use_auth and load_token():
                return download(url, dest, use_auth=True)
            # 原型文件走的是 /proto/... 路由，返回的是纯文本而不是 JSON；
            # 统一成 ApiError，调用方才能按 401/403 翻译成授权错误，
            # 而不是抛出一整屏 Traceback。
            body = e.read()
            try:
                parsed = json.loads(body.decode() or '{}')
            except Exception:
                parsed = {'error': body.decode('utf-8', 'replace')[:200]}
            if _retryable(e) and attempt < RETRY_ATTEMPTS - 1:
                time.sleep(RETRY_BACKOFF[min(attempt, len(RETRY_BACKOFF) - 1)])
                continue
            raise ApiError(e.code, parsed, url)
        except Exception as e:
            # 半包会留下一个截断的文件：重试前必须删掉，否则最终得到一个
            # 「看起来拉成功了」的坏文件。这是最危险的一种失败。
            try: os.path.exists(dest) and os.unlink(dest)
            except Exception: pass
            if _retryable(e) and attempt < RETRY_ATTEMPTS - 1:
                time.sleep(RETRY_BACKOFF[min(attempt, len(RETRY_BACKOFF) - 1)])
                continue
            raise ApiError(0, {'error': '%s: %s' % (type(e).__name__, e)}, url)


# ── 输出 ─────────────────────────────────────────────────────────────────────

def emit(args, data=None, lines=None, code=EXIT_OK):
    if args.json:
        print(json.dumps(data if data is not None else {'ok': code == EXIT_OK}, ensure_ascii=False, indent=2))
    else:
        for ln in (lines or []):
            print(ln)
    sys.exit(code)


def fail(args, msg, code=EXIT_ERR, extra=None):
    if args.json:
        payload = {'ok': False, 'error': msg}
        if extra:
            payload.update(extra)
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        sys.stderr.write('错误: %s\n' % msg)
    sys.exit(code)


def translate_error(e, args):
    """把 ApiError 翻译成稳定退出码。401/403 分开，Agent 才能决定是重新授权还是换账号。"""
    if e.status == 401:
        fail(args, '未登录或 token 已过期，请先执行 auth login', EXIT_AUTH, {'status': 401})
    if e.status == 403 and isinstance(e.body, dict) and e.body.get('code') == 'read_only_scope':
        fail(args, '当前是只读授权，不能执行写操作；需要写权限请重新执行 auth login --scope write', EXIT_AUTH)
    if e.status == 403 and isinstance(e.body, dict) and e.body.get('code') == 'agent_access_denied':
        fail(args, '该账号未开放 Agent 访问，请联系管理员在后台开启', EXIT_AUTH)
    if e.status in (401, 403):
        fail(args, str(e) or '无权访问', EXIT_AUTH)
    fail(args, str(e) or '请求失败')


def guard(fn, args):
    try:
        return fn()
    except ApiError as e:
        translate_error(e, args)


# ── 账号 ─────────────────────────────────────────────────────────────────────

class _CallbackHandler(http.server.BaseHTTPRequestHandler):
    token = None

    def do_GET(self):
        q = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(q)
        _CallbackHandler.token = (params.get('token') or [''])[0]
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write('<meta charset=utf-8><p style="font-family:system-ui">授权成功，可以关闭此窗口。</p>'.encode())

    def log_message(self, *a):
        pass


def cmd_auth(args):
    if args.action == 'logout':
        if os.path.exists(TOKEN_FILE):
            os.remove(TOKEN_FILE)
        emit(args, {'ok': True}, ['已退出登录'])

    if args.action == 'status':
        tok = load_token()
        cfg = load_config()
        if not tok:
            emit(args, {'ok': False, 'loggedIn': False, 'server': cfg['ONIMG_URL']},
                 ['未登录  (%s)' % cfg['ONIMG_URL']], EXIT_AUTH)
        claims = token_claims(tok)
        exp = (claims.get('exp') or 0) / 1000
        remaining = max(0, exp - time.time())
        info = {
            'ok': True, 'loggedIn': True, 'server': cfg['ONIMG_URL'],
            'username': claims.get('username'), 'scope': claims.get('scope', 'write'),
            'expiresAt': int(exp) if exp else None,
            'remainingHours': round(remaining / 3600, 1),
        }
        emit(args, info, [
            '服务器  %s' % cfg['ONIMG_URL'],
            '账号    %s' % claims.get('username'),
            '权限    %s' % ('只读' if claims.get('scope') == 'read' else '读写'),
            '到期    %s' % (time.strftime('%Y-%m-%d %H:%M', time.localtime(exp)) if exp else '未知'),
        ])

    # login
    cfg = load_config()
    base = args.url.rstrip('/') if args.url else cfg['ONIMG_URL']
    if args.url:
        cfg['ONIMG_URL'] = base
        save_config(cfg)

    scope = args.scope or 'write'
    _CallbackHandler.token = None
    server = http.server.HTTPServer(('127.0.0.1', 0), _CallbackHandler)
    port = server.server_address[1]
    cb = 'http://127.0.0.1:%d/cb' % port
    url = '%s/auth/device?callback=%s&scope=%s' % (base, urllib.parse.quote(cb, safe=''), scope)
    if not args.json:
        print('请在浏览器中完成授权：%s' % url)
        print('（等待回调，最多 180 秒）')
    else:
        sys.stderr.write(url + '\n')
    try:
        webbrowser.open(url)
    except Exception:
        pass
    server.timeout = 180
    while _CallbackHandler.token is None:
        server.handle_request()
        if _CallbackHandler.token is None:
            break
    token = _CallbackHandler.token
    if not token:
        fail(args, '授权超时或未获取到 token', EXIT_AUTH)
    save_token(token)
    claims = token_claims(token)
    emit(args, {'ok': True, 'username': claims.get('username'), 'scope': claims.get('scope', scope), 'server': base},
         ['授权成功：%s（%s）' % (claims.get('username'), '只读' if claims.get('scope') == 'read' else '读写')])


# ── 索引 / 检索 ──────────────────────────────────────────────────────────────

def load_index():
    return api('GET', '/api/index')


def ref_split(ref):
    if ':' not in ref:
        raise SystemExit('引用格式应为 kind:id，例如 img:1711234-abcd.png / page:my-note / proto:abc123')
    kind, ident = ref.split(':', 1)
    return kind, ident


def cmd_ls(args):
    def run():
        idx = load_index()
        kind = args.kind
        rows = []
        if kind in ('img', 'image'):
            rows = [{'ref': 'img:' + i['key'], 'name': i.get('name') or i['key'], 'size': i['size'],
                     'public': i.get('isPublic'), 'tags': i.get('tags') or []} for i in idx['images']]
        elif kind == 'page':
            rows = [{'ref': 'page:' + p['slug'], 'name': p.get('title') or p['slug'], 'type': p.get('type'),
                     'public': p.get('isPublic')} for p in idx['pages']]
        elif kind == 'proto':
            rows = [{'ref': 'proto:' + p['protoId'], 'name': p.get('title') or p['protoId'],
                     'files': p.get('fileCount'), 'size': p.get('totalSize'), 'version': p.get('version'),
                     'private': p.get('isPrivate')} for p in idx['protos']]
        elif kind in ('project', 'group'):
            key = 'projects' if kind == 'project' else 'groups'
            rows = [{'ref': '%s:%s' % (kind, r['id']), 'name': r.get('name')} for r in idx[key]]
        else:
            rows = ([{'ref': 'img:' + i['key'], 'name': i.get('name') or i['key'], 'kind': 'img'} for i in idx['images']]
                    + [{'ref': 'page:' + p['slug'], 'name': p.get('title') or p['slug'], 'kind': 'page'} for p in idx['pages']]
                    + [{'ref': 'proto:' + p['protoId'], 'name': p.get('title') or p['protoId'], 'kind': 'proto'} for p in idx['protos']])
        q = (args.q or '').lower()
        if q:
            rows = [r for r in rows if q in json.dumps(r, ensure_ascii=False).lower()]
        emit(args, {'ok': True, 'count': len(rows), 'items': rows},
             ['%s  %s' % (r['ref'], r.get('name')) for r in rows] or ['（空）'])
    guard(run, args)


def cmd_tree(args):
    def run():
        idx = load_index()
        out, lines = [], []
        by_group = {}
        for p in idx['pages']:
            by_group.setdefault(p.get('groupId'), []).append(p)
        for proj in idx['projects']:
            groups = [g for g in idx['groups'] if g.get('projectId') == proj['id']]
            node = {'id': proj['id'], 'name': proj.get('name'), 'groups': [], 'pages': by_group.get(None, [])}
            for g in groups:
                node['groups'].append({'id': g['id'], 'name': g.get('name'),
                                       'pages': [p['slug'] for p in idx['pages'] if p.get('groupId') == g['id']]})
            out.append(node)
            lines.append('%s  [%s]' % (proj.get('name'), proj['id']))
            for g in node['groups']:
                lines.append('  └ %s  [%s]  %d 页' % (g['name'], g['id'], len(g['pages'])))
        loose = [p['slug'] for p in idx['pages'] if not p.get('projectId')]
        if loose:
            lines.append('（未归类页面）' + ', '.join(loose))
        counts = idx['counts']
        lines.append('')
        lines.append('图片 %d · 页面 %d · 原型 %d · 项目 %d · 分组 %d'
                     % (counts['images'], counts['pages'], counts['protos'], counts['projects'], counts['groups']))
        emit(args, {'ok': True, 'tree': out, 'counts': counts}, lines)
    guard(run, args)


def _fetch_proto_files(proto):
    """返回 [(相对路径, 下载 URL)]，只覆盖当前版本（历史版本的字节早就被覆盖了）。"""
    proto_id = proto['protoId']
    ver = proto.get('version') or 1
    files = api('GET', '/api/proto-vfiles/%s/v%d' % (urllib.parse.quote(proto_id), ver))
    paths = files.get('files') or []
    base = load_config()['ONIMG_URL']
    out = []
    for rel in paths:
        quoted = urllib.parse.quote(rel, safe='/')
        out.append((rel, '%s/proto/%s/%s' % (base, urllib.parse.quote(proto_id), quoted)))
    return out


def cmd_get(args):
    def run():
        kind, ident = ref_split(args.ref)
        base = load_config()['ONIMG_URL']
        if kind in ('img', 'image'):
            url = base + '/' + urllib.parse.quote(ident)
            dest = args.output or os.path.basename(ident)
            n = download(url, dest)
            emit(args, {'ok': True, 'path': os.path.abspath(dest), 'bytes': n}, ['已保存 %s (%d 字节)' % (dest, n)])
        if kind == 'page':
            page = api('GET', '/api/pages/' + urllib.parse.quote(ident))
            ext = 'md' if page.get('type') == 'markdown' else 'html'
            dest = args.output or ('%s.%s' % (ident, ext))
            with open(dest, 'w') as f:
                f.write(page.get('content') or '')
            emit(args, {'ok': True, 'path': os.path.abspath(dest), 'slug': ident, 'title': page.get('title')},
                 ['已保存 %s' % dest])
        if kind == 'proto':
            protos = api('GET', '/api/protos')['protos']
            proto = next((p for p in protos if p['protoId'] == ident), None)
            if not proto:
                fail(args, '找不到原型 %s' % ident, EXIT_ERR)
            dest_dir = args.output or ident
            total = 0
            for rel, url in _fetch_proto_files(proto):
                total += download(url, os.path.join(dest_dir, rel))
            emit(args, {'ok': True, 'dir': os.path.abspath(dest_dir), 'files': proto.get('fileCount'), 'bytes': total},
                 ['已保存到 %s（%d 文件）' % (dest_dir, proto.get('fileCount'))])
        fail(args, '不支持的引用类型：%s' % kind)
    guard(run, args)


def cmd_pull(args):
    global TIMEOUT
    TIMEOUT = max(5, args.timeout)

    def run():
        idx = load_index()
        out_dir = args.output or 'onimg-backup'
        os.makedirs(out_dir, exist_ok=True)
        with open(os.path.join(out_dir, 'index.json'), 'w') as f:
            json.dump(idx, f, ensure_ascii=False, indent=2)

        want = args.kind or ('all' if args.all or not args.ref else None)
        kinds = {'all': ['img', 'page', 'proto'], 'img': ['img'], 'page': ['page'], 'proto': ['proto']}
        if args.ref:
            k, ident = ref_split(args.ref)
            kinds = {'img': ['img'], 'image': ['img'], 'page': ['page'], 'proto': ['proto']}
            want = k
        plan = kinds.get(want or 'all', ['img', 'page', 'proto'])

        # 指定了 ref（pull proto:<id> / img:<key> / page:<slug>）时只拉那一个对象。
        # 早期版本只用了 ref 的类型、没用 id，导致「拉一个原型」实际把账号下所有
        # 原型都拉了一遍（900 文件压测时 planned=903 才暴露）。
        ref_kind = ref_id = None
        if args.ref:
            ref_kind, ref_id = ref_split(args.ref)
            if ref_kind == 'image':
                ref_kind = 'img'

        jobs, errors = [], []
        base = load_config()['ONIMG_URL']
        if 'img' in plan:
            for img in (idx['images'] if not ref_id else [i for i in idx['images'] if i['key'] == ref_id]):
                # 图片按 key 直出，不带 token 走边缘缓存（见 download 的说明）
                jobs.append(('img', os.path.join(out_dir, 'images', img['key']),
                             base + '/' + urllib.parse.quote(img['key']), False))
        if 'page' in plan:
            for p in (idx['pages'] if not ref_id else [x for x in idx['pages'] if x['slug'] == ref_id]):
                jobs.append(('page', os.path.join(out_dir, 'pages', p['slug'] + ('.md' if p.get('type') == 'markdown' else '.html')), p['slug'], True))
        if 'proto' in plan:
            for proto in (idx['protos'] if not ref_id else [x for x in idx['protos'] if x['protoId'] == ref_id]):
                try:
                    # 私有 / 带密码的原型必须带 token；公开的走缓存更快
                    need_auth = bool(proto.get('isPrivate') or proto.get('hasPassword'))
                    for rel, url in _fetch_proto_files(proto):
                        jobs.append(('proto', os.path.join(out_dir, 'protos', proto['protoId'], rel), url, need_auth))
                except ApiError as e:
                    errors.append({'proto': proto['protoId'], 'error': str(e)})

        with open(os.path.join(out_dir, 'tree.json'), 'w') as f:
            json.dump({k: idx[k] for k in ('projects', 'groups', 'counts', 'account')}, f, ensure_ascii=False, indent=2)

        # 计数器要加锁：+= 是「读-改-写」，8 个线程并发会丢更新。
        # 之前 901 个文件只报 4.9MB（实际 46MB）就是被这个吃掉的。
        lock = threading.Lock()
        total_bytes = [0]
        done = [0]
        skipped = [0]
        total_jobs = len(jobs)
        started = time.time()

        def progress():
            # 进度写 stderr：--json 时 stdout 必须只有最终 JSON，但长时间拉取
            # 不能是个黑盒（线上几千个文件时尤其如此）。
            sys.stderr.write('\r  %d/%d 文件  %.1f MB  %.0fs   '
                             % (done[0], total_jobs, total_bytes[0] / 1048576.0, time.time() - started))
            sys.stderr.flush()

        def work(job):
            kind, dest, src, need_auth = job
            try:
                # 断点续传：已经落盘且非空的文件直接跳过。网络差的时候一次拉不全
                # 是常态，重跑一次只补缺口，而不是把几千个文件重下一遍。
                if not args.force and os.path.exists(dest) and os.path.getsize(dest) > 0:
                    with lock:
                        total_bytes[0] += os.path.getsize(dest)
                        skipped[0] += 1
                        done[0] += 1
                    return
                if kind == 'page':
                    page = api('GET', '/api/pages/' + urllib.parse.quote(src))
                    os.makedirs(os.path.dirname(dest) or '.', exist_ok=True)
                    with open(dest, 'w') as f:
                        f.write(page.get('content') or '')
                    nbytes = os.path.getsize(dest)
                else:
                    nbytes = download(src, dest, use_auth=need_auth)
                with lock:
                    total_bytes[0] += nbytes
                    done[0] += 1
                    cur = done[0]
                if cur % 10 == 0 or cur == total_jobs:
                    progress()
            except Exception as e:
                with lock:
                    errors.append({'path': dest, 'error': str(e)})
                    done[0] += 1

        with ThreadPoolExecutor(max_workers=max(1, min(args.concurrency, 8))) as pool:
            list(pool.map(work, jobs))
        if not args.json:
            sys.stderr.write('\n')

        summary = {'ok': not errors, 'dir': os.path.abspath(out_dir), 'planned': total_jobs, 'files': done[0],
                   'skipped': skipped[0], 'bytes': total_bytes[0], 'errors': errors, 'counts': idx['counts']}
        lines = ['拉取完成：%d 个文件（跳过已存在 %d），%.1f MB'
                 % (done[0], skipped[0], total_bytes[0] / 1048576.0),
                 '输出目录：%s' % os.path.abspath(out_dir)]
        if errors:
            lines.append('失败 %d 项（见 --json 输出的 errors）' % len(errors))
        emit(args, summary, lines, EXIT_PARTIAL if errors else EXIT_OK)
    guard(run, args)


# ── 写操作 ───────────────────────────────────────────────────────────────────

def cmd_push(args):
    if args.what == 'img':
        def run():
            results = []
            for path in args.files:
                if not os.path.isfile(path):
                    results.append({'file': path, 'error': '文件不存在'})
                    continue
                data = open(path, 'rb').read()
                ctype = mimetypes.guess_type(path)[0] or 'application/octet-stream'
                name = urllib.parse.quote(os.path.basename(path))
                try:
                    r = api('POST', '/upload', raw=data,
                            headers={'Content-Type': ctype, 'X-File-Name': name})
                    results.append({'file': path, 'url': r.get('url'), 'key': r.get('key')})
                except ApiError as e:
                    # 401/403 是账号级问题，后续文件也一定失败：直接按授权错误退出，
                    # 不要伪装成「部分成功」让 Agent 以为可以重试。
                    if e.status in (401, 403):
                        translate_error(e, args)
                    results.append({'file': path, 'error': str(e)})
            ok = [r for r in results if r.get('url')]
            emit(args, {'ok': len(ok) == len(results), 'uploaded': len(ok), 'results': results},
                 ['%s -> %s' % (r['file'], r['url']) for r in ok] + ['%s 失败：%s' % (r['file'], r['error']) for r in results if r.get('error')],
                 EXIT_OK if len(ok) == len(results) else EXIT_PARTIAL)
        guard(run, args)

    # proto：目录或 zip 一律打包成 zip 再走 /upload/proto（服务端自己解压）
    def run_proto():
        src = args.files[0]
        if not os.path.exists(src):
            fail(args, '路径不存在：%s' % src, EXIT_ERR)
        tmp = None
        if os.path.isdir(src):
            tmp = tempfile.NamedTemporaryFile(suffix='.zip', delete=False)
            tmp.close()
            with zipfile.ZipFile(tmp.name, 'w', zipfile.ZIP_DEFLATED) as z:
                for root, _dirs, files in os.walk(src):
                    for fn in files:
                        full = os.path.join(root, fn)
                        rel = os.path.relpath(full, os.path.dirname(os.path.abspath(src)))
                        z.write(full, rel.replace(os.sep, '/'))
            zip_path = tmp.name
        else:
            zip_path = src
        try:
            data = open(zip_path, 'rb').read()
            fields = {'title': args.title or os.path.basename(os.path.abspath(src)).replace('.zip', '')}
            if args.proto_id:
                fields['protoId'] = args.proto_id
            if args.password:
                fields['password'] = args.password
            r = api_form('/upload/proto', fields, {'file': (os.path.basename(src).replace('.zip', '') + '.zip', data, 'application/zip')})
            emit(args, {'ok': True, 'protoId': r.get('protoId'), 'url': r.get('url'), 'version': r.get('version'),
                        'files': r.get('fileCount'), 'bytes': r.get('totalSize')},
                 ['已上传：%s  v%s  %d 文件' % (r.get('url'), r.get('version'), r.get('fileCount') or 0)])
        finally:
            if tmp:
                os.unlink(tmp.name)
    guard(run_proto, args)


def cmd_edit(args):
    def run():
        kind, ident = ref_split(args.ref)
        if kind in ('img', 'image'):
            meta = api('GET', '/api/image/%s/meta' % urllib.parse.quote(ident))
            changed = []
            if args.tags is not None:
                tags = [t.strip() for t in args.tags.split(',') if t.strip()]
                api('PATCH', '/api/image/%s/tags' % urllib.parse.quote(ident), {'tags': tags})
                changed.append('tags=%s' % ','.join(tags))
            if args.public or args.private:
                want = bool(args.public)
                if bool(meta.get('isPublic')) != want:
                    api('PATCH', '/api/image/%s/visibility' % urllib.parse.quote(ident))
                    changed.append('public=%s' % want)
            emit(args, {'ok': True, 'ref': args.ref, 'changed': changed}, ['%s 已更新：%s' % (args.ref, ', '.join(changed) or '无变化')])
        if kind == 'page':
            body = {}
            if args.title is not None:
                body['title'] = args.title
            if args.public or args.private:
                body['isPublic'] = bool(args.public)
            if not body:
                fail(args, '没有可改的字段（--title / --public / --private）', EXIT_USAGE)
            api('PATCH', '/api/pages/' + urllib.parse.quote(ident), body)
            emit(args, {'ok': True, 'ref': args.ref, 'changed': body}, ['%s 已更新' % args.ref])
        if kind == 'proto':
            body = {}
            if args.title is not None:
                body['title'] = args.title
            if args.tags is not None:
                body['tags'] = [t.strip() for t in args.tags.split(',') if t.strip()]
            if args.public or args.private:
                body['isPrivate'] = bool(args.private)
            if args.password is not None:
                body['password'] = args.password
            if not body:
                fail(args, '没有可改的字段（--title / --tags / --public / --private / --password）', EXIT_USAGE)
            api('PATCH', '/api/protos/' + urllib.parse.quote(ident), body)
            emit(args, {'ok': True, 'ref': args.ref, 'changed': sorted(body)}, ['%s 已更新' % args.ref])
        if kind in ('project', 'group'):
            body = {}
            if args.title is not None:
                body['name'] = args.title
            if not body:
                fail(args, '没有可改的字段（--title）', EXIT_USAGE)
            path = '/api/%ss/%s' % (kind, urllib.parse.quote(ident))
            api('PATCH', path, body)
            emit(args, {'ok': True, 'ref': args.ref, 'changed': body}, ['%s 已更新' % args.ref])
        fail(args, '不支持的引用类型：%s' % kind, EXIT_USAGE)
    guard(run, args)


def cmd_rm(args):
    def run():
        targets = args.refs
        plan = []
        for ref in targets:
            kind, ident = ref_split(ref)
            plan.append({'ref': ref, 'kind': kind, 'id': ident})
        if not args.yes:
            emit(args, {'ok': True, 'dryRun': True, 'toDelete': plan, 'hint': '确认无误后加 --yes 执行'},
                 ['待删除（dry-run，未执行）：'] + ['  %s' % p['ref'] for p in plan] + ['确认无误后加 --yes 执行'])
        done = []
        for p in plan:
            kind, ident = p['kind'], p['id']
            if kind in ('img', 'image'):
                api('DELETE', '/delete/' + urllib.parse.quote(ident))
            elif kind == 'page':
                api('DELETE', '/api/pages/' + urllib.parse.quote(ident))
            elif kind == 'proto':
                api('DELETE', '/api/protos/' + urllib.parse.quote(ident))
            elif kind in ('project', 'group'):
                api('DELETE', '/api/%ss/%s' % (kind, urllib.parse.quote(ident)))
            else:
                fail(args, '不支持的引用类型：%s' % kind, EXIT_USAGE)
            done.append(p['ref'])
        emit(args, {'ok': True, 'deleted': done},
             ['已删除（可在回收站 30 天内恢复）：'] + ['  ' + d for d in done])
    guard(run, args)


def cmd_versions(args):
    def run():
        protos = api('GET', '/api/protos')['protos']
        proto = next((p for p in protos if p['protoId'] == args.proto), None)
        if not proto:
            fail(args, '找不到原型 %s' % args.proto, EXIT_ERR)
        vers = proto.get('versions') or []
        note = '历史版本的文件字节会被新版本覆盖，只能拉当前版本的正文。'
        emit(args, {'ok': True, 'protoId': proto['protoId'], 'title': proto.get('title'),
                    'current': proto.get('version'), 'versions': vers, 'note': note},
             ['%s  v%s（当前）' % (proto.get('title'), proto.get('version'))]
             + ['  v%s  %s  %s 文件  %s' % (v.get('v'), time.strftime('%Y-%m-%d %H:%M', time.localtime((v.get('at') or 0) / 1000)),
                                             v.get('files'), '%.1f KB' % ((v.get('size') or 0) / 1024.0)) for v in vers]
             + ['', note])
    guard(run, args)


# ── CLI ──────────────────────────────────────────────────────────────────────

def build_parser():
    p = argparse.ArgumentParser(prog='onimg-agent', description='Onimg 非交互 CLI（Agent / Skill 用）')
    p.add_argument('--json', action='store_true', help='输出机器可解析的 JSON')
    # --json 放在子命令前后都要能用：Agent 自然会把全局开关写在最后，
    # 只定义在顶层的话 argparse 会直接报 unrecognized arguments。
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument('--json', action='store_true', default=argparse.SUPPRESS, help=argparse.SUPPRESS)
    sub = p.add_subparsers(dest='cmd', required=True)

    a = sub.add_parser('auth', help='登录 / 状态 / 退出', parents=[common])
    a.add_argument('action', choices=['login', 'status', 'logout'])
    a.add_argument('--scope', choices=['read', 'write'], default='write', help='申请只读还是读写（默认读写）')
    a.add_argument('--url', help='服务器地址（首次使用或切换实例时）')
    a.set_defaults(func=cmd_auth)

    ls = sub.add_parser('ls', help='列出索引内容', parents=[common])
    ls.add_argument('kind', nargs='?', default='all', choices=['all', 'img', 'page', 'proto', 'project', 'group'])
    ls.add_argument('--q', help='本地关键字过滤')
    ls.set_defaults(func=cmd_ls)

    t = sub.add_parser('tree', help='目录树（项目 / 分组 → 页面）', parents=[common])
    t.set_defaults(func=cmd_tree)

    g = sub.add_parser('get', help='取单个对象（img / page / proto）', parents=[common])
    g.add_argument('ref', help='kind:id，例如 img:123-ab.jpg')
    g.add_argument('-o', '--output', help='输出路径（目录或文件）')
    g.set_defaults(func=cmd_get)

    pl = sub.add_parser('pull', help='批量拉取到本地（当前版本）', parents=[common])
    pl.add_argument('ref', nargs='?', help='可选：只拉某个对象，例如 proto:abc')
    pl.add_argument('--all', action='store_true', help='图片 + 页面 + 原型')
    pl.add_argument('--kind', choices=['img', 'page', 'proto'], help='只拉某一类')
    pl.add_argument('-o', '--output', default='onimg-backup')
    pl.add_argument('--concurrency', type=int, default=8)
    pl.add_argument('--timeout', type=int, default=20, help='单次请求超时秒数（默认 20）')
    pl.add_argument('--force', action='store_true', help='重新下载已存在的文件（默认跳过，用于断点续传）')
    pl.set_defaults(func=cmd_pull)

    ps = sub.add_parser('push', help='上传', parents=[common])
    ps.add_argument('what', choices=['img', 'proto'])
    ps.add_argument('files', nargs='+')
    ps.add_argument('--id', dest='proto_id', help='原型 ID：填了就是更新（增量）')
    ps.add_argument('--title')
    ps.add_argument('--password')
    ps.set_defaults(func=cmd_push)

    e = sub.add_parser('edit', help='改元数据（标题 / 标签 / 可见性 / 密码）', parents=[common])
    e.add_argument('ref')
    e.add_argument('--title')
    e.add_argument('--tags')
    e.add_argument('--public', action='store_true')
    e.add_argument('--private', action='store_true')
    e.add_argument('--password')
    e.set_defaults(func=cmd_edit)

    r = sub.add_parser('rm', help='删除（默认 dry-run）', parents=[common])
    r.add_argument('refs', nargs='+')
    r.add_argument('--yes', action='store_true', help='真的执行删除')
    r.set_defaults(func=cmd_rm)

    v = sub.add_parser('versions', help='原型版本列表', parents=[common])
    v.add_argument('proto')
    v.set_defaults(func=cmd_versions)

    return p


def main(argv=None):
    args = build_parser().parse_args(argv)
    try:
        args.func(args)
    except ApiError as e:
        translate_error(e, args)
    except KeyboardInterrupt:
        sys.exit(130)


if __name__ == '__main__':
    main()
