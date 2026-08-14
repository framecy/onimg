import { FFLATE_UMD } from './fflate-inline.js';
import apertureCss from './ui/aperture.generated.js';
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
    /* Aperture token（@theme）+ 别名桥 + Tailwind 工具类，由 build:css 生成 */
    ${apertureCss}


    @media (max-width: 768px) {
      main { padding: 20px 18px 56px; }
      .page-batch-bar, .batch-bar { gap: 8px; padding: 12px; margin-bottom: 16px; }
    }

    /* Login enhancements — keyframes kept, referenced via Tailwind arbitrary animate-[] values */
    @keyframes loginSpin { to { transform: rotate(360deg); } }
    @keyframes loginShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }

    main { flex: 1; padding: var(--sp-6) var(--sp-6) var(--sp-7); max-width: 1080px; margin: 0 auto; width: 100%; }
    /* Tag editor modal */



    /* Vditor container — fills remaining modal height, owns scroll */
    #pmVditor {
      border-radius: var(--r-md);
      overflow: hidden;
      flex: 1 1 auto;
      min-height: 360px;
      border: 1px solid var(--bd-2);
      min-width: 0;
      max-width: 100%;
      display: flex;
      flex-direction: column;
      background: var(--bg-2);
    }
    #pmVditor .vditor {
      height: 100% !important;
      max-width: 100% !important;
      border: none !important;
      background: var(--bg-2) !important;
      display: flex !important;
      flex-direction: column !important;
    }
    #pmVditor .vditor-toolbar {
      flex-shrink: 0 !important;
      flex-wrap: wrap !important;
      overflow-x: auto;
      background: var(--bg-3) !important;
      border-bottom: 1px solid var(--bd) !important;
      position: sticky !important;
      top: 0 !important;
      z-index: 10 !important;
    }
    #pmVditor .vditor-content {
      flex: 1 1 auto !important;
      height: auto !important;
      min-height: 0 !important;
      overflow-y: auto !important;
      overscroll-behavior: contain;
      min-width: 0;
    }
    #pmVditor .vditor-ir,
    #pmVditor .vditor-sv,
    #pmVditor .vditor-wysiwyg {
      min-height: 100% !important;
    }
    #pmVditor .vditor-ir pre.vditor-reset,
    #pmVditor .vditor-sv pre.vditor-reset,
    #pmVditor .vditor-wysiwyg pre.vditor-reset {
      max-width: 100% !important;
      overflow-wrap: anywhere;
      word-break: break-word;
      color: var(--tx) !important;
      background: transparent !important;
      font-size: 14.5px !important;
      line-height: 1.75 !important;
      padding: 14px 16px !important;
    }
    #pmVditor .vditor-outline { display: none !important; }
    #pmPwdSection { display: none; }
    #pmPwdSection.show { display: block; }
    /* Skeleton shimmer */
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    .gitem img:not(.loaded), .pub-item img:not(.loaded) {
      background: linear-gradient(90deg, var(--bg-2) 25%, var(--bg-4) 50%, var(--bg-2) 75%);
      background-size: 400% 100%;
      animation: shimmer 1.4s ease infinite;
    }
    .gitem img.loaded, .pub-item img.loaded { animation: none; background: var(--bg-2); }
    /* Responsive */
    @media (max-width: 600px) {
      main { padding: 16px 16px 28px; }
    }
    /* Phones — denser 3-up gallery */
    @media (max-width: 480px) {
      .pub-grid { grid-template-columns: repeat(3, 1fr); gap: 7px; }
      .pub-item-info { padding: 6px 8px; }
      .batch-bar { gap: 7px; padding: 8px 10px; }
    }

  </style>
</head>
<body class="min-h-screen max-w-full overflow-x-hidden bg-bg font-sans font-[450] text-tx antialiased">
<div class="mob-header fixed inset-x-0 top-0 z-20 flex h-[50px] items-center gap-[14px] border-b border-bd bg-bg-2 px-4 md:hidden">
  <button class="flex h-8 w-8 items-center justify-center rounded-sm border border-bd bg-transparent text-tx-2 cursor-pointer transition hover:border-bd-2 hover:text-tx" id="mobHamburger" aria-label="菜单"><svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="12" x2="14" y2="12"/></svg></button>
  <div class="text-[.92rem] font-bold text-tx">Onimg</div>
