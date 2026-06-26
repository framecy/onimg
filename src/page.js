import { FFLATE_UMD } from './fflate-inline.js';
export function renderPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Onimg</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
  <noscript><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet"></noscript>
  <!-- Vditor CSS/JS 改为编辑器打开时按需注入（见 ensureVditor），避免每次访问加载 ~0.5MB 编辑器 -->
  <style>
    :root {
      --bg:     #0a0a0a; --bg-2: #141414; --bg-3: #1a1a1a; --bg-4: #222222; --bg-5: #2a2a2a;
      --bg-h:   #2e2e2e;
      --bd:     #2e2e2e; --bd-2: #3a3a3a; --bd-f: #6e6e6e;
      --tx:     #f5f5f5; --tx-2: #b5b5b5; --tx-3: #858585; --tx-a: #e8e8e8;
      --accent: #e0e0e0;
      --green:  #34d399; --green-g: rgba(52,211,153,.12); --green-r: rgba(52,211,153,.22);
      --amber:  #fbbf24; --amber-g: rgba(251,191,36,.1);  --amber-r: rgba(251,191,36,.2);
      --red:    #f87171; --red-g: rgba(248,113,113,.1);   --red-r: rgba(248,113,113,.2);
      --r: 10px; --r-sm: 7px; --r-xs: 5px;
      --shadow: 0 24px 60px rgba(0,0,0,.92); --shadow-sm: 0 8px 28px rgba(0,0,0,.55);
      --t: all .18s ease;
      --font: 'Outfit', system-ui, -apple-system, sans-serif;
      --mono: 'JetBrains Mono', 'Fira Code', monospace;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: var(--font); background: var(--bg); color: var(--tx); min-height: 100vh; font-weight: 450; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

    /* ── Shell ── */
    .shell { display: flex; min-height: 100vh; }

    /* ── Sidebar ── */
    aside {
      width: 240px; flex-shrink: 0; background: var(--bg-2);
      border-right: 1px solid var(--bd);
      display: flex; flex-direction: column;
      position: fixed; top: 0; left: 0; bottom: 0; z-index: 10;
    }
    .sidebar-logo { padding: 18px 16px 14px; border-bottom: 1px solid var(--bd); display: flex; align-items: center; gap: 10px; }
    .sidebar-logo-mark { width: 30px; height: 30px; background: linear-gradient(135deg, #2e2e2e 0%, #1a1a1a 100%); border: 1px solid var(--bd-2); border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: .78rem; font-weight: 800; color: var(--tx); flex-shrink: 0; letter-spacing: -.01em; box-shadow: 0 3px 10px rgba(0,0,0,.5); }
    .sidebar-logo-text { display: flex; flex-direction: column; gap: 1px; }
    .sidebar-logo-name { font-size: .92rem; font-weight: 700; color: var(--tx); letter-spacing: -.015em; }
    .sidebar-logo-tag { font-size: .58rem; font-weight: 600; color: var(--tx-3); text-transform: uppercase; letter-spacing: .12em; }
    .sidebar-nav-label { font-size: .58rem; font-weight: 700; color: var(--tx-3); text-transform: uppercase; letter-spacing: .12em; padding: 14px 16px 5px; }
    nav.sidebar-nav { flex: 1; padding: 4px 8px 8px; display: flex; flex-direction: column; gap: 1px; overflow-y: auto; }
    .tab { display: flex; align-items: center; gap: 9px; padding: 9px 11px; border-radius: 7px; cursor: pointer; font-size: .85rem; font-weight: 600; color: var(--tx-2); transition: var(--t); border: none; background: none; width: 100%; text-align: left; position: relative; font-family: var(--font); overflow: hidden; }
    .tab:hover { background: var(--bg-h); color: var(--tx); }
    .tab.active { background: rgba(255,255,255,.09); color: var(--tx); box-shadow: inset 3px 0 0 rgba(255,255,255,.55); font-weight: 700; }
    .tab .nav-icon { width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: .9rem; line-height: 1; }
    .tab:active { transform: scale(.972); }
    @keyframes navRipple { to { transform: translate(-50%,-50%) scale(4); opacity: 0; } }
    .nav-ripple { position: absolute; width: 60px; height: 60px; border-radius: 50%; background: rgba(255,255,255,.08); transform: translate(-50%,-50%) scale(0); animation: navRipple .55s ease-out forwards; pointer-events: none; }
    .sidebar-bottom { padding: 0 8px 6px; }
    .sidebar-link { display: flex; align-items: center; gap: 9px; padding: 8px 10px; border-radius: 7px; color: var(--tx-2); font-size: .82rem; text-decoration: none; transition: var(--t); font-weight: 500; }
    .sidebar-link:hover { background: var(--bg-h); color: var(--tx); }
    .sidebar-footer { padding: 10px 8px 12px; border-top: 1px solid var(--bd); position: relative; }

    /* ── User area (sidebar bottom) ── */
    #userArea { position: relative; }
    #userArea > .btn-sm { width: 100%; padding: 9px 12px; background: var(--bg-3); border: 1px solid var(--bd-2); border-radius: 8px; color: var(--tx); font-size: .85rem; font-weight: 600; cursor: pointer; font-family: var(--font); text-align: center; transition: var(--t); }
    #userArea > .btn-sm:hover { background: var(--bg-4); border-color: var(--bd-f); }
    .user-chip { display: flex; align-items: center; gap: 9px; padding: 8px 10px; border-radius: 8px; background: var(--bg-3); border: 1px solid var(--bd); cursor: pointer; user-select: none; transition: var(--t); }
    .user-chip:hover { border-color: var(--bd-2); background: var(--bg-4); }
    .user-chip .dot-green { width: 7px; height: 7px; border-radius: 50%; background: var(--green); flex-shrink: 0; box-shadow: 0 0 6px rgba(52,211,153,.5); }
    .user-chip > span:nth-of-type(1) { font-size: .82rem; font-weight: 600; color: var(--tx); flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-chip .caret { font-size: .65rem; color: var(--tx-3); transition: transform .15s; flex-shrink: 0; }
    .user-chip.open .caret { transform: rotate(180deg); }
    /* Dropdown opens upward from sidebar bottom */
    .user-dropdown { position: absolute; bottom: calc(100% + 6px); left: 8px; right: 8px; background: var(--bg-3); border: 1px solid var(--bd-2); border-radius: 10px; box-shadow: var(--shadow-sm); z-index: 100; overflow: hidden; display: none; }
    .user-dropdown.show { display: block; }
    .ud-header { padding: 12px 14px 10px; border-bottom: 1px solid var(--bd); }
    .ud-name { font-size: .88rem; font-weight: 700; color: var(--tx); }
    .ud-role { font-size: .7rem; color: var(--tx-2); margin-top: 2px; font-weight: 500; }
    .ud-perms { padding: 10px 14px; border-bottom: 1px solid var(--bd); display: flex; flex-wrap: wrap; gap: 5px; }
    .ud-perm { font-size: .66rem; padding: 2px 7px; border-radius: 4px; font-weight: 600; }
    .perm-on    { background: var(--green-g); color: var(--green); border: 1px solid var(--green-r); }
    .perm-off   { background: rgba(255,255,255,.04); color: var(--tx-3); border: 1px solid var(--bd); }
    .perm-admin { background: rgba(255,255,255,.07); color: var(--tx); border: 1px solid var(--bd-2); }
    .ud-action { display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 14px; background: none; border: none; color: var(--tx-2); font-size: .82rem; cursor: pointer; text-align: left; transition: background .12s, color .12s; font-family: var(--font); font-weight: 500; }
    .ud-action:hover { background: var(--bg-h); color: var(--tx); }
    .ud-action.danger:hover { color: var(--red); background: var(--red-g); }

    /* ── Main content ── */
    .main-content { flex: 1; margin-left: 240px; min-width: 0; background: var(--bg); display: flex; flex-direction: column; min-height: 100vh; }

    /* ── Mobile sidebar ── */
    .mob-header { display: none; position: fixed; top: 0; left: 0; right: 0; height: 50px; background: var(--bg-2); border-bottom: 1px solid var(--bd); z-index: 20; align-items: center; gap: 14px; padding: 0 16px; }
    .mob-hamburger { background: none; border: 1px solid var(--bd); color: var(--tx-2); width: 32px; height: 32px; border-radius: 7px; cursor: pointer; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; }
    .mob-hamburger:hover { color: var(--tx); border-color: var(--bd-2); }
    .mob-title { font-size: .92rem; font-weight: 700; color: var(--tx); }
    .sidebar-mask { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.6); z-index: 9; }
    .sidebar-mask.show { display: block; }
    @media (max-width: 768px) {
      aside { transform: translateX(-240px); transition: transform .22s ease; }
      aside.open { transform: translateX(0); z-index: 15; }
      .main-content { margin-left: 0; padding-top: 50px; }
      .mob-header { display: flex; }
    }

    .spacer { flex: 1; }
    .dot-green { width: 6px; height: 6px; border-radius: 50%; background: var(--green); flex-shrink: 0; }
    .btn-sm { padding: 6px 12px; border: 1px solid var(--bd); border-radius: 6px; background: transparent; color: var(--tx-2); cursor: pointer; font-size: .8rem; white-space: nowrap; font-family: var(--font); font-weight: 500; transition: var(--t); }
    .btn-sm:hover { color: var(--tx); border-color: var(--bd-2); }

    /* Login overlay */
    #loginOverlay { position: fixed; inset: 0; background: rgba(0,0,0,.85); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 24px; }
    .login-card { background: var(--bg-3); border: 1px solid var(--bd); border-radius: 14px; padding: 36px 32px; width: 100%; max-width: 360px; box-shadow: var(--shadow); }
    .login-card h2 { font-size: 1.1rem; font-weight: 800; letter-spacing: -.02em; margin-bottom: 28px; color: var(--tx); }
    .field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
    .field label { font-size: .67rem; color: var(--tx-2); font-weight: 700; text-transform: uppercase; letter-spacing: .1em; }
    .field input, .field select, .field textarea { padding: 9px 12px; background: var(--bg-2); border: 1px solid var(--bd); border-radius: 8px; color: var(--tx); font-size: .88rem; font-family: var(--font); outline: none; transition: var(--t); }
    .field input:focus, .field select:focus, .field textarea:focus { border-color: var(--bd-f); background: var(--bg); box-shadow: 0 0 0 3px rgba(255,255,255,.04); }
    .field textarea { resize: vertical; min-height: 120px; font-family: var(--mono); font-size: .82rem; }
    .btn-full { width: 100%; padding: 10px; background: #e0e0e0; color: #0a0a0a; border: none; border-radius: 8px; font-size: .9rem; font-weight: 700; font-family: var(--font); cursor: pointer; margin-top: 6px; transition: var(--t); }
    .btn-full:hover { background: #f2f2f2; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,255,255,.07); }
    .btn-full:disabled { background: var(--bg-5); color: var(--tx-3); cursor: not-allowed; transform: none; box-shadow: none; }
    .login-err { color: var(--red); font-size: .78rem; margin-top: 10px; text-align: center; min-height: 18px; }
    /* Login enhancements */
    @keyframes loginSpin { to { transform: rotate(360deg); } }
    @keyframes loginShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
    .btn-full.loading { pointer-events: none; }
    .btn-full.loading::before { content:''; display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:loginSpin .6s linear infinite; margin-right:8px; vertical-align:middle; }
    .login-card.shake { animation: loginShake .35s ease; }
    .pass-wrap { position: relative; }
    .pass-wrap input { padding-right: 38px; width: 100%; }
    .pass-toggle { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--tx-3); cursor: pointer; padding: 4px; line-height: 1; font-size: .9rem; }
    .pass-toggle:hover { color: var(--tx); }
    /* Toast types */
    .toast.t-success { background: rgba(52,211,153,.12); border-color: var(--green-r); color: var(--green); }
    .toast.t-warn    { background: var(--amber-g);  border-color: var(--amber-r); color: var(--amber); }
    .toast.t-error   { background: var(--red-g);    border-color: var(--red-r);   color: var(--red); }

    main { flex: 1; padding: 28px 30px 40px; max-width: 1280px; margin: 0 auto; width: 100%; }
    .panel { display: none; }
    .panel.active { display: block; }
    .page-header { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--bd); display: flex; align-items: flex-end; gap: 14px; }
    .page-header-text { flex: 1; min-width: 0; }
    .page-header .page-title { font-size: 1.35rem; font-weight: 800; color: var(--tx); letter-spacing: -.025em; margin-bottom: 4px; }
    .page-header .page-sub { font-size: .83rem; color: var(--tx-2); font-weight: 500; }

    /* Upload */
    .quota-bar { background: var(--bg-3); border: 1px solid var(--bd); border-radius: 8px; padding: 10px 14px; font-size: .82rem; display: flex; gap: 18px; margin-bottom: 14px; box-shadow: 0 1px 0 rgba(255,255,255,.02) inset; }
    .quota-bar span { color: var(--tx-2); font-weight: 500; }
    .quota-bar strong { color: var(--tx); font-weight: 700; font-family: var(--mono); }
    .drop-zone { border: 1.5px dashed var(--bd-2); border-radius: 14px; padding: 52px 32px; text-align: center; cursor: pointer; color: var(--tx-3); transition: var(--t); margin-bottom: 14px; background: rgba(255,255,255,.012); }
    .drop-zone:hover, .drop-zone.over { border-color: var(--tx-2); color: var(--tx); background: rgba(255,255,255,.03); }
    .drop-zone:hover .dz-icon, .drop-zone.over .dz-icon { color: var(--tx); }
    .drop-zone input { display: none; }
    .dz-icon { display: block; margin: 0 auto 16px; width: 42px; height: 42px; color: var(--tx-3); transition: color .2s; }
    .btn-upload { width: 100%; padding: 11px; background: #e0e0e0; color: #0a0a0a; border: none; border-radius: 8px; font-size: .92rem; font-weight: 700; cursor: pointer; font-family: var(--font); transition: var(--t); }
    .btn-upload:hover { background: #f2f2f2; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,255,255,.07); }
    .btn-upload:disabled { background: var(--bg-5); color: var(--tx-3); cursor: not-allowed; transform: none; box-shadow: none; }
    .progress { height: 3px; background: var(--bg-3); border-radius: 99px; margin: 10px 0; overflow: hidden; display: none; }
    .progress.show { display: block; }
    .progress-bar { height: 100%; background: var(--accent); width: 0%; transition: width .25s; }
    .progress-info { display: none; align-items: center; gap: 10px; margin-top: -4px; margin-bottom: 6px; font-size: .76rem; color: var(--tx-2); }
    .progress-info.show { display: flex; }
    .progress-info .pct { font-weight: 700; color: var(--tx); min-width: 34px; font-family: var(--mono); }
    .progress-info .bytes { color: var(--tx-3); font-family: var(--mono); }
    .result-list { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
    .result-item { background: var(--bg-3); border: 1px solid var(--bd); border-radius: 9px; padding: 10px 14px; display: flex; align-items: center; gap: 12px; }
    .result-item img { width: 44px; height: 44px; object-fit: cover; border-radius: 5px; border: 1px solid var(--bd); }
    .result-item .info { flex: 1; min-width: 0; }
    .result-item .name { font-size: .8rem; color: var(--tx); font-weight: 500; }
    .url-row { display: flex; gap: 5px; margin-top: 4px; }
    .url-input { flex: 1; background: var(--bg-2); border: 1px solid var(--bd); border-radius: 5px; color: var(--tx); font-size: .75rem; padding: 3px 8px; outline: none; min-width: 0; font-family: var(--mono); }
    .err { color: var(--red); font-size: .8rem; margin-top: 8px; }

    /* Buttons */
    .btn { padding: 6px 12px; border: none; border-radius: 6px; font-size: .8rem; font-weight: 600; cursor: pointer; transition: var(--t); font-family: var(--font); }
    .btn-ghost { background: var(--bg-3); color: var(--tx-2); border: 1px solid var(--bd); }
    .btn-ghost:hover { background: var(--bg-4); color: var(--tx); border-color: var(--bd-2); }
    .btn-danger { background: var(--red-g); color: var(--red); border: 1px solid var(--red-r); }
    .btn-danger:hover { background: rgba(248,113,113,.18); }
    .btn-public  { background: var(--green-g); color: var(--green); font-size: .7rem; padding: 3px 9px; border-radius: 10px; border: 1px solid var(--green-r); cursor: pointer; font-weight: 600; }
    .btn-private { background: rgba(255,255,255,.04); color: var(--tx-3); font-size: .7rem; padding: 3px 9px; border-radius: 10px; border: 1px solid var(--bd); cursor: pointer; font-weight: 600; }

    /* Gallery grid */
    .toolbar { display: flex; gap: 8px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
    .search-input { padding: 8px 12px; background: var(--bg-3); border: 1px solid var(--bd); border-radius: 7px; color: var(--tx); font-size: .84rem; outline: none; width: 220px; font-family: var(--font); transition: var(--t); }
    .search-input:focus { border-color: var(--bd-f); box-shadow: 0 0 0 3px rgba(255,255,255,.04); }
    .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px; }
    .gitem { background: var(--bg-3); border: 1px solid var(--bd); border-radius: 10px; overflow: hidden; transition: var(--t); box-shadow: 0 1px 0 rgba(255,255,255,.02) inset; }
    .gitem:hover { border-color: var(--bd-2); box-shadow: 0 6px 24px rgba(0,0,0,.5); transform: translateY(-2px); }
    .gitem img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; background: var(--bg-2); cursor: pointer; }
    .gitem-info { padding: 9px 11px; }
    .gitem-key { font-size: .72rem; color: var(--tx-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: var(--mono); font-weight: 500; }
    .gitem-row { display: flex; justify-content: space-between; align-items: center; margin-top: 5px; }
    .gitem-actions { display: flex; gap: 4px; margin-top: 6px; }
    /* Batch selection */
    .batch-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; padding: 9px 14px; background: var(--bg-3); border: 1px solid var(--bd-2); border-radius: 9px; flex-wrap: wrap; }
    .batch-check { display: flex; align-items: center; gap: 6px; font-size: .82rem; color: var(--tx-2); cursor: pointer; user-select: none; }
    .batch-count { font-size: .8rem; color: var(--tx-3); font-family: var(--mono); }
    .gitem { position: relative; }
    .gitem-sel { position: absolute; top: 8px; left: 8px; z-index: 3; width: 20px; height: 20px; cursor: pointer; accent-color: #e0e0e0; display: none; }
    .gallery-grid.selecting .gitem-sel { display: block; }
    .gallery-grid.selecting .gitem img { cursor: pointer; }
    .gitem.selected { border-color: var(--tx-2); box-shadow: 0 0 0 2px var(--tx-2) inset; }
    /* Tags */
    .gitem-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
    .tag-chip { font-size: .64rem; padding: 1px 7px; border-radius: 10px; background: rgba(255,255,255,.05); color: var(--tx-2); border: 1px solid var(--bd); font-weight: 600; white-space: nowrap; }
    .tag-filter-bar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 14px; }
    .tag-filter { font-size: .72rem; padding: 3px 11px; border-radius: 12px; background: var(--bg-3); color: var(--tx-2); border: 1px solid var(--bd); cursor: pointer; font-weight: 600; transition: var(--t); font-family: var(--font); }
    .tag-filter:hover { border-color: var(--bd-2); color: var(--tx); }
    .tag-filter.active { background: rgba(255,255,255,.1); color: var(--tx); border-color: var(--bd-f); }
    .tag-filter-label { font-size: .68rem; color: var(--tx-3); text-transform: uppercase; letter-spacing: .1em; font-weight: 700; margin-right: 2px; }
    /* Tag editor modal */
    .tag-edit-list { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; min-height: 28px; }
    .tag-edit-item { display: inline-flex; align-items: center; gap: 5px; font-size: .76rem; padding: 3px 6px 3px 10px; border-radius: 12px; background: rgba(255,255,255,.06); color: var(--tx); border: 1px solid var(--bd-2); font-weight: 600; }
    .tag-edit-item button { background: none; border: none; color: var(--tx-3); cursor: pointer; font-size: .9rem; line-height: 1; padding: 0; }
    .tag-edit-item button:hover { color: var(--red); }

    /* Pages */
    .pages-header { display: flex; align-items: center; margin-bottom: 16px; }
    .pages-list { display: flex; flex-direction: column; gap: 8px; }
    .page-item { background: var(--bg-3); border: 1px solid var(--bd); border-radius: 10px; padding: 14px 16px; display: flex; align-items: center; gap: 14px; transition: var(--t); }
    .page-item:hover { border-color: var(--bd-2); background: var(--bg-4); }
    .page-item-info { flex: 1; min-width: 0; }
    .page-title { font-size: .92rem; font-weight: 600; color: var(--tx); }
    .page-slug { font-size: .75rem; color: var(--tx-2); font-family: var(--mono); margin-top: 3px; }
    .page-meta { font-size: .72rem; color: var(--tx-3); margin-top: 3px; font-weight: 500; }
    .type-badge { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: .66rem; font-weight: 700; }
    .type-md   { background: rgba(255,255,255,.07); color: var(--tx); border: 1px solid var(--bd-2); }
    .type-html { background: var(--amber-g); color: var(--amber); border: 1px solid var(--amber-r); }
    /* Page tree view */
    .pages-tree { display: flex; flex-direction: column; gap: 6px; }
    .page-project { background: var(--bg-3); border: 1px solid var(--bd); border-radius: 10px; overflow: hidden; }
    .page-project-header { display: flex; align-items: center; padding: 10px 14px; cursor: pointer; gap: 8px; user-select: none; }
    .page-project-header:hover { background: var(--bg-4); }
    .expand-icon { font-size: .6rem; transition: transform .15s; color: var(--tx-3); width: 14px; text-align: center; flex-shrink: 0; }
    .expand-icon.open { transform: rotate(90deg); }
    .project-name, .group-name { flex: 1; font-weight: 600; font-size: .88rem; color: var(--tx); }
    .count-badge { font-size: .66rem; color: var(--tx-3); background: var(--bg-5); padding: 2px 7px; border-radius: 4px; font-weight: 600; }
    .proj-actions, .grp-actions { display: flex; gap: 3px; margin-left: 6px; }
    .proj-act-btn, .grp-act-btn { background: none; border: 1px solid transparent; color: var(--tx-3); cursor: pointer; font-size: .74rem; padding: 3px 8px; border-radius: 5px; transition: var(--t); }
    .proj-act-btn:hover, .grp-act-btn:hover { background: var(--bg-5); color: var(--tx); border-color: var(--bd); }
    .page-project-body { border-top: 1px solid var(--bd); }
    .page-group { margin-left: 18px; border-left: 2px solid var(--bd); }
    .page-group-header { display: flex; align-items: center; padding: 8px 12px; cursor: pointer; gap: 7px; user-select: none; }
    .page-group-header:hover { background: var(--bg-4); }
    .page-group-body {}
    .page-tree-docs { margin-left: 18px; border-left: 2px solid var(--bd); }
    .page-tree-item { background: var(--bg-2); border: 1px solid transparent; border-radius: 8px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; margin: 2px 0; transition: var(--t); }
    .page-tree-item:hover { border-color: var(--bd); background: var(--bg-3); }
    .drag-handle { cursor: grab; color: var(--tx-3); font-size: .78rem; padding: 0 2px; }
    .drag-handle:active { cursor: grabbing; }
    .pages-uncategorized { border-top: 1px dashed var(--bd-2); padding-top: 10px; margin-top: 6px; }
    .uncat-label { font-size: .72rem; color: var(--tx-3); font-weight: 600; letter-spacing: .04em; margin-bottom: 6px; }
    .page-tree-item.dragging { opacity: 0.3; border-style: dashed; border-color: var(--bd-2); }
    .page-tree-item.drag-over-top { border-top: 2px solid var(--accent); margin-top: -2px; }
    .page-tree-item.drag-over-bot { border-bottom: 2px solid var(--accent); margin-bottom: -2px; }
    .page-project.drag-over-proj { border-color: var(--accent); }
    .page-group-header.drag-over-grp { background: var(--bg-5); }

    /* Public gallery */
    .pub-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 14px; }
    .pub-item { border-radius: 10px; overflow: hidden; background: var(--bg-3); border: 1px solid var(--bd); cursor: pointer; transition: var(--t); box-shadow: 0 1px 0 rgba(255,255,255,.02) inset; }
    .pub-item:hover { border-color: var(--bd-2); box-shadow: 0 6px 24px rgba(0,0,0,.5); transform: translateY(-2px); }
    .pub-item img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; background: var(--bg-2); }
    .pub-item-info { padding: 8px 12px; font-size: .74rem; color: var(--tx-2); font-family: var(--mono); font-weight: 500; }

    /* Lightbox */
    .lightbox { position: fixed; inset: 0; background: rgba(0,0,0,.94); display: none; align-items: center; justify-content: center; z-index: 100; padding: 24px; }
    .lightbox.show { display: flex; }
    .lb-inner { background: var(--bg-3); border: 1px solid var(--bd-2); border-radius: 14px; max-width: 760px; width: 100%; overflow: hidden; box-shadow: var(--shadow); }
    .lb-img-wrap { background: var(--bg-2); display: flex; align-items: center; justify-content: center; min-height: 280px; max-height: 55vh; }
    .lb-img-wrap img { max-width: 100%; max-height: 55vh; object-fit: contain; }
    .lb-meta { padding: 14px 18px; }
    .lb-key { font-size: .85rem; color: var(--tx); word-break: break-all; font-family: var(--mono); }
    .lb-actions { display: flex; gap: 7px; margin-top: 12px; }
    .lb-close { position: absolute; top: 14px; right: 14px; background: var(--bg-3); border: 1px solid var(--bd-2); color: var(--tx-2); width: 32px; height: 32px; border-radius: 7px; cursor: pointer; font-size: .95rem; display: flex; align-items: center; justify-content: center; transition: var(--t); }
    .lb-close:hover { color: var(--tx); border-color: var(--bd-f); }
    .lb-nav { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,.6); border: 1px solid var(--bd-2); color: var(--tx); width: 40px; height: 60px; border-radius: 8px; cursor: pointer; font-size: 1.6rem; display: flex; align-items: center; justify-content: center; transition: var(--t); z-index: 101; }
    .lb-nav:hover { background: var(--bg-h); border-color: var(--bd-f); }
    .lb-nav-prev { left: 14px; }
    .lb-nav-next { right: 14px; }
    .load-more { display: flex; justify-content: center; margin-top: 20px; }
    .empty { text-align: center; padding: 48px; color: var(--tx-3); font-size: .88rem; font-weight: 500; }
    .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(80px); background: var(--bg-3); border: 1px solid var(--bd-2); color: var(--tx); padding: 9px 18px; border-radius: 8px; font-size: .82rem; transition: transform .25s; z-index: 200; white-space: nowrap; font-weight: 500; box-shadow: var(--shadow-sm); }
    .toast.show { transform: translateX(-50%) translateY(0); }

    /* Page editor modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.85); backdrop-filter: blur(2px); display: none; align-items: center; justify-content: center; z-index: 60; padding: 24px; }
    .modal-overlay.show { display: flex; }
    .modal { background: var(--bg-3); border: 1px solid var(--bd-2); border-radius: 14px; width: 100%; max-width: 860px; max-height: 96vh; display: flex; flex-direction: column; box-shadow: var(--shadow); }
    .modal-body { padding: 18px 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 12px; min-height: 0; }
    /* Vditor container */
    #pmVditor { border-radius: 8px; overflow: hidden; flex-shrink: 0; border: 1px solid var(--bd-2); }
    /* Force-hide outline regardless of Vditor internal state */
    #pmVditor .vditor-outline { display: none !important; }
    /* Content area fills remaining height and owns the scroll */
    #pmVditor .vditor-content {
      height: calc(100% - 36px) !important;
      overflow-y: auto !important;
      overscroll-behavior: contain;
    }
    /* Toolbar stays pinned at top — works whether modal or vditor-content scrolls */
    #pmVditor .vditor-toolbar {
      position: sticky !important;
      top: 0 !important;
      z-index: 10 !important;
      flex-wrap: nowrap;
      overflow-x: auto;
    }
    .modal-header { display: flex; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--bd); flex-shrink: 0; }
    .modal-header h3 { flex: 1; font-size: .98rem; font-weight: 700; color: var(--tx); letter-spacing: -.01em; }
    .modal-close { background: var(--bg-2); border: 1px solid var(--bd-2); color: var(--tx-2); width: 30px; height: 30px; border-radius: 6px; cursor: pointer; transition: var(--t); }
    .modal-close:hover { color: var(--tx); border-color: var(--bd-f); }
    .modal-body { padding: 18px 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 12px; }
    .modal-footer { padding: 12px 20px; border-top: 1px solid var(--bd); display: flex; gap: 8px; justify-content: flex-end; flex-shrink: 0; }
    .btn-primary { background: #e0e0e0; color: #0a0a0a; font-weight: 700; }
    .btn-primary:hover { background: #f2f2f2; }
    /* Skeleton shimmer */
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    .gitem img:not(.loaded), .pub-item img:not(.loaded) {
      background: linear-gradient(90deg, var(--bg-2) 25%, var(--bg-4) 50%, var(--bg-2) 75%);
      background-size: 400% 100%;
      animation: shimmer 1.4s ease infinite;
    }
    .gitem img.loaded, .pub-item img.loaded { animation: none; background: var(--bg-2); }
    /* Loading skeletons */
    .skel { background: linear-gradient(90deg, var(--bg-3) 25%, var(--bg-4) 50%, var(--bg-3) 75%); background-size: 400% 100%; animation: shimmer 1.4s ease infinite; border-radius: 6px; }
    .skel-card { background: var(--bg-3); border: 1px solid var(--bd); border-radius: 10px; overflow: hidden; }
    .skel-card .skel-thumb { width: 100%; aspect-ratio: 1; }
    .skel-card .skel-meta { padding: 10px 11px; display: flex; flex-direction: column; gap: 7px; }
    .skel-card .skel-line { height: 9px; }
    .skel-row { height: 58px; border: 1px solid var(--bd); border-radius: 9px; margin-bottom: 10px; }
    /* Responsive */
    @media (max-width: 600px) {
      main { padding: 16px 16px 28px; }
      .gallery-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
      .pub-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
      .search-input { width: 100%; max-width: 260px; }
      .drop-zone { padding: 36px 20px; }
      .page-header .page-title { font-size: 1.15rem; }
    }
    /* Phones — denser 3-up gallery */
    @media (max-width: 480px) {
      .gallery-grid, .pub-grid { grid-template-columns: repeat(3, 1fr); gap: 7px; }
      .gitem-info, .pub-item-info { padding: 6px 8px; }
      .gitem-key { font-size: .64rem; }
      .batch-bar { gap: 7px; padding: 8px 10px; }
    }

    /* Protos — upload box */
    .proto-upload-section { background: var(--bg-3); border: 1px solid var(--bd); border-radius: 12px; margin-bottom: 20px; overflow: hidden; box-shadow: 0 1px 0 rgba(255,255,255,.02) inset; }
    .proto-upload-head { display: flex; align-items: center; padding: 13px 16px; cursor: pointer; user-select: none; gap: 8px; }
    .proto-upload-head h3 { font-size: .9rem; font-weight: 700; flex: 1; color: var(--tx); letter-spacing: -.01em; }
    .proto-upload-head .toggle-icon { font-size: .65rem; color: var(--tx-3); transition: transform .2s; }
    .proto-upload-head .toggle-icon.open { transform: rotate(180deg); }
    .proto-upload-body { padding: 16px; border-top: 1px solid var(--bd); }
    .proto-upload-box { border: 1.5px dashed var(--bd-2); border-radius: 12px; padding: 28px; text-align: center; color: var(--tx-3); transition: var(--t); margin-bottom: 14px; cursor: pointer; background: rgba(255,255,255,.012); }
    .proto-upload-box:hover, .proto-upload-box.over { border-color: var(--tx-2); color: var(--tx); background: rgba(255,255,255,.03); }
    .proto-upload-box input { display: none; }
    .proto-fields { display: flex; gap: 10px; margin-bottom: 10px; }
    .proto-fields .field { flex: 1; margin-bottom: 0; }
    .proto-fields .field-pwd { flex: 0 0 160px; }
    /* Protos — table */
    .proto-table { width: 100%; border-collapse: collapse; font-size: .83rem; }
    .proto-table th { text-align: left; padding: 10px 13px; color: var(--tx-2); font-weight: 700; border-bottom: 1px solid var(--bd-2); white-space: nowrap; font-size: .66rem; text-transform: uppercase; letter-spacing: .11em; background: rgba(0,0,0,.3); }
    .proto-table td { padding: 10px 13px; border-bottom: 1px solid var(--bd); vertical-align: middle; color: var(--tx); }
    .proto-table tr:last-child td { border-bottom: none; }
    .proto-table tr:hover td { background: rgba(255,255,255,.025); }
    .proto-td-name { max-width: 280px; }
    .proto-td-name .name { font-weight: 600; font-size: .88rem; color: var(--tx); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .proto-td-name .id { font-family: var(--mono); font-size: .66rem; color: var(--tx-3); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .proto-td-actions { white-space: nowrap; text-align: right; }
    .proto-td-actions .btn { font-size: .75rem; padding: 4px 9px; }
    .proto-muted { color: var(--tx-2); font-size: .79rem; }
    /* badges */
    .proto-lock     { font-size: .68rem; background: var(--amber-g); color: var(--amber); border: 1px solid var(--amber-r); border-radius: 4px; padding: 1px 6px; font-weight: 600; }
    .proto-version  { font-size: .66rem; background: rgba(255,255,255,.06); color: var(--tx); border: 1px solid var(--bd-2); border-radius: 4px; padding: 1px 6px; font-weight: 700; font-family: var(--mono); }
    .proto-private  { font-size: .68rem; background: var(--red-g); color: var(--red); border: 1px solid var(--red-r); border-radius: 4px; padding: 1px 6px; font-weight: 600; }
    .proto-expired  { font-size: .68rem; background: rgba(255,255,255,.04); color: var(--tx-3); border: 1px solid var(--bd); border-radius: 4px; padding: 1px 6px; font-weight: 600; }
    /* version diff modal */
    .pvm-ver-card { background: var(--bg-2); border: 1px solid var(--bd); border-radius: 8px; padding: 9px 10px; cursor: pointer; transition: var(--t); }
    .pvm-ver-card:hover { border-color: var(--bd-2); }
    .pvm-ver-card.active   { border-color: var(--bd-f); background: rgba(255,255,255,.04); }
    .pvm-ver-card.checked-a { border-color: var(--green); background: var(--green-g); }
    .pvm-ver-card.checked-b { border-color: var(--amber); background: var(--amber-g); }
    .pvm-ver-badge  { font-size: .72rem; font-weight: 700; padding: 1px 7px; border-radius: 4px; margin-right: 4px; background: rgba(255,255,255,.08); color: var(--tx); border: 1px solid var(--bd-2); font-family: var(--mono); }
    .pvm-ver-latest { font-size: .65rem; padding: 1px 6px; border-radius: 3px; background: var(--green-g); color: var(--green); font-weight: 700; border: 1px solid var(--green-r); }
    .pvm-ver-meta   { font-size: .7rem; color: var(--tx-2); margin-top: 4px; font-weight: 500; }
    .pvm-ver-check  { display: flex; align-items: center; gap: 5px; margin-top: 5px; font-size: .7rem; color: var(--tx-2); }
    .diff-file { display: flex; align-items: center; gap: 6px; padding: 3px 6px; border-radius: 4px; font-size: .72rem; font-family: var(--mono); margin-bottom: 1px; }
    .diff-add  { background: var(--green-g); color: var(--green); }
    .diff-rem  { background: var(--red-g); color: var(--red); }
    .diff-prefix { flex-shrink: 0; width: 14px; font-weight: 700; }
    .diff-section { margin-bottom: 16px; }
    .diff-section h4 { font-size: .72rem; font-weight: 700; margin-bottom: 6px; padding: 5px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: .08em; }
    .diff-section.add  h4 { background: var(--green-g); color: var(--green); }
    .diff-section.rem  h4 { background: var(--red-g); color: var(--red); }
    .diff-section.same h4 { background: rgba(255,255,255,.04); color: var(--tx-3); }
    .file-row { display: flex; align-items: center; padding: 3px 6px; border-radius: 4px; font-size: .72rem; font-family: var(--mono); margin-bottom: 1px; color: var(--tx-2); }
    .file-row:hover { background: var(--bg-h); color: var(--tx); }
  </style>
</head>
<body>
<div class="mob-header">
  <button class="mob-hamburger" id="mobHamburger" aria-label="菜单">☰</button>
  <div class="mob-title">Onimg</div>
</div>
<div class="sidebar-mask" id="sidebarMask"></div>
<div class="shell">
  <aside id="sidebar">
    <div class="sidebar-logo">
      <div class="sidebar-logo-mark">O</div>
      <div class="sidebar-logo-text">
        <span class="sidebar-logo-name">Onimg</span>
        <span class="sidebar-logo-tag">IMAGE HOST</span>
      </div>
    </div>
    <div class="sidebar-nav-label">导航</div>
    <nav class="sidebar-nav">
      <button class="tab active" data-tab="gallery-pub"><span class="nav-icon">🌐</span><span>公开图库</span></button>
      <button class="tab" data-tab="upload"        id="tabUpload"><span class="nav-icon">⬆</span><span>上传</span></button>
      <button class="tab" data-tab="gallery-mine"  id="tabMine"><span class="nav-icon">🖼</span><span>我的图库</span></button>
      <button class="tab" data-tab="pages"         id="tabPages"><span class="nav-icon">📄</span><span>我的页面</span></button>
      <button class="tab" data-tab="protos"        id="tabProtos"><span class="nav-icon">📐</span><span>我的原型</span></button>
    </nav>
    <div class="sidebar-bottom">
      <span id="footerAdmin"></span>
    </div>
    <div class="sidebar-footer">
      <div id="userArea">
        <button class="btn-sm" id="loginTrigger">登录</button>
      </div>
    </div>
  </aside>

  <div class="main-content">

  <!-- Login overlay -->
  <div id="loginOverlay" style="display:none">
    <div class="login-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px">
        <h2 style="margin:0">登录 Onimg</h2>
        <button id="loginOverlayClose" style="background:none;border:none;color:#555;font-size:1.2rem;cursor:pointer;line-height:1;padding:4px">✕</button>
      </div>
      <div class="field"><label>用户名</label><input type="text" id="lu" autocomplete="username" placeholder="username"></div>
      <div class="field"><label>密码</label><div class="pass-wrap"><input type="password" id="lp" autocomplete="current-password" placeholder="••••••••"><button type="button" class="pass-toggle" id="lpToggle" title="显示/隐藏密码">👁</button></div></div>
      <button class="btn-full" id="doLogin">登录</button>
      <div class="login-err" id="loginErr"></div>
    </div>
  </div>

  <main>
    <!-- Public Gallery -->
    <div class="panel active" id="panel-gallery-pub">
      <div class="page-header">
        <div class="page-header-text">
          <div class="page-title">公开图库</div>
          <div class="page-sub">所有用户公开分享的图片</div>
        </div>
        <button class="btn btn-ghost" id="refreshPub">刷新</button>
      </div>
      <div class="pub-grid" id="pubGrid"></div>
      <div class="empty" id="pubEmpty" style="display:none">暂无公开图片</div>
    </div>

    <!-- Upload -->
    <div class="panel" id="panel-upload">
      <div class="page-header">
        <div class="page-header-text">
          <div class="page-title">上传图片</div>
          <div class="page-sub">支持 JPG / PNG / GIF / WebP / SVG，单文件 10 MB 内</div>
        </div>
      </div>
      <div class="quota-bar" id="quotaBar" style="display:none">
        <span>今日 <strong id="qDaily">—</strong></span>
        <span>总计 <strong id="qTotal">—</strong></span>
        <span id="qLimits" style="color:#444"></span>
      </div>
      <div class="drop-zone" id="dropZone">
        <input type="file" id="fileInput" accept="image/*" multiple>
        <svg class="dz-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 16 12 12 8 16"></polyline>
          <line x1="12" y1="12" x2="12" y2="21"></line>
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
        </svg>
        <p style="font-size:.9rem;font-weight:500;color:inherit">点击或拖拽图片上传</p>
        <small style="display:block;margin-top:8px;font-size:.76rem">JPG · PNG · GIF · WebP · SVG</small>
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;font-size:.82rem;color:#555">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;user-select:none">
          <input type="checkbox" id="uploadPublic" style="accent-color:#3b82f6">
          <span>上传后加入公开图库</span>
        </label>
      </div>
      <button class="btn-upload" id="uploadBtn" disabled>上传</button>
      <div class="progress" id="progress"><div class="progress-bar" id="progressBar"></div></div>
      <div class="progress-info" id="imgProgressInfo"><span class="pct" id="imgProgressPct">0%</span><span class="bytes" id="imgProgressBytes"></span><span class="bytes" id="imgProgressCount"></span></div>
      <div class="err" id="uploadErr"></div>
      <div class="result-list" id="resultList"></div>
    </div>

    <!-- My Gallery -->
    <div class="panel" id="panel-gallery-mine">
      <div class="page-header">
        <div class="page-header-text">
          <div class="page-title">我的图库</div>
          <div class="page-sub">管理你上传的所有图片</div>
        </div>
      </div>
      <div class="toolbar">
        <input class="search-input" id="mineSearch" type="text" placeholder="搜索文件名或标签…">
        <select class="search-input" id="mineVisFilter" style="width:auto;cursor:pointer">
          <option value="all">全部</option>
          <option value="public">仅公开</option>
          <option value="private">仅私密</option>
        </select>
        <select class="search-input" id="mineSort" style="width:auto;cursor:pointer">
          <option value="new">最新优先</option>
          <option value="old">最早优先</option>
          <option value="big">体积降序</option>
          <option value="name">名称排序</option>
        </select>
        <div class="spacer"></div>
        <button class="btn btn-ghost" id="mineSelectToggle">选择</button>
        <button class="btn btn-ghost" id="trashBtn">🗑 回收站</button>
        <button class="btn btn-ghost" id="refreshMine">刷新</button>
      </div>
      <div class="batch-bar" id="mineBatchBar" style="display:none">
        <label class="batch-check"><input type="checkbox" id="mineSelectAll"> 全选</label>
        <span class="batch-count" id="mineSelCount">已选 0</span>
        <div class="spacer"></div>
        <button class="btn btn-ghost" id="batchPublic">设为公开</button>
        <button class="btn btn-ghost" id="batchPrivate">设为私密</button>
        <button class="btn btn-danger" id="batchDelete">删除选中</button>
      </div>
      <div class="tag-filter-bar" id="mineTagFilter" style="display:none"></div>
      <div class="gallery-grid" id="mineGrid"></div>
      <div class="empty" id="mineEmpty" style="display:none">暂无图片，去上传吧</div>
    </div>

    <!-- Pages -->
    <div class="panel" id="panel-pages">
      <div class="page-header">
        <div class="page-header-text">
          <div class="page-title">我的页面</div>
          <div class="page-sub">托管的 Markdown / HTML 文档</div>
        </div>
        <button class="btn btn-ghost" id="newProjectBtn" style="padding:7px 10px;font-size:.78rem">+ 项目</button>
        <button class="btn btn-ghost" id="importPageBtn" style="padding:7px 10px;font-size:.78rem">导入 .md</button>
        <button class="btn btn-primary" id="newPageBtn" style="padding:7px 14px;font-size:.82rem">+ 新建页面</button>
      </div>
      <div class="toolbar">
        <input class="search-input" id="pageSearch" type="text" placeholder="搜索标题或 slug…">
        <select class="search-input" id="pageProjectFilter" style="width:auto;cursor:pointer">
          <option value="all">全部项目</option>
        </select>
        <div class="spacer"></div>
        <button class="btn btn-ghost" id="refreshPages" style="font-size:.78rem">刷新</button>
      </div>
      <div class="pages-tree" id="pagesTree"></div>
      <div class="empty" id="pagesEmpty" style="display:none">暂无页面</div>
    </div>

    <!-- Protos -->
    <div class="panel" id="panel-protos">
      <div class="page-header">
        <div class="page-header-text">
          <div class="page-title">我的原型</div>
          <div class="page-sub">AxureRP 等静态原型托管 · 支持版本管理与密码保护</div>
        </div>
        <button class="btn btn-ghost" id="refreshProtos" style="font-size:.8rem">刷新</button>
      </div>
      <!-- Upload section (collapsible) -->
      <div class="proto-upload-section">
        <div class="proto-upload-head" id="protoUploadToggle">
          <h3>上传原型</h3>
          <span class="toggle-icon open" id="protoUploadIcon">▾</span>
        </div>
        <div class="proto-upload-body" id="protoUploadBody">
          <div class="proto-upload-box" id="protoDropZone">
            <input type="file" id="protoFileInput" accept=".zip,application/zip,application/x-zip-compressed">
            <input type="file" id="protoFolderInput" webkitdirectory multiple style="display:none">
            <p style="color:var(--tx);font-size:.9rem;font-weight:500">点击选择 <strong>ZIP 文件</strong>，或拖拽文件夹到此处</p>
            <small style="display:block;margin-top:8px;color:var(--tx-3);font-size:.76rem">支持 AxureRP 导出目录（自动打包）或 ZIP 文件，最大 50 MB</small>
            <div style="display:flex;gap:8px;justify-content:center;margin-top:12px">
              <button type="button" onclick="event.stopPropagation();document.getElementById('protoFileInput').click()" style="padding:6px 14px;background:var(--bg-3);border:1px solid var(--bd-2);border-radius:6px;color:var(--tx-2);font-size:.78rem;cursor:pointer;font-family:var(--font);font-weight:500">选择 ZIP</button>
              <button type="button" onclick="event.stopPropagation();document.getElementById('protoFolderInput').click()" style="padding:6px 14px;background:var(--bg-3);border:1px solid var(--bd-2);border-radius:6px;color:var(--tx-2);font-size:.78rem;cursor:pointer;font-family:var(--font);font-weight:500">选择文件夹</button>
            </div>
          </div>
          <div class="proto-fields">
            <div class="field"><label>原型名称 <span style="color:var(--tx-3);font-weight:400;text-transform:none;letter-spacing:0">（可选）</span></label><input type="text" id="protoTitle" placeholder="留空自动命名" maxlength="100"></div>
            <div class="field field-pwd"><label>访问密码（可选）</label><input type="text" id="protoPassword" placeholder="最多 6 位字母数字" maxlength="6" autocomplete="off"></div>
          </div>
          <button class="btn-upload" id="protoUploadBtn" disabled>上传原型</button>
          <div class="progress" id="protoProgress"><div class="progress-bar" id="protoProgressBar"></div></div>
          <div class="progress-info" id="protoProgressInfo"><span class="pct" id="protoProgressPct">0%</span></div>
          <div id="protoStatusText" style="display:none;font-size:.78rem;color:var(--tx-2);margin-top:2px;margin-bottom:4px;min-height:1.2em"></div>
          <div class="err" id="protoErr"></div>
        </div>
      </div>

      <div style="background:var(--bg-3);border:1px solid var(--bd);border-radius:10px;overflow:hidden;box-shadow:0 1px 0 rgba(255,255,255,.02) inset">
        <table class="proto-table">
          <thead><tr>
            <th style="width:36px;color:#333">#</th><th>名称</th><th>文件数</th><th>大小</th><th>密码</th><th>版本</th><th>访问</th><th>上传时间</th><th>更新时间</th><th></th>
          </tr></thead>
          <tbody id="protoTableBody"><tr><td colspan="10" style="text-align:center;color:#333;padding:32px">加载中…</td></tr></tbody>
        </table>
      </div>
      <div class="empty" id="protoEmpty" style="display:none;margin-top:12px">暂无原型，请上传 ZIP 文件</div>
    </div>
  </main>
  <footer style="border-top:1px solid var(--bd);padding:14px 30px;display:flex;align-items:center;gap:10px;font-size:.75rem;color:var(--tx-3);flex-wrap:wrap;font-weight:500">
    <span>图片存储于</span>
    <span style="color:#f97316;font-weight:700">Cloudflare R2</span>
    <span style="color:var(--bd-2)">·</span>
    <span>10 GB 免费存储额度</span>
    <span style="color:var(--bd-2)">·</span>
    <span>无出口流量费用</span>
    <span style="color:var(--bd-2)">·</span>
    <span>全球 CDN 加速</span>
  </footer>
  </div>
</div>

<!-- Proto Edit Modal -->
<div class="modal-overlay" id="protoEditModal">
  <div class="modal" style="max-width:480px">
    <div class="modal-header">
      <h3 id="protoEditTitle">编辑原型</h3>
      <button class="modal-close" id="protoEditClose">✕</button>
    </div>
    <div class="modal-body">
      <div class="field"><label>名称</label><input type="text" id="peTitle" maxlength="100"></div>
      <div class="field">
        <label>访问密码（留空表示删除密码）</label>
        <input type="text" id="pePassword" placeholder="最多 6 位字母数字" maxlength="6" autocomplete="off">
      </div>
      <div class="field" id="peExpiryField">
        <label>密码有效期</label>
        <select id="peExpiry">
          <option value="14">14 天</option>
          <option value="30">30 天</option>
          <option value="90">90 天</option>
          <option value="0">永久</option>
        </select>
      </div>
      <div class="field">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="pePrivate"> 设为私有（禁止公开访问）
        </label>
      </div>
      <div class="err" id="peErr"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" id="protoEditCancel">取消</button>
      <button class="btn btn-primary" id="protoEditSave">保存</button>
    </div>
  </div>
</div>

<!-- Proto content update modal -->
<div class="modal-overlay" id="protoUpdateModal">
  <div class="modal" style="max-width:520px">
    <div class="modal-header">
      <h3>更新原型内容</h3>
      <button class="modal-close" id="protoUpdateClose">✕</button>
    </div>
    <div class="modal-body">
      <p style="font-size:.82rem;color:#555;margin-bottom:14px">上传新版本将替换现有内容，URL 保持不变，版本号自动递增。</p>
      <div class="proto-upload-box" id="puDropZone" style="padding:20px">
        <input type="file" id="puFileInput" accept=".zip,application/zip,application/x-zip-compressed" style="display:none">
        <input type="file" id="puFolderInput" webkitdirectory multiple style="display:none">
        <p id="puFileName">选择 ZIP 或文件夹</p>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:10px">
          <button type="button" onclick="event.stopPropagation();document.getElementById('puFileInput').click()" style="padding:5px 12px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:6px;color:#888;font-size:.78rem;cursor:pointer">选择 ZIP</button>
          <button type="button" onclick="event.stopPropagation();document.getElementById('puFolderInput').click()" style="padding:5px 12px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:6px;color:#888;font-size:.78rem;cursor:pointer">选择文件夹</button>
        </div>
      </div>
      <div class="progress" id="puProgress"><div class="progress-bar" id="puProgressBar"></div></div>
      <div class="progress-info" id="puProgressInfo"><span class="pct" id="puProgressPct">0%</span></div>
      <div id="puStatusText" style="display:none;font-size:.78rem;color:#7aabee;margin-top:2px;margin-bottom:4px;min-height:1.2em"></div>
      <div class="err" id="puErr"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" id="protoUpdateCancel">取消</button>
      <button class="btn btn-primary" id="protoUpdateUpload" disabled>上传新版本</button>
    </div>
  </div>
</div>

<!-- Change Password Modal -->
<div class="modal-overlay" id="changePwdModal">
  <div class="modal" style="max-width:380px">
    <div class="modal-header">
      <h3>修改密码</h3>
      <button class="modal-close" id="changePwdClose">✕</button>
    </div>
    <div class="modal-body">
      <div class="field"><label>当前密码</label><input type="password" id="cpCurrent" placeholder="当前密码" autocomplete="current-password"></div>
      <div class="field"><label>新密码</label><input type="password" id="cpNew" placeholder="至少 6 位" autocomplete="new-password"></div>
      <div class="field"><label>确认新密码</label><input type="password" id="cpConfirm" placeholder="再次输入新密码" autocomplete="new-password"></div>
      <div id="cpErr" style="color:#ef4444;font-size:.78rem;min-height:16px"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" id="changePwdCancel">取消</button>
      <button class="btn btn-primary" id="changePwdSave">确认修改</button>
    </div>
  </div>
</div>

<!-- Proto Version History & Diff Modal (user) -->
<div class="modal-overlay" id="userProtoVersionModal">
  <div class="modal" style="max-width:860px;width:95vw;max-height:85vh;height:85vh;display:flex;flex-direction:column">
    <div class="modal-header" style="flex-shrink:0">
      <h3>版本历史 <span style="font-size:.72rem;color:#555;font-weight:400" id="upvmTitle"></span></h3>
      <button class="modal-close" id="upvmClose">✕</button>
    </div>
    <div style="display:flex;flex:1;min-height:0">
      <div style="width:200px;flex-shrink:0;border-right:1px solid #1a1a1a;overflow-y:auto;padding:12px 10px;display:flex;flex-direction:column;gap:6px" id="upvmVersionList"></div>
      <div style="flex:1;display:flex;flex-direction:column;min-width:0">
        <div style="padding:10px 14px;border-bottom:1px solid #1a1a1a;display:flex;align-items:center;gap:8px;flex-shrink:0;flex-wrap:wrap">
          <span style="font-size:.78rem;color:#555" id="upvmMode">点击版本号查看文件列表，勾选两个版本进行对比</span>
          <div style="flex:1"></div>
          <input type="text" id="upvmSearch" placeholder="搜索文件…" style="padding:4px 8px;background:#111;border:1px solid #222;border-radius:6px;color:#ccc;font-size:.78rem;width:160px;outline:none">
          <button class="btn btn-ghost" id="upvmDiffBtn" style="padding:4px 10px;font-size:.78rem;display:none">对比选中版本</button>
        </div>
        <div style="flex:1;overflow-y:auto;padding:14px 16px" id="upvmContent">
          <div style="color:#333;text-align:center;padding:60px 0;font-size:.85rem">← 点击左侧版本号查看文件列表</div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Lightbox -->
<div class="lightbox" id="lightbox">
  <button class="lb-close" id="lbClose">✕</button>
  <button class="lb-nav lb-nav-prev" id="lbPrev">‹</button>
  <button class="lb-nav lb-nav-next" id="lbNext">›</button>
  <div class="lb-inner">
    <div class="lb-img-wrap"><img id="lbImg" src="" alt=""></div>
    <div class="lb-meta">
      <div class="lb-key" id="lbKey"></div>
      <div class="lb-actions">
        <button class="btn btn-ghost" id="lbCopy">复制链接</button>
        <button class="btn btn-ghost" id="lbMd">复制 MD</button>
        <button class="btn btn-ghost" id="lbBbcode">复制 BBCode</button>
        <div style="flex:1"></div>
        <button class="btn btn-danger" id="lbDelete" style="display:none">删除</button>
      </div>
    </div>
  </div>
</div>

<!-- Page Editor Modal -->
<div class="modal-overlay" id="pageModal">
  <div class="modal">
    <div class="modal-header">
      <h3 id="pageModalTitle">新建页面</h3>
      <button class="modal-close" id="pageModalClose">✕</button>
    </div>
    <div class="modal-body">
      <div class="field"><label>标题</label><input type="text" id="pmTitle" placeholder="My Page"></div>
      <div class="field">
        <label>自定义后缀（URL）</label>
        <input type="text" id="pmSlug" placeholder="my-blog-post  或  docs/intro">
        <span style="font-size:.72rem;color:#444;margin-top:4px">访问地址：<span id="pmSlugPreview" style="color:#3b82f6"></span></span>
      </div>
      <div class="field">
        <label>类型</label>
        <select id="pmType">
          <option value="markdown">Markdown</option>
          <option value="html">HTML</option>
        </select>
      </div>
      <div class="field" style="flex:1;min-height:0">
        <label id="pmContentLabel">内容</label>
        <div id="pmVditor" style="display:none"></div>
        <textarea id="pmContent" rows="12" placeholder="# Hello World\n\n写点什么…"></textarea>
      </div>
      <div class="field">
        <label>所属项目</label>
        <select id="pmProject">
          <option value="">-- 无 --</option>
        </select>
      </div>
      <div class="field">
        <label>所属分组</label>
        <select id="pmGroup">
          <option value="">-- 无 --</option>
        </select>
      </div>
      <div class="field">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="pmPublic" checked> 公开访问
        </label>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" id="pageModalCancel">取消</button>
      <button class="btn btn-primary" id="pageModalSave">创建</button>
    </div>
  </div>
</div>

<!-- Project Modal -->
<div class="modal-overlay" id="projectModal">
  <div class="modal" style="max-width:420px">
    <div class="modal-header">
      <h3 id="projModalTitle">新建项目</h3>
      <button class="modal-close" id="projModalClose">✕</button>
    </div>
    <div class="modal-body">
      <div class="field"><label>项目名称</label><input type="text" id="projName" placeholder="我的知识库" maxlength="64"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" id="projModalCancel">取消</button>
      <button class="btn btn-primary" id="projModalSave">创建</button>
    </div>
  </div>
</div>

<!-- Group Modal -->
<div class="modal-overlay" id="groupModal">
  <div class="modal" style="max-width:420px">
    <div class="modal-header">
      <h3 id="grpModalTitle">新建分组</h3>
      <button class="modal-close" id="grpModalClose">✕</button>
    </div>
    <div class="modal-body">
      <div class="field"><label>分组名称</label><input type="text" id="grpName" placeholder="入门指南" maxlength="64"></div>
      <input type="hidden" id="grpProjectId">
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" id="grpModalCancel">取消</button>
      <button class="btn btn-primary" id="grpModalSave">创建</button>
    </div>
  </div>
</div>

<!-- Import Markdown Modal -->
<div class="modal-overlay" id="importModal">
  <div class="modal" style="max-width:520px">
    <div class="modal-header">
      <h3>导入 Markdown 文件</h3>
      <button class="modal-close" id="importModalClose">✕</button>
    </div>
    <div class="modal-body">
      <div class="drop-zone" id="importDropZone" style="padding:28px;text-align:center;border:2px dashed var(--bd-2);border-radius:10px;cursor:pointer;transition:var(--t)">
        <input type="file" id="importFileInput" accept=".md,.markdown,text/markdown" style="display:none">
        <div style="font-size:1.4rem;margin-bottom:8px">📄</div>
        <div style="color:var(--tx-2);font-size:.84rem">点击或拖拽 .md 文件到此处</div>
        <div style="color:var(--tx-3);font-size:.72rem;margin-top:4px">支持 YAML frontmatter (title, slug, projectId, groupId, type, isPublic)</div>
      </div>
      <div id="importPreview" style="display:none">
        <div class="field"><label>标题</label><input type="text" id="importTitle"></div>
        <div class="field"><label>Slug</label><input type="text" id="importSlug"></div>
        <div class="field">
          <label>类型</label>
          <select id="importType"><option value="markdown">Markdown</option><option value="html">HTML</option></select>
        </div>
        <div class="field">
          <label>所属项目</label>
          <select id="importProject"><option value="">-- 无 --</option></select>
        </div>
        <div class="field">
          <label>所属分组</label>
          <select id="importGroup"><option value="">-- 无 --</option></select>
        </div>
        <div class="field">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" id="importPublic" checked> 公开访问
          </label>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" id="importModalCancel">取消</button>
      <button class="btn btn-primary" id="importModalSave" disabled>导入</button>
    </div>
  </div>
</div>

<!-- Tag Editor Modal -->
<div class="modal-overlay" id="tagModal">
  <div class="modal" style="max-width:420px">
    <div class="modal-header">
      <h3>编辑标签 <span id="tagModalTarget" style="font-size:.72rem;color:var(--tx-3);font-weight:400"></span></h3>
      <button class="modal-close" id="tagModalClose">✕</button>
    </div>
    <div class="modal-body">
      <div class="tag-edit-list" id="tagEditList"></div>
      <div class="field">
        <label>添加标签（回车确认，最多 10 个）</label>
        <input type="text" id="tagInput" placeholder="输入标签后按回车" maxlength="24" autocomplete="off">
      </div>
      <div class="err" id="tagErr"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" id="tagModalCancel">取消</button>
      <button class="btn btn-primary" id="tagModalSave">保存</button>
    </div>
  </div>
</div>

<!-- Trash / Recycle Bin Modal -->
<div class="modal-overlay" id="trashModal">
  <div class="modal" style="max-width:760px;width:92vw;max-height:86vh;display:flex;flex-direction:column">
    <div class="modal-header">
      <h3>回收站 <span style="font-size:.72rem;color:var(--tx-3);font-weight:400">删除项保留 30 天，到期自动清除</span></h3>
      <button class="modal-close" id="trashClose">✕</button>
    </div>
    <div class="modal-body" id="trashBody" style="min-height:200px"><div class="empty">加载中…</div></div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
  function _fflate() {
    // Lazy-execute the inlined fflate bundle on first use (zip/unzip).
    // Inline <script> exec is CSP-allowed (unsafe-inline); avoids parsing 32KB on every page load.
    if (!window.fflate) {
      const src = document.getElementById('fflateSrc');
      if (src && src.textContent) {
        const s = document.createElement('script');
        s.textContent = src.textContent;
        document.head.appendChild(s); // executes synchronously on append
      }
    }
    if (!window.fflate) throw new Error('压缩库未加载，请刷新页面后重试');
    return window.fflate;
  }

  // ── Off-main-thread unzip（Web Worker，避免大 ZIP 解压冻结 UI）──────────────
  let _pw = null, _pwSeq = 0; const _pwCbs = {};
  function _protoWorker() {
    if (_pw) return _pw;
    const fsrc = document.getElementById('fflateSrc');
    const ftext = fsrc ? fsrc.textContent : '';
    if (!ftext) throw new Error('压缩库未加载');
    // Worker：内联 fflate UMD + 消息处理（解压在工作线程同步执行，不阻塞主线程）
    const handler = "\\nself.onmessage=function(e){var d=e.data,id=d.id;try{if(d.op==='unzip'){var raw=self.fflate.unzipSync(new Uint8Array(d.buf));var files={},transfer=[];for(var k in raw){files[k]=raw[k];transfer.push(raw[k].buffer);}self.postMessage({id:id,ok:true,files:files},transfer);}}catch(err){self.postMessage({id:id,ok:false,error:String(err&&err.message||err)});}};";
    const blob = new Blob([ftext + handler], { type: 'application/javascript' });
    _pw = new Worker(URL.createObjectURL(blob));
    _pw.onmessage = (e) => {
      const cb = _pwCbs[e.data.id]; if (!cb) return; delete _pwCbs[e.data.id];
      if (e.data.ok) cb.res(e.data); else cb.rej(new Error(e.data.error || 'worker 解压失败'));
    };
    return _pw;
  }
  // 用 Worker 解压；失败则回退主线程同步解压（重新读取 File，避免 buffer 已转移）
  async function _unzipBytes(bytes, zipFile) {
    try {
      const w = _protoWorker();
      const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      return await new Promise((res, rej) => {
        const id = ++_pwSeq;
        _pwCbs[id] = { res: (d) => res(d.files), rej };
        w.postMessage({ id, op: 'unzip', buf }, [buf]);
      });
    } catch (e) {
      const fb = zipFile ? new Uint8Array(await zipFile.arrayBuffer()) : bytes;
      return _fflate().unzipSync(fb);
    }
  }
  const TOKEN_KEY = 'onimg_token', PERM_KEY = 'onimg_perms', USER_KEY = 'onimg_user', ADMIN_KEY = 'onimg_is_admin';
  let token = localStorage.getItem(TOKEN_KEY);
  let perms = JSON.parse(localStorage.getItem(PERM_KEY) || 'null');
  let username = localStorage.getItem(USER_KEY);
  let isAdminUser = localStorage.getItem(ADMIN_KEY) === '1';
  let mineItems = [], lbKey = null, editingSlug = null, userPages = [], userProjects = [], userGroups = [], vditorInst = null, userProtos = [];
  let mineSelectMode = false; const mineSelected = new Set();
  const mineTagFilter = new Set();
  let lbList = [], lbIdx = -1;

  // Validate stored token hasn't expired
  (function() {
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[0]));
      if (payload.exp && Date.now() > payload.exp * 1000) {
        localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(PERM_KEY);
        localStorage.removeItem(USER_KEY); localStorage.removeItem(ADMIN_KEY);
        token = null; perms = null; username = null; isAdminUser = false;
      }
    } catch {}
  })();

  function authH() { return { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }; }

  // ── Vditor editor management ──────────────────────────────────────────────
  function getContent() {
    return vditorInst ? vditorInst.getValue() : document.getElementById('pmContent').value;
  }

  // Lazily inject Vditor CSS+JS the first time the editor is opened
  let vditorLoading = null;
  function ensureVditor() {
    if (window.Vditor) return Promise.resolve(true);
    if (vditorLoading) return vditorLoading;
    vditorLoading = new Promise(resolve => {
      if (!document.getElementById('vditorCss')) {
        const l = document.createElement('link');
        l.id = 'vditorCss'; l.rel = 'stylesheet';
        l.href = 'https://cdn.jsdelivr.net/npm/vditor/dist/index.css';
        document.head.appendChild(l);
      }
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/vditor/dist/index.min.js';
      s.onload = () => resolve(true);
      s.onerror = () => { vditorLoading = null; resolve(false); };
      document.body.appendChild(s);
    });
    return vditorLoading;
  }

  async function initVditor(content) {
    const ok = await ensureVditor();
    if (!ok || !window.Vditor) {
      const ta = document.getElementById('pmContent');
      ta.value = content || ''; ta.style.display = '';
      return;
    }
    if (vditorInst) { vditorInst.setValue(content || ''); return; }

    const box = document.getElementById('pmVditor');
    box.style.display = 'block';
    document.getElementById('pmContent').style.display = 'none';

    const editorH = Math.min(520, Math.max(320, window.innerHeight - 460));
    vditorInst = new Vditor('pmVditor', {
      height: editorH,
      mode: 'ir',        // inline rendering — single column, no split
      // default (light) theme avoids dark-on-dark contrast issues
      lang: 'zh_CN',
      cdn: 'https://cdn.jsdelivr.net/npm/vditor',
      cache: { enable: false },
      value: content || '',
      outline: { enable: false },
      preview: { show: false },
      toolbar: [
        'headings', 'bold', 'italic', 'strike', '|',
        'list', 'ordered-list', 'check', 'quote', '|',
        'code', 'inline-code', 'link', 'table', 'upload', '|',
        'undo', 'redo', 'fullscreen',
      ],
      toolbarConfig: { pin: false },
      upload: {
        url: '/upload',
        fieldName: 'file',
        headers: token ? { Authorization: 'Bearer ' + token } : {},
        accept: 'image/*',
        format: (files, responseText) => {
          try {
            const data = JSON.parse(responseText);
            if (data.url) {
              return JSON.stringify({
                code: 0, msg: '',
                data: { errFiles: [], succMap: { [files[0]?.name || 'image']: data.url } },
              });
            }
          } catch {}
          return JSON.stringify({ code: -1, msg: '上传失败' });
        },
      },
      after() {
        // Force Vditor to recalculate content-area height after modal is painted
        window.dispatchEvent(new Event('resize'));
        vditorInst.focus();

        // Stop wheel bubbling to modal-body when editor still has room to scroll
        const box = document.getElementById('pmVditor');
        box.addEventListener('wheel', function(e) {
          const scroller = box.querySelector('.vditor-content');
          if (!scroller) return;
          const atTop    = scroller.scrollTop === 0 && e.deltaY < 0;
          const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1 && e.deltaY > 0;
          if (!atTop && !atBottom) e.stopPropagation();
        }, { passive: true });
      },
    });
  }

  function destroyVditor() {
    if (vditorInst) { vditorInst.destroy(); vditorInst = null; }
    const box = document.getElementById('pmVditor');
    if (box) { box.style.display = 'none'; box.innerHTML = ''; }
    document.getElementById('pmContent').style.display = '';
  }

  function switchEditorToType(type, keepContent) {
    if (type === 'markdown') {
      initVditor(keepContent);
    } else {
      const prev = vditorInst ? vditorInst.getValue() : keepContent;
      destroyVditor();
      document.getElementById('pmContent').value = prev || keepContent || '';
    }
  }

  // Boot
  updateUserArea();
  loadPublicGallery();
  if (token) loadQuota();

  function buildPermBadges() {
    if (!perms) return '';
    if (isAdminUser) return '<span class="ud-perm perm-admin">超级管理员</span>';
    const badges = [];
    badges.push(perms.canUpload
      ? '<span class="ud-perm perm-on">允许上传</span>'
      : '<span class="ud-perm perm-off">禁止上传</span>');
    if (perms.canDelete) badges.push('<span class="ud-perm perm-on">允许删除</span>');
    if (perms.canEdit)   badges.push('<span class="ud-perm perm-on">允许编辑</span>');
    const dl = perms.dailyUploadLimit  === -1 ? '∞' : perms.dailyUploadLimit;
    const tl = perms.maxTotalUploads   === -1 ? '∞' : perms.maxTotalUploads;
    badges.push(\`<span class="ud-perm perm-off" style="color:#555">每日 \${dl}</span>\`);
    badges.push(\`<span class="ud-perm perm-off" style="color:#555">总量 \${tl}</span>\`);
    return badges.join('');
  }

  function updateUserArea() {
    const el = document.getElementById('userArea');
    if (token) {
      el.innerHTML = \`
        <div class="user-chip" id="userChip">
          <div class="dot-green"></div>
          <span>\${username}</span>
          <span class="caret">▾</span>
        </div>
        <div class="user-dropdown" id="userDropdown">
          <div class="ud-header">
            <div class="ud-name">\${username}</div>
            <div class="ud-role">\${isAdminUser ? '管理员' : '普通用户'}</div>
          </div>
          <div class="ud-perms">\${buildPermBadges()}</div>
          \${!isAdminUser ? '<button class="ud-action" id="changePwdBtn">🔑 修改密码</button>' : ''}
          <button class="ud-action danger" id="logoutBtn">退出登录</button>
        </div>\`;
      document.getElementById('userChip').addEventListener('click', toggleUserMenu);
      document.getElementById('logoutBtn').addEventListener('click', logout);
      if (!isAdminUser) {
        document.getElementById('changePwdBtn').addEventListener('click', () => {
          document.getElementById('userDropdown').classList.remove('show');
          document.getElementById('userChip').classList.remove('open');
          document.getElementById('changePwdModal').classList.add('show');
          document.getElementById('cpCurrent').value = '';
          document.getElementById('cpNew').value = '';
          document.getElementById('cpConfirm').value = '';
          document.getElementById('cpErr').textContent = '';
        });
      }
      document.getElementById('uploadBtn').disabled = !(perms?.canUpload ?? true);
    } else {
      el.innerHTML = \`<button class="btn-sm" id="loginTrigger">登录</button>\`;
      document.getElementById('loginTrigger').addEventListener('click', openLoginOverlay);
      document.getElementById('uploadBtn').disabled = true;
    }
    document.getElementById('footerAdmin').innerHTML = isAdminUser
      ? \`<a href="/admin" class="sidebar-link"><span class="nav-icon">⚙</span><span>Admin Panel</span><span style="margin-left:auto;color:var(--tx-3);font-size:.7rem">↗</span></a>\`
      : '';
  }

  function toggleUserMenu() {
    const chip = document.getElementById('userChip');
    const drop = document.getElementById('userDropdown');
    if (!chip || !drop) return;
    const open = drop.classList.toggle('show');
    chip.classList.toggle('open', open);
  }

  document.addEventListener('click', e => {
    const area = document.getElementById('userArea');
    if (area && !area.contains(e.target)) {
      const drop = document.getElementById('userDropdown');
      const chip = document.getElementById('userChip');
      if (drop) drop.classList.remove('show');
      if (chip) chip.classList.remove('open');
    }
  });

  function logout() {
    if (!confirm('确认退出登录？')) return;
    localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(PERM_KEY); localStorage.removeItem(USER_KEY); localStorage.removeItem(ADMIN_KEY);
    token = null; perms = null; username = null; isAdminUser = false;
    updateUserArea();
    document.getElementById('mineGrid').innerHTML = '';
    document.getElementById('pagesTree').innerHTML = '';
    document.getElementById('protoTableBody').innerHTML = '<tr><td colspan="10" style="text-align:center;color:#333;padding:32px">加载中…</td></tr>';
    userProtos = [];
    toast('已退出登录');
  }

  // Login
  const LOGIN_ERR_MAP = {
    'Invalid credentials': '账号或密码错误',
    'Missing credentials': '请填写账号和密码',
  };
  function friendlyLoginErr(msg) { return LOGIN_ERR_MAP[msg] || msg || '登录失败，请稍后重试'; }

  function openLoginOverlay() {
    document.getElementById('loginOverlay').style.display = 'flex';
    setTimeout(() => document.getElementById('lu').focus(), 80);
  }

  document.getElementById('loginOverlayClose').addEventListener('click', () => { document.getElementById('loginOverlay').style.display = 'none'; });

  document.getElementById('lpToggle').addEventListener('click', () => {
    const inp = document.getElementById('lp');
    const tog = document.getElementById('lpToggle');
    if (inp.type === 'password') { inp.type = 'text'; tog.textContent = '🙈'; } else { inp.type = 'password'; tog.textContent = '👁'; }
  });

  document.getElementById('lu').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('lp').focus(); });
  document.getElementById('lp').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('doLogin').click(); });

  document.getElementById('doLogin').addEventListener('click', async () => {
    const u = document.getElementById('lu').value.trim(), p = document.getElementById('lp').value;
    const err = document.getElementById('loginErr');
    const card = document.querySelector('#loginOverlay .login-card');
    const btn = document.getElementById('doLogin');
    if (!u || !p) {
      err.textContent = '请填写账号和密码';
      card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
      card.addEventListener('animationend', () => card.classList.remove('shake'), { once: true });
      return;
    }
    btn.classList.add('loading'); btn.textContent = '登录中…'; err.textContent = '';
    try {
      const res = await fetch('/auth/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({username:u,password:p}) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      token = data.token; perms = data.permissions; username = data.username; isAdminUser = !!data.isAdmin;
      localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(PERM_KEY, JSON.stringify(perms)); localStorage.setItem(USER_KEY, username);
      if (isAdminUser) localStorage.setItem(ADMIN_KEY, '1'); else localStorage.removeItem(ADMIN_KEY);
      document.getElementById('loginOverlay').style.display = 'none';
      updateUserArea(); loadQuota();
      toast('登录成功，欢迎回来 ' + data.username + '！');
    } catch(e) {
      err.textContent = friendlyLoginErr(e.message);
      card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
      card.addEventListener('animationend', () => card.classList.remove('shake'), { once: true });
    }
    btn.classList.remove('loading'); btn.textContent = '登录';
    document.getElementById('doLogin').disabled = false;
  });

  // Tabs (sidebar nav)
  function activateTab(name) {
    const t = document.querySelector('.tab[data-tab="' + name + '"]');
    if (!t) return;
    if (!token && ['upload','gallery-mine','pages','protos'].includes(name)) {
      openLoginOverlay(); return;
    }
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    document.getElementById('panel-' + name).classList.add('active');
    if (name === 'gallery-mine') loadMineGallery();
    if (name === 'pages') loadPages();
    if (name === 'protos') loadProtos();
    // Auto-close mobile sidebar on selection
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarMask').classList.remove('show');
  }
  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', (e) => {
      // Ripple effect
      const r = document.createElement('span');
      r.className = 'nav-ripple';
      const rect = t.getBoundingClientRect();
      r.style.left = (e.clientX - rect.left) + 'px';
      r.style.top  = (e.clientY - rect.top)  + 'px';
      t.appendChild(r);
      r.addEventListener('animationend', () => r.remove());
      activateTab(t.dataset.tab);
    });
  });

  // Mobile sidebar toggle
  document.getElementById('mobHamburger').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarMask').classList.toggle('show');
  });
  document.getElementById('sidebarMask').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarMask').classList.remove('show');
  });

  // ── Public gallery ──
  async function loadPublicGallery() {
    const grid = document.getElementById('pubGrid');
    if (!grid.children.length) skelCards(grid, 10);
    const res = await fetch('/api/gallery');
    if (!res.ok) { if (grid.querySelector('.skel-card')) grid.innerHTML = ''; return; }
    const { items } = await res.json();
    document.getElementById('pubEmpty').style.display = items.length ? 'none' : 'block';
    document.getElementById('pubGrid').innerHTML = items.map(item =>
      \`<div class="pub-item" onclick="openLb('\${item.key}', false, 'pub')">
        <img src="\${location.origin}/\${item.key}" loading="lazy" onload="this.classList.add('loaded')">
        <div class="pub-item-info">@\${item.owner || '—'}</div>
      </div>\`
    ).join('');
  }
  document.getElementById('refreshPub').addEventListener('click', loadPublicGallery);

  // ── Upload ──
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  let pendingFiles = [];
  dropZone.addEventListener('click', () => { if (!token) { openLoginOverlay(); return; } fileInput.click(); });
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('over'));
  dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('over'); setFiles([...e.dataTransfer.files].filter(f=>f.type.startsWith('image/'))); });
  fileInput.addEventListener('change', () => setFiles([...fileInput.files]));
  function setFiles(files) {
    pendingFiles = files;
    dropZone.querySelector('p').textContent = files.length ? files.map(f=>f.name).join(', ') : '点击或拖拽图片到此处';
    document.getElementById('uploadBtn').disabled = !files.length || !token;
  }

  // Paste-to-upload: capture screenshots from clipboard (Ctrl/Cmd+V)
  document.addEventListener('paste', e => {
    // Don't hijack paste inside text fields or the Vditor editor
    const ae = document.activeElement;
    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return;
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    const imgs = [];
    for (const it of items) {
      if (it.kind === 'file' && it.type.startsWith('image/')) {
        const f = it.getAsFile();
        if (f) {
          // Clipboard screenshots are often unnamed → synthesize a name
          const ext = (f.type.split('/')[1] || 'png').replace('jpeg','jpg').replace('svg+xml','svg');
          imgs.push(f.name ? f : new File([f], 'pasted-' + Date.now() + '.' + ext, { type: f.type }));
        }
      }
    }
    if (!imgs.length) return;
    e.preventDefault();
    if (!token) { openLoginOverlay(); return; }
    activateTab('upload');
    setFiles([...pendingFiles, ...imgs]);
    toast('已粘贴 ' + imgs.length + ' 张图片，点击上传', 'success');
  });
  // Upload a single file; resolves to a result object (failures keep the File ref for retry)
  const uploadFailMap = new Map(); let uploadFidSeq = 0;
  function uploadOne(file, makePublic, onProgress) {
    return new Promise(resolve => {
      const fd = new FormData(); fd.append('file', file);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/upload');
      xhr.setRequestHeader('Authorization', 'Bearer ' + token);
      if (onProgress) xhr.upload.addEventListener('progress', e => { if (e.lengthComputable) onProgress(e.loaded, e.total); });
      xhr.addEventListener('load', async () => {
        let data = {};
        try { data = JSON.parse(xhr.responseText); } catch {}
        if (xhr.status >= 400) { resolve({ ok: false, name: file.name, error: data.error || '上传失败', file }); return; }
        if (makePublic && data.key) {
          await fetch('/api/image/' + encodeURIComponent(data.key) + '/visibility', { method: 'PATCH', headers: { Authorization: 'Bearer ' + token } }).catch(() => {});
        }
        resolve({ ok: true, url: data.url, key: data.key, name: file.name });
      });
      xhr.addEventListener('error', () => resolve({ ok: false, name: file.name, error: '网络错误', file }));
      xhr.send(fd);
    });
  }

  function resultItemHtml(r) {
    if (r.ok) {
      return \`<div class="result-item"><img src="\${r.url}" loading="lazy"><div class="info"><div class="name">\${esc(r.name)}</div><div class="url-row"><input class="url-input" value="\${r.url}" readonly onclick="this.select()"><button class="btn btn-ghost" onclick="cp('\${r.url}',this)" style="padding:3px 8px">复制</button><button class="btn btn-ghost" onclick="cp('![](\${r.url})',this)" style="padding:3px 8px">MD</button><button class="btn btn-ghost" onclick="cp('[img]\${r.url}[/img]',this)" style="padding:3px 8px">BB</button></div></div></div>\`;
    }
    const fid = 'f' + (++uploadFidSeq);
    if (r.file) uploadFailMap.set(fid, r.file);
    const retryBtn = r.file ? \`<button class="btn btn-ghost" onclick="retryUpload('\${fid}', this)" style="padding:3px 10px;flex-shrink:0">重试</button>\` : '';
    return \`<div class="result-item" data-fid="\${fid}"><div class="info"><div class="name" style="color:#ef4444">❌ \${esc(r.name)}: \${esc(r.error)}</div></div>\${retryBtn}</div>\`;
  }
  window.retryUpload = async function (fid, btn) {
    const file = uploadFailMap.get(fid); if (!file) return;
    btn.disabled = true; btn.textContent = '重试中…';
    const makePublic = document.getElementById('uploadPublic').checked;
    const r = await uploadOne(file, makePublic);
    const item = btn.closest('.result-item');
    if (r.ok) {
      uploadFailMap.delete(fid);
      if (item) item.outerHTML = resultItemHtml(r);
      loadQuota();
      toast('重试成功', 'success');
    } else {
      btn.disabled = false; btn.textContent = '重试';
      toast('重试失败: ' + r.error, 'error');
    }
  };

  document.getElementById('uploadBtn').addEventListener('click', async () => {
    if (!token || !pendingFiles.length) return;
    document.getElementById('uploadBtn').disabled = true;
    document.getElementById('resultList').innerHTML = '';
    document.getElementById('uploadErr').textContent = '';
    const prog    = document.getElementById('progress');        prog.classList.add('show');
    const bar     = document.getElementById('progressBar');     bar.style.width = '0%';
    const info    = document.getElementById('imgProgressInfo'); info.classList.add('show');
    const pctEl   = document.getElementById('imgProgressPct');
    const bytesEl = document.getElementById('imgProgressBytes');
    const cntEl   = document.getElementById('imgProgressCount');
    const makePublic = document.getElementById('uploadPublic').checked;
    const total = pendingFiles.length;
    const results = [];

    for (let i = 0; i < total; i++) {
      const file = pendingFiles[i];
      cntEl.textContent = \`\${i + 1} / \${total} 张\`;
      const result = await uploadOne(file, makePublic, (loaded, totalBytes) => {
        const overallPct = Math.round(((i + loaded / totalBytes) / total) * 100);
        bar.style.width   = overallPct + '%';
        pctEl.textContent = overallPct + '%';
        bytesEl.textContent = fmtSize(loaded) + ' / ' + fmtSize(totalBytes);
      });
      results.push(result);
    }

    bar.style.width = '100%'; pctEl.textContent = '100%';
    setTimeout(() => { prog.classList.remove('show'); bar.style.width = '0%'; info.classList.remove('show'); }, 700);
    document.getElementById('uploadBtn').disabled = false;
    setFiles([]);
    loadQuota();
    document.getElementById('resultList').innerHTML = results.map(resultItemHtml).join('');
  });

  async function loadQuota() {
    if (!token) return;
    document.getElementById('quotaBar').style.display = 'flex';
    try {
      const r = await fetch('/auth/quota', { headers: { Authorization: 'Bearer ' + token } });
      if (!r.ok) return;
      const { total, daily } = await r.json();
      document.getElementById('qDaily').textContent = daily;
      document.getElementById('qTotal').textContent = total;
      const limits = [];
      if (perms?.dailyUploadLimit !== -1) limits.push(\`每日限\${perms?.dailyUploadLimit}张\`);
      if (perms?.maxTotalUploads   !== -1) limits.push(\`总限\${perms?.maxTotalUploads}张\`);
      document.getElementById('qLimits').textContent = limits.join(' · ');
    } catch {}
  }

  // ── My Gallery ──
  async function loadMineGallery() {
    if (!token) return;
    if (!mineItems.length) skelCards(document.getElementById('mineGrid'), 8);
    const res = await fetch('/list', { headers: { Authorization: 'Bearer ' + token } });
    if (res.status === 401) { logout(); return; }
    const { items } = await res.json();
    mineItems = items;
    renderMineGallery();
  }
  document.getElementById('mineSearch').addEventListener('input', renderMineGallery);
  document.getElementById('mineVisFilter').addEventListener('change', renderMineGallery);
  document.getElementById('mineSort').addEventListener('change', renderMineGallery);
  document.getElementById('refreshMine').addEventListener('click', loadMineGallery);

  // 所有图片用到的标签集合（用于筛选栏）
  function allMineTags() {
    const set = new Set();
    mineItems.forEach(i => (i.tags || []).forEach(t => set.add(t)));
    return [...set].sort((a, b) => a.localeCompare(b, 'zh'));
  }
  function renderTagFilterBar() {
    const bar = document.getElementById('mineTagFilter');
    if (!bar) return;
    const tags = allMineTags();
    // 剔除已不存在的标签筛选（对应图片被删除/改标签后避免列表永远为空且无法清除）
    [...mineTagFilter].forEach(t => { if (!tags.includes(t)) mineTagFilter.delete(t); });
    if (!tags.length) { bar.style.display = 'none'; bar.innerHTML = ''; return; }
    bar.style.display = 'flex';
    bar.innerHTML = '<span class="tag-filter-label">标签</span>' +
      tags.map(t => \`<button class="tag-filter\${mineTagFilter.has(t)?' active':''}" onclick="toggleTagFilter('\${esc(t)}')">\${esc(t)}</button>\`).join('') +
      (mineTagFilter.size ? '<button class="tag-filter" onclick="clearTagFilter()" style="color:var(--red)">清除</button>' : '');
  }
  window.toggleTagFilter = function(tag) {
    if (mineTagFilter.has(tag)) mineTagFilter.delete(tag); else mineTagFilter.add(tag);
    renderMineGallery();
  };
  window.clearTagFilter = function() { mineTagFilter.clear(); renderMineGallery(); };

  function mineFiltered() {
    const q = document.getElementById('mineSearch').value.toLowerCase();
    const vis = document.getElementById('mineVisFilter')?.value || 'all';
    const sort = document.getElementById('mineSort')?.value || 'new';
    const out = mineItems.filter(i => {
      if (q && !i.key.toLowerCase().includes(q) && !(i.tags || []).some(t => t.toLowerCase().includes(q))) return false;
      // 标签筛选：AND 语义（须包含全部选中标签）
      if (mineTagFilter.size && ![...mineTagFilter].every(t => (i.tags || []).includes(t))) return false;
      if (vis === 'public'  && !i.isPublic) return false;
      if (vis === 'private' &&  i.isPublic) return false;
      return true;
    });
    // 排序（不改动 mineItems 原始顺序）
    const sorted = [...out];
    if (sort === 'new')       sorted.sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0));
    else if (sort === 'old')  sorted.sort((a, b) => (a.uploadedAt || 0) - (b.uploadedAt || 0));
    else if (sort === 'big')  sorted.sort((a, b) => (b.size || 0) - (a.size || 0));
    else if (sort === 'name') sorted.sort((a, b) => a.key.localeCompare(b.key));
    return sorted;
  }

  function renderMineGallery() {
    renderTagFilterBar();
    const items = mineFiltered();
    document.getElementById('mineEmpty').style.display = items.length ? 'none' : 'block';
    const grid = document.getElementById('mineGrid');
    grid.classList.toggle('selecting', mineSelectMode);
    grid.innerHTML = items.map(item => {
      const url = location.origin + '/' + item.key;
      const sel = mineSelected.has(item.key);
      const clickAttr = mineSelectMode ? \`onclick="toggleSel('\${item.key}')"\` : \`onclick="openLb('\${item.key}', true, 'mine')"\`;
      const tags = item.tags || [];
      const tagsHtml = tags.length ? \`<div class="gitem-tags">\${tags.map(t => \`<span class="tag-chip">\${esc(t)}</span>\`).join('')}</div>\` : '';
      return \`<div class="gitem\${sel?' selected':''}" data-key="\${item.key}">
        <input type="checkbox" class="gitem-sel" \${sel?'checked':''} onchange="toggleSel('\${item.key}')">
        <img src="\${url}" loading="lazy" onload="this.classList.add('loaded')" \${clickAttr}>
        <div class="gitem-info">
          <div class="gitem-key">\${item.key}</div>
          \${tagsHtml}
          <div class="gitem-row">
            <button class="\${item.isPublic?'btn-public':'btn-private'}" id="vis-\${item.key}" onclick="toggleVis('\${item.key}', this)">\${item.isPublic?'公开':'私密'}</button>
            <span style="font-size:.68rem;color:#444">\${fmtSize(item.size)}</span>
          </div>
          <div class="gitem-actions">
            <button class="btn btn-ghost" onclick="cp('\${url}',this)" style="padding:3px 8px">复制</button>
            <button class="btn btn-ghost" onclick="openTagEditor('\${item.key}')" style="padding:3px 8px">标签</button>
            \${perms?.canDelete?\`<button class="btn btn-danger" onclick="delMine('\${item.key}')" style="padding:3px 8px">删除</button>\`:''}
          </div>
        </div>
      </div>\`;
    }).join('');
    updateBatchUI();
  }

  // ── Batch selection ──
  function toggleSel(key) {
    if (mineSelected.has(key)) mineSelected.delete(key); else mineSelected.add(key);
    const card = document.querySelector('.gitem[data-key="' + key + '"]');
    if (card) {
      card.classList.toggle('selected', mineSelected.has(key));
      const cb = card.querySelector('.gitem-sel'); if (cb) cb.checked = mineSelected.has(key);
    }
    updateBatchUI();
  }
  window.toggleSel = toggleSel;

  function visibleMineKeys() {
    return mineFiltered().map(i => i.key);
  }
  function updateBatchUI() {
    document.getElementById('mineSelCount').textContent = '已选 ' + mineSelected.size;
    const vis = visibleMineKeys();
    const allSel = vis.length > 0 && vis.every(k => mineSelected.has(k));
    const sa = document.getElementById('mineSelectAll'); if (sa) sa.checked = allSel;
  }
  document.getElementById('mineSelectToggle').addEventListener('click', () => {
    mineSelectMode = !mineSelectMode;
    if (!mineSelectMode) mineSelected.clear();
    document.getElementById('mineBatchBar').style.display = mineSelectMode ? 'flex' : 'none';
    document.getElementById('mineSelectToggle').textContent = mineSelectMode ? '退出选择' : '选择';
    document.getElementById('mineSelectToggle').classList.toggle('btn-primary', mineSelectMode);
    renderMineGallery();
  });
  document.getElementById('mineSelectAll').addEventListener('change', e => {
    const vis = visibleMineKeys();
    if (e.target.checked) vis.forEach(k => mineSelected.add(k));
    else vis.forEach(k => mineSelected.delete(k));
    renderMineGallery();
  });

  // Run async tasks with a concurrency cap
  async function runPool(items, limit, worker) {
    const queue = [...items]; let ok = 0, fail = 0;
    async function next() {
      while (queue.length) {
        const it = queue.shift();
        try { await worker(it); ok++; } catch { fail++; }
      }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, next));
    return { ok, fail };
  }

  document.getElementById('batchDelete').addEventListener('click', async () => {
    const keys = [...mineSelected];
    if (!keys.length) { toast('未选择图片'); return; }
    if (!confirm('确认将选中的 ' + keys.length + ' 张图片移至回收站？可在回收站恢复。')) return;
    toast('处理中…');
    const { ok, fail } = await runPool(keys, 6, async key => {
      const r = await fetch('/delete/' + key, { method:'DELETE', headers:{ Authorization:'Bearer '+token } });
      if (!r.ok) throw new Error();
      mineItems = mineItems.filter(i => i.key !== key);
      mineSelected.delete(key);
    });
    renderMineGallery();
    toast('已移至回收站 ' + ok + ' 张' + (fail ? '，' + fail + ' 张失败' : ''), fail ? 'warn' : 'success');
  });

  async function batchSetVisibility(makePublic) {
    const keys = [...mineSelected].filter(k => {
      const it = mineItems.find(i => i.key === k);
      return it && it.isPublic !== makePublic; // only flip those that differ
    });
    if (!keys.length) { toast('选中图片已是目标状态'); return; }
    toast('处理中…');
    const { ok, fail } = await runPool(keys, 6, async key => {
      const r = await fetch('/api/image/' + encodeURIComponent(key) + '/visibility', { method:'PATCH', headers:{ Authorization:'Bearer '+token } });
      if (!r.ok) throw new Error();
      const { isPublic } = await r.json();
      const idx = mineItems.findIndex(i => i.key === key);
      if (idx !== -1) mineItems[idx].isPublic = isPublic;
    });
    renderMineGallery();
    loadPublicGallery();
    toast('已更新 ' + ok + ' 张' + (fail ? '，' + fail + ' 张失败' : ''), fail ? 'warn' : 'success');
  }
  document.getElementById('batchPublic').addEventListener('click', () => batchSetVisibility(true));
  document.getElementById('batchPrivate').addEventListener('click', () => batchSetVisibility(false));

  async function toggleVis(key, btn) {
    const res = await fetch('/api/image/' + encodeURIComponent(key) + '/visibility', { method:'PATCH', headers:{ Authorization:'Bearer '+token } });
    if (!res.ok) { toast('操作失败'); return; }
    const { isPublic } = await res.json();
    const idx = mineItems.findIndex(i => i.key === key);
    if (idx !== -1) mineItems[idx].isPublic = isPublic;
    btn.className = isPublic ? 'btn-public' : 'btn-private';
    btn.textContent = isPublic ? '公开' : '私密';
    toast(isPublic ? '已设为公开' : '已设为私密');
    loadPublicGallery(); // refresh public gallery
  }

  async function delMine(key) {
    if (!confirm('将此图片移至回收站？可在回收站恢复。')) return;
    await fetch('/delete/' + key, { method:'DELETE', headers:{ Authorization:'Bearer '+token } });
    mineItems = mineItems.filter(i => i.key !== key);
    renderMineGallery();
    document.getElementById('lightbox').classList.remove('show');
    toast('已移至回收站');
  }

  // ── Trash / Recycle Bin ──
  let trashData = null;
  function openTrash() {
    if (!token) { openLoginOverlay(); return; }
    document.getElementById('trashModal').classList.add('show');
    loadTrash();
  }
  async function loadTrash() {
    const body = document.getElementById('trashBody');
    body.innerHTML = '<div class="empty">加载中…</div>';
    try {
      const res = await fetch('/api/trash', { headers: { Authorization: 'Bearer ' + token } });
      if (!res.ok) { body.innerHTML = '<div class="empty">加载失败</div>'; return; }
      trashData = await res.json();
      renderTrash();
    } catch { body.innerHTML = '<div class="empty">加载失败</div>'; }
  }
  function trashDaysLeft(deletedAt, days) {
    const left = Math.ceil((deletedAt + days * 86400000 - Date.now()) / 86400000);
    return left > 0 ? left + ' 天后清除' : '即将清除';
  }
  function renderTrash() {
    const body = document.getElementById('trashBody');
    const { images = [], protos = [], retentionDays = 30 } = trashData || {};
    if (!images.length && !protos.length) { body.innerHTML = '<div class="empty">回收站为空</div>'; return; }
    let html = '';
    if (images.length) {
      html += '<div style="font-size:.72rem;font-weight:700;color:var(--tx-2);text-transform:uppercase;letter-spacing:.1em;margin:4px 0 10px">图片 (' + images.length + ')</div>';
      html += '<div class="gallery-grid" style="margin-bottom:18px">' + images.map(it => {
        const url = location.origin + '/' + it.key;
        return '<div class="gitem"><img src="' + url + '" loading="lazy" onload="this.classList.add(\\'loaded\\')">' +
          '<div class="gitem-info"><div class="gitem-key">' + esc(it.key) + '</div>' +
          '<div style="font-size:.66rem;color:var(--tx-3);margin-top:3px">' + trashDaysLeft(it.deletedAt, retentionDays) + '</div>' +
          '<div class="gitem-actions"><button class="btn btn-ghost" onclick="restoreTrash(\\'image\\',\\'' + encodeURIComponent(it.key) + '\\')" style="padding:3px 8px">恢复</button>' +
          '<button class="btn btn-danger" onclick="purgeTrash(\\'image\\',\\'' + encodeURIComponent(it.key) + '\\')" style="padding:3px 8px">彻底删除</button></div></div></div>';
      }).join('') + '</div>';
    }
    if (protos.length) {
      html += '<div style="font-size:.72rem;font-weight:700;color:var(--tx-2);text-transform:uppercase;letter-spacing:.1em;margin:4px 0 10px">原型 (' + protos.length + ')</div>';
      html += '<div class="pages-list">' + protos.map(p =>
        '<div class="page-item"><div class="page-item-info"><div class="page-title">' + esc(p.title || p.protoId) + '</div>' +
        '<div class="page-meta">' + (p.fileCount ?? '—') + ' 文件 · ' + fmtSize(p.totalSize || 0) + ' · ' + trashDaysLeft(p.deletedAt, retentionDays) + '</div></div>' +
        '<button class="btn btn-ghost" onclick="restoreTrash(\\'proto\\',\\'' + esc(p.protoId) + '\\')">恢复</button>' +
        '<button class="btn btn-danger" onclick="purgeTrash(\\'proto\\',\\'' + esc(p.protoId) + '\\')">彻底删除</button></div>'
      ).join('') + '</div>';
    }
    body.innerHTML = html;
  }
  window.restoreTrash = async function(type, id) {
    const payload = type === 'image' ? { type, key: decodeURIComponent(id) } : { type, protoId: id };
    const res = await fetch('/api/trash/restore', { method:'POST', headers: authH(), body: JSON.stringify(payload) });
    if (!res.ok) { toast('恢复失败'); return; }
    toast('已恢复');
    if (type === 'image') loadMineGallery(); else loadProtos(true);
    loadTrash();
  };
  window.purgeTrash = async function(type, id) {
    if (!confirm('彻底删除后无法恢复，确定？')) return;
    const payload = type === 'image' ? { type, key: decodeURIComponent(id) } : { type, protoId: id };
    const res = await fetch('/api/trash/purge', { method:'DELETE', headers: authH(), body: JSON.stringify(payload) });
    if (!res.ok) { toast('删除失败'); return; }
    toast('已彻底删除');
    loadTrash();
  };
  document.getElementById('trashBtn').addEventListener('click', openTrash);
  document.getElementById('trashClose').addEventListener('click', () => document.getElementById('trashModal').classList.remove('show'));
  document.getElementById('trashModal').addEventListener('click', e => { if (e.target === document.getElementById('trashModal')) document.getElementById('trashModal').classList.remove('show'); });

  // ── Tag editor (images + protos) ──
  let tagTarget = null;   // { type:'image'|'proto', id }
  let tagDraft = [];
  function renderTagEditList() {
    document.getElementById('tagEditList').innerHTML = tagDraft.length
      ? tagDraft.map((t, i) => \`<span class="tag-edit-item">\${esc(t)}<button onclick="removeTagDraft(\${i})" title="移除">×</button></span>\`).join('')
      : '<span style="color:var(--tx-3);font-size:.76rem">暂无标签</span>';
  }
  window.removeTagDraft = function(i) { tagDraft.splice(i, 1); renderTagEditList(); };
  function addTagDraft(raw) {
    const t = String(raw || '').trim().slice(0, 24);
    if (!t) return;
    if (tagDraft.length >= 10) { document.getElementById('tagErr').textContent = '最多 10 个标签'; return; }
    if (tagDraft.some(x => x.toLowerCase() === t.toLowerCase())) { document.getElementById('tagErr').textContent = '标签已存在'; return; }
    tagDraft.push(t); document.getElementById('tagErr').textContent = ''; renderTagEditList();
  }
  window.openTagEditor = function(key) {
    const it = mineItems.find(i => i.key === key);
    tagTarget = { type: 'image', id: key };
    tagDraft = [...((it && it.tags) || [])];
    document.getElementById('tagModalTarget').textContent = key;
    document.getElementById('tagInput').value = '';
    document.getElementById('tagErr').textContent = '';
    renderTagEditList();
    document.getElementById('tagModal').classList.add('show');
    setTimeout(() => document.getElementById('tagInput').focus(), 60);
  };
  window.openProtoTagEditor = function(protoId) {
    const p = userProtos.find(x => x.protoId === protoId);
    tagTarget = { type: 'proto', id: protoId };
    tagDraft = [...((p && p.tags) || [])];
    document.getElementById('tagModalTarget').textContent = (p && p.title) || protoId;
    document.getElementById('tagInput').value = '';
    document.getElementById('tagErr').textContent = '';
    renderTagEditList();
    document.getElementById('tagModal').classList.add('show');
    setTimeout(() => document.getElementById('tagInput').focus(), 60);
  };
  document.getElementById('tagInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); addTagDraft(e.target.value); e.target.value = ''; }
  });
  function closeTagModal() { document.getElementById('tagModal').classList.remove('show'); }
  ['tagModalClose','tagModalCancel'].forEach(id => document.getElementById(id).addEventListener('click', closeTagModal));
  document.getElementById('tagModal').addEventListener('click', e => { if (e.target === document.getElementById('tagModal')) closeTagModal(); });
  document.getElementById('tagModalSave').addEventListener('click', async () => {
    if (!tagTarget) return;
    // 把输入框里未回车的内容也并入
    const pending = document.getElementById('tagInput').value.trim();
    if (pending) addTagDraft(pending);
    const btn = document.getElementById('tagModalSave');
    btn.disabled = true; btn.textContent = '保存中…';
    try {
      let res;
      if (tagTarget.type === 'image') {
        res = await fetch('/api/image/' + encodeURIComponent(tagTarget.id) + '/tags', {
          method: 'PATCH', headers: authH(), body: JSON.stringify({ tags: tagDraft }),
        });
      } else {
        res = await fetch('/api/protos/' + encodeURIComponent(tagTarget.id), {
          method: 'PATCH', headers: authH(), body: JSON.stringify({ tags: tagDraft }),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { document.getElementById('tagErr').textContent = data.error || '保存失败'; return; }
      const saved = data.tags || tagDraft;
      if (tagTarget.type === 'image') {
        const it = mineItems.find(i => i.key === tagTarget.id);
        if (it) it.tags = saved;
        renderMineGallery();
      } else {
        const p = userProtos.find(x => x.protoId === tagTarget.id);
        if (p) p.tags = saved;
        renderProtos();
      }
      closeTagModal();
      toast('标签已保存');
    } finally {
      btn.disabled = false; btn.textContent = '保存';
    }
  });

  // ── Pages ──
  function renderPageTree() {
    const q = (document.getElementById('pageSearch')?.value || '').toLowerCase();
    const projFilter = document.getElementById('pageProjectFilter')?.value || 'all';
    const pages = userPages.filter(p => {
      if (q && !p.title.toLowerCase().includes(q) && !p.slug.toLowerCase().includes(q)) return false;
      if (projFilter === '_none_') return !p.projectId;
      if (projFilter !== 'all') return p.projectId === projFilter;
      return true;
    });
    const projects = [...userProjects].sort((a,b) => (a.sort??0) - (b.sort??0));
    const groups = [...userGroups].sort((a,b) => (a.sort??0) - (b.sort??0));
    const projMap = Object.fromEntries(projects.map(p => [p.id, p]));
    const grpMap = Object.fromEntries(groups.map(g => [g.id, g]));

    document.getElementById('pagesEmpty').style.display = pages.length || projects.length ? 'none' : 'block';
    let html = '';

    // projects
    for (const proj of projects) {
      if (projFilter !== 'all' && projFilter !== proj.id) continue;
      const projGroups = groups.filter(g => g.projectId === proj.id);
      const projPages = pages.filter(p => p.projectId === proj.id && !p.groupId).sort((a,b) => (a.sort??0) - (b.sort??0));
      const total = pages.filter(p => p.projectId === proj.id).length;
      html += \`<div class="page-project" data-drag-type="project" data-drag-id="\${esc(proj.id)}">
        <div class="page-project-header" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none';this.querySelector('.expand-icon').classList.toggle('open')">
          <span class="expand-icon open">▶</span>
          <span class="project-name">\${esc(proj.name)}</span>
          <span class="count-badge">\${total}</span>
          <span class="proj-actions">
            <button class="proj-act-btn" onclick="event.stopPropagation();editProject('\${esc(proj.id)}')" title="编辑项目">编辑</button>
            <button class="proj-act-btn" onclick="event.stopPropagation();createGroupInProject('\${esc(proj.id)}')" title="新建分组">+ 分组</button>
            <button class="proj-act-btn" onclick="event.stopPropagation();deleteProject('\${esc(proj.id)}')" title="删除项目" style="color:var(--red)">删除</button>
          </span>
        </div>
        <div class="page-project-body">\`;
      // groups
      for (const grp of projGroups) {
        const grpPages = pages.filter(p => p.groupId === grp.id).sort((a,b) => (a.sort??0) - (b.sort??0));
        html += \`<div class="page-group" data-drag-type="group" data-drag-id="\${esc(grp.id)}" data-project-id="\${esc(proj.id)}">
          <div class="page-group-header" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none';this.querySelector('.expand-icon').classList.toggle('open')">
            <span class="expand-icon open" style="font-size:.55rem">▶</span>
            <span class="group-name">\${esc(grp.name)}</span>
            <span class="count-badge">\${grpPages.length}</span>
            <span class="grp-actions">
              <button class="grp-act-btn" onclick="event.stopPropagation();editGroup('\${esc(grp.id)}')" title="编辑分组">编辑</button>
              <button class="grp-act-btn" onclick="event.stopPropagation();deleteGroup('\${esc(grp.id)}')" title="删除分组" style="color:var(--red)">删除</button>
            </span>
          </div>
          <div class="page-group-body page-tree-docs">\`;
        for (const p of grpPages) html += renderDocItem(p);
        html += \`</div></div>\`;
      }
      // pages directly under project (no group) — rendered directly, same drop container as group items
      for (const p of projPages) html += renderDocItem(p);
      html += \`</div></div>\`;
    }

    // uncategorized pages
    const uncat = pages.filter(p => !p.projectId).sort((a,b) => (a.sort??0) - (b.sort??0));
    if (uncat.length) {
      html += \`<div class="pages-uncategorized"><div class="uncat-label">未分类</div>\`;
      for (const p of uncat) html += renderDocItem(p);
      html += \`</div>\`;
    }

    document.getElementById('pagesTree').innerHTML = html;
    updateProjectFilter(projects);
    initPageDnD();
  }

  function renderDocItem(p) {
    return \`<div class="page-tree-item" draggable="true" data-drag-type="page" data-drag-id="\${esc(p.slug)}" data-project-id="\${esc(p.projectId||'')}" data-group-id="\${esc(p.groupId||'')}">
      <span class="drag-handle" title="拖拽排序">⠿</span>
      <div class="page-item-info" style="flex:1;min-width:0">
        <div class="page-title">\${esc(p.title)} <span class="type-badge type-\${p.type==='markdown'?'md':'html'}">\${p.type}</span></div>
        <div class="page-meta">\${p.isPublic?'公开':'私密'} · /p/\${esc(p.slug)}</div>
      </div>
      <a href="/p/\${p.slug}" target="_blank" class="btn btn-ghost" style="font-size:.72rem">预览</a>
      <button class="btn btn-ghost" onclick="editPageBySlug('\${esc(p.slug)}')" style="font-size:.72rem">编辑</button>
      <button class="btn btn-danger" onclick="deletePage('\${esc(p.slug)}')" style="font-size:.72rem">删除</button>
    </div>\`;
  }

  function updateProjectFilter(projects) {
    const sel = document.getElementById('pageProjectFilter');
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="all">全部项目</option><option value="_none_">未分类</option>' +
      projects.map(p => '<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join('');
    sel.value = cur;
  }

  function updatePageProjectSelect(selEl, selectedId) {
    if (!selEl) return;
    selEl.innerHTML = '<option value="">-- 无 --</option>' +
      userProjects.map(p => '<option value="'+esc(p.id)+'"'+(p.id===selectedId?' selected':'')+'>'+esc(p.name)+'</option>').join('');
  }

  function updatePageGroupSelect(selEl, projectId, selectedGroupId) {
    if (!selEl) return;
    const grps = userGroups.filter(g => g.projectId === projectId);
    selEl.innerHTML = '<option value="">-- 无 --</option>' +
      grps.map(g => '<option value="'+esc(g.id)+'"'+(g.id===selectedGroupId?' selected':'')+'>'+g.name+'</option>').join('');
  }

  async function loadPages() {
    if (!token) return;
    if (!userPages.length) document.getElementById('pagesTree').innerHTML = '';
    const res = await fetch('/api/pages', { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) return;
    const data = await res.json();
    userPages = data.pages || [];
    userProjects = data.projects || [];
    userGroups = data.groups || [];
    renderPageTree();
  }

  // 与后端 SLUG_RE 保持一致：首字符不可为 / ，整体仅允许 字母/数字/- _ / ，最长 120
  function slugInvalidReason(s) {
    if (!s) return '请填写后缀';
    if (s.length > 120) return '后缀过长（最多 120 字符）';
    if (s.charAt(0) === '/') return '后缀不能以 / 开头';
    if (!new RegExp('^[a-zA-Z0-9_-][a-zA-Z0-9_/-]*$').test(s)) return '后缀只能用字母、数字、- _ /，不能含中文或空格';
    return '';
  }
  function setSlugSaveState(disabled) {
    const b = document.getElementById('pageModalSave');
    b.disabled = disabled;
    b.style.opacity = disabled ? '0.5' : '';
    b.style.cursor = disabled ? 'not-allowed' : '';
  }

  document.getElementById('pmSlug').addEventListener('input', () => {
    const el = document.getElementById('pmSlug');
    const s = el.value.trim();
    const prev = document.getElementById('pmSlugPreview');
    const reason = s ? slugInvalidReason(s) : '';
    if (reason) {
      el.style.borderColor = 'var(--red)';
      prev.style.color = 'var(--red)';
      prev.textContent = reason;
    } else {
      el.style.borderColor = '';
      prev.style.color = '#3b82f6';
      prev.textContent = s ? location.origin + '/p/' + s : '';
    }
    setSlugSaveState(!!reason);
  });

  document.getElementById('pmType').addEventListener('change', () => {
    switchEditorToType(document.getElementById('pmType').value, getContent());
  });

  document.getElementById('newPageBtn').addEventListener('click', () => {
    editingSlug = null;
    destroyVditor();
    document.getElementById('pageModalTitle').textContent = '新建页面';
    document.getElementById('pmTitle').value = '';
    const slugEl = document.getElementById('pmSlug');
    slugEl.value = '';
    slugEl.readOnly = false;
    slugEl.style.opacity = '';
    slugEl.style.borderColor = '';
    const prevEl = document.getElementById('pmSlugPreview');
    prevEl.style.color = '#3b82f6';
    prevEl.textContent = '';
    setSlugSaveState(false);
    document.getElementById('pmType').value = 'markdown';
    document.getElementById('pmContent').value = '';
    document.getElementById('pmPublic').checked = true;
    updatePageProjectSelect(document.getElementById('pmProject'), '');
    updatePageGroupSelect(document.getElementById('pmGroup'), '', '');
    document.getElementById('pageModalSave').textContent = '创建';
    document.getElementById('pageModal').classList.add('show');
    setTimeout(() => initVditor(''), 50);
  });

  document.getElementById('pmProject').addEventListener('change', () => {
    const pid = document.getElementById('pmProject').value;
    updatePageGroupSelect(document.getElementById('pmGroup'), pid, '');
  });

  function editPageBySlug(slug) {
    const p = userPages.find(x => x.slug === slug);
    if (!p) return;
    editingSlug = p.slug;
    destroyVditor();
    document.getElementById('pageModalTitle').textContent = '编辑页面';
    document.getElementById('pmTitle').value = p.title || '';
    const slugEl = document.getElementById('pmSlug');
    slugEl.value = p.slug;
    slugEl.readOnly = true;
    slugEl.style.opacity = '0.5';
    slugEl.style.borderColor = '';
    const prevEl = document.getElementById('pmSlugPreview');
    prevEl.style.color = '#3b82f6';
    prevEl.textContent = location.origin + '/p/' + p.slug;
    setSlugSaveState(false);
    document.getElementById('pmType').value = p.type;
    document.getElementById('pmContent').value = p.content || '';
    document.getElementById('pmPublic').checked = p.isPublic !== false;
    updatePageProjectSelect(document.getElementById('pmProject'), p.projectId || '');
    updatePageGroupSelect(document.getElementById('pmGroup'), p.projectId || '', p.groupId || '');
    document.getElementById('pageModalSave').textContent = '保存';
    document.getElementById('pageModal').classList.add('show');
    setTimeout(() => switchEditorToType(p.type, p.content || ''), 50);
  }

  // keep editPage(idx) as alias for backward compat with inline onclick
  function editPage(idx) { if (userPages[idx]) editPageBySlug(userPages[idx].slug); }

  document.getElementById('pageModalSave').addEventListener('click', async () => {
    const isEdit = !!editingSlug;
    const slug    = isEdit ? editingSlug : document.getElementById('pmSlug').value.trim();
    const title   = document.getElementById('pmTitle').value.trim();
    const type    = document.getElementById('pmType').value;
    const content = getContent();
    const isPublic = document.getElementById('pmPublic').checked;
    const projectId = document.getElementById('pmProject')?.value || null;
    const groupId = document.getElementById('pmGroup')?.value || null;
    if (!slug) { toast('请填写后缀'); return; }
    if (!isEdit) {
      const reason = slugInvalidReason(slug);
      if (reason) { toast(reason); document.getElementById('pmSlug').focus(); return; }
    }
    if (!content) { toast('内容不能为空'); return; }

    const url  = isEdit ? '/api/pages/' + encodeURIComponent(editingSlug) : '/api/pages';
    const meth = isEdit ? 'PATCH' : 'POST';
    const body = isEdit ? { title, content, type, isPublic, projectId, groupId } : { slug, title, content, type, isPublic, projectId, groupId };

    const res = await fetch(url, { method: meth, headers: authH(), body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 409) { toast('后缀已被占用，请换一个'); return; }
      toast('失败: ' + data.error); return;
    }

    destroyVditor();
    document.getElementById('pageModal').classList.remove('show');
    toast(isEdit ? '已保存' : '页面已创建');
    loadPages();
  });

  async function deletePage(slug) {
    if (!confirm('确认删除页面 /p/' + slug + '？')) return;
    await fetch('/api/pages/' + encodeURIComponent(slug), { method:'DELETE', headers:{ Authorization:'Bearer '+token } });
    toast('已删除'); loadPages();
  }

  function closePageModal() {
    document.getElementById('pageModal').classList.remove('show');
    destroyVditor();
  }
  ['pageModalClose','pageModalCancel'].forEach(id =>
    document.getElementById(id).addEventListener('click', closePageModal)
  );

  // ── Project CRUD ──
  let editingProjectId = null;

  document.getElementById('newProjectBtn').addEventListener('click', () => {
    editingProjectId = null;
    document.getElementById('projModalTitle').textContent = '新建项目';
    document.getElementById('projName').value = '';
    document.getElementById('projModalSave').textContent = '创建';
    document.getElementById('projectModal').classList.add('show');
  });

  window.editProject = function(id) {
    const proj = userProjects.find(p => p.id === id);
    if (!proj) return;
    editingProjectId = id;
    document.getElementById('projModalTitle').textContent = '编辑项目';
    document.getElementById('projName').value = proj.name;
    document.getElementById('projModalSave').textContent = '保存';
    document.getElementById('projectModal').classList.add('show');
  };

  document.getElementById('projModalSave').addEventListener('click', async () => {
    const name = document.getElementById('projName').value.trim();
    if (!name) { toast('请输入项目名称'); return; }
    const isEdit = !!editingProjectId;
    const url = isEdit ? '/api/projects/' + encodeURIComponent(editingProjectId) : '/api/projects';
    const meth = isEdit ? 'PATCH' : 'POST';
    const res = await fetch(url, { method: meth, headers: authH(), body: JSON.stringify({ name }) });
    if (!res.ok) { toast('失败'); return; }
    document.getElementById('projectModal').classList.remove('show');
    toast(isEdit ? '项目已更新' : '项目已创建');
    loadPages();
  });

  window.deleteProject = async function(id) {
    const proj = userProjects.find(p => p.id === id);
    if (!proj) return;
    if (!confirm('确认删除项目「' + proj.name + '」？其下所有文档将变为未分类')) return;
    await fetch('/api/projects/' + encodeURIComponent(id), { method: 'DELETE', headers: authH() });
    toast('项目已删除'); loadPages();
  };

  ['projModalClose','projModalCancel'].forEach(id =>
    document.getElementById(id)?.addEventListener('click', () => document.getElementById('projectModal').classList.remove('show'))
  );

  // ── Group CRUD ──
  let editingGroupId = null;

  window.createGroupInProject = function(projectId) {
    editingGroupId = null;
    document.getElementById('grpModalTitle').textContent = '新建分组';
    document.getElementById('grpName').value = '';
    document.getElementById('grpProjectId').value = projectId;
    document.getElementById('grpModalSave').textContent = '创建';
    document.getElementById('groupModal').classList.add('show');
  };

  window.editGroup = function(id) {
    const grp = userGroups.find(g => g.id === id);
    if (!grp) return;
    editingGroupId = id;
    document.getElementById('grpModalTitle').textContent = '编辑分组';
    document.getElementById('grpName').value = grp.name;
    document.getElementById('grpProjectId').value = grp.projectId;
    document.getElementById('grpModalSave').textContent = '保存';
    document.getElementById('groupModal').classList.add('show');
  };

  document.getElementById('grpModalSave').addEventListener('click', async () => {
    const name = document.getElementById('grpName').value.trim();
    const projectId = document.getElementById('grpProjectId').value;
    if (!name) { toast('请输入分组名称'); return; }
    const isEdit = !!editingGroupId;
    const url = isEdit ? '/api/groups/' + encodeURIComponent(editingGroupId) : '/api/groups';
    const meth = isEdit ? 'PATCH' : 'POST';
    const body = isEdit ? { name } : { projectId, name };
    const res = await fetch(url, { method: meth, headers: authH(), body: JSON.stringify(body) });
    if (!res.ok) { toast('失败'); return; }
    document.getElementById('groupModal').classList.remove('show');
    toast(isEdit ? '分组已更新' : '分组已创建');
    loadPages();
  });

  window.deleteGroup = async function(id) {
    const grp = userGroups.find(g => g.id === id);
    if (!grp) return;
    if (!confirm('确认删除分组「' + grp.name + '」？其下文档将移至项目根')) return;
    await fetch('/api/groups/' + encodeURIComponent(id), { method: 'DELETE', headers: authH() });
    toast('分组已删除'); loadPages();
  };

  ['grpModalClose','grpModalCancel'].forEach(id =>
    document.getElementById(id)?.addEventListener('click', () => document.getElementById('groupModal').classList.remove('show'))
  );

  // ── Import ──
  let importFile = null, importMd = '';

  document.getElementById('importPageBtn').addEventListener('click', () => {
    importFile = null; importMd = '';
    document.getElementById('importDropZone').style.display = '';
    document.getElementById('importPreview').style.display = 'none';
    document.getElementById('importModalSave').disabled = true;
    document.getElementById('importModal').classList.add('show');
  });

  document.getElementById('importDropZone').addEventListener('click', () => {
    document.getElementById('importFileInput').click();
  });

  document.getElementById('importFileInput').addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (f) processImportFile(f);
  });

  document.getElementById('importDropZone').addEventListener('dragover', (e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)'; });
  document.getElementById('importDropZone').addEventListener('dragleave', (e) => { e.currentTarget.style.borderColor = ''; });
  document.getElementById('importDropZone').addEventListener('drop', (e) => {
    e.preventDefault(); e.currentTarget.style.borderColor = '';
    const f = e.dataTransfer.files[0];
    if (f) processImportFile(f);
  });

  function processImportFile(file) {
    importFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      importMd = e.target.result;
      const { metadata, content } = parseFrontmatter(importMd);
      document.getElementById('importTitle').value = metadata.title || file.name.replace(/\\.(md|markdown)$/i, '');
      document.getElementById('importSlug').value = metadata.slug || generateSlugFromFile(file.name);
      document.getElementById('importType').value = metadata.type || 'markdown';
      document.getElementById('importPublic').checked = metadata.isPublic !== false;
      updatePageProjectSelect(document.getElementById('importProject'), metadata.projectId || '');
      updatePageGroupSelect(document.getElementById('importGroup'), metadata.projectId || '', metadata.groupId || '');
      document.getElementById('importDropZone').style.display = 'none';
      document.getElementById('importPreview').style.display = '';
      document.getElementById('importModalSave').disabled = false;
    };
    reader.readAsText(file);
  }

  function parseFrontmatter(text) {
    const match = text.match(/^---\\r?\\n([\\s\\S]*?)\\r?\\n---\\r?\\n?/);
    if (!match) return { metadata: {}, content: text };
    const yaml = match[1];
    const content = text.slice(match[0].length);
    const metadata = {};
    for (const line of yaml.split('\\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      if (key === 'isPublic') metadata[key] = val === 'true';
      else metadata[key] = val;
    }
    return { metadata, content };
  }

  function generateSlugFromFile(filename) {
    return filename.replace(/\\.(md|markdown)$/i, '').replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 120) || 'imported-' + Date.now();
  }

  document.getElementById('importProject')?.addEventListener('change', () => {
    const pid = document.getElementById('importProject').value;
    updatePageGroupSelect(document.getElementById('importGroup'), pid, '');
  });

  document.getElementById('importModalSave').addEventListener('click', async () => {
    if (!importFile || !importMd) return;
    const fd = new FormData();
    fd.append('file', importFile);
    const title = document.getElementById('importTitle').value.trim();
    const slug = document.getElementById('importSlug').value.trim();
    const type = document.getElementById('importType').value;
    const isPublic = document.getElementById('importPublic').checked ? 'true' : 'false';
    const pid = document.getElementById('importProject')?.value || '';
    const gid = document.getElementById('importGroup')?.value || '';
    fd.append('title', title);
    fd.append('slug', slug);
    fd.append('type', type);
    fd.append('isPublic', isPublic);
    if (pid) fd.append('projectId', pid);
    if (gid) fd.append('groupId', gid);

    const res = await fetch('/api/pages/import', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: fd });
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast('导入失败: ' + (d.error || '')); return; }
    document.getElementById('importModal').classList.remove('show');
    toast('页面已导入');
    loadPages();
  });

  ['importModalClose','importModalCancel'].forEach(id =>
    document.getElementById(id)?.addEventListener('click', () => document.getElementById('importModal').classList.remove('show'))
  );

  // ── Pages search/filter ──
  document.getElementById('pageSearch')?.addEventListener('input', renderPageTree);
  document.getElementById('pageProjectFilter')?.addEventListener('change', renderPageTree);
  document.getElementById('refreshPages')?.addEventListener('click', loadPages);

  // ── Page Drag and Drop ──
  let dragState = null;

  function initPageDnD() {
    document.querySelectorAll('.page-tree-item[draggable="true"]').forEach(el => {
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragend', onDragEnd);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragleave', onDragLeave);
    });
  }

  function onDragStart(e) {
    // prevent drag from buttons/links
    if (e.target.closest('button, a, input, select, textarea')) { e.preventDefault(); return; }
    const el = e.currentTarget;
    dragState = { type: el.dataset.dragType, id: el.dataset.dragId, el };
    el.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', el.dataset.dragId);
  }
  function onDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.drag-over-top,.drag-over-bot,.drag-over-proj,.drag-over-grp').forEach(el => {
      el.classList.remove('drag-over-top','drag-over-bot','drag-over-proj','drag-over-grp');
    });
    dragState = null;
  }
  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = e.currentTarget;
    if (!dragState || target === dragState.el) return;
    const rect = target.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    target.classList.remove('drag-over-top','drag-over-bot');
    target.classList.add(e.clientY < midY ? 'drag-over-top' : 'drag-over-bot');
  }
  function onDragLeave(e) {
    e.currentTarget.classList.remove('drag-over-top','drag-over-bot');
  }
  async function onDrop(e) {
    e.preventDefault();
    const target = e.currentTarget;
    target.classList.remove('drag-over-top','drag-over-bot');
    if (!dragState || target === dragState.el) return;

    // page reorder within same group
    if (dragState.type === 'page' && target.dataset.dragType === 'page') {
      const targetGroupId = target.dataset.groupId || '';
      const srcGroupId = dragState.el.dataset.groupId || '';
      if (targetGroupId === srcGroupId) {
        // same group/project-level: reorder
        // Find all page items in the same group (including those inside sub-containers)
        const container = target.closest('.page-group-body, .page-project-body');
        const allItems = container ? [...container.querySelectorAll('.page-tree-item')] : [];
        // Filter to same groupId only
        const sameGroupItems = allItems.filter(el => (el.dataset.groupId || '') === targetGroupId);
        const slugs = sameGroupItems.map(el => el.dataset.dragId);
        const oldIdx = slugs.indexOf(dragState.id);
        const newIdx = slugs.indexOf(target.dataset.dragId);
        if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
          // optimistic DOM reorder
          const refNode = oldIdx < newIdx ? sameGroupItems[newIdx].nextSibling : sameGroupItems[newIdx];
          sameGroupItems[newIdx].parentElement.insertBefore(dragState.el, refNode);
          const newOrder = sameGroupItems.map(el => el.dataset.dragId);
          // update indices: remove old position, insert at new position
          newOrder.splice(oldIdx, 1);
          newOrder.splice(newIdx > oldIdx ? newIdx - 1 : newIdx, 0, dragState.id);
          await fetch('/api/pages/reorder', { method: 'PATCH', headers: authH(), body: JSON.stringify({ groupId: targetGroupId || null, order: newOrder }) });
        }
      } else {
        // move to different group
        const newProjectId = target.dataset.projectId || null;
        const newGroupId = targetGroupId || null;
        await fetch('/api/pages/' + encodeURIComponent(dragState.id), { method: 'PATCH', headers: authH(), body: JSON.stringify({ projectId: newProjectId, groupId: newGroupId }) });
      }
      loadPages();
    }
  }

  // ── Lightbox ──
  function openLb(key, showDelete, context) {
    lbKey = key;
    if (context === 'mine') {
      lbList = mineFiltered().map(i => ({ key: i.key, showDelete }));
    } else if (context === 'pub') {
      lbList = Array.from(document.querySelectorAll('#pubGrid .pub-item img')).map(img => ({
        key: img.src.replace(location.origin + '/', ''), showDelete: false,
      }));
    } else {
      lbList = [{ key, showDelete }];
    }
    lbIdx = lbList.findIndex(i => i.key === key);
    _showLb(key, showDelete);
  }
  function _showLb(key, showDelete) {
    lbKey = key;
    document.getElementById('lbImg').src = location.origin + '/' + key;
    document.getElementById('lbKey').textContent = key;
    document.getElementById('lbDelete').style.display = (showDelete && perms?.canDelete) ? 'block' : 'none';
    const lb = document.getElementById('lightbox');
    lb.classList.add('show');
    // Show/hide nav arrows
    document.getElementById('lbPrev').style.visibility = lbIdx > 0 ? 'visible' : 'hidden';
    document.getElementById('lbNext').style.visibility = lbIdx < lbList.length - 1 ? 'visible' : 'hidden';
  }
  function lbNavigate(dir) {
    const newIdx = lbIdx + dir;
    if (newIdx < 0 || newIdx >= lbList.length) return;
    lbIdx = newIdx;
    const { key, showDelete } = lbList[lbIdx];
    _showLb(key, showDelete);
  }
  document.getElementById('lbClose').addEventListener('click', () => document.getElementById('lightbox').classList.remove('show'));
  document.getElementById('lightbox').addEventListener('click', e => { if (e.target === document.getElementById('lightbox')) document.getElementById('lightbox').classList.remove('show'); });
  document.getElementById('lbCopy').addEventListener('click', () => { cp(location.origin + '/' + lbKey); toast('已复制'); });
  document.getElementById('lbMd').addEventListener('click',   () => { cp('![](' + location.origin + '/' + lbKey + ')'); toast('已复制 MD'); });
  document.getElementById('lbPrev').addEventListener('click', () => lbNavigate(-1));
  document.getElementById('lbNext').addEventListener('click', () => lbNavigate(1));
  document.getElementById('lbBbcode').addEventListener('click', () => { cp('[img]' + location.origin + '/' + lbKey + '[/img]'); toast('已复制 BBCode'); });
  document.getElementById('lbDelete').addEventListener('click', () => delMine(lbKey));

  // ── Protos ──
  const protoDropZone = document.getElementById('protoDropZone');
  const protoFileInput = document.getElementById('protoFileInput');
  let pendingProtoFile = null;
  let pendingProtoFolderFiles = null;

  protoDropZone.addEventListener('click', () => {
    if (!token) { document.getElementById('loginOverlay').style.display = 'flex'; return; }
    protoFileInput.click();
  });
  protoDropZone.addEventListener('dragover', e => { e.preventDefault(); protoDropZone.classList.add('over'); });
  protoDropZone.addEventListener('dragleave', () => protoDropZone.classList.remove('over'));
  protoDropZone.addEventListener('drop', async e => {
    e.preventDefault(); protoDropZone.classList.remove('over');
    const items = e.dataTransfer.items;
    // Check if a folder was dropped
    if (items && items.length && items[0].webkitGetAsEntry) {
      const entry = items[0].webkitGetAsEntry();
      if (entry && entry.isDirectory) {
        await packFolderEntry(entry);
        return;
      }
    }
    const f = e.dataTransfer.files[0];
    if (f && (f.name.toLowerCase().endsWith('.zip') || f.type.includes('zip'))) setProtoFile(f);
    else toast('请拖拽 ZIP 文件或文件夹');
  });
  protoFileInput.addEventListener('change', () => { if (protoFileInput.files[0]) setProtoFile(protoFileInput.files[0]); });

  // Folder picker
  const protoFolderInput = document.getElementById('protoFolderInput');
  protoFolderInput.addEventListener('change', async () => {
    const files = [...protoFolderInput.files];
    if (!files.length) return;
    await packFilesToZip(files);
    protoFolderInput.value = '';
  });

  // 文件夹上传：直接构建 filesMap（{相对路径: Uint8Array}），跳过 zipSync + 服务端再解压的双重耗时
  async function packFilesToZip(fileList) {
    const p = protoDropZone.querySelector('p');
    document.getElementById('protoUploadBtn').disabled = true;
    try {
      const map = {}; let topFolder = '', total = 0, n = 0; const count = fileList.length;
      for (const file of fileList) {
        const parts = file.webkitRelativePath.split('/');
        if (!topFolder) topFolder = parts[0];
        const rel = parts.slice(1).join('/'); // Strip top-level folder
        if (!rel || rel === '.DS_Store' || rel.endsWith('/.DS_Store')) continue;
        const buf = await file.arrayBuffer();
        map[rel] = new Uint8Array(buf); total += buf.byteLength;
        if (++n % 20 === 0) p.textContent = '正在读取文件夹… ' + n + '/' + count;
      }
      setProtoFolder(map, topFolder || 'prototype', total);
    } catch(e) {
      p.textContent = '点击选择 ZIP 文件，或拖拽文件夹到此处';
      document.getElementById('protoErr').textContent = '读取失败: ' + e.message;
    }
  }

  async function packFolderEntry(dirEntry) {
    const p = protoDropZone.querySelector('p');
    p.textContent = '正在读取文件夹…';
    document.getElementById('protoUploadBtn').disabled = true;
    try {
      const map = {}; let total = 0, n = 0;
      async function readDir(entry, prefix) {
        const reader = entry.createReader();
        const entries = await new Promise((res, rej) => {
          const all = [];
          function read() { reader.readEntries(e => { if (!e.length) res(all); else { all.push(...e); read(); } }, rej); }
          read();
        });
        for (const e of entries) {
          if (e.isDirectory) { await readDir(e, prefix + e.name + '/'); }
          else {
            if (e.name === '.DS_Store') continue;
            const file = await new Promise((res, rej) => e.file(res, rej));
            const buf = await file.arrayBuffer();
            map[prefix + e.name] = new Uint8Array(buf); total += buf.byteLength;
            if (++n % 20 === 0) p.textContent = '正在读取文件夹… ' + n + ' 个文件';
          }
        }
      }
      await readDir(dirEntry, '');
      setProtoFolder(map, dirEntry.name, total);
    } catch(e) {
      protoDropZone.querySelector('p').textContent = '点击选择 ZIP 文件，或拖拽文件夹到此处';
      document.getElementById('protoErr').textContent = '读取文件夹失败: ' + e.message;
    }
  }

  function setProtoFolder(map, name, total) {
    const count = Object.keys(map).length;
    if (!count) { document.getElementById('protoErr').textContent = '文件夹为空'; return; }
    pendingProtoFolderFiles = map;
    pendingProtoFile = null;
    protoDropZone.querySelector('p').textContent = name + '/ (' + count + ' 个文件 · ' + fmtSize(total) + ')';
    document.getElementById('protoErr').textContent = '';
    document.getElementById('protoUploadBtn').disabled = !token;
    if (!document.getElementById('protoTitle').value) document.getElementById('protoTitle').value = name;
  }

  function setProtoFile(f) {
    pendingProtoFile = f;
    pendingProtoFolderFiles = null;
    protoDropZone.querySelector('p').textContent = f.name + ' (' + fmtSize(f.size) + ')';
    document.getElementById('protoErr').textContent = '';
    document.getElementById('protoUploadBtn').disabled = !token;
    protoFileInput.value = '';
  }

  // ── Client-side ZIP utilities (mirrors server logic) ────────────────────────
  function _protoDetectEntry(paths) {
    const rootHtml = paths.filter(p => !p.includes('/') && p.toLowerCase().endsWith('.html'));
    const find = (arr, name) => arr.find(p => p.toLowerCase() === name);
    if (find(rootHtml, 'start.html')) return 'start.html';
    if (find(rootHtml, 'index.html')) return 'index.html';
    if (rootHtml.length) return rootHtml[0];
    const deep = paths.filter(p => { const s = p.split('/'); return s.length === 2 && s[1].toLowerCase().endsWith('.html'); });
    return deep.find(p => p.toLowerCase().endsWith('start.html'))
        || deep.find(p => p.toLowerCase().endsWith('index.html'))
        || null;
  }
  function _protoFixEnc(path) {
    if ([...path].every(c => c.charCodeAt(0) <= 255)) {
      try { const b = new Uint8Array([...path].map(c => c.charCodeAt(0))); const d = new TextDecoder('utf-8',{fatal:true}).decode(b); if (d !== path) return d; } catch {}
    }
    return path;
  }
  function _protoStrip(files) {
    const paths = Object.keys(files); if (!paths.length) return files;
    const first = paths[0].split('/')[0];
    if (paths.every(p => p.startsWith(first + '/'))) {
      const out = {}; for (const [p,d] of Object.entries(files)) out[p.slice(first.length+1)] = d; return out;
    }
    return files;
  }
  function _protoFilter(files) {
    return Object.keys(files).filter(p => {
      if (!p || p.startsWith('/') || p.includes('..') || p.endsWith('/')) return false;
      if (p.startsWith('__MACOSX/') || p.includes('/.DS_Store') || p === '.DS_Store') return false;
      return true;
    });
  }

  // 内容指纹：FNV-1a 32-bit（含长度前缀防碰撞），返回 hex 字符串。
  // 仅用于「内容是否变化」的快速判断，非加密用途。
  function _fnv1a(bytes) {
    let h = 0x811c9dc5;
    for (let i = 0; i < bytes.length; i++) {
      h ^= bytes[i];
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return (bytes.length >>> 0).toString(16) + '-' + h.toString(16);
  }

  // ── Shared chunked upload engine ─────────────────────────────────────────────
  async function _protoChunkedUpload({ zipFile, filesMap, title, password, existingProtoId, setStatus, initUrl, filesUrl, finalizeUrl }) {
    // 每批 45 文件：每批为独立 Worker 调用、各享免费版 50 subrequest 预算
    // （45 put + staging.get + cfBump 两次 KV = 48 ≤ 50）。
    const BATCH = 45;
    const CONCURRENCY = 3;  // 批间并发：多个独立 Worker 调用并行，各自独立预算
    let files;
    if (filesMap) {
      files = filesMap;
      setStatus(\`📋 分析文件结构… \${Object.keys(files).length} 个文件\`, 8);
    } else {
      setStatus('🗜️ 正在解压 ZIP（后台线程）…', 3);
      const bytes = new Uint8Array(await zipFile.arrayBuffer());
      try {
        const raw = await _unzipBytes(bytes, zipFile);
        const fixed = {}; for (const [p,d] of Object.entries(raw)) fixed[_protoFixEnc(p)] = d;
        files = _protoStrip(fixed);
      } catch(e) { throw new Error('解压失败：' + e.message); }
      setStatus(\`📋 分析文件结构… 发现 \${Object.keys(files).length} 个文件\`, 8);
    }

    const safePaths = _protoFilter(files);
    if (!safePaths.length) throw new Error('ZIP 中未找到有效文件');
    const entryPoint = _protoDetectEntry(safePaths);
    if (!entryPoint) throw new Error('未找到入口文件（start.html 或 index.html）');
    const totalSize = safePaths.reduce((s, p) => s + (files[p]?.byteLength ?? 0), 0);

    // 计算本次所有文件的内容指纹（用于增量 diff 与写回 manifest）
    const newManifest = {};
    for (const p of safePaths) newManifest[p] = _fnv1a(files[p] ?? new Uint8Array(0));

    // Step 1: init（更新模式下后端回传上一版本 manifest）
    setStatus('🔧 初始化上传会话…', 12);
    const initRes = await fetch(initUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ title, password, entryPoint, totalSize, protoId: existingProtoId || undefined }),
    });
    const initData = await initRes.json().catch(() => ({}));
    if (!initRes.ok) throw new Error(initData.error || '初始化失败');
    const { protoId, manifest: prevManifest } = initData;

    // 增量上传：仅上传新增 / 内容变更的文件。无历史 manifest 时退化为全量上传。
    const uploadPaths = prevManifest
      ? safePaths.filter(p => prevManifest[p] !== newManifest[p])
      : safePaths;
    const skipped = safePaths.length - uploadPaths.length;

    // Step 2: upload in batches —— 并发池 + 单批重试（免费版约束下提速）
    const totalBatches = Math.ceil(uploadPaths.length / BATCH) || 0;
    if (skipped > 0) setStatus(\`⚡ 增量上传：\${uploadPaths.length} 个变更，跳过 \${skipped} 个未变文件\`, 15);

    // 单批上传：最多重试 3 次（指数退避）；4xx（除 429）不重试
    async function uploadBatch(b) {
      const batchPaths = uploadPaths.slice(b * BATCH, (b + 1) * BATCH);
      const fd = new FormData();
      fd.append('protoId', protoId);
      batchPaths.forEach(p => { fd.append('paths[]', p); fd.append('files[]', new Blob([files[p]]), p); });
      let lastErr;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const bRes = await fetch(filesUrl, { method: 'POST', headers: { 'Authorization': 'Bearer ' + token }, body: fd });
          if (bRes.ok) return;
          const d = await bRes.json().catch(() => ({}));
          lastErr = new Error(d.error || ('批次 ' + (b + 1) + ' 上传失败'));
          if (bRes.status >= 400 && bRes.status < 500 && bRes.status !== 429) throw lastErr; // 不可重试
        } catch (e) { lastErr = e; }
        if (attempt < 2) await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
      }
      throw lastErr || new Error('批次 ' + (b + 1) + ' 上传失败');
    }

    // 并发池：CONCURRENCY 个 worker 从队列取批次；任一批彻底失败则中止
    const queue = Array.from({ length: totalBatches }, (_, i) => i);
    let done = 0, abortErr = null;
    async function poolWorker() {
      while (queue.length && !abortErr) {
        const b = queue.shift();
        try { await uploadBatch(b); }
        catch (e) { abortErr = e; return; }
        done++;
        const pct = Math.round(15 + (done / totalBatches) * 75);
        const filesDone = Math.min(done * BATCH, uploadPaths.length);
        setStatus('📤 已上传 ' + done + '/' + totalBatches + ' 批（' + filesDone + ' / ' + uploadPaths.length + ' 个变更文件 · 并发 ' + CONCURRENCY + '）', pct);
      }
    }
    if (totalBatches > 0) {
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, totalBatches) }, poolWorker));
      if (abortErr) throw abortErr;
    }

    // Step 3: finalize（filePaths 记录完整清单，manifest 写回供下次 diff）
    setStatus('✅ 正在写入元数据…', 93);
    const fRes = await fetch(finalizeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ protoId, filePaths: safePaths, manifest: newManifest }),
    });
    const fData = await fRes.json().catch(() => ({}));
    if (!fRes.ok) throw new Error(fData.error || '最终化失败');
    setStatus(skipped > 0 ? \`🎉 完成！增量上传 \${uploadPaths.length} 个文件（节省 \${skipped} 个）\` : '🎉 上传完成！', 100);
    return { ...fData, protoId, safePaths, totalSize };
  }

  // ── Main proto upload button ──────────────────────────────────────────────────
  document.getElementById('protoUploadBtn').addEventListener('click', async () => {
    if (!token || (!pendingProtoFile && !pendingProtoFolderFiles)) return;
    const title    = document.getElementById('protoTitle').value.trim();
    const password = document.getElementById('protoPassword').value.trim();

    // Duplicate name check
    if (title && userProtos.some(p => p.title === title)) {
      document.getElementById('protoErr').textContent = \`已存在同名原型「\${title}」，请修改名称后上传\`;
      return;
    }

    document.getElementById('protoErr').textContent = '';
    document.getElementById('protoUploadBtn').disabled = true;
    const prog     = document.getElementById('protoProgress');    prog.classList.add('show');
    const bar      = document.getElementById('protoProgressBar'); bar.style.width = '0%';
    const info     = document.getElementById('protoProgressInfo'); info.classList.add('show');
    const pctEl    = document.getElementById('protoProgressPct'); pctEl.textContent = '0%';
    const statusEl = document.getElementById('protoStatusText');  statusEl.style.display = '';  statusEl.textContent = '';

    function setStatus(msg, pct) {
      statusEl.textContent = msg;
      if (pct !== undefined) { bar.style.width = pct + '%'; pctEl.textContent = pct + '%'; }
    }
    function resetProg() {
      setTimeout(() => {
        prog.classList.remove('show'); bar.style.width = '0%';
        info.classList.remove('show'); statusEl.style.display = 'none'; statusEl.textContent = '';
      }, 1200);
    }

    try {
      const result = await _protoChunkedUpload({
        zipFile: pendingProtoFile, filesMap: pendingProtoFolderFiles,
        title, password, existingProtoId: null,
        setStatus,
        initUrl: '/upload/proto/init', filesUrl: '/upload/proto/files', finalizeUrl: '/upload/proto/finalize',
      });
      resetProg(); toast('上传成功！');
      pendingProtoFile = null; pendingProtoFolderFiles = null;
      protoDropZone.querySelector('p').textContent = '点击选择 ZIP 文件，或拖拽文件夹到此处';
      document.getElementById('protoTitle').value = '';
      document.getElementById('protoPassword').value = '';
      document.getElementById('protoUploadBtn').disabled = true;
      const cleanPwd = password.replace(/[^A-Za-z0-9]/g,'').slice(0,6);
      userProtos.unshift({
        protoId: result.protoId, title: result.title || title || '未命名原型',
        fileCount: result.fileCount ?? result.safePaths.length, totalSize: result.totalSize ?? 0,
        version: result.version ?? 1,
        versions: [{ v: result.version??1, at: Date.now(), files: result.fileCount??0, size: result.totalSize??0 }],
        hasPassword: !!cleanPwd, accessPassword: cleanPwd || undefined,
        isPrivate: false, createdAt: Date.now(), updatedAt: Date.now(), visitCount: 0,
      });
      renderProtos();
    } catch(e) {
      resetProg();
      document.getElementById('protoErr').textContent = e.message || '上传失败';
      document.getElementById('protoUploadBtn').disabled = false;
    }
  });

  // ── Upload toggle ──
  (function() {
    const toggle = document.getElementById('protoUploadToggle');
    const body   = document.getElementById('protoUploadBody');
    const icon   = document.getElementById('protoUploadIcon');
    let open = true;
    toggle.addEventListener('click', () => {
      open = !open;
      body.style.display = open ? '' : 'none';
      icon.classList.toggle('open', open);
    });
  })();

  document.getElementById('refreshProtos').addEventListener('click', loadProtos);

  async function loadProtos(silent = false) {
    if (!token) return;
    if (!silent) document.getElementById('protoTableBody').innerHTML = '<tr><td colspan="10" style="text-align:center;color:#333;padding:32px">加载中…</td></tr>';
    try {
      const res = await fetch('/api/protos', { headers: { Authorization: 'Bearer ' + token } });
      if (!res.ok) return;
      const { protos } = await res.json();
      userProtos = protos || [];
      renderProtos();
    } catch { if (!silent) document.getElementById('protoTableBody').innerHTML = '<tr><td colspan="10" style="text-align:center;color:#555;padding:32px">加载失败</td></tr>'; }
  }

  function formatExpiry(ts) {
    if (!ts) return '永久';
    return new Date(ts).toLocaleDateString('zh-CN') + ' 到期';
  }
  function timeAgo(ms) {
    if (!ms) return '—';
    const s = Math.floor((Date.now() - ms) / 1000);
    if (s < 60) return '刚刚';
    if (s < 3600) return Math.floor(s/60) + ' 分钟前';
    if (s < 86400) return Math.floor(s/3600) + ' 小时前';
    if (s < 2592000) return Math.floor(s/86400) + ' 天前';
    return new Date(ms).toLocaleDateString('zh-CN');
  }

  function renderProtos() {
    const tbody = document.getElementById('protoTableBody');
    const empty = document.getElementById('protoEmpty');
    if (!userProtos.length) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:#333;padding:32px">暂无原型</td></tr>';
      empty.style.display = 'none';
      return;
    }
    empty.style.display = 'none';
    tbody.innerHTML = userProtos.map((p, idx) => {
      const url        = location.origin + '/proto/' + p.protoId + '/';
      const previewUrl = url + (p.accessPassword ? '?pwd=' + encodeURIComponent(p.accessPassword) : '');
      const lock       = p.hasPassword ? \`<span class="proto-lock">🔒 密码</span>\` : '';
      const priv       = p.isPrivate   ? \`<span class="proto-private">私有</span>\` : '';
      const pwdInfo    = p.hasPassword ? \`<div style="font-size:.65rem;color:#555;margin-top:2px">有效期：\${formatExpiry(p.passwordExpiry)}</div>\` : '<span class="proto-muted">无</span>';
      const verCount   = (p.versions ?? []).length;
      const verBadge   = \`<span class="proto-version" style="cursor:pointer;text-decoration:underline" onclick="upvmOpen(\${idx})">v\${p.version||1}\${verCount>1?' ('+verCount+')':''} ↗</span>\`;
      const visits = p.visitCount ?? 0;
      return \`<tr>
        <td class="proto-muted" style="font-size:.75rem;text-align:center">\${idx+1}</td>
        <td class="proto-td-name">
          <div class="name">\${esc(p.title || p.protoId)}</div>
          <div style="display:flex;gap:4px;margin-top:3px;flex-wrap:wrap">\${lock}\${priv}\${(p.tags||[]).map(t=>\`<span class="tag-chip">\${esc(t)}</span>\`).join('')}</div>
          <div class="id">\${p.protoId}</div>
        </td>
        <td class="proto-muted">\${p.fileCount ?? '—'}</td>
        <td class="proto-muted">\${fmtSize(p.totalSize || 0)}</td>
        <td>\${pwdInfo}</td>
        <td>\${verBadge}</td>
        <td class="proto-muted">\${visits > 0 ? visits.toLocaleString() : '—'}</td>
        <td class="proto-muted" style="white-space:nowrap">\${fmtDate(p.createdAt)}</td>
        <td class="proto-muted" style="white-space:nowrap">\${timeAgo(p.updatedAt || p.createdAt)}</td>
        <td class="proto-td-actions">
          <a href="\${previewUrl}" target="_blank" class="btn btn-ghost">预览</a>
          <button class="btn btn-ghost" onclick="cpProto(userProtos[\${idx}]._copyText,this)">复制</button>
          <button class="btn btn-ghost" onclick="upvmOpen(\${idx})">版本</button>
          <button class="btn btn-ghost" onclick="openProtoTagEditor('\${esc(p.protoId)}')">标签</button>
          <button class="btn btn-ghost" onclick="openProtoEdit('\${esc(p.protoId)}')">编辑</button>
          <button class="btn btn-ghost" onclick="openProtoUpdate('\${esc(p.protoId)}')">更新</button>
          <button class="btn btn-danger" onclick="deleteProto('\${esc(p.protoId)}')">删除</button>
        </td>
      </tr>\`;
    }).join('');
    // attach copy text to cache
    userProtos.forEach(p => {
      const url = location.origin + '/proto/' + p.protoId + '/';
      p._copyText = p.accessPassword ? \`内容：\${url}\n密码：\${p.accessPassword}\` : url;
    });
  }

  function cpProto(text, btn) {
    cp(text, btn);
    toast('链接已复制');
  }

  async function deleteProto(protoId) {
    if (!confirm('将此原型移至回收站？可在「我的图库 → 回收站」恢复。')) return;
    // Optimistic: remove row immediately for instant feedback
    const backup = [...userProtos];
    userProtos = userProtos.filter(p => p.protoId !== protoId);
    renderProtos();
    toast('删除中…');
    try {
      const res = await fetch('/api/protos/' + encodeURIComponent(protoId), { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        userProtos = backup; renderProtos(); toast('删除失败: ' + (d.error || ''));
        return;
      }
      toast('已移至回收站');
    } catch { userProtos = backup; renderProtos(); toast('删除失败'); }
  }

  // ── Proto Version Modal (user) ────────────────────────────────────────────
  let upvmProto = null, upvmFileCache = {}, upvmChecked = [], upvmActiveVer = null;

  function upvmOpen(idx) {
    upvmProto     = userProtos[idx] ?? {};
    upvmFileCache = {}; upvmChecked = []; upvmActiveVer = null;
    document.getElementById('upvmTitle').textContent = upvmProto.title || upvmProto.protoId || '';
    document.getElementById('upvmSearch').value = '';
    document.getElementById('upvmDiffBtn').style.display = 'none';
    document.getElementById('upvmMode').textContent = '点击版本号查看文件列表，勾选两个版本进行对比';
    document.getElementById('upvmContent').innerHTML = '<div style="color:#333;text-align:center;padding:60px 0;font-size:.85rem">← 点击左侧版本号查看文件列表</div>';
    upvmRenderList();
    document.getElementById('userProtoVersionModal').classList.add('show');
  }

  function upvmRenderList() {
    const versions = [...(upvmProto.versions ?? [])].reverse();
    const maxVer   = upvmProto.version ?? 1;
    document.getElementById('upvmVersionList').innerHTML = versions.map(v => {
      const isLatest = v.v === maxVer;
      const isActive = upvmActiveVer === v.v;
      const ci       = upvmChecked.indexOf(v.v);
      const cls      = ci===0?'pvm-ver-card checked-a':ci===1?'pvm-ver-card checked-b':isActive?'pvm-ver-card active':'pvm-ver-card';
      return \`<div class="\${cls}" onclick="upvmSelectVer(\${v.v})">
        <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
          <span class="pvm-ver-badge">v\${v.v}</span>
          \${isLatest?'<span class="pvm-ver-latest">最新</span>':''}
          \${!isLatest?'<button class="btn btn-danger" style="padding:1px 6px;font-size:.62rem;margin-left:auto" onclick="event.stopPropagation();upvmDeleteVer(\${v.v})">删除</button>':''}
        </div>
        <div class="pvm-ver-meta">\${v.at?new Date(v.at).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'—'}</div>
        <div class="pvm-ver-meta">\${v.files??'?'} 文件 · \${v.size?fmtSize(v.size):'—'}</div>
        <label class="pvm-ver-check" onclick="event.stopPropagation()">
          <input type="checkbox" \${ci>=0?'checked':''} onchange="upvmToggleCheck(\${v.v},this.checked)">
          <span style="color:\${ci===0?'#10b981':ci===1?'#f59e0b':'#555'}">\${ci===0?'对比 A':ci===1?'对比 B':'加入对比'}</span>
        </label>
      </div>\`;
    }).join('');
  }

  async function upvmSelectVer(ver) {
    upvmActiveVer = ver; upvmRenderList();
    const files = await upvmFetch(ver);
    upvmShowFileList(files, \`v\${ver} 文件列表 (\${files?.length??'?'} 个)\`);
  }

  function upvmToggleCheck(ver, checked) {
    if (checked) { if (upvmChecked.length >= 2) upvmChecked.shift(); upvmChecked.push(ver); }
    else upvmChecked = upvmChecked.filter(v => v !== ver);
    upvmRenderList();
    const btn = document.getElementById('upvmDiffBtn');
    const modeEl = document.getElementById('upvmMode');
    if (upvmChecked.length === 2) { btn.style.display=''; modeEl.textContent=\`已选 v\${upvmChecked[0]}（A）与 v\${upvmChecked[1]}（B），点击"对比"查看差异\`; }
    else { btn.style.display='none'; modeEl.textContent = upvmChecked.length===1?\`已选 v\${upvmChecked[0]} 为对比 A，再勾选一个版本\`:'点击版本号查看文件列表，勾选两个版本进行对比'; }
  }

  async function upvmFetch(ver) {
    const key = \`v\${ver}\`;
    if (upvmFileCache[key] !== undefined) return upvmFileCache[key];
    document.getElementById('upvmContent').innerHTML = '<div style="color:#333;text-align:center;padding:40px 0">加载中…</div>';
    try {
      const pid = upvmProto.protoId;
      const res = await fetch(\`/api/proto-vfiles/\${encodeURIComponent(pid)}/\${key}\`, { headers: { Authorization: 'Bearer ' + token } });
      upvmFileCache[key] = res.ok ? (await res.json()).files ?? null : null;
    } catch { upvmFileCache[key] = null; }
    return upvmFileCache[key];
  }

  function upvmShowFileList(files, title) {
    const q = document.getElementById('upvmSearch').value.toLowerCase();
    if (!files) { document.getElementById('upvmContent').innerHTML = '<div style="color:#555;text-align:center;padding:40px 0;font-size:.82rem">该版本无文件记录（旧版本上传未记录文件列表）</div>'; return; }
    const fl = q ? files.filter(f => f.toLowerCase().includes(q)) : files;
    document.getElementById('upvmContent').innerHTML = \`<div style="font-size:.75rem;color:#555;margin-bottom:10px;font-weight:500">\${title}\${q?' — 过滤 "'+q+'"':''}</div><div>\${fl.map(f=>\`<div class="file-row">\${esc(f)}</div>\`).join('')||'<div style="color:#333;font-size:.82rem;padding:20px 0">无匹配文件</div>'}</div>\`;
  }

  document.getElementById('upvmDiffBtn').addEventListener('click', async () => {
    if (upvmChecked.length < 2) return;
    const [a,b] = upvmChecked;
    document.getElementById('upvmContent').innerHTML = '<div style="color:#333;text-align:center;padding:40px 0">加载中…</div>';
    const [fa,fb] = await Promise.all([upvmFetch(a), upvmFetch(b)]);
    if (!fa || !fb) { document.getElementById('upvmContent').innerHTML = '<div style="color:#555;text-align:center;padding:40px 0;font-size:.82rem">版本无文件记录，无法对比</div>'; return; }
    upvmRenderDiff(fa, fb, a, b);
  });

  function upvmRenderDiff(fa, fb, a, b) {
    const q = document.getElementById('upvmSearch').value.toLowerCase();
    const sa = new Set(fa), sb = new Set(fb);
    let added   = fb.filter(f => !sa.has(f));
    let removed = fa.filter(f => !sb.has(f));
    let same    = fa.filter(f => sb.has(f));
    if (q) { added=added.filter(f=>f.toLowerCase().includes(q)); removed=removed.filter(f=>f.toLowerCase().includes(q)); same=same.filter(f=>f.toLowerCase().includes(q)); }
    const mkRows = (files, cls, pfx) => files.map(f=>\`<div class="diff-file \${cls}"><span class="diff-prefix">\${pfx}</span>\${esc(f)}</div>\`).join('');
    let html = \`<div style="display:flex;gap:12px;margin-bottom:16px;font-size:.78rem;flex-wrap:wrap"><span>v\${a} → v\${b}</span><span style="color:#10b981">+\${added.length} 新增</span><span style="color:#ef4444">-\${removed.length} 删除</span><span style="color:#555">\${same.length} 不变</span></div>\`;
    if (added.length)   html += \`<div class="diff-section add"><h4>✦ 新增 \${added.length} 个文件（v\${b} 新增）</h4>\${mkRows(added,'diff-add','+')}</div>\`;
    if (removed.length) html += \`<div class="diff-section rem"><h4>✦ 删除 \${removed.length} 个文件（v\${b} 移除）</h4>\${mkRows(removed,'diff-rem','−')}</div>\`;
    if (same.length)    html += \`<div class="diff-section same"><h4>· 未变动 \${same.length} 个文件</h4>\${mkRows(same,'','·')}</div>\`;
    document.getElementById('upvmContent').innerHTML = html || '<div style="color:#333;text-align:center;padding:40px 0;font-size:.82rem">无匹配文件</div>';
  }

  document.getElementById('upvmSearch').addEventListener('input', () => {
    if (upvmChecked.length===2 && document.getElementById('upvmContent').querySelector('.diff-section')) {
      (async()=>{ const [fa,fb]=await Promise.all([upvmFetch(upvmChecked[0]),upvmFetch(upvmChecked[1])]); if(fa&&fb) upvmRenderDiff(fa,fb,upvmChecked[0],upvmChecked[1]); })();
    } else if (upvmActiveVer !== null) {
      upvmShowFileList(upvmFileCache[\`v\${upvmActiveVer}\`]??null, \`v\${upvmActiveVer} 文件列表\`);
    }
  });

  async function upvmDeleteVer(ver) {
    if (!confirm(\`确认删除 v\${ver}？该操作仅删除版本记录，不影响当前原型内容。\`)) return;
    const res = await fetch(\`/api/proto-versions/\${encodeURIComponent(upvmProto.protoId)}/v\${ver}\`, { method:'DELETE', headers:{ Authorization:'Bearer '+token } });
    const d = await res.json().catch(()=>({}));
    if (!res.ok) { toast('删除失败: '+(d.error||'')); return; }
    upvmProto.versions = (upvmProto.versions??[]).filter(v=>v.v!==ver);
    delete upvmFileCache[\`v\${ver}\`];
    upvmChecked = upvmChecked.filter(v=>v!==ver);
    if (upvmActiveVer===ver) { upvmActiveVer=null; document.getElementById('upvmContent').innerHTML='<div style="color:#333;text-align:center;padding:60px 0;font-size:.85rem">← 点击左侧版本号查看文件列表</div>'; }
    const cp = userProtos.find(p=>p.protoId===upvmProto.protoId);
    if (cp) cp.versions = upvmProto.versions;
    upvmRenderList(); toast(\`v\${ver} 已删除\`);
  }

  document.getElementById('upvmClose').addEventListener('click', () => document.getElementById('userProtoVersionModal').classList.remove('show'));
  document.getElementById('userProtoVersionModal').addEventListener('click', e => { if (e.target===document.getElementById('userProtoVersionModal')) document.getElementById('userProtoVersionModal').classList.remove('show'); });

  // ── Proto Edit / Update ───────────────────────────────────────────────────
  let editingProtoId = null;
  let pendingUpdateFile = null;
  let pendingUpdateFolderFiles = null;

  function openProtoEdit(protoId) {
    const p = userProtos.find(x => x.protoId === protoId);
    if (!p) return;
    editingProtoId = protoId;
    document.getElementById('peTitle').value = p.title || '';
    document.getElementById('pePassword').value = p.accessPassword || '';
    const sel = document.getElementById('peExpiry');
    if (!p.passwordExpiry) sel.value = '0';
    else {
      const daysLeft = Math.round((p.passwordExpiry - Date.now()) / 86400000);
      sel.value = daysLeft > 60 ? '90' : daysLeft > 20 ? '30' : '14';
    }
    document.getElementById('pePrivate').checked = !!p.isPrivate;
    document.getElementById('peErr').textContent = '';
    document.getElementById('protoEditModal').classList.add('show');
  }

  document.getElementById('protoEditSave').addEventListener('click', async () => {
    if (!editingProtoId) return;
    const title       = document.getElementById('peTitle').value.trim();
    const password    = document.getElementById('pePassword').value.trim().replace(/[^A-Za-z0-9]/g,'').slice(0,6);
    const expiryDays  = parseInt(document.getElementById('peExpiry').value);
    const isPrivate   = document.getElementById('pePrivate').checked;
    const passwordExpiry = password && expiryDays > 0 ? Date.now() + expiryDays * 86400 * 1000 : null;
    const updates = { title, password, passwordExpiry, isPrivate };
    const res = await fetch('/api/protos/' + encodeURIComponent(editingProtoId), {
      method: 'PATCH', headers: authH(), body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) { document.getElementById('peErr').textContent = data.error || '保存失败'; return; }
    document.getElementById('protoEditModal').classList.remove('show');
    toast('已保存');
    // Optimistic local update — no full reload needed
    const idx = userProtos.findIndex(p => p.protoId === editingProtoId);
    if (idx >= 0) {
      const p = userProtos[idx];
      if (title) p.title = title;
      p.isPrivate   = isPrivate;
      p.hasPassword = !!password;
      if (password) { p.accessPassword = password; p.passwordExpiry = passwordExpiry; }
      else { delete p.accessPassword; p.passwordExpiry = null; }
      p.updatedAt = data.updatedAt || Date.now();
    }
    renderProtos();
  });

  ['protoEditClose','protoEditCancel'].forEach(id =>
    document.getElementById(id).addEventListener('click', () => document.getElementById('protoEditModal').classList.remove('show'))
  );

  function openProtoUpdate(protoId) {
    editingProtoId = protoId;
    pendingUpdateFile = null; pendingUpdateFolderFiles = null;
    document.getElementById('puFileName').textContent = '选择 ZIP 或文件夹';
    document.getElementById('puErr').textContent = '';
    document.getElementById('puProgress').classList.remove('show');
    document.getElementById('protoUpdateUpload').disabled = true;
    document.getElementById('protoUpdateModal').classList.add('show');
  }

  // puDropZone handlers
  const puDropZone = document.getElementById('puDropZone');
  const puFileInput = document.getElementById('puFileInput');
  const puFolderInput = document.getElementById('puFolderInput');

  puDropZone.addEventListener('click', () => puFileInput.click());
  puDropZone.addEventListener('dragover', e => { e.preventDefault(); puDropZone.classList.add('over'); });
  puDropZone.addEventListener('dragleave', () => puDropZone.classList.remove('over'));
  puDropZone.addEventListener('drop', async e => {
    e.preventDefault(); puDropZone.classList.remove('over');
    const items = e.dataTransfer.items;
    if (items && items.length && items[0].webkitGetAsEntry) {
      const entry = items[0].webkitGetAsEntry();
      if (entry && entry.isDirectory) { await puPackFolderEntry(entry); return; }
    }
    const f = e.dataTransfer.files[0];
    if (f && (f.name.toLowerCase().endsWith('.zip') || f.type.includes('zip'))) setPuFile(f);
    else toast('请拖拽 ZIP 文件或文件夹');
  });
  puFileInput.addEventListener('change', () => { if (puFileInput.files[0]) { setPuFile(puFileInput.files[0]); puFileInput.value = ''; } });
  puFolderInput.addEventListener('change', async () => {
    const files = [...puFolderInput.files];
    if (!files.length) return;
    await puPackFilesToZip(files);
    puFolderInput.value = '';
  });

  function setPuFile(f) {
    pendingUpdateFile = f;
    pendingUpdateFolderFiles = null;
    document.getElementById('puFileName').textContent = f.name + ' (' + fmtSize(f.size) + ')';
    document.getElementById('puErr').textContent = '';
    document.getElementById('protoUpdateUpload').disabled = false;
  }

  function setPuFolder(map, name, total) {
    const count = Object.keys(map).length;
    if (!count) { document.getElementById('puErr').textContent = '文件夹为空'; return; }
    pendingUpdateFolderFiles = map;
    pendingUpdateFile = null;
    document.getElementById('puFileName').textContent = name + '/ (' + count + ' 个文件 · ' + fmtSize(total) + ')';
    document.getElementById('puErr').textContent = '';
    document.getElementById('protoUpdateUpload').disabled = false;
  }

  // 文件夹更新：直接构建 filesMap，跳过 zip+服务端解压
  async function puPackFilesToZip(fileList) {
    document.getElementById('protoUpdateUpload').disabled = true;
    try {
      const map = {}; let topFolder = '', total = 0, n = 0; const count = fileList.length;
      for (const file of fileList) {
        const parts = file.webkitRelativePath.split('/');
        if (!topFolder) topFolder = parts[0];
        const rel = parts.slice(1).join('/');
        if (!rel || rel === '.DS_Store' || rel.endsWith('/.DS_Store')) continue;
        const buf = await file.arrayBuffer();
        map[rel] = new Uint8Array(buf); total += buf.byteLength;
        if (++n % 20 === 0) document.getElementById('puFileName').textContent = '正在读取… ' + n + '/' + count;
      }
      setPuFolder(map, topFolder || 'prototype', total);
    } catch(e) {
      document.getElementById('puFileName').textContent = '选择 ZIP 或文件夹';
      document.getElementById('puErr').textContent = '读取失败: ' + e.message;
    }
  }

  async function puPackFolderEntry(dirEntry) {
    document.getElementById('puFileName').textContent = '正在读取…';
    document.getElementById('protoUpdateUpload').disabled = true;
    try {
      const map = {}; let total = 0, n = 0;
      async function readDir(entry, prefix) {
        const reader = entry.createReader();
        const entries = await new Promise((res, rej) => {
          const all = [];
          function read() { reader.readEntries(e => { if (!e.length) res(all); else { all.push(...e); read(); } }, rej); }
          read();
        });
        for (const e of entries) {
          if (e.isDirectory) { await readDir(e, prefix + e.name + '/'); }
          else {
            if (e.name === '.DS_Store') continue;
            const file = await new Promise((res, rej) => e.file(res, rej));
            const buf = await file.arrayBuffer();
            map[prefix + e.name] = new Uint8Array(buf); total += buf.byteLength;
            if (++n % 20 === 0) document.getElementById('puFileName').textContent = '正在读取… ' + n + ' 个文件';
          }
        }
      }
      await readDir(dirEntry, '');
      setPuFolder(map, dirEntry.name, total);
    } catch(e) {
      document.getElementById('puFileName').textContent = '选择 ZIP 或文件夹';
      document.getElementById('puErr').textContent = '读取失败: ' + e.message;
    }
  }

  document.getElementById('protoUpdateUpload').addEventListener('click', async () => {
    if ((!pendingUpdateFile && !pendingUpdateFolderFiles) || !editingProtoId) return;
    document.getElementById('protoUpdateUpload').disabled = true;
    document.getElementById('puErr').textContent = '';

    const prog     = document.getElementById('puProgress');     prog.classList.add('show');
    const bar      = document.getElementById('puProgressBar');  bar.style.width = '0%';
    const info     = document.getElementById('puProgressInfo'); info.classList.add('show');
    const pctEl    = document.getElementById('puProgressPct');  pctEl.textContent = '0%';
    const statusEl = document.getElementById('puStatusText');   statusEl.style.display = ''; statusEl.textContent = '';

    function setStatus(msg, pct) {
      statusEl.textContent = msg;
      if (pct !== undefined) { bar.style.width = pct + '%'; pctEl.textContent = pct + '%'; }
    }
    function resetProg() {
      setTimeout(() => {
        prog.classList.remove('show'); bar.style.width = '0%';
        info.classList.remove('show'); statusEl.style.display = 'none'; statusEl.textContent = '';
      }, 1200);
    }

    try {
      const result = await _protoChunkedUpload({
        zipFile: pendingUpdateFile, filesMap: pendingUpdateFolderFiles,
        title: undefined, password: undefined,
        existingProtoId: editingProtoId,
        setStatus,
        initUrl: '/upload/proto/init', filesUrl: '/upload/proto/files', finalizeUrl: '/upload/proto/finalize',
      });
      bar.style.width = '100%'; pctEl.textContent = '100%';
      resetProg();
      document.getElementById('protoUpdateModal').classList.remove('show');
      toast('版本已更新！');
      pendingUpdateFile = null; pendingUpdateFolderFiles = null;
      // Optimistic local update for the updated proto
      const idx = userProtos.findIndex(p => p.protoId === editingProtoId);
      if (idx >= 0) {
        const p = userProtos[idx];
        const newVer = { v: result.version ?? (p.version ?? 1) + 1, at: Date.now(), files: result.fileCount ?? result.safePaths?.length ?? 0, size: result.totalSize ?? 0 };
        p.version    = newVer.v;
        p.fileCount  = result.fileCount ?? result.safePaths?.length ?? p.fileCount;
        p.totalSize  = result.totalSize ?? p.totalSize;
        p.updatedAt  = Date.now();
        p.versions   = [...(p.versions ?? []), newVer];
        if (p.versions.length > 20) p.versions = p.versions.slice(p.versions.length - 20);
        if (result.entryPoint) p.entryPoint = result.entryPoint;
      }
      renderProtos();
    } catch(e) {
      resetProg();
      document.getElementById('puErr').textContent = e.message || '上传失败';
      document.getElementById('protoUpdateUpload').disabled = false;
    }
  });

  ['protoUpdateClose','protoUpdateCancel'].forEach(id =>
    document.getElementById(id).addEventListener('click', () => document.getElementById('protoUpdateModal').classList.remove('show'))
  );

  // ── Change Password ──
  function closeChangePwdModal() { document.getElementById('changePwdModal').classList.remove('show'); }
  ['changePwdClose','changePwdCancel'].forEach(id =>
    document.getElementById(id).addEventListener('click', closeChangePwdModal)
  );
  document.getElementById('changePwdModal').addEventListener('click', e => {
    if (e.target === document.getElementById('changePwdModal')) closeChangePwdModal();
  });
  document.getElementById('changePwdSave').addEventListener('click', async () => {
    const cur = document.getElementById('cpCurrent').value;
    const nw  = document.getElementById('cpNew').value;
    const cf  = document.getElementById('cpConfirm').value;
    const errEl = document.getElementById('cpErr');
    errEl.textContent = '';
    if (!cur || !nw || !cf) { errEl.textContent = '请填写所有字段'; return; }
    if (nw.length < 6)      { errEl.textContent = '新密码至少 6 位'; return; }
    if (nw !== cf)          { errEl.textContent = '两次输入的新密码不一致'; return; }
    const btn = document.getElementById('changePwdSave');
    btn.disabled = true; btn.textContent = '保存中…';
    try {
      const res = await fetch('/auth/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ currentPassword: cur, newPassword: nw }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { errEl.textContent = d.error || '修改失败'; return; }
      toast('密码已修改');
      closeChangePwdModal();
    } finally {
      btn.disabled = false; btn.textContent = '确认修改';
    }
  });

  // ── Utils ──
  function cp(text, btn) { navigator.clipboard.writeText(text).then(() => { if(btn){const o=btn.textContent;btn.textContent='✓';setTimeout(()=>btn.textContent=o,1400);} }); }
  function toast(msg, type) {
    const t = document.getElementById('toast');
    t.className = 'toast show' + (type ? ' t-' + type : '');
    t.textContent = msg;
    clearTimeout(t._tid);
    t._tid = setTimeout(() => t.classList.remove('show'), 2600);
  }
  function skelCards(el, n) {
    if (!el) return;
    el.innerHTML = Array.from({ length: n }, () =>
      '<div class="skel-card"><div class="skel skel-thumb"></div><div class="skel-meta"><div class="skel skel-line" style="width:80%"></div><div class="skel skel-line" style="width:50%"></div></div></div>'
    ).join('');
  }
  function skelRows(el, n) {
    if (!el) return;
    el.innerHTML = Array.from({ length: n }, () => '<div class="skel skel-row"></div>').join('');
  }
  function fmtSize(b) { if(b<1024) return b+' B'; if(b<1048576) return (b/1024).toFixed(1)+' KB'; return (b/1048576).toFixed(1)+' MB'; }
  function fmtDate(ms) { if(!ms) return '—'; return new Date(ms).toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit',year:'2-digit'}); }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  document.addEventListener('keydown', e => {
    const lb = document.getElementById('lightbox');
    if (e.key === 'Escape') {
      lb.classList.remove('show'); closePageModal();
      ['protoEditModal','protoUpdateModal','userProtoVersionModal','trashModal','tagModal','projectModal','groupModal','importModal'].forEach(id => {
        const el = document.getElementById(id); if (el) el.classList.remove('show');
      });
      closeChangePwdModal();
      document.getElementById('loginOverlay').style.display = 'none';
    }
    if (!lb.classList.contains('show')) return;
    if (e.key === 'ArrowLeft')  lbNavigate(-1);
    if (e.key === 'ArrowRight') lbNavigate(1);
  });
  // Paste upload
  document.addEventListener('paste', e => {
    if (!token) return;
    if (document.activeElement && ['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
    const items = [...(e.clipboardData?.items || [])];
    const imgItems = items.filter(i => i.type.startsWith('image/'));
    if (!imgItems.length) return;
    const files = imgItems.map(i => i.getAsFile()).filter(Boolean);
    if (!files.length) return;
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'upload'));
    document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-upload'));
    setFiles(files);
    toast('已从剪贴板粘贴 ' + files.length + ' 张图片，点击上传');
  });
  document.getElementById('loginOverlay').addEventListener('click', e => { if (e.target === document.getElementById('loginOverlay')) document.getElementById('loginOverlay').style.display = 'none'; });
</script>
<script type="text/plain" id="fflateSrc">${FFLATE_UMD}</script>
</body>
</html>`;
}
