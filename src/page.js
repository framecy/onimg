import { FFLATE_UMD } from './fflate-inline.js';
export function renderPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Onimg</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/vditor/dist/index.css">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f0f0f; color: #e8e8e8; min-height: 100vh; }
    .app { display: flex; flex-direction: column; min-height: 100vh; }
    header { display: flex; flex-direction: column; border-bottom: 1px solid #1e1e1e; background: #0d0d0d; position: sticky; top: 0; z-index: 10; }
    .header-top { display: flex; align-items: center; gap: 14px; padding: 11px 24px; }
    header h1 { font-size: .98rem; font-weight: 700; letter-spacing: -.01em; }
    .tab-nav { display: flex; padding: 0 20px; }
    .tab { padding: 9px 14px; border: none; background: transparent; color: #555; cursor: pointer; font-size: .84rem; transition: color .15s; position: relative; white-space: nowrap; }
    .tab::after { content: ''; position: absolute; bottom: -1px; left: 8px; right: 8px; height: 2px; background: #3b82f6; border-radius: 2px 2px 0 0; transform: scaleX(0); transition: transform .2s ease; }
    .tab:hover { color: #bbb; }
    .tab.active { color: #e8e8e8; }
    .tab.active::after { transform: scaleX(1); }
    .spacer { flex: 1; }
    .dot-green { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; flex-shrink: 0; }
    .btn-sm { padding: 5px 12px; border: 1px solid #242424; border-radius: 6px; background: transparent; color: #666; cursor: pointer; font-size: .8rem; white-space: nowrap; }
    .btn-sm:hover { color: #fff; border-color: #444; }
    /* User menu */
    #userArea { position: relative; flex-shrink: 0; }
    .user-chip { display: flex; align-items: center; gap: 7px; padding: 5px 12px; background: #1a1a1a; border: 1px solid #242424; border-radius: 20px; font-size: .8rem; color: #aaa; cursor: pointer; white-space: nowrap; user-select: none; transition: border-color .15s; }
    .user-chip:hover { border-color: #444; color: #ccc; }
    .user-chip .caret { font-size: .6rem; color: #555; margin-left: 2px; transition: transform .15s; }
    .user-chip.open .caret { transform: rotate(180deg); }
    .user-dropdown { position: absolute; top: calc(100% + 8px); right: 0; background: #161616; border: 1px solid #2a2a2a; border-radius: 10px; min-width: 200px; box-shadow: 0 8px 24px rgba(0,0,0,.5); z-index: 100; overflow: hidden; display: none; }
    .user-dropdown.show { display: block; }
    .ud-header { padding: 12px 14px 10px; border-bottom: 1px solid #222; }
    .ud-name { font-size: .88rem; font-weight: 600; color: #e0e0e0; }
    .ud-role { font-size: .72rem; color: #555; margin-top: 2px; }
    .ud-perms { padding: 10px 14px; border-bottom: 1px solid #1e1e1e; display: flex; flex-wrap: wrap; gap: 5px; }
    .ud-perm { font-size: .68rem; padding: 2px 7px; border-radius: 4px; }
    .perm-on  { background: rgba(34,197,94,.12); color: #22c55e; }
    .perm-off { background: rgba(100,100,100,.1); color: #444; }
    .perm-admin { background: rgba(59,130,246,.12); color: #3b82f6; }
    .ud-action { display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 14px; background: none; border: none; color: #888; font-size: .82rem; cursor: pointer; text-align: left; transition: background .12s, color .12s; }
    .ud-action:hover { background: #1f1f1f; color: #ccc; }
    .ud-action.danger:hover { color: #ef4444; }

    /* Login overlay */
    #loginOverlay { position: fixed; inset: 0; background: rgba(0,0,0,.82); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 24px; }
    .login-card { background: #141414; border: 1px solid #222; border-radius: 16px; padding: 36px 32px; width: 100%; max-width: 360px; }
    .login-card h2 { font-size: 1.1rem; margin-bottom: 28px; }
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
    .field label { font-size: .78rem; color: #666; }
    .field input, .field select, .field textarea { padding: 9px 12px; background: #0f0f0f; border: 1px solid #222; border-radius: 7px; color: #e8e8e8; font-size: .9rem; outline: none; transition: border .15s; }
    .field input:focus, .field select:focus, .field textarea:focus { border-color: #3b82f6; }
    .field textarea { resize: vertical; min-height: 120px; font-family: monospace; font-size: .82rem; }
    .btn-full { width: 100%; padding: 10px; background: #3b82f6; color: #fff; border: none; border-radius: 7px; font-size: .9rem; font-weight: 600; cursor: pointer; margin-top: 6px; transition: background .15s; }
    .btn-full:hover { background: #2563eb; }
    .btn-full:disabled { background: #1e3a5f; color: #4b7bb5; cursor: not-allowed; }
    .login-err { color: #ef4444; font-size: .8rem; margin-top: 8px; text-align: center; min-height: 16px; }
    /* Login enhancements */
    @keyframes loginSpin { to { transform: rotate(360deg); } }
    @keyframes loginShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
    .btn-full.loading { pointer-events: none; }
    .btn-full.loading::before { content:''; display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:loginSpin .6s linear infinite; margin-right:8px; vertical-align:middle; }
    .login-card.shake { animation: loginShake .35s ease; }
    .pass-wrap { position: relative; }
    .pass-wrap input { padding-right: 38px; width: 100%; }
    .pass-toggle { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #555; cursor: pointer; padding: 4px; line-height: 1; font-size: .9rem; }
    .pass-toggle:hover { color: #aaa; }
    /* Toast types */
    .toast.t-success { background: #052e16; border-color: #166534; color: #4ade80; }
    .toast.t-warn    { background: #2d1b00; border-color: #92400e; color: #fcd34d; }
    .toast.t-error   { background: #1c0505; border-color: #7f1d1d; color: #f87171; }

    main { flex: 1; padding: 20px 24px; max-width: 1200px; margin: 0 auto; width: 100%; }
    .panel { display: none; }
    .panel.active { display: block; }

    /* Upload */
    .quota-bar { background: #141414; border: 1px solid #1f1f1f; border-radius: 8px; padding: 9px 14px; font-size: .8rem; display: flex; gap: 16px; margin-bottom: 12px; }
    .quota-bar span { color: #555; }
    .quota-bar strong { color: #aaa; }
    .drop-zone { border: 1.5px dashed #252525; border-radius: 16px; padding: 52px 32px; text-align: center; cursor: pointer; color: #454545; transition: all .2s; margin-bottom: 14px; background: rgba(255,255,255,.008); }
    .drop-zone:hover, .drop-zone.over { border-color: #3b82f6; color: #3b82f6; background: rgba(59,130,246,.04); }
    .drop-zone:hover .dz-icon, .drop-zone.over .dz-icon { color: #3b82f6; }
    .drop-zone input { display: none; }
    .dz-icon { display: block; margin: 0 auto 16px; width: 40px; height: 40px; color: #2a2a2a; transition: color .2s; }
    .btn-upload { width: 100%; padding: 10px; background: #3b82f6; color: #fff; border: none; border-radius: 8px; font-size: .9rem; font-weight: 600; cursor: pointer; }
    .btn-upload:hover { background: #2563eb; }
    .btn-upload:disabled { background: #1e3a5f; color: #4b7bb5; cursor: not-allowed; }
    .progress { height: 3px; background: #1f1f1f; border-radius: 99px; margin: 10px 0; overflow: hidden; display: none; }
    .progress.show { display: block; }
    .progress-bar { height: 100%; background: #3b82f6; width: 0%; transition: width .25s; }
    .progress-info { display: none; align-items: center; gap: 10px; margin-top: -4px; margin-bottom: 6px; font-size: .76rem; color: #555; }
    .progress-info.show { display: flex; }
    .progress-info .pct { font-weight: 600; color: #3b82f6; min-width: 34px; }
    .progress-info .bytes { color: #444; }
    .result-list { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
    .result-item { background: #141414; border: 1px solid #1f1f1f; border-radius: 9px; padding: 10px 14px; display: flex; align-items: center; gap: 12px; }
    .result-item img { width: 44px; height: 44px; object-fit: cover; border-radius: 5px; }
    .result-item .info { flex: 1; min-width: 0; }
    .result-item .name { font-size: .8rem; color: #888; }
    .url-row { display: flex; gap: 5px; margin-top: 4px; }
    .url-input { flex: 1; background: #0f0f0f; border: 1px solid #2a2a2a; border-radius: 5px; color: #e8e8e8; font-size: .75rem; padding: 3px 8px; outline: none; min-width: 0; }
    .err { color: #ef4444; font-size: .8rem; margin-top: 8px; }

    /* Buttons */
    .btn { padding: 5px 11px; border: none; border-radius: 6px; font-size: .78rem; font-weight: 500; cursor: pointer; transition: all .15s; }
    .btn-ghost { background: #1a1a1a; color: #888; }
    .btn-ghost:hover { background: #222; color: #fff; }
    .btn-danger { background: rgba(239,68,68,.15); color: #ef4444; }
    .btn-danger:hover { background: rgba(239,68,68,.25); }
    .btn-public  { background: rgba(34,197,94,.12); color: #22c55e; font-size: .7rem; padding: 3px 8px; border-radius: 10px; border: none; cursor: pointer; }
    .btn-private { background: rgba(100,100,100,.1); color: #666; font-size: .7rem; padding: 3px 8px; border-radius: 10px; border: none; cursor: pointer; }

    /* Gallery grid */
    .toolbar { display: flex; gap: 8px; align-items: center; margin-bottom: 16px; }
    .search-input { padding: 7px 12px; background: #141414; border: 1px solid #1f1f1f; border-radius: 7px; color: #e8e8e8; font-size: .84rem; outline: none; width: 200px; }
    .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px; }
    .gitem { background: #111; border: 1px solid #1a1a1a; border-radius: 12px; overflow: hidden; transition: border-color .15s, box-shadow .2s, transform .2s; }
    .gitem:hover { border-color: #2a2a2a; box-shadow: 0 6px 24px rgba(0,0,0,.45); transform: translateY(-2px); }
    .gitem img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; background: #1a1a1a; cursor: pointer; }
    .gitem-info { padding: 8px 10px; }
    .gitem-key { font-size: .7rem; color: #555; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .gitem-row { display: flex; justify-content: space-between; align-items: center; margin-top: 5px; }
    .gitem-actions { display: flex; gap: 4px; margin-top: 5px; }

    /* Pages */
    .pages-header { display: flex; align-items: center; margin-bottom: 16px; }
    .pages-list { display: flex; flex-direction: column; gap: 8px; }
    .page-item { background: #141414; border: 1px solid #1a1a1a; border-radius: 10px; padding: 14px 16px; display: flex; align-items: center; gap: 14px; }
    .page-item-info { flex: 1; min-width: 0; }
    .page-title { font-size: .9rem; font-weight: 500; }
    .page-slug { font-size: .75rem; color: #555; font-family: monospace; margin-top: 2px; }
    .page-meta { font-size: .72rem; color: #444; margin-top: 3px; }
    .type-badge { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: .68rem; font-weight: 500; }
    .type-md   { background: rgba(59,130,246,.1); color: #3b82f6; }
    .type-html { background: rgba(245,158,11,.1); color: #f59e0b; }

    /* Public gallery */
    .pub-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 16px; }
    .pub-item { border-radius: 12px; overflow: hidden; background: #111; border: 1px solid #1a1a1a; cursor: pointer; transition: border-color .15s, box-shadow .2s, transform .2s; }
    .pub-item:hover { border-color: #2a2a2a; box-shadow: 0 6px 24px rgba(0,0,0,.45); transform: translateY(-2px); }
    .pub-item img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
    .pub-item-info { padding: 8px 12px; font-size: .74rem; color: #4a4a4a; }

    /* Lightbox */
    .lightbox { position: fixed; inset: 0; background: rgba(0,0,0,.92); display: none; align-items: center; justify-content: center; z-index: 100; padding: 24px; }
    .lightbox.show { display: flex; }
    .lb-inner { background: #141414; border: 1px solid #222; border-radius: 14px; max-width: 760px; width: 100%; overflow: hidden; }
    .lb-img-wrap { background: #0f0f0f; display: flex; align-items: center; justify-content: center; min-height: 280px; max-height: 55vh; }
    .lb-img-wrap img { max-width: 100%; max-height: 55vh; object-fit: contain; }
    .lb-meta { padding: 14px 18px; }
    .lb-key { font-size: .85rem; color: #ccc; word-break: break-all; }
    .lb-actions { display: flex; gap: 7px; margin-top: 12px; }
    .lb-close { position: absolute; top: 14px; right: 14px; background: #1a1a1a; border: 1px solid #222; color: #888; width: 32px; height: 32px; border-radius: 7px; cursor: pointer; font-size: .95rem; display: flex; align-items: center; justify-content: center; }
    .lb-nav { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,.5); border: 1px solid #333; color: #ccc; width: 40px; height: 60px; border-radius: 8px; cursor: pointer; font-size: 1.6rem; display: flex; align-items: center; justify-content: center; transition: background .15s, color .15s; z-index: 101; }
    .lb-nav:hover { background: rgba(40,40,40,.9); color: #fff; }
    .lb-nav-prev { left: 14px; }
    .lb-nav-next { right: 14px; }
    .load-more { display: flex; justify-content: center; margin-top: 20px; }
    .empty { text-align: center; padding: 48px; color: #333; font-size: .88rem; }
    .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(80px); background: #1f1f1f; border: 1px solid #2a2a2a; color: #e8e8e8; padding: 8px 18px; border-radius: 8px; font-size: .82rem; transition: transform .25s; z-index: 200; white-space: nowrap; }
    .toast.show { transform: translateX(-50%) translateY(0); }

    /* Page editor modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.8); display: none; align-items: center; justify-content: center; z-index: 60; padding: 24px; }
    .modal-overlay.show { display: flex; }
    .modal { background: #141414; border: 1px solid #222; border-radius: 14px; width: 100%; max-width: 860px; max-height: 96vh; display: flex; flex-direction: column; }
    .modal-body { padding: 18px 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 12px; min-height: 0; }
    /* Vditor container */
    #pmVditor { border-radius: 8px; overflow: hidden; flex-shrink: 0; border: 1px solid #333; }
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
    .modal-header { display: flex; align-items: center; padding: 16px 20px; border-bottom: 1px solid #1f1f1f; flex-shrink: 0; }
    .modal-header h3 { flex: 1; font-size: .95rem; }
    .modal-close { background: #1a1a1a; border: 1px solid #222; color: #888; width: 30px; height: 30px; border-radius: 6px; cursor: pointer; }
    .modal-body { padding: 18px 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 12px; }
    .modal-footer { padding: 12px 20px; border-top: 1px solid #1f1f1f; display: flex; gap: 8px; justify-content: flex-end; flex-shrink: 0; }
    .btn-primary { background: #3b82f6; color: #fff; }
    .btn-primary:hover { background: #2563eb; }
    /* Skeleton shimmer */
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    .gitem img:not(.loaded), .pub-item img:not(.loaded) {
      background: linear-gradient(90deg, #141414 25%, #1c1c1c 50%, #141414 75%);
      background-size: 400% 100%;
      animation: shimmer 1.4s ease infinite;
    }
    .gitem img.loaded, .pub-item img.loaded { animation: none; background: #1a1a1a; }
    /* Responsive */
    @media (max-width: 600px) {
      main { padding: 14px 16px; }
      .gallery-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
      .pub-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
      .header-top { padding: 9px 16px; }
      .tab-nav { padding: 0 8px; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
      .tab-nav::-webkit-scrollbar { display: none; }
      .tab { padding: 9px 10px; font-size: .8rem; }
      .search-input { width: 160px; }
      .drop-zone { padding: 36px 20px; }
    }

    /* Protos — upload box */
    .proto-upload-section { background:#111; border:1px solid #1a1a1a; border-radius:12px; margin-bottom:20px; overflow:hidden; }
    .proto-upload-head { display:flex; align-items:center; padding:12px 16px; cursor:pointer; user-select:none; gap:8px; }
    .proto-upload-head h3 { font-size:.88rem; font-weight:600; flex:1; }
    .proto-upload-head .toggle-icon { font-size:.65rem; color:#555; transition:transform .2s; }
    .proto-upload-head .toggle-icon.open { transform:rotate(180deg); }
    .proto-upload-body { padding:16px; border-top:1px solid #1a1a1a; }
    .proto-upload-box { border: 2px dashed #2a2a2a; border-radius: 12px; padding: 28px; text-align: center; color: #555; transition: all .2s; margin-bottom: 14px; cursor: pointer; }
    .proto-upload-box:hover, .proto-upload-box.over { border-color: #3b82f6; color: #3b82f6; background: rgba(59,130,246,.04); }
    .proto-upload-box input { display: none; }
    .proto-fields { display: flex; gap: 10px; margin-bottom: 10px; }
    .proto-fields .field { flex: 1; margin-bottom: 0; }
    .proto-fields .field-pwd { flex: 0 0 160px; }
    /* Protos — table */
    .proto-table { width:100%; border-collapse:collapse; font-size:.82rem; }
    .proto-table th { text-align:left; padding:9px 12px; color:#555; font-weight:500; border-bottom:1px solid #1a1a1a; white-space:nowrap; }
    .proto-table td { padding:10px 12px; border-bottom:1px solid #111; vertical-align:middle; }
    .proto-table tr:last-child td { border-bottom:none; }
    .proto-table tr:hover td { background:rgba(255,255,255,.02); }
    .proto-td-name { max-width:280px; }
    .proto-td-name .name { font-weight:500; font-size:.88rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .proto-td-name .id  { font-family:monospace; font-size:.65rem; color:#333; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .proto-td-actions { white-space:nowrap; text-align:right; }
    .proto-td-actions .btn { font-size:.75rem; padding:3px 8px; }
    .proto-muted { color:#555; font-size:.78rem; }
    /* badges */
    .proto-lock { font-size:.68rem; background:rgba(251,191,36,.1); color:#fbbf24; border-radius:4px; padding:1px 5px; }
    .proto-version { font-size:.65rem; background:rgba(59,130,246,.1); color:#3b82f6; border-radius:4px; padding:1px 5px; }
    .proto-private { font-size:.68rem; background:rgba(239,68,68,.12); color:#ef4444; border-radius:4px; padding:1px 5px; }
    .proto-expired { font-size:.68rem; background:rgba(100,100,100,.1); color:#555; border-radius:4px; padding:1px 5px; }
    /* version diff modal */
    .pvm-ver-card { background:#0f0f0f; border:1px solid #1e1e1e; border-radius:8px; padding:9px 10px; cursor:pointer; transition:border-color .12s; }
    .pvm-ver-card:hover { border-color:#2a3f60; }
    .pvm-ver-card.active { border-color:#3b82f6; background:rgba(59,130,246,.06); }
    .pvm-ver-card.checked-a { border-color:#10b981; background:rgba(16,185,129,.06); }
    .pvm-ver-card.checked-b { border-color:#f59e0b; background:rgba(245,158,11,.06); }
    .pvm-ver-badge { font-size:.72rem; font-weight:700; padding:1px 6px; border-radius:4px; margin-right:4px; background:#1a2f50; color:#7db8f8; }
    .pvm-ver-latest { font-size:.65rem; padding:1px 5px; border-radius:3px; background:rgba(34,197,94,.12); color:#22c55e; }
    .pvm-ver-meta { font-size:.68rem; color:#444; margin-top:4px; }
    .pvm-ver-check { display:flex; align-items:center; gap:4px; margin-top:5px; font-size:.7rem; color:#555; }
    .diff-file { display:flex; align-items:center; gap:6px; padding:3px 6px; border-radius:4px; font-size:.72rem; font-family:monospace; margin-bottom:1px; }
    .diff-add  { background:rgba(16,185,129,.08); color:#10b981; }
    .diff-rem  { background:rgba(239,68,68,.08);  color:#ef4444; }
    .diff-prefix { flex-shrink:0; width:14px; font-weight:700; }
    .diff-section { margin-bottom:16px; }
    .diff-section h4 { font-size:.72rem; font-weight:600; margin-bottom:6px; padding:4px 6px; border-radius:4px; }
    .diff-section.add  h4 { background:rgba(16,185,129,.1);  color:#10b981; }
    .diff-section.rem  h4 { background:rgba(239,68,68,.1);   color:#ef4444; }
    .diff-section.same h4 { background:rgba(100,100,100,.08); color:#444; }
    .file-row { display:flex; align-items:center; padding:3px 6px; border-radius:4px; font-size:.72rem; font-family:monospace; margin-bottom:1px; color:#555; }
    .file-row:hover { background:#111; color:#aaa; }
  </style>
</head>
<body>
<div class="app">
  <header>
    <div class="header-top">
      <h1>Onimg</h1>
      <div class="spacer"></div>
      <div id="userArea">
        <button class="btn-sm" id="loginTrigger">登录</button>
      </div>
    </div>
    <nav class="tab-nav">
      <button class="tab active" data-tab="gallery-pub">公开图库</button>
      <button class="tab" data-tab="upload" id="tabUpload">上传</button>
      <button class="tab" data-tab="gallery-mine" id="tabMine">我的图库</button>
      <button class="tab" data-tab="pages" id="tabPages">我的页面</button>
      <button class="tab" data-tab="protos" id="tabProtos">我的原型</button>
    </nav>
  </header>

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
      <div class="toolbar">
        <span style="font-size:.85rem;color:#555">所有公开图片</span>
        <div class="spacer"></div>
        <button class="btn btn-ghost" id="refreshPub">刷新</button>
      </div>
      <div class="pub-grid" id="pubGrid"></div>
      <div class="empty" id="pubEmpty" style="display:none">暂无公开图片</div>
    </div>

    <!-- Upload -->
    <div class="panel" id="panel-upload">
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
      <div class="toolbar">
        <input class="search-input" id="mineSearch" type="text" placeholder="搜索…">
        <div class="spacer"></div>
        <button class="btn btn-ghost" id="refreshMine">刷新</button>
      </div>
      <div class="gallery-grid" id="mineGrid"></div>
      <div class="empty" id="mineEmpty" style="display:none">暂无图片，去上传吧</div>
    </div>

    <!-- Pages -->
    <div class="panel" id="panel-pages">
      <div class="pages-header">
        <span style="font-size:.85rem;color:#555">托管的 MD / HTML 文档</span>
        <div class="spacer"></div>
        <button class="btn btn-primary" id="newPageBtn" style="padding:6px 14px;font-size:.82rem">+ 新建页面</button>
      </div>
      <div class="pages-list" id="pagesList"></div>
      <div class="empty" id="pagesEmpty" style="display:none">暂无页面</div>
    </div>

    <!-- Protos -->
    <div class="panel" id="panel-protos">
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
            <p>点击选择 <strong>ZIP 文件</strong>，或拖拽文件夹到此处</p>
            <small style="display:block;margin-top:6px;color:#444">支持 AxureRP 导出目录（自动打包）或 ZIP 文件，最大 50 MB</small>
            <div style="display:flex;gap:8px;justify-content:center;margin-top:12px">
              <button type="button" onclick="event.stopPropagation();document.getElementById('protoFileInput').click()" style="padding:5px 14px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:6px;color:#888;font-size:.78rem;cursor:pointer">选择 ZIP</button>
              <button type="button" onclick="event.stopPropagation();document.getElementById('protoFolderInput').click()" style="padding:5px 14px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:6px;color:#888;font-size:.78rem;cursor:pointer">选择文件夹</button>
            </div>
          </div>
          <div class="proto-fields">
            <div class="field"><label>原型名称 <span style="color:#444;font-weight:400">（可选）</span></label><input type="text" id="protoTitle" placeholder="留空自动命名" maxlength="100"></div>
            <div class="field field-pwd"><label>访问密码（可选）</label><input type="text" id="protoPassword" placeholder="最多 6 位字母数字" maxlength="6" autocomplete="off"></div>
          </div>
          <button class="btn-upload" id="protoUploadBtn" disabled>上传原型</button>
          <div class="progress" id="protoProgress"><div class="progress-bar" id="protoProgressBar"></div></div>
          <div class="progress-info" id="protoProgressInfo"><span class="pct" id="protoProgressPct">0%</span></div>
          <div id="protoStatusText" style="display:none;font-size:.78rem;color:#7aabee;margin-top:2px;margin-bottom:4px;min-height:1.2em"></div>
          <div class="err" id="protoErr"></div>
        </div>
      </div>

      <!-- Table section -->
      <div class="pages-header" style="margin-bottom:10px">
        <span style="font-size:.85rem;font-weight:600">我的原型</span>
        <div class="spacer"></div>
        <button class="btn btn-ghost" id="refreshProtos" style="font-size:.8rem">刷新</button>
      </div>
      <div style="background:#111;border:1px solid #1a1a1a;border-radius:12px;overflow:hidden">
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
  <footer style="border-top:1px solid #1a1a1a;padding:14px 24px;display:flex;align-items:center;gap:10px;font-size:.75rem;color:#444;flex-wrap:wrap">
    <span>图片存储于</span>
    <span style="color:#f97316;font-weight:600">Cloudflare R2</span>
    <span style="color:#2a2a2a">·</span>
    <span>10 GB 免费存储额度</span>
    <span style="color:#2a2a2a">·</span>
    <span>无出口流量费用</span>
    <span style="color:#2a2a2a">·</span>
    <span>全球 CDN 加速</span>
    <div style="flex:1"></div>
    <span id="footerAdmin"></span>
  </footer>
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

<div class="toast" id="toast"></div>

<script>
  function _fflate() {
    if (!window.fflate) throw new Error('压缩库未加载，请刷新页面后重试');
    return window.fflate;
  }
  const TOKEN_KEY = 'onimg_token', PERM_KEY = 'onimg_perms', USER_KEY = 'onimg_user', ADMIN_KEY = 'onimg_is_admin';
  let token = localStorage.getItem(TOKEN_KEY);
  let perms = JSON.parse(localStorage.getItem(PERM_KEY) || 'null');
  let username = localStorage.getItem(USER_KEY);
  let isAdminUser = localStorage.getItem(ADMIN_KEY) === '1';
  let mineItems = [], lbKey = null, editingSlug = null, userPages = [], vditorInst = null, userProtos = [];
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

  function initVditor(content) {
    if (!window.Vditor) {
      document.getElementById('pmContent').value = content || '';
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
      ? \`<a href="/admin" style="color:#383838;text-decoration:none;transition:color .15s" onmouseover="this.style.color='#777'" onmouseout="this.style.color='#383838'">Admin ↗</a>\`
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
    document.getElementById('pagesList').innerHTML = '';
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

  // Tabs
  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => {
      if (!token && ['upload','gallery-mine','pages','protos'].includes(t.dataset.tab)) {
        openLoginOverlay(); return;
      }
      document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      document.getElementById('panel-' + t.dataset.tab).classList.add('active');
      if (t.dataset.tab === 'gallery-mine') loadMineGallery();
      if (t.dataset.tab === 'pages') loadPages();
      if (t.dataset.tab === 'protos') loadProtos();
    });
  });

  // ── Public gallery ──
  async function loadPublicGallery() {
    const res = await fetch('/api/gallery');
    if (!res.ok) return;
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
      const fd = new FormData(); fd.append('file', file);
      const result = await new Promise(resolve => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload');
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        xhr.upload.addEventListener('progress', e => {
          if (!e.lengthComputable) return;
          const filePct  = e.loaded / e.total;
          const overallPct = Math.round(((i + filePct) / total) * 100);
          bar.style.width   = overallPct + '%';
          pctEl.textContent = overallPct + '%';
          bytesEl.textContent = fmtSize(e.loaded) + ' / ' + fmtSize(e.total);
        });
        xhr.addEventListener('load', () => {
          let data = {};
          try { data = JSON.parse(xhr.responseText); } catch {}
          if (xhr.status >= 400) resolve({ ok: false, name: file.name, error: data.error || '上传失败' });
          else resolve({ ok: true, url: data.url, key: data.key, name: file.name });
        });
        xhr.addEventListener('error', () => resolve({ ok: false, name: file.name, error: '网络错误' }));
        xhr.send(fd);
      });

      if (result.ok && makePublic && result.key) {
        await fetch('/api/image/' + encodeURIComponent(result.key) + '/visibility', {
          method: 'PATCH', headers: { Authorization: 'Bearer ' + token },
        }).catch(() => {});
      }
      results.push(result);
    }

    bar.style.width = '100%'; pctEl.textContent = '100%';
    setTimeout(() => { prog.classList.remove('show'); bar.style.width = '0%'; info.classList.remove('show'); }, 700);
    document.getElementById('uploadBtn').disabled = false;
    setFiles([]);
    loadQuota();
    document.getElementById('resultList').innerHTML = results.map(r => r.ok
      ? \`<div class="result-item"><img src="\${r.url}" loading="lazy"><div class="info"><div class="name">\${r.name}</div><div class="url-row"><input class="url-input" value="\${r.url}" readonly onclick="this.select()"><button class="btn btn-ghost" onclick="cp('\${r.url}',this)" style="padding:3px 8px">复制</button><button class="btn btn-ghost" onclick="cp('![](\${r.url})',this)" style="padding:3px 8px">MD</button><button class="btn btn-ghost" onclick="cp('[img]\${r.url}[/img]',this)" style="padding:3px 8px">BB</button></div></div></div>\`
      : \`<div class="result-item"><div class="info"><div class="name" style="color:#ef4444">❌ \${r.name}: \${r.error}</div></div></div>\`
    ).join('');
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
    const res = await fetch('/list', { headers: { Authorization: 'Bearer ' + token } });
    if (res.status === 401) { logout(); return; }
    const { items } = await res.json();
    mineItems = items;
    renderMineGallery();
  }
  document.getElementById('mineSearch').addEventListener('input', renderMineGallery);
  document.getElementById('refreshMine').addEventListener('click', loadMineGallery);

  function renderMineGallery() {
    const q = document.getElementById('mineSearch').value.toLowerCase();
    const items = q ? mineItems.filter(i => i.key.toLowerCase().includes(q)) : mineItems;
    document.getElementById('mineEmpty').style.display = items.length ? 'none' : 'block';
    document.getElementById('mineGrid').innerHTML = items.map(item => {
      const url = location.origin + '/' + item.key;
      return \`<div class="gitem">
        <img src="\${url}" loading="lazy" onload="this.classList.add('loaded')" onclick="openLb('\${item.key}', true, 'mine')">
        <div class="gitem-info">
          <div class="gitem-key">\${item.key}</div>
          <div class="gitem-row">
            <button class="\${item.isPublic?'btn-public':'btn-private'}" id="vis-\${item.key}" onclick="toggleVis('\${item.key}', this)">\${item.isPublic?'公开':'私密'}</button>
            <span style="font-size:.68rem;color:#444">\${fmtSize(item.size)}</span>
          </div>
          <div class="gitem-actions">
            <button class="btn btn-ghost" onclick="cp('\${url}',this)" style="padding:3px 8px">复制</button>
            \${perms?.canDelete?\`<button class="btn btn-danger" onclick="delMine('\${item.key}')" style="padding:3px 8px">删除</button>\`:''}
          </div>
        </div>
      </div>\`;
    }).join('');
  }

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
    if (!confirm('确认删除？')) return;
    await fetch('/delete/' + key, { method:'DELETE', headers:{ Authorization:'Bearer '+token } });
    mineItems = mineItems.filter(i => i.key !== key);
    renderMineGallery();
    document.getElementById('lightbox').classList.remove('show');
    toast('已删除');
  }

  // ── Pages ──
  function renderPages() {
    document.getElementById('pagesEmpty').style.display = userPages.length ? 'none' : 'block';
    document.getElementById('pagesList').innerHTML = userPages.map((p, i) => \`
      <div class="page-item">
        <div class="page-item-info">
          <div class="page-title">\${esc(p.title)} <span class="type-badge type-\${p.type==='markdown'?'md':'html'}">\${p.type}</span></div>
          <div class="page-slug">/p/\${p.slug}</div>
          <div class="page-meta">\${p.isPublic?'公开':'私密'} · \${new Date(p.createdAt).toLocaleDateString('zh-CN')}</div>
        </div>
        <a href="/p/\${p.slug}" target="_blank" class="btn btn-ghost">预览</a>
        <button class="btn btn-ghost" onclick="editPage(\${i})">编辑</button>
        <button class="btn btn-danger" onclick="deletePage('\${p.slug}')">删除</button>
      </div>
    \`).join('');
  }

  async function loadPages() {
    if (!token) return;
    const res = await fetch('/api/pages', { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) return;
    const { pages } = await res.json();
    userPages = pages;
    renderPages();
  }

  document.getElementById('pmSlug').addEventListener('input', () => {
    const s = document.getElementById('pmSlug').value;
    document.getElementById('pmSlugPreview').textContent = s ? location.origin + '/p/' + s : '';
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
    document.getElementById('pmSlugPreview').textContent = '';
    document.getElementById('pmType').value = 'markdown';
    document.getElementById('pmContent').value = '';
    document.getElementById('pmPublic').checked = true;
    document.getElementById('pageModalSave').textContent = '创建';
    document.getElementById('pageModal').classList.add('show');
    setTimeout(() => initVditor(''), 50);
  });

  function editPage(idx) {
    const p = userPages[idx];
    if (!p) return;
    editingSlug = p.slug;
    destroyVditor();
    document.getElementById('pageModalTitle').textContent = '编辑页面';
    document.getElementById('pmTitle').value = p.title || '';
    const slugEl = document.getElementById('pmSlug');
    slugEl.value = p.slug;
    slugEl.readOnly = true;
    slugEl.style.opacity = '0.5';
    document.getElementById('pmSlugPreview').textContent = location.origin + '/p/' + p.slug;
    document.getElementById('pmType').value = p.type;
    document.getElementById('pmContent').value = p.content || '';
    document.getElementById('pmPublic').checked = p.isPublic !== false;
    document.getElementById('pageModalSave').textContent = '保存';
    document.getElementById('pageModal').classList.add('show');
    setTimeout(() => switchEditorToType(p.type, p.content || ''), 50);
  }

  document.getElementById('pageModalSave').addEventListener('click', async () => {
    const isEdit = !!editingSlug;
    const slug    = isEdit ? editingSlug : document.getElementById('pmSlug').value.trim();
    const title   = document.getElementById('pmTitle').value.trim();
    const type    = document.getElementById('pmType').value;
    const content = getContent();
    const isPublic = document.getElementById('pmPublic').checked;
    if (!slug) { toast('请填写后缀'); return; }
    if (!content) { toast('内容不能为空'); return; }

    const url  = isEdit ? '/api/pages/' + encodeURIComponent(editingSlug) : '/api/pages';
    const meth = isEdit ? 'PATCH' : 'POST';
    const body = isEdit ? { title, content, type, isPublic } : { slug, title, content, type, isPublic };

    const res = await fetch(url, { method: meth, headers: authH(), body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 409) { toast('后缀已被占用，请换一个'); return; }
      toast('失败: ' + data.error); return;
    }

    // Close modal and clean up editor immediately
    destroyVditor();
    document.getElementById('pageModal').classList.remove('show');
    toast(isEdit ? '已保存' : '页面已创建');

    // Optimistic update — avoid KV list eventual-consistency delay
    const now = Date.now();
    if (isEdit) {
      const idx = userPages.findIndex(p => p.slug === editingSlug);
      if (idx >= 0) Object.assign(userPages[idx], { title: title || slug, content, type, isPublic, updatedAt: now });
    } else {
      userPages.unshift({ slug, title: title || slug, content, type, isPublic, createdAt: now, updatedAt: now });
    }
    renderPages();

    // Background sync to stay consistent with server
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

  // ── Lightbox ──
  function openLb(key, showDelete, context) {
    lbKey = key;
    if (context === 'mine') {
      const q = document.getElementById('mineSearch').value.toLowerCase();
      const items = q ? mineItems.filter(i => i.key.toLowerCase().includes(q)) : mineItems;
      lbList = items.map(i => ({ key: i.key, showDelete }));
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

  async function packFilesToZip(fileList) {
    const p = protoDropZone.querySelector('p');
    p.textContent = '正在打包文件夹…';
    document.getElementById('protoUploadBtn').disabled = true;
    try {
      const { zipSync } = _fflate();
      const filesData = {};
      let topFolder = '';
      // Collect all files
      for (const file of fileList) {
        const parts = file.webkitRelativePath.split('/');
        if (!topFolder) topFolder = parts[0];
        const rel = parts.slice(1).join('/'); // Strip top-level folder
        if (!rel || rel === '.DS_Store' || rel.endsWith('/.DS_Store')) continue;
        const buf = await file.arrayBuffer();
        filesData[rel] = [new Uint8Array(buf), { level: 0 }];
      }
      const zipped = zipSync(filesData);
      const blob = new Blob([zipped], { type: 'application/zip' });
      const zipFile = new File([blob], (topFolder || 'prototype') + '.zip', { type: 'application/zip' });
      setProtoFile(zipFile);
      if (!document.getElementById('protoTitle').value) {
        document.getElementById('protoTitle').value = topFolder || '';
      }
    } catch(e) {
      p.textContent = '点击选择 ZIP 文件，或拖拽文件夹到此处';
      document.getElementById('protoErr').textContent = '打包失败: ' + e.message;
    }
  }

  async function packFolderEntry(dirEntry) {
    const p = protoDropZone.querySelector('p');
    p.textContent = '正在读取文件夹…';
    document.getElementById('protoUploadBtn').disabled = true;
    try {
      const { zipSync } = _fflate();
      const filesData = {};
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
            filesData[prefix + e.name] = [new Uint8Array(buf), { level: 0 }];
          }
        }
      }
      await readDir(dirEntry, '');
      const zipped = zipSync(filesData);
      const blob = new Blob([zipped], { type: 'application/zip' });
      const zipFile = new File([blob], dirEntry.name + '.zip', { type: 'application/zip' });
      setProtoFile(zipFile);
      if (!document.getElementById('protoTitle').value) {
        document.getElementById('protoTitle').value = dirEntry.name;
      }
    } catch(e) {
      protoDropZone.querySelector('p').textContent = '点击选择 ZIP 文件，或拖拽文件夹到此处';
      document.getElementById('protoErr').textContent = '读取文件夹失败: ' + e.message;
    }
  }

  function setProtoFile(f) {
    pendingProtoFile = f;
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

  // ── Shared chunked upload engine ─────────────────────────────────────────────
  async function _protoChunkedUpload({ zipFile, filesMap, title, password, existingProtoId, setStatus, initUrl, filesUrl, finalizeUrl }) {
    const BATCH = 40;
    let files;
    if (filesMap) {
      files = filesMap;
      setStatus(\`📋 分析文件结构… \${Object.keys(files).length} 个文件\`, 8);
    } else {
      setStatus('🗜️ 正在解压 ZIP…', 3);
      const bytes = new Uint8Array(await zipFile.arrayBuffer());
      try {
        const raw = _fflate().unzipSync(bytes);
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

    // Step 1: init
    setStatus('🔧 初始化上传会话…', 12);
    const initRes = await fetch(initUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ title, password, entryPoint, totalSize, protoId: existingProtoId || undefined }),
    });
    const initData = await initRes.json().catch(() => ({}));
    if (!initRes.ok) throw new Error(initData.error || '初始化失败');
    const { protoId } = initData;

    // Step 2: upload in batches
    const totalBatches = Math.ceil(safePaths.length / BATCH);
    for (let b = 0; b < totalBatches; b++) {
      const batchPaths = safePaths.slice(b * BATCH, (b + 1) * BATCH);
      const from = b * BATCH + 1, to = Math.min((b + 1) * BATCH, safePaths.length);
      const pct = Math.round(15 + (b / totalBatches) * 75);
      setStatus(\`📤 上传第 \${b+1}/\${totalBatches} 批（\${from}–\${to} / \${safePaths.length} 个文件）\`, pct);
      const fd = new FormData();
      fd.append('protoId', protoId);
      batchPaths.forEach(p => { fd.append('paths[]', p); fd.append('files[]', new Blob([files[p]]), p); });
      const bRes = await fetch(filesUrl, { method: 'POST', headers: { 'Authorization': 'Bearer ' + token }, body: fd });
      if (!bRes.ok) { const d = await bRes.json().catch(()=>({})); throw new Error(d.error || \`批次 \${b+1} 上传失败\`); }
    }

    // Step 3: finalize
    setStatus('✅ 正在写入元数据…', 93);
    const fRes = await fetch(finalizeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ protoId, filePaths: safePaths }),
    });
    const fData = await fRes.json().catch(() => ({}));
    if (!fRes.ok) throw new Error(fData.error || '最终化失败');
    setStatus('🎉 上传完成！', 100);
    return { ...fData, protoId, safePaths, totalSize };
  }

  // ── Main proto upload button ──────────────────────────────────────────────────
  document.getElementById('protoUploadBtn').addEventListener('click', async () => {
    if (!token || !pendingProtoFile) return;
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
          <div style="display:flex;gap:4px;margin-top:3px;flex-wrap:wrap">\${lock}\${priv}</div>
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
    if (!confirm('确认删除此原型？此操作无法撤销。')) return;
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
      toast('已删除');
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
    pendingUpdateFile = null;
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
    document.getElementById('puFileName').textContent = f.name + ' (' + fmtSize(f.size) + ')';
    document.getElementById('puErr').textContent = '';
    document.getElementById('protoUpdateUpload').disabled = false;
  }

  async function puPackFilesToZip(fileList) {
    document.getElementById('puFileName').textContent = '正在打包…';
    document.getElementById('protoUpdateUpload').disabled = true;
    try {
      const { zipSync } = _fflate();
      const filesData = {};
      let topFolder = '';
      for (const file of fileList) {
        const parts = file.webkitRelativePath.split('/');
        if (!topFolder) topFolder = parts[0];
        const rel = parts.slice(1).join('/');
        if (!rel || rel === '.DS_Store' || rel.endsWith('/.DS_Store')) continue;
        const buf = await file.arrayBuffer();
        filesData[rel] = [new Uint8Array(buf), { level: 0 }];
      }
      const zipped = zipSync(filesData);
      const blob = new Blob([zipped], { type: 'application/zip' });
      const zipFile = new File([blob], (topFolder || 'prototype') + '.zip', { type: 'application/zip' });
      setPuFile(zipFile);
    } catch(e) {
      document.getElementById('puFileName').textContent = '选择 ZIP 或文件夹';
      document.getElementById('puErr').textContent = '打包失败: ' + e.message;
    }
  }

  async function puPackFolderEntry(dirEntry) {
    document.getElementById('puFileName').textContent = '正在读取…';
    document.getElementById('protoUpdateUpload').disabled = true;
    try {
      const { zipSync } = _fflate();
      const filesData = {};
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
            filesData[prefix + e.name] = [new Uint8Array(buf), { level: 0 }];
          }
        }
      }
      await readDir(dirEntry, '');
      const zipped = _fflate().zipSync(filesData);
      const blob = new Blob([zipped], { type: 'application/zip' });
      const zipFile = new File([blob], dirEntry.name + '.zip', { type: 'application/zip' });
      setPuFile(zipFile);
    } catch(e) {
      document.getElementById('puFileName').textContent = '选择 ZIP 或文件夹';
      document.getElementById('puErr').textContent = '读取失败: ' + e.message;
    }
  }

  document.getElementById('protoUpdateUpload').addEventListener('click', async () => {
    if (!pendingUpdateFile || !editingProtoId) return;
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
        zipFile: pendingUpdateFile, filesMap: null,
        title: undefined, password: undefined,
        existingProtoId: editingProtoId,
        setStatus,
        initUrl: '/upload/proto/init', filesUrl: '/upload/proto/files', finalizeUrl: '/upload/proto/finalize',
      });
      bar.style.width = '100%'; pctEl.textContent = '100%';
      resetProg();
      document.getElementById('protoUpdateModal').classList.remove('show');
      toast('版本已更新！');
      pendingUpdateFile = null;
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
  function fmtSize(b) { if(b<1024) return b+' B'; if(b<1048576) return (b/1024).toFixed(1)+' KB'; return (b/1048576).toFixed(1)+' MB'; }
  function fmtDate(ms) { if(!ms) return '—'; return new Date(ms).toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit',year:'2-digit'}); }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  document.addEventListener('keydown', e => {
    const lb = document.getElementById('lightbox');
    if (e.key === 'Escape') {
      lb.classList.remove('show'); closePageModal();
      ['protoEditModal','protoUpdateModal','userProtoVersionModal'].forEach(id => {
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
<script>${FFLATE_UMD}</script>
<script src="https://cdn.jsdelivr.net/npm/vditor/dist/index.min.js" defer></script>
</body>
</html>`;
}