</div>
<div class="sidebar-mask fixed inset-0 z-[9] hidden bg-black/60 [&.show]:block" id="sidebarMask"></div>
<div class="flex min-h-screen">
  <aside class="fixed inset-y-0 left-0 z-10 flex w-60 shrink-0 -translate-x-60 flex-col border-r border-bd bg-bg-2 transition-transform duration-[.22s] ease-in-out md:translate-x-0 [&.open]:translate-x-0 [&.open]:z-[15]" id="sidebar">
    <div class="flex items-center gap-2.5 border-b border-bd px-4 pt-[18px] pb-3.5">
      <div class="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-sm border border-brand/30 bg-gradient-to-br from-[#242836] to-[#14161d] text-[.78rem] font-extrabold tracking-[-.01em] text-accent shadow-[0_3px_10px_rgba(0,0,0,.45)]">O</div>
      <div class="flex flex-col gap-px">
        <span class="text-[.92rem] font-bold text-tx tracking-[-.015em]">Onimg</span>
        <span class="text-[.58rem] font-semibold uppercase tracking-[.12em] text-tx-3">IMAGE HOST</span>
      </div>
    </div>
    <div class="px-4 pt-[14px] pb-[5px] text-2xs font-bold uppercase tracking-[.12em] text-tx-3">导航</div>
    <nav class="flex flex-1 flex-col gap-px overflow-y-auto px-2 pt-1 pb-2">
      <button class="tab active relative flex w-full items-center gap-[9px] overflow-hidden rounded-sm border-none bg-transparent px-[11px] py-[9px] text-left font-sans text-[.85rem] font-semibold text-tx-2 transition hover:bg-bg-hover hover:text-tx active:scale-[.972] [&.active]:bg-brand-muted [&.active]:text-tx [&.active]:font-bold [&.active]:shadow-[inset_3px_0_0_var(--color-brand)] max-md:min-h-[44px]" data-tab="gallery-pub"><span class="flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:h-[15px] [&_svg]:w-[15px]"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.5"/><ellipse cx="8" cy="8" rx="2.8" ry="6.5"/><line x1="1.5" y1="8" x2="14.5" y2="8"/></svg></span><span>公开图库</span></button>
      <button class="tab relative flex w-full items-center gap-[9px] overflow-hidden rounded-sm border-none bg-transparent px-[11px] py-[9px] text-left font-sans text-[.85rem] font-semibold text-tx-2 transition hover:bg-bg-hover hover:text-tx active:scale-[.972] [&.active]:bg-brand-muted [&.active]:text-tx [&.active]:font-bold [&.active]:shadow-[inset_3px_0_0_var(--color-brand)] max-md:min-h-[44px]" data-tab="upload"        id="tabUpload"><span class="flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:h-[15px] [&_svg]:w-[15px]"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="14" x2="8" y2="3"/><polyline points="3.5,7.5 8,3 12.5,7.5"/></svg></span><span>上传</span></button>
      <button class="tab relative flex w-full items-center gap-[9px] overflow-hidden rounded-sm border-none bg-transparent px-[11px] py-[9px] text-left font-sans text-[.85rem] font-semibold text-tx-2 transition hover:bg-bg-hover hover:text-tx active:scale-[.972] [&.active]:bg-brand-muted [&.active]:text-tx [&.active]:font-bold [&.active]:shadow-[inset_3px_0_0_var(--color-brand)] max-md:min-h-[44px]" data-tab="gallery-mine"  id="tabMine"><span class="flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:h-[15px] [&_svg]:w-[15px]"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="2.5" width="14" height="11" rx="1.5"/><circle cx="5.2" cy="6.3" r="1.3"/><path d="M1.5 11l4-4 2.5 2.5 2-2 4.5 4.5"/></svg></span><span>我的图库</span></button>
      <button class="tab relative flex w-full items-center gap-[9px] overflow-hidden rounded-sm border-none bg-transparent px-[11px] py-[9px] text-left font-sans text-[.85rem] font-semibold text-tx-2 transition hover:bg-bg-hover hover:text-tx active:scale-[.972] [&.active]:bg-brand-muted [&.active]:text-tx [&.active]:font-bold [&.active]:shadow-[inset_3px_0_0_var(--color-brand)] max-md:min-h-[44px]" data-tab="pages"         id="tabPages"><span class="flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:h-[15px] [&_svg]:w-[15px]"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 1h7l4 4v10H3V1z"/><polyline points="10,1 10,5 14,5"/><line x1="4" y1="8" x2="12" y2="8"/><line x1="4" y1="11" x2="9" y2="11"/></svg></span><span>我的页面</span></button>
      <button class="tab relative flex w-full items-center gap-[9px] overflow-hidden rounded-sm border-none bg-transparent px-[11px] py-[9px] text-left font-sans text-[.85rem] font-semibold text-tx-2 transition hover:bg-bg-hover hover:text-tx active:scale-[.972] [&.active]:bg-brand-muted [&.active]:text-tx [&.active]:font-bold [&.active]:shadow-[inset_3px_0_0_var(--color-brand)] max-md:min-h-[44px]" data-tab="protos"        id="tabProtos"><span class="flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:h-[15px] [&_svg]:w-[15px]"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 2h12v5l-8 8H2V2z"/><line x1="5" y1="2" x2="5" y2="5"/><line x1="8" y1="2" x2="8" y2="4"/><line x1="11" y1="2" x2="11" y2="5"/></svg></span><span>我的原型</span></button>
    </nav>
    <div class="border-t border-bd px-2 pt-1 pb-1.5">
      <span id="footerAdmin"></span>
    </div>
    <div class="relative border-t border-bd px-2 pt-[10px] pb-3">
      <div id="userArea">
        <button class="w-full rounded-md border border-bd-2 bg-bg-3 px-3 py-[9px] text-center text-[.85rem] font-semibold text-tx transition hover:border-bd-focus hover:bg-bg-4" id="loginTrigger">登录</button>
      </div>
    </div>
  </aside>

  <div class="flex min-w-0 flex-1 flex-col min-h-screen bg-bg pt-[52px] md:ml-60 md:pt-0">

  <!-- Login overlay -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-6 backdrop-blur-[6px]" id="loginOverlay" style="display:none">
    <div class="login-card relative w-full max-w-[380px] overflow-hidden rounded-xl border border-bd bg-bg-3 py-9 px-7 shadow md:py-11 md:px-10 [&.shake]:animate-[loginShake_.35s_ease]">
      <div class="mb-8 flex items-start justify-between">
        <div class="flex items-center gap-2.5">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(135deg,var(--color-brand)_0%,var(--color-brand-d)_100%)] text-[.75rem] font-extrabold text-white shadow-[0_6px_16px_rgba(124,92,255,.3)]">OI</span>
          <div>
            <div class="text-[1.05rem] font-extrabold leading-[1.15] tracking-[-.01em] text-tx">登录 Onimg</div>
            <div class="mt-px text-xs text-tx-3">登录后即可上传与管理图片</div>
          </div>
        </div>
        <button class="border-none bg-transparent p-1 text-[1.2rem] leading-none text-tx-3 cursor-pointer" id="loginOverlayClose"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg></button>
      </div>
      <div class="flex flex-col gap-2 mb-5"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">用户名</label><input class="w-full rounded-md border border-bd bg-bg-2 px-3.5 py-[11px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]" type="text" id="lu" autocomplete="username" placeholder="username"></div>
      <div class="flex flex-col gap-2 mb-4"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">密码</label><div class="relative"><input class="w-full rounded-md border border-bd bg-bg-2 px-3.5 py-[11px] pr-10 font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]" type="password" id="lp" autocomplete="current-password" placeholder="••••••••"><button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center border-none bg-transparent p-0 text-tx-3 cursor-pointer transition hover:text-tx" id="lpToggle" title="显示/隐藏密码"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg></button></div></div>
      <label class="mb-6 flex items-center gap-2 cursor-pointer select-none text-[.8rem] text-tx-2"><input class="h-3.5 w-3.5 cursor-pointer accent-brand" type="checkbox" id="loginRemember">记住我 30 天</label>
      <button class="btn-full w-full rounded-md border-none bg-brand px-3 py-3 font-sans text-base-sm font-bold text-white shadow-[0_4px_14px_rgba(124,92,255,.3)] transition hover:-translate-y-px hover:bg-brand-hover hover:shadow-[0_8px_22px_rgba(124,92,255,.4)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-bg-5 disabled:text-tx-3 disabled:shadow-none [&.loading]:pointer-events-none [&.loading]:before:content-[''] [&.loading]:before:inline-block [&.loading]:before:mr-2 [&.loading]:before:h-[14px] [&.loading]:before:w-[14px] [&.loading]:before:align-middle [&.loading]:before:rounded-full [&.loading]:before:border-2 [&.loading]:before:border-white/30 [&.loading]:before:border-t-white [&.loading]:before:animate-[loginSpin_.6s_linear_infinite]" id="doLogin">登录</button>
      <div class="login-err mt-3 min-h-[18px] text-center text-xs text-red" id="loginErr"></div>
    </div>
  </div>

  <main>
    <!-- Public Gallery -->
    <div class="panel active hidden [&.active]:block" id="panel-gallery-pub">
      <div class="page-header flex flex-wrap items-end gap-3 border-b border-bd mb-6 pb-[18px] md:mb-8 md:gap-4 md:pb-6">
        <div class="min-w-0 flex-1">
          <div class="page-title mb-1.5 text-[1.15rem] font-extrabold tracking-[-.03em] text-tx mob:text-[1.2rem] md:text-[1.375rem]">公开图库</div>
          <div class="text-sm font-medium tracking-[.01em] text-tx-3">所有用户公开分享的图片</div>
        </div>
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx max-md:flex-1" id="refreshPub">刷新</button>
      </div>
      <div class="pub-grid grid grid-cols-3 gap-[7px] xs:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] xs:gap-3 mob:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] mob:gap-[14px]" id="pubGrid"></div>
      <div class="p-12 text-center text-[.88rem] font-medium text-tx-3" id="pubEmpty" style="display:none">暂无公开图片</div>
    </div>

    <!-- Upload -->
    <div class="panel hidden [&.active]:block" id="panel-upload">
      <div class="page-header flex flex-wrap items-end gap-3 border-b border-bd mb-6 pb-[18px] md:mb-8 md:gap-4 md:pb-6">
        <div class="min-w-0 flex-1">
          <div class="page-title mb-1.5 text-[1.15rem] font-extrabold tracking-[-.03em] text-tx mob:text-[1.2rem] md:text-[1.375rem]">上传图片</div>
          <div class="text-sm font-medium tracking-[.01em] text-tx-3">支持 JPG / PNG / GIF / WebP / SVG，单文件 10 MB 内</div>
        </div>
      </div>
      <div class="quota-bar mb-4 flex gap-5 rounded-lg border border-bd bg-bg-3 px-4 py-3 text-sm shadow-none" id="quotaBar" style="display:none">
        <span class="font-medium text-tx-2">今日 <strong class="font-mono font-bold text-tx" id="qDaily">—</strong></span>
        <span class="font-medium text-tx-2">总计 <strong class="font-mono font-bold text-tx" id="qTotal">—</strong></span>
        <span class="text-tx-3" id="qLimits"></span>
      </div>
      <div class="drop-zone group mb-[18px] cursor-pointer border border-dashed border-bd-2 bg-transparent px-5 py-9 text-center text-tx-3 transition hover:border-tx-2 hover:bg-white/[.03] hover:text-tx [&.over]:border-tx-2 [&.over]:bg-white/[.03] [&.over]:text-tx mob:px-5 mob:py-10 md:mb-4 md:px-9 md:py-16 rounded-xl" id="dropZone">
        <input class="hidden" type="file" id="fileInput" accept="image/*" multiple>
        <svg class="dz-icon mx-auto mb-4 block h-[42px] w-[42px] text-tx-3 transition-colors duration-200 group-hover:text-tx group-[.over]:text-tx" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 16 12 12 8 16"></polyline>
          <line x1="12" y1="12" x2="12" y2="21"></line>
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
        </svg>
        <p class="text-[.9rem] font-medium text-inherit" id="dropZoneHint">点击或拖拽图片上传</p>
        <small class="block mt-2 text-[.76rem]">JPG · PNG · GIF · WebP · SVG · 可多次添加</small>
      </div>
      <div class="upload-queue hidden flex-col gap-1.5 mb-[10px] [&.show]:flex" id="uploadQueue"></div>
      <div class="flex items-center gap-2 mb-[10px] text-[.82rem] text-tx-3">
        <label class="flex items-center gap-1.5 cursor-pointer select-none">
          <input class="accent-accent" type="checkbox" id="uploadPublic">
          <span>上传后加入公开图库</span>
        </label>
      </div>
      <button class="w-full rounded-md bg-accent px-3 py-[11px] text-base-sm font-bold text-tx-inv transition hover:-translate-y-px hover:bg-accent-hover hover:shadow-[0_8px_24px_rgba(255,255,255,.07)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-bg-5 disabled:text-tx-3 disabled:shadow-none" id="uploadBtn" disabled>上传</button>
      <div class="progress hidden my-[10px] h-[3px] overflow-hidden rounded-full bg-bg-3 [&.show]:block" id="progress"><div class="progress-bar h-full w-0 bg-accent transition-[width] duration-[.25s]" id="progressBar"></div></div>
      <div class="progress-info hidden items-center gap-[10px] -mt-1 mb-1.5 text-[.76rem] text-tx-2 [&.show]:flex" id="imgProgressInfo"><span class="min-w-[34px] font-mono font-bold text-tx" id="imgProgressPct">0%</span><span class="font-mono text-tx-3" id="imgProgressBytes"></span><span class="font-mono text-tx-3" id="imgProgressCount"></span></div>
      <div class="mt-2 text-[.8rem] text-red" id="uploadErr"></div>
      <div class="mt-3.5 flex flex-col gap-2" id="resultList"></div>
    </div>

    <!-- My Gallery -->
    <div class="panel hidden [&.active]:block" id="panel-gallery-mine">
      <div class="page-header flex flex-wrap items-end gap-3 border-b border-bd mb-6 pb-[18px] md:mb-8 md:gap-4 md:pb-6">
        <div class="min-w-0 flex-1">
          <div class="page-title mb-1.5 text-[1.15rem] font-extrabold tracking-[-.03em] text-tx mob:text-[1.2rem] md:text-[1.375rem]">我的图库</div>
          <div class="text-sm font-medium tracking-[.01em] text-tx-3">管理你上传的所有图片</div>
        </div>
      </div>
      <div class="toolbar flex flex-col items-stretch gap-3 mb-5 md:flex-row md:items-center md:gap-[10px] md:mb-6">
        <input class="search-input w-full max-w-[260px] rounded-sm border border-bd bg-bg-3 px-3 py-2 font-sans text-[.84rem] text-tx outline-none transition focus:border-bd-focus focus:shadow-[0_0_0_3px_var(--color-brand-muted)] mob:max-w-none md:w-[220px]" id="mineSearch" type="text" placeholder="搜索文件名或标签…">
        <select class="search-input w-full max-w-[260px] rounded-sm border border-bd bg-bg-3 px-3 py-2 font-sans text-[.84rem] text-tx outline-none transition focus:border-bd-focus focus:shadow-[0_0_0_3px_var(--color-brand-muted)] mob:max-w-none md:w-[220px] !w-auto cursor-pointer" id="mineVisFilter">
          <option value="all">全部</option>
          <option value="public">仅公开</option>
          <option value="private">仅私密</option>
        </select>
        <select class="search-input w-full max-w-[260px] rounded-sm border border-bd bg-bg-3 px-3 py-2 font-sans text-[.84rem] text-tx outline-none transition focus:border-bd-focus focus:shadow-[0_0_0_3px_var(--color-brand-muted)] mob:max-w-none md:w-[220px] !w-auto cursor-pointer" id="mineSort">
          <option value="new">最新优先</option>
          <option value="old">最早优先</option>
          <option value="big">体积降序</option>
          <option value="name">名称排序</option>
        </select>
        <div class="flex-1"></div>
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="mineSelectToggle">选择</button>
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="trashBtn"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9.5a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9L12 4"/></svg>回收站</button>
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="refreshMine">刷新</button>
      </div>
      <div class="batch-bar flex flex-wrap items-center gap-[10px] mb-3.5 rounded-[9px] border border-bd-2 bg-bg-3 px-[14px] py-[9px]" id="mineBatchBar" style="display:none">
        <label class="flex cursor-pointer items-center gap-1.5 select-none text-[.82rem] text-tx-2"><input type="checkbox" id="mineSelectAll"> 全选</label>
        <span class="font-mono text-[.8rem] text-tx-3" id="mineSelCount">已选 0</span>
        <div class="flex-1"></div>
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="batchPublic">设为公开</button>
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="batchPrivate">设为私密</button>
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-red-r bg-red-g px-3 py-1.5 text-sm font-semibold leading-tight text-red transition hover:bg-red-r" id="batchDelete">删除选中</button>
      </div>
      <div class="flex flex-wrap items-center gap-1.5 mb-3.5" id="mineTagFilter" style="display:none"></div>
      <div class="gallery-grid group/grid grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] md:gap-[18px]" id="mineGrid"></div>
      <div class="p-12 text-center text-[.88rem] font-medium text-tx-3" id="mineEmpty" style="display:none">暂无图片，去上传吧</div>
    </div>

    <!-- Pages -->
    <div class="panel hidden [&.active]:block" id="panel-pages">
      <div class="page-header flex flex-wrap items-end gap-3 border-b border-bd mb-6 pb-[18px] md:mb-8 md:gap-4 md:pb-6">
        <div class="min-w-0 flex-1">
          <div class="page-title mb-1.5 text-[1.15rem] font-extrabold tracking-[-.03em] text-tx mob:text-[1.2rem] md:text-[1.375rem]">我的页面</div>
          <div class="text-sm font-medium tracking-[.01em] text-tx-3">托管的 Markdown / HTML 文档</div>
        </div>
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx max-md:flex-1 !px-[10px] !py-[7px] !text-[.78rem]" id="newProjectBtn">+ 项目</button>
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx max-md:flex-1 !px-[10px] !py-[7px] !text-[.78rem]" id="newGroupBtn">+ 分组</button>
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx max-md:flex-1 !px-[10px] !py-[7px] !text-[.78rem]" id="importPageBtn">导入</button>
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-transparent bg-accent px-3 py-1.5 text-sm font-semibold leading-tight text-tx-inv transition hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(255,255,255,.08)] disabled:cursor-not-allowed disabled:bg-bg-5 disabled:text-tx-3 disabled:shadow-none max-md:flex-1 !px-[14px] !py-[7px] !text-[.82rem]" id="newPageBtn">+ 新建页面</button>
      </div>
      <div class="toolbar flex flex-col items-stretch gap-3 mb-5 md:flex-row md:items-center md:gap-[10px] md:mb-6">
        <input class="search-input w-full max-w-[260px] rounded-sm border border-bd bg-bg-3 px-3 py-2 font-sans text-[.84rem] text-tx outline-none transition focus:border-bd-focus focus:shadow-[0_0_0_3px_var(--color-brand-muted)] mob:max-w-none md:w-[220px]" id="pageSearch" type="text" placeholder="搜索标题或 slug…">
        <select class="search-input w-full max-w-[260px] rounded-sm border border-bd bg-bg-3 px-3 py-2 font-sans text-[.84rem] text-tx outline-none transition focus:border-bd-focus focus:shadow-[0_0_0_3px_var(--color-brand-muted)] mob:max-w-none md:w-[220px] !w-auto cursor-pointer" id="pageProjectFilter">
          <option value="all">全部项目</option>
        </select>
        <div class="flex-1"></div>
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !text-[.78rem]" id="pageSelectToggle">选择</button>
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !text-[.78rem]" id="refreshPages">刷新</button>
      </div>
      <div class="page-batch-bar hidden flex-wrap items-center gap-[10px] mb-3 rounded-md border border-bd-2 bg-bg-3 px-[13px] py-[9px] text-[.82rem] text-tx-2 [&.show]:flex" id="pageBatchBar">
        <label class="flex items-center gap-1.5 cursor-pointer select-none"><input type="checkbox" id="pageSelectAll"> 全选</label>
        <span id="pageSelCount">已选 0</span>
        <div class="flex-1"></div>
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !text-[.78rem]" id="pageBatchMove">移动</button>
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !text-[.78rem]" id="pageBatchPublic">设为公开</button>
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !text-[.78rem]" id="pageBatchPrivate">设为私密</button>
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-red-r bg-red-g px-3 py-1.5 text-sm font-semibold leading-tight text-red transition hover:bg-red-r !text-[.78rem]" id="pageBatchDelete">删除</button>
      </div>
      <div class="pages-tree flex flex-col gap-[14px]" id="pagesTree"></div>
      <div class="p-12 text-center text-[.88rem] font-medium text-tx-3" id="pagesEmpty" style="display:none">暂无页面</div>
    </div>

    <!-- Protos -->
    <div class="panel hidden [&.active]:block" id="panel-protos">
      <div class="page-header flex flex-wrap items-end gap-3 border-b border-bd mb-6 pb-[18px] md:mb-8 md:gap-4 md:pb-6">
        <div class="min-w-0 flex-1">
          <div class="page-title mb-1.5 text-[1.15rem] font-extrabold tracking-[-.03em] text-tx mob:text-[1.2rem] md:text-[1.375rem]">我的原型</div>
          <div class="text-sm font-medium tracking-[.01em] text-tx-3">AxureRP 等静态原型托管 · 支持版本管理与密码保护</div>
        </div>
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx max-md:flex-1 !text-[.8rem]" id="refreshProtos">刷新</button>
      </div>
      <!-- Upload section (collapsible) -->
      <div class="mb-5 overflow-hidden rounded-xl border border-bd bg-bg-3 shadow-[0_1px_0_rgba(255,255,255,.02)_inset]">
        <div class="flex cursor-pointer select-none items-center gap-2 px-4 py-[13px]" id="protoUploadToggle">
          <h3 class="flex-1 text-[.9rem] font-bold text-tx tracking-[-.01em]">上传原型</h3>
          <span class="toggle-icon open text-[.65rem] text-tx-3 transition-transform duration-200 [&.open]:rotate-180" id="protoUploadIcon">▾</span>
        </div>
        <div class="border-t border-bd p-4" id="protoUploadBody">
          <div class="proto-upload-box mb-3.5 cursor-pointer rounded-xl border-[1.5px] border-dashed border-bd-2 bg-white/[.012] px-4 py-7 text-center text-tx-3 transition hover:border-tx-2 hover:bg-white/[.03] hover:text-tx [&.over]:border-tx-2 [&.over]:bg-white/[.03] [&.over]:text-tx" id="protoDropZone">
            <input type="file" id="protoFileInput" accept=".zip,application/zip,application/x-zip-compressed">
            <input class="hidden" type="file" id="protoFolderInput" webkitdirectory multiple>
            <p class="text-tx text-[.9rem] font-medium">点击选择 <strong>ZIP 文件</strong>，或拖拽文件夹到此处</p>
            <small class="block mt-2 text-tx-3 text-[.76rem]">支持 AxureRP 导出目录（自动打包）或 ZIP 文件，最大 50 MB</small>
            <div class="flex gap-2 justify-center mt-3">
              <button class="rounded-md border border-bd-2 bg-bg-3 px-[14px] py-1.5 font-sans text-[.78rem] font-medium text-tx-2 cursor-pointer" type="button" onclick="event.stopPropagation();document.getElementById('protoFileInput').click()">选择 ZIP</button>
              <button class="rounded-md border border-bd-2 bg-bg-3 px-[14px] py-1.5 font-sans text-[.78rem] font-medium text-tx-2 cursor-pointer" type="button" onclick="event.stopPropagation();document.getElementById('protoFolderInput').click()">选择文件夹</button>
            </div>
          </div>
          <div class="flex gap-2.5 mb-2.5">
            <div class="flex flex-1 flex-col gap-[5px]"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">原型名称 <span class="text-tx-3 font-normal normal-case tracking-normal">（可选）</span></label><input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]" type="text" id="protoTitle" placeholder="留空自动命名" maxlength="100"></div>
            <div class="flex w-40 shrink-0 grow-0 flex-col gap-[5px]"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">访问密码（可选）</label><input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]" type="text" id="protoPassword" placeholder="最多 6 位字母数字" maxlength="6" autocomplete="off"></div>
          </div>
          <button class="w-full rounded-md bg-accent px-3 py-[11px] text-base-sm font-bold text-tx-inv transition hover:-translate-y-px hover:bg-accent-hover hover:shadow-[0_8px_24px_rgba(255,255,255,.07)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-bg-5 disabled:text-tx-3 disabled:shadow-none" id="protoUploadBtn" disabled>上传原型</button>
          <div class="progress hidden my-[10px] h-[3px] overflow-hidden rounded-full bg-bg-3 [&.show]:block" id="protoProgress"><div class="progress-bar h-full w-0 bg-accent transition-[width] duration-[.25s]" id="protoProgressBar"></div></div>
          <div class="progress-info hidden items-center gap-[10px] -mt-1 mb-1.5 text-[.76rem] text-tx-2 [&.show]:flex" id="protoProgressInfo"><span class="min-w-[34px] font-mono font-bold text-tx" id="protoProgressPct">0%</span></div>
          <div class="hidden text-[.78rem] text-tx-2 mt-0.5 mb-1 min-h-[1.2em]" id="protoStatusText"></div>
          <div class="mt-2 text-[.8rem] text-red" id="protoErr"></div>
        </div>
      </div>

      <div class="bg-bg-3 border border-bd rounded-[10px] overflow-hidden shadow-[0_1px_0_rgba(255,255,255,.02)_inset]">
        <table class="w-full border-collapse text-[.83rem] [&_td]:border-b [&_td]:border-bd [&_td]:px-[13px] [&_td]:py-[10px] [&_td]:align-middle [&_td]:text-tx [&_tr:last-child_td]:border-b-0 [&_tr:hover_td]:bg-white/[.025]">
          <thead><tr>
            <th class="whitespace-nowrap border-b border-bd-2 bg-black/30 px-[13px] py-[10px] text-left text-[.66rem] font-bold uppercase tracking-[.11em] text-tx-2 w-9 !text-tx-3">#</th><th class="whitespace-nowrap border-b border-bd-2 bg-black/30 px-[13px] py-[10px] text-left text-[.66rem] font-bold uppercase tracking-[.11em] text-tx-2">名称</th><th class="whitespace-nowrap border-b border-bd-2 bg-black/30 px-[13px] py-[10px] text-left text-[.66rem] font-bold uppercase tracking-[.11em] text-tx-2">文件数</th><th class="whitespace-nowrap border-b border-bd-2 bg-black/30 px-[13px] py-[10px] text-left text-[.66rem] font-bold uppercase tracking-[.11em] text-tx-2">大小</th><th class="whitespace-nowrap border-b border-bd-2 bg-black/30 px-[13px] py-[10px] text-left text-[.66rem] font-bold uppercase tracking-[.11em] text-tx-2">密码</th><th class="whitespace-nowrap border-b border-bd-2 bg-black/30 px-[13px] py-[10px] text-left text-[.66rem] font-bold uppercase tracking-[.11em] text-tx-2">版本</th><th class="whitespace-nowrap border-b border-bd-2 bg-black/30 px-[13px] py-[10px] text-left text-[.66rem] font-bold uppercase tracking-[.11em] text-tx-2">访问</th><th class="whitespace-nowrap border-b border-bd-2 bg-black/30 px-[13px] py-[10px] text-left text-[.66rem] font-bold uppercase tracking-[.11em] text-tx-2">上传时间</th><th class="whitespace-nowrap border-b border-bd-2 bg-black/30 px-[13px] py-[10px] text-left text-[.66rem] font-bold uppercase tracking-[.11em] text-tx-2">更新时间</th><th class="whitespace-nowrap border-b border-bd-2 bg-black/30 px-[13px] py-[10px] text-left text-[.66rem] font-bold uppercase tracking-[.11em] text-tx-2"></th>
          </tr></thead>
          <tbody id="protoTableBody"><tr><td class="text-center text-tx-3 p-8" colspan="10">加载中…</td></tr></tbody>
        </table>
      </div>
      <div class="p-12 text-center text-[.88rem] font-medium text-tx-3 mt-3" id="protoEmpty" style="display:none">暂无原型，请上传 ZIP 文件</div>
    </div>
  </main>
  <footer class="border-t border-bd px-[30px] py-[14px] flex items-center gap-[10px] text-[.75rem] text-tx-3 flex-wrap font-medium">
    <span>图片存储于</span>
    <span class="text-[#f97316] font-bold">Cloudflare R2</span>
    <span class="text-bd-2">·</span>
    <span>10 GB 免费存储额度</span>
    <span class="text-bd-2">·</span>
    <span>无出口流量费用</span>
    <span class="text-bd-2">·</span>
    <span>全球 CDN 加速</span>
  </footer>
  </div>
</div>

<!-- Proto Edit Modal -->
<div class="fixed inset-0 z-[60] hidden items-center justify-center bg-overlay p-6 backdrop-blur-[8px] [&.show]:flex" id="protoEditModal">
  <div class="flex w-full max-w-[860px] max-h-[100dvh] flex-col overflow-hidden rounded-t-xl rounded-b-none border border-bd-2 bg-bg-4 shadow md:max-h-[96vh] md:rounded-xl !max-w-[480px]">
    <div class="flex shrink-0 items-center border-b border-bd px-[18px] py-[15px]">
      <h3 class="flex-1 text-[.98rem] font-bold text-tx tracking-[-.01em]" id="protoEditTitle">编辑原型</h3>
      <button class="flex h-7 w-7 items-center justify-center rounded-sm border border-bd bg-bg-5 font-sans text-[.85rem] text-tx-2 transition hover:border-bd-focus hover:text-tx" id="protoEditClose"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg></button>
    </div>
    <div class="modal-body flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-[18px] max-h-[calc(100dvh-140px)] md:max-h-none md:py-[18px] md:px-5">
      <div class="flex flex-col gap-[5px] mb-3.5"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">名称</label><input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]" type="text" id="peTitle" maxlength="100"></div>
      <div class="flex flex-col gap-[5px] mb-3.5">
        <label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">访问密码（留空表示删除密码）</label>
        <input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]" type="text" id="pePassword" placeholder="最多 6 位字母数字" maxlength="6" autocomplete="off">
      </div>
      <div class="flex flex-col gap-[5px] mb-3.5" id="peExpiryField">
        <label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">密码有效期</label>
        <select class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]" style="appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%23888' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px" id="peExpiry">
          <option value="14">14 天</option>
          <option value="30">30 天</option>
          <option value="90">90 天</option>
          <option value="0">永久</option>
        </select>
      </div>
      <div class="flex flex-col gap-[5px] mb-3.5">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" id="pePrivate"> 设为私有（禁止公开访问）
        </label>
      </div>
      <div class="mt-2 text-[.8rem] text-red" id="peErr"></div>
    </div>
    <div class="flex shrink-0 justify-end gap-2 border-t border-bd px-[18px] py-3">
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="protoEditCancel">取消</button>
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-transparent bg-accent px-3 py-1.5 text-sm font-semibold leading-tight text-tx-inv transition hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(255,255,255,.08)] disabled:cursor-not-allowed disabled:bg-bg-5 disabled:text-tx-3 disabled:shadow-none" id="protoEditSave">保存</button>
    </div>
  </div>
