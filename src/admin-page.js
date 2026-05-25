export function renderAdminPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Onimg Admin</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/vditor/dist/index.css">
  <style>
    :root {
      --bg:     #060b18; --bg-2: #09112a; --bg-3: #0d1836; --bg-4: #111f3e; --bg-5: #162548;
      --bg-h:   #1c2e56; --bg-a: #1f3360;
      --bd:     #1a2f50; --bd-2: #243f62; --bd-f: #4090f8;
      --tx:     #edf3ff; --tx-2: #6e96c0; --tx-3: #3a5678; --tx-a: #7db8f8;
      --blue:   #4090f8; --blue-d: #2468d8;
      --blue-g: rgba(64,144,248,.11); --blue-r: rgba(64,144,248,.22);
      --green:  #34d399; --green-g: rgba(52,211,153,.11); --green-r: rgba(52,211,153,.22);
      --amber:  #fbbf24; --amber-g: rgba(251,191,36,.1); --amber-r: rgba(251,191,36,.2);
      --red:    #f87171; --red-g: rgba(248,113,113,.1); --red-r: rgba(248,113,113,.2);
      --r: 10px; --r-sm: 7px; --r-xs: 5px;
      --shadow: 0 24px 60px rgba(0,0,0,.78); --shadow-sm: 0 8px 28px rgba(0,0,0,.5);
      --t: all .18s ease; --t-f: all .12s ease;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg-2); color: var(--tx); min-height: 100vh; }

    /* Login */
    #loginScreen { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; background: var(--bg-2); }
    .login-card { width: 100%; max-width: 380px; background: var(--bg-4); border: 1px solid var(--bd-2); border-radius: 16px; padding: 40px 36px; box-shadow: var(--shadow); }
    .login-logo { font-size: 1.4rem; font-weight: 700; color: var(--tx); margin-bottom: 4px; }
    .login-sub { font-size: .85rem; color: var(--tx-3); margin-bottom: 32px; }
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    .field label { font-size: .78rem; color: var(--tx-2); font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
    .field input, .field select { padding: 10px 12px; background: var(--bg-2); border: 1px solid var(--bd); border-radius: var(--r-sm); color: var(--tx); font-size: .9rem; outline: none; transition: var(--t); }
    .field input:focus, .field select:focus { border-color: var(--bd-f); box-shadow: 0 0 0 3px var(--blue-g); }
    .btn-login { width: 100%; padding: 11px; background: var(--blue); color: #fff; border: none; border-radius: var(--r-sm); font-size: .95rem; font-weight: 600; cursor: pointer; margin-top: 8px; transition: var(--t); }
    .btn-login:hover { background: var(--blue-d); }
    .btn-login:disabled { background: var(--bg-5); color: var(--tx-3); cursor: not-allowed; }
    .login-err { color: var(--red); font-size: .82rem; margin-top: 10px; text-align: center; min-height: 18px; }

    /* Shell */
    #adminApp { display: none; }
    .shell { display: flex; min-height: 100vh; }
    aside { width: 224px; flex-shrink: 0; background: var(--bg-3); border-right: 1px solid var(--bd); display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; z-index: 10; }
    .sidebar-logo { padding: 22px 20px 16px; font-size: 1.1rem; font-weight: 700; color: var(--tx); border-bottom: 1px solid var(--bd); display: flex; align-items: center; gap: 8px; letter-spacing: -.01em; }
    .sidebar-logo span { font-size: .7rem; font-weight: 500; color: var(--tx-3); background: var(--bg-2); border: 1px solid var(--bd); padding: 2px 7px; border-radius: 4px; }
    nav { flex: 1; padding: 10px; display: flex; flex-direction: column; gap: 2px; }
    .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: var(--r-sm); cursor: pointer; font-size: .86rem; font-weight: 500; color: var(--tx-3); transition: var(--t); border: none; background: none; width: 100%; text-align: left; }
    .nav-item:hover { background: var(--bg-h); color: var(--tx-2); }
    .nav-item.active { background: linear-gradient(135deg, var(--bg-a) 0%, var(--bg-h) 100%); color: var(--tx); border: 1px solid var(--bd-2); }
    .nav-item.active .nav-icon { color: var(--blue); }
    .nav-icon { width: 20px; text-align: center; font-size: .9rem; }
    .sidebar-footer { padding: 12px 10px; border-top: 1px solid var(--bd); }
    .user-badge { display: flex; align-items: center; gap: 10px; padding: 10px 12px; }
    .avatar { width: 30px; height: 30px; background: var(--bg-5); border: 1px solid var(--bd-2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: .85rem; color: var(--blue); font-weight: 700; flex-shrink: 0; }
    .user-info { flex: 1; min-width: 0; }
    .user-name { font-size: .82rem; font-weight: 600; color: var(--tx-2); }
    .user-role { font-size: .72rem; color: var(--tx-3); margin-top: 1px; }
    .btn-logout { padding: 5px 10px; background: none; border: 1px solid var(--bd); border-radius: 6px; color: var(--tx-3); cursor: pointer; font-size: .78rem; transition: var(--t); }
    .btn-logout:hover { border-color: var(--red-r); color: var(--red); background: var(--red-g); }
    .main-content { flex: 1; margin-left: 224px; padding: 28px 32px; min-width: 0; }
    .section { display: none; }
    .section.active { display: block; }
    .page-title { font-size: 1.25rem; font-weight: 700; color: var(--tx); margin-bottom: 5px; letter-spacing: -.01em; }
    .page-sub { font-size: .85rem; color: var(--tx-3); margin-bottom: 28px; }

    /* Buttons */
    .btn { padding: 7px 14px; border-radius: var(--r-sm); font-size: .82rem; font-weight: 600; cursor: pointer; transition: var(--t); border: 1px solid transparent; }
    .btn-ghost { background: var(--bg-4); color: var(--tx-2); border-color: var(--bd); }
    .btn-ghost:hover { background: var(--bg-h); color: var(--tx); border-color: var(--bd-2); }
    .btn-danger { background: var(--red-g); color: var(--red); border-color: var(--red-r); }
    .btn-danger:hover { background: var(--red-r); }
    .btn-primary { background: var(--blue); color: #fff; border-color: transparent; }
    .btn-primary:hover { background: var(--blue-d); }
    .btn-warn { background: var(--amber-g); color: var(--amber); border-color: var(--amber-r); }
    .btn-warn:hover { background: var(--amber-r); }

    /* Stats */
    .stats-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(195px, 1fr)); gap: 14px; margin-bottom: 32px; }
    .stat-card { background: var(--bg-4); border: 1px solid var(--bd); border-left: 3px solid var(--blue); border-radius: var(--r); padding: 22px 20px 18px; position: relative; overflow: hidden; }
    .stat-card-glyph { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); font-size: 2rem; opacity: .07; pointer-events: none; user-select: none; }
    .stat-label { font-size: .7rem; color: var(--tx-3); margin-bottom: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }
    .stat-value { font-size: 2.1rem; font-weight: 700; line-height: 1; letter-spacing: -.03em; color: var(--tx); }
    .stat-unit { font-size: .78rem; color: var(--tx-3); margin-top: 6px; }

    /* Section header */
    .section-header { display: flex; align-items: center; margin-bottom: 16px; }
    .section-header h3 { font-size: .93rem; font-weight: 600; color: var(--tx-2); }
    .section-header .spacer { flex: 1; }

    /* Data table */
    .data-table { width: 100%; border-collapse: collapse; font-size: .84rem; }
    .data-table th { text-align: left; padding: 9px 14px; color: var(--tx-3); font-weight: 600; border-bottom: 1px solid var(--bd); font-size: .72rem; text-transform: uppercase; letter-spacing: .06em; }
    .data-table td { padding: 10px 14px; border-bottom: 1px solid var(--bd); vertical-align: middle; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: var(--blue-g); }
    .top-thumb { width: 36px; height: 36px; object-fit: cover; border-radius: 6px; border: 1px solid var(--bd-2); cursor: pointer; }
    .view-count { font-weight: 700; color: var(--tx-a); }
    .muted { color: var(--tx-3); font-size: .78rem; }

    /* Gallery */
    .toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 18px; flex-wrap: wrap; }
    .search-input { padding: 8px 12px; background: var(--bg-4); border: 1px solid var(--bd); border-radius: var(--r-sm); color: var(--tx); font-size: .85rem; outline: none; width: 220px; transition: var(--t); }
    .search-input:focus { border-color: var(--bd-f); box-shadow: 0 0 0 3px var(--blue-g); }
    .bulk-bar { display: none; align-items: center; gap: 10px; padding: 10px 14px; background: var(--bg-4); border: 1px solid var(--bd); border-radius: var(--r-sm); margin-bottom: 14px; font-size: .85rem; color: var(--tx-2); }
    .bulk-bar.show { display: flex; }
    .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(175px, 1fr)); gap: 14px; }
    .gitem { background: var(--bg-4); border: 1px solid var(--bd); border-radius: var(--r); overflow: hidden; cursor: pointer; transition: var(--t), box-shadow .2s, transform .2s; position: relative; }
    .gitem:hover { border-color: var(--bd-2); box-shadow: 0 6px 24px rgba(0,0,0,.45); transform: translateY(-2px); }
    .gitem.selected { border-color: var(--blue); box-shadow: 0 0 0 1px var(--blue); }
    .gitem img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; background: var(--bg-3); }
    .gitem-info { padding: 8px 10px; }
    .gitem-key { font-size: .72rem; color: var(--tx-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .gitem-meta { display: flex; justify-content: space-between; margin-top: 3px; }
    .gitem-size { font-size: .68rem; color: var(--tx-3); }
    .gitem-views { font-size: .68rem; color: var(--tx-a); font-weight: 600; }
    .gitem-actions { display: flex; gap: 4px; margin-top: 6px; }
    .checkbox { position: absolute; top: 7px; left: 7px; width: 18px; height: 18px; border-radius: 4px; background: rgba(0,0,0,.7); border: 1.5px solid var(--bd-2); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .15s; }
    .gitem:hover .checkbox, .gitem.selected .checkbox { opacity: 1; }
    .gitem.selected .checkbox { background: var(--blue); border-color: var(--blue); }
    .chk-svg { width: 10px; height: 10px; stroke: #fff; fill: none; stroke-width: 2.5; }
    .load-more-wrap { display: flex; justify-content: center; margin-top: 24px; }
    .empty { text-align: center; padding: 60px 0; color: var(--tx-3); font-size: .9rem; }

    /* User management */
    .users-table-wrap { background: var(--bg-4); border: 1px solid var(--bd); border-radius: var(--r); overflow: hidden; }
    .perm-badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 4px; font-size: .72rem; font-weight: 600; }
    .perm-on  { background: var(--green-g); color: var(--green); border: 1px solid var(--green-r); }
    .perm-off { background: rgba(58,86,120,.15); color: var(--tx-3); border: 1px solid var(--bd); }
    .perm-admin { background: var(--blue-g); color: var(--tx-a); border: 1px solid var(--blue-r); }
    .badge-disabled { background: var(--red-g); color: var(--red); border: 1px solid var(--red-r); padding: 2px 8px; border-radius: 4px; font-size: .72rem; font-weight: 600; }

    /* Settings */
    .settings-card { background: var(--bg-4); border: 1px solid var(--bd); border-radius: var(--r); padding: 24px; margin-bottom: 20px; }
    .settings-card h3 { font-size: .78rem; font-weight: 700; margin-bottom: 20px; color: var(--tx-2); text-transform: uppercase; letter-spacing: .06em; }
    .setting-row { display: flex; align-items: center; padding: 13px 0; border-bottom: 1px solid var(--bd); gap: 16px; }
    .setting-row:last-child { border-bottom: none; }
    .setting-label { font-size: .85rem; color: var(--tx-2); width: 200px; flex-shrink: 0; }
    .setting-ctrl { flex: 1; display: flex; align-items: center; gap: 10px; }
    .setting-ctrl input[type="number"], .setting-ctrl input[type="text"] { padding: 7px 10px; background: var(--bg-2); border: 1px solid var(--bd); border-radius: var(--r-sm); color: var(--tx); font-size: .85rem; outline: none; width: 140px; transition: var(--t); }
    .setting-ctrl input:focus { border-color: var(--bd-f); box-shadow: 0 0 0 3px var(--blue-g); }
    .setting-hint { font-size: .75rem; color: var(--tx-3); }
    .types-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .type-chip { display: flex; align-items: center; gap: 6px; padding: 5px 10px; background: var(--bg-3); border: 1px solid var(--bd); border-radius: 6px; font-size: .78rem; cursor: pointer; transition: var(--t); color: var(--tx-2); }
    .type-chip.on { background: var(--blue-g); border-color: var(--blue-r); color: var(--tx-a); }
    .save-row { display: flex; justify-content: flex-end; margin-top: 20px; }

    /* Modals */
    .modal-overlay { position: fixed; inset: 0; background: rgba(5,8,18,.88); display: none; align-items: center; justify-content: center; z-index: 50; padding: 24px; backdrop-filter: blur(6px) saturate(1.4); }
    .modal-overlay.show { display: flex; }
    .modal { background: var(--bg-4); border: 1px solid var(--bd-2); border-radius: 16px; width: 100%; max-width: 520px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: var(--shadow); }
    .modal-header { display: flex; align-items: center; padding: 18px 20px; border-bottom: 1px solid var(--bd); flex-shrink: 0; }
    .modal-header h3 { font-size: 1rem; font-weight: 600; flex: 1; color: var(--tx); }
    .modal-close { background: var(--bg-5); border: 1px solid var(--bd); color: var(--tx-2); width: 32px; height: 32px; border-radius: var(--r-sm); cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: var(--t); }
    .modal-close:hover { color: var(--tx); border-color: var(--bd-2); }
    .modal-body { overflow-y: auto; padding: 20px; flex: 1; }
    .modal-footer { padding: 14px 20px; border-top: 1px solid var(--bd); display: flex; gap: 8px; justify-content: flex-end; flex-shrink: 0; }
    .perm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 4px; }
    .perm-check { display: flex; align-items: center; gap: 8px; padding: 9px 12px; background: var(--bg-3); border: 1px solid var(--bd); border-radius: var(--r-sm); cursor: pointer; font-size: .84rem; color: var(--tx-2); transition: var(--t); }
    .perm-check:hover { border-color: var(--bd-2); }
    .perm-check input { width: 14px; height: 14px; cursor: pointer; accent-color: var(--blue); }
    .perm-num-row { display: flex; align-items: center; gap: 10px; margin-top: 14px; }
    .perm-num-row label { font-size: .82rem; color: var(--tx-2); width: 120px; flex-shrink: 0; }
    .perm-num-row input { padding: 7px 10px; background: var(--bg-2); border: 1px solid var(--bd); border-radius: var(--r-sm); color: var(--tx); font-size: .85rem; outline: none; width: 100px; transition: var(--t); }
    .perm-num-row input:focus { border-color: var(--bd-f); box-shadow: 0 0 0 3px var(--blue-g); }
    .perm-hint { font-size: .72rem; color: var(--tx-3); }

    /* Stats modal */
    .stats-modal { max-width: 680px; }
    .stat-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
    .summary-card { background: var(--bg-3); border: 1px solid var(--bd); border-radius: var(--r-sm); padding: 16px; text-align: center; }
    .summary-card .val { font-size: 1.5rem; font-weight: 700; color: var(--tx); }
    .summary-card .lbl { font-size: .72rem; color: var(--tx-3); margin-top: 5px; text-transform: uppercase; letter-spacing: .04em; }
    .country-bars h4, .access-log h4 { font-size: .72rem; color: var(--tx-2); margin-bottom: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
    .country-row { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; font-size: .8rem; }
    .country-name { width: 40px; color: var(--tx-2); font-family: monospace; }
    .bar-wrap { flex: 1; background: var(--bd); border-radius: 4px; height: 6px; }
    .bar { background: var(--blue); height: 6px; border-radius: 4px; transition: width .4s; }
    .country-count { width: 30px; text-align: right; color: var(--tx-3); }
    .log-table { width: 100%; border-collapse: collapse; font-size: .78rem; margin-top: 4px; }
    .log-table th { text-align: left; padding: 7px 10px; color: var(--tx-3); font-weight: 600; border-bottom: 1px solid var(--bd); text-transform: uppercase; letter-spacing: .04em; font-size: .7rem; }
    .log-table td { padding: 7px 10px; border-bottom: 1px solid var(--bd); color: var(--tx-2); font-family: monospace; }
    .access-log { margin-top: 20px; }

    /* Version diff */
    .pvm-ver-card { background: #0f0f0f; border: 1px solid #1e1e1e; border-radius: 8px; padding: 9px 10px; cursor: pointer; transition: border-color .12s; }
    .pvm-ver-card:hover { border-color: #2a3f60; }
    .pvm-ver-card.active { border-color: #3b82f6; background: rgba(59,130,246,.06); }
    .pvm-ver-card.checked-a { border-color: #10b981; background: rgba(16,185,129,.06); }
    .pvm-ver-card.checked-b { border-color: #f59e0b; background: rgba(245,158,11,.06); }
    .pvm-ver-badge { font-size: .72rem; font-weight: 700; padding: 1px 6px; border-radius: 4px; margin-right: 4px; background: #1a2f50; color: #7db8f8; }
    .pvm-ver-latest { font-size: .65rem; padding: 1px 5px; border-radius: 3px; background: rgba(34,197,94,.12); color: #22c55e; }
    .pvm-ver-meta { font-size: .68rem; color: #444; margin-top: 4px; }
    .pvm-ver-check { display: flex; align-items: center; gap: 4px; margin-top: 5px; font-size: .7rem; color: #555; }
    .diff-file { display: flex; align-items: center; gap: 6px; padding: 3px 6px; border-radius: 4px; font-size: .72rem; font-family: monospace; margin-bottom: 1px; }
    .diff-add  { background: rgba(16,185,129,.08); color: #10b981; }
    .diff-rem  { background: rgba(239,68,68,.08);  color: #ef4444; }
    .diff-same { color: #333; }
    .diff-prefix { flex-shrink: 0; width: 14px; font-weight: 700; }
    .diff-section { margin-bottom: 16px; }
    .diff-section h4 { font-size: .72rem; font-weight: 600; margin-bottom: 6px; padding: 4px 6px; border-radius: 4px; }
    .diff-section.add  h4 { background: rgba(16,185,129,.1);  color: #10b981; }
    .diff-section.rem  h4 { background: rgba(239,68,68,.1);   color: #ef4444; }
    .diff-section.same h4 { background: rgba(100,100,100,.08); color: #444; }
    .file-row { display: flex; align-items: center; gap: 6px; padding: 3px 6px; border-radius: 4px; font-size: .72rem; font-family: monospace; margin-bottom: 1px; color: #666; }
    .file-row:hover { background: #111; color: #aaa; }

    /* R2 Panel */
    .r2-panel { background: var(--bg-4); border: 1px solid var(--bd); border-radius: var(--r); padding: 18px 20px; margin-bottom: 28px; }
    .r2-panel-hd { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
    .r2-panel-hd h3 { font-size: .88rem; font-weight: 600; color: var(--tx-2); }
    .r2-badge { font-size: .7rem; color: var(--tx-3); background: var(--bg-3); border: 1px solid var(--bd); padding: 2px 8px; border-radius: 4px; font-weight: 500; }
    .r2-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: var(--bd); border-radius: var(--r-sm); overflow: hidden; }
    .r2-cell { background: var(--bg-3); padding: 14px 15px; }
    .r2-cell-lbl { font-size: .67rem; color: var(--tx-3); margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
    .r2-cell-val { font-size: 1.3rem; font-weight: 700; line-height: 1; color: var(--tx); }
    .r2-cell-sub { font-size: .67rem; color: var(--tx-3); margin-top: 4px; }
    .r2-free-bar { height: 3px; background: var(--bd); border-radius: 2px; margin-top: 8px; }
    .r2-free-fill { height: 3px; border-radius: 2px; background: var(--blue); transition: width .5s; }

    /* Quota bars */
    .quota-bar { height: 4px; background: var(--bd); border-radius: 2px; margin-top: 4px; width: 90px; }
    .quota-fill { height: 4px; border-radius: 2px; background: var(--blue); }
    .quota-fill.warn { background: var(--amber); }
    .quota-fill.full { background: var(--red); }

    /* Member Stats */
    .mb-summary { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .mb-card { background: var(--bg-4); border: 1px solid var(--bd); border-radius: var(--r-sm); padding: 16px; }
    .mb-card-lbl { font-size: .7rem; color: var(--tx-3); margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
    .mb-card-val { font-size: 1.65rem; font-weight: 700; line-height: 1; color: var(--tx); }
    .sort-th { cursor: pointer; user-select: none; }
    .sort-th:hover { color: var(--tx-2); }

    /* Lightbox */
    .lightbox { position: fixed; inset: 0; background: rgba(5,8,18,.95); display: none; align-items: center; justify-content: center; z-index: 100; padding: 24px; }
    .lightbox.show { display: flex; }
    .lb-inner { background: var(--bg-4); border: 1px solid var(--bd-2); border-radius: 14px; max-width: 760px; width: 100%; overflow: hidden; box-shadow: var(--shadow); }
    .lb-img-wrap { background: var(--bg); display: flex; align-items: center; justify-content: center; min-height: 280px; max-height: 55vh; }
    .lb-img-wrap img { max-width: 100%; max-height: 55vh; object-fit: contain; display: block; }
    .lb-meta { padding: 16px 20px; }
    .lb-key { font-size: .88rem; color: var(--tx-2); word-break: break-all; }
    .lb-detail { display: flex; gap: 14px; margin-top: 5px; font-size: .78rem; color: var(--tx-3); }
    .lb-actions { display: flex; gap: 8px; margin-top: 14px; }
    .lb-close { position: absolute; top: 16px; right: 16px; background: var(--bg-5); border: 1px solid var(--bd); color: var(--tx-2); width: 34px; height: 34px; border-radius: var(--r-sm); cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: var(--t); }
    .lb-close:hover { color: var(--tx); border-color: var(--bd-2); }

    .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(80px); background: var(--bg-5); border: 1px solid var(--bd-2); color: var(--tx); padding: 9px 20px; border-radius: var(--r-sm); font-size: .83rem; font-weight: 500; transition: transform .3s cubic-bezier(.34,1.56,.64,1); z-index: 300; white-space: nowrap; box-shadow: var(--shadow-sm); }
    .toast.show { transform: translateX(-50%) translateY(0); }

    /* Admin page editor Vditor */
    #apmVditor { border-radius: var(--r-sm); overflow: hidden; border: 1px solid var(--bd); }
    #apmVditor .vditor-outline { display: none !important; }
    #apmVditor .vditor-content { height: calc(100% - 36px) !important; overflow-y: auto !important; overscroll-behavior: contain; }
    #apmVditor .vditor-toolbar { position: sticky !important; top: 0 !important; z-index: 10 !important; flex-wrap: nowrap; overflow-x: auto; }

    /* Login enhancements */
    @keyframes loginSpin { to { transform: rotate(360deg); } }
    @keyframes loginShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
    .btn-login.loading { pointer-events: none; }
    .btn-login.loading::before { content:''; display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:loginSpin .6s linear infinite; margin-right:8px; vertical-align:middle; }
    #loginScreen .login-card.shake { animation: loginShake .35s ease; }
    .pass-wrap { position: relative; }
    .pass-wrap input { padding-right: 38px; width: 100%; }
    .pass-toggle { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #555; cursor: pointer; padding: 4px; line-height: 1; font-size: .9rem; }
    .pass-toggle:hover { color: #aaa; }

    /* Toast types */
    .toast.t-success { background: #052e16; border-color: #166534; color: #4ade80; }
    .toast.t-warn    { background: #2d1b00; border-color: #92400e; color: #fcd34d; }
    .toast.t-error   { background: #1c0505; border-color: #7f1d1d; color: #f87171; }

    /* Expiry banner */
    #expiryBanner { display: none; background: #1c1a00; border-bottom: 1px solid #92400e; padding: 9px 24px; font-size: .82rem; color: #fcd34d; align-items: center; gap: 8px; }
    #expiryBanner.show { display: flex; }

    /* Mobile sidebar */
    .mob-header { display: none; position: fixed; top: 0; left: 0; right: 0; height: 52px; background: #0f0f0f; border-bottom: 1px solid #1a1a1a; z-index: 20; align-items: center; gap: 14px; padding: 0 16px; }
    .mob-hamburger { background: none; border: 1px solid #222; color: #888; width: 34px; height: 34px; border-radius: 7px; cursor: pointer; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; }
    .mob-hamburger:hover { color: #fff; border-color: #444; }
    .sidebar-mask { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.6); z-index: 9; }
    .sidebar-mask.show { display: block; }
    @media (max-width: 768px) {
      aside { transform: translateX(-220px); transition: transform .22s ease; }
      aside.open { transform: translateX(0); z-index: 15; }
      .mob-header { display: flex; }
      .main-content { margin-left: 0 !important; padding-top: 68px; }
    }
    @media (min-width: 769px) { .mob-header { display: none !important; } }

    /* Table horizontal scroll */
    .users-table-wrap { overflow-x: auto; }

    /* CF Quota Panel */
    .cf-panel { background: var(--bg-4); border: 1px solid var(--bd); border-radius: var(--r); padding: 18px 20px; margin-bottom: 28px; }
    .cf-panel-hd { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .cf-panel-hd h3 { font-size: .92rem; font-weight: 600; color: var(--tx); margin: 0; }
    .cf-badge { font-size: .68rem; font-weight: 600; padding: 2px 8px; border-radius: 4px; border: 1px solid; white-space: nowrap; }
    .cf-badge.api { color: var(--green); border-color: rgba(52,211,153,.3); background: rgba(52,211,153,.08); }
    .cf-badge.self { color: var(--amber); border-color: rgba(251,191,36,.3); background: rgba(251,191,36,.06); }
    .cf-badge.loading { color: var(--tx-3); border-color: var(--bd); background: var(--bg-3); }
    .cf-quotas { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; margin-bottom: 12px; }
    .cf-quota { background: var(--bg-3); border: 1px solid var(--bd); border-radius: var(--r-sm); padding: 12px 14px; }
    .cf-quota-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 6px; margin-bottom: 6px; }
    .cf-quota-lbl { font-size: .72rem; color: var(--tx-2); font-weight: 600; line-height: 1.3; }
    .cf-quota-method { font-size: .6rem; color: var(--tx-3); background: var(--bg-5); border: 1px solid var(--bd); padding: 1px 6px; border-radius: 3px; white-space: nowrap; flex-shrink: 0; margin-top: 1px; }
    .cf-quota-val { font-size: 1.35rem; font-weight: 700; color: var(--tx); line-height: 1; margin-bottom: 3px; }
    .cf-quota-sub { font-size: .65rem; color: var(--tx-3); margin-bottom: 6px; }
    .cf-quota-sub strong { color: var(--tx-2) !important; }
    .cf-track { height: 3px; background: var(--bd); border-radius: 2px; overflow: hidden; }
    .cf-fill { height: 3px; border-radius: 2px; background: var(--blue); transition: width .5s ease; }
    .cf-fill.warn { background: var(--amber); }
    .cf-fill.full { background: var(--red); }
    .cf-kv-row { display: flex; gap: 14px; flex-wrap: wrap; }
    .cf-kv-item { display: flex; align-items: center; gap: 8px; background: var(--bg-3); border: 1px solid var(--bd); border-radius: var(--r-sm); padding: 8px 12px; flex: 1; min-width: 130px; }
    .cf-kv-icon { font-size: 1.1rem; flex-shrink: 0; }
    .cf-kv-val { font-size: .95rem; font-weight: 700; color: var(--tx); line-height: 1.2; }
    .cf-kv-lbl { font-size: .62rem; color: var(--tx-3); margin-top: 1px; }
    .cf-note { font-size: .68rem; color: var(--tx-3); margin-top: 10px; line-height: 1.6; }
    .cf-note a { color: var(--tx-a); text-decoration: none; }
    .cf-note a:hover { text-decoration: underline; }
  </style>
</head>
<body>

<div id="expiryBanner">
  ⚠ 登录状态将在 <strong id="expiryCountdown"></strong> 后过期，建议重新登录以避免中断。
  <button onclick="triggerReLogin()" style="margin-left:auto;padding:4px 10px;background:none;border:1px solid #92400e;color:#fcd34d;border-radius:6px;cursor:pointer;font-size:.78rem">重新登录</button>
</div>
<div class="mob-header">
  <button class="mob-hamburger" id="sidebarToggle">☰</button>
  <span style="font-size:.9rem;font-weight:700">Onimg Admin</span>
</div>
<div class="sidebar-mask" id="sidebarMask"></div>

<!-- Login -->
<div id="loginScreen">
  <div class="login-card">
    <div class="login-logo">Onimg <span>Admin</span></div>
    <div class="login-sub">使用管理员账号登录</div>
    <div class="field"><label>用户名</label><input type="text" id="loginUser" placeholder="admin" autocomplete="username"></div>
    <div class="field"><label>密码</label><div class="pass-wrap"><input type="password" id="loginPass" placeholder="••••••••" autocomplete="current-password"><button type="button" class="pass-toggle" id="loginPassToggle" title="显示/隐藏密码">👁</button></div></div>
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
        <button class="nav-item active" data-section="dashboard">
          <svg class="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/>
            <rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/>
          </svg>概览
        </button>
        <button class="nav-item" data-section="images">
          <svg class="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="1" width="14" height="14" rx="2.5"/>
            <circle cx="5.5" cy="5.5" r="1.5"/>
            <polyline points="1,12 5,8 8,11 11,8 15,12"/>
          </svg>图库管理
        </button>
        <button class="nav-item" data-section="users">
          <svg class="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="8" cy="5" r="3"/>
            <path d="M1.5 15c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5"/>
          </svg>用户管理
        </button>
        <button class="nav-item" data-section="pages">
          <svg class="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 1h7l4 4v10H3V1z"/>
            <polyline points="10,1 10,5 14,5"/>
            <line x1="4" y1="8" x2="12" y2="8"/>
            <line x1="4" y1="11" x2="9" y2="11"/>
          </svg>页面管理
        </button>
        <button class="nav-item" data-section="protos"><span class="nav-icon">📐</span>原型管理</button>
        <button class="nav-item" data-section="members">
          <svg class="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="1,12 5,7 9,9 13,4"/>
            <polyline points="10,4 13,4 13,7"/>
          </svg>成员统计
        </button>
        <button class="nav-item" data-section="settings">
          <svg class="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="8" cy="8" r="2.5"/>
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M12.95 3.05l-1.41 1.41M4.46 11.54l-1.41 1.41"/>
          </svg>系统设置
        </button>
      </nav>
      <div style="padding:0 10px 8px">
        <a href="/" style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;color:#444;font-size:.82rem;text-decoration:none;transition:all .15s" onmouseover="this.style.color='#aaa';this.style.background='#161616'" onmouseout="this.style.color='#444';this.style.background='transparent'"><span style="width:20px;text-align:center">←</span>前台</a>
      </div>
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
          <div class="stat-card" style="--accent:#3b82f6"><div class="stat-card-glyph">🖼</div><div class="stat-label">图片总数</div><div class="stat-value" id="statImages">—</div><div class="stat-unit">张</div></div>
          <div class="stat-card" style="--accent:#8b5cf6"><div class="stat-card-glyph">💾</div><div class="stat-label">存储用量</div><div class="stat-value" id="statSize">—</div><div class="stat-unit" id="statSizeUnit"></div></div>
          <div class="stat-card" style="--accent:#22c55e"><div class="stat-card-glyph">☁</div><div class="stat-label">免费额度剩余</div><div class="stat-value" id="statFree">—</div><div class="stat-unit">GB / 10 GB</div></div>
          <div class="stat-card" style="--accent:#f59e0b"><div class="stat-card-glyph">👁</div><div class="stat-label">图片访问次数</div><div class="stat-value" id="statViews">—</div><div class="stat-unit">次</div></div>
          <div class="stat-card" style="--accent:#ec4899"><div class="stat-card-glyph">📄</div><div class="stat-label">托管页面数</div><div class="stat-value" id="statPages">—</div><div class="stat-unit">个</div></div>
          <div class="stat-card" style="--accent:#14b8a6"><div class="stat-card-glyph">📈</div><div class="stat-label">页面访问次数</div><div class="stat-value" id="statPageViews">—</div><div class="stat-unit">次</div></div>
        </div>
        <!-- CF 免费额度概览 -->
        <div class="cf-panel">
          <div class="cf-panel-hd">
            <h3>☁️ Cloudflare 免费额度</h3>
            <span class="cf-badge" id="cfSourceBadge">加载中…</span>
            <div style="flex:1"></div>
            <button class="btn btn-ghost" style="padding:4px 10px;font-size:.75rem" onclick="loadCfQuota()">刷新</button>
          </div>
          <div class="cf-quotas">
            <!-- Workers 请求 -->
            <div class="cf-quota">
              <div class="cf-quota-top">
                <span class="cf-quota-lbl">⚡ Workers 请求（今日）</span>
                <span class="cf-quota-method" id="cfReqMethod">1% 采样 × 100</span>
              </div>
              <div class="cf-quota-val" id="cfReqVal">—</div>
              <div class="cf-quota-sub">上限 <strong style="color:#555">10 万次</strong> / 天</div>
              <div class="cf-track"><div class="cf-fill" id="cfReqBar" style="width:0%"></div></div>
              <div style="display:flex;justify-content:space-between;margin-top:3px">
                <span style="font-size:.62rem;color:var(--tx-3)" id="cfReqPct">0%</span>
                <span style="font-size:.62rem;color:var(--tx-3)">剩余 <span id="cfReqLeft">—</span></span>
              </div>
            </div>
            <!-- R2 存储 -->
            <div class="cf-quota">
              <div class="cf-quota-top">
                <span class="cf-quota-lbl">💾 R2 存储</span>
                <span class="cf-quota-method">精确实时</span>
              </div>
              <div class="cf-quota-val" id="cfStorageVal">—</div>
              <div class="cf-quota-sub">上限 <strong style="color:#555">10 GB</strong></div>
              <div class="cf-track"><div class="cf-fill" id="cfStorageBar" style="width:0%"></div></div>
              <div style="display:flex;justify-content:space-between;margin-top:3px">
                <span style="font-size:.62rem;color:var(--tx-3)" id="cfStoragePct">0%</span>
                <span style="font-size:.62rem;color:var(--tx-3)">剩余 <span id="cfStorageLeft">—</span></span>
              </div>
            </div>
            <!-- R2 A 类操作 -->
            <div class="cf-quota">
              <div class="cf-quota-top">
                <span class="cf-quota-lbl">✏️ R2 A 类操作（本月）</span>
                <span class="cf-quota-method">实时追踪</span>
              </div>
              <div class="cf-quota-val" id="cfR2AVal">—</div>
              <div class="cf-quota-sub">上限 <strong style="color:#555">100 万次</strong> / 月</div>
              <div class="cf-track"><div class="cf-fill" id="cfR2ABar" style="width:0%"></div></div>
              <div style="display:flex;justify-content:space-between;margin-top:3px">
                <span style="font-size:.62rem;color:var(--tx-3)" id="cfR2APct">0%</span>
                <span style="font-size:.62rem;color:var(--tx-3)">剩余 <span id="cfR2ALeft">—</span></span>
              </div>
            </div>
            <!-- R2 B 类操作 -->
            <div class="cf-quota">
              <div class="cf-quota-top">
                <span class="cf-quota-lbl">📖 R2 B 类操作（本月）</span>
                <span class="cf-quota-method">部分追踪</span>
              </div>
              <div class="cf-quota-val" id="cfR2BVal">—</div>
              <div class="cf-quota-sub">上限 <strong style="color:#555">1000 万次</strong> / 月</div>
              <div class="cf-track"><div class="cf-fill" id="cfR2BBar" style="width:0%"></div></div>
              <div style="display:flex;justify-content:space-between;margin-top:3px">
                <span style="font-size:.62rem;color:var(--tx-3)" id="cfR2BPct">0%</span>
                <span style="font-size:.62rem;color:var(--tx-3)">剩余 <span id="cfR2BLeft">—</span></span>
              </div>
            </div>
          </div>
          <!-- KV 操作（STATS 命名空间） -->
          <div style="font-size:.7rem;color:var(--tx-2);margin:12px 0 7px;font-weight:500;letter-spacing:.03em">Workers KV <span style="color:var(--tx-3)">（STATS 命名空间，日限额独立计算）</span></div>
          <div class="cf-quotas">
            <!-- KV 读取 -->
            <div class="cf-quota">
              <div class="cf-quota-top">
                <span class="cf-quota-lbl">📖 KV 读取</span>
                <span class="cf-quota-method" id="cfKvReadsMethod">本月</span>
              </div>
              <div class="cf-quota-val" id="cfKvReads">—</div>
              <div class="cf-quota-sub">日限 <strong style="color:#555">10 万次</strong>　今日 <span id="cfKvReadsToday" style="color:var(--tx-2)">—</span></div>
              <div class="cf-track"><div class="cf-fill" id="cfKvReadsBar" style="width:0%"></div></div>
              <div style="display:flex;justify-content:space-between;margin-top:3px">
                <span style="font-size:.62rem;color:var(--tx-3)" id="cfKvReadsPct">均值/日</span>
                <span style="font-size:.62rem;color:var(--tx-3)" id="cfKvReadsAvg">—</span>
              </div>
            </div>
            <!-- KV 写入 -->
            <div class="cf-quota">
              <div class="cf-quota-top">
                <span class="cf-quota-lbl">✍️ KV 写入</span>
                <span class="cf-quota-method" id="cfKvWritesMethod">本月</span>
              </div>
              <div class="cf-quota-val" id="cfKvWrites">—</div>
              <div class="cf-quota-sub">日限 <strong style="color:#555">1,000 次</strong>　今日 <span id="cfKvWritesToday" style="color:var(--tx-2)">—</span></div>
              <div class="cf-track"><div class="cf-fill" id="cfKvWritesBar" style="width:0%"></div></div>
              <div style="display:flex;justify-content:space-between;margin-top:3px">
                <span style="font-size:.62rem;color:var(--tx-3)" id="cfKvWritesPct">均值/日</span>
                <span style="font-size:.62rem;color:var(--tx-3)" id="cfKvWritesAvg">—</span>
              </div>
            </div>
            <!-- KV 列表 -->
            <div class="cf-quota">
              <div class="cf-quota-top">
                <span class="cf-quota-lbl">📋 KV 列表</span>
                <span class="cf-quota-method" id="cfKvListsMethod">本月</span>
              </div>
              <div class="cf-quota-val" id="cfKvLists">—</div>
              <div class="cf-quota-sub">日限 <strong style="color:#555">1,000 次</strong>　今日 <span id="cfKvListsToday" style="color:var(--tx-2)">—</span></div>
              <div class="cf-track"><div class="cf-fill" id="cfKvListsBar" style="width:0%"></div></div>
              <div style="display:flex;justify-content:space-between;margin-top:3px">
                <span style="font-size:.62rem;color:var(--tx-3)" id="cfKvListsPct">均值/日</span>
                <span style="font-size:.62rem;color:var(--tx-3)" id="cfKvListsAvg">—</span>
              </div>
            </div>
            <!-- KV 删除 -->
            <div class="cf-quota">
              <div class="cf-quota-top">
                <span class="cf-quota-lbl">🗑️ KV 删除</span>
                <span class="cf-quota-method" id="cfKvDeletesMethod">本月</span>
              </div>
              <div class="cf-quota-val" id="cfKvDeletes">—</div>
              <div class="cf-quota-sub">日限 <strong style="color:#555">1,000 次</strong>　今日 <span id="cfKvDeletesToday" style="color:var(--tx-2)">—</span></div>
              <div class="cf-track"><div class="cf-fill" id="cfKvDeletesBar" style="width:0%"></div></div>
              <div style="display:flex;justify-content:space-between;margin-top:3px">
                <span style="font-size:.62rem;color:var(--tx-3)" id="cfKvDeletesPct">均值/日</span>
                <span style="font-size:.62rem;color:var(--tx-3)" id="cfKvDeletesAvg">—</span>
              </div>
            </div>
          </div>
          <!-- 未配置 API Token 提示 -->
          <div id="cfApiPrompt" style="display:none;margin-top:10px;padding:11px 14px;background:rgba(251,191,36,.05);border:1px solid rgba(251,191,36,.18);border-radius:8px;font-size:.75rem;color:#888;line-height:1.6">
            ⚠️ 未配置 CF API Token，KV 数据不可用。运行以下命令设置后重新部署：<br>
            <code style="display:inline-block;margin-top:5px;background:#111;padding:4px 10px;border-radius:5px;color:#7aabee;font-size:.8rem">wrangler secret put CF_API_TOKEN</code><br>
            <span style="color:#666">在 CF 控制台创建 Token，权限选 <strong style="color:#888">Account Analytics: Read</strong></span>
          </div>
          <!-- 次要信息行 -->
          <div class="cf-kv-row" style="margin-top:10px">
            <div class="cf-kv-item">
              <div class="cf-kv-icon">🗃️</div>
              <div>
                <div class="cf-kv-val" id="cfKvKeys">—</div>
                <div class="cf-kv-lbl">KV 键总数（实时）</div>
              </div>
            </div>
            <div class="cf-kv-item">
              <div class="cf-kv-icon">📅</div>
              <div>
                <div class="cf-kv-val" id="cfDay">—</div>
                <div class="cf-kv-lbl">今日（UTC）</div>
              </div>
            </div>
            <div class="cf-kv-item">
              <div class="cf-kv-icon">📆</div>
              <div>
                <div class="cf-kv-val" id="cfMonth">—</div>
                <div class="cf-kv-lbl">本月（UTC）</div>
              </div>
            </div>
          </div>
          <div class="cf-note">
            ⓘ R2 存储为实时精确扫描；R2 A/B 类操作及 KV 数据需配置 CF API Token 才能获取精确值；
            KV 限额为每日独立计算，进度条显示月均日用量占日限比例。
            <a href="https://dash.cloudflare.com" target="_blank" rel="noopener">CF 控制台</a>
          </div>
        </div>

        <div style="display:none"><div class="r2-panel">
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
            <div class="r2-cell" style="display:flex;flex-direction:column;align-items:center;justify-content:center">
              <div class="r2-cell-lbl" style="text-align:center">存储占用</div>
              <svg width="56" height="56" viewBox="0 0 56 56" style="display:block;margin:4px auto 0">
                <circle cx="28" cy="28" r="22" fill="none" stroke="#1e2a3a" stroke-width="6"/>
                <circle cx="28" cy="28" r="22" fill="none" stroke="#3b82f6" stroke-width="6"
                  stroke-dasharray="138.23" stroke-dashoffset="138.23" id="r2DonutArc"
                  stroke-linecap="round" transform="rotate(-90 28 28)" style="transition:stroke-dashoffset .5s,stroke .5s"/>
              </svg>
              <div class="r2-cell-sub" id="r2DonutLabel" style="text-align:center;margin-top:4px">0%</div>
            </div>
          </div>
        </div>
        <div class="section-header"><h3>图片访问最多</h3></div>
        <div style="background:#111;border:1px solid #1a1a1a;border-radius:12px;overflow:hidden;margin-bottom:28px">
          <table class="data-table">
            <thead><tr><th>图片</th><th>文件名</th><th>访问次数</th><th>最后访问</th><th></th></tr></thead>
            <tbody id="topImagesBody"><tr><td colspan="5" style="text-align:center;color:#333;padding:24px">加载中…</td></tr></tbody>
          </table>
        </div>
        <div class="section-header"><h3>页面访问最多</h3></div>
        <div style="background:#111;border:1px solid #1a1a1a;border-radius:12px;overflow:hidden;margin-bottom:28px">
          <table class="data-table">
            <thead><tr><th>标题 / Slug</th><th>访问次数</th><th>最后访问</th><th></th></tr></thead>
            <tbody id="topPagesBody"><tr><td colspan="4" style="text-align:center;color:#333;padding:24px">加载中…</td></tr></tbody>
          </table>
        </div>
          <div id="topTabProtos" style="display:none;padding:0">
            <table class="data-table">
              <thead><tr><th>标题</th><th>作者</th><th>访问次数</th><th>最后访问</th><th></th></tr></thead>
              <tbody id="topProtosBody"><tr><td colspan="5" style="text-align:center;color:#333;padding:24px">加载中…</td></tr></tbody>
            </table>
          </div>
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
            <thead><tr><th>标题 / Slug</th><th>类型</th><th>作者</th><th>状态</th><th>访问次数</th><th>更新</th><th></th></tr></thead>
            <tbody id="adminPagesBody"><tr><td colspan="7" style="text-align:center;color:#333;padding:24px">加载中…</td></tr></tbody>
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

      <!-- Protos -->
      <div class="section" id="section-protos">
        <div class="page-title">原型管理</div>
        <div class="page-sub">所有用户上传的 AxureRP / HTML 原型文件</div>
        <div class="section-header">
          <h3>所有原型</h3>
          <div class="spacer"></div>
          <button class="btn btn-ghost" id="refreshAdminProtos">刷新</button>
        </div>
        <div style="background:#111;border:1px solid #1a1a1a;border-radius:12px;overflow:hidden">
          <table class="data-table">
            <thead><tr><th>名称</th><th>作者</th><th>文件数</th><th>大小</th><th>密码</th><th>创建时间</th><th></th></tr></thead>
            <tbody id="adminProtosBody"><tr><td colspan="7" style="text-align:center;color:#333;padding:24px">加载中…</td></tr></tbody>
          </table>
        </div>
        <div class="empty" id="adminProtosEmpty" style="display:none">暂无原型</div>
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
      <div class="field" id="fieldUsername"><label>用户名 <span style="color:#5a7090">(字母/数字/_- 2-32位)</span></label><input type="text" id="umUsername" placeholder="alice"></div>
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
        <span style="font-size:.72rem;color:#5a7090;margin-top:4px">访问地址：<span id="apmSlugPreview" style="color:#60a5fa"></span></span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="field"><label>类型</label><select id="apmType"><option value="markdown">Markdown</option><option value="html">HTML</option></select></div>
        <div class="field"><label style="display:flex;align-items:center;gap:8px;margin-top:26px;cursor:pointer"><input type="checkbox" id="apmPublic" checked> 公开访问</label></div>
      </div>
      <div class="field" id="apmPwdSection" style="display:none">
        <label>访问密码</label>
        <div style="display:flex;gap:8px;align-items:center">
          <input type="text" id="apmPassword" maxlength="6" autocomplete="off" spellcheck="false"
            style="font-family:monospace;letter-spacing:.18em;font-size:.95rem;width:110px;padding:8px 10px;background:#0b0f1a;border:1px solid #2a3650;border-radius:7px;color:#e8edf5;outline:none">
          <button type="button" id="apmPwdGen" class="btn btn-ghost" style="white-space:nowrap;flex-shrink:0">重新生成</button>
        </div>
        <span style="font-size:.7rem;color:#5a7090;margin-top:4px;display:block">6位字母+数字，访客凭密码访问私密页面</span>
      </div>
      <div class="field" style="flex:1;display:flex;flex-direction:column;min-height:0">
        <label>内容</label>
        <div id="apmVditor" style="display:none"></div>
        <textarea id="apmContent" rows="14" style="resize:vertical;min-height:200px;font-family:monospace;font-size:.82rem;padding:10px 12px;background:#0b0f1a;border:1px solid #2a3650;border-radius:8px;color:#e8edf5;outline:none;width:100%" placeholder="# Hello\n\n内容…"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" id="apmCancel">取消</button>
      <button class="btn btn-primary" id="apmSave">创建</button>
    </div>
  </div>
</div>

<!-- Page Stats Modal -->
<div class="modal-overlay" id="pageStatsModal">
  <div class="modal stats-modal">
    <div class="modal-header">
      <h3>页面统计 <span style="font-size:.72rem;color:#5a7090;font-weight:400" id="psmTitle"></span></h3>
      <button class="modal-close" id="psmClose">✕</button>
    </div>
    <div class="modal-body">
      <div class="stat-summary">
        <div class="summary-card"><div class="val" id="psmTotal">—</div><div class="lbl">总访问次数</div></div>
        <div class="summary-card"><div class="val" id="psmUniqueIps">—</div><div class="lbl">独立 IP 数</div></div>
        <div class="summary-card"><div class="val" id="psmLast">—</div><div class="lbl">最后访问</div></div>
      </div>
      <div class="country-bars"><h4>国家 / 地区分布</h4><div id="psmCountryBars"></div></div>
      <div style="margin-top:20px">
        <h4 style="font-size:.8rem;color:#7a8fa8;margin-bottom:10px;font-weight:600">访问 IP Top 10</h4>
        <div id="psmIpBars"></div>
      </div>
      <div class="access-log">
        <h4>最近访问记录</h4>
        <table class="log-table">
          <thead><tr><th>时间</th><th>IP</th><th>国家</th><th>城市</th><th>ISP</th></tr></thead>
          <tbody id="psmLogBody"></tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<!-- Image Stats Modal -->
<div class="modal-overlay" id="statsModal">
  <div class="modal stats-modal">
    <div class="modal-header">
      <h3>访问统计 <span style="font-size:.72rem;color:#5a7090;font-weight:400" id="statsModalKey"></span></h3>
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

<!-- Proto Stats Modal -->
<div class="modal-overlay" id="protoStatsModal">
  <div class="modal stats-modal">
    <div class="modal-header">
      <h3>原型统计 <span style="font-size:.72rem;color:#555;font-weight:400" id="prsTitle"></span></h3>
      <button class="modal-close" id="prsClose">✕</button>
    </div>
    <div class="modal-body">
      <div class="stat-summary">
        <div class="summary-card"><div class="val" id="prsTotal">—</div><div class="lbl">总访问次数</div></div>
        <div class="summary-card"><div class="val" id="prsUniqueIps">—</div><div class="lbl">独立 IP 数</div></div>
        <div class="summary-card"><div class="val" id="prsLast">—</div><div class="lbl">最后访问</div></div>
      </div>
      <div class="country-bars"><h4>国家 / 地区分布</h4><div id="prsCountryBars"></div></div>
      <div class="access-log">
        <h4>最近访问记录</h4>
        <table class="log-table">
          <thead><tr><th>时间</th><th>IP</th><th>国家</th></tr></thead>
          <tbody id="prsLogBody"></tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<!-- Proto Version History & Diff Modal -->
<div class="modal-overlay" id="protoVersionModal">
  <div class="modal" style="max-width:900px;width:95vw;max-height:85vh;height:85vh;display:flex;flex-direction:column">
    <div class="modal-header" style="flex-shrink:0">
      <h3>版本历史 <span style="font-size:.72rem;color:#555;font-weight:400" id="pvmTitle"></span></h3>
      <button class="modal-close" id="pvmClose">✕</button>
    </div>
    <div style="display:flex;flex:1;min-height:0">
      <!-- Left: version list -->
      <div style="width:200px;flex-shrink:0;border-right:1px solid #1a1a1a;overflow-y:auto;padding:12px 10px;display:flex;flex-direction:column;gap:6px" id="pvmVersionList"></div>
      <!-- Right: file view / diff -->
      <div style="flex:1;display:flex;flex-direction:column;min-width:0">
        <!-- Toolbar -->
        <div style="padding:10px 14px;border-bottom:1px solid #1a1a1a;display:flex;align-items:center;gap:8px;flex-shrink:0;flex-wrap:wrap">
          <span style="font-size:.78rem;color:#555" id="pvmMode">点击版本号查看文件列表，勾选两个版本进行对比</span>
          <div style="flex:1"></div>
          <input type="text" id="pvmSearch" placeholder="搜索文件…" style="padding:4px 8px;background:#111;border:1px solid #222;border-radius:6px;color:#ccc;font-size:.78rem;width:160px;outline:none">
          <button class="btn btn-ghost" id="pvmDiffBtn" style="padding:4px 10px;font-size:.78rem;display:none">对比选中版本</button>
        </div>
        <!-- Content area -->
        <div style="flex:1;overflow-y:auto;padding:14px 16px" id="pvmContent">
          <div style="color:#333;text-align:center;padding:60px 0;font-size:.85rem">← 点击左侧版本号查看文件列表</div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
  function _fflate() {
    if (!window.fflate) throw new Error('压缩库未加载，请刷新页面后重试');
    return window.fflate;
  }
  const TOKEN_KEY = 'onimg_admin_token';
  const USER_KEY  = 'onimg_admin_user';
  const ALL_TYPES = ['image/jpeg','image/png','image/gif','image/webp','image/svg+xml','image/avif','image/bmp','image/tiff'];
  const TYPE_LABELS = { 'image/jpeg':'JPG','image/png':'PNG','image/gif':'GIF','image/webp':'WebP','image/svg+xml':'SVG','image/avif':'AVIF','image/bmp':'BMP','image/tiff':'TIFF' };

  let adminToken = localStorage.getItem(TOKEN_KEY);
  let adminUser  = localStorage.getItem(USER_KEY) || 'admin';
  let allImages = [], allStats = {}, galleryCursor = null, selected = new Set(), lbKey = null;
  let editingUser = null;
  let apmVditorInst = null;
  let expiryTimerId = null;

  const authH = () => ({ 'Authorization': 'Bearer ' + adminToken, 'Content-Type': 'application/json' });

  function parseTokenExp(tok) {
    try { return JSON.parse(atob(tok.split('.')[0])).exp * 1000; } catch { return null; }
  }

  function checkTokenValid() {
    if (!adminToken) return false;
    const exp = parseTokenExp(adminToken);
    if (exp && Date.now() > exp) { localStorage.removeItem(TOKEN_KEY); adminToken = null; return false; }
    return true;
  }

  if (adminToken && checkTokenValid()) showApp(); else { adminToken = null; showLogin(); }

  function showLogin() { document.getElementById('loginScreen').style.display = 'flex'; document.getElementById('adminApp').style.display = 'none'; }
  function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminApp').style.display = 'block';
    document.getElementById('sidebarUsername').textContent = adminUser;
    document.getElementById('avatarLetter').textContent = adminUser[0].toUpperCase();
    startExpiryWatch();
    loadDashboard();
    loadR2Stats();
    loadCfQuota();
    loadSettings();
  }

  function startExpiryWatch() {
    if (expiryTimerId) clearInterval(expiryTimerId);
    function checkAndShow() {
      if (!adminToken) return;
      const exp = parseTokenExp(adminToken);
      if (!exp) return;
      const remaining = exp - Date.now();
      if (remaining <= 0) { handleUnauth(); return; }
      if (remaining < 30 * 60000) {
        const mins = Math.floor(remaining / 60000);
        document.getElementById('expiryBanner').classList.add('show');
        document.getElementById('expiryCountdown').textContent = mins > 0 ? mins + ' 分钟' : '不到 1 分钟';
      }
    }
    checkAndShow();
    expiryTimerId = setInterval(checkAndShow, 60000);
  }

  function triggerReLogin() {
    document.getElementById('expiryBanner').classList.remove('show');
    if (expiryTimerId) { clearInterval(expiryTimerId); expiryTimerId = null; }
    localStorage.removeItem(TOKEN_KEY); adminToken = null; showLogin();
  }

  // Login
  const LOGIN_ERR_MAP = {
    'Invalid credentials': '账号或密码错误',
    'Missing credentials': '请填写账号和密码',
    'Admin not configured': '管理员账号未配置，请检查环境变量',
  };
  function friendlyLoginErr(msg) { return LOGIN_ERR_MAP[msg] || msg || '登录失败，请稍后重试'; }

  const loginBtn = document.getElementById('loginBtn');
  const loginCard = document.querySelector('#loginScreen .login-card');

  function shakeLoginCard() {
    loginCard.classList.remove('shake');
    void loginCard.offsetWidth;
    loginCard.classList.add('shake');
    loginCard.addEventListener('animationend', () => loginCard.classList.remove('shake'), { once: true });
  }

  document.getElementById('loginUser').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('loginPass').focus(); });
  document.getElementById('loginPass').addEventListener('keydown', e => { if (e.key === 'Enter') loginBtn.click(); });

  document.getElementById('loginPassToggle').addEventListener('click', () => {
    const inp = document.getElementById('loginPass');
    const tog = document.getElementById('loginPassToggle');
    if (inp.type === 'password') { inp.type = 'text'; tog.textContent = '🙈'; } else { inp.type = 'password'; tog.textContent = '👁'; }
  });

  loginBtn.addEventListener('click', async () => {
    const u = document.getElementById('loginUser').value.trim(), p = document.getElementById('loginPass').value;
    const err = document.getElementById('loginErr');
    if (!u || !p) { err.textContent = '请填写账号和密码'; shakeLoginCard(); return; }
    loginBtn.classList.add('loading'); loginBtn.textContent = '登录中…'; err.textContent = '';
    try {
      const res = await fetch('/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:u,password:p}) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      adminToken = data.token; adminUser = data.username || u;
      localStorage.setItem(TOKEN_KEY, adminToken); localStorage.setItem(USER_KEY, adminUser);
      showApp();
    } catch(e) { err.textContent = friendlyLoginErr(e.message); shakeLoginCard(); }
    loginBtn.classList.remove('loading'); loginBtn.textContent = '登录';
  });
  setTimeout(() => document.getElementById('loginUser').focus(), 80);

  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (!confirm('确认退出登录？')) return;
    if (expiryTimerId) { clearInterval(expiryTimerId); expiryTimerId = null; }
    document.getElementById('expiryBanner').classList.remove('show');
    localStorage.removeItem(TOKEN_KEY); adminToken = null; showLogin();
  });

  // Nav
  const sidebarEl = document.querySelector('aside');
  const sidebarMask = document.getElementById('sidebarMask');
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    sidebarEl.classList.toggle('open');
    sidebarMask.classList.toggle('show');
  });
  sidebarMask.addEventListener('click', () => {
    sidebarEl.classList.remove('open');
    sidebarMask.classList.remove('show');
  });

  document.querySelectorAll('.nav-item[data-section]').forEach(btn => {
    btn.addEventListener('click', () => {
      switchSection(btn.dataset.section);
      sidebarEl.classList.remove('open');
      sidebarMask.classList.remove('show');
    });
  });
  function switchSection(name) {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.section === name));
    document.querySelectorAll('.section').forEach(s => s.classList.toggle('active', s.id === 'section-' + name));
    if (name === 'images' && !allImages.length) loadGallery(true);
    if (name === 'users') loadUsers();
    if (name === 'pages') loadAdminPages();
    if (name === 'protos') loadAdminProtos();
    if (name === 'members') loadMemberStats();
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  let allPageStats = {};

  async function loadDashboard() {
    const [sRes, iRes, pRes, psRes] = await Promise.all([
      fetch('/admin/stats', { headers: authH() }),
      fetch('/admin/all-image-stats', { headers: authH() }),
      fetch('/admin/pages', { headers: authH() }),
      fetch('/admin/all-page-stats', { headers: authH() }),
    ]);
    if (sRes.status === 401) { handleUnauth(); return; }
    const { totalImages, totalSize } = await sRes.json();
    const { stats } = await iRes.json();
    const { pages } = await pRes.json();
    const { stats: pgStats } = await psRes.json();
    allStats = stats;
    allPageStats = pgStats;

    document.getElementById('statImages').textContent = totalImages.toLocaleString();
    const { val, unit } = fmtSizeParts(totalSize);
    document.getElementById('statSize').textContent = val;
    document.getElementById('statSizeUnit').textContent = unit;
    document.getElementById('statFree').textContent = Math.max(0, 10 - totalSize/1073741824).toFixed(2);
    document.getElementById('statViews').textContent = Object.values(stats).reduce((s,v) => s+(v.count??0), 0).toLocaleString();
    document.getElementById('statPages').textContent = pages.length.toLocaleString();
    document.getElementById('statPageViews').textContent = Object.values(pgStats).reduce((s,v) => s+(v.count??0), 0).toLocaleString();

    // Top images
    const sortedImg = Object.entries(stats).sort((a,b) => (b[1].count??0)-(a[1].count??0)).slice(0,10);
    document.getElementById('topImagesBody').innerHTML = sortedImg.length
      ? sortedImg.map(([k,s]) => \`<tr>
          <td><img class="top-thumb" src="\${origin}/\${k}" loading="lazy" onclick="openLightbox('\${k}')"></td>
          <td style="font-family:monospace;font-size:.78rem;color:#888">\${k}</td>
          <td class="view-count">\${(s.count??0).toLocaleString()}</td>
          <td class="muted">\${s.lastAccess ? timeAgo(s.lastAccess) : '—'}</td>
          <td><button class="btn btn-ghost" style="padding:4px 8px;font-size:.75rem" onclick="openStatsModal('\${k}')">详情</button></td>
        </tr>\`).join('')
      : '<tr><td colspan="5" style="text-align:center;color:#333;padding:24px">暂无访问记录</td></tr>';

    // Top pages
    const pageMap = {};
    pages.forEach(p => pageMap[p.slug] = p.title || p.slug);
    const sortedPg = Object.entries(pgStats).sort((a,b) => (b[1].count??0)-(a[1].count??0)).slice(0,10);
    document.getElementById('topPagesBody').innerHTML = sortedPg.length
      ? sortedPg.map(([slug,s]) => \`<tr>
          <td>
            <div style="font-weight:500;font-size:.88rem">\${esc(pageMap[slug] || slug)}</div>
            <div style="font-family:monospace;font-size:.72rem;color:#555">/p/\${slug}</div>
          </td>
          <td class="view-count">\${(s.count??0).toLocaleString()}</td>
          <td class="muted">\${s.lastAccess ? timeAgo(s.lastAccess) : '—'}</td>
          <td><button class="btn btn-ghost" style="padding:4px 8px;font-size:.75rem" data-title="\${esc(pageMap[slug]||slug)}" onclick="openPageStatsModal('\${slug}',this.dataset.title)">详情</button></td>
        </tr>\`).join('')
      : '<tr><td colspan="4" style="text-align:center;color:#333;padding:24px">暂无访问记录</td></tr>';
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
    const keys = [...selected];
    if (!confirm(\`确认删除选中的 \${keys.length} 张图片？此操作不可撤销。\`)) return;
    const btn = document.getElementById('bulkDeleteBtn');
    btn.disabled = true;
    let ok = 0, fail = 0;
    for (const k of keys) {
      try { await doDelete(k); ok++; } catch { fail++; }
      btn.textContent = \`删除中 (\${ok + fail}/\${keys.length})\`;
    }
    btn.disabled = false; btn.textContent = '批量删除';
    allImages = allImages.filter(i => !selected.has(i.key));
    selected.clear(); updateBulkBar(); renderGallery();
    toast(fail ? \`删除完成：\${ok} 成功，\${fail} 失败\` : \`已删除 \${ok} 张图片\`, fail ? 'warn' : 'success');
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

  // ── Page Stats Modal ──────────────────────────────────────────────────────────
  async function openPageStatsModal(slug, title) {
    document.getElementById('psmTitle').textContent = title ? \`\${title} (/p/\${slug})\` : '/p/' + slug;
    document.getElementById('psmTotal').textContent = '…';
    document.getElementById('psmUniqueIps').textContent = '…';
    document.getElementById('psmLast').textContent = '…';
    document.getElementById('psmCountryBars').innerHTML = '';
    document.getElementById('psmIpBars').innerHTML = '';
    document.getElementById('psmLogBody').innerHTML = '<tr><td colspan="5" style="color:#333;text-align:center;padding:16px">加载中…</td></tr>';
    document.getElementById('pageStatsModal').classList.add('show');
    try {
      const res = await fetch('/admin/page-stats/' + encodeURIComponent(slug), { headers: authH() });
      const data = await res.json();
      document.getElementById('psmTotal').textContent = (data.count ?? 0).toLocaleString();
      document.getElementById('psmUniqueIps').textContent = (data.uniqueIps ?? 0).toLocaleString();
      document.getElementById('psmLast').textContent = data.lastAccess ? timeAgo(data.lastAccess) : '—';

      // Country bars
      const cl = Object.entries(data.countries ?? {}).sort((a,b) => b[1]-a[1]);
      const maxC = cl[0]?.[1] ?? 1;
      document.getElementById('psmCountryBars').innerHTML = cl.slice(0,8).map(([cc,cnt]) =>
        \`<div class="country-row"><span class="country-name">\${cc}</span><div class="bar-wrap"><div class="bar" style="width:\${(cnt/maxC*100).toFixed(1)}%"></div></div><span class="country-count">\${cnt}</span></div>\`
      ).join('') || '<span style="color:#333;font-size:.82rem">暂无数据</span>';

      // IP bars
      const il = Object.entries(data.ips ?? {}).sort((a,b) => b[1]-a[1]).slice(0,10);
      const maxI = il[0]?.[1] ?? 1;
      document.getElementById('psmIpBars').innerHTML = il.map(([ip,cnt]) =>
        \`<div class="country-row"><span style="width:120px;font-family:monospace;font-size:.75rem;color:#aaa;flex-shrink:0;overflow:hidden;text-overflow:ellipsis">\${ip}</span><div class="bar-wrap"><div class="bar" style="width:\${(cnt/maxI*100).toFixed(1)}%"></div></div><span class="country-count">\${cnt}</span></div>\`
      ).join('') || '<span style="color:#333;font-size:.82rem">暂无数据</span>';

      // Access log
      document.getElementById('psmLogBody').innerHTML = (data.accesses ?? []).slice(0,50).map(a =>
        \`<tr><td>\${new Date(a.ts).toLocaleString('zh-CN')}</td><td style="font-family:monospace">\${a.ip}</td><td>\${a.country}</td><td>\${[a.city,a.region].filter(x=>x&&x!=='—').join(' ')}</td><td style="color:#444">\${a.org!=='—'?a.org:''}</td></tr>\`
      ).join('') || '<tr><td colspan="5" style="color:#333;text-align:center">暂无记录</td></tr>';
    } catch {
      document.getElementById('psmLogBody').innerHTML = '<tr><td colspan="5" style="color:#555;text-align:center">加载失败</td></tr>';
    }
  }
  document.getElementById('psmClose').addEventListener('click', () => document.getElementById('pageStatsModal').classList.remove('show'));
  document.getElementById('pageStatsModal').addEventListener('click', e => { if (e.target===document.getElementById('pageStatsModal')) document.getElementById('pageStatsModal').classList.remove('show'); });

  // ── Proto Stats Modal ──────────────────────────────────────────────────────────
  async function openProtoStatsModal(protoId, title) {
    document.getElementById('prsTitle').textContent = title || protoId;
    document.getElementById('prsTotal').textContent = '…';
    document.getElementById('prsUniqueIps').textContent = '…';
    document.getElementById('prsLast').textContent = '…';
    document.getElementById('prsCountryBars').innerHTML = '';
    document.getElementById('prsLogBody').innerHTML = '<tr><td colspan="3" style="color:#333;text-align:center">加载中…</td></tr>';
    document.getElementById('protoStatsModal').classList.add('show');
    try {
      const res = await fetch('/admin/proto-stats/' + encodeURIComponent(protoId), { headers: authH() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      document.getElementById('prsTotal').textContent = (data.count ?? 0).toLocaleString();
      document.getElementById('prsUniqueIps').textContent = (data.uniqueIps ?? 0).toLocaleString();
      document.getElementById('prsLast').textContent = data.lastAccess ? timeAgo(data.lastAccess) : '—';
      const cl = Object.entries(data.countries ?? {}).sort((a,b) => b[1]-a[1]).slice(0,10);
      const maxC = cl[0]?.[1] ?? 1;
      document.getElementById('prsCountryBars').innerHTML = cl.map(([c,cnt]) =>
        \`<div class="country-row"><span class="country-name">\${c}</span><div class="bar-wrap"><div class="bar" style="width:\${(cnt/maxC*100).toFixed(1)}%"></div></div><span class="country-count">\${cnt}</span></div>\`
      ).join('') || '<span style="color:#333;font-size:.82rem">暂无数据</span>';
      document.getElementById('prsLogBody').innerHTML = (data.accesses ?? []).slice(0,50).map(a =>
        \`<tr><td>\${new Date(a.ts).toLocaleString('zh-CN')}</td><td style="font-family:monospace;font-size:.75rem">\${a.ip}</td><td>\${a.country}</td></tr>\`
      ).join('') || '<tr><td colspan="3" style="color:#333;text-align:center">暂无记录</td></tr>';
    } catch {
      document.getElementById('prsLogBody').innerHTML = '<tr><td colspan="3" style="color:#555;text-align:center">加载失败</td></tr>';
    }
  }
  document.getElementById('prsClose').addEventListener('click', () => document.getElementById('protoStatsModal').classList.remove('show'));
  document.getElementById('protoStatsModal').addEventListener('click', e => { if (e.target===document.getElementById('protoStatsModal')) document.getElementById('protoStatsModal').classList.remove('show'); });

  // ── Proto Version History & Diff Modal ───────────────────────────────────────
  let pvmProto = null;         // current proto object
  let pvmFileCache = {};       // { 'v3': [...paths] }
  let pvmChecked = [];         // [vN, vM] — versions selected for diff (max 2)
  let pvmActiveVer = null;     // single version being viewed

  function openProtoVersions(idx) {
    pvmProto    = adminProtosCache[idx] ?? {};
    pvmFileCache = {};
    pvmChecked   = [];
    pvmActiveVer = null;

    document.getElementById('pvmTitle').textContent = pvmProto.title || pvmProto.protoId || '';
    document.getElementById('pvmSearch').value = '';
    document.getElementById('pvmDiffBtn').style.display = 'none';
    document.getElementById('pvmMode').textContent = '点击版本号查看文件列表，勾选两个版本进行对比';
    document.getElementById('pvmContent').innerHTML = '<div style="color:#333;text-align:center;padding:60px 0;font-size:.85rem">← 点击左侧版本号查看文件列表</div>';

    pvmRenderVersionList();
    document.getElementById('protoVersionModal').classList.add('show');
  }

  function pvmRenderVersionList() {
    const versions = [...(pvmProto.versions ?? [])].reverse(); // newest first
    const maxVer   = pvmProto.version ?? 1;
    document.getElementById('pvmVersionList').innerHTML = versions.map(v => {
      const isLatest  = v.v === maxVer;
      const isActive  = pvmActiveVer === v.v;
      const checkIdx  = pvmChecked.indexOf(v.v);
      const cardClass = checkIdx === 0 ? 'pvm-ver-card checked-a'
                      : checkIdx === 1 ? 'pvm-ver-card checked-b'
                      : isActive       ? 'pvm-ver-card active'
                      :                  'pvm-ver-card';
      return \`<div class="\${cardClass}" onclick="pvmSelectVersion(\${v.v})">
        <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
          <span class="pvm-ver-badge">v\${v.v}</span>
          \${isLatest ? '<span class="pvm-ver-latest">最新</span>' : ''}
          \${!isLatest ? \`<button class="btn btn-danger" style="padding:1px 6px;font-size:.62rem;margin-left:auto" onclick="event.stopPropagation();pvmDeleteVersion(\${v.v})">删除</button>\` : ''}
        </div>
        <div class="pvm-ver-meta">\${v.at ? new Date(v.at).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—'}</div>
        <div class="pvm-ver-meta">\${v.files ?? '?'} 文件 · \${v.size ? fmtSize(v.size) : '—'}</div>
        <label class="pvm-ver-check" onclick="event.stopPropagation()">
          <input type="checkbox" \${checkIdx >= 0 ? 'checked' : ''} onchange="pvmToggleCheck(\${v.v}, this.checked)">
          <span style="color:\${checkIdx===0?'#10b981':checkIdx===1?'#f59e0b':'#555'}">\${checkIdx===0?'对比 A':checkIdx===1?'对比 B':'加入对比'}</span>
        </label>
      </div>\`;
    }).join('');
  }

  async function pvmDeleteVersion(ver) {
    if (!confirm(\`确认删除 v\${ver}？该操作仅删除版本记录，不影响当前原型内容。\`)) return;
    const pid = pvmProto.protoId;
    const res = await fetch(\`/admin/proto-versions/\${encodeURIComponent(pid)}/v\${ver}\`, { method: 'DELETE', headers: authH() });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { toast('删除失败: ' + (d.error || '')); return; }
    // Remove from local cache & update pvmProto
    pvmProto.versions = (pvmProto.versions ?? []).filter(v => v.v !== ver);
    delete pvmFileCache[\`v\${ver}\`];
    pvmChecked = pvmChecked.filter(v => v !== ver);
    if (pvmActiveVer === ver) {
      pvmActiveVer = null;
      document.getElementById('pvmContent').innerHTML = '<div style="color:#333;text-align:center;padding:60px 0;font-size:.85rem">← 点击左侧版本号查看文件列表</div>';
    }
    // Also sync adminProtosCache
    const cacheEntry = adminProtosCache.find(p => p.protoId === pid);
    if (cacheEntry) cacheEntry.versions = pvmProto.versions;
    pvmRenderVersionList();
    toast(\`v\${ver} 已删除\`);
  }

  async function pvmSelectVersion(ver) {
    pvmActiveVer = ver;
    pvmRenderVersionList();
    const files = await pvmFetchFiles(ver);
    pvmShowFileList(files, \`v\${ver} 文件列表 (\${files?.length ?? '?'} 个)\`);
  }

  function pvmToggleCheck(ver, checked) {
    if (checked) {
      if (pvmChecked.length >= 2) pvmChecked.shift();
      pvmChecked.push(ver);
    } else {
      pvmChecked = pvmChecked.filter(v => v !== ver);
    }
    pvmRenderVersionList();
    const diffBtn = document.getElementById('pvmDiffBtn');
    if (pvmChecked.length === 2) {
      diffBtn.style.display = '';
      document.getElementById('pvmMode').textContent = \`已选 v\${pvmChecked[0]}（A）与 v\${pvmChecked[1]}（B），点击"对比"查看差异\`;
    } else {
      diffBtn.style.display = 'none';
      document.getElementById('pvmMode').textContent = pvmChecked.length === 1
        ? \`已选 v\${pvmChecked[0]} 为对比 A，再勾选一个版本\`
        : '点击版本号查看文件列表，勾选两个版本进行对比';
    }
  }

  async function pvmFetchFiles(ver) {
    const token = \`v\${ver}\`;
    if (pvmFileCache[token] !== undefined) return pvmFileCache[token];
    pvmShowLoading();
    try {
      const pid = pvmProto.protoId;
      const res = await fetch(\`/admin/proto-vfiles/\${encodeURIComponent(pid)}/\${token}\`, { headers: authH() });
      const data = res.ok ? await res.json() : {};
      pvmFileCache[token] = data.files ?? null;
    } catch { pvmFileCache[token] = null; }
    return pvmFileCache[token];
  }

  function pvmShowLoading() {
    document.getElementById('pvmContent').innerHTML = '<div style="color:#333;text-align:center;padding:40px 0">加载中…</div>';
  }

  function pvmShowFileList(files, title) {
    const q = document.getElementById('pvmSearch').value.toLowerCase();
    if (!files) {
      document.getElementById('pvmContent').innerHTML = \`<div style="color:#555;font-size:.82rem;text-align:center;padding:40px 0">该版本无文件记录（旧版本上传未记录文件列表）</div>\`;
      return;
    }
    const filtered = q ? files.filter(f => f.toLowerCase().includes(q)) : files;
    document.getElementById('pvmContent').innerHTML = \`
      <div style="font-size:.75rem;color:#555;margin-bottom:10px;font-weight:500">\${title}\${q ? \` — 过滤 "\${q}"\` : ''}</div>
      <div>\${filtered.map(f => \`<div class="file-row">\${esc(f)}</div>\`).join('') || '<div style="color:#333;font-size:.82rem;padding:20px 0">无匹配文件</div>'}</div>\`;
  }

  document.getElementById('pvmDiffBtn').addEventListener('click', async () => {
    if (pvmChecked.length < 2) return;
    const [a, b] = pvmChecked;
    pvmShowLoading();
    const [filesA, filesB] = await Promise.all([pvmFetchFiles(a), pvmFetchFiles(b)]);
    if (!filesA && !filesB) {
      document.getElementById('pvmContent').innerHTML = '<div style="color:#555;text-align:center;padding:40px 0;font-size:.82rem">两个版本均无文件记录（旧版本上传未记录文件列表）</div>';
      return;
    }
    if (!filesA || !filesB) {
      const missing = !filesA ? \`v\${a}\` : \`v\${b}\`;
      document.getElementById('pvmContent').innerHTML = \`<div style="color:#555;text-align:center;padding:40px 0;font-size:.82rem">\${missing} 无文件记录，无法对比</div>\`;
      return;
    }
    pvmRenderDiff(filesA, filesB, a, b);
  });

  function pvmRenderDiff(filesA, filesB, verA, verB) {
    const q    = document.getElementById('pvmSearch').value.toLowerCase();
    const setA = new Set(filesA);
    const setB = new Set(filesB);
    let added   = filesB.filter(f => !setA.has(f));  // in B (newer) not in A
    let removed = filesA.filter(f => !setB.has(f));  // in A (older) not in B
    let same    = filesA.filter(f => setB.has(f));
    if (q) {
      added   = added.filter(f   => f.toLowerCase().includes(q));
      removed = removed.filter(f => f.toLowerCase().includes(q));
      same    = same.filter(f   => f.toLowerCase().includes(q));
    }
    const summary = \`<div style="display:flex;gap:12px;margin-bottom:16px;font-size:.78rem;flex-wrap:wrap">
      <span>v\${verA} → v\${verB}</span>
      <span style="color:#10b981">+\${added.length} 新增</span>
      <span style="color:#ef4444">-\${removed.length} 删除</span>
      <span style="color:#555">\${same.length} 不变</span>
    </div>\`;

    const mkRows = (files, cls, prefix) =>
      files.map(f => \`<div class="diff-file \${cls}"><span class="diff-prefix">\${prefix}</span>\${esc(f)}</div>\`).join('');

    let html = summary;
    if (added.length)
      html += \`<div class="diff-section add"><h4>✦ 新增 \${added.length} 个文件（v\${verB} 新增）</h4>\${mkRows(added,'diff-add','+')}</div>\`;
    if (removed.length)
      html += \`<div class="diff-section rem"><h4>✦ 删除 \${removed.length} 个文件（v\${verB} 移除）</h4>\${mkRows(removed,'diff-rem','−')}</div>\`;
    if (same.length)
      html += \`<div class="diff-section same"><h4>· 未变动 \${same.length} 个文件</h4>\${mkRows(same,'diff-same',' ')}</div>\`;
    if (!added.length && !removed.length && !same.length)
      html += '<div style="color:#333;text-align:center;padding:40px 0;font-size:.82rem">无匹配文件</div>';

    document.getElementById('pvmContent').innerHTML = html;
  }

  document.getElementById('pvmSearch').addEventListener('input', () => {
    // Re-render current view with filter
    if (pvmChecked.length === 2 && document.getElementById('pvmContent').querySelector('.diff-section, .diff-file')) {
      // was showing diff
      (async () => {
        const [a, b] = pvmChecked;
        const [fa, fb] = await Promise.all([pvmFetchFiles(a), pvmFetchFiles(b)]);
        if (fa && fb) pvmRenderDiff(fa, fb, a, b);
      })();
    } else if (pvmActiveVer !== null) {
      const files = pvmFileCache[\`v\${pvmActiveVer}\`];
      pvmShowFileList(files ?? null, \`v\${pvmActiveVer} 文件列表 (\${files?.length ?? '?'} 个)\`);
    }
  });

  document.getElementById('pvmClose').addEventListener('click', () => document.getElementById('protoVersionModal').classList.remove('show'));
  document.getElementById('protoVersionModal').addEventListener('click', e => { if (e.target===document.getElementById('protoVersionModal')) document.getElementById('protoVersionModal').classList.remove('show'); });

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
            <button class="btn btn-ghost" style="padding:4px 8px;font-size:.75rem" data-title="\${esc(p.title)}" onclick="openPageStatsModal('\${p.slug}',this.dataset.title)">统计</button>
            <button class="btn btn-danger" style="padding:4px 8px;font-size:.75rem" onclick="adminDeletePage('\${p.slug}')">删除</button>
          </td>
        </tr>\`).join('')
      : '<tr><td colspan="6" style="text-align:center;color:#333;padding:24px">暂无页面</td></tr>';
  }

  function genApmPwd() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const arr = new Uint8Array(6);
    crypto.getRandomValues(arr);
    document.getElementById('apmPassword').value = Array.from(arr, b => chars[b % chars.length]).join('');
  }
  document.getElementById('apmPwdGen').addEventListener('click', genApmPwd);
  document.getElementById('apmPublic').addEventListener('change', function() {
    const sec = document.getElementById('apmPwdSection');
    if (!this.checked) {
      sec.style.display = '';
      if (!document.getElementById('apmPassword').value) genApmPwd();
    } else {
      sec.style.display = 'none';
    }
  });

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
    const isPublic = page?.isPublic !== false;
    document.getElementById('apmPublic').checked = isPublic;
    const pwdSec = document.getElementById('apmPwdSection');
    const pwdInput = document.getElementById('apmPassword');
    if (!isPublic) {
      pwdSec.style.display = '';
      pwdInput.value = page?.accessPassword || '';
      if (!pwdInput.value) genApmPwd();
    } else {
      pwdSec.style.display = 'none';
      pwdInput.value = '';
    }
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
    const accessPassword = !isPublic ? (document.getElementById('apmPassword').value.trim() || null) : null;
    if (!slug || !content) { toast('Slug 和内容不能为空'); return; }
    const isEdit = !!adminEditingSlug;
    const url  = isEdit ? '/admin/pages/' + encodeURIComponent(adminEditingSlug) : '/admin/pages';
    const meth = isEdit ? 'PATCH' : 'POST';
    const body = isEdit ? { title, content, type, isPublic, accessPassword } : { slug, title, content, type, isPublic, accessPassword };
    const res = await fetch(url, { method:meth, headers:authH(), body:JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { toast('失败: ' + data.error); return; }
    if (apmVditorInst) { apmVditorInst.destroy(); apmVditorInst = null; }
    document.getElementById('apmVditor').style.display = 'none';
    document.getElementById('apmContent').style.display = '';
    document.getElementById('adminPageModal').classList.remove('show');
    toast(isEdit ? '已保存' : '页面已创建');
    loadAdminPages();
  });
  function closeApmModal() {
    document.getElementById('adminPageModal').classList.remove('show');
    if (apmVditorInst) { apmVditorInst.destroy(); apmVditorInst = null; }
    document.getElementById('apmVditor').style.display = 'none';
    document.getElementById('apmContent').style.display = '';
    document.getElementById('apmPwdSection').style.display = 'none';
    document.getElementById('apmPassword').value = '';
  }
  ['apmClose','apmCancel'].forEach(id => document.getElementById(id).addEventListener('click', closeApmModal));

  // ── Admin Protos ──────────────────────────────────────────────────────────────
  async function loadAdminProtos() {
    const tbody = document.getElementById('adminProtosBody');
    const empty = document.getElementById('adminProtosEmpty');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#333;padding:24px">加载中…</td></tr>';
    empty.style.display = 'none';
    try {
      const res = await fetch('/admin/protos', { headers: authH() });
      if (!res.ok) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#555;padding:24px">加载失败</td></tr>'; return; }
      const { protos } = await res.json();
      if (!protos.length) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
      tbody.innerHTML = protos.map(p => {
        const url = location.origin + '/proto/' + p.protoId + '/';
        const lock = p.hasPassword ? '<span style="background:rgba(251,191,36,.1);color:#fbbf24;border-radius:4px;font-size:.68rem;padding:1px 5px">🔒</span>' : '';
        return \`<tr>
          <td>
            <div style="font-weight:500;font-size:.88rem">\${esc(p.title || p.protoId)} \${lock}</div>
            <div style="font-family:monospace;font-size:.68rem;color:#444">\${p.protoId}</div>
          </td>
          <td class="muted">@\${esc(p.owner || '—')}</td>
          <td class="muted">\${p.fileCount ?? '—'}</td>
          <td class="muted">\${fmtSize(p.totalSize || 0)}</td>
          <td>\${p.hasPassword ? '<span style="color:#fbbf24;font-size:.78rem">有密码</span>' : '<span style="color:#555;font-size:.78rem">无</span>'}</td>
          <td class="muted">\${timeAgo(p.createdAt)}</td>
          <td style="white-space:nowrap">
            <a href="\${url}" target="_blank" class="btn btn-ghost" style="padding:4px 8px;font-size:.75rem;text-decoration:none">预览</a>
            <button class="btn btn-danger" style="padding:4px 8px;font-size:.75rem" onclick="adminDeleteProto('\${esc(p.protoId)}')">删除</button>
          </td>
        </tr>\`;
      }).join('');
    } catch { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#555;padding:24px">加载失败</td></tr>'; }
  }

  async function adminDeleteProto(protoId) {
    if (!confirm('确认删除此原型？将同时删除所有相关文件，此操作无法撤销。')) return;
    const res = await fetch('/admin/protos/' + encodeURIComponent(protoId), { method: 'DELETE', headers: authH() });
    if (!res.ok) { const d = await res.json().catch(()=>{}); toast('删除失败: ' + (d?.error || '')); return; }
    toast('已删除'); loadAdminProtos();
  }

  document.getElementById('refreshAdminProtos').addEventListener('click', loadAdminProtos);

  // ── Admin Proto Upload ────────────────────────────────────────────────────────
  let adminPendingProtoFile = null;
  const ADMIN_PROTO_BATCH = 40;

  // client-side utilities (mirrors page.js / server logic)
  function _adminProtoDetectEntry(paths) {
    const rootHtml = paths.filter(p => !p.includes('/') && p.toLowerCase().endsWith('.html'));
    const find = (arr, name) => arr.find(p => p.toLowerCase() === name);
    if (find(rootHtml, 'start.html')) return 'start.html';
    if (find(rootHtml, 'index.html')) return 'index.html';
    if (rootHtml.length) return rootHtml[0];
    const deep = paths.filter(p => { const s = p.split('/'); return s.length === 2 && s[1].toLowerCase().endsWith('.html'); });
    return deep.find(p => p.toLowerCase().endsWith('start.html')) || deep.find(p => p.toLowerCase().endsWith('index.html')) || null;
  }
  function _adminProtoFixEnc(path) {
    if ([...path].every(c => c.charCodeAt(0) <= 255)) {
      try { const b = new Uint8Array([...path].map(c => c.charCodeAt(0))); const d = new TextDecoder('utf-8',{fatal:true}).decode(b); if (d !== path) return d; } catch {}
    }
    return path;
  }
  function _adminProtoStrip(files) {
    const paths = Object.keys(files); if (!paths.length) return files;
    const first = paths[0].split('/')[0];
    if (paths.every(p => p.startsWith(first + '/'))) {
      const out = {}; for (const [p,d] of Object.entries(files)) out[p.slice(first.length+1)] = d; return out;
    }
    return files;
  }
  function _adminProtoFilter(files) {
    return Object.keys(files).filter(p => {
      if (!p || p.startsWith('/') || p.includes('..') || p.endsWith('/')) return false;
      if (p.startsWith('__MACOSX/') || p.includes('/.DS_Store') || p === '.DS_Store') return false;
      return true;
    });
  }

  async function _adminProtoChunkedUpload(zipFile) {
    const title    = document.getElementById('adminProtoTitle').value.trim();
    const password = document.getElementById('adminProtoPassword').value.trim().replace(/[^A-Za-z0-9]/g,'').slice(0,6);
    const prog     = document.getElementById('adminProtoProgress');     prog.classList.add('show');
    const bar      = document.getElementById('adminProtoProgressBar');  bar.style.width = '0%';
    const info     = document.getElementById('adminProtoProgressInfo'); info.classList.add('show');
    const pctEl    = document.getElementById('adminProtoProgressPct');  pctEl.textContent = '0%';
    const statusEl = document.getElementById('adminProtoStatusText');   statusEl.style.display = ''; statusEl.textContent = '';
    const errEl    = document.getElementById('adminProtoErr');          errEl.textContent = '';

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
      setStatus('🗜️ 正在解压 ZIP…', 3);
      const bytes = new Uint8Array(await zipFile.arrayBuffer());
      let files;
      try {
        const raw = _fflate().unzipSync(bytes);
        const fixed = {}; for (const [p,d] of Object.entries(raw)) fixed[_adminProtoFixEnc(p)] = d;
        files = _adminProtoStrip(fixed);
      } catch(e) { throw new Error('解压失败：' + e.message); }
      setStatus(\`📋 分析文件结构… 发现 \${Object.keys(files).length} 个文件\`, 8);

      const safePaths = _adminProtoFilter(files);
      if (!safePaths.length) throw new Error('ZIP 中未找到有效文件');
      const entryPoint = _adminProtoDetectEntry(safePaths);
      if (!entryPoint) throw new Error('未找到入口文件（start.html 或 index.html）');
      const totalSize = safePaths.reduce((s, p) => s + (files[p]?.byteLength ?? 0), 0);

      setStatus('🔧 初始化上传会话…', 12);
      const initRes = await fetch('/admin/proto/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
        body: JSON.stringify({ title, password, entryPoint, totalSize }),
      });
      const initData = await initRes.json().catch(() => ({}));
      if (!initRes.ok) throw new Error(initData.error || '初始化失败');
      const { protoId } = initData;

      const totalBatches = Math.ceil(safePaths.length / ADMIN_PROTO_BATCH);
      for (let b = 0; b < totalBatches; b++) {
        const batchPaths = safePaths.slice(b * ADMIN_PROTO_BATCH, (b + 1) * ADMIN_PROTO_BATCH);
        const from = b * ADMIN_PROTO_BATCH + 1, to = Math.min((b + 1) * ADMIN_PROTO_BATCH, safePaths.length);
        const pct = Math.round(15 + (b / totalBatches) * 75);
        setStatus(\`📤 上传第 \${b+1}/\${totalBatches} 批（\${from}–\${to} / \${safePaths.length} 个文件）\`, pct);
        const fd = new FormData();
        fd.append('protoId', protoId);
        batchPaths.forEach(p => { fd.append('paths[]', p); fd.append('files[]', new Blob([files[p]]), p); });
        const bRes = await fetch('/admin/proto/files', { method: 'POST', headers: { 'Authorization': 'Bearer ' + adminToken }, body: fd });
        if (!bRes.ok) { const d = await bRes.json().catch(()=>({})); throw new Error(d.error || \`批次 \${b+1} 上传失败\`); }
      }

      setStatus('✅ 正在写入元数据…', 93);
      const fRes = await fetch('/admin/proto/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
        body: JSON.stringify({ protoId, filePaths: safePaths }),
      });
      const fData = await fRes.json().catch(() => ({}));
      if (!fRes.ok) throw new Error(fData.error || '最终化失败');
      setStatus('🎉 上传完成！', 100);

      setTimeout(() => {
        bar.style.width = '0%'; resetProg();
        document.getElementById('adminProtoTitle').value = '';
        document.getElementById('adminProtoPassword').value = '';
        document.getElementById('adminProtoDropText').textContent = '点击选择 ZIP 文件';
        document.getElementById('adminProtoUploadBtn').disabled = true;
        adminPendingProtoFile = null;
        toast('原型上传成功');
        loadAdminProtos();
      }, 900);
    } catch(e) {
      resetProg();
      errEl.textContent = e.message || '上传失败';
      document.getElementById('adminProtoUploadBtn').disabled = false;
    }
  }

  // drag-drop for admin proto
  const adminProtoDropZone = document.getElementById('adminProtoDropZone');
  adminProtoDropZone.addEventListener('dragover', e => { e.preventDefault(); adminProtoDropZone.style.borderColor = '#3b82f6'; adminProtoDropZone.style.color = '#3b82f6'; });
  adminProtoDropZone.addEventListener('dragleave', () => { adminProtoDropZone.style.borderColor = ''; adminProtoDropZone.style.color = ''; });
  adminProtoDropZone.addEventListener('drop', e => {
    e.preventDefault(); adminProtoDropZone.style.borderColor = ''; adminProtoDropZone.style.color = '';
    const f = e.dataTransfer.files[0];
    if (f && (f.name.toLowerCase().endsWith('.zip') || f.type.includes('zip'))) setAdminProtoFile(f);
    else toast('请拖拽 ZIP 文件');
  });
  document.getElementById('adminProtoFileInput').addEventListener('change', e => { if (e.target.files[0]) { setAdminProtoFile(e.target.files[0]); e.target.value=''; } });

  function setAdminProtoFile(f) {
    adminPendingProtoFile = f;
    document.getElementById('adminProtoDropText').textContent = f.name + ' (' + fmtSize(f.size) + ')';
    document.getElementById('adminProtoErr').textContent = '';
    document.getElementById('adminProtoUploadBtn').disabled = false;
  }

  async function adminProtoPackFolder(fileList) {
    const files = [...fileList]; if (!files.length) return;
    document.getElementById('adminProtoDropText').textContent = '正在打包文件夹…';
    document.getElementById('adminProtoUploadBtn').disabled = true;
    try {
      const filesData = {}; let topFolder = '';
      for (const file of files) {
        const parts = file.webkitRelativePath.split('/');
        if (!topFolder) topFolder = parts[0];
        const rel = parts.slice(1).join('/');
        if (!rel || rel === '.DS_Store' || rel.endsWith('/.DS_Store')) continue;
        const buf = await file.arrayBuffer();
        filesData[rel] = [new Uint8Array(buf), { level: 0 }];
      }
      const zipped = _fflate().zipSync(filesData);
      const zipFile = new File([new Blob([zipped],{type:'application/zip'})], (topFolder||'prototype')+'.zip', {type:'application/zip'});
      setAdminProtoFile(zipFile);
      if (!document.getElementById('adminProtoTitle').value) document.getElementById('adminProtoTitle').value = topFolder || '';
    } catch(e) {
      document.getElementById('adminProtoDropText').textContent = '点击选择 ZIP 文件';
      document.getElementById('adminProtoErr').textContent = '打包失败: ' + e.message;
    }
    document.getElementById('adminProtoFolderInput').value = '';
  }

  document.getElementById('adminProtoUploadBtn').addEventListener('click', () => {
    if (!adminPendingProtoFile) return;
    document.getElementById('adminProtoUploadBtn').disabled = true;
    _adminProtoChunkedUpload(adminPendingProtoFile);
  });

  // ── R2 Stats ─────────────────────────────────────────────────────────────────
  // ── CF 额度面板 ───────────────────────────────────────────────────────────────
  async function loadCfQuota() {
    try {
      const res = await fetch('/admin/cf-quota', { headers: authH() });
      if (!res.ok) return;
      const d = await res.json();

      const isCfApi = d.source === 'cf-api';

      // 数据来源标识
      const badge = document.getElementById('cfSourceBadge');
      if (badge) {
        badge.textContent = isCfApi ? 'CF API 精确' : '自追踪估算';
        badge.style.background    = isCfApi ? 'rgba(34,197,94,.12)' : 'rgba(251,191,36,.1)';
        badge.style.color         = isCfApi ? '#22c55e' : '#f59e0b';
        badge.style.borderColor   = isCfApi ? 'rgba(34,197,94,.25)' : 'rgba(251,191,36,.2)';
      }

      // Workers 今日请求
      const reqToday = d.workers.reqToday ?? 0;
      document.getElementById('cfReqVal').textContent    = fmtNum(reqToday);
      document.getElementById('cfReqLeft').textContent   = fmtNum(Math.max(0, d.workers.limit - reqToday));
      document.getElementById('cfReqMethod').textContent = isCfApi ? 'CF API 精确' : '1% 采样 × 100';
      applyCfQuota('cfReqBar','cfReqPct', reqToday, d.workers.limit);

      // R2 存储（始终是实时精确扫描）
      const stBytes = d.r2.storageBytes, stLimit = d.r2.storageLimitBytes;
      document.getElementById('cfStorageVal').textContent  = fmtSize(stBytes);
      document.getElementById('cfStorageLeft').textContent = fmtSize(Math.max(0, stLimit - stBytes));
      applyCfQuota('cfStorageBar','cfStoragePct', stBytes, stLimit);

      // R2 Class A
      const r2a = d.r2.classAMonth ?? 0;
      document.getElementById('cfR2AVal').textContent  = fmtNum(r2a);
      document.getElementById('cfR2ALeft').textContent = fmtNum(Math.max(0, d.r2.classALimit - r2a));
      applyCfQuota('cfR2ABar','cfR2APct', r2a, d.r2.classALimit);

      // R2 Class B
      const r2b = d.r2.classBMonth ?? 0;
      document.getElementById('cfR2BVal').textContent  = fmtNum(r2b);
      document.getElementById('cfR2BLeft').textContent = fmtNum(Math.max(0, d.r2.classBLimit - r2b));
      applyCfQuota('cfR2BBar','cfR2BPct', r2b, d.r2.classBLimit);

      // KV 操作（CF API 精确 or 空）
      const apiPrompt = document.getElementById('cfApiPrompt');
      const dayOfMonth = parseInt(d.day.slice(8, 10)) || 1;  // 已过几天

      const fillKv = (prefix, monthly, today, dailyLimit) => {
        const el = (id) => document.getElementById(id);
        if (monthly === null) {
          if (el(prefix)) el(prefix).textContent = '—';
          return;
        }
        if (el(prefix))          el(prefix).textContent = fmtNum(monthly);
        if (el(prefix+'Today'))  el(prefix+'Today').textContent = today !== null ? fmtNum(today) : '—';
        const avgDay = dayOfMonth > 0 ? monthly / dayOfMonth : 0;
        if (el(prefix+'Avg'))  el(prefix+'Avg').textContent = '~' + fmtNum(Math.round(avgDay)) + '/天';
        // 进度条：月均日用量 vs 日限
        applyCfQuota(prefix+'Bar', prefix+'Pct', avgDay, dailyLimit);
      };

      fillKv('cfKvReads',   d.kv.readsMonth,   d.kv.readsToday,   d.kv.readDailyLimit);
      fillKv('cfKvWrites',  d.kv.writesMonth,  d.kv.writesToday,  d.kv.writeDailyLimit);
      fillKv('cfKvLists',   d.kv.listsMonth,   d.kv.listsToday,   d.kv.listDailyLimit);
      fillKv('cfKvDeletes', d.kv.deletesMonth, d.kv.deletesToday, d.kv.deleteDailyLimit);

      if (apiPrompt) apiPrompt.style.display = isCfApi ? 'none' : 'block';

      // KV 键总数（仅自追踪模式才查）
      if (!isCfApi && d.kv.totalKeys != null) {
        document.getElementById('cfKvKeys').textContent = d.kv.totalKeys.toLocaleString();
      } else {
        const keysEl = document.getElementById('cfKvKeys');
        if (keysEl && keysEl.textContent === '—') keysEl.textContent = 'N/A';
      }

      document.getElementById('cfDay').textContent   = d.day;
      document.getElementById('cfMonth').textContent = d.month;
    } catch(e) { console.error('CF quota error', e); }
  }

  function fmtNum(n) {
    if (n === null || n === undefined) return '—';
    if (n >= 1e6) return (n/1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
    return n.toLocaleString();
  }

  function applyCfQuota(barId, pctId, used, limit) {
    const pct   = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
    const bar   = document.getElementById(barId);
    const pctEl = document.getElementById(pctId);
    if (bar) {
      bar.style.width = pct.toFixed(1) + '%';
      bar.className   = 'cf-fill' + (pct >= 90 ? ' alert' : pct >= 70 ? ' warn' : '');
    }
    if (pctEl && pctEl.tagName !== 'SPAN') pctEl.textContent = pct.toFixed(1) + '%';
  }

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
      // Donut chart (r=22, circumference ≈ 138.23)
      const circumference = 2 * Math.PI * 22;
      const arc = document.getElementById('r2DonutArc');
      arc.setAttribute('stroke-dashoffset', (circumference * (1 - usedPct / 100)).toFixed(2));
      arc.setAttribute('stroke', usedPct >= 90 ? '#ef4444' : usedPct >= 70 ? '#f59e0b' : '#3b82f6');
      document.getElementById('r2DonutLabel').textContent = usedPct.toFixed(1) + '%';
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
  function handleUnauth() {
    if (expiryTimerId) { clearInterval(expiryTimerId); expiryTimerId = null; }
    document.getElementById('expiryBanner').classList.remove('show');
    localStorage.removeItem(TOKEN_KEY); adminToken = null;
    toast('登录已过期，请重新登录', 'error');
    setTimeout(showLogin, 1200);
  }
  function fmtSize(b) { if(b<1024) return b+' B'; if(b<1048576) return (b/1024).toFixed(1)+' KB'; return (b/1048576).toFixed(1)+' MB'; }
  function fmtSizeParts(b) { if(b<1048576) return {val:(b/1024).toFixed(1),unit:'KB'}; if(b<1073741824) return {val:(b/1048576).toFixed(1),unit:'MB'}; return {val:(b/1073741824).toFixed(2),unit:'GB'}; }
  function copyText(text, btn) { navigator.clipboard.writeText(text).then(() => { if(btn){const o=btn.textContent;btn.textContent='✓';setTimeout(()=>btn.textContent=o,1400);} }); }
  function toast(msg, type) {
    const t = document.getElementById('toast');
    t.className = 'toast show' + (type ? ' t-' + type : '');
    t.textContent = msg;
    clearTimeout(t._tid);
    t._tid = setTimeout(() => t.classList.remove('show'), 2800);
  }
  function timeAgo(ts) { const d=Date.now()-ts; if(d<60000) return '刚刚'; if(d<3600000) return Math.floor(d/60000)+' 分钟前'; if(d<86400000) return Math.floor(d/3600000)+' 小时前'; return Math.floor(d/86400000)+' 天前'; }
  function fmtDate(ms) { if(!ms) return '—'; return new Date(ms).toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit',year:'2-digit'}); }
  document.addEventListener('keydown', e => {
    if (e.key==='Escape') {
      document.getElementById('lightbox').classList.remove('show');
      document.getElementById('statsModal').classList.remove('show');
      document.getElementById('pageStatsModal').classList.remove('show');
      document.getElementById('protoStatsModal').classList.remove('show');
      document.getElementById('protoVersionModal').classList.remove('show');
      document.getElementById('userModal').classList.remove('show');
      if (document.getElementById('adminPageModal').classList.contains('show')) {
        closeApmModal();
      }
    }
  });
</script>
<script src="https://cdn.jsdelivr.net/npm/fflate@0.8.3/umd/index.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vditor/dist/index.min.js" defer></script>
</body>
</html>`;
}
