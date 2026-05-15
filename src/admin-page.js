export function renderAdminPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Onimg Admin</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/vditor/dist/index.css">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0a0a0a; color: #e0e0e0; min-height: 100vh; }

    /* Login */
    #loginScreen { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
    .login-card { width: 100%; max-width: 380px; background: #111; border: 1px solid #1e1e1e; border-radius: 16px; padding: 40px 36px; }
    .login-logo { font-size: 1.4rem; font-weight: 700; margin-bottom: 4px; }
    .login-sub { font-size: .85rem; color: #555; margin-bottom: 32px; }
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    .field label { font-size: .8rem; color: #777; font-weight: 500; }
    .field input, .field select { padding: 10px 12px; background: #0a0a0a; border: 1px solid #222; border-radius: 8px; color: #e0e0e0; font-size: .9rem; outline: none; transition: border .15s; }
    .field input:focus, .field select:focus { border-color: #3b82f6; }
    .btn-login { width: 100%; padding: 11px; background: #3b82f6; color: #fff; border: none; border-radius: 8px; font-size: .95rem; font-weight: 600; cursor: pointer; margin-top: 8px; transition: background .15s; }
    .btn-login:hover { background: #2563eb; }
    .btn-login:disabled { background: #1e3a5f; color: #4b7bb5; cursor: not-allowed; }
    .login-err { color: #ef4444; font-size: .82rem; margin-top: 10px; text-align: center; min-height: 18px; }

    /* Shell */
    #adminApp { display: none; }
    .shell { display: flex; min-height: 100vh; }
    aside { width: 220px; flex-shrink: 0; background: #0f0f0f; border-right: 1px solid #1a1a1a; display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; z-index: 10; }
    .sidebar-logo { padding: 22px 20px 16px; font-size: 1.1rem; font-weight: 700; border-bottom: 1px solid #1a1a1a; display: flex; align-items: center; gap: 8px; }
    .sidebar-logo span { font-size: .7rem; font-weight: 400; color: #555; background: #1a1a1a; padding: 2px 6px; border-radius: 4px; }
    nav { flex: 1; padding: 12px 10px; display: flex; flex-direction: column; gap: 2px; }
    .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 8px; cursor: pointer; font-size: .88rem; color: #666; transition: all .15s; border: none; background: none; width: 100%; text-align: left; }
    .nav-item:hover { background: #161616; color: #ccc; }
    .nav-item.active { background: #1a1a1a; color: #fff; }
    .nav-icon { width: 20px; text-align: center; }
    .sidebar-footer { padding: 12px 10px; border-top: 1px solid #1a1a1a; }
    .user-badge { display: flex; align-items: center; gap: 10px; padding: 10px 12px; }
    .avatar { width: 30px; height: 30px; background: #1e3a5f; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: .85rem; color: #3b82f6; font-weight: 700; flex-shrink: 0; }
    .user-info { flex: 1; min-width: 0; }
    .user-name { font-size: .82rem; font-weight: 500; }
    .user-role { font-size: .72rem; color: #555; }
    .btn-logout { padding: 6px 10px; background: none; border: 1px solid #222; border-radius: 6px; color: #555; cursor: pointer; font-size: .78rem; }
    .btn-logout:hover { border-color: #ef4444; color: #ef4444; }
    .main-content { flex: 1; margin-left: 220px; padding: 28px 32px; min-width: 0; }
    .section { display: none; }
    .section.active { display: block; }
    .page-title { font-size: 1.3rem; font-weight: 700; margin-bottom: 6px; }
    .page-sub { font-size: .85rem; color: #555; margin-bottom: 28px; }

    /* Buttons */
    .btn { padding: 7px 14px; border: none; border-radius: 7px; font-size: .82rem; font-weight: 600; cursor: pointer; transition: all .15s; }
    .btn-ghost { background: #1a1a1a; color: #aaa; }
    .btn-ghost:hover { background: #222; color: #fff; }
    .btn-danger { background: rgba(239,68,68,.15); color: #ef4444; }
    .btn-danger:hover { background: rgba(239,68,68,.25); }
    .btn-primary { background: #3b82f6; color: #fff; }
    .btn-primary:hover { background: #2563eb; }
    .btn-warn { background: rgba(245,158,11,.15); color: #f59e0b; }
    .btn-warn:hover { background: rgba(245,158,11,.25); }

    /* Stats */
    .stats-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(175px, 1fr)); gap: 14px; margin-bottom: 32px; }
    .stat-card { background: #111; border: 1px solid #1a1a1a; border-radius: 12px; padding: 20px; }
    .stat-label { font-size: .78rem; color: #555; margin-bottom: 8px; }
    .stat-value { font-size: 1.8rem; font-weight: 700; line-height: 1; }
    .stat-unit { font-size: .85rem; color: #777; margin-top: 4px; }

    /* Section header */
    .section-header { display: flex; align-items: center; margin-bottom: 16px; }
    .section-header h3 { font-size: .95rem; font-weight: 600; }
    .section-header .spacer { flex: 1; }

    /* Top table */
    .data-table { width: 100%; border-collapse: collapse; font-size: .84rem; }
    .data-table th { text-align: left; padding: 8px 12px; color: #555; font-weight: 500; border-bottom: 1px solid #1a1a1a; }
    .data-table td { padding: 9px 12px; border-bottom: 1px solid #141414; vertical-align: middle; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: rgba(255,255,255,.015); }
    .top-thumb { width: 36px; height: 36px; object-fit: cover; border-radius: 5px; border: 1px solid #1e1e1e; cursor: pointer; }
    .view-count { font-weight: 700; color: #3b82f6; }
    .muted { color: #555; font-size: .78rem; }

    /* Gallery */
    .toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 18px; flex-wrap: wrap; }
    .search-input { padding: 8px 12px; background: #111; border: 1px solid #1e1e1e; border-radius: 8px; color: #e0e0e0; font-size: .85rem; outline: none; width: 220px; }
    .search-input:focus { border-color: #333; }
    .bulk-bar { display: none; align-items: center; gap: 10px; padding: 10px 14px; background: #111; border: 1px solid #1e1e1e; border-radius: 8px; margin-bottom: 14px; font-size: .85rem; }
    .bulk-bar.show { display: flex; }
    .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
    .gitem { background: #111; border: 1px solid #1a1a1a; border-radius: 10px; overflow: hidden; cursor: pointer; transition: border-color .15s; position: relative; }
    .gitem:hover { border-color: #333; }
    .gitem.selected { border-color: #3b82f6; }
    .gitem img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; background: #1a1a1a; }
    .gitem-info { padding: 8px 10px; }
    .gitem-key { font-size: .72rem; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .gitem-meta { display: flex; justify-content: space-between; margin-top: 3px; }
    .gitem-size { font-size: .68rem; color: #444; }
    .gitem-views { font-size: .68rem; color: #3b82f6; font-weight: 600; }
    .gitem-actions { display: flex; gap: 4px; margin-top: 6px; }
    .checkbox { position: absolute; top: 7px; left: 7px; width: 18px; height: 18px; border-radius: 4px; background: rgba(0,0,0,.65); border: 1.5px solid #444; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .15s; }
    .gitem:hover .checkbox, .gitem.selected .checkbox { opacity: 1; }
    .gitem.selected .checkbox { background: #3b82f6; border-color: #3b82f6; }
    .chk-svg { width: 10px; height: 10px; stroke: #fff; fill: none; stroke-width: 2.5; }
    .load-more-wrap { display: flex; justify-content: center; margin-top: 24px; }
    .empty { text-align: center; padding: 60px 0; color: #333; font-size: .9rem; }

    /* User management */
    .users-table-wrap { background: #111; border: 1px solid #1a1a1a; border-radius: 12px; overflow: hidden; }
    .perm-badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 4px; font-size: .72rem; font-weight: 500; }
    .perm-on  { background: rgba(34,197,94,.12); color: #22c55e; }
    .perm-off { background: rgba(100,100,100,.1); color: #555; }
    .perm-admin { background: rgba(59,130,246,.12); color: #3b82f6; }
    .badge-disabled { background: rgba(239,68,68,.12); color: #ef4444; padding: 2px 8px; border-radius: 4px; font-size: .72rem; }

    /* Settings */
    .settings-card { background: #111; border: 1px solid #1a1a1a; border-radius: 12px; padding: 24px; margin-bottom: 20px; }
    .settings-card h3 { font-size: .9rem; font-weight: 600; margin-bottom: 20px; color: #aaa; }
    .setting-row { display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #161616; gap: 16px; }
    .setting-row:last-child { border-bottom: none; }
    .setting-label { font-size: .85rem; color: #777; width: 200px; flex-shrink: 0; }
    .setting-ctrl { flex: 1; display: flex; align-items: center; gap: 10px; }
    .setting-ctrl input[type="number"], .setting-ctrl input[type="text"] { padding: 7px 10px; background: #0a0a0a; border: 1px solid #222; border-radius: 7px; color: #e0e0e0; font-size: .85rem; outline: none; width: 140px; }
    .setting-ctrl input:focus { border-color: #3b82f6; }
    .setting-hint { font-size: .75rem; color: #444; }
    .types-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .type-chip { display: flex; align-items: center; gap: 6px; padding: 5px 10px; background: #0f0f0f; border: 1px solid #222; border-radius: 6px; font-size: .78rem; cursor: pointer; transition: all .15s; }
    .type-chip.on { background: rgba(59,130,246,.1); border-color: #3b82f6; color: #3b82f6; }
    .save-row { display: flex; justify-content: flex-end; margin-top: 20px; }

    /* Modals */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.85); display: none; align-items: center; justify-content: center; z-index: 50; padding: 24px; }
    .modal-overlay.show { display: flex; }
    .modal { background: #111; border: 1px solid #1e1e1e; border-radius: 16px; width: 100%; max-width: 520px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; }
    .modal-header { display: flex; align-items: center; padding: 18px 20px; border-bottom: 1px solid #1a1a1a; flex-shrink: 0; }
    .modal-header h3 { font-size: 1rem; font-weight: 600; flex: 1; }
    .modal-close { background: #1a1a1a; border: 1px solid #222; color: #888; width: 32px; height: 32px; border-radius: 7px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; }
    .modal-close:hover { color: #fff; }
    .modal-body { overflow-y: auto; padding: 20px; flex: 1; }
    .modal-footer { padding: 14px 20px; border-top: 1px solid #1a1a1a; display: flex; gap: 8px; justify-content: flex-end; flex-shrink: 0; }
    .perm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 4px; }
    .perm-check { display: flex; align-items: center; gap: 8px; padding: 9px 12px; background: #0f0f0f; border: 1px solid #1e1e1e; border-radius: 8px; cursor: pointer; font-size: .84rem; }
    .perm-check input { width: 14px; height: 14px; cursor: pointer; accent-color: #3b82f6; }
    .perm-num-row { display: flex; align-items: center; gap: 10px; margin-top: 14px; }
    .perm-num-row label { font-size: .82rem; color: #777; width: 120px; flex-shrink: 0; }
    .perm-num-row input { padding: 7px 10px; background: #0a0a0a; border: 1px solid #222; border-radius: 7px; color: #e0e0e0; font-size: .85rem; outline: none; width: 100px; }
    .perm-hint { font-size: .72rem; color: #444; }

    /* Stats modal */
    .stats-modal { max-width: 680px; }
    .stat-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
    .summary-card { background: #0f0f0f; border: 1px solid #1a1a1a; border-radius: 10px; padding: 14px; text-align: center; }
    .summary-card .val { font-size: 1.5rem; font-weight: 700; }
    .summary-card .lbl { font-size: .72rem; color: #555; margin-top: 4px; }
    .country-bars h4, .access-log h4 { font-size: .82rem; color: #666; margin-bottom: 10px; font-weight: 500; }
    .country-row { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; font-size: .8rem; }
    .country-name { width: 40px; color: #aaa; font-family: monospace; }
    .bar-wrap { flex: 1; background: #1a1a1a; border-radius: 4px; height: 6px; }
    .bar { background: #3b82f6; height: 6px; border-radius: 4px; transition: width .4s; }
    .country-count { width: 30px; text-align: right; color: #555; }
    .log-table { width: 100%; border-collapse: collapse; font-size: .78rem; margin-top: 4px; }
    .log-table th { text-align: left; padding: 6px 10px; color: #555; font-weight: 500; border-bottom: 1px solid #1a1a1a; }
    .log-table td { padding: 7px 10px; border-bottom: 1px solid #141414; color: #888; font-family: monospace; }
    .access-log { margin-top: 20px; }

    /* R2 Panel */
    .r2-panel { background: #111; border: 1px solid #1a1a1a; border-radius: 12px; padding: 18px 20px; margin-bottom: 28px; }
    .r2-panel-hd { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
    .r2-panel-hd h3 { font-size: .88rem; font-weight: 600; }
    .r2-badge { font-size: .7rem; color: #555; background: #1a1a1a; padding: 2px 7px; border-radius: 4px; }
    .r2-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 1px; background: #1a1a1a; border-radius: 8px; overflow: hidden; }
    .r2-cell { background: #0d0d0d; padding: 13px 15px; }
    .r2-cell-lbl { font-size: .7rem; color: #555; margin-bottom: 5px; }
    .r2-cell-val { font-size: 1.35rem; font-weight: 700; line-height: 1; }
    .r2-cell-sub { font-size: .67rem; color: #444; margin-top: 3px; }
    .r2-free-bar { height: 3px; background: #1e1e1e; border-radius: 2px; margin-top: 6px; }
    .r2-free-fill { height: 3px; border-radius: 2px; background: #3b82f6; transition: width .5s; }

    /* Quota bars */
    .quota-bar { height: 4px; background: #1a1a1a; border-radius: 2px; margin-top: 3px; width: 90px; }
    .quota-fill { height: 4px; border-radius: 2px; background: #3b82f6; }
    .quota-fill.warn { background: #f59e0b; }
    .quota-fill.full { background: #ef4444; }

    /* Member Stats */
    .mb-summary { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .mb-card { background: #111; border: 1px solid #1a1a1a; border-radius: 10px; padding: 16px; }
    .mb-card-lbl { font-size: .72rem; color: #555; margin-bottom: 6px; }
    .mb-card-val { font-size: 1.65rem; font-weight: 700; line-height: 1; }
    .sort-th { cursor: pointer; user-select: none; }
    .sort-th:hover { color: #aaa; }

    /* Lightbox */
    .lightbox { position: fixed; inset: 0; background: rgba(0,0,0,.92); display: none; align-items: center; justify-content: center; z-index: 100; padding: 24px; }
    .lightbox.show { display: flex; }
    .lb-inner { background: #111; border: 1px solid #1e1e1e; border-radius: 14px; max-width: 760px; width: 100%; overflow: hidden; }
    .lb-img-wrap { background: #0a0a0a; display: flex; align-items: center; justify-content: center; min-height: 280px; max-height: 55vh; }
    .lb-img-wrap img { max-width: 100%; max-height: 55vh; object-fit: contain; display: block; }
    .lb-meta { padding: 16px 20px; }
    .lb-key { font-size: .88rem; color: #ccc; word-break: break-all; }
    .lb-detail { display: flex; gap: 14px; margin-top: 5px; font-size: .78rem; color: #555; }
    .lb-actions { display: flex; gap: 8px; margin-top: 14px; }
    .lb-close { position: absolute; top: 16px; right: 16px; background: #1a1a1a; border: 1px solid #222; color: #888; width: 34px; height: 34px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; }
    .lb-close:hover { color: #fff; }

    .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(80px); background: #1a1a1a; border: 1px solid #2a2a2a; color: #e0e0e0; padding: 9px 18px; border-radius: 8px; font-size: .83rem; transition: transform .25s; z-index: 300; white-space: nowrap; }
    .toast.show { transform: translateX(-50%) translateY(0); }

    /* Admin page editor Vditor */
    #apmVditor { border-radius: 8px; overflow: hidden; border: 1px solid #333; }
    #apmVditor .vditor-outline { display: none !important; }
    #apmVditor .vditor-content { height: calc(100% - 36px) !important; overflow-y: auto !important; overscroll-behavior: contain; }
    #apmVditor .vditor-toolbar { position: sticky !important; top: 0 !important; z-index: 10 !important; flex-wrap: nowrap; overflow-x: auto; }
  </style>
</head>
<body>

<!-- Login -->
<div id="loginScreen">
  <div class="login-card">
    <div class="login-logo">Onimg <span>Admin</span></div>
    <div class="login-sub">使用管理员账号登录</div>
    <div class="field"><label>用户名</label><input type="text" id="loginUser" placeholder="admin" autocomplete="username"></div>
    <div class="field"><label>密码</label><input type="password" id="loginPass" placeholder="••••••••" autocomplete="current-password"></div>
    <button class="btn-login" id="loginBtn">登录</button>
    <div class="login-err" id="loginErr"></div>
  </div>
</div>

<!-- App -->
<div id="adminApp">
  <div class="shell">
    <aside>
      <div class="sidebar-logo">Onimg <span>Admin</span></div>
      <nav>
        <button class="nav-item active" data-section="dashboard"><span class="nav-icon">▦</span>概览</button>
        <button class="nav-item" data-section="images"><span class="nav-icon">⊞</span>图库管理</button>
        <button class="nav-item" data-section="users"><span class="nav-icon">👤</span>用户管理</button>
        <button class="nav-item" data-section="pages"><span class="nav-icon">📄</span>页面管理</button>
        <button class="nav-item" data-section="members"><span class="nav-icon">📊</span>成员统计</button>
        <button class="nav-item" data-section="settings"><span class="nav-icon">⚙</span>系统设置</button>
      </nav>
      <div class="sidebar-footer">
        <div class="user-badge">
          <div class="avatar" id="avatarLetter">A</div>
          <div class="user-info">
            <div class="user-name" id="sidebarUsername">admin</div>
            <div class="user-role">Administrator</div>
          </div>
          <button class="btn-logout" id="logoutBtn">退出</button>
        </div>
      </div>
    </aside>

    <div class="main-content">
      <!-- Dashboard -->
      <div class="section active" id="section-dashboard">
        <div class="page-title">概览</div>
        <div class="page-sub">存储与访问统计</div>
        <div class="stats-row">
          <div class="stat-card"><div class="stat-label">图片总数</div><div class="stat-value" id="statImages">—</div><div class="stat-unit">张</div></div>
          <div class="stat-card"><div class="stat-label">存储用量</div><div class="stat-value" id="statSize">—</div><div class="stat-unit" id="statSizeUnit"></div></div>
          <div class="stat-card"><div class="stat-label">免费额度剩余</div><div class="stat-value" id="statFree">—</div><div class="stat-unit">GB / 10 GB</div></div>
          <div class="stat-card"><div class="stat-label">总访问次数</div><div class="stat-value" id="statViews">—</div><div class="stat-unit">次</div></div>
        </div>
        <div class="r2-panel">
          <div class="r2-panel-hd">
            <h3>R2 对象存储</h3>
            <span class="r2-badge">实时数据</span>
            <div style="flex:1"></div>
            <button class="btn btn-ghost" style="padding:4px 10px;font-size:.75rem" onclick="loadR2Stats()">刷新</button>
          </div>
          <div class="r2-grid">
            <div class="r2-cell">
              <div class="r2-cell-lbl">存储用量</div>
              <div class="r2-cell-val" id="r2Storage">—</div>
              <div class="r2-cell-sub">标准存储</div>
            </div>
            <div class="r2-cell">
              <div class="r2-cell-lbl">对象数量</div>
              <div class="r2-cell-val" id="r2Objects">—</div>
              <div class="r2-cell-sub">张</div>
            </div>
            <div class="r2-cell">
              <div class="r2-cell-lbl">A 类操作</div>
              <div class="r2-cell-val" id="r2Writes">—</div>
              <div class="r2-cell-sub">写入总计</div>
            </div>
            <div class="r2-cell">
              <div class="r2-cell-lbl">B 类操作</div>
              <div class="r2-cell-val" id="r2Reads">—</div>
              <div class="r2-cell-sub">读取总计</div>
            </div>
            <div class="r2-cell">
              <div class="r2-cell-lbl">免费额度</div>
              <div class="r2-cell-val" id="r2FreeGb">—</div>
              <div class="r2-cell-sub">/ 10 GB</div>
              <div class="r2-free-bar"><div class="r2-free-fill" id="r2FreeBar" style="width:0%"></div></div>
            </div>
            <div class="r2-cell">
              <div class="r2-cell-lbl">成员账号</div>
              <div class="r2-cell-val" id="r2Members">—</div>
              <div class="r2-cell-sub">注册用户</div>
            </div>
          </div>
        </div>
        <div class="section-header"><h3>访问最多</h3></div>
        <div style="background:#111;border:1px solid #1a1a1a;border-radius:12px;overflow:hidden">
          <table class="data-table">
            <thead><tr><th>图片</th><th>文件名</th><th>访问次数</th><th>最后访问</th><th></th></tr></thead>
            <tbody id="topImagesBody"><tr><td colspan="5" style="text-align:center;color:#333;padding:24px">加载中…</td></tr></tbody>
          </table>
        </div>
      </div>

      <!-- Images -->
      <div class="section" id="section-images">
        <div class="page-title">图库管理</div>
        <div class="page-sub">查看、删除图片及访问统计</div>
        <div class="toolbar">
          <input class="search-input" id="gallerySearch" type="text" placeholder="搜索文件名…">
          <div style="flex:1"></div>
          <button class="btn btn-ghost" id="selectAllBtn">全选</button>
          <button class="btn btn-ghost" id="refreshGallery">刷新</button>
        </div>
        <div class="bulk-bar" id="bulkBar">
          <span id="bulkCount"></span><div style="flex:1"></div>
          <button class="btn btn-ghost" id="bulkCopyBtn">批量复制</button>
          <button class="btn btn-danger" id="bulkDeleteBtn">批量删除</button>
          <button class="btn btn-ghost" id="clearSelectBtn">取消</button>
        </div>
        <div class="gallery-grid" id="galleryGrid"></div>
        <div class="empty" id="galleryEmpty" style="display:none">暂无图片</div>
        <div class="load-more-wrap" id="loadMoreWrap" style="display:none">
          <button class="btn btn-ghost" id="loadMoreBtn">加载更多</button>
        </div>
      </div>

      <!-- Users -->
      <div class="section" id="section-users">
        <div class="page-title">用户管理</div>
        <div class="page-sub">创建账号并设置上传权限</div>
        <div class="section-header">
          <h3>所有账号</h3>
          <div class="spacer"></div>
          <button class="btn btn-primary" id="createUserBtn">+ 新建用户</button>
        </div>
        <div class="users-table-wrap">
          <table class="data-table">
            <thead><tr><th>用户名</th><th>权限</th><th>上传统计</th><th>限制</th><th>操作</th></tr></thead>
            <tbody id="usersBody"><tr><td colspan="5" style="text-align:center;color:#333;padding:24px">加载中…</td></tr></tbody>
          </table>
        </div>
      </div>

      <!-- Pages -->
      <div class="section" id="section-pages">
        <div class="page-title">页面管理</div>
        <div class="page-sub">托管的 MD / HTML 文档</div>
        <div class="section-header">
          <h3>所有页面</h3>
          <div class="spacer"></div>
          <button class="btn btn-primary" id="adminNewPageBtn">+ 新建页面</button>
        </div>
        <div style="background:#111;border:1px solid #1a1a1a;border-radius:12px;overflow:hidden">
          <table class="data-table">
            <thead><tr><th>标题 / Slug</th><th>类型</th><th>作者</th><th>状态</th><th>更新</th><th></th></tr></thead>
            <tbody id="adminPagesBody"><tr><td colspan="6" style="text-align:center;color:#333;padding:24px">加载中…</td></tr></tbody>
          </table>
        </div>
      </div>

      <!-- Settings -->
      <div class="section" id="section-settings">
        <div class="page-title">系统设置</div>
        <div class="page-sub">上传限制与文件类型配置</div>

        <div class="settings-card">
          <h3>上传限制</h3>
          <div class="setting-row">
            <div class="setting-label">单文件最大大小</div>
            <div class="setting-ctrl">
              <input type="number" id="cfgSize" min="1" max="100" step="1" value="10">
              <span style="font-size:.85rem;color:#666">MB</span>
              <span class="setting-hint">（当前：<span id="cfgSizeDisplay">—</span>）</span>
            </div>
          </div>
          <div class="setting-row" style="flex-direction:column;align-items:flex-start;gap:12px;">
            <div class="setting-label">允许的文件类型</div>
            <div class="types-grid" id="typesGrid"></div>
          </div>
          <div class="save-row">
            <button class="btn btn-primary" id="saveConfigBtn">保存设置</button>
          </div>
        </div>

        <div class="settings-card">
          <h3>密钥管理</h3>
          <div class="setting-row">
            <div class="setting-label">管理员账号</div>
            <div class="setting-ctrl" style="font-family:monospace;font-size:.85rem;color:#22c55e" id="cfgAdminUser">—</div>
          </div>
          <div class="setting-row" style="flex-direction:column;align-items:flex-start;gap:8px;">
            <div class="setting-label">更新密钥（终端执行）</div>
            <div style="font-family:monospace;font-size:.78rem;color:#555;line-height:2.2">
              npx wrangler secret put ADMIN_PASSWORD<br>
              npx wrangler secret put TOKEN_SECRET
            </div>
          </div>
        </div>
      </div>

      <!-- Members -->
      <div class="section" id="section-members">
        <div class="page-title">成员统计</div>
        <div class="page-sub">成员账号的详细上传与配额数据</div>
        <div class="mb-summary">
          <div class="mb-card"><div class="mb-card-lbl">注册成员</div><div class="mb-card-val" id="mbTotal">—</div></div>
          <div class="mb-card"><div class="mb-card-lbl">今日活跃</div><div class="mb-card-val" id="mbActive">—</div></div>
          <div class="mb-card"><div class="mb-card-lbl">今日上传合计</div><div class="mb-card-val" id="mbSumToday">—</div></div>
          <div class="mb-card"><div class="mb-card-lbl">总上传合计</div><div class="mb-card-val" id="mbSumTotal">—</div></div>
        </div>
        <div style="display:flex;align-items:center;margin-bottom:14px;gap:8px">
          <h3 style="font-size:.95rem;font-weight:600">成员列表</h3>
          <div style="flex:1"></div>
          <button class="btn btn-ghost" onclick="loadMemberStats()">刷新</button>
        </div>
        <div style="background:#111;border:1px solid #1a1a1a;border-radius:12px;overflow:hidden">
          <table class="data-table">
            <thead><tr>
              <th class="sort-th" onclick="memberSort('name')">用户名</th>
              <th>状态</th>
              <th class="sort-th" onclick="memberSort('today')">今日上传 / 日限</th>
              <th class="sort-th" onclick="memberSort('total')">累计上传 / 总限</th>
              <th class="sort-th" onclick="memberSort('pages')" style="text-align:center">页面数</th>
              <th>权限</th>
              <th class="sort-th" onclick="memberSort('created')">注册时间</th>
            </tr></thead>
            <tbody id="memberTableBody"><tr><td colspan="7" style="text-align:center;color:#333;padding:32px">加载中…</td></tr></tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Create / Edit User Modal -->
<div class="modal-overlay" id="userModal">
  <div class="modal">
    <div class="modal-header">
      <h3 id="userModalTitle">新建用户</h3>
      <button class="modal-close" id="userModalClose">✕</button>
    </div>
    <div class="modal-body">
      <div class="field" id="fieldUsername"><label>用户名 <span style="color:#555">(字母/数字/_- 2-32位)</span></label><input type="text" id="umUsername" placeholder="alice"></div>
      <div class="field" id="fieldPassword"><label id="umPassLabel">密码</label><input type="password" id="umPassword" placeholder="留空则不修改"></div>
      <div class="field" style="margin-top:4px"><label style="margin-bottom:8px;display:block">权限</label>
        <div class="perm-grid">
          <label class="perm-check"><input type="checkbox" id="pmUpload" checked><span>允许上传</span></label>
          <label class="perm-check"><input type="checkbox" id="pmDelete"><span>允许删除</span></label>
          <label class="perm-check"><input type="checkbox" id="pmEdit"><span>允许编辑</span></label>
          <label class="perm-check"><input type="checkbox" id="pmDisabled"><span>禁用账号</span></label>
        </div>
        <div class="perm-num-row">
          <label>上传总量上限</label>
          <input type="number" id="pmMaxTotal" value="100" min="-1">
          <span class="perm-hint">（-1 = 无限制）</span>
        </div>
        <div class="perm-num-row">
          <label>每日上传上限</label>
          <input type="number" id="pmDailyLimit" value="20" min="-1">
          <span class="perm-hint">（-1 = 无限制）</span>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" id="userModalCancel">取消</button>
      <button class="btn btn-primary" id="userModalSave">创建</button>
    </div>
  </div>
</div>

<!-- Admin Page Editor Modal -->
<div class="modal-overlay" id="adminPageModal">
  <div class="modal" style="max-width:860px;max-height:96vh;display:flex;flex-direction:column">
    <div class="modal-header">
      <h3>页面编辑</h3>
      <button class="modal-close" id="apmClose">✕</button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:12px;min-height:0">
      <div class="field"><label>标题</label><input type="text" id="apmTitle" placeholder="My Page"></div>
      <div class="field">
        <label>Slug（URL 后缀）</label>
        <input type="text" id="apmSlug" placeholder="my-blog-post">
        <span style="font-size:.72rem;color:#444;margin-top:4px">访问地址：<span id="apmSlugPreview" style="color:#3b82f6"></span></span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="field"><label>类型</label><select id="apmType"><option value="markdown">Markdown</option><option value="html">HTML</option></select></div>
        <div class="field"><label style="display:flex;align-items:center;gap:8px;margin-top:26px;cursor:pointer"><input type="checkbox" id="apmPublic" checked> 公开访问</label></div>
      </div>
      <div class="field" style="flex:1;display:flex;flex-direction:column;min-height:0">
        <label>内容</label>
        <div id="apmVditor" style="display:none"></div>
        <textarea id="apmContent" rows="14" style="resize:vertical;min-height:200px;font-family:monospace;font-size:.82rem;padding:10px 12px;background:#0a0a0a;border:1px solid #222;border-radius:8px;color:#e0e0e0;outline:none;width:100%" placeholder="# Hello\n\n内容…"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" id="apmCancel">取消</button>
      <button class="btn btn-primary" id="apmSave">创建</button>
    </div>
  </div>
</div>

<!-- Image Stats Modal -->
<div class="modal-overlay" id="statsModal">
  <div class="modal stats-modal">
    <div class="modal-header">
      <h3>访问统计 <span style="font-size:.72rem;color:#555;font-weight:400" id="statsModalKey"></span></h3>
      <button class="modal-close" id="statsModalClose">✕</button>
    </div>
    <div class="modal-body">
      <div class="stat-summary">
        <div class="summary-card"><div class="val" id="smTotal">—</div><div class="lbl">总访问次数</div></div>
        <div class="summary-card"><div class="val" id="smCountries">—</div><div class="lbl">国家/地区</div></div>
        <div class="summary-card"><div class="val" id="smLast">—</div><div class="lbl">最后访问</div></div>
      </div>
      <div class="country-bars"><h4>国家 / 地区分布</h4><div id="countryBars"></div></div>
      <div class="access-log">
        <h4>最近访问记录</h4>
        <table class="log-table">
          <thead><tr><th>时间</th><th>IP</th><th>国家</th><th>城市</th><th>ISP</th></tr></thead>
          <tbody id="accessLogBody"></tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<!-- Lightbox -->
<div class="lightbox" id="lightbox">
  <button class="lb-close" id="lbClose">✕</button>
  <div class="lb-inner">
    <div class="lb-img-wrap"><img id="lbImg" src="" alt=""></div>
    <div class="lb-meta">
      <div class="lb-key" id="lbKey"></div>
      <div class="lb-detail"><span id="lbSize"></span><span id="lbDate"></span></div>
      <div class="lb-actions">
        <button class="btn btn-ghost" id="lbCopy">复制链接</button>
        <button class="btn btn-ghost" id="lbMd">复制 MD</button>
        <button class="btn btn-ghost" id="lbStats">访问统计</button>
        <div style="flex:1"></div>
        <button class="btn btn-danger" id="lbDelete">删除</button>
      </div>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
  const TOKEN_KEY = 'onimg_admin_token';
  const USER_KEY  = 'onimg_admin_user';
  const ALL_TYPES = ['image/jpeg','image/png','image/gif','image/webp','image/svg+xml','image/avif','image/bmp','image/tiff'];
  const TYPE_LABELS = { 'image/jpeg':'JPG','image/png':'PNG','image/gif':'GIF','image/webp':'WebP','image/svg+xml':'SVG','image/avif':'AVIF','image/bmp':'BMP','image/tiff':'TIFF' };

  let adminToken = localStorage.getItem(TOKEN_KEY);
  let adminUser  = localStorage.getItem(USER_KEY) || 'admin';
  let allImages = [], allStats = {}, galleryCursor = null, selected = new Set(), lbKey = null;
  let editingUser = null;
  let apmVditorInst = null;

  const authH = () => ({ 'Authorization': 'Bearer ' + adminToken, 'Content-Type': 'application/json' });

  if (adminToken) showApp(); else showLogin();

  function showLogin() { document.getElementById('loginScreen').style.display = 'flex'; document.getElementById('adminApp').style.display = 'none'; }
  function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminApp').style.display = 'block';
    document.getElementById('sidebarUsername').textContent = adminUser;
    document.getElementById('avatarLetter').textContent = adminUser[0].toUpperCase();
    loadDashboard();
    loadR2Stats();
    loadSettings();
  }

  // Login
  const loginBtn = document.getElementById('loginBtn');
  document.getElementById('loginPass').addEventListener('keydown', e => { if (e.key === 'Enter') loginBtn.click(); });
  loginBtn.addEventListener('click', async () => {
    const u = document.getElementById('loginUser').value.trim(), p = document.getElementById('loginPass').value;
    const err = document.getElementById('loginErr');
    if (!u || !p) { err.textContent = '请填写账号和密码'; return; }
    loginBtn.disabled = true; err.textContent = '';
    try {
      const res = await fetch('/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:u,password:p}) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      adminToken = data.token; adminUser = data.username || u;
      localStorage.setItem(TOKEN_KEY, adminToken); localStorage.setItem(USER_KEY, adminUser);
      showApp();
    } catch(e) { err.textContent = e.message || '登录失败'; }
    loginBtn.disabled = false;
  });
  document.getElementById('logoutBtn').addEventListener('click', () => { localStorage.removeItem(TOKEN_KEY); adminToken = null; showLogin(); });

  // Nav
  document.querySelectorAll('.nav-item[data-section]').forEach(btn => {
    btn.addEventListener('click', () => switchSection(btn.dataset.section));
  });
  function switchSection(name) {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.section === name));
    document.querySelectorAll('.section').forEach(s => s.classList.toggle('active', s.id === 'section-' + name));
    if (name === 'images' && !allImages.length) loadGallery(true);
    if (name === 'users') loadUsers();
    if (name === 'pages') loadAdminPages();
    if (name === 'members') loadMemberStats();
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  async function loadDashboard() {
    const [sRes, iRes] = await Promise.all([
      fetch('/admin/stats', { headers: authH() }),
      fetch('/admin/all-image-stats', { headers: authH() }),
    ]);
    if (sRes.status === 401) { handleUnauth(); return; }
    const { totalImages, totalSize } = await sRes.json();
    const { stats } = await iRes.json();
    allStats = stats;
    document.getElementById('statImages').textContent = totalImages.toLocaleString();
    const { val, unit } = fmtSizeParts(totalSize);
    document.getElementById('statSize').textContent = val;
    document.getElementById('statSizeUnit').textContent = unit;
    document.getElementById('statFree').textContent = Math.max(0, 10 - totalSize/1073741824).toFixed(2);
    document.getElementById('statViews').textContent = Object.values(stats).reduce((s,v) => s+(v.count??0), 0).toLocaleString();

    const sorted = Object.entries(stats).sort((a,b) => (b[1].count??0)-(a[1].count??0)).slice(0,10);
    document.getElementById('topImagesBody').innerHTML = sorted.length
      ? sorted.map(([k,s]) => \`<tr>
          <td><img class="top-thumb" src="\${origin}/\${k}" loading="lazy" onclick="openLightbox('\${k}')"></td>
          <td style="font-family:monospace;font-size:.78rem;color:#888">\${k}</td>
          <td class="view-count">\${(s.count??0).toLocaleString()}</td>
          <td class="muted">\${s.lastAccess ? timeAgo(s.lastAccess) : '—'}</td>
          <td><button class="btn btn-ghost" style="padding:4px 8px;font-size:.75rem" onclick="openStatsModal('\${k}')">详情</button></td>
        </tr>\`).join('')
      : '<tr><td colspan="5" style="text-align:center;color:#333;padding:24px">暂无访问记录</td></tr>';
  }

  // ── Gallery ─────────────────────────────────────────────────────────────────
  async function loadGallery(reset = false) {
    if (reset) { allImages = []; galleryCursor = null; selected.clear(); updateBulkBar(); }
    if (!Object.keys(allStats).length) {
      const r = await fetch('/admin/all-image-stats', { headers: authH() });
      if (r.ok) allStats = (await r.json()).stats;
    }
    const url = '/list?limit=50' + (galleryCursor ? '&cursor=' + encodeURIComponent(galleryCursor) : '');
    const res = await fetch(url, { headers: authH() });
    if (res.status === 401) { handleUnauth(); return; }
    const data = await res.json();
    allImages = reset ? data.items : [...allImages, ...data.items];
    galleryCursor = data.cursor;
    document.getElementById('loadMoreWrap').style.display = data.cursor ? 'flex' : 'none';
    renderGallery();
  }

  document.getElementById('gallerySearch').addEventListener('input', renderGallery);
  document.getElementById('refreshGallery').addEventListener('click', () => { allStats = {}; loadGallery(true); });
  document.getElementById('loadMoreBtn').addEventListener('click', () => loadGallery(false));
  document.getElementById('selectAllBtn').addEventListener('click', () => { filtered().forEach(i => selected.add(i.key)); updateBulkBar(); renderGallery(); });
  document.getElementById('clearSelectBtn').addEventListener('click', () => { selected.clear(); updateBulkBar(); renderGallery(); });
  document.getElementById('bulkCopyBtn').addEventListener('click', () => {
    navigator.clipboard.writeText([...selected].map(k => origin+'/'+k).join('\\n'));
    toast('已复制 ' + selected.size + ' 条链接');
  });
  document.getElementById('bulkDeleteBtn').addEventListener('click', async () => {
    if (!confirm(\`确认删除选中的 \${selected.size} 张图片？\`)) return;
    for (const k of [...selected]) await doDelete(k);
    allImages = allImages.filter(i => !selected.has(i.key));
    selected.clear(); updateBulkBar(); renderGallery(); toast('已删除');
  });

  function filtered() {
    const q = document.getElementById('gallerySearch').value.toLowerCase();
    return q ? allImages.filter(i => i.key.toLowerCase().includes(q)) : allImages;
  }
  function renderGallery() {
    const items = filtered();
    document.getElementById('galleryEmpty').style.display = items.length ? 'none' : 'block';
    document.getElementById('galleryGrid').innerHTML = items.map(item => {
      const views = allStats[item.key]?.count ?? 0;
      return \`<div class="gitem\${selected.has(item.key)?' selected':''}" onclick="handleGitem(event,'\${item.key}')">
        <div class="checkbox"><svg class="chk-svg" viewBox="0 0 12 12"><polyline points="1.5,6 5,9.5 10.5,2.5"/></svg></div>
        <img src="\${origin}/\${item.key}" loading="lazy">
        <div class="gitem-info">
          <div class="gitem-key">\${item.key}</div>
          <div class="gitem-meta"><span class="gitem-size">\${fmtSize(item.size)}</span><span class="gitem-views">\${views?views+' 次':''}</span></div>
          <div class="gitem-actions">
            <button class="btn btn-ghost" style="padding:3px 8px;font-size:.7rem" onclick="event.stopPropagation();copyText('\${origin}/\${item.key}',this)">复制</button>
            <button class="btn btn-ghost" style="padding:3px 8px;font-size:.7rem" onclick="event.stopPropagation();openStatsModal('\${item.key}')">统计</button>
            <button class="btn btn-danger" style="padding:3px 8px;font-size:.7rem" onclick="event.stopPropagation();deleteSingle('\${item.key}')">删除</button>
          </div>
        </div>
      </div>\`;
    }).join('');
  }
  function handleGitem(e, key) { if (e.target.closest('button')) return; if (selected.size > 0 || e.target.closest('.checkbox')) { toggleSel(key); } else { openLightbox(key); } }
  function toggleSel(key) { if (selected.has(key)) selected.delete(key); else selected.add(key); updateBulkBar(); renderGallery(); }
  function updateBulkBar() { const n=selected.size; document.getElementById('bulkBar').className='bulk-bar'+(n?' show':''); document.getElementById('bulkCount').textContent='已选 '+n+' 张'; }
  async function deleteSingle(key) { if (!confirm('确认删除？')) return; await doDelete(key); allImages=allImages.filter(i=>i.key!==key); selected.delete(key); updateBulkBar(); renderGallery(); toast('已删除'); }
  async function doDelete(key) { await fetch('/delete/'+key, { method:'DELETE', headers:authH() }); }

  // ── User Management ──────────────────────────────────────────────────────────
  async function loadUsers() {
    document.getElementById('usersBody').innerHTML = '<tr><td colspan="5" style="text-align:center;color:#333;padding:24px">加载中…</td></tr>';
    const res = await fetch('/admin/users', { headers: authH() });
    if (!res.ok) return;
    const { users } = await res.json();
    renderUsers(users);
  }

  function renderUsers(users) {
    document.getElementById('usersBody').innerHTML = users.map(u => {
      const p = u.permissions;
      const perms = u.isAdmin
        ? \`<span class="perm-badge perm-admin">超级管理员</span>\`
        : [
            p.canUpload ? '<span class="perm-badge perm-on">上传</span>' : '<span class="perm-badge perm-off">禁止上传</span>',
            p.canDelete ? '<span class="perm-badge perm-on">删除</span>' : '',
            p.canEdit   ? '<span class="perm-badge perm-on">编辑</span>' : '',
          ].filter(Boolean).join(' ');
      const quota = u.isAdmin ? '<span style="color:#555">—</span>' : (u.quota ? \`今日 \${u.quota.daily} 次 · 共 \${u.quota.total} 次\` : '—');
      const limits = u.isAdmin ? '<span style="color:#555">无限制</span>' : \`每日 \${p.dailyUploadLimit===-1?'∞':p.dailyUploadLimit} · 总量 \${p.maxTotalUploads===-1?'∞':p.maxTotalUploads}\`;
      const disabled = u.disabled ? '<span class="badge-disabled">已禁用</span> ' : '';
      const actions = u.isAdmin ? '' : \`
        <button class="btn btn-ghost" style="padding:4px 8px;font-size:.75rem" onclick="openEditUser('\${u.username}')">编辑</button>
        <button class="btn btn-danger" style="padding:4px 8px;font-size:.75rem" onclick="deleteUser('\${u.username}')">删除</button>\`;
      return \`<tr>
        <td style="font-weight:500">\${disabled}\${u.username}</td>
        <td>\${perms}</td>
        <td class="muted">\${quota}</td>
        <td class="muted">\${limits}</td>
        <td>\${actions}</td>
      </tr>\`;
    }).join('') || '<tr><td colspan="5" style="text-align:center;color:#333;padding:24px">暂无用户</td></tr>';
  }

  document.getElementById('createUserBtn').addEventListener('click', () => openUserModal(null));

  function openUserModal(username) {
    editingUser = username;
    const isEdit = !!username;
    document.getElementById('userModalTitle').textContent = isEdit ? '编辑用户: ' + username : '新建用户';
    document.getElementById('fieldUsername').style.display = isEdit ? 'none' : '';
    document.getElementById('umPassLabel').textContent = isEdit ? '新密码（留空不修改）' : '密码';
    document.getElementById('umUsername').value = '';
    document.getElementById('umPassword').value = '';
    document.getElementById('pmUpload').checked = true;
    document.getElementById('pmDelete').checked = false;
    document.getElementById('pmEdit').checked = false;
    document.getElementById('pmDisabled').checked = false;
    document.getElementById('pmMaxTotal').value = 100;
    document.getElementById('pmDailyLimit').value = 20;
    document.getElementById('userModalSave').textContent = isEdit ? '保存' : '创建';
    document.getElementById('userModal').classList.add('show');
  }

  function openEditUser(username) {
    // Fetch user info to pre-fill
    fetch('/admin/users', { headers: authH() }).then(r => r.json()).then(({ users }) => {
      const u = users.find(x => x.username === username);
      if (!u) return;
      openUserModal(username);
      document.getElementById('pmUpload').checked  = u.permissions.canUpload;
      document.getElementById('pmDelete').checked  = u.permissions.canDelete;
      document.getElementById('pmEdit').checked    = u.permissions.canEdit;
      document.getElementById('pmDisabled').checked = u.disabled;
      document.getElementById('pmMaxTotal').value   = u.permissions.maxTotalUploads;
      document.getElementById('pmDailyLimit').value = u.permissions.dailyUploadLimit;
    });
  }

  document.getElementById('userModalSave').addEventListener('click', async () => {
    const isEdit = !!editingUser;
    const username = isEdit ? editingUser : document.getElementById('umUsername').value.trim();
    const password = document.getElementById('umPassword').value;
    const permissions = {
      canUpload: document.getElementById('pmUpload').checked,
      canDelete: document.getElementById('pmDelete').checked,
      canEdit:   document.getElementById('pmEdit').checked,
      maxTotalUploads:  parseInt(document.getElementById('pmMaxTotal').value),
      dailyUploadLimit: parseInt(document.getElementById('pmDailyLimit').value),
    };
    const disabled = document.getElementById('pmDisabled').checked;
    if (!isEdit && !password) { toast('请设置密码'); return; }

    const body = isEdit ? { permissions, disabled, ...(password ? { password } : {}) } : { username, password, permissions };
    const res = await fetch(isEdit ? '/admin/users/' + encodeURIComponent(username) : '/admin/users', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: authH(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { toast('操作失败: ' + data.error); return; }
    document.getElementById('userModal').classList.remove('show');
    toast(isEdit ? '已更新' : '用户已创建');
    loadUsers();
  });

  async function deleteUser(username) {
    if (!confirm(\`确认删除用户 "\${username}"？\`)) return;
    const res = await fetch('/admin/users/' + encodeURIComponent(username), { method: 'DELETE', headers: authH() });
    if (res.ok) { toast('已删除'); loadUsers(); }
    else toast('删除失败');
  }

  ['userModalClose','userModalCancel'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => document.getElementById('userModal').classList.remove('show'));
  });

  // ── Settings ─────────────────────────────────────────────────────────────────
  let enabledTypes = new Set();

  async function loadSettings() {
    const res = await fetch('/admin/config', { headers: authH() });
    if (!res.ok) return;
    const cfg = await res.json();
    const mb = Math.round(cfg.maxFileSize / 1048576);
    document.getElementById('cfgSize').value = mb;
    document.getElementById('cfgSizeDisplay').textContent = mb + ' MB';
    enabledTypes = new Set(cfg.allowedTypes.split(',').map(t => t.trim()));
    renderTypesGrid();
    document.getElementById('cfgAdminUser').textContent = cfg.adminUsername ?? '(已设置)';
  }

  function renderTypesGrid() {
    document.getElementById('typesGrid').innerHTML = ALL_TYPES.map(t =>
      \`<div class="type-chip\${enabledTypes.has(t)?' on':''}" data-type="\${t}" onclick="toggleType('\${t}')">\${TYPE_LABELS[t]}</div>\`
    ).join('');
  }
  function toggleType(t) { if (enabledTypes.has(t)) enabledTypes.delete(t); else enabledTypes.add(t); renderTypesGrid(); }

  document.getElementById('saveConfigBtn').addEventListener('click', async () => {
    const mb = parseFloat(document.getElementById('cfgSize').value);
    if (isNaN(mb) || mb < 0.1 || mb > 100) { toast('文件大小限制应在 0.1 - 100 MB 之间'); return; }
    if (enabledTypes.size === 0) { toast('至少选择一种文件类型'); return; }
    const res = await fetch('/admin/config', {
      method: 'POST',
      headers: authH(),
      body: JSON.stringify({ maxFileSize: Math.round(mb * 1048576), allowedTypes: [...enabledTypes].join(',') }),
    });
    if (res.ok) { toast('设置已保存'); document.getElementById('cfgSizeDisplay').textContent = mb + ' MB'; }
    else toast('保存失败');
  });

  // ── Stats Modal ───────────────────────────────────────────────────────────────
  async function openStatsModal(key) {
    document.getElementById('statsModalKey').textContent = key;
    document.getElementById('smTotal').textContent = '…';
    document.getElementById('smCountries').textContent = '…';
    document.getElementById('smLast').textContent = '…';
    document.getElementById('countryBars').innerHTML = '';
    document.getElementById('accessLogBody').innerHTML = '<tr><td colspan="5" style="color:#333;text-align:center;padding:16px">加载中…</td></tr>';
    document.getElementById('statsModal').classList.add('show');
    try {
      const res = await fetch('/admin/image-stats/' + encodeURIComponent(key), { headers: authH() });
      const data = await res.json();
      document.getElementById('smTotal').textContent = (data.count??0).toLocaleString();
      const cl = Object.entries(data.countries??{}).sort((a,b)=>b[1]-a[1]);
      document.getElementById('smCountries').textContent = cl.length;
      document.getElementById('smLast').textContent = data.lastAccess ? timeAgo(data.lastAccess) : '—';
      const maxV = cl[0]?.[1]??1;
      document.getElementById('countryBars').innerHTML = cl.slice(0,8).map(([cc,cnt]) =>
        \`<div class="country-row"><span class="country-name">\${cc}</span><div class="bar-wrap"><div class="bar" style="width:\${(cnt/maxV*100).toFixed(1)}%"></div></div><span class="country-count">\${cnt}</span></div>\`
      ).join('') || '<span style="color:#333;font-size:.82rem">暂无数据</span>';
      document.getElementById('accessLogBody').innerHTML = (data.accesses??[]).slice(0,50).map(a =>
        \`<tr><td>\${new Date(a.ts).toLocaleString('zh-CN')}</td><td>\${a.ip}</td><td>\${a.country}</td><td>\${[a.city,a.region].filter(x=>x&&x!=='—').join(' ')}</td><td style="color:#444">\${a.org!=='—'?a.org:''}</td></tr>\`
      ).join('') || '<tr><td colspan="5" style="color:#333;text-align:center">暂无记录</td></tr>';
    } catch { document.getElementById('accessLogBody').innerHTML = '<tr><td colspan="5" style="color:#555;text-align:center">加载失败</td></tr>'; }
  }
  document.getElementById('statsModalClose').addEventListener('click', () => document.getElementById('statsModal').classList.remove('show'));
  document.getElementById('statsModal').addEventListener('click', e => { if (e.target===document.getElementById('statsModal')) document.getElementById('statsModal').classList.remove('show'); });

  // ── Lightbox ─────────────────────────────────────────────────────────────────
  function openLightbox(key) {
    lbKey = key;
    document.getElementById('lbImg').src = origin + '/' + key;
    document.getElementById('lbKey').textContent = key;
    const item = allImages.find(i => i.key === key);
    document.getElementById('lbSize').textContent = item ? fmtSize(item.size) : '';
    document.getElementById('lbDate').textContent = item ? new Date(item.uploaded).toLocaleString('zh-CN') : '';
    document.getElementById('lightbox').classList.add('show');
  }
  document.getElementById('lbClose').addEventListener('click', () => document.getElementById('lightbox').classList.remove('show'));
  document.getElementById('lightbox').addEventListener('click', e => { if (e.target===document.getElementById('lightbox')) document.getElementById('lightbox').classList.remove('show'); });
  document.getElementById('lbCopy').addEventListener('click', () => { navigator.clipboard.writeText(origin+'/'+lbKey); toast('已复制链接'); });
  document.getElementById('lbMd').addEventListener('click',  () => { navigator.clipboard.writeText('![]('+origin+'/'+lbKey+')'); toast('已复制 MD'); });
  document.getElementById('lbStats').addEventListener('click', () => { document.getElementById('lightbox').classList.remove('show'); openStatsModal(lbKey); });
  document.getElementById('lbDelete').addEventListener('click', async () => {
    if (!confirm('确认删除？')) return;
    await doDelete(lbKey);
    allImages = allImages.filter(i => i.key !== lbKey);
    renderGallery();
    document.getElementById('lightbox').classList.remove('show');
    toast('已删除');
  });

  // ── Admin Pages ───────────────────────────────────────────────────────────────
  let adminEditingSlug = null;

  function initApmVditor(initialContent) {
    const box = document.getElementById('apmVditor');
    box.style.display = 'block';
    document.getElementById('apmContent').style.display = 'none';
    if (apmVditorInst) { apmVditorInst.setValue(initialContent || ''); return; }
    const editorH = Math.min(480, Math.max(300, window.innerHeight - 420));
    apmVditorInst = new Vditor('apmVditor', {
      height: editorH, mode: 'ir', lang: 'zh_CN',
      cdn: 'https://cdn.jsdelivr.net/npm/vditor',
      cache: { enable: false }, outline: { enable: false }, preview: { show: false },
      toolbar: ['headings','bold','italic','strike','|','list','ordered-list','check','quote','|',
                'code','inline-code','link','table','upload','|','undo','redo','fullscreen'],
      toolbarConfig: { pin: false },
      upload: {
        url: '/upload', fieldName: 'file',
        headers: adminToken ? { Authorization: 'Bearer ' + adminToken } : {},
        accept: 'image/*',
        format: (files, responseText) => {
          try {
            const d = JSON.parse(responseText);
            const url = d.url || (d.items && d.items[0] && d.items[0].url);
            if (!url) return responseText;
            return JSON.stringify({ code: 0, data: { errFiles: [], succMap: { [files[0].name]: url } } });
          } catch { return responseText; }
        },
      },
      after() {
        window.dispatchEvent(new Event('resize'));
        apmVditorInst.setValue(initialContent || '');
        apmVditorInst.focus();
        box.addEventListener('wheel', function(e) {
          const scroller = box.querySelector('.vditor-content');
          if (!scroller) return;
          const atTop = scroller.scrollTop === 0 && e.deltaY < 0;
          const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1 && e.deltaY > 0;
          if (!atTop && !atBottom) e.stopPropagation();
        }, { passive: true });
      },
    });
  }

  function switchApmEditorToType(type, content) {
    if (type === 'markdown') {
      setTimeout(() => initApmVditor(content || ''), 50);
    } else {
      if (apmVditorInst) { apmVditorInst.destroy(); apmVditorInst = null; }
      document.getElementById('apmVditor').style.display = 'none';
      const ta = document.getElementById('apmContent');
      ta.style.display = '';
      ta.value = content || '';
    }
  }

  async function loadAdminPages() {
    document.getElementById('adminPagesBody').innerHTML = '<tr><td colspan="6" style="text-align:center;color:#333;padding:24px">加载中…</td></tr>';
    const res = await fetch('/admin/pages', { headers: authH() });
    if (!res.ok) return;
    const { pages } = await res.json();
    const TYPE_LABEL = { markdown: '<span style="background:rgba(59,130,246,.1);color:#3b82f6;padding:2px 6px;border-radius:4px;font-size:.72rem">MD</span>', html: '<span style="background:rgba(245,158,11,.1);color:#f59e0b;padding:2px 6px;border-radius:4px;font-size:.72rem">HTML</span>' };
    document.getElementById('adminPagesBody').innerHTML = pages.length
      ? pages.map(p => \`<tr>
          <td>
            <div style="font-weight:500;font-size:.88rem">\${esc(p.title)}</div>
            <div style="font-family:monospace;font-size:.72rem;color:#555">/p/\${p.slug}</div>
          </td>
          <td>\${TYPE_LABEL[p.type] || p.type}</td>
          <td class="muted">@\${p.owner}</td>
          <td>\${p.isPublic ? '<span style="color:#22c55e;font-size:.78rem">公开</span>' : '<span style="color:#555;font-size:.78rem">私密</span>'}</td>
          <td class="muted">\${timeAgo(p.updatedAt)}</td>
          <td style="white-space:nowrap">
            <a href="/p/\${p.slug}" target="_blank" class="btn btn-ghost" style="padding:4px 8px;font-size:.75rem;text-decoration:none">预览</a>
            <button class="btn btn-ghost" style="padding:4px 8px;font-size:.75rem" onclick="adminEditPage('\${p.slug}')">编辑</button>
            <button class="btn btn-danger" style="padding:4px 8px;font-size:.75rem" onclick="adminDeletePage('\${p.slug}')">删除</button>
          </td>
        </tr>\`).join('')
      : '<tr><td colspan="6" style="text-align:center;color:#333;padding:24px">暂无页面</td></tr>';
  }

  document.getElementById('adminNewPageBtn').addEventListener('click', () => adminOpenPageModal(null));

  async function adminEditPage(slug) {
    const res = await fetch('/admin/pages', { headers: authH() });
    const { pages } = await res.json();
    const p = pages.find(x => x.slug === slug);
    if (p) adminOpenPageModal(p);
  }

  async function adminDeletePage(slug) {
    if (!confirm('确认删除页面 /p/' + slug + '？')) return;
    await fetch('/admin/pages/' + encodeURIComponent(slug), { method:'DELETE', headers:authH() });
    toast('已删除'); loadAdminPages();
  }

  function adminOpenPageModal(page) {
    adminEditingSlug = page?.slug ?? null;
    const modal = document.getElementById('adminPageModal');
    document.getElementById('apmTitle').value   = page?.title   ?? '';
    const slugEl = document.getElementById('apmSlug');
    slugEl.value = page?.slug ?? '';
    slugEl.readOnly = !!page;
    slugEl.style.opacity = page ? '0.5' : '';
    const type = page?.type ?? 'markdown';
    document.getElementById('apmType').value = type;
    document.getElementById('apmPublic').checked = page?.isPublic !== false;
    document.getElementById('apmSave').textContent = page ? '保存' : '创建';
    document.getElementById('apmSlugPreview').textContent = page ? location.origin + '/p/' + page.slug : '';
    modal.classList.add('show');
    switchApmEditorToType(type, page?.content ?? '');
  }

  document.getElementById('apmSlug').addEventListener('input', () => {
    const s = document.getElementById('apmSlug').value;
    document.getElementById('apmSlugPreview').textContent = s ? location.origin + '/p/' + s : '';
  });

  document.getElementById('apmType').addEventListener('change', () => {
    const type = document.getElementById('apmType').value;
    const currentContent = apmVditorInst ? apmVditorInst.getValue() : document.getElementById('apmContent').value;
    switchApmEditorToType(type, currentContent);
  });

  document.getElementById('apmSave').addEventListener('click', async () => {
    const slug    = document.getElementById('apmSlug').value.trim();
    const title   = document.getElementById('apmTitle').value.trim();
    const type    = document.getElementById('apmType').value;
    const content = apmVditorInst && type === 'markdown'
      ? apmVditorInst.getValue()
      : document.getElementById('apmContent').value;
    const isPublic = document.getElementById('apmPublic').checked;
    if (!slug || !content) { toast('Slug 和内容不能为空'); return; }
    const isEdit = !!adminEditingSlug;
    const url  = isEdit ? '/admin/pages/' + encodeURIComponent(adminEditingSlug) : '/admin/pages';
    const meth = isEdit ? 'PATCH' : 'POST';
    const body = isEdit ? { title, content, type, isPublic } : { slug, title, content, type, isPublic };
    const res = await fetch(url, { method:meth, headers:authH(), body:JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { toast('失败: ' + data.error); return; }
    document.getElementById('adminPageModal').classList.remove('show');
    toast(isEdit ? '已保存' : '页面已创建');
    loadAdminPages();
  });
  ['apmClose','apmCancel'].forEach(id => document.getElementById(id).addEventListener('click', () => {
    document.getElementById('adminPageModal').classList.remove('show');
    if (apmVditorInst) { apmVditorInst.destroy(); apmVditorInst = null; }
    document.getElementById('apmVditor').style.display = 'none';
    document.getElementById('apmContent').style.display = '';
  }));

  // ── R2 Stats ─────────────────────────────────────────────────────────────────
  async function loadR2Stats() {
    try {
      const res = await fetch('/admin/r2-stats', { headers: authH() });
      if (!res.ok) return;
      const d = await res.json();
      document.getElementById('r2Storage').textContent  = fmtSize(d.storage);
      document.getElementById('r2Objects').textContent  = d.objects.toLocaleString();
      document.getElementById('r2Writes').textContent   = d.writes.toLocaleString();
      document.getElementById('r2Reads').textContent    = d.reads.toLocaleString();
      document.getElementById('r2FreeGb').textContent   = d.freeGb.toFixed(2) + ' GB';
      document.getElementById('r2Members').textContent  = d.members;
      const usedPct = Math.min(100, (d.storage / 10737418240) * 100);
      const bar = document.getElementById('r2FreeBar');
      bar.style.width      = usedPct.toFixed(2) + '%';
      bar.style.background = usedPct >= 90 ? '#ef4444' : usedPct >= 70 ? '#f59e0b' : '#3b82f6';
    } catch {}
  }

  // ── Member Stats ──────────────────────────────────────────────────────────────
  let memberData = [], memberSortKey = 'total', memberSortAsc = false;

  async function loadMemberStats() {
    document.getElementById('memberTableBody').innerHTML =
      '<tr><td colspan="7" style="text-align:center;color:#333;padding:32px">加载中…</td></tr>';
    const res = await fetch('/admin/member-stats', { headers: authH() });
    if (!res.ok) return;
    const { users } = await res.json();
    memberData = users;
    renderMemberStats();
  }

  function memberSort(key) {
    if (memberSortKey === key) memberSortAsc = !memberSortAsc;
    else { memberSortKey = key; memberSortAsc = false; }
    renderMemberStats();
  }

  function renderMemberStats() {
    const sorted = [...memberData].sort((a, b) => {
      let av, bv;
      if      (memberSortKey === 'today')   { av = a.uploads.today;  bv = b.uploads.today; }
      else if (memberSortKey === 'total')   { av = a.uploads.total;  bv = b.uploads.total; }
      else if (memberSortKey === 'pages')   { av = a.pages;          bv = b.pages; }
      else if (memberSortKey === 'created') { av = a.createdAt ?? 0; bv = b.createdAt ?? 0; }
      else                                  { av = a.username;       bv = b.username; }
      if (typeof av === 'string') return memberSortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      return memberSortAsc ? av - bv : bv - av;
    });

    const activeToday = memberData.filter(u => u.uploads.today > 0).length;
    const sumToday    = memberData.reduce((s, u) => s + u.uploads.today, 0);
    const sumTotal    = memberData.reduce((s, u) => s + u.uploads.total, 0);
    document.getElementById('mbTotal').textContent    = memberData.length;
    document.getElementById('mbActive').textContent   = activeToday;
    document.getElementById('mbSumToday').textContent = sumToday;
    document.getElementById('mbSumTotal').textContent = sumTotal;

    if (!sorted.length) {
      document.getElementById('memberTableBody').innerHTML =
        '<tr><td colspan="7" style="text-align:center;color:#333;padding:32px">暂无成员账号</td></tr>';
      return;
    }

    document.getElementById('memberTableBody').innerHTML = sorted.map(u => {
      const p = u.permissions;
      const disabledBadge = u.disabled ? '<span class="badge-disabled" style="margin-right:5px">已禁用</span>' : '';
      const statusDot = u.disabled
        ? '<span style="color:#ef4444;font-size:.75rem">● 已禁用</span>'
        : '<span style="color:#22c55e;font-size:.75rem">● 正常</span>';

      // Today quota bar
      const dLim = p ? p.dailyUploadLimit : -1;
      const dPct = dLim > 0 ? Math.min(100, u.uploads.today / dLim * 100) : 0;
      const dClass = dPct >= 100 ? ' full' : dPct >= 80 ? ' warn' : '';
      let todayCell;
      if (dLim === -1) {
        todayCell = '<span style="font-size:.82rem">' + u.uploads.today + ' <span style="color:#555">/ ∞</span></span>';
      } else {
        todayCell = '<div style="font-size:.82rem">' + u.uploads.today + ' <span style="color:#555">/ ' + dLim + '</span></div>'
          + '<div class="quota-bar"><div class="quota-fill' + dClass + '" style="width:' + dPct.toFixed(0) + '%"></div></div>';
      }

      // Total quota bar
      const tLim = p ? p.maxTotalUploads : -1;
      const tPct = tLim > 0 ? Math.min(100, u.uploads.total / tLim * 100) : 0;
      const tClass = tPct >= 100 ? ' full' : tPct >= 80 ? ' warn' : '';
      let totalCell;
      if (tLim === -1) {
        totalCell = '<span style="font-size:.82rem">' + u.uploads.total + ' <span style="color:#555">/ ∞</span></span>';
      } else {
        totalCell = '<div style="font-size:.82rem">' + u.uploads.total + ' <span style="color:#555">/ ' + tLim + '</span></div>'
          + '<div class="quota-bar"><div class="quota-fill' + tClass + '" style="width:' + tPct.toFixed(0) + '%"></div></div>';
      }

      const permsList = p ? [
        p.canUpload ? '<span class="perm-badge perm-on">上传</span>' : '<span class="perm-badge perm-off">禁止上传</span>',
        p.canDelete ? '<span class="perm-badge perm-on">删除</span>' : '',
        p.canEdit   ? '<span class="perm-badge perm-on">编辑</span>' : '',
      ].filter(Boolean).join(' ') : '—';

      return '<tr>'
        + '<td style="font-weight:500">' + disabledBadge + esc(u.username) + '</td>'
        + '<td>' + statusDot + '</td>'
        + '<td style="min-width:110px">' + todayCell + '</td>'
        + '<td style="min-width:110px">' + totalCell + '</td>'
        + '<td style="text-align:center;color:' + (u.pages ? '#e0e0e0' : '#444') + '">' + u.pages + '</td>'
        + '<td>' + permsList + '</td>'
        + '<td class="muted">' + (u.createdAt ? timeAgo(u.createdAt) : '—') + '</td>'
        + '</tr>';
    }).join('');
  }

  // ── Utils ─────────────────────────────────────────────────────────────────────
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function handleUnauth() { localStorage.removeItem(TOKEN_KEY); adminToken = null; showLogin(); }
  function fmtSize(b) { if(b<1024) return b+' B'; if(b<1048576) return (b/1024).toFixed(1)+' KB'; return (b/1048576).toFixed(1)+' MB'; }
  function fmtSizeParts(b) { if(b<1048576) return {val:(b/1024).toFixed(1),unit:'KB'}; if(b<1073741824) return {val:(b/1048576).toFixed(1),unit:'MB'}; return {val:(b/1073741824).toFixed(2),unit:'GB'}; }
  function copyText(text, btn) { navigator.clipboard.writeText(text).then(() => { if(btn){const o=btn.textContent;btn.textContent='✓';setTimeout(()=>btn.textContent=o,1400);} }); }
  function toast(msg) { const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2500); }
  function timeAgo(ts) { const d=Date.now()-ts; if(d<60000) return '刚刚'; if(d<3600000) return Math.floor(d/60000)+' 分钟前'; if(d<86400000) return Math.floor(d/3600000)+' 小时前'; return Math.floor(d/86400000)+' 天前'; }
  document.addEventListener('keydown', e => {
    if (e.key==='Escape') {
      document.getElementById('lightbox').classList.remove('show');
      document.getElementById('statsModal').classList.remove('show');
      document.getElementById('userModal').classList.remove('show');
      if (document.getElementById('adminPageModal').classList.contains('show')) {
        document.getElementById('adminPageModal').classList.remove('show');
        if (apmVditorInst) { apmVditorInst.destroy(); apmVditorInst = null; }
        document.getElementById('apmVditor').style.display = 'none';
        document.getElementById('apmContent').style.display = '';
      }
    }
  });
</script>
<script src="https://cdn.jsdelivr.net/npm/vditor/dist/index.min.js" defer></script>
</body>
</html>`;
}