</div>

<!-- Proto content update modal -->
<div class="fixed inset-0 z-[60] hidden items-center justify-center bg-overlay p-6 backdrop-blur-[8px] [&.show]:flex" id="protoUpdateModal">
  <div class="flex w-full max-w-[860px] max-h-[100dvh] flex-col overflow-hidden rounded-t-xl rounded-b-none border border-bd-2 bg-bg-4 shadow md:max-h-[96vh] md:rounded-xl !max-w-[520px]">
    <div class="flex shrink-0 items-center border-b border-bd px-[18px] py-[15px]">
      <h3 class="flex-1 text-[.98rem] font-bold text-tx tracking-[-.01em]">更新原型内容</h3>
      <button class="flex h-7 w-7 items-center justify-center rounded-sm border border-bd bg-bg-5 font-sans text-[.85rem] text-tx-2 transition hover:border-bd-focus hover:text-tx" id="protoUpdateClose"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg></button>
    </div>
    <div class="modal-body flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-[18px] max-h-[calc(100dvh-140px)] md:max-h-none md:py-[18px] md:px-5">
      <p class="text-[.82rem] text-tx-3 mb-3.5">上传新版本将替换现有内容，URL 保持不变，版本号自动递增。</p>
      <div class="proto-upload-box mb-3.5 cursor-pointer rounded-xl border-[1.5px] border-dashed border-bd-2 bg-white/[.012] text-center text-tx-3 transition hover:border-tx-2 hover:bg-white/[.03] hover:text-tx [&.over]:border-tx-2 [&.over]:bg-white/[.03] [&.over]:text-tx p-5" id="puDropZone">
        <input class="hidden" type="file" id="puFileInput" accept=".zip,application/zip,application/x-zip-compressed">
        <input class="hidden" type="file" id="puFolderInput" webkitdirectory multiple>
        <p id="puFileName">选择 ZIP 或文件夹</p>
        <div class="flex gap-2 justify-center mt-[10px]">
          <button class="rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-[5px] text-[.78rem] text-[#888] cursor-pointer" type="button" onclick="event.stopPropagation();document.getElementById('puFileInput').click()">选择 ZIP</button>
          <button class="rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-[5px] text-[.78rem] text-[#888] cursor-pointer" type="button" onclick="event.stopPropagation();document.getElementById('puFolderInput').click()">选择文件夹</button>
        </div>
      </div>
      <div class="progress hidden my-[10px] h-[3px] overflow-hidden rounded-full bg-bg-3 [&.show]:block" id="puProgress"><div class="progress-bar h-full w-0 bg-accent transition-[width] duration-[.25s]" id="puProgressBar"></div></div>
      <div class="progress-info hidden items-center gap-[10px] -mt-1 mb-1.5 text-[.76rem] text-tx-2 [&.show]:flex" id="puProgressInfo"><span class="min-w-[34px] font-mono font-bold text-tx" id="puProgressPct">0%</span></div>
      <div class="hidden text-[.78rem] text-tx-2 mt-0.5 mb-1 min-h-[1.2em]" id="puStatusText"></div>
      <div class="mt-2 text-[.8rem] text-red" id="puErr"></div>
    </div>
    <div class="flex shrink-0 justify-end gap-2 border-t border-bd px-[18px] py-3">
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="protoUpdateCancel">取消</button>
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-transparent bg-accent px-3 py-1.5 text-sm font-semibold leading-tight text-tx-inv transition hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(255,255,255,.08)] disabled:cursor-not-allowed disabled:bg-bg-5 disabled:text-tx-3 disabled:shadow-none" id="protoUpdateUpload" disabled>上传新版本</button>
    </div>
  </div>
</div>

<!-- Change Password Modal -->
<div class="fixed inset-0 z-[60] hidden items-center justify-center bg-overlay p-6 backdrop-blur-[8px] [&.show]:flex" id="changePwdModal">
  <div class="flex w-full max-w-[860px] max-h-[100dvh] flex-col overflow-hidden rounded-t-xl rounded-b-none border border-bd-2 bg-bg-4 shadow md:max-h-[96vh] md:rounded-xl !max-w-[380px]">
    <div class="flex shrink-0 items-center border-b border-bd px-[18px] py-[15px]">
      <h3 class="flex-1 text-[.98rem] font-bold text-tx tracking-[-.01em]">修改密码</h3>
      <button class="flex h-7 w-7 items-center justify-center rounded-sm border border-bd bg-bg-5 font-sans text-[.85rem] text-tx-2 transition hover:border-bd-focus hover:text-tx" id="changePwdClose"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg></button>
    </div>
    <div class="modal-body flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-[18px] max-h-[calc(100dvh-140px)] md:max-h-none md:py-[18px] md:px-5">
      <div class="flex flex-col gap-[5px] mb-3.5"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">当前密码</label><input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]" type="password" id="cpCurrent" placeholder="当前密码" autocomplete="current-password"></div>
      <div class="flex flex-col gap-[5px] mb-3.5"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">新密码</label><input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]" type="password" id="cpNew" placeholder="至少 6 位" autocomplete="new-password"></div>
      <div class="flex flex-col gap-[5px] mb-3.5"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">确认新密码</label><input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]" type="password" id="cpConfirm" placeholder="再次输入新密码" autocomplete="new-password"></div>
      <div class="text-[#ef4444] text-[.78rem] min-h-4" id="cpErr"></div>
    </div>
    <div class="flex shrink-0 justify-end gap-2 border-t border-bd px-[18px] py-3">
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="changePwdCancel">取消</button>
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-transparent bg-accent px-3 py-1.5 text-sm font-semibold leading-tight text-tx-inv transition hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(255,255,255,.08)] disabled:cursor-not-allowed disabled:bg-bg-5 disabled:text-tx-3 disabled:shadow-none" id="changePwdSave">确认修改</button>
    </div>
  </div>
</div>

<!-- Proto Version History & Diff Modal (user) -->
<div class="fixed inset-0 z-[60] hidden items-center justify-center bg-overlay p-6 backdrop-blur-[8px] [&.show]:flex" id="userProtoVersionModal">
  <div class="flex w-full max-w-[860px] max-h-[100dvh] flex-col overflow-hidden rounded-t-xl rounded-b-none border border-bd-2 bg-bg-4 shadow md:max-h-[96vh] md:rounded-xl !max-w-[860px] !w-[95vw] !max-h-[85vh] !h-[85vh]">
    <div class="flex shrink-0 items-center border-b border-bd px-[18px] py-[15px]">
      <h3 class="flex-1 text-[.98rem] font-bold text-tx tracking-[-.01em]">版本历史 <span class="text-[.72rem] text-tx-3 font-normal" id="upvmTitle"></span></h3>
      <button class="flex h-7 w-7 items-center justify-center rounded-sm border border-bd bg-bg-5 font-sans text-[.85rem] text-tx-2 transition hover:border-bd-focus hover:text-tx" id="upvmClose"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg></button>
    </div>
    <div class="flex flex-1 min-h-0">
      <div class="w-[200px] shrink-0 border-r border-[#1a1a1a] overflow-y-auto p-[12px_10px] flex flex-col gap-1.5" id="upvmVersionList"></div>
      <div class="flex-1 flex flex-col min-w-0">
        <div class="px-[14px] py-[10px] border-b border-[#1a1a1a] flex items-center gap-2 shrink-0 flex-wrap">
          <span class="text-[.78rem] text-tx-3" id="upvmMode">点击版本号查看文件列表，勾选两个版本进行对比</span>
          <div class="flex-1"></div>
          <input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)] !w-[160px] !px-2 !py-1 !bg-[#111] !border-[#222] !text-[#ccc] !text-[.78rem]" type="text" id="upvmSearch" placeholder="搜索文件…">
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx hidden !px-[10px] !py-1 !text-[.78rem]" id="upvmDiffBtn">对比选中版本</button>
        </div>
        <div class="flex-1 overflow-y-auto px-4 py-[14px]" id="upvmContent">
          <div class="text-tx-3 text-center py-[60px] text-[.85rem]"><svg class="inline-block h-4 w-4 -mt-0.5 mr-1" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="13" y1="8" x2="3" y2="8"/><polyline points="7,4 3,8 7,12"/></svg>点击左侧版本号查看文件列表</div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Lightbox -->
<div class="lightbox fixed inset-0 z-[100] hidden items-center justify-center bg-overlay p-6 [&.show]:flex" id="lightbox">
  <button class="absolute right-[14px] top-[14px] flex h-8 w-8 items-center justify-center rounded-sm border border-bd bg-bg-5 text-[.85rem] text-tx-2 transition hover:border-bd-focus hover:text-tx" id="lbClose"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg></button>
  <button class="absolute left-[14px] top-1/2 z-[101] flex h-[60px] w-10 -translate-y-1/2 items-center justify-center rounded-md border border-bd-2 bg-black/60 text-[1.6rem] text-tx transition hover:border-bd-focus hover:bg-bg-hover" id="lbPrev">‹</button>
  <button class="absolute right-[14px] top-1/2 z-[101] flex h-[60px] w-10 -translate-y-1/2 items-center justify-center rounded-md border border-bd-2 bg-black/60 text-[1.6rem] text-tx transition hover:border-bd-focus hover:bg-bg-hover" id="lbNext">›</button>
  <div class="w-full max-w-[760px] overflow-hidden rounded-xl border border-bd-2 bg-bg-4 shadow">
    <div class="flex min-h-[280px] max-h-[55vh] items-center justify-center bg-bg-2"><img class="max-h-[55vh] max-w-full object-contain" id="lbImg" src="" alt=""></div>
    <div class="px-[18px] py-[14px]">
      <div class="break-all font-mono text-[.85rem] text-tx" id="lbKey"></div>
      <div class="mt-3 flex gap-[7px]">
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="lbCopy">复制链接</button>
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="lbMd">复制 MD</button>
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="lbBbcode">复制 BBCode</button>
        <div class="flex-1"></div>
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-red-r bg-red-g px-3 py-1.5 text-sm font-semibold leading-tight text-red transition hover:bg-red-r" id="lbDelete" style="display:none">删除</button>
      </div>
    </div>
  </div>
</div>

<!-- Page Editor Modal -->
<div class="fixed inset-0 z-[60] hidden items-center justify-center bg-overlay p-6 backdrop-blur-[8px] [&.show]:flex" id="pageModal">
  <div class="flex w-full max-w-[860px]! max-h-[100dvh] md:max-h-[96vh]! md:h-[min(92vh,900px)]! flex-col overflow-hidden rounded-t-xl rounded-b-none border border-bd-2 bg-bg-4 shadow md:max-w-[960px]! md:rounded-xl">
    <div class="flex shrink-0 items-center border-b border-bd px-[18px] py-[15px]">
      <h3 class="flex-1 text-[.98rem] font-bold text-tx tracking-[-.01em]" id="pageModalTitle">新建页面</h3>
      <button class="flex h-7 w-7 items-center justify-center rounded-sm border border-bd bg-bg-5 font-sans text-[.85rem] text-tx-2 transition hover:border-bd-focus hover:text-tx" id="pageModalClose"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg></button>
    </div>
    <div class="modal-body flex min-h-0 flex-1 flex-col gap-3 overflow-hidden! p-[18px] max-h-[calc(100dvh-140px)] md:max-h-none md:py-[18px] md:px-5">
      <div class="flex flex-col gap-[5px] mb-3.5"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">标题</label><input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]" type="text" id="pmTitle" placeholder="My Page"></div>
      <div class="flex flex-col gap-[5px] mb-3.5">
        <label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">自定义后缀（URL）</label>
        <input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]" type="text" id="pmSlug" placeholder="my-blog-post  或  docs/intro">
        <span class="text-[.72rem] text-tx-3 mt-1">访问地址：<span class="text-accent" id="pmSlugPreview"></span></span>
      </div>
      <div class="flex flex-col gap-[5px] mb-3.5">
        <label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">类型</label>
        <select class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]" style="appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%23888' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px" id="pmType">
          <option value="markdown">Markdown</option>
          <option value="html">HTML</option>
        </select>
      </div>
      <div class="flex flex-col gap-[5px] mb-3.5">
        <label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">所属项目</label>
        <select class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]" style="appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%23888' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px" id="pmProject">
          <option value="">-- 无 --</option>
        </select>
      </div>
      <div class="flex flex-col gap-[5px] mb-3.5">
        <label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">所属分组</label>
        <select class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]" style="appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%23888' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px" id="pmGroup">
          <option value="">-- 无 --</option>
        </select>
      </div>
      <div class="flex flex-col gap-[5px] mb-3.5">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" id="pmPublic" checked> 公开访问
        </label>
      </div>
      <div class="flex flex-col gap-[5px] mb-3.5" id="pmPwdSection">
        <label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">访问密码 <span class="text-tx-3 font-normal normal-case tracking-normal">（可选，6 位字母数字）</span></label>
        <div class="flex gap-2 items-center">
          <input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)] !w-[140px] !px-[10px] !py-2 !border-bd-2 font-mono tracking-[.14em] !text-[.92rem]" type="text" id="pmPassword" maxlength="6" autocomplete="off" spellcheck="false"
            placeholder="留空则仅登录可见">
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx whitespace-nowrap shrink-0" type="button" id="pmPwdGen">生成</button>
        </div>
        <span class="text-[.7rem] text-tx-3 mt-1 block">设置后访客可通过密码访问；复制地址时会附带密码</span>
      </div>
      <div class="flex flex-col gap-[5px] mb-3.5 flex-1 min-h-0">
        <label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3" id="pmContentLabel">内容</label>
        <div id="pmVditor" style="display:none"></div>
        <textarea class="w-full flex-1 min-h-[360px] resize-y rounded-md border border-bd-2 bg-bg-2 px-[14px] py-3 font-mono text-[.84rem] leading-[1.7] text-tx" id="pmContent" rows="14" placeholder="# Hello World\n\n写点什么…"></textarea>
      </div>
    </div>
    <div class="flex shrink-0 justify-end gap-2 border-t border-bd px-[18px] py-3">
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="pageModalCancel">取消</button>
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-transparent bg-accent px-3 py-1.5 text-sm font-semibold leading-tight text-tx-inv transition hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(255,255,255,.08)] disabled:cursor-not-allowed disabled:bg-bg-5 disabled:text-tx-3 disabled:shadow-none" id="pageModalSave">创建</button>
    </div>
  </div>
</div>

<!-- Project Modal -->
<div class="fixed inset-0 z-[60] hidden items-center justify-center bg-overlay p-6 backdrop-blur-[8px] [&.show]:flex" id="projectModal">
  <div class="flex w-full max-w-[860px] max-h-[100dvh] flex-col overflow-hidden rounded-t-xl rounded-b-none border border-bd-2 bg-bg-4 shadow md:max-h-[96vh] md:rounded-xl !max-w-[420px]">
    <div class="flex shrink-0 items-center border-b border-bd px-[18px] py-[15px]">
      <h3 class="flex-1 text-[.98rem] font-bold text-tx tracking-[-.01em]" id="projModalTitle">新建项目</h3>
      <button class="flex h-7 w-7 items-center justify-center rounded-sm border border-bd bg-bg-5 font-sans text-[.85rem] text-tx-2 transition hover:border-bd-focus hover:text-tx" id="projModalClose"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg></button>
    </div>
    <div class="modal-body flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-[18px] max-h-[calc(100dvh-140px)] md:max-h-none md:py-[18px] md:px-5">
      <div class="flex flex-col gap-[5px] mb-3.5"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">项目名称</label><input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]" type="text" id="projName" placeholder="我的知识库" maxlength="64"></div>
    </div>
    <div class="flex shrink-0 justify-end gap-2 border-t border-bd px-[18px] py-3">
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="projModalCancel">取消</button>
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-transparent bg-accent px-3 py-1.5 text-sm font-semibold leading-tight text-tx-inv transition hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(255,255,255,.08)] disabled:cursor-not-allowed disabled:bg-bg-5 disabled:text-tx-3 disabled:shadow-none" id="projModalSave">创建</button>
    </div>
  </div>
</div>

<!-- Group Modal -->
<div class="fixed inset-0 z-[60] hidden items-center justify-center bg-overlay p-6 backdrop-blur-[8px] [&.show]:flex" id="groupModal">
  <div class="flex w-full max-w-[860px] max-h-[100dvh] flex-col overflow-hidden rounded-t-xl rounded-b-none border border-bd-2 bg-bg-4 shadow md:max-h-[96vh] md:rounded-xl !max-w-[420px]">
    <div class="flex shrink-0 items-center border-b border-bd px-[18px] py-[15px]">
      <h3 class="flex-1 text-[.98rem] font-bold text-tx tracking-[-.01em]" id="grpModalTitle">新建分组</h3>
      <button class="flex h-7 w-7 items-center justify-center rounded-sm border border-bd bg-bg-5 font-sans text-[.85rem] text-tx-2 transition hover:border-bd-focus hover:text-tx" id="grpModalClose"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg></button>
    </div>
    <div class="modal-body flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-[18px] max-h-[calc(100dvh-140px)] md:max-h-none md:py-[18px] md:px-5">
      <div class="flex flex-col gap-[5px] mb-3.5"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">分组名称</label><input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]" type="text" id="grpName" placeholder="入门指南" maxlength="64"></div>
      <div class="flex flex-col gap-[5px] mb-3.5">
        <label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">所属项目 <span class="text-tx-3 font-normal normal-case">（可选，不选则为独立分组）</span></label>
        <select class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]" style="appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%23888' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px" id="grpProjectId"><option value="">-- 独立分组 --</option></select>
      </div>
    </div>
    <div class="flex shrink-0 justify-end gap-2 border-t border-bd px-[18px] py-3">
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="grpModalCancel">取消</button>
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-transparent bg-accent px-3 py-1.5 text-sm font-semibold leading-tight text-tx-inv transition hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(255,255,255,.08)] disabled:cursor-not-allowed disabled:bg-bg-5 disabled:text-tx-3 disabled:shadow-none" id="grpModalSave">创建</button>
    </div>
  </div>
</div>

<!-- Page batch move modal -->
<div class="fixed inset-0 z-[60] hidden items-center justify-center bg-overlay p-6 backdrop-blur-[8px] [&.show]:flex" id="pageMoveModal">
  <div class="flex w-full max-w-[860px] max-h-[100dvh] flex-col overflow-hidden rounded-t-xl rounded-b-none border border-bd-2 bg-bg-4 shadow md:max-h-[96vh] md:rounded-xl !max-w-[420px]">
    <div class="flex shrink-0 items-center border-b border-bd px-[18px] py-[15px]">
      <h3 class="flex-1 text-[.98rem] font-bold text-tx tracking-[-.01em]">批量移动</h3>
      <button class="flex h-7 w-7 items-center justify-center rounded-sm border border-bd bg-bg-5 font-sans text-[.85rem] text-tx-2 transition hover:border-bd-focus hover:text-tx" id="pageMoveModalClose"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg></button>
    </div>
    <div class="modal-body flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-[18px] max-h-[calc(100dvh-140px)] md:max-h-none md:py-[18px] md:px-5">
      <div class="flex flex-col gap-[5px] mb-3.5">
        <label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">目标项目</label>
        <select class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]" style="appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%23888' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px" id="pageMoveProject"><option value="">-- 无 / 未分类 --</option></select>
      </div>
      <div class="flex flex-col gap-[5px] mb-3.5">
        <label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">目标分组</label>
        <select class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]" style="appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%23888' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px" id="pageMoveGroup"><option value="">-- 无 --</option></select>
      </div>
    </div>
    <div class="flex shrink-0 justify-end gap-2 border-t border-bd px-[18px] py-3">
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="pageMoveModalCancel">取消</button>
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-transparent bg-accent px-3 py-1.5 text-sm font-semibold leading-tight text-tx-inv transition hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(255,255,255,.08)] disabled:cursor-not-allowed disabled:bg-bg-5 disabled:text-tx-3 disabled:shadow-none" id="pageMoveModalSave">移动</button>
    </div>
  </div>
</div>

<!-- Import Markdown / HTML Modal -->
<div class="fixed inset-0 z-[60] hidden items-center justify-center bg-overlay p-6 backdrop-blur-[8px] [&.show]:flex" id="importModal">
  <div class="flex w-full max-w-[860px] max-h-[100dvh] flex-col overflow-hidden rounded-t-xl rounded-b-none border border-bd-2 bg-bg-4 shadow md:max-h-[96vh] md:rounded-xl !max-w-[520px]">
    <div class="flex shrink-0 items-center border-b border-bd px-[18px] py-[15px]">
      <h3 class="flex-1 text-[.98rem] font-bold text-tx tracking-[-.01em]">导入页面</h3>
      <button class="flex h-7 w-7 items-center justify-center rounded-sm border border-bd bg-bg-5 font-sans text-[.85rem] text-tx-2 transition hover:border-bd-focus hover:text-tx" id="importModalClose"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg></button>
    </div>
    <div class="modal-body flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-[18px] max-h-[calc(100dvh-140px)] md:max-h-none md:py-[18px] md:px-5">
      <div class="text-tx-3 transition hover:text-tx p-7 text-center border-2 border-dashed border-bd-2 rounded-[10px] cursor-pointer" id="importDropZone">
        <input class="hidden" type="file" id="importFileInput" accept=".md,.markdown,.html,.htm,text/markdown,text/html">
        <div class="mb-2"><svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h9l5 5v15H6V2z"/><path d="M15 2v5h5"/></svg></div>
        <div class="text-tx-2 text-[.84rem]">点击或拖拽 .md / .html 文件到此处</div>
        <div class="text-tx-3 text-[.72rem] mt-1">支持 YAML frontmatter (title, slug, projectId, groupId, type, isPublic)</div>
      </div>
      <div id="importPreview" style="display:none">
        <div class="flex flex-col gap-[5px] mb-3.5"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">标题</label><input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]" type="text" id="importTitle"></div>
        <div class="flex flex-col gap-[5px] mb-3.5"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">Slug</label><input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]" type="text" id="importSlug"></div>
        <div class="flex flex-col gap-[5px] mb-3.5">
          <label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">类型</label>
          <select class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]" style="appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%23888' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px" id="importType"><option value="markdown">Markdown</option><option value="html">HTML</option></select>
        </div>
        <div class="flex flex-col gap-[5px] mb-3.5">
          <label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">所属项目</label>
          <select class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]" style="appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%23888' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px" id="importProject"><option value="">-- 无 --</option></select>
        </div>
        <div class="flex flex-col gap-[5px] mb-3.5">
          <label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">所属分组</label>
          <select class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]" style="appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%23888' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px" id="importGroup"><option value="">-- 无 --</option></select>
        </div>
        <div class="flex flex-col gap-[5px] mb-3.5">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="importPublic" checked> 公开访问
          </label>
        </div>
      </div>
    </div>
    <div class="flex shrink-0 justify-end gap-2 border-t border-bd px-[18px] py-3">
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="importModalCancel">取消</button>
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-transparent bg-accent px-3 py-1.5 text-sm font-semibold leading-tight text-tx-inv transition hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(255,255,255,.08)] disabled:cursor-not-allowed disabled:bg-bg-5 disabled:text-tx-3 disabled:shadow-none" id="importModalSave" disabled>导入</button>
    </div>
  </div>
</div>

<!-- Tag Editor Modal -->
<div class="fixed inset-0 z-[60] hidden items-center justify-center bg-overlay p-6 backdrop-blur-[8px] [&.show]:flex" id="tagModal">
  <div class="flex w-full max-w-[860px] max-h-[100dvh] flex-col overflow-hidden rounded-t-xl rounded-b-none border border-bd-2 bg-bg-4 shadow md:max-h-[96vh] md:rounded-xl !max-w-[420px]">
    <div class="flex shrink-0 items-center border-b border-bd px-[18px] py-[15px]">
      <h3 class="flex-1 text-[.98rem] font-bold text-tx tracking-[-.01em]">编辑标签 <span class="text-[.72rem] text-tx-3 font-normal" id="tagModalTarget"></span></h3>
      <button class="flex h-7 w-7 items-center justify-center rounded-sm border border-bd bg-bg-5 font-sans text-[.85rem] text-tx-2 transition hover:border-bd-focus hover:text-tx" id="tagModalClose"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg></button>
    </div>
    <div class="modal-body flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-[18px] max-h-[calc(100dvh-140px)] md:max-h-none md:py-[18px] md:px-5">
      <div class="flex flex-wrap gap-1.5 mb-[10px] min-h-[28px]" id="tagEditList"></div>
      <div class="flex flex-col gap-[5px] mb-3.5">
        <label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">添加标签（回车确认，最多 10 个）</label>
        <input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]" type="text" id="tagInput" placeholder="输入标签后按回车" maxlength="24" autocomplete="off">
      </div>
      <div class="mt-2 text-[.8rem] text-red" id="tagErr"></div>
    </div>
    <div class="flex shrink-0 justify-end gap-2 border-t border-bd px-[18px] py-3">
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="tagModalCancel">取消</button>
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-transparent bg-accent px-3 py-1.5 text-sm font-semibold leading-tight text-tx-inv transition hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(255,255,255,.08)] disabled:cursor-not-allowed disabled:bg-bg-5 disabled:text-tx-3 disabled:shadow-none" id="tagModalSave">保存</button>
    </div>
  </div>
</div>

<!-- Trash / Recycle Bin Modal -->
<div class="fixed inset-0 z-[60] hidden items-center justify-center bg-overlay p-6 backdrop-blur-[8px] [&.show]:flex" id="trashModal">
  <div class="flex w-full max-w-[860px] max-h-[100dvh] flex-col overflow-hidden rounded-t-xl rounded-b-none border border-bd-2 bg-bg-4 shadow md:max-h-[96vh] md:rounded-xl !max-w-[760px] !w-[92vw] !max-h-[86vh]">
    <div class="flex shrink-0 items-center border-b border-bd px-[18px] py-[15px]">
      <h3 class="flex-1 text-[.98rem] font-bold text-tx tracking-[-.01em]">回收站 <span class="text-[.72rem] text-tx-3 font-normal">删除项保留 30 天，到期自动清除</span></h3>
      <button class="flex h-7 w-7 items-center justify-center rounded-sm border border-bd bg-bg-5 font-sans text-[.85rem] text-tx-2 transition hover:border-bd-focus hover:text-tx" id="trashClose"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg></button>
    </div>
    <div class="modal-body flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-[18px] max-h-[calc(100dvh-140px)] md:max-h-none md:py-[18px] md:px-5 !min-h-[200px]" id="trashBody"><div class="p-12 text-center text-[.88rem] font-medium text-tx-3">加载中…</div></div>
  </div>
</div>

<div class="toast fixed bottom-6 left-1/2 z-[300] -translate-x-1/2 translate-y-20 whitespace-nowrap rounded-md border border-bd-2 bg-bg-3 px-[18px] py-[9px] font-sans text-sm font-medium text-tx shadow-sm transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] [&.show]:translate-y-0 [&.t-success]:border-green-r [&.t-success]:bg-green-g [&.t-success]:text-green [&.t-warn]:border-amber-r [&.t-warn]:bg-amber-g [&.t-warn]:text-amber [&.t-error]:border-red-r [&.t-error]:bg-red-g [&.t-error]:text-red" id="toast"></div>

<script>
  // Tailwind utility-class constants for elements whose className is fully
  // reassigned at runtime (className=, not classList.add) — declared once
  // here so they survive every reassignment site.
  const UD_PERM_BASE = 'rounded-xs px-[7px] py-0.5 text-[.66rem] font-semibold';
  const UD_PERM_ON = UD_PERM_BASE + ' border border-green-r bg-green-g text-green';
  const UD_PERM_OFF = UD_PERM_BASE + ' border border-bd bg-[rgba(255,255,255,.04)] text-tx-3';
  const UD_PERM_ADMIN = UD_PERM_BASE + ' border border-brand-ring bg-brand-muted text-tx-a';
  const UD_ACTION = 'flex w-full items-center gap-2 border-none bg-transparent px-[14px] py-[10px] text-left font-sans text-[.82rem] font-medium text-tx-2 transition hover:bg-bg-hover hover:text-tx';
  const UD_ACTION_DANGER = 'flex w-full items-center gap-2 border-none bg-transparent px-[14px] py-[10px] text-left font-sans text-[.82rem] font-medium text-tx-2 transition hover:bg-red-g hover:text-red';
  const BTN_PUBLIC = 'rounded-full border border-green-r bg-green-g px-[9px] py-[3px] text-xs font-semibold text-green cursor-pointer min-h-0';
  const BTN_PRIVATE = 'rounded-full border border-bd bg-brand-muted px-[9px] py-[3px] text-xs font-semibold text-tx-3 cursor-pointer min-h-0';
  const TOAST_BASE = 'fixed bottom-6 left-1/2 z-[300] -translate-x-1/2 translate-y-20 whitespace-nowrap rounded-md border border-bd-2 bg-bg-3 px-[18px] py-[9px] font-sans text-sm font-medium text-tx shadow-sm transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] [&.show]:translate-y-0 [&.t-success]:border-green-r [&.t-success]:bg-green-g [&.t-success]:text-green [&.t-warn]:border-amber-r [&.t-warn]:bg-amber-g [&.t-warn]:text-amber [&.t-error]:border-red-r [&.t-error]:bg-red-g [&.t-error]:text-red';
  // Ghost/primary button pairs for buttons whose whole className is swapped at runtime
  // (classList.toggle('btn-primary', ...) no longer has CSS behind it — swap the full string instead).
  const BTN_GHOST_TOGGLE = 'inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx';
  const BTN_PRIMARY_TOGGLE = 'inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-transparent bg-accent px-3 py-1.5 text-sm font-semibold leading-tight text-tx-inv transition hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(255,255,255,.08)] disabled:cursor-not-allowed disabled:bg-bg-5 disabled:text-tx-3 disabled:shadow-none';
  const ICON_EYE = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>';
  const ICON_EYE_OFF = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 2l12 12"/><path d="M6.6 3.4C7 3.3 7.5 3 8 3c4.5 0 7 5 7 5a13 13 0 0 1-2.3 3M4.2 4.2A13 13 0 0 0 1 8s2.5 5 7 5c1 0 1.9-.2 2.7-.6M6.2 6.2a2 2 0 0 0 2.6 2.6"/></svg>';

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
      // server createToken stores exp as ms timestamp
      if (payload.exp && Date.now() > payload.exp) {
        localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(PERM_KEY);
        localStorage.removeItem(USER_KEY); localStorage.removeItem(ADMIN_KEY);
        token = null; perms = null; username = null; isAdminUser = false;
      }
    } catch {}
  })();

  function authH() { return { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }; }

  // ── Vditor editor management ──────────────────────────────────────────────
  let vditorGen = 0;
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
    const gen = ++vditorGen;
    const seed = () => {
      const ta = document.getElementById('pmContent');
      // Prefer textarea value (user may have typed while CDN loads) over call-time content
      if (ta && ta.value) return ta.value;
      return content || '';
    };
    const ok = await ensureVditor();
    if (gen !== vditorGen) return;
    if (!ok || !window.Vditor) {
      const ta = document.getElementById('pmContent');
      ta.value = seed(); ta.style.display = '';
      return;
    }
    if (vditorInst) {
      if (gen !== vditorGen) return;
      vditorInst.setValue(seed());
      return;
    }

    const box = document.getElementById('pmVditor');
    box.style.display = 'flex';
    document.getElementById('pmContent').style.display = 'none';

    const finalContent = seed();
    // Fill remaining modal height; fallback if layout not ready
    const modalBody = box.closest('.modal-body');
    let editorH = 420;
    if (modalBody) {
      const used = Array.from(modalBody.children).reduce((sum, el) => {
        if (el === box.parentElement) return sum;
        return sum + el.getBoundingClientRect().height + 12;
      }, 0);
      editorH = Math.max(320, Math.min(640, modalBody.clientHeight - used - 28));
    } else {
      editorH = Math.min(560, Math.max(360, window.innerHeight - 320));
    }

    vditorInst = new Vditor('pmVditor', {
      height: editorH,
      mode: 'sv',        // split view: source | preview — easier for long docs
      theme: 'dark',
      lang: 'zh_CN',
      cdn: 'https://cdn.jsdelivr.net/npm/vditor',
      cache: { enable: false },
      value: finalContent,
      outline: { enable: false },
      preview: {
        theme: { current: 'dark' },
        hljs: { style: 'native', lineNumber: false },
        markdown: { toc: false, mark: true },
      },
      counter: { enable: true, type: 'text' },
      tab: '  ',
      toolbar: [
        'headings', 'bold', 'italic', 'strike', '|',
        'list', 'ordered-list', 'check', 'outdent', 'indent', '|',
        'quote', 'line', 'code', 'inline-code', 'insert-before', 'insert-after', '|',
        'link', 'table', 'upload', '|',
        'undo', 'redo', '|',
        'fullscreen', 'edit-mode',
      ],
      toolbarConfig: { pin: true },
      upload: {
        url: '/upload',
        fieldName: 'file',
        headers: token ? { Authorization: 'Bearer ' + token } : {},
        accept: 'image/*',
        multiple: false,
        filename: name => name.replace(/[^\w一-龥.\-]/g, '_'),
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
        if (gen !== vditorGen) return;
        // Recalculate height after modal paint
        try {
          const h = Math.max(320, box.clientHeight || editorH);
          if (vditorInst && typeof vditorInst.setTheme === 'function') {
            // keep dark theme consistent with product shell
          }
          window.dispatchEvent(new Event('resize'));
          vditorInst && vditorInst.focus();
        } catch {}

        // Keep wheel scrolling inside editor
        box.addEventListener('wheel', function(e) {
          const scroller = box.querySelector('.vditor-content') || box.querySelector('.vditor-sv') || box;
          if (!scroller) return;
          const atTop    = scroller.scrollTop === 0 && e.deltaY < 0;
          const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1 && e.deltaY > 0;
          if (!atTop && !atBottom) e.stopPropagation();
        }, { passive: true });
      },
    });
  }

  function destroyVditor() {
    vditorGen++; // cancel any in-flight init
    if (vditorInst) { try { vditorInst.destroy(); } catch {} vditorInst = null; }
    const box = document.getElementById('pmVditor');
    if (box) { box.style.display = 'none'; box.innerHTML = ''; }
    document.getElementById('pmContent').style.display = '';
  }

  function switchEditorToType(type, keepContent) {
    if (type === 'markdown') {
      // write current content into textarea so async init can seed from it
      const ta = document.getElementById('pmContent');
      if (ta) ta.value = keepContent || '';
      initVditor(keepContent || '');
    } else {
      const prev = vditorInst ? vditorInst.getValue() : keepContent;
      destroyVditor();
      document.getElementById('pmContent').value = prev || keepContent || '';
      document.getElementById('pmContent').style.display = '';
    }
  }

  function genPagePwd() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const arr = crypto.getRandomValues(new Uint8Array(6));
    return Array.from(arr, b => chars[b % chars.length]).join('');
  }
  function syncPmPwdSection() {
    const pub = document.getElementById('pmPublic')?.checked;
    const sec = document.getElementById('pmPwdSection');
    if (!sec) return;
    if (pub) sec.classList.remove('show');
    else sec.classList.add('show');
  }
  function pageCopyText(p) {
    const url = location.origin + '/p/' + p.slug;
    if (!p.isPublic && p.accessPassword) {
      return '内容：' + url + '\\n密码：' + p.accessPassword;
    }
    return url;
  }
  function pagePreviewUrl(p) {
    const url = location.origin + '/p/' + p.slug;
    if (!p.isPublic && p.accessPassword) return url + '?pwd=' + encodeURIComponent(p.accessPassword);
    return url;
  }
  window.cpPageAddr = function(slug, btn) {
    const p = userPages.find(x => x.slug === slug);
    if (!p) return;
    const text = pageCopyText(p);
    cp(text, btn);
    toast(p.accessPassword ? '已复制地址与密码' : '已复制地址');
  };

  // Boot
  updateUserArea();
  loadPublicGallery();
  if (token) loadQuota();

  function buildPermBadges() {
    if (!perms) return '';
    if (isAdminUser) return \`<span class="\${UD_PERM_ADMIN}">超级管理员</span>\`;
    const badges = [];
    badges.push(perms.canUpload
      ? \`<span class="\${UD_PERM_ON}">允许上传</span>\`
      : \`<span class="\${UD_PERM_OFF}">禁止上传</span>\`);
    if (perms.canDelete) badges.push(\`<span class="\${UD_PERM_ON}">允许删除</span>\`);
    if (perms.canEdit)   badges.push(\`<span class="\${UD_PERM_ON}">允许编辑</span>\`);
    const dl = perms.dailyUploadLimit  === -1 ? '∞' : perms.dailyUploadLimit;
    const tl = perms.maxTotalUploads   === -1 ? '∞' : perms.maxTotalUploads;
    badges.push(\`<span class="\${UD_PERM_OFF}">每日 \${dl}</span>\`);
    badges.push(\`<span class="\${UD_PERM_OFF}">总量 \${tl}</span>\`);
    return badges.join('');
  }

  function updateUserArea() {
    const el = document.getElementById('userArea');
    if (token) {
      el.innerHTML = \`
        <div class="user-chip flex cursor-pointer select-none items-center gap-[9px] rounded-md border border-bd bg-bg-3 px-[10px] py-2 transition hover:border-bd-2 hover:bg-bg-4" id="userChip">
          <div class="h-[7px] w-[7px] shrink-0 rounded-full bg-green shadow-[0_0_6px_rgba(52,211,153,.5)]"></div>
          <span class="flex-1 min-w-0 truncate text-[.82rem] font-semibold text-tx">\${username}</span>
          <span class="shrink-0 text-[.65rem] text-tx-3 transition-transform duration-150 [.user-chip.open_&]:rotate-180">▾</span>
        </div>
        <div class="user-dropdown absolute inset-x-2 bottom-[calc(100%+6px)] z-[100] hidden overflow-hidden rounded-lg border border-bd-2 bg-bg-3 shadow-sm [&.show]:block" id="userDropdown">
          <div class="border-b border-bd px-[14px] pt-3 pb-[10px]">
            <div class="text-[.88rem] font-bold text-tx">\${username}</div>
            <div class="mt-0.5 text-[.7rem] font-medium text-tx-2">\${isAdminUser ? '管理员' : '普通用户'}</div>
          </div>
          <div class="flex flex-wrap gap-[5px] border-b border-bd px-[14px] py-[10px]">\${buildPermBadges()}</div>
          \${!isAdminUser ? \`<button class="\${UD_ACTION}" id="changePwdBtn"><svg class="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="5" r="3.2"/><path d="M7.2 7.2 14 14M11 11l1.5-1.5M13 13l1.5-1.5"/></svg>修改密码</button>\` : ''}
          <button class="\${UD_ACTION_DANGER}" id="logoutBtn">退出登录</button>
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
      el.innerHTML = \`<button class="w-full rounded-md border border-bd-2 bg-bg-3 px-3 py-[9px] text-center text-[.85rem] font-semibold text-tx transition hover:border-bd-focus hover:bg-bg-4" id="loginTrigger">登录</button>\`;
      document.getElementById('loginTrigger').addEventListener('click', openLoginOverlay);
      document.getElementById('uploadBtn').disabled = true;
    }
    document.getElementById('footerAdmin').innerHTML = isAdminUser
      ? \`<a href="/admin" class="flex items-center gap-[9px] rounded-sm px-[10px] py-2 text-[.82rem] font-medium text-tx-2 no-underline transition hover:bg-bg-hover hover:text-tx max-md:min-h-[44px]"><span class="flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:h-[15px] [&_svg]:w-[15px]"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M12.95 3.05l-1.41 1.41M4.46 11.54l-1.41 1.41"/></svg></span><span>Admin Panel</span><span class="ml-auto text-tx-3"><svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="12" y2="4"/><polyline points="5,4 12,4 12,11"/></svg></span></a>\`
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
    document.getElementById('protoTableBody').innerHTML = '<tr><td class="text-center text-tx-3 p-8" colspan="10">加载中…</td></tr>';
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
    if (inp.type === 'password') { inp.type = 'text'; tog.innerHTML = ICON_EYE_OFF; } else { inp.type = 'password'; tog.innerHTML = ICON_EYE; }
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
      const remember = document.getElementById('loginRemember').checked;
      const res = await fetch('/auth/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({username:u,password:p,remember}) });
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
      r.className = 'absolute h-[60px] w-[60px] rounded-full bg-white/[.08] pointer-events-none [transform:translate(-50%,-50%)_scale(0)] animate-[navRipple_.55s_ease-out_forwards]';
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
      \`<div class="pub-item cursor-pointer overflow-hidden rounded-lg border border-bd bg-bg-3 shadow-[0_1px_0_rgba(255,255,255,.02)_inset] transition hover:-translate-y-0.5 hover:border-bd-2 hover:shadow-[0_6px_24px_rgba(0,0,0,.5)]" onclick="openLb('\${item.key}', false, 'pub')">
        <img class="block h-auto w-full aspect-square bg-bg-2 object-cover" src="\${location.origin}/\${item.key}" loading="lazy" onload="this.classList.add('loaded')">
        <div class="pub-item-info px-3 py-2 font-mono text-[.74rem] font-medium text-tx-2">@\${item.owner || '—'}</div>
      </div>\`
    ).join('');
  }
  document.getElementById('refreshPub').addEventListener('click', loadPublicGallery);

  // ── Upload ──
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  let pendingFiles = [];
  let uploadBusy = false;
  dropZone.addEventListener('click', () => { if (!token) { openLoginOverlay(); return; } if (uploadBusy) return; fileInput.click(); });
  dropZone.addEventListener('dragover', e => { e.preventDefault(); if (!uploadBusy) dropZone.classList.add('over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault(); dropZone.classList.remove('over');
    if (uploadBusy) return;
    appendFiles([...e.dataTransfer.files].filter(f => f.type.startsWith('image/')));
  });
  fileInput.addEventListener('change', () => {
    if (uploadBusy) { fileInput.value = ''; return; }
    appendFiles([...fileInput.files]);
    fileInput.value = '';
  });

  function fmtShortSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }
  function renderUploadQueue() {
    const q = document.getElementById('uploadQueue');
    const hint = document.getElementById('dropZoneHint');
    if (!pendingFiles.length) {
      q.classList.remove('show'); q.innerHTML = '';
      if (hint) hint.textContent = '点击或拖拽图片上传';
      document.getElementById('uploadBtn').disabled = true;
      return;
    }
    if (hint) hint.textContent = '已选 ' + pendingFiles.length + ' 张，可继续添加';
    q.classList.add('show');
    q.innerHTML = pendingFiles.map((f, i) =>
      '<div class="flex items-center gap-2 rounded-sm border border-bd bg-bg-3 px-[10px] py-[7px] text-[.78rem] text-tx-2"><span class="uq-name min-w-0 flex-1 truncate" title="' + esc(f.name) + '">' + esc(f.name) +
      '</span><span class="shrink-0 text-tx-3">' + fmtShortSize(f.size) +
      '</span><button type="button" class="uq-rm border-none bg-transparent px-1 text-[.9rem] leading-none text-tx-3 cursor-pointer hover:text-red" data-idx="' + i + '" title="移除">×</button></div>'
    ).join('');
    q.querySelectorAll('.uq-rm').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (uploadBusy) return;
        const idx = parseInt(btn.dataset.idx, 10);
        pendingFiles.splice(idx, 1);
        renderUploadQueue();
      });
    });
    document.getElementById('uploadBtn').disabled = !token || uploadBusy;
  }
  function appendFiles(files) {
    if (!files || !files.length) return;
    pendingFiles = pendingFiles.concat(files);
    renderUploadQueue();
  }
  function clearFiles() {
    pendingFiles = [];
    renderUploadQueue();
  }

  // Paste-to-upload: capture screenshots from clipboard (Ctrl/Cmd+V)
  document.addEventListener('paste', e => {
    // Don't hijack paste inside text fields or the Vditor editor
    const ae = document.activeElement;
    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable || ae.closest?.('.vditor'))) return;
    if (uploadBusy) return;
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
    appendFiles(imgs);
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
      return \`<div class="result-item flex items-center gap-3 rounded-lg border border-bd bg-bg-3 px-[14px] py-[10px]"><img class="h-11 w-11 rounded-xs border border-bd object-cover" src="\${r.url}" loading="lazy"><div class="min-w-0 flex-1"><div class="text-[.8rem] font-medium text-tx">\${esc(r.name)}</div><div class="mt-1 flex gap-[5px]"><input class="min-w-0 flex-1 rounded-xs border border-bd bg-bg-2 px-2 py-[3px] font-mono text-xs text-tx outline-none" value="\${r.url}" readonly onclick="this.select()"><button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !px-2 !py-[3px]" onclick="cp('\${r.url}',this)">复制</button><button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !px-2 !py-[3px]" onclick="cp('![](\${r.url})',this)">MD</button><button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !px-2 !py-[3px]" onclick="cp('[img]\${r.url}[/img]',this)">BB</button></div></div></div>\`;
    }
    const fid = 'f' + (++uploadFidSeq);
    if (r.file) uploadFailMap.set(fid, r.file);
    const retryBtn = r.file ? \`<button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !px-[10px] !py-[3px] shrink-0" onclick="retryUpload('\${fid}', this)">重试</button>\` : '';
    return \`<div class="result-item flex items-center gap-3 rounded-lg border border-bd bg-bg-3 px-[14px] py-[10px]" data-fid="\${fid}"><div class="min-w-0 flex-1"><div class="flex items-center gap-1.5 text-[.8rem] font-medium text-red"><svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>\${esc(r.name)}: \${esc(r.error)}</div></div>\${retryBtn}</div>\`;
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
    if (!token || !pendingFiles.length || uploadBusy) return;
    const queue = pendingFiles.slice();
    uploadBusy = true;
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
    const total = queue.length;
    const results = [];

    for (let i = 0; i < total; i++) {
      const file = queue[i];
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
    uploadBusy = false;
    clearFiles();
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
    const TAG_FILTER_CLS = 'tag-filter rounded-xl border border-bd bg-bg-3 px-[11px] py-[3px] font-sans text-[.72rem] font-semibold text-tx-2 transition hover:border-bd-2 hover:text-tx [&.active]:border-bd-focus [&.active]:bg-white/10 [&.active]:text-tx';
    bar.innerHTML = '<span class="mr-0.5 text-[.68rem] font-bold uppercase tracking-[.1em] text-tx-3">标签</span>' +
      tags.map(t => \`<button class="\${TAG_FILTER_CLS}\${mineTagFilter.has(t)?' active':''}" onclick="toggleTagFilter('\${esc(t)}')">\${esc(t)}</button>\`).join('') +
      (mineTagFilter.size ? \`<button class="\${TAG_FILTER_CLS} !text-red" onclick="clearTagFilter()">清除</button>\` : '');
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
      const tagsHtml = tags.length ? \`<div class="mt-1.5 flex flex-wrap gap-1">\${tags.map(t => \`<span class="whitespace-nowrap rounded-lg border border-bd bg-white/5 px-[7px] py-px text-[.64rem] font-semibold text-tx-2">\${esc(t)}</span>\`).join('')}</div>\` : '';
      return \`<div class="gitem\${sel?' selected':''} relative overflow-hidden rounded-lg border border-transparent bg-bg-3 shadow-[0_0_0_1px_var(--color-bd)] transition hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_var(--color-bd-2),0_12px_32px_rgba(0,0,0,.35)] [&.selected]:border-tx-2 [&.selected]:shadow-[0_0_0_2px_var(--color-tx-2)_inset]" data-key="\${item.key}">
        <input type="checkbox" class="gitem-sel absolute left-2 top-2 z-[3] hidden h-5 w-5 cursor-pointer accent-accent group-[.selecting]/grid:block" \${sel?'checked':''} onchange="toggleSel('\${item.key}')">
        <img class="block h-auto w-full aspect-square cursor-pointer bg-bg-2 object-cover" src="\${url}" loading="lazy" onload="this.classList.add('loaded')" \${clickAttr}>
        <div class="px-[11px] py-[9px]">
          <div class="truncate font-mono text-[.72rem] font-medium text-tx-2">\${item.key}</div>
          \${tagsHtml}
          <div class="mt-[5px] flex items-center justify-between">
            <button class="\${item.isPublic?BTN_PUBLIC:BTN_PRIVATE}" id="vis-\${item.key}" onclick="toggleVis('\${item.key}', this)">\${item.isPublic?'公开':'私密'}</button>
            <span class="text-[.68rem] text-tx-3">\${fmtSize(item.size)}</span>
          </div>
          <div class="mt-1.5 flex gap-1">
            <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !px-2 !py-[3px]" onclick="cp('\${url}',this)">复制</button>
            <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !px-2 !py-[3px]" onclick="openTagEditor('\${item.key}')">标签</button>
            \${perms?.canDelete?\`<button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-red-r bg-red-g px-3 py-1.5 text-sm font-semibold leading-tight text-red transition hover:bg-red-r !px-2 !py-[3px]" onclick="delMine('\${item.key}')">删除</button>\`:''}
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
    document.getElementById('mineSelectToggle').className = mineSelectMode ? BTN_PRIMARY_TOGGLE : BTN_GHOST_TOGGLE;
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
    btn.className = isPublic ? BTN_PUBLIC : BTN_PRIVATE;
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
    body.innerHTML = '<div class="p-12 text-center text-[.88rem] font-medium text-tx-3">加载中…</div>';
    try {
      const res = await fetch('/api/trash', { headers: { Authorization: 'Bearer ' + token } });
      if (!res.ok) { body.innerHTML = '<div class="p-12 text-center text-[.88rem] font-medium text-tx-3">加载失败</div>'; return; }
      trashData = await res.json();
      renderTrash();
    } catch { body.innerHTML = '<div class="p-12 text-center text-[.88rem] font-medium text-tx-3">加载失败</div>'; }
  }
  function trashDaysLeft(deletedAt, days) {
    const left = Math.ceil((deletedAt + days * 86400000 - Date.now()) / 86400000);
    return left > 0 ? left + ' 天后清除' : '即将清除';
  }
  function renderTrash() {
    const body = document.getElementById('trashBody');
    const { images = [], protos = [], retentionDays = 30 } = trashData || {};
    if (!images.length && !protos.length) { body.innerHTML = '<div class="p-12 text-center text-[.88rem] font-medium text-tx-3">回收站为空</div>'; return; }
    let html = '';
    if (images.length) {
      html += '<div class="text-[.72rem] font-bold text-tx-2 uppercase tracking-[.1em] mt-1 mb-[10px]">图片 (' + images.length + ')</div>';
      html += '<div class="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] md:gap-[18px] mb-[18px]">' + images.map(it => {
        const url = location.origin + '/' + it.key;
        return '<div class="gitem relative overflow-hidden rounded-lg border border-transparent bg-bg-3 shadow-[0_0_0_1px_var(--color-bd)] transition hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_var(--color-bd-2),0_12px_32px_rgba(0,0,0,.35)]"><img class="block h-auto w-full aspect-square cursor-pointer bg-bg-2 object-cover" src="' + url + '" loading="lazy" onload="this.classList.add(\\'loaded\\')">' +
          '<div class="px-[11px] py-[9px]"><div class="truncate font-mono text-[.72rem] font-medium text-tx-2">' + esc(it.key) + '</div>' +
          '<div class="text-[.66rem] text-tx-3 mt-[3px]">' + trashDaysLeft(it.deletedAt, retentionDays) + '</div>' +
          '<div class="mt-1.5 flex gap-1"><button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !px-2 !py-[3px]" onclick="restoreTrash(\\'image\\',\\'' + encodeURIComponent(it.key) + '\\')">恢复</button>' +
          '<button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-red-r bg-red-g px-3 py-1.5 text-sm font-semibold leading-tight text-red transition hover:bg-red-r !px-2 !py-[3px]" onclick="purgeTrash(\\'image\\',\\'' + encodeURIComponent(it.key) + '\\')">彻底删除</button></div></div></div>';
      }).join('') + '</div>';
    }
    if (protos.length) {
      html += '<div class="text-[.72rem] font-bold text-tx-2 uppercase tracking-[.1em] mt-1 mb-[10px]">原型 (' + protos.length + ')</div>';
      html += '<div class="flex flex-col gap-2">' + protos.map(p =>
        '<div class="flex items-center gap-[14px] rounded-lg border border-bd bg-bg-3 px-4 py-[14px] transition hover:border-bd-2 hover:bg-bg-4"><div class="min-w-0 flex-1"><div class="text-[.92rem] font-semibold text-tx">' + esc(p.title || p.protoId) + '</div>' +
        '<div class="mt-[3px] text-[.72rem] font-medium text-tx-3">' + (p.fileCount ?? '—') + ' 文件 · ' + fmtSize(p.totalSize || 0) + ' · ' + trashDaysLeft(p.deletedAt, retentionDays) + '</div></div>' +
        '<button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" onclick="restoreTrash(\\'proto\\',\\'' + esc(p.protoId) + '\\')">恢复</button>' +
        '<button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-red-r bg-red-g px-3 py-1.5 text-sm font-semibold leading-tight text-red transition hover:bg-red-r" onclick="purgeTrash(\\'proto\\',\\'' + esc(p.protoId) + '\\')">彻底删除</button></div>'
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
      ? tagDraft.map((t, i) => \`<span class="inline-flex items-center gap-[5px] rounded-xl border border-bd-2 bg-white/[.06] py-[3px] pr-1.5 pl-[10px] text-[.76rem] font-semibold text-tx">\${esc(t)}<button class="border-none bg-transparent p-0 text-[.9rem] leading-none text-tx-3 cursor-pointer hover:text-red" onclick="removeTagDraft(\${i})" title="移除">×</button></span>\`).join('')
      : '<span class="text-tx-3 text-[.76rem]">暂无标签</span>';
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
  let pageSelectMode = false;
  const pageSelected = new Set();

  function renderPageTree() {
    const q = (document.getElementById('pageSearch')?.value || '').toLowerCase();
    const projFilter = document.getElementById('pageProjectFilter')?.value || 'all';
    const pages = userPages.filter(p => {
      if (q && !p.title.toLowerCase().includes(q) && !p.slug.toLowerCase().includes(q)) return false;
      if (projFilter === '_none_') return !p.projectId && !p.groupId;
      if (projFilter !== 'all') return p.projectId === projFilter;
      return true;
    });
    const projects = [...userProjects].sort((a,b) => (a.sort??0) - (b.sort??0));
    const groups = [...userGroups].sort((a,b) => (a.sort??0) - (b.sort??0));
    const independentGroups = groups.filter(g => !g.projectId);

    // drop stale selections
    for (const s of [...pageSelected]) {
      if (!userPages.some(p => p.slug === s)) pageSelected.delete(s);
    }

    const hasAnything = pages.length || projects.length || independentGroups.length;
    document.getElementById('pagesEmpty').style.display = hasAnything ? 'none' : 'block';
    let html = '';

    // projects
    for (const proj of projects) {
      if (projFilter !== 'all' && projFilter !== proj.id) continue;
      const projGroups = groups.filter(g => g.projectId === proj.id);
      const projPages = pages.filter(p => p.projectId === proj.id && !p.groupId).sort((a,b) => (a.sort??0) - (b.sort??0));
      const total = pages.filter(p => p.projectId === proj.id).length;
      html += \`<div class="page-project overflow-hidden rounded-lg border border-bd bg-bg-3 [&.drag-over-proj]:border-accent" data-drag-type="project" data-drag-id="\${esc(proj.id)}">
        <div class="page-project-header flex cursor-pointer select-none items-center gap-[10px] px-4 py-[14px] hover:bg-bg-4" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none';this.querySelector('.expand-icon').classList.toggle('open')">
          <span class="expand-icon open w-[14px] shrink-0 text-center text-[.6rem] text-tx-3 transition-transform duration-150 [&.open]:rotate-90">▶</span>
          <span class="project-name flex-1 text-[.88rem] font-semibold text-tx">\${esc(proj.name)}</span>
          <span class="count-badge rounded-xs bg-bg-5 px-[7px] py-0.5 text-[.66rem] font-semibold text-tx-3">\${total}</span>
          <span class="proj-actions ml-1.5 flex gap-[3px]">
            <button class="proj-act-btn cursor-pointer rounded-xs border border-transparent bg-transparent px-2 py-[3px] text-[.74rem] text-tx-3 transition hover:border-bd hover:bg-bg-5 hover:text-tx" onclick="event.stopPropagation();editProject('\${esc(proj.id)}')" title="编辑项目">编辑</button>
            <button class="proj-act-btn cursor-pointer rounded-xs border border-transparent bg-transparent px-2 py-[3px] text-[.74rem] text-tx-3 transition hover:border-bd hover:bg-bg-5 hover:text-tx" onclick="event.stopPropagation();createGroupInProject('\${esc(proj.id)}')" title="新建分组">+ 分组</button>
            <button class="proj-act-btn cursor-pointer rounded-xs border border-transparent bg-transparent px-2 py-[3px] text-[.74rem] text-tx-3 transition hover:border-bd hover:bg-bg-5 hover:text-tx !text-red" onclick="event.stopPropagation();deleteProject('\${esc(proj.id)}')" title="删除项目">删除</button>
          </span>
        </div>
        <div class="page-project-body border-t border-bd">\`;
      // groups
      for (const grp of projGroups) {
        const grpPages = pages.filter(p => p.groupId === grp.id).sort((a,b) => (a.sort??0) - (b.sort??0));
        html += \`<div class="page-group ml-[18px] border-l-2 border-bd" data-drag-type="group" data-drag-id="\${esc(grp.id)}" data-project-id="\${esc(proj.id)}">
          <div class="page-group-header flex cursor-pointer select-none items-center gap-[7px] px-3 py-2 [&.drag-over-grp]:bg-bg-5 hover:bg-bg-4" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none';this.querySelector('.expand-icon').classList.toggle('open')">
            <span class="expand-icon open w-[14px] shrink-0 text-center !text-[.55rem] text-tx-3 transition-transform duration-150 [&.open]:rotate-90">▶</span>
            <span class="group-name flex-1 text-[.88rem] font-semibold text-tx">\${esc(grp.name)}</span>
            <span class="count-badge rounded-xs bg-bg-5 px-[7px] py-0.5 text-[.66rem] font-semibold text-tx-3">\${grpPages.length}</span>
            <span class="grp-actions ml-1.5 flex gap-[3px]">
              <button class="grp-act-btn cursor-pointer rounded-xs border border-transparent bg-transparent px-2 py-[3px] text-[.74rem] text-tx-3 transition hover:border-bd hover:bg-bg-5 hover:text-tx" onclick="event.stopPropagation();editGroup('\${esc(grp.id)}')" title="编辑分组">编辑</button>
              <button class="grp-act-btn cursor-pointer rounded-xs border border-transparent bg-transparent px-2 py-[3px] text-[.74rem] text-tx-3 transition hover:border-bd hover:bg-bg-5 hover:text-tx !text-red" onclick="event.stopPropagation();deleteGroup('\${esc(grp.id)}')" title="删除分组">删除</button>
            </span>
          </div>
          <div class="page-group-body page-tree-docs page-drop-zone ml-[18px] border-l-2 border-bd [&.drag-over-zone]:outline [&.drag-over-zone]:outline-1 [&.drag-over-zone]:outline-dashed [&.drag-over-zone]:outline-accent [&.drag-over-zone]:-outline-offset-2 [&.drag-over-zone]:bg-accent-muted [&.drag-over-zone]:min-h-[28px]" data-drop-scope="group" data-project-id="\${esc(proj.id)}" data-group-id="\${esc(grp.id)}">\`;
        for (const p of grpPages) html += renderDocItem(p);
        html += \`</div></div>\`;
      }
      // pages directly under project (no group)
      html += \`<div class="page-project-pages page-drop-zone [&.drag-over-zone]:outline [&.drag-over-zone]:outline-1 [&.drag-over-zone]:outline-dashed [&.drag-over-zone]:outline-accent [&.drag-over-zone]:-outline-offset-2 [&.drag-over-zone]:bg-accent-muted [&.drag-over-zone]:min-h-[28px]" data-drop-scope="project" data-project-id="\${esc(proj.id)}" data-group-id="">\`;
      for (const p of projPages) html += renderDocItem(p);
      html += \`</div></div></div>\`;
    }

    // independent groups (no project)
    if (projFilter === 'all' || projFilter === '_none_') {
      if (independentGroups.length) {
        html += \`<div class="pages-independent mt-2"><div class="indep-label mt-[10px] mb-1.5 ml-0.5 text-[.72rem] font-bold uppercase tracking-[.06em] text-tx-3">独立分组</div>\`;
        for (const grp of independentGroups) {
          const grpPages = pages.filter(p => p.groupId === grp.id).sort((a,b) => (a.sort??0) - (b.sort??0));
          html += \`<div class="page-group ml-[18px] border-l-2 border-bd" data-drag-type="group" data-drag-id="\${esc(grp.id)}" data-project-id="">
            <div class="page-group-header flex cursor-pointer select-none items-center gap-[7px] px-3 py-2 [&.drag-over-grp]:bg-bg-5 hover:bg-bg-4" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none';this.querySelector('.expand-icon').classList.toggle('open')">
              <span class="expand-icon open w-[14px] shrink-0 text-center !text-[.55rem] text-tx-3 transition-transform duration-150 [&.open]:rotate-90">▶</span>
              <span class="group-name flex-1 text-[.88rem] font-semibold text-tx">\${esc(grp.name)}</span>
              <span class="count-badge rounded-xs bg-bg-5 px-[7px] py-0.5 text-[.66rem] font-semibold text-tx-3">\${grpPages.length}</span>
              <span class="grp-actions ml-1.5 flex gap-[3px]">
                <button class="grp-act-btn cursor-pointer rounded-xs border border-transparent bg-transparent px-2 py-[3px] text-[.74rem] text-tx-3 transition hover:border-bd hover:bg-bg-5 hover:text-tx" onclick="event.stopPropagation();editGroup('\${esc(grp.id)}')" title="编辑分组">编辑</button>
                <button class="grp-act-btn cursor-pointer rounded-xs border border-transparent bg-transparent px-2 py-[3px] text-[.74rem] text-tx-3 transition hover:border-bd hover:bg-bg-5 hover:text-tx !text-red" onclick="event.stopPropagation();deleteGroup('\${esc(grp.id)}')" title="删除分组">删除</button>
              </span>
            </div>
            <div class="page-group-body page-tree-docs page-drop-zone ml-[18px] border-l-2 border-bd [&.drag-over-zone]:outline [&.drag-over-zone]:outline-1 [&.drag-over-zone]:outline-dashed [&.drag-over-zone]:outline-accent [&.drag-over-zone]:-outline-offset-2 [&.drag-over-zone]:bg-accent-muted [&.drag-over-zone]:min-h-[28px]" data-drop-scope="group" data-project-id="" data-group-id="\${esc(grp.id)}">\`;
          for (const p of grpPages) html += renderDocItem(p);
          html += \`</div></div>\`;
        }
        html += \`</div>\`;
      }

      // uncategorized pages (no project, no group)
      const uncat = pages.filter(p => !p.projectId && !p.groupId).sort((a,b) => (a.sort??0) - (b.sort??0));
      if (uncat.length || projFilter === '_none_') {
        html += \`<div class="pages-uncategorized page-drop-zone border-t border-dashed border-bd-2 pt-[10px] mt-1.5 [&.drag-over-zone]:outline [&.drag-over-zone]:outline-1 [&.drag-over-zone]:outline-dashed [&.drag-over-zone]:outline-accent [&.drag-over-zone]:-outline-offset-2 [&.drag-over-zone]:bg-accent-muted [&.drag-over-zone]:min-h-[28px]" data-drop-scope="uncat" data-project-id="" data-group-id=""><div class="uncat-label mt-[10px] mb-1.5 ml-0.5 text-[.72rem] font-bold uppercase tracking-[.06em] text-tx-3">未分类</div>\`;
        for (const p of uncat) html += renderDocItem(p);
        html += \`</div>\`;
      }
    }

    document.getElementById('pagesTree').innerHTML = html;
    updateProjectFilter(projects);
    updatePageBatchBar();
    initPageDnD();
  }

  function renderDocItem(p) {
    const sel = pageSelected.has(p.slug);
    const check = pageSelectMode
      ? \`<input type="checkbox" class="page-check h-[15px] w-[15px] shrink-0 cursor-pointer accent-accent" data-slug="\${esc(p.slug)}" \${sel?'checked':''} onclick="event.stopPropagation();togglePageSel('\${esc(p.slug)}')">\`
      : '';
    const drag = pageSelectMode ? 'false' : 'true';
    const cls = 'page-tree-item relative flex items-center gap-[10px] my-0.5 rounded-md border border-transparent bg-bg-2 px-[14px] py-[10px] transition hover:border-bd hover:bg-bg-3 [&.dragging]:opacity-30 [&.dragging]:border-dashed [&.dragging]:border-bd-2 [&.drag-over-top]:border-t-2 [&.drag-over-top]:border-t-accent [&.drag-over-top]:-mt-0.5 [&.drag-over-bot]:border-b-2 [&.drag-over-bot]:border-b-accent [&.drag-over-bot]:-mb-0.5 [&.selecting]:cursor-pointer [&.selected]:border-accent [&.selected]:bg-accent-muted' + (pageSelectMode ? ' selecting' : '') + (sel ? ' selected' : '');
    const clickAttr = pageSelectMode ? \`onclick="togglePageSel('\${esc(p.slug)}')"\` : '';
    const status = p.isPublic
      ? '公开'
      : (p.accessPassword ? '加密' : '私密');
    const previewHref = pagePreviewUrl(p);
    return \`<div class="\${cls}" draggable="\${drag}" data-drag-type="page" data-drag-id="\${esc(p.slug)}" data-project-id="\${esc(p.projectId||'')}" data-group-id="\${esc(p.groupId||'')}" \${clickAttr}>
      \${check}
      <span class="drag-handle cursor-grab px-0.5 text-[.78rem] text-tx-3 active:cursor-grabbing" title="拖拽排序">⠿</span>
      <div class="page-item-info flex-1 min-w-0">
        <div class="page-title text-[.92rem] font-semibold text-tx">\${esc(p.title)} <span class="type-badge type-\${p.type==='markdown'?'md':'html'} inline-block rounded-xs px-[7px] py-0.5 text-[.66rem] font-bold [&.type-md]:border [&.type-md]:border-bd-2 [&.type-md]:bg-white/[.07] [&.type-md]:text-tx [&.type-html]:border [&.type-html]:border-amber-r [&.type-html]:bg-amber-g [&.type-html]:text-amber">\${p.type}</span></div>
        <div class="page-meta text-[.72rem] font-medium text-tx-3">\${status} · /p/\${esc(p.slug)}</div>
      </div>
      <a class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !text-[.72rem]" href="\${esc(previewHref)}" target="_blank" onclick="event.stopPropagation()">预览</a>
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !text-[.72rem]" onclick="event.stopPropagation();cpPageAddr('\${esc(p.slug)}',this)">复制</button>
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !text-[.72rem]" onclick="event.stopPropagation();editPageBySlug('\${esc(p.slug)}')">编辑</button>
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-red-r bg-red-g px-3 py-1.5 text-sm font-semibold leading-tight text-red transition hover:bg-red-r !text-[.72rem]" onclick="event.stopPropagation();deletePage('\${esc(p.slug)}')">删除</button>
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
    // project selected → that project's groups; empty project → independent groups only
    const grps = projectId
      ? userGroups.filter(g => g.projectId === projectId)
      : userGroups.filter(g => !g.projectId);
    selEl.innerHTML = '<option value="">-- 无 --</option>' +
      grps.map(g => '<option value="'+esc(g.id)+'"'+(g.id===selectedGroupId?' selected':'')+'>'+esc(g.name)+'</option>').join('');
  }

  function updateGrpProjectSelect(selectedId) {
    const sel = document.getElementById('grpProjectId');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- 独立分组 --</option>' +
      userProjects.map(p => '<option value="'+esc(p.id)+'"'+(p.id===selectedId?' selected':'')+'>'+esc(p.name)+'</option>').join('');
  }

  function updatePageBatchBar() {
    const bar = document.getElementById('pageBatchBar');
    if (!bar) return;
    bar.classList.toggle('show', pageSelectMode);
    document.getElementById('pageSelCount').textContent = '已选 ' + pageSelected.size;
    const toggle = document.getElementById('pageSelectToggle');
    if (toggle) {
      toggle.textContent = pageSelectMode ? '退出选择' : '选择';
      toggle.className = pageSelectMode ? BTN_PRIMARY_TOGGLE : BTN_GHOST_TOGGLE;
    }
    const vis = [...document.querySelectorAll('.page-tree-item')].map(el => el.dataset.dragId);
    const allSel = vis.length > 0 && vis.every(s => pageSelected.has(s));
    const sa = document.getElementById('pageSelectAll');
    if (sa) sa.checked = allSel;
  }

  window.togglePageSel = function(slug) {
    if (!pageSelectMode) return;
    if (pageSelected.has(slug)) pageSelected.delete(slug); else pageSelected.add(slug);
    const el = document.querySelector('.page-tree-item[data-drag-id="'+CSS.escape(slug)+'"]');
    if (el) {
      el.classList.toggle('selected', pageSelected.has(slug));
      const cb = el.querySelector('.page-check'); if (cb) cb.checked = pageSelected.has(slug);
    }
    updatePageBatchBar();
  };

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
      prev.style.color = 'var(--accent)';
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
    prevEl.style.color = 'var(--accent)';
    prevEl.textContent = '';
    setSlugSaveState(false);
    document.getElementById('pmType').value = 'markdown';
    document.getElementById('pmContent').value = '';
    document.getElementById('pmPublic').checked = true;
    document.getElementById('pmPassword').value = '';
    syncPmPwdSection();
    updatePageProjectSelect(document.getElementById('pmProject'), '');
    updatePageGroupSelect(document.getElementById('pmGroup'), '', '');
    document.getElementById('pageModalSave').textContent = '创建';
    document.getElementById('pageModal').classList.add('show');
    setTimeout(() => initVditor(''), 50);
  });

  document.getElementById('pmPublic').addEventListener('change', () => {
    syncPmPwdSection();
  });
  document.getElementById('pmPwdGen').addEventListener('click', () => {
    document.getElementById('pmPassword').value = genPagePwd();
  });

  document.getElementById('pmProject').addEventListener('change', () => {
    const pid = document.getElementById('pmProject').value;
    updatePageGroupSelect(document.getElementById('pmGroup'), pid, '');
  });

  async function editPageBySlug(slug) {
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
    prevEl.style.color = 'var(--accent)';
    prevEl.textContent = location.origin + '/p/' + p.slug;
    setSlugSaveState(false);
    document.getElementById('pmType').value = p.type;
    // Fetch full page content (list API may omit content / password)
    const res = await fetch('/api/pages/' + encodeURIComponent(slug), { headers: authH() });
    const full = res.ok ? await res.json() : null;
    const content = full?.content ?? '';
    document.getElementById('pmContent').value = content;
    const isPublic = (full?.isPublic ?? p.isPublic) !== false;
    document.getElementById('pmPublic').checked = isPublic;
    document.getElementById('pmPassword').value = (!isPublic && (full?.accessPassword || p.accessPassword)) || '';
    syncPmPwdSection();
    updatePageProjectSelect(document.getElementById('pmProject'), p.projectId || '');
    updatePageGroupSelect(document.getElementById('pmGroup'), p.projectId || '', p.groupId || '');
    document.getElementById('pageModalSave').textContent = '保存';
    document.getElementById('pageModal').classList.add('show');
    setTimeout(() => switchEditorToType(p.type, content), 50);
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
    const rawPwd = document.getElementById('pmPassword').value.trim().replace(/[^A-Za-z0-9]/g, '').slice(0, 6);
    const accessPassword = isPublic ? null : (rawPwd || null);
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
    const body = isEdit
      ? { title, content, type, isPublic, accessPassword, projectId, groupId }
      : { slug, title, content, type, isPublic, accessPassword, projectId, groupId };

    const res = await fetch(url, { method: meth, headers: authH(), body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 409) { toast('后缀已被占用，请换一个'); return; }
      toast('失败: ' + data.error); return;
    }

    destroyVditor();
    document.getElementById('pageModal').classList.remove('show');
    toast(isEdit ? '已保存' : '页面已创建');
    // optimistic local password so copy works before reload
    if (!isEdit) {
      // no-op, loadPages will refresh
    } else {
      const idx = userPages.findIndex(x => x.slug === slug);
      if (idx !== -1) {
        userPages[idx].isPublic = isPublic;
        userPages[idx].accessPassword = accessPassword;
        userPages[idx].title = title || userPages[idx].title;
      }
    }
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

  function openGroupModal(projectId, isEdit) {
    document.getElementById('grpModalTitle').textContent = isEdit ? '编辑分组' : '新建分组';
    document.getElementById('grpName').value = isEdit ? (userGroups.find(g => g.id === editingGroupId)?.name || '') : '';
    updateGrpProjectSelect(projectId || '');
    document.getElementById('grpModalSave').textContent = isEdit ? '保存' : '创建';
    document.getElementById('groupModal').classList.add('show');
  }

  document.getElementById('newGroupBtn')?.addEventListener('click', () => {
    editingGroupId = null;
    openGroupModal('', false);
  });

  window.createGroupInProject = function(projectId) {
    editingGroupId = null;
    openGroupModal(projectId, false);
  };

  window.editGroup = function(id) {
    const grp = userGroups.find(g => g.id === id);
    if (!grp) return;
    editingGroupId = id;
    openGroupModal(grp.projectId || '', true);
  };

  document.getElementById('grpModalSave').addEventListener('click', async () => {
    const name = document.getElementById('grpName').value.trim();
    const projectId = document.getElementById('grpProjectId').value || null;
    if (!name) { toast('请输入分组名称'); return; }
    const isEdit = !!editingGroupId;
    const url = isEdit ? '/api/groups/' + encodeURIComponent(editingGroupId) : '/api/groups';
    const meth = isEdit ? 'PATCH' : 'POST';
    // create: name + optional projectId; edit: name (+ projectId if changed)
    const body = isEdit ? { name, projectId } : { name, ...(projectId ? { projectId } : {}) };
    const res = await fetch(url, { method: meth, headers: authH(), body: JSON.stringify(body) });
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast('失败: ' + (d.error || '')); return; }
    document.getElementById('groupModal').classList.remove('show');
    toast(isEdit ? '分组已更新' : '分组已创建');
    loadPages();
  });

  window.deleteGroup = async function(id) {
    const grp = userGroups.find(g => g.id === id);
    if (!grp) return;
    const msg = grp.projectId
      ? '确认删除分组「' + grp.name + '」？其下文档将移至项目根'
      : '确认删除独立分组「' + grp.name + '」？其下文档将变为未分类';
    if (!confirm(msg)) return;
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
      const isHtml = /\.(html?|htm)$/i.test(file.name);
      document.getElementById('importTitle').value = metadata.title || file.name.replace(/\.(md|markdown|html?|htm)$/i, '');
      document.getElementById('importSlug').value = metadata.slug || generateSlugFromFile(file.name);
      document.getElementById('importType').value = metadata.type || (isHtml ? 'html' : 'markdown');
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
    return filename.replace(/\\.(md|markdown|html?|htm)$/i, '').replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 120) || 'imported-' + Date.now();
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

  // ── Page multi-select ──
  document.getElementById('pageSelectToggle')?.addEventListener('click', () => {
    pageSelectMode = !pageSelectMode;
    if (!pageSelectMode) pageSelected.clear();
    renderPageTree();
  });
  document.getElementById('pageSelectAll')?.addEventListener('change', e => {
    const vis = [...document.querySelectorAll('.page-tree-item')].map(el => el.dataset.dragId);
    if (e.target.checked) vis.forEach(s => pageSelected.add(s));
    else vis.forEach(s => pageSelected.delete(s));
    renderPageTree();
  });

  async function pageBatchPatch(body) {
    const slugs = [...pageSelected];
    if (!slugs.length) { toast('请先选择页面'); return; }
    const { ok, fail } = await runPool(slugs, 6, async slug => {
      const res = await fetch('/api/pages/' + encodeURIComponent(slug), {
        method: 'PATCH', headers: authH(), body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
    });
    toast(fail ? \`完成 \${ok}，失败 \${fail}\` : \`已更新 \${ok} 个页面\`, fail ? 'error' : 'success');
    pageSelected.clear();
    loadPages();
  }

  document.getElementById('pageBatchPublic')?.addEventListener('click', () => pageBatchPatch({ isPublic: true }));
  document.getElementById('pageBatchPrivate')?.addEventListener('click', () => pageBatchPatch({ isPublic: false }));
  document.getElementById('pageBatchDelete')?.addEventListener('click', async () => {
    const slugs = [...pageSelected];
    if (!slugs.length) { toast('请先选择页面'); return; }
    if (!confirm('确认删除选中的 ' + slugs.length + ' 个页面？')) return;
    const { ok, fail } = await runPool(slugs, 6, async slug => {
      const res = await fetch('/api/pages/' + encodeURIComponent(slug), { method: 'DELETE', headers: authH() });
      if (!res.ok) throw new Error();
    });
    toast(fail ? \`删除 \${ok}，失败 \${fail}\` : \`已删除 \${ok} 个页面\`, fail ? 'error' : 'success');
    pageSelected.clear();
    loadPages();
  });
  document.getElementById('pageBatchMove')?.addEventListener('click', () => {
    if (!pageSelected.size) { toast('请先选择页面'); return; }
    updatePageProjectSelect(document.getElementById('pageMoveProject'), '');
    updatePageGroupSelect(document.getElementById('pageMoveGroup'), '', '');
    document.getElementById('pageMoveModal').classList.add('show');
  });
  document.getElementById('pageMoveProject')?.addEventListener('change', () => {
    updatePageGroupSelect(document.getElementById('pageMoveGroup'), document.getElementById('pageMoveProject').value, '');
  });
  document.getElementById('pageMoveModalSave')?.addEventListener('click', async () => {
    const projectId = document.getElementById('pageMoveProject').value || null;
    const groupId = document.getElementById('pageMoveGroup').value || null;
    document.getElementById('pageMoveModal').classList.remove('show');
    await pageBatchPatch({ projectId, groupId });
  });
  ['pageMoveModalClose','pageMoveModalCancel'].forEach(id =>
    document.getElementById(id)?.addEventListener('click', () => document.getElementById('pageMoveModal').classList.remove('show'))
  );

  // ── Page Drag and Drop ──
  let dragState = null;

  function clearDragOver() {
    document.querySelectorAll('.drag-over-top,.drag-over-bot,.drag-over-zone').forEach(el => {
      el.classList.remove('drag-over-top','drag-over-bot','drag-over-zone');
    });
  }

  function scopeItems(projectId, groupId) {
    // direct children of the matching drop zone (avoids nested groups)
    const sel = '.page-drop-zone[data-project-id="' + CSS.escape(projectId || '') + '"][data-group-id="' + CSS.escape(groupId || '') + '"] > .page-tree-item';
    return [...document.querySelectorAll(sel)];
  }

  function initPageDnD() {
    if (pageSelectMode) return;
    document.querySelectorAll('.page-tree-item[draggable="true"]').forEach(el => {
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragend', onDragEnd);
      el.addEventListener('dragover', onDragOverItem);
      el.addEventListener('drop', onDropItem);
      el.addEventListener('dragleave', onDragLeaveItem);
    });
    document.querySelectorAll('.page-drop-zone').forEach(el => {
      el.addEventListener('dragover', onDragOverZone);
      el.addEventListener('drop', onDropZone);
      el.addEventListener('dragleave', onDragLeaveZone);
    });
  }

  function onDragStart(e) {
    if (e.target.closest('button, a, input, select, textarea')) { e.preventDefault(); return; }
    const el = e.currentTarget;
    dragState = {
      type: el.dataset.dragType,
      id: el.dataset.dragId,
      projectId: el.dataset.projectId || '',
      groupId: el.dataset.groupId || '',
      el,
    };
    el.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', el.dataset.dragId);
  }
  function onDragEnd() {
    if (dragState?.el) dragState.el.classList.remove('dragging');
    clearDragOver();
    dragState = null;
  }
  function onDragOverItem(e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    const target = e.currentTarget;
    if (!dragState || target === dragState.el) return;
    const rect = target.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    target.classList.remove('drag-over-top','drag-over-bot');
    target.classList.add(e.clientY < midY ? 'drag-over-top' : 'drag-over-bot');
  }
  function onDragLeaveItem(e) {
    e.currentTarget.classList.remove('drag-over-top','drag-over-bot');
  }
  function onDragOverZone(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragState) return;
    // only highlight empty-ish zone when not over a child item
    if (e.target.closest('.page-tree-item')) return;
    e.currentTarget.classList.add('drag-over-zone');
  }
  function onDragLeaveZone(e) {
    e.currentTarget.classList.remove('drag-over-zone');
  }

  async function reorderInScope(projectId, groupId, order) {
    await fetch('/api/pages/reorder', {
      method: 'PATCH', headers: authH(),
      body: JSON.stringify({
        groupId: groupId || null,
        projectId: projectId || null,
        order,
      }),
    });
  }

  async function movePageTo(slug, projectId, groupId) {
    await fetch('/api/pages/' + encodeURIComponent(slug), {
      method: 'PATCH', headers: authH(),
      body: JSON.stringify({ projectId: projectId || null, groupId: groupId || null }),
    });
  }

  async function onDropItem(e) {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget;
    target.classList.remove('drag-over-top','drag-over-bot');
    if (!dragState || dragState.type !== 'page' || target === dragState.el) return;

    const targetGroupId = target.dataset.groupId || '';
    const targetProjectId = target.dataset.projectId || '';
    const srcGroupId = dragState.groupId || '';
    const srcProjectId = dragState.projectId || '';
    const placeAfter = !target.classList.contains('drag-over-top');
    // re-evaluate midY for placeAfter
    const rect = target.getBoundingClientRect();
    const after = e.clientY >= rect.top + rect.height / 2;

    if (targetGroupId === srcGroupId && targetProjectId === srcProjectId) {
      // same scope: reorder — compute order first, then persist
      const items = scopeItems(targetProjectId, targetGroupId);
      const ids = items.map(el => el.dataset.dragId);
      const from = ids.indexOf(dragState.id);
      let to = ids.indexOf(target.dataset.dragId);
      if (from === -1 || to === -1 || from === to) { loadPages(); return; }
      const order = ids.slice();
      order.splice(from, 1);
      // after removal, adjust to if from was before to
      let insertAt = order.indexOf(target.dataset.dragId);
      if (after) insertAt += 1;
      order.splice(insertAt, 0, dragState.id);
      await reorderInScope(targetProjectId, targetGroupId, order);
    } else {
      // cross scope: move then place near target
      await movePageTo(dragState.id, targetProjectId || null, targetGroupId || null);
      // best-effort: rebuild order in target scope with dragged id near target
      // (loadPages will refresh; skip fine-grained reorder for simplicity after move)
    }
    loadPages();
  }

  async function onDropZone(e) {
    e.preventDefault();
    const zone = e.currentTarget;
    zone.classList.remove('drag-over-zone');
    if (!dragState || dragState.type !== 'page') return;
    // if dropped on a child item, item handler already ran via stopPropagation
    if (e.target.closest('.page-tree-item')) return;

    const projectId = zone.dataset.projectId || '';
    const groupId = zone.dataset.groupId || '';
    const same = (dragState.projectId || '') === projectId && (dragState.groupId || '') === groupId;
    if (same) {
      // append to end of this scope
      const items = scopeItems(projectId, groupId);
      const order = items.map(el => el.dataset.dragId).filter(id => id !== dragState.id);
      order.push(dragState.id);
      await reorderInScope(projectId, groupId, order);
    } else {
      await movePageTo(dragState.id, projectId || null, groupId || null);
    }
    loadPages();
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
      setStatus(\`分析文件结构… \${Object.keys(files).length} 个文件\`, 8);
    } else {
      setStatus('正在解压 ZIP（后台线程）…', 3);
      const bytes = new Uint8Array(await zipFile.arrayBuffer());
      try {
        const raw = await _unzipBytes(bytes, zipFile);
        const fixed = {}; for (const [p,d] of Object.entries(raw)) fixed[_protoFixEnc(p)] = d;
        files = _protoStrip(fixed);
      } catch(e) { throw new Error('解压失败：' + e.message); }
      setStatus(\`分析文件结构… 发现 \${Object.keys(files).length} 个文件\`, 8);
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
    setStatus('初始化上传会话…', 12);
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
    if (skipped > 0) setStatus(\`增量上传：\${uploadPaths.length} 个变更，跳过 \${skipped} 个未变文件\`, 15);

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
        setStatus('已上传 ' + done + '/' + totalBatches + ' 批（' + filesDone + ' / ' + uploadPaths.length + ' 个变更文件 · 并发 ' + CONCURRENCY + '）', pct);
      }
    }
    if (totalBatches > 0) {
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, totalBatches) }, poolWorker));
      if (abortErr) throw abortErr;
    }

    // Step 3: finalize（filePaths 记录完整清单，manifest 写回供下次 diff）
    setStatus('正在写入元数据…', 93);
    const fRes = await fetch(finalizeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ protoId, filePaths: safePaths, manifest: newManifest }),
    });
    const fData = await fRes.json().catch(() => ({}));
    if (!fRes.ok) throw new Error(fData.error || '最终化失败');
    setStatus(skipped > 0 ? \`完成！增量上传 \${uploadPaths.length} 个文件（节省 \${skipped} 个）\` : '上传完成！', 100);
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
    const statusEl = document.getElementById('protoStatusText');  statusEl.classList.remove('hidden');  statusEl.textContent = '';

    function setStatus(msg, pct) {
      const icon = pct === 100
        ? '<svg class="inline-block h-3.5 w-3.5 -mt-0.5 mr-1 text-green" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,8 6.5,12 13,4"/></svg>'
        : '<svg class="inline-block h-3.5 w-3.5 -mt-0.5 mr-1" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="8" cy="8" r="5.5" stroke-dasharray="26" stroke-dashoffset="8"/></svg>';
      statusEl.innerHTML = icon + msg;
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
    if (!silent) document.getElementById('protoTableBody').innerHTML = '<tr><td class="text-center text-tx-3 p-8" colspan="10">加载中…</td></tr>';
    try {
      const res = await fetch('/api/protos', { headers: { Authorization: 'Bearer ' + token } });
      if (!res.ok) return;
      const { protos } = await res.json();
      userProtos = protos || [];
      renderProtos();
    } catch { if (!silent) document.getElementById('protoTableBody').innerHTML = '<tr><td class="text-center text-tx-3 p-8" colspan="10">加载失败</td></tr>'; }
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
      tbody.innerHTML = '<tr><td class="text-center text-tx-3 p-8" colspan="10">暂无原型</td></tr>';
      empty.style.display = 'none';
      return;
    }
    empty.style.display = 'none';
    tbody.innerHTML = userProtos.map((p, idx) => {
      const url        = location.origin + '/proto/' + p.protoId + '/';
      const previewUrl = url + (p.accessPassword ? '?pwd=' + encodeURIComponent(p.accessPassword) : '');
      const lock       = p.hasPassword ? \`<span class="inline-flex items-center gap-1 rounded-xs border border-amber-r bg-amber-g px-1.5 py-px text-[.68rem] font-semibold text-amber"><svg class="h-2.5 w-2.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7V4.5a3 3 0 0 1 6 0V7"/></svg>密码</span>\` : '';
      const priv       = p.isPrivate   ? \`<span class="rounded-xs border border-red-r bg-red-g px-1.5 py-px text-[.68rem] font-semibold text-red">私有</span>\` : '';
      const pwdInfo    = p.hasPassword ? \`<div class="text-[.65rem] text-tx-3 mt-0.5">有效期：\${formatExpiry(p.passwordExpiry)}</div>\` : '<span class="text-[.79rem] text-tx-2">无</span>';
      const verCount   = (p.versions ?? []).length;
      const verBadge   = \`<span class="inline-flex items-center gap-0.5 rounded-xs border border-bd-2 bg-white/[.06] px-1.5 py-px font-mono text-[.66rem] font-bold text-tx cursor-pointer underline" onclick="upvmOpen(\${idx})">v\${p.version||1}\${verCount>1?' ('+verCount+')':''} <svg class="h-2.5 w-2.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="12" y2="4"/><polyline points="5,4 12,4 12,11"/></svg></span>\`;
      const visits = p.visitCount ?? 0;
      return \`<tr>
        <td class="text-[.79rem] text-tx-2 !text-[.75rem] text-center">\${idx+1}</td>
        <td class="max-w-[280px]">
          <div class="truncate text-[.88rem] font-semibold text-tx">\${esc(p.title || p.protoId)}</div>
          <div class="flex gap-1 mt-[3px] flex-wrap">\${lock}\${priv}\${(p.tags||[]).map(t=>\`<span class="whitespace-nowrap rounded-lg border border-bd bg-white/5 px-[7px] py-px text-[.64rem] font-semibold text-tx-2">\${esc(t)}</span>\`).join('')}</div>
          <div class="mt-0.5 truncate font-mono text-[.66rem] text-tx-3">\${p.protoId}</div>
        </td>
        <td class="text-[.79rem] text-tx-2">\${p.fileCount ?? '—'}</td>
        <td class="text-[.79rem] text-tx-2">\${fmtSize(p.totalSize || 0)}</td>
        <td>\${pwdInfo}</td>
        <td>\${verBadge}</td>
        <td class="text-[.79rem] text-tx-2">\${visits > 0 ? visits.toLocaleString() : '—'}</td>
        <td class="text-[.79rem] text-tx-2 whitespace-nowrap">\${fmtDate(p.createdAt)}</td>
        <td class="text-[.79rem] text-tx-2 whitespace-nowrap">\${timeAgo(p.updatedAt || p.createdAt)}</td>
        <td class="whitespace-nowrap text-right">
          <a href="\${previewUrl}" target="_blank" class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx">预览</a>
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" onclick="cpProto(userProtos[\${idx}]._copyText,this)">复制</button>
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" onclick="upvmOpen(\${idx})">版本</button>
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" onclick="openProtoTagEditor('\${esc(p.protoId)}')">标签</button>
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" onclick="openProtoEdit('\${esc(p.protoId)}')">编辑</button>
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" onclick="openProtoUpdate('\${esc(p.protoId)}')">更新</button>
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-red-r bg-red-g px-3 py-1.5 text-sm font-semibold leading-tight text-red transition hover:bg-red-r" onclick="deleteProto('\${esc(p.protoId)}')">删除</button>
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
    document.getElementById('upvmDiffBtn').classList.add('hidden');
    document.getElementById('upvmMode').textContent = '点击版本号查看文件列表，勾选两个版本进行对比';
    document.getElementById('upvmContent').innerHTML = '<div class="text-tx-3 text-center py-[60px] text-[.85rem]"><svg class="inline-block h-4 w-4 -mt-0.5 mr-1" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="13" y1="8" x2="3" y2="8"/><polyline points="7,4 3,8 7,12"/></svg>点击左侧版本号查看文件列表</div>';
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
      const cardBase = 'pvm-ver-card cursor-pointer rounded-md border border-bd bg-bg-2 px-[10px] py-[9px] transition hover:border-bd-2 [&.active]:border-brand [&.active]:bg-brand-muted [&.checked-a]:border-green [&.checked-a]:bg-green-g [&.checked-b]:border-amber [&.checked-b]:bg-amber-g';
      const cls      = ci===0?cardBase+' checked-a':ci===1?cardBase+' checked-b':isActive?cardBase+' active':cardBase;
      return \`<div class="\${cls}" onclick="upvmSelectVer(\${v.v})">
        <div class="flex items-center gap-1 flex-wrap">
          <span class="mr-1 rounded-xs border border-bd-2 bg-white/[.08] px-[7px] py-px font-mono text-[.72rem] font-bold text-tx">v\${v.v}</span>
          \${isLatest?'<span class="rounded-[3px] border border-green-r bg-green-g px-1.5 py-px text-[.65rem] font-bold text-green">最新</span>':''}
          \${!isLatest?'<button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-red-r bg-red-g px-3 py-1.5 text-sm font-semibold leading-tight text-red transition hover:bg-red-r !px-1.5 !py-px !text-[.62rem] ml-auto" onclick="event.stopPropagation();upvmDeleteVer(\${v.v})">删除</button>':''}
        </div>
        <div class="mt-1 font-mono text-[.7rem] text-tx-3">\${v.at?new Date(v.at).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'—'}</div>
        <div class="mt-1 font-mono text-[.7rem] text-tx-3">\${v.files??'?'} 文件 · \${v.size?fmtSize(v.size):'—'}</div>
        <label class="flex items-center gap-[5px] mt-[5px] text-[.7rem] text-tx-3" onclick="event.stopPropagation()">
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
    if (upvmChecked.length === 2) { btn.classList.remove('hidden'); modeEl.textContent=\`已选 v\${upvmChecked[0]}（A）与 v\${upvmChecked[1]}（B），点击"对比"查看差异\`; }
    else { btn.classList.add('hidden'); modeEl.textContent = upvmChecked.length===1?\`已选 v\${upvmChecked[0]} 为对比 A，再勾选一个版本\`:'点击版本号查看文件列表，勾选两个版本进行对比'; }
  }

  async function upvmFetch(ver) {
    const key = \`v\${ver}\`;
    if (upvmFileCache[key] !== undefined) return upvmFileCache[key];
    document.getElementById('upvmContent').innerHTML = '<div class="text-tx-3 text-center py-10">加载中…</div>';
    try {
      const pid = upvmProto.protoId;
      const res = await fetch(\`/api/proto-vfiles/\${encodeURIComponent(pid)}/\${key}\`, { headers: { Authorization: 'Bearer ' + token } });
      upvmFileCache[key] = res.ok ? (await res.json()).files ?? null : null;
    } catch { upvmFileCache[key] = null; }
    return upvmFileCache[key];
  }

  function upvmShowFileList(files, title) {
    const q = document.getElementById('upvmSearch').value.toLowerCase();
    if (!files) { document.getElementById('upvmContent').innerHTML = '<div class="text-tx-3 text-center py-10 text-[.82rem]">该版本无文件记录（旧版本上传未记录文件列表）</div>'; return; }
    const fl = q ? files.filter(f => f.toLowerCase().includes(q)) : files;
    document.getElementById('upvmContent').innerHTML = \`<div class="text-[.75rem] text-tx-3 mb-[10px] font-medium">\${title}\${q?' — 过滤 "'+q+'"':''}</div><div>\${fl.map(f=>\`<div class="flex items-center rounded-xs px-1.5 py-[3px] font-mono text-[.72rem] mb-px text-tx-2 transition hover:bg-bg-hover hover:text-tx">\${esc(f)}</div>\`).join('')||'<div class="text-tx-3 text-[.82rem] py-5">无匹配文件</div>'}</div>\`;
  }

  document.getElementById('upvmDiffBtn').addEventListener('click', async () => {
    if (upvmChecked.length < 2) return;
    const [a,b] = upvmChecked;
    document.getElementById('upvmContent').innerHTML = '<div class="text-tx-3 text-center py-10">加载中…</div>';
    const [fa,fb] = await Promise.all([upvmFetch(a), upvmFetch(b)]);
    if (!fa || !fb) { document.getElementById('upvmContent').innerHTML = '<div class="text-tx-3 text-center py-10 text-[.82rem]">版本无文件记录，无法对比</div>'; return; }
    upvmRenderDiff(fa, fb, a, b);
  });

  function upvmRenderDiff(fa, fb, a, b) {
    const q = document.getElementById('upvmSearch').value.toLowerCase();
    const sa = new Set(fa), sb = new Set(fb);
    let added   = fb.filter(f => !sa.has(f));
    let removed = fa.filter(f => !sb.has(f));
    let same    = fa.filter(f => sb.has(f));
    if (q) { added=added.filter(f=>f.toLowerCase().includes(q)); removed=removed.filter(f=>f.toLowerCase().includes(q)); same=same.filter(f=>f.toLowerCase().includes(q)); }
    const DIFF_FILE_BASE = 'flex items-center gap-1.5 rounded-xs px-1.5 py-[3px] font-mono text-[.72rem] mb-px';
    const mkRows = (files, cls, pfx) => files.map(f=>\`<div class="\${DIFF_FILE_BASE} \${cls}"><span class="w-[14px] shrink-0 font-bold">\${pfx}</span>\${esc(f)}</div>\`).join('');
    let html = \`<div class="flex gap-3 mb-4 text-[.78rem] flex-wrap"><span>v\${a} → v\${b}</span><span class="text-[#10b981]">+\${added.length} 新增</span><span class="text-[#ef4444]">-\${removed.length} 删除</span><span class="text-tx-3">\${same.length} 不变</span></div>\`;
    const DIFF_H4_BASE = 'text-[.72rem] font-bold mb-1.5 px-2 py-[5px] rounded-xs uppercase tracking-[.08em]';
    if (added.length)   html += \`<div class="diff-section mb-4"><h4 class="\${DIFF_H4_BASE} bg-green-g text-green flex items-center gap-1"><svg class="h-3 w-3 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>新增 \${added.length} 个文件（v\${b} 新增）</h4>\${mkRows(added,'bg-green-g text-green','+')}</div>\`;
    if (removed.length) html += \`<div class="diff-section mb-4"><h4 class="\${DIFF_H4_BASE} bg-red-g text-red flex items-center gap-1"><svg class="h-3 w-3 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="3" y1="8" x2="13" y2="8"/></svg>删除 \${removed.length} 个文件（v\${b} 移除）</h4>\${mkRows(removed,'bg-red-g text-red','−')}</div>\`;
    if (same.length)    html += \`<div class="diff-section mb-4"><h4 class="\${DIFF_H4_BASE} bg-[rgba(255,255,255,.04)] text-tx-3">· 未变动 \${same.length} 个文件</h4>\${mkRows(same,'','·')}</div>\`;
    document.getElementById('upvmContent').innerHTML = html || '<div class="text-tx-3 text-center py-10 text-[.82rem]">无匹配文件</div>';
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
    if (upvmActiveVer===ver) { upvmActiveVer=null; document.getElementById('upvmContent').innerHTML='<div class="text-tx-3 text-center py-[60px] text-[.85rem]"><svg class="inline-block h-4 w-4 -mt-0.5 mr-1" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="13" y1="8" x2="3" y2="8"/><polyline points="7,4 3,8 7,12"/></svg>点击左侧版本号查看文件列表</div>'; }
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
    const statusEl = document.getElementById('puStatusText');   statusEl.classList.remove('hidden'); statusEl.textContent = '';

    function setStatus(msg, pct) {
      const icon = pct === 100
        ? '<svg class="inline-block h-3.5 w-3.5 -mt-0.5 mr-1 text-green" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,8 6.5,12 13,4"/></svg>'
        : '<svg class="inline-block h-3.5 w-3.5 -mt-0.5 mr-1" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="8" cy="8" r="5.5" stroke-dasharray="26" stroke-dashoffset="8"/></svg>';
      statusEl.innerHTML = icon + msg;
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
  function cp(text, btn) { navigator.clipboard.writeText(text).then(() => { if(btn){const o=btn.innerHTML;btn.innerHTML='<svg class="inline-block h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,8 6.5,12 13,4"/></svg>';setTimeout(()=>btn.innerHTML=o,1400);} }); }
  function toast(msg, type) {
    const t = document.getElementById('toast');
    t.className = TOAST_BASE + ' toast show' + (type ? ' t-' + type : '');
    t.textContent = msg;
    clearTimeout(t._tid);
    t._tid = setTimeout(() => t.classList.remove('show'), 2600);
  }
  const SKEL = 'rounded-sm bg-[linear-gradient(90deg,var(--color-bg-3)_25%,var(--color-bg-4)_50%,var(--color-bg-3)_75%)] bg-[length:400%_100%] animate-[shimmer_1.4s_ease_infinite]';
  function skelCards(el, n) {
    if (!el) return;
    el.innerHTML = Array.from({ length: n }, () =>
      \`<div class="overflow-hidden rounded-lg border border-bd bg-bg-3"><div class="\${SKEL} w-full aspect-square"></div><div class="flex flex-col gap-[7px] px-[11px] py-[10px]"><div class="\${SKEL} h-[9px] w-4/5"></div><div class="\${SKEL} h-[9px] w-1/2"></div></div></div>\`
    ).join('');
  }
  function skelRows(el, n) {
    if (!el) return;
    el.innerHTML = Array.from({ length: n }, () => \`<div class="\${SKEL} h-[58px] rounded-[9px] border border-bd mb-[10px]"></div>\`).join('');
  }
  function fmtSize(b) { if(b<1024) return b+' B'; if(b<1048576) return (b/1024).toFixed(1)+' KB'; return (b/1048576).toFixed(1)+' MB'; }
  function fmtDate(ms) { if(!ms) return '—'; return new Date(ms).toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit',year:'2-digit'}); }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  document.addEventListener('keydown', e => {
    const lb = document.getElementById('lightbox');
    if (e.key === 'Escape') {
      lb.classList.remove('show'); closePageModal();
      ['protoEditModal','protoUpdateModal','userProtoVersionModal','trashModal','tagModal','projectModal','groupModal','importModal','pageMoveModal'].forEach(id => {
        const el = document.getElementById(id); if (el) el.classList.remove('show');
      });
      closeChangePwdModal();
      document.getElementById('loginOverlay').style.display = 'none';
    }
    if (!lb.classList.contains('show')) return;
    if (e.key === 'ArrowLeft')  lbNavigate(-1);
    if (e.key === 'ArrowRight') lbNavigate(1);
  });
  document.getElementById('loginOverlay').addEventListener('click', e => { if (e.target === document.getElementById('loginOverlay')) document.getElementById('loginOverlay').style.display = 'none'; });
</script>
<script type="text/plain" id="fflateSrc">${FFLATE_UMD}</script>
</body>
</html>`;
}
