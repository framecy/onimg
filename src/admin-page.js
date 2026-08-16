import { FFLATE_UMD } from './fflate-inline.js';
import apertureCss from './ui/aperture.generated.js';

/* 手绘风空状态插画（Notion 风格简笔小人 + 空相框），单色中性，随主题切换 */
const EMPTY_ILLUS = `<svg class="mx-auto mb-4 block h-[92px] w-auto" viewBox="0 0 220 140" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M120 40 C 140 36, 158 38, 172 42 C 184 45, 189 53, 188 66 C 186 88, 187 108, 186 120 C 185 130, 178 135, 168 133 C 152 131, 136 132, 122 131 C 112 130, 108 124, 109 114 C 111 92, 110 66, 113 52 C 114 45, 114 41, 120 40 Z" stroke="var(--tx-3)" stroke-width="2"/>
  <path d="M150 84 C 156 84, 161 89, 161 95 C 161 101, 156 106, 150 106 C 144 106, 139 101, 139 95 C 139 89, 144 84, 150 84" stroke="var(--tx-3)" stroke-width="1.8"/>
  <path d="M150 76 C 149 71, 151 66, 150 62" stroke="var(--tx-3)" stroke-width="1.6"/>
  <path d="M160 80 C 165 79, 169 80, 172 78" stroke="var(--tx-3)" stroke-width="1.6"/>
  <path d="M138 112 C 146 104, 152 106, 158 112 C 163 106, 168 104, 172 110" stroke="var(--tx-3)" stroke-width="1.8"/>
  <path d="M60 51 C 63 51, 66 54, 66 58 C 66 62, 63 65, 60 65 C 57 65, 54 62, 54 58 C 54 54, 57 51, 60 51" stroke="var(--tx-2)" stroke-width="2"/>
  <path d="M60 65 C 60 72, 59 78, 57 84" stroke="var(--tx-2)" stroke-width="2"/>
  <path d="M60 71 C 53 70, 48 71, 45 74" stroke="var(--tx-2)" stroke-width="2"/>
  <path d="M60 71 C 66 70, 71 71, 74 74" stroke="var(--tx-2)" stroke-width="2"/>
  <path d="M57 84 C 55 90, 53 96, 50 100" stroke="var(--tx-2)" stroke-width="2"/>
  <path d="M57 84 C 59 90, 61 96, 64 100" stroke="var(--tx-2)" stroke-width="2"/>
  <path d="M40 102 C 52 99, 70 99, 82 102" stroke="var(--bd-2)" stroke-width="1.6"/>
  <path d="M40 40 C 41 36, 42 35, 46 34 C 42 33, 41 32, 40 28 C 39 32, 38 33, 34 34 C 38 35, 39 36, 40 40 Z" fill="var(--tx-3)"/>
  <path d="M198 34 C 199 30, 200 29, 204 28 C 200 27, 199 26, 198 22 C 197 26, 196 27, 192 28 C 196 29, 197 30, 198 34 Z" fill="var(--bd-2)"/>
</svg>`;

export function renderAdminPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script>(function(){try{var t=localStorage.getItem('onimg_theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Onimg Admin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
  <noscript><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet"></noscript>
  <!-- Vditor CSS/JS CDN 按需注入（见 ensureApmVditor），编辑器首次打开时加载 -->
  <style>
    /* Aperture token（@theme）+ 别名桥 + Tailwind 工具类，由 build:css 生成 */
    ${apertureCss}
    html, body { overflow-x: hidden; max-width: 100%; }
    body { font-family: var(--font); background: var(--bg); color: var(--tx); min-height: 100vh; font-weight: 450; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }


    /* ── Toast ── */

    /* ── Admin page editor Vditor ── */
    #apmVditor {
      border-radius: var(--r-md);
      overflow: hidden;
      flex: 1 1 auto;
      min-height: 320px;
      border: 1px solid var(--bd);
      min-width: 0;
      max-width: 100%;
      display: flex;
      flex-direction: column;
      background: var(--bg-2);
    }
    #apmVditor .vditor {
      height: 100% !important;
      max-width: 100% !important;
      border: none !important;
      background: var(--bg-2) !important;
      display: flex !important;
      flex-direction: column !important;
    }
    #apmVditor .vditor-toolbar {
      flex-shrink: 0 !important;
      flex-wrap: wrap !important;
      overflow-x: auto;
      background: var(--bg-3) !important;
      border-bottom: 1px solid var(--bd) !important;
      position: sticky !important;
      top: 0 !important;
      z-index: 10 !important;
    }
    #apmVditor .vditor-content {
      flex: 1 1 auto !important;
      height: auto !important;
      min-height: 0 !important;
      overflow-y: auto !important;
      overscroll-behavior: contain;
      min-width: 0;
    }
    #apmVditor .vditor-ir,
    #apmVditor .vditor-sv,
    #apmVditor .vditor-wysiwyg {
      min-height: 100% !important;
    }
    #apmVditor .vditor-ir pre.vditor-reset,
    #apmVditor .vditor-sv pre.vditor-reset,
    #apmVditor .vditor-wysiwyg pre.vditor-reset {
      max-width: 100% !important;
      overflow-wrap: anywhere;
      word-break: break-word;
      color: var(--tx) !important;
      background: transparent !important;
      font-size: 14.5px !important;
      line-height: 1.75 !important;
      padding: 14px 16px !important;
    }
    #apmVditor .vditor-outline { display: none !important; }
    /* ── Login enhancements (keyframes kept, referenced via Tailwind arbitrary animate-[] values) ── */
    @keyframes loginSpin { to { transform: rotate(360deg); } }
    @keyframes loginShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }

    /* ── Sidebar nav click feedback (keyframe kept, referenced via arbitrary animate-[] value) ── */
    @keyframes navRipple { to { transform: translate(-50%,-50%) scale(4); opacity: 0; } }
  </style>
</head>
<body>

<div class="hidden items-center gap-2 border-b border-amber-r bg-amber-g px-[22px] py-2 text-[.79rem] text-amber [&.show]:flex" id="expiryBanner">
  <svg class="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1.5 15 14H1L8 1.5z"/><line x1="8" y1="6" x2="8" y2="9.5"/><circle cx="8" cy="11.5" r=".2" fill="currentColor"/></svg>
  登录状态将在 <strong id="expiryCountdown"></strong> 后过期，建议重新登录以避免中断。
  <button class="ml-auto px-[10px] py-[3px] bg-none border border-amber-r text-amber rounded-[5px] cursor-pointer text-[.75rem] font-sans" onclick="triggerReLogin()">重新登录</button>
</div>
<div class="mob-header fixed inset-x-0 top-0 z-20 flex h-[50px] items-center gap-[14px] border-b border-bd bg-bg-2 px-4 md:hidden">
  <button class="flex h-8 w-8 items-center justify-center rounded-sm border border-bd bg-transparent text-tx-3 cursor-pointer transition hover:border-bd-2 hover:text-tx" id="sidebarToggle"><svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="12" x2="14" y2="12"/></svg></button>
  <span class="text-[.88rem] font-bold tracking-[-.01em]">Onimg Admin</span>
</div>
<div class="sidebar-mask fixed inset-0 z-[9] hidden bg-black/60 [&.show]:block" id="sidebarMask"></div>

<!-- Login -->
<div class="flex min-h-screen items-center justify-center bg-bg p-4 bg-[radial-gradient(ellipse_80%_50%_at_60%_20%,rgba(255,255,255,.025)_0%,transparent_60%)]" id="loginScreen">
  <div class="login-card relative w-full max-w-[380px] overflow-hidden rounded-xl border border-bd bg-bg-3 px-10 py-11 shadow before:absolute before:inset-x-0 before:top-0 before:h-px before:content-[''] before:bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,.08)_50%,transparent_100%)] [&.shake]:animate-[loginShake_.35s_ease]">
    <div class="mb-6 flex items-center gap-3">
      <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-[.85rem] font-extrabold text-tx-inv">OI</span>
      <div>
        <div class="text-[1.25rem] font-extrabold leading-[1.15] tracking-[-.02em] text-tx">Onimg</div>
        <div class="mt-px text-2xs font-bold uppercase tracking-[.1em] text-tx-3">Admin Console</div>
      </div>
    </div>
    <div class="mb-8 text-sm text-tx-3">使用管理员账号登录后台</div>
    <div class="flex flex-col gap-2 mb-5"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">用户名</label><input class="w-full rounded-md border border-bd bg-bg-2 px-3.5 py-[11px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:shadow-[var(--focus-ring)]" type="text" id="loginUser" placeholder="admin" autocomplete="username"></div>
    <div class="flex flex-col gap-2 mb-4"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">密码</label><div class="relative"><input class="w-full rounded-md border border-bd bg-bg-2 px-3.5 py-[11px] pr-10 font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:shadow-[var(--focus-ring)]" type="password" id="loginPass" placeholder="••••••••" autocomplete="current-password"><button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center border-none bg-transparent p-0 text-tx-3 cursor-pointer transition hover:text-tx-2" id="loginPassToggle" title="显示/隐藏密码"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg></button></div></div>
    <label class="mb-6 flex items-center gap-2 cursor-pointer select-none text-[.8rem] text-tx-2"><input class="h-3.5 w-3.5 cursor-pointer accent-tx" type="checkbox" id="loginRemember">记住我 30 天</label>
    <button class="btn-login w-full rounded-md border-none bg-accent px-3 py-3 font-sans text-base-sm font-bold text-tx-inv transition hover:-translate-y-px hover:bg-accent-hover disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-bg-5 disabled:text-tx-3 disabled:shadow-none [&.loading]:pointer-events-none [&.loading]:before:content-[''] [&.loading]:before:inline-block [&.loading]:before:mr-2 [&.loading]:before:h-[14px] [&.loading]:before:w-[14px] [&.loading]:before:align-middle [&.loading]:before:rounded-full [&.loading]:before:border-2 [&.loading]:before:border-[var(--tx-inv)] [&.loading]:before:border-t-transparent [&.loading]:before:animate-[loginSpin_.6s_linear_infinite]" id="loginBtn">登录</button>
    <div class="mt-3 min-h-[18px] text-center text-xs text-red" id="loginErr"></div>
  </div>
</div>

<!-- App -->
<div class="hidden" id="adminApp">
  <div class="flex min-h-screen">

    <!-- Sidebar -->
    <aside class="fixed inset-y-0 left-0 z-10 flex w-60 shrink-0 -translate-x-60 flex-col border-r border-bd bg-bg-2 transition-transform duration-[.22s] ease-in-out md:translate-x-0 [&.open]:translate-x-0 [&.open]:z-[15]">
      <div class="flex items-center gap-2.5 border-b border-bd px-4 pt-[18px] pb-3.5">
        <div class="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-sm border border-bd-2 bg-gradient-to-br from-[#242836] to-[#14161d] text-[.78rem] font-extrabold tracking-[-.01em] text-white shadow-[0_3px_10px_rgba(0,0,0,.5)]">OI</div>
        <div class="flex flex-col gap-px">
          <div class="text-[.92rem] font-bold text-tx tracking-[-.015em]">Onimg</div>
          <div class="text-[.58rem] font-semibold uppercase tracking-[.12em] text-tx-3">Admin Console</div>
        </div>
      </div>
      <div class="px-4 pt-[14px] pb-[5px] text-2xs font-bold uppercase tracking-[.12em] text-tx-3">Navigation</div>
      <nav class="flex flex-1 flex-col gap-px overflow-y-auto px-2 pt-1 pb-2">
        <button class="nav-item active relative flex w-full items-center gap-[9px] overflow-hidden rounded-sm border-none bg-transparent px-[11px] py-[9px] text-left text-[.85rem] font-semibold text-tx-2 transition hover:bg-bg-hover hover:text-tx active:scale-[.972] [&.active]:bg-bg-active [&.active]:text-tx [&.active]:font-bold [&.active_.nav-icon]:text-tx max-md:min-h-[40px]" data-section="dashboard">
          <span class="nav-icon flex h-4 w-4 shrink-0 items-center justify-center text-inherit [&_svg]:h-[15px] [&_svg]:w-[15px]"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg></span>
          概览
        </button>
        <button class="nav-item relative flex w-full items-center gap-[9px] overflow-hidden rounded-sm border-none bg-transparent px-[11px] py-[9px] text-left text-[.85rem] font-semibold text-tx-2 transition hover:bg-bg-hover hover:text-tx active:scale-[.972] [&.active]:bg-bg-active [&.active]:text-tx [&.active]:font-bold [&.active_.nav-icon]:text-tx max-md:min-h-[40px]" data-section="images">
          <span class="nav-icon flex h-4 w-4 shrink-0 items-center justify-center text-inherit [&_svg]:h-[15px] [&_svg]:w-[15px]"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="1" width="14" height="14" rx="2.5"/><circle cx="5.5" cy="5.5" r="1.5"/><polyline points="1,12 5,8 8,11 11,8 15,12"/></svg></span>
          图库管理
        </button>
        <button class="nav-item relative flex w-full items-center gap-[9px] overflow-hidden rounded-sm border-none bg-transparent px-[11px] py-[9px] text-left text-[.85rem] font-semibold text-tx-2 transition hover:bg-bg-hover hover:text-tx active:scale-[.972] [&.active]:bg-bg-active [&.active]:text-tx [&.active]:font-bold [&.active_.nav-icon]:text-tx max-md:min-h-[40px]" data-section="users">
          <span class="nav-icon flex h-4 w-4 shrink-0 items-center justify-center text-inherit [&_svg]:h-[15px] [&_svg]:w-[15px]"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="5" r="3"/><path d="M1.5 15c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5"/></svg></span>
          用户管理
        </button>
        <button class="nav-item relative flex w-full items-center gap-[9px] overflow-hidden rounded-sm border-none bg-transparent px-[11px] py-[9px] text-left text-[.85rem] font-semibold text-tx-2 transition hover:bg-bg-hover hover:text-tx active:scale-[.972] [&.active]:bg-bg-active [&.active]:text-tx [&.active]:font-bold [&.active_.nav-icon]:text-tx max-md:min-h-[40px]" data-section="pages">
          <span class="nav-icon flex h-4 w-4 shrink-0 items-center justify-center text-inherit [&_svg]:h-[15px] [&_svg]:w-[15px]"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 1h7l4 4v10H3V1z"/><polyline points="10,1 10,5 14,5"/><line x1="4" y1="8" x2="12" y2="8"/><line x1="4" y1="11" x2="9" y2="11"/></svg></span>
          页面管理
        </button>
        <button class="nav-item relative flex w-full items-center gap-[9px] overflow-hidden rounded-sm border-none bg-transparent px-[11px] py-[9px] text-left text-[.85rem] font-semibold text-tx-2 transition hover:bg-bg-hover hover:text-tx active:scale-[.972] [&.active]:bg-bg-active [&.active]:text-tx [&.active]:font-bold [&.active_.nav-icon]:text-tx max-md:min-h-[40px]" data-section="protos">
          <span class="nav-icon flex h-4 w-4 shrink-0 items-center justify-center text-inherit [&_svg]:h-[15px] [&_svg]:w-[15px]"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 2h12v5l-8 8H2V2z"/><line x1="5" y1="2" x2="5" y2="5"/><line x1="8" y1="2" x2="8" y2="4"/><line x1="11" y1="2" x2="11" y2="5"/><line x1="2" y1="5" x2="4" y2="5"/><line x1="2" y1="8" x2="3" y2="8"/><line x1="2" y1="11" x2="4" y2="11"/></svg></span>
          原型管理
        </button>
        <button class="nav-item relative flex w-full items-center gap-[9px] overflow-hidden rounded-sm border-none bg-transparent px-[11px] py-[9px] text-left text-[.85rem] font-semibold text-tx-2 transition hover:bg-bg-hover hover:text-tx active:scale-[.972] [&.active]:bg-bg-active [&.active]:text-tx [&.active]:font-bold [&.active_.nav-icon]:text-tx max-md:min-h-[40px]" data-section="members">
          <span class="nav-icon flex h-4 w-4 shrink-0 items-center justify-center text-inherit [&_svg]:h-[15px] [&_svg]:w-[15px]"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="1,12 5,7 9,9 13,4"/><polyline points="10,4 13,4 13,7"/></svg></span>
          成员统计
        </button>
        <button class="nav-item relative flex w-full items-center gap-[9px] overflow-hidden rounded-sm border-none bg-transparent px-[11px] py-[9px] text-left text-[.85rem] font-semibold text-tx-2 transition hover:bg-bg-hover hover:text-tx active:scale-[.972] [&.active]:bg-bg-active [&.active]:text-tx [&.active]:font-bold [&.active_.nav-icon]:text-tx max-md:min-h-[40px]" data-section="settings">
          <span class="nav-icon flex h-4 w-4 shrink-0 items-center justify-center text-inherit [&_svg]:h-[15px] [&_svg]:w-[15px]"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M12.95 3.05l-1.41 1.41M4.46 11.54l-1.41 1.41"/></svg></span>
          系统设置
        </button>
      </nav>
      <div class="border-t border-bd px-2 pt-1 pb-1.5">
        <a class="flex items-center gap-[9px] rounded-sm px-[10px] py-2 text-[.82rem] text-tx-3 no-underline transition hover:bg-bg-hover hover:text-tx-2" href="/">
          <span class="nav-icon flex h-4 w-4 shrink-0 items-center justify-center text-inherit [&_svg]:h-[15px] [&_svg]:w-[15px]"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="8" x2="2" y2="8"/><polyline points="5,5 2,8 5,11"/><line x1="7" y1="3" x2="14" y2="3"/><line x1="7" y1="13" x2="14" y2="13"/></svg></span>
          前台主页
        </a>
      </div>
      <div class="border-t border-bd px-2 py-[10px]">
        <div class="flex items-center gap-[9px] rounded-md border border-bd bg-bg-3 px-[10px] py-2">
          <div class="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-sm border border-bd-2 bg-gradient-to-br from-[#2e2e2e] to-[#1e1e1e] text-[.78rem] font-bold text-white" id="avatarLetter">A</div>
          <div class="min-w-0 flex-1">
            <div class="truncate text-[.78rem] font-semibold text-tx-2" id="sidebarUsername">admin</div>
            <div class="mt-px text-[.65rem] text-tx-3">Administrator</div>
          </div>
          <button class="shrink-0 cursor-pointer rounded-xs border border-bd bg-transparent px-2 py-1 font-sans text-[.7rem] text-tx-3 transition hover:border-[rgba(248,113,113,.35)] hover:bg-red-g hover:text-red" id="logoutBtn">退出</button>
        </div>
      </div>
      <div class="border-t border-bd px-2 pt-[10px] pb-3">
        <div class="theme-switch flex w-full items-stretch gap-0.5 rounded-md border border-bd-2 bg-bg-2 p-0.5">
          <button class="theme-opt flex flex-1 cursor-pointer items-center justify-center rounded-sm border-none bg-transparent py-[7px] text-tx-3 transition [&.active]:bg-bg-5 [&.active]:text-tx hover:text-tx" data-theme-val="system" title="跟随系统"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="2.5" width="13" height="9" rx="1"/><line x1="5.5" y1="13.5" x2="10.5" y2="13.5"/><line x1="8" y1="11.5" x2="8" y2="13.5"/></svg></button>
          <button class="theme-opt flex flex-1 cursor-pointer items-center justify-center rounded-sm border-none bg-transparent py-[7px] text-tx-3 transition [&.active]:bg-bg-5 [&.active]:text-tx hover:text-tx" data-theme-val="light" title="浅色"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="8" cy="8" r="3"/><line x1="8" y1="1" x2="8" y2="2.3"/><line x1="8" y1="13.7" x2="8" y2="15"/><line x1="1" y1="8" x2="2.3" y2="8"/><line x1="13.7" y1="8" x2="15" y2="8"/><line x1="3.05" y1="3.05" x2="3.96" y2="3.96"/><line x1="12.04" y1="12.04" x2="12.95" y2="12.95"/><line x1="3.05" y1="12.95" x2="3.96" y2="12.04"/><line x1="12.04" y1="3.96" x2="12.95" y2="3.05"/></svg></button>
          <button class="theme-opt flex flex-1 cursor-pointer items-center justify-center rounded-sm border-none bg-transparent py-[7px] text-tx-3 transition [&.active]:bg-bg-5 [&.active]:text-tx hover:text-tx" data-theme-val="dark" title="暗色"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 9.5A6 6 0 1 1 6.5 2.5a5 5 0 0 0 7 7z"/></svg></button>
        </div>
      </div>
    </aside>

    <div class="flex-1 min-w-0 bg-bg ml-0 md:ml-60">

      <!-- ── Dashboard ── -->
      <div class="section active hidden max-w-[1600px] mx-auto px-[18px] pt-[72px] pb-[48px] [&.active]:block md:px-8 md:pt-8 md:pb-12" id="section-dashboard">
        <div class="page-header border-b border-bd mb-6 pb-6 md:mb-8">
          <div class="text-[1.375rem] font-extrabold tracking-[-.03em] text-tx mb-1.5">概览</div>
          <div class="text-sm font-medium text-tx-3">存储用量与访问统计</div>
        </div>
        <div class="stats-row grid grid-cols-2 gap-3 mb-6 sm:grid-cols-[repeat(auto-fit,minmax(190px,1fr))]">
          <div class="stat-card relative overflow-hidden rounded-lg border border-bd bg-bg-3 shadow-none transition py-5 px-[18px] md:pt-6 md:px-[22px] md:pb-5 hover:border-bd-2 hover:bg-bg-4 hover:shadow-[0_1px_0_rgba(255,255,255,.04)_inset,0_4px_16px_rgba(0,0,0,.4)]"><svg class="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 opacity-[.09] pointer-events-none select-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="8" cy="10" r="2"/><path d="M2 17l6-6 4 4 3-3 7 7"/></svg><div class="mb-[11px] text-[.64rem] font-bold uppercase tracking-[.12em] text-tx-2">图片总数</div><div class="font-mono text-[2.05rem] font-bold leading-none tracking-[-.04em] text-tx" id="statImages">—</div><div class="mt-[7px] text-[.75rem] font-medium text-tx-2">张</div><div class="stat-spark mt-2.5 flex items-center gap-1.5 h-[18px]" id="statImagesSpark"></div></div>
          <div class="stat-card relative overflow-hidden rounded-lg border border-bd bg-bg-3 shadow-none transition py-5 px-[18px] md:pt-6 md:px-[22px] md:pb-5 hover:border-bd-2 hover:bg-bg-4 hover:shadow-[0_1px_0_rgba(255,255,255,.04)_inset,0_4px_16px_rgba(0,0,0,.4)]"><svg class="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 opacity-[.09] pointer-events-none select-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/></svg><div class="mb-[11px] text-[.64rem] font-bold uppercase tracking-[.12em] text-tx-2">存储用量</div><div class="font-mono text-[2.05rem] font-bold leading-none tracking-[-.04em] text-tx" id="statSize">—</div><div class="mt-[7px] text-[.75rem] font-medium text-tx-2" id="statSizeUnit"></div><div class="stat-spark mt-2.5 flex items-center gap-1.5 h-[18px]" id="statSizeSpark"></div></div>
          <div class="stat-card relative overflow-hidden rounded-lg border border-bd bg-bg-3 shadow-none transition py-5 px-[18px] md:pt-6 md:px-[22px] md:pb-5 hover:border-bd-2 hover:bg-bg-4 hover:shadow-[0_1px_0_rgba(255,255,255,.04)_inset,0_4px_16px_rgba(0,0,0,.4)]"><svg class="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 opacity-[.09] pointer-events-none select-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18a5 5 0 0 1-1-9.9 6 6 0 0 1 11.3-2A5 5 0 0 1 18 18H7z"/></svg><div class="mb-[11px] text-[.64rem] font-bold uppercase tracking-[.12em] text-tx-2">免费额度剩余</div><div class="font-mono text-[2.05rem] font-bold leading-none tracking-[-.04em] text-tx" id="statFree">—</div><div class="mt-[7px] text-[.75rem] font-medium text-tx-2">GB / 10 GB</div><div class="stat-spark mt-2.5 flex items-center gap-1.5 h-[18px]" id="statFreeSpark"></div></div>
          <div class="stat-card relative overflow-hidden rounded-lg border border-bd bg-bg-3 shadow-none transition py-5 px-[18px] md:pt-6 md:px-[22px] md:pb-5 hover:border-bd-2 hover:bg-bg-4 hover:shadow-[0_1px_0_rgba(255,255,255,.04)_inset,0_4px_16px_rgba(0,0,0,.4)]"><svg class="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 opacity-[.09] pointer-events-none select-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></svg><div class="mb-[11px] text-[.64rem] font-bold uppercase tracking-[.12em] text-tx-2">图片访问次数</div><div class="font-mono text-[2.05rem] font-bold leading-none tracking-[-.04em] text-tx" id="statViews">—</div><div class="mt-[7px] text-[.75rem] font-medium text-tx-2">次</div><div class="stat-spark mt-2.5 flex items-center gap-1.5 h-[18px]" id="statViewsSpark"></div></div>
          <div class="stat-card relative overflow-hidden rounded-lg border border-bd bg-bg-3 shadow-none transition py-5 px-[18px] md:pt-6 md:px-[22px] md:pb-5 hover:border-bd-2 hover:bg-bg-4 hover:shadow-[0_1px_0_rgba(255,255,255,.04)_inset,0_4px_16px_rgba(0,0,0,.4)]"><svg class="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 opacity-[.09] pointer-events-none select-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h9l5 5v15H6V2z"/><path d="M15 2v5h5"/><line x1="9" y1="13" x2="16" y2="13"/><line x1="9" y1="17" x2="16" y2="17"/></svg><div class="mb-[11px] text-[.64rem] font-bold uppercase tracking-[.12em] text-tx-2">托管页面数</div><div class="font-mono text-[2.05rem] font-bold leading-none tracking-[-.04em] text-tx" id="statPages">—</div><div class="mt-[7px] text-[.75rem] font-medium text-tx-2">个</div><div class="stat-spark mt-2.5 flex items-center gap-1.5 h-[18px]" id="statPagesSpark"></div></div>
          <div class="stat-card relative overflow-hidden rounded-lg border border-bd bg-bg-3 shadow-none transition py-5 px-[18px] md:pt-6 md:px-[22px] md:pb-5 hover:border-bd-2 hover:bg-bg-4 hover:shadow-[0_1px_0_rgba(255,255,255,.04)_inset,0_4px_16px_rgba(0,0,0,.4)]"><svg class="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 opacity-[.09] pointer-events-none select-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><polyline points="2,18 9,10 13,14 22,4"/><polyline points="16,4 22,4 22,10"/></svg><div class="mb-[11px] text-[.64rem] font-bold uppercase tracking-[.12em] text-tx-2">页面访问次数</div><div class="font-mono text-[2.05rem] font-bold leading-none tracking-[-.04em] text-tx" id="statPageViews">—</div><div class="mt-[7px] text-[.75rem] font-medium text-tx-2">次</div><div class="stat-spark mt-2.5 flex items-center gap-1.5 h-[18px]" id="statPageViewsSpark"></div></div>
        </div>

        <!-- CF 免费额度 -->
        <div class="mb-6 overflow-hidden rounded-lg border border-bd bg-bg-3">
          <div class="flex items-center gap-[10px] border-b border-bd px-4 py-[13px]">
            <h3 class="m-0 flex items-center gap-1.5 text-[.88rem] font-semibold text-tx"><svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18a5 5 0 0 1-1-9.9 6 6 0 0 1 11.3-2A5 5 0 0 1 18 18H7z"/></svg>Cloudflare 免费额度</h3>
            <span class="rounded-xs border px-2 py-0.5 text-[.63rem] font-semibold font-mono whitespace-nowrap" id="cfSourceBadge">加载中…</span>
            <div class="flex-1"></div>
            <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !px-[10px] !py-1 !text-[.74rem]" onclick="loadCfQuota()"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13.65 4.35A6 6 0 1 0 14 8"/><polyline points="13.5,1.5 13.5,4.5 10.5,4.5"/></svg>刷新</button>
          </div>

          <!-- Workers -->
          <div class="border-b border-bd px-4 py-3 last:border-b-0">
            <div class="mb-[10px] flex items-center gap-1 text-[.59rem] font-bold uppercase tracking-[.12em] text-tx-3"><svg class="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="13,2 4,14 11,14 10,22 20,9 13,9 13,2"/></svg>Workers 计算</div>
            <div class="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-[9px]">
              <div class="rounded-sm border border-bd bg-bg-2 px-[13px] py-[11px]">
                <div class="mb-[5px] flex items-start justify-between gap-1.5">
                  <span class="text-[.7rem] font-medium leading-[1.3] text-tx-2">请求次数（今日）</span>
                  <span class="mt-px shrink-0 whitespace-nowrap rounded-[3px] border border-bd bg-bg-5 px-[5px] py-px font-mono text-[.57rem] text-tx-3" id="cfReqMethod">1% 采样 × 100</span>
                </div>
                <div class="mb-[3px] font-mono text-[1.3rem] font-bold leading-none text-tx" id="cfReqVal">—</div>
                <div class="mb-[5px] text-[.62rem] text-tx-3 [&_strong]:text-tx-2">上限 <strong>10 万次</strong> / 天</div>
                <div class="h-[3px] rounded-sm bg-bd overflow-hidden"><div class="cf-fill h-[3px] rounded-sm overflow-hidden bg-brand transition-[width] duration-500 ease-in-out [&.warn]:bg-amber [&.full]:bg-red" id="cfReqBar" style="width:0%"></div></div>
                <div class="flex justify-between mt-[3px]">
                  <span class="text-[.6rem] text-tx-3" id="cfReqPct">0%</span>
                  <span class="text-[.6rem] text-tx-3">剩余 <span id="cfReqLeft">—</span></span>
                </div>
              </div>
            </div>
          </div>

          <!-- R2 Storage -->
          <div class="border-b border-bd px-4 py-3 last:border-b-0">
            <div class="mb-[10px] flex items-center gap-1 text-[.59rem] font-bold uppercase tracking-[.12em] text-tx-3"><svg class="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/></svg>R2 对象存储</div>
            <div class="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-[9px]">
              <div class="rounded-sm border border-bd bg-bg-2 px-[13px] py-[11px]">
                <div class="mb-[5px] flex items-start justify-between gap-1.5">
                  <span class="text-[.7rem] font-medium leading-[1.3] text-tx-2">存储用量</span>
                  <span class="mt-px shrink-0 whitespace-nowrap rounded-[3px] border border-bd bg-bg-5 px-[5px] py-px font-mono text-[.57rem] text-tx-3">精确实时</span>
                </div>
                <div class="mb-[3px] font-mono text-[1.3rem] font-bold leading-none text-tx" id="cfStorageVal">—</div>
                <div class="mb-[5px] text-[.62rem] text-tx-3 [&_strong]:text-tx-2">上限 <strong>10 GB</strong></div>
                <div class="h-[3px] rounded-sm bg-bd overflow-hidden"><div class="cf-fill h-[3px] rounded-sm overflow-hidden bg-brand transition-[width] duration-500 ease-in-out [&.warn]:bg-amber [&.full]:bg-red" id="cfStorageBar" style="width:0%"></div></div>
                <div class="flex justify-between mt-[3px]">
                  <span class="text-[.6rem] text-tx-3" id="cfStoragePct">0%</span>
                  <span class="text-[.6rem] text-tx-3">剩余 <span id="cfStorageLeft">—</span></span>
                </div>
              </div>
              <div class="rounded-sm border border-bd bg-bg-2 px-[13px] py-[11px]">
                <div class="mb-[5px] flex items-start justify-between gap-1.5">
                  <span class="text-[.7rem] font-medium leading-[1.3] text-tx-2">A 类操作（本月）</span>
                  <span class="mt-px shrink-0 whitespace-nowrap rounded-[3px] border border-bd bg-bg-5 px-[5px] py-px font-mono text-[.57rem] text-tx-3">实时追踪</span>
                </div>
                <div class="mb-[3px] font-mono text-[1.3rem] font-bold leading-none text-tx" id="cfR2AVal">—</div>
                <div class="mb-[5px] text-[.62rem] text-tx-3 [&_strong]:text-tx-2">上限 <strong>100 万次</strong> / 月</div>
                <div class="h-[3px] rounded-sm bg-bd overflow-hidden"><div class="cf-fill h-[3px] rounded-sm overflow-hidden bg-brand transition-[width] duration-500 ease-in-out [&.warn]:bg-amber [&.full]:bg-red" id="cfR2ABar" style="width:0%"></div></div>
                <div class="flex justify-between mt-[3px]">
                  <span class="text-[.6rem] text-tx-3" id="cfR2APct">0%</span>
                  <span class="text-[.6rem] text-tx-3">剩余 <span id="cfR2ALeft">—</span></span>
                </div>
              </div>
              <div class="rounded-sm border border-bd bg-bg-2 px-[13px] py-[11px]">
                <div class="mb-[5px] flex items-start justify-between gap-1.5">
                  <span class="text-[.7rem] font-medium leading-[1.3] text-tx-2">B 类操作（本月）</span>
                  <span class="mt-px shrink-0 whitespace-nowrap rounded-[3px] border border-bd bg-bg-5 px-[5px] py-px font-mono text-[.57rem] text-tx-3">部分追踪</span>
                </div>
                <div class="mb-[3px] font-mono text-[1.3rem] font-bold leading-none text-tx" id="cfR2BVal">—</div>
                <div class="mb-[5px] text-[.62rem] text-tx-3 [&_strong]:text-tx-2">上限 <strong>1000 万次</strong> / 月</div>
                <div class="h-[3px] rounded-sm bg-bd overflow-hidden"><div class="cf-fill h-[3px] rounded-sm overflow-hidden bg-brand transition-[width] duration-500 ease-in-out [&.warn]:bg-amber [&.full]:bg-red" id="cfR2BBar" style="width:0%"></div></div>
                <div class="flex justify-between mt-[3px]">
                  <span class="text-[.6rem] text-tx-3" id="cfR2BPct">0%</span>
                  <span class="text-[.6rem] text-tx-3">剩余 <span id="cfR2BLeft">—</span></span>
                </div>
              </div>
            </div>
          </div>

          <!-- KV -->
          <div class="border-b border-bd px-4 py-3 last:border-b-0">
            <div class="mb-[10px] flex items-center gap-1 text-[.59rem] font-bold uppercase tracking-[.12em] text-tx-3"><svg class="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="6" rx="1"/><rect x="3" y="10" width="18" height="6" rx="1"/><rect x="3" y="17" width="18" height="4" rx="1"/><line x1="6" y1="6" x2="6" y2="6"/></svg>Workers KV（STATS 命名空间，日限额独立计算）</div>
            <div class="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-[9px]">
              <div class="rounded-sm border border-bd bg-bg-2 px-[13px] py-[11px]">
                <div class="mb-[5px] flex items-start justify-between gap-1.5">
                  <span class="text-[.7rem] font-medium leading-[1.3] text-tx-2">KV 读取</span>
                  <span class="mt-px shrink-0 whitespace-nowrap rounded-[3px] border border-bd bg-bg-5 px-[5px] py-px font-mono text-[.57rem] text-tx-3" id="cfKvReadsMethod">本月</span>
                </div>
                <div class="mb-[3px] font-mono text-[1.3rem] font-bold leading-none text-tx" id="cfKvReads">—</div>
              <div class="mb-[5px] text-[.62rem] text-tx-3 [&_strong]:text-tx-2">日限 <strong>10 万次</strong>　今日 <span class="text-tx-2" id="cfKvReadsToday">—</span></div>
                <div class="h-[3px] rounded-sm bg-bd overflow-hidden"><div class="cf-fill h-[3px] rounded-sm overflow-hidden bg-brand transition-[width] duration-500 ease-in-out [&.warn]:bg-amber [&.full]:bg-red" id="cfKvReadsBar" style="width:0%"></div></div>
                <div class="flex justify-between mt-[3px]">
                  <span class="text-[.6rem] text-tx-3" id="cfKvReadsPct">均值/日</span>
                  <span class="text-[.6rem] text-tx-3" id="cfKvReadsAvg">—</span>
                </div>
              </div>
              <div class="rounded-sm border border-bd bg-bg-2 px-[13px] py-[11px]">
                <div class="mb-[5px] flex items-start justify-between gap-1.5">
                  <span class="text-[.7rem] font-medium leading-[1.3] text-tx-2">KV 写入</span>
                  <span class="mt-px shrink-0 whitespace-nowrap rounded-[3px] border border-bd bg-bg-5 px-[5px] py-px font-mono text-[.57rem] text-tx-3" id="cfKvWritesMethod">本月</span>
                </div>
                <div class="mb-[3px] font-mono text-[1.3rem] font-bold leading-none text-tx" id="cfKvWrites">—</div>
                <div class="mb-[5px] text-[.62rem] text-tx-3 [&_strong]:text-tx-2">日限 <strong>1,000 次</strong>　今日 <span class="text-tx-2" id="cfKvWritesToday">—</span></div>
                <div class="h-[3px] rounded-sm bg-bd overflow-hidden"><div class="cf-fill h-[3px] rounded-sm overflow-hidden bg-brand transition-[width] duration-500 ease-in-out [&.warn]:bg-amber [&.full]:bg-red" id="cfKvWritesBar" style="width:0%"></div></div>
                <div class="flex justify-between mt-[3px]">
                  <span class="text-[.6rem] text-tx-3" id="cfKvWritesPct">均值/日</span>
                  <span class="text-[.6rem] text-tx-3" id="cfKvWritesAvg">—</span>
                </div>
              </div>
              <div class="rounded-sm border border-bd bg-bg-2 px-[13px] py-[11px]">
                <div class="mb-[5px] flex items-start justify-between gap-1.5">
                  <span class="text-[.7rem] font-medium leading-[1.3] text-tx-2">KV 列表</span>
                  <span class="mt-px shrink-0 whitespace-nowrap rounded-[3px] border border-bd bg-bg-5 px-[5px] py-px font-mono text-[.57rem] text-tx-3" id="cfKvListsMethod">本月</span>
                </div>
                <div class="mb-[3px] font-mono text-[1.3rem] font-bold leading-none text-tx" id="cfKvLists">—</div>
                <div class="mb-[5px] text-[.62rem] text-tx-3 [&_strong]:text-tx-2">日限 <strong>1,000 次</strong>　今日 <span class="text-tx-2" id="cfKvListsToday">—</span></div>
                <div class="h-[3px] rounded-sm bg-bd overflow-hidden"><div class="cf-fill h-[3px] rounded-sm overflow-hidden bg-brand transition-[width] duration-500 ease-in-out [&.warn]:bg-amber [&.full]:bg-red" id="cfKvListsBar" style="width:0%"></div></div>
                <div class="flex justify-between mt-[3px]">
                  <span class="text-[.6rem] text-tx-3" id="cfKvListsPct">均值/日</span>
                  <span class="text-[.6rem] text-tx-3" id="cfKvListsAvg">—</span>
                </div>
              </div>
              <div class="rounded-sm border border-bd bg-bg-2 px-[13px] py-[11px]">
                <div class="mb-[5px] flex items-start justify-between gap-1.5">
                  <span class="text-[.7rem] font-medium leading-[1.3] text-tx-2">KV 删除</span>
                  <span class="mt-px shrink-0 whitespace-nowrap rounded-[3px] border border-bd bg-bg-5 px-[5px] py-px font-mono text-[.57rem] text-tx-3" id="cfKvDeletesMethod">本月</span>
                </div>
                <div class="mb-[3px] font-mono text-[1.3rem] font-bold leading-none text-tx" id="cfKvDeletes">—</div>
                <div class="mb-[5px] text-[.62rem] text-tx-3 [&_strong]:text-tx-2">日限 <strong>1,000 次</strong>　今日 <span class="text-tx-2" id="cfKvDeletesToday">—</span></div>
                <div class="h-[3px] rounded-sm bg-bd overflow-hidden"><div class="cf-fill h-[3px] rounded-sm overflow-hidden bg-brand transition-[width] duration-500 ease-in-out [&.warn]:bg-amber [&.full]:bg-red" id="cfKvDeletesBar" style="width:0%"></div></div>
                <div class="flex justify-between mt-[3px]">
                  <span class="text-[.6rem] text-tx-3" id="cfKvDeletesPct">均值/日</span>
                  <span class="text-[.6rem] text-tx-3" id="cfKvDeletesAvg">—</span>
                </div>
              </div>
            </div>
            <div class="hidden"><span id="cfKvKeys"></span><span id="cfDay"></span><span id="cfMonth"></span></div>
            <div class="mt-[10px] px-[13px] py-[10px] bg-amber-g border border-amber-r rounded-[7px] text-[.73rem] text-tx-2 leading-[1.6]" id="cfApiPrompt" style="display:none">
              <svg class="inline-block h-3.5 w-3.5 -mt-0.5 mr-0.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1.5 15 14H1L8 1.5z"/><line x1="8" y1="6" x2="8" y2="9.5"/><circle cx="8" cy="11.5" r=".2" fill="currentColor"/></svg>未配置 CF API Token，KV 数据不可用。运行以下命令设置后重新部署：<br>
              <code class="inline-block mt-1 bg-bg px-2 py-[3px] rounded font-mono text-[.75rem] text-tx-a">wrangler secret put CF_API_TOKEN</code><br>
              <span class="text-tx-3">权限选 <strong class="text-tx-2">Account Analytics: Read</strong></span>
            </div>
            <div class="mt-[10px] text-[.65rem] leading-[1.6] text-tx-3 [&_a]:text-tx-a [&_a]:no-underline [&_a:hover]:underline pt-[10px]">
              <svg class="inline-block h-3.5 w-3.5 -mt-0.5 mr-0.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6.5"/><line x1="8" y1="7" x2="8" y2="11.5"/><circle cx="8" cy="4.7" r=".2" fill="currentColor"/></svg>R2 存储为实时精确扫描；R2 A/B 类操作及 KV 数据需配置 CF API Token 才能获取精确值；KV 限额为每日独立计算，进度条显示月均日用量占日限比例。
              <a href="https://dash.cloudflare.com" target="_blank" rel="noopener">CF 控制台 <svg class="inline-block h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="12" y2="4"/><polyline points="5,4 12,4 12,11"/></svg></a>
            </div>
          </div>
        </div>

        <!-- hidden R2 DOM nodes kept for JS compatibility -->
        <div style="display:none">
          <span id="r2Storage"></span><span id="r2Objects"></span><span id="r2Writes"></span>
          <span id="r2Reads"></span><span id="r2FreeGb"></span><span id="r2Members"></span>
          <span id="r2FreeBar"></span><span id="r2DonutArc"></span><span id="r2DonutLabel"></span>
        </div>

        <!-- ── 访问统计 Tabs ── -->
        <div class="dash-tabs-panel mt-6 overflow-hidden rounded-lg border border-bd bg-bg-3">
          <div class="dash-tabs-hd flex items-stretch border-b border-bd-2 bg-bg-2 px-3">
            <div class="dash-tabs-nav flex items-stretch">
              <button class="dash-tab active relative flex items-center gap-[7px] whitespace-nowrap border-b-2 border-transparent bg-transparent px-[15px] py-[11px] -mb-px font-sans text-[.82rem] font-semibold text-tx-2 cursor-pointer transition hover:bg-white/[.035] hover:text-tx [&.active]:border-b-tx [&.active]:text-tx [&.active]:font-bold [&.active_.dash-tab-count]:bg-white/[.12] [&.active_.dash-tab-count]:text-tx [&.active_.dash-tab-count]:border-bd-2" data-dash-tab="images">
                <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="8" cy="10" r="2"/><path d="M2 17l6-6 4 4 3-3 7 7"/></svg>图片 <span class="dash-tab-count rounded-md border border-bd bg-bg-5 px-[7px] py-px font-mono text-[.65rem] font-bold leading-[1.5] text-tx-2 transition" id="dashImgCount">—</span>
              </button>
              <button class="dash-tab relative flex items-center gap-[7px] whitespace-nowrap border-b-2 border-transparent bg-transparent px-[15px] py-[11px] -mb-px font-sans text-[.82rem] font-semibold text-tx-2 cursor-pointer transition hover:bg-white/[.035] hover:text-tx [&.active]:border-b-tx [&.active]:text-tx [&.active]:font-bold [&.active_.dash-tab-count]:bg-white/[.12] [&.active_.dash-tab-count]:text-tx [&.active_.dash-tab-count]:border-bd-2" data-dash-tab="pages">
                <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h9l5 5v15H6V2z"/><path d="M15 2v5h5"/><line x1="9" y1="13" x2="16" y2="13"/><line x1="9" y1="17" x2="16" y2="17"/></svg>页面 <span class="dash-tab-count rounded-md border border-bd bg-bg-5 px-[7px] py-px font-mono text-[.65rem] font-bold leading-[1.5] text-tx-2 transition" id="dashPgCount">—</span>
              </button>
              <button class="dash-tab relative flex items-center gap-[7px] whitespace-nowrap border-b-2 border-transparent bg-transparent px-[15px] py-[11px] -mb-px font-sans text-[.82rem] font-semibold text-tx-2 cursor-pointer transition hover:bg-white/[.035] hover:text-tx [&.active]:border-b-tx [&.active]:text-tx [&.active]:font-bold [&.active_.dash-tab-count]:bg-white/[.12] [&.active_.dash-tab-count]:text-tx [&.active_.dash-tab-count]:border-bd-2" data-dash-tab="protos">
                <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 2h12v5l-8 8H2V2z"/><line x1="5" y1="2" x2="5" y2="5"/><line x1="8" y1="2" x2="8" y2="4"/><line x1="11" y1="2" x2="11" y2="5"/></svg>原型 <span class="dash-tab-count rounded-md border border-bd bg-bg-5 px-[7px] py-px font-mono text-[.65rem] font-bold leading-[1.5] text-tx-2 transition" id="dashProtoCount">—</span>
              </button>
            </div>
            <span class="dash-tab-hint ml-auto self-center pr-1 text-[.68rem] font-medium text-tx-2">Top 10 · 按访问量排序</span>
          </div>

          <div class="dash-tab-pane active hidden [&.active]:block" id="dashTabImages">
            <div class="table-wrap overflow-hidden rounded-lg border border-bd bg-bg-3 !rounded-none !border-none">
              <table class="data-table w-full border-collapse text-[.83rem] [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-bd-2 [&_th]:bg-bg-2 [&_th]:px-[13px] [&_th]:py-[10px] [&_th]:text-left [&_th]:text-[.66rem] [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-[.11em] [&_th]:text-tx-2 [&_td]:border-b [&_td]:border-bd [&_td]:px-[13px] [&_td]:py-[10px] [&_td]:align-middle [&_td]:text-tx [&_tr:last-child_td]:border-b-0 [&_tbody_tr:hover_td]:bg-bg-hover">
                <thead><tr><th>图片</th><th>文件名</th><th>类型</th><th>总访问</th><th>最后访问</th><th></th></tr></thead>
                <tbody id="topImagesBody"><tr><td colspan="6" class="text-center text-tx-3 p-8">加载中…</td></tr></tbody>
              </table>
            </div>
          </div>

          <div class="dash-tab-pane hidden [&.active]:block" id="dashTabPages">
            <div class="table-wrap overflow-hidden rounded-lg border border-bd bg-bg-3 !rounded-none !border-none">
              <table class="data-table w-full border-collapse text-[.83rem] [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-bd-2 [&_th]:bg-bg-2 [&_th]:px-[13px] [&_th]:py-[10px] [&_th]:text-left [&_th]:text-[.66rem] [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-[.11em] [&_th]:text-tx-2 [&_td]:border-b [&_td]:border-bd [&_td]:px-[13px] [&_td]:py-[10px] [&_td]:align-middle [&_td]:text-tx [&_tr:last-child_td]:border-b-0 [&_tbody_tr:hover_td]:bg-bg-hover">
                <thead><tr><th>标题 / Slug</th><th>类型</th><th>总访问</th><th>最后访问</th><th></th></tr></thead>
                <tbody id="topPagesBody"><tr><td colspan="5" class="text-center text-tx-3 p-8">加载中…</td></tr></tbody>
              </table>
            </div>
          </div>

          <div class="dash-tab-pane hidden [&.active]:block" id="dashTabProtos">
            <div class="table-wrap overflow-hidden rounded-lg border border-bd bg-bg-3 !rounded-none !border-none">
              <table class="data-table w-full border-collapse text-[.83rem] [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-bd-2 [&_th]:bg-bg-2 [&_th]:px-[13px] [&_th]:py-[10px] [&_th]:text-left [&_th]:text-[.66rem] [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-[.11em] [&_th]:text-tx-2 [&_td]:border-b [&_td]:border-bd [&_td]:px-[13px] [&_td]:py-[10px] [&_td]:align-middle [&_td]:text-tx [&_tr:last-child_td]:border-b-0 [&_tbody_tr:hover_td]:bg-bg-hover">
                <thead><tr><th>名称</th><th>类型</th><th>作者</th><th>总访问</th><th>最后访问</th><th></th></tr></thead>
                <tbody id="topProtosBody"><tr><td colspan="6" class="text-center text-tx-3 p-8">加载中…</td></tr></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Images ── -->
      <div class="section hidden max-w-[1600px] mx-auto px-[18px] pt-[72px] pb-[48px] [&.active]:block md:px-8 md:pt-8 md:pb-12" id="section-images">
        <div class="page-header border-b border-bd mb-6 pb-6 md:mb-8">
          <div class="text-[1.375rem] font-extrabold tracking-[-.03em] text-tx mb-1.5">图库管理</div>
          <div class="text-sm font-medium text-tx-3">查看、删除图片及访问统计</div>
        </div>
        <h3 class="mb-3 text-[.8rem] font-semibold text-tx-2">所有图片</h3>
        <div class="toolbar flex flex-wrap items-center gap-[10px] mb-3">
          <input class="w-[210px] rounded-sm border border-bd bg-bg-3 px-[11px] py-[7px] font-sans text-[.83rem] text-tx outline-none transition focus:border-bd-focus focus:shadow-[0_0_0_3px_var(--color-brand-muted)]" id="gallerySearch" type="text" placeholder="搜索文件名…">
          <div class="flex-1"></div>
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="selectAllBtn">全选</button>
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="refreshGallery"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13.65 4.35A6 6 0 1 0 14 8"/><polyline points="13.5,1.5 13.5,4.5 10.5,4.5"/></svg>刷新</button>
        </div>
        <div class="bulk-bar hidden flex-wrap items-center gap-[10px] mb-3 rounded-md border border-bd-2 bg-bg-3 px-[13px] py-[9px] text-[.82rem] text-tx-2 [&.show]:flex" id="bulkBar">
          <span id="bulkCount"></span>
          <div class="flex-1"></div>
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="bulkCopyBtn">批量复制</button>
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-red-r bg-red-g px-3 py-1.5 text-sm font-semibold leading-tight text-red transition hover:bg-red-r" id="bulkDeleteBtn">批量删除</button>
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="clearSelectBtn">取消</button>
        </div>
        <div class="overflow-hidden rounded-lg border border-bd bg-bg-3">
          <div class="gallery-grid grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-3 md:gap-4 p-3" id="galleryGrid"></div>
          <div class="py-[60px] text-center text-[.86rem] text-tx-3" id="galleryEmpty" style="display:none">${EMPTY_ILLUS}暂无图片</div>
          <div class="mt-[22px] flex justify-center pb-3" id="loadMoreWrap" style="display:none">
            <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="loadMoreBtn">加载更多</button>
          </div>
        </div>
      </div>

      <!-- ── Users ── -->
      <div class="section hidden max-w-[1600px] mx-auto px-[18px] pt-[72px] pb-[48px] [&.active]:block md:px-8 md:pt-8 md:pb-12" id="section-users">
        <div class="page-header border-b border-bd mb-6 pb-6 md:mb-8">
          <div class="text-[1.375rem] font-extrabold tracking-[-.03em] text-tx mb-1.5">用户管理</div>
          <div class="text-sm font-medium text-tx-3">创建账号并设置上传权限</div>
        </div>
        <h3 class="mb-3 text-[.8rem] font-semibold text-tx-2">所有账号</h3>
        <div class="toolbar flex flex-wrap items-center gap-[10px] mb-3">
          <div class="min-w-[20px] flex-1"></div>
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-transparent bg-accent px-3 py-1.5 text-sm font-semibold leading-tight text-tx-inv transition hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(255,255,255,.08)] disabled:cursor-not-allowed disabled:bg-bg-5 disabled:text-tx-3 disabled:shadow-none" id="createUserBtn">+ 新建用户</button>
        </div>
        <div class="overflow-auto rounded-lg border border-bd bg-bg-3">
          <table class="data-table w-full border-collapse text-[.83rem] [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-bd-2 [&_th]:bg-bg-2 [&_th]:px-[13px] [&_th]:py-[10px] [&_th]:text-left [&_th]:text-[.66rem] [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-[.11em] [&_th]:text-tx-2 [&_td]:border-b [&_td]:border-bd [&_td]:px-[13px] [&_td]:py-[10px] [&_td]:align-middle [&_td]:text-tx [&_tr:last-child_td]:border-b-0 [&_tbody_tr:hover_td]:bg-bg-hover">
            <thead><tr><th>用户名</th><th>权限</th><th>上传统计</th><th>限制</th><th>登录状态</th><th>操作</th></tr></thead>
            <tbody id="usersBody"><tr><td colspan="6" class="text-center text-tx-3 p-6">加载中…</td></tr></tbody>
          </table>
        </div>
      </div>

      <!-- ── Pages ── -->
      <div class="section hidden max-w-[1200px] mx-auto px-[18px] pt-[72px] pb-[48px] [&.active]:block md:px-8 md:pt-8 md:pb-12" id="section-pages">
        <div class="page-header border-b border-bd mb-6 pb-6 md:mb-8">
          <div class="text-[1.375rem] font-extrabold tracking-[-.03em] text-tx mb-1.5">页面管理</div>
          <div class="text-sm font-medium text-tx-3">托管的 MD / HTML 文档</div>
        </div>
        <h3 class="mb-3 text-[.8rem] font-semibold text-tx-2">所有页面</h3>
        <div class="toolbar flex flex-wrap items-center gap-[10px] mb-3">
          <input class="w-[210px] rounded-sm border border-bd bg-bg-3 px-[11px] py-[7px] font-sans text-[.83rem] text-tx outline-none transition focus:border-bd-focus focus:shadow-[0_0_0_3px_var(--color-brand-muted)] !max-w-[200px]" id="adminPageSearch" type="text" placeholder="搜索标题/slug/作者…">
          <div class="inline-flex items-center gap-1">
            <select class="max-w-[140px] cursor-pointer rounded-sm border border-bd bg-bg-3 px-2 py-1.5 font-sans text-[.76rem] text-tx outline-none transition focus:border-bd-focus [&_option]:bg-bg-3 [&_option]:text-tx ml-2" id="adminPageProjFilter"><option value="all">全部项目</option></select>
            <span class="inline-flex items-center gap-[3px]" id="adminProjActions"></span>
          </div>
          <div class="inline-flex items-center gap-1">
            <select class="max-w-[140px] cursor-pointer rounded-sm border border-bd bg-bg-3 px-2 py-1.5 font-sans text-[.76rem] text-tx outline-none transition focus:border-bd-focus [&_option]:bg-bg-3 [&_option]:text-tx ml-1" id="adminPageGrpFilter"><option value="all">全部分组</option></select>
            <span class="inline-flex items-center gap-[3px]" id="adminGrpActions"></span>
          </div>
          <select class="max-w-[140px] cursor-pointer rounded-sm border border-bd bg-bg-3 px-2 py-1.5 font-sans text-[.76rem] text-tx outline-none transition focus:border-bd-focus [&_option]:bg-bg-3 [&_option]:text-tx ml-1" id="adminPageTypeFilter"><option value="all">全部类型</option><option value="markdown">Markdown</option><option value="html">HTML</option></select>
          <div class="min-w-[20px] flex-1"></div>
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !text-[.78rem]" id="pageSelectToggle">选择</button>
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !text-[.78rem]" id="adminImportBtn">导入</button>
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !text-[.78rem]" id="adminNewProjectBtn">+ 新建项目</button>
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !text-[.78rem]" id="adminNewGroupBtn">+ 新建分组</button>
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-transparent bg-accent px-3 py-1.5 text-sm font-semibold leading-tight text-tx-inv transition hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(255,255,255,.08)] disabled:cursor-not-allowed disabled:bg-bg-5 disabled:text-tx-3 disabled:shadow-none" id="adminNewPageBtn">+ 新建页面</button>
        </div>
        <div class="pg-bulk-bar hidden flex-wrap items-center gap-[10px] mb-3 rounded-md border border-bd-2 bg-bg-3 px-[13px] py-[9px] text-[.82rem] text-tx-2" id="adminPageBulkBar">
          <span class="font-mono text-[.8rem] text-tx-3" id="adminPageSelCount">已选 0</span>
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-red-r bg-red-g px-3 py-1.5 text-sm font-semibold leading-tight text-red transition hover:bg-red-r !px-[10px] !py-1 !text-[.76rem]" id="adminPageBulkDelete">批量删除</button>
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !px-[10px] !py-1 !text-[.76rem]" id="adminPageBulkMove">更改项目/分组</button>
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !px-[10px] !py-1 !text-[.76rem]" id="adminPageBulkPublic">设为公开</button>
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !px-[10px] !py-1 !text-[.76rem]" id="adminPageBulkPrivate">设为私密</button>
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !px-[10px] !py-1 !text-[.76rem]" id="adminPageCancelSel">取消</button>
        </div>
        <div class="pg-reorder-hint mb-2 text-[.72rem] text-tx-3" id="adminPageReorderHint">拖动 <span class="text-tx-2">⠿</span> 手柄排序，拖到不同项目/分组行可移动页面</div>
        <div class="table-wrap overflow-x-auto rounded-lg border border-bd bg-bg-3">
          <table class="data-table w-full border-collapse text-[.82rem] [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-bd-2 [&_th]:bg-bg-2 [&_th]:px-[10px] [&_th]:py-[8px] [&_th]:text-left [&_th]:text-[.64rem] [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-[.1em] [&_th]:text-tx-2 [&_td]:border-b [&_td]:border-bd [&_td]:px-[10px] [&_td]:py-[7px] [&_td]:align-middle [&_td]:text-tx [&_tr:last-child_td]:border-b-0 [&_tbody_tr:hover_td]:bg-bg-hover">
            <thead><tr>
              <th class="pg-drag-col hidden w-[28px] text-center [&.scoped]:table-cell" id="pgDragHead"></th>
              <th class="pg-check-col hidden w-[34px] text-center [&.selecting]:table-cell" id="pgCheckHead"><input type="checkbox" class="h-[15px] w-[15px] cursor-pointer accent-tx-2" id="adminPageSelectAll"></th>
              <th class="w-[26%] cursor-pointer select-none hover:text-tx-2" onclick="adminPageSort('title')">标题 / Slug</th>
              <th class="w-[48px] cursor-pointer select-none hover:text-tx-2" onclick="adminPageSort('type')">类型</th>
              <th class="w-[64px] cursor-pointer select-none hover:text-tx-2" onclick="adminPageSort('owner')">作者</th>
              <th class="w-[80px]">项目</th><th class="w-[80px]">分组</th>
              <th class="w-[44px] cursor-pointer select-none hover:text-tx-2" onclick="adminPageSort('status')">状态</th>
              <th class="w-[64px] cursor-pointer select-none hover:text-tx-2" onclick="adminPageSort('updated')">更新</th>
              <th class="w-[1%] whitespace-nowrap"></th>
            </tr></thead>
            <tbody id="adminPagesBody"><tr><td colspan="10" class="text-center text-tx-3 p-6">加载中…</td></tr></tbody>
          </table>
        </div>
      </div>

      <!-- ── Protos ── -->
      <div class="section hidden max-w-[1600px] mx-auto px-[18px] pt-[72px] pb-[48px] [&.active]:block md:px-8 md:pt-8 md:pb-12" id="section-protos">
        <div class="page-header border-b border-bd mb-6 pb-6 md:mb-8">
          <div class="text-[1.375rem] font-extrabold tracking-[-.03em] text-tx mb-1.5">原型管理</div>
          <div class="text-sm font-medium text-tx-3">AxureRP / HTML 原型文件托管</div>
        </div>

        <!-- Upload UI -->
        <div class="proto-upload-card mb-[18px] rounded-lg border border-bd bg-bg-3 p-[18px]">
          <h3 class="mb-3.5 border-b border-bd pb-[10px] text-[.65rem] font-bold uppercase tracking-[.12em] text-tx-3">上传新原型</h3>
          <div id="adminProtoDropZone" class="proto-drop-zone flex cursor-pointer flex-col items-center gap-[7px] rounded-md border-[1.5px] border-dashed border-bd-2 bg-bg-2 px-5 py-5 text-center transition mb-[10px] hover:border-brand hover:bg-brand-muted" onclick="document.getElementById('adminProtoFileInput').click()">
            <svg class="h-6 w-6 text-tx-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 7v10l10 5 10-5V7L12 2z"/><polyline points="2,7 12,12 22,7"/><line x1="12" y1="12" x2="12" y2="22"/></svg>
            <div class="text-[.82rem] font-medium text-tx-2" id="adminProtoDropText">点击选择 ZIP 文件</div>
            <div class="text-[.7rem] text-tx-3">或拖拽至此 · 最大 50 MB</div>
          </div>
          <input class="hidden" type="file" id="adminProtoFileInput" accept=".zip,application/zip">
          <input class="hidden" type="file" id="adminProtoFolderInput" webkitdirectory>
          <div class="proto-field-row grid grid-cols-2 gap-[10px] mb-[10px]">
            <div class="flex flex-col gap-[5px] mb-3.5 !m-0"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">原型名称</label><input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:shadow-[var(--focus-ring)]" type="text" id="adminProtoTitle" placeholder="My Prototype"></div>
            <div class="flex flex-col gap-[5px] mb-3.5 !m-0"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">访问密码（可选，6位）</label><input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:shadow-[var(--focus-ring)] font-mono tracking-[.12em]" type="text" id="adminProtoPassword" placeholder="留空则公开访问" maxlength="6"></div>
          </div>
          <div class="proto-prog hidden h-[5px] overflow-hidden rounded-xs bg-bd [&.show]:block" id="adminProtoProgress"><div class="proto-prog-bar h-[5px] w-0 rounded-xs bg-[linear-gradient(90deg,var(--color-brand-d),var(--color-brand))] transition-[width] duration-[.4s]" id="adminProtoProgressBar"></div></div>
          <div class="proto-prog-info hidden items-center justify-between mt-[5px] text-[.7rem] text-tx-3 [&.show]:flex" id="adminProtoProgressInfo">
            <span class="hidden" id="adminProtoStatusText"></span>
            <span id="adminProtoProgressPct">0%</span>
          </div>
          <div class="proto-err mt-1 min-h-[16px] text-[.76rem] text-red" id="adminProtoErr"></div>
          <div class="proto-upload-actions flex flex-wrap items-center gap-[7px]">
            <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-transparent bg-accent px-3 py-1.5 text-sm font-semibold leading-tight text-tx-inv transition hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(255,255,255,.08)] disabled:cursor-not-allowed disabled:bg-bg-5 disabled:text-tx-3 disabled:shadow-none" id="adminProtoUploadBtn" disabled>上传原型</button>
            <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" onclick="document.getElementById('adminProtoFolderInput').click()">选择文件夹</button>
          </div>
        </div>

        <h3 class="mb-3 text-[.8rem] font-semibold text-tx-2">所有原型</h3>
        <div class="toolbar flex flex-wrap items-center gap-[10px] mb-3">
          <div class="min-w-[20px] flex-1"></div>
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="refreshAdminProtos"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13.65 4.35A6 6 0 1 0 14 8"/><polyline points="13.5,1.5 13.5,4.5 10.5,4.5"/></svg>刷新</button>
        </div>
        <div class="table-wrap overflow-hidden rounded-lg border border-bd bg-bg-3">
          <table class="data-table w-full border-collapse text-[.83rem] [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-bd-2 [&_th]:bg-bg-2 [&_th]:px-[13px] [&_th]:py-[10px] [&_th]:text-left [&_th]:text-[.66rem] [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-[.11em] [&_th]:text-tx-2 [&_td]:border-b [&_td]:border-bd [&_td]:px-[13px] [&_td]:py-[10px] [&_td]:align-middle [&_td]:text-tx [&_tr:last-child_td]:border-b-0 [&_tbody_tr:hover_td]:bg-bg-hover">
            <thead><tr><th>名称</th><th>作者</th><th>文件数</th><th>大小</th><th>密码</th><th>版本</th><th>访问</th><th>上传时间</th><th>更新时间</th><th></th></tr></thead>
            <tbody id="adminProtosBody"><tr><td colspan="10" class="text-center text-tx-3 p-6">加载中…</td></tr></tbody>
          </table>
        </div>
        <div class="py-[60px] text-center text-[.86rem] text-tx-3" id="adminProtosEmpty" style="display:none">${EMPTY_ILLUS}暂无原型</div>
      </div>

      <!-- ── Members ── -->
      <div class="section hidden max-w-[1600px] mx-auto px-[18px] pt-[72px] pb-[48px] [&.active]:block md:px-8 md:pt-8 md:pb-12" id="section-members">
        <div class="page-header border-b border-bd mb-6 pb-6 md:mb-8">
          <div class="text-[1.375rem] font-extrabold tracking-[-.03em] text-tx mb-1.5">成员统计</div>
          <div class="text-sm font-medium text-tx-3">成员账号的详细上传与配额数据</div>
        </div>
        <div class="mb-summary grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-[10px] mb-[18px]">
          <div class="rounded-md border border-bd bg-bg-3 p-[14px]"><div class="mb-1.5 text-[.62rem] font-bold uppercase tracking-[.1em] text-tx-3">注册成员</div><div class="font-mono text-[1.65rem] font-bold leading-none text-tx" id="mbTotal">—</div></div>
          <div class="rounded-md border border-bd bg-bg-3 p-[14px]"><div class="mb-1.5 text-[.62rem] font-bold uppercase tracking-[.1em] text-tx-3">今日活跃</div><div class="font-mono text-[1.65rem] font-bold leading-none text-tx" id="mbActive">—</div></div>
          <div class="rounded-md border border-bd bg-bg-3 p-[14px]"><div class="mb-1.5 text-[.62rem] font-bold uppercase tracking-[.1em] text-tx-3">今日上传合计</div><div class="font-mono text-[1.65rem] font-bold leading-none text-tx" id="mbSumToday">—</div></div>
          <div class="rounded-md border border-bd bg-bg-3 p-[14px]"><div class="mb-1.5 text-[.62rem] font-bold uppercase tracking-[.1em] text-tx-3">总上传合计</div><div class="font-mono text-[1.65rem] font-bold leading-none text-tx" id="mbSumTotal">—</div></div>
        </div>
        <h3 class="mb-3 text-[.8rem] font-semibold text-tx-2">成员列表</h3>
        <div class="toolbar flex flex-wrap items-center gap-[10px] mb-3">
          <div class="min-w-[20px] flex-1"></div>
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" onclick="loadMemberStats()"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13.65 4.35A6 6 0 1 0 14 8"/><polyline points="13.5,1.5 13.5,4.5 10.5,4.5"/></svg>刷新</button>
        </div>
        <div class="table-wrap overflow-hidden rounded-lg border border-bd bg-bg-3">
          <table class="data-table w-full border-collapse text-[.83rem] [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-bd-2 [&_th]:bg-bg-2 [&_th]:px-[13px] [&_th]:py-[10px] [&_th]:text-left [&_th]:text-[.66rem] [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-[.11em] [&_th]:text-tx-2 [&_td]:border-b [&_td]:border-bd [&_td]:px-[13px] [&_td]:py-[10px] [&_td]:align-middle [&_td]:text-tx [&_tr:last-child_td]:border-b-0 [&_tbody_tr:hover_td]:bg-bg-hover">
            <thead><tr>
              <th class="cursor-pointer select-none hover:text-tx-2" onclick="memberSort('name')">用户名</th>
              <th>状态</th>
              <th class="cursor-pointer select-none hover:text-tx-2" onclick="memberSort('today')">今日上传 / 日限</th>
              <th class="cursor-pointer select-none hover:text-tx-2" onclick="memberSort('total')">累计上传 / 总限</th>
              <th class="cursor-pointer select-none hover:text-tx-2 text-center" onclick="memberSort('pages')">页面数</th>
              <th>权限</th>
              <th class="cursor-pointer select-none hover:text-tx-2" onclick="memberSort('created')">注册时间</th>
            </tr></thead>
            <tbody id="memberTableBody"><tr><td colspan="7" class="text-center text-tx-3 p-8">加载中…</td></tr></tbody>
          </table>
        </div>
      </div>

      <!-- ── Settings ── -->
      <div class="section hidden max-w-[1600px] mx-auto px-[18px] pt-[72px] pb-[48px] [&.active]:block md:px-8 md:pt-8 md:pb-12" id="section-settings">
        <div class="page-header border-b border-bd mb-6 pb-6 md:mb-8">
          <div class="text-[1.375rem] font-extrabold tracking-[-.03em] text-tx mb-1.5">系统设置</div>
          <div class="text-sm font-medium text-tx-3">上传限制与文件类型配置</div>
        </div>
        <div class="settings-card mb-3.5 rounded-lg border border-bd bg-bg-3 p-5">
          <h3 class="mb-4 border-b border-bd pb-[10px] text-[.65rem] font-bold uppercase tracking-[.12em] text-tx-3">上传限制</h3>
          <div class="flex items-center gap-4 border-b border-bd py-[11px] last:border-b-0">
            <div class="w-[200px] shrink-0 text-[.83rem] text-tx-2">单文件最大大小</div>
            <div class="flex flex-1 items-center gap-[10px] [&_input[type=number]]:w-[140px] [&_input[type=number]]:rounded-sm [&_input[type=number]]:border [&_input[type=number]]:border-bd [&_input[type=number]]:bg-bg-2 [&_input[type=number]]:px-[10px] [&_input[type=number]]:py-1.5 [&_input[type=number]]:font-sans [&_input[type=number]]:text-[.83rem] [&_input[type=number]]:text-tx [&_input[type=number]]:outline-none [&_input[type=number]]:transition [&_input[type=number]]:focus:border-bd-focus [&_input[type=number]]:focus:shadow-[0_0_0_3px_var(--color-brand-muted)] [&_input[type=text]]:w-[140px] [&_input[type=text]]:rounded-sm [&_input[type=text]]:border [&_input[type=text]]:border-bd [&_input[type=text]]:bg-bg-2 [&_input[type=text]]:px-[10px] [&_input[type=text]]:py-1.5 [&_input[type=text]]:font-sans [&_input[type=text]]:text-[.83rem] [&_input[type=text]]:text-tx [&_input[type=text]]:outline-none [&_input[type=text]]:transition [&_input[type=text]]:focus:border-bd-focus [&_input[type=text]]:focus:shadow-[0_0_0_3px_var(--color-brand-muted)]">
              <input type="number" id="cfgSize" min="1" max="100" step="1" value="10">
              <span class="text-[.82rem] text-tx-3">MB</span>
              <span class="text-[.73rem] text-tx-3">（当前：<span id="cfgSizeDisplay">—</span>）</span>
            </div>
          </div>
          <div class="flex items-center gap-4 border-b border-bd py-[11px] last:border-b-0 !flex-col !items-start !gap-[10px]">
            <div class="w-[200px] shrink-0 text-[.83rem] text-tx-2">允许的文件类型</div>
            <div class="flex flex-wrap gap-1.5" id="typesGrid"></div>
          </div>
          <div class="mt-4 flex justify-end">
            <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-transparent bg-accent px-3 py-1.5 text-sm font-semibold leading-tight text-tx-inv transition hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(255,255,255,.08)] disabled:cursor-not-allowed disabled:bg-bg-5 disabled:text-tx-3 disabled:shadow-none" id="saveConfigBtn">保存设置</button>
          </div>
        </div>
        <div class="settings-card mb-3.5 rounded-lg border border-bd bg-bg-3 p-5">
          <h3 class="mb-4 border-b border-bd pb-[10px] text-[.65rem] font-bold uppercase tracking-[.12em] text-tx-3">密钥管理</h3>
          <div class="flex items-center gap-4 border-b border-bd py-[11px] last:border-b-0">
            <div class="w-[200px] shrink-0 text-[.83rem] text-tx-2">管理员账号</div>
            <div class="flex flex-1 items-center gap-[10px] [&_input[type=number]]:w-[140px] [&_input[type=number]]:rounded-sm [&_input[type=number]]:border [&_input[type=number]]:border-bd [&_input[type=number]]:bg-bg-2 [&_input[type=number]]:px-[10px] [&_input[type=number]]:py-1.5 [&_input[type=number]]:font-sans [&_input[type=number]]:text-[.83rem] [&_input[type=number]]:text-tx [&_input[type=number]]:outline-none [&_input[type=number]]:transition [&_input[type=number]]:focus:border-bd-focus [&_input[type=number]]:focus:shadow-[0_0_0_3px_var(--color-brand-muted)] [&_input[type=text]]:w-[140px] [&_input[type=text]]:rounded-sm [&_input[type=text]]:border [&_input[type=text]]:border-bd [&_input[type=text]]:bg-bg-2 [&_input[type=text]]:px-[10px] [&_input[type=text]]:py-1.5 [&_input[type=text]]:font-sans [&_input[type=text]]:text-[.83rem] [&_input[type=text]]:text-tx [&_input[type=text]]:outline-none [&_input[type=text]]:transition [&_input[type=text]]:focus:border-bd-focus [&_input[type=text]]:focus:shadow-[0_0_0_3px_var(--color-brand-muted)] font-mono text-[.84rem] text-green" id="cfgAdminUser">—</div>
          </div>
          <div class="flex items-center gap-4 border-b border-bd py-[11px] last:border-b-0 !flex-col !items-start !gap-2">
            <div class="w-[200px] shrink-0 text-[.83rem] text-tx-2">更新密钥（终端执行）</div>
            <div class="font-mono text-[.76rem] text-tx-3 leading-[2.1] bg-bg-2 px-[14px] py-[10px] rounded-[7px] border border-bd">
              npx wrangler secret put ADMIN_PASSWORD<br>
              npx wrangler secret put TOKEN_SECRET
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</div>

<!-- Create / Edit User Modal -->
<div class="fixed inset-0 z-50 hidden items-center justify-center bg-overlay p-6 backdrop-blur-[8px] [&.show]:flex" id="userModal">
  <div class="flex w-full max-w-[520px] max-h-[90vh] flex-col overflow-hidden rounded-xl border border-bd-2 bg-bg-4 shadow">
    <div class="flex shrink-0 items-center border-b border-bd px-[18px] py-[15px]">
      <h3 id="userModalTitle">新建用户</h3>
      <button class="flex h-7 w-7 items-center justify-center rounded-sm border border-bd bg-bg-5 font-sans text-[.85rem] text-tx-2 transition hover:border-bd-2 hover:text-tx" id="userModalClose"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg></button>
    </div>
    <div class="modal-body flex-1 overflow-y-auto px-[18px] py-4">
      <div class="flex flex-col gap-[5px] mb-3.5" id="fieldUsername"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">用户名 <span class="text-tx-3">(字母/数字/_- 2-32位)</span></label><input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:shadow-[var(--focus-ring)]" type="text" id="umUsername" placeholder="alice"></div>
      <div class="flex flex-col gap-[5px] mb-3.5" id="fieldPassword"><label id="umPassLabel">密码</label><input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:shadow-[var(--focus-ring)]" type="password" id="umPassword" placeholder="留空则不修改"></div>
      <div class="flex flex-col gap-[5px] mb-3.5 mt-1"><label class="mb-2 block">权限</label>
        <div class="perm-grid grid grid-cols-2 gap-2 mt-1">
          <label class="perm-check flex cursor-pointer items-center gap-2 rounded-sm border border-bd bg-bg-3 px-[11px] py-2 text-[.82rem] text-tx-2 transition hover:border-bd-2 [&_input]:h-3.5 [&_input]:w-3.5 [&_input]:cursor-pointer [&_input]:accent-brand"><input type="checkbox" id="pmUpload" checked><span>允许上传</span></label>
          <label class="perm-check flex cursor-pointer items-center gap-2 rounded-sm border border-bd bg-bg-3 px-[11px] py-2 text-[.82rem] text-tx-2 transition hover:border-bd-2 [&_input]:h-3.5 [&_input]:w-3.5 [&_input]:cursor-pointer [&_input]:accent-brand"><input type="checkbox" id="pmDelete"><span>允许删除</span></label>
          <label class="perm-check flex cursor-pointer items-center gap-2 rounded-sm border border-bd bg-bg-3 px-[11px] py-2 text-[.82rem] text-tx-2 transition hover:border-bd-2 [&_input]:h-3.5 [&_input]:w-3.5 [&_input]:cursor-pointer [&_input]:accent-brand"><input type="checkbox" id="pmEdit"><span>允许编辑</span></label>
          <label class="perm-check flex cursor-pointer items-center gap-2 rounded-sm border border-bd bg-bg-3 px-[11px] py-2 text-[.82rem] text-tx-2 transition hover:border-bd-2 [&_input]:h-3.5 [&_input]:w-3.5 [&_input]:cursor-pointer [&_input]:accent-brand"><input type="checkbox" id="pmDisabled"><span>禁用账号</span></label>
        </div>
        <div class="perm-num-row flex items-center gap-[10px] mt-3">
          <label class="w-[120px] shrink-0 text-[.8rem] text-tx-2">上传总量上限</label>
          <input class="w-[100px] rounded-sm border border-bd bg-bg-2 px-[10px] py-1.5 font-sans text-[.83rem] text-tx outline-none transition focus:border-bd-focus focus:shadow-[0_0_0_3px_var(--color-brand-muted)]" type="number" id="pmMaxTotal" value="100" min="-1">
          <span class="perm-hint text-[.7rem] text-tx-3">（-1 = 无限制）</span>
        </div>
        <div class="perm-num-row flex items-center gap-[10px] mt-3">
          <label class="w-[120px] shrink-0 text-[.8rem] text-tx-2">每日上传上限</label>
          <input class="w-[100px] rounded-sm border border-bd bg-bg-2 px-[10px] py-1.5 font-sans text-[.83rem] text-tx outline-none transition focus:border-bd-focus focus:shadow-[0_0_0_3px_var(--color-brand-muted)]" type="number" id="pmDailyLimit" value="20" min="-1">
          <span class="perm-hint text-[.7rem] text-tx-3">（-1 = 无限制）</span>
        </div>
        <div class="perm-num-row flex items-center gap-[10px] mt-3 !mt-4 pt-3 border-t border-bd">
          <label class="w-[120px] shrink-0 text-[.8rem] text-tx-2">Token 有效期</label>
          <input class="w-[100px] rounded-sm border border-bd bg-bg-2 px-[10px] py-1.5 font-sans text-[.83rem] text-tx outline-none transition focus:border-bd-focus focus:shadow-[0_0_0_3px_var(--color-brand-muted)]" type="number" id="pmTokenTtl" value="7" min="1" max="365">
          <span class="perm-hint text-[.7rem] text-tx-3">天（1–365）</span>
        </div>
      </div>
    </div>
    <div class="flex shrink-0 justify-end gap-2 border-t border-bd px-[18px] py-3">
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="userModalCancel">取消</button>
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-transparent bg-accent px-3 py-1.5 text-sm font-semibold leading-tight text-tx-inv transition hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(255,255,255,.08)] disabled:cursor-not-allowed disabled:bg-bg-5 disabled:text-tx-3 disabled:shadow-none" id="userModalSave">创建</button>
    </div>
  </div>
</div>

<!-- Admin Page Editor Modal -->
<div class="fixed inset-0 z-50 hidden items-center justify-center bg-overlay p-6 backdrop-blur-[8px] [&.show]:flex" id="adminPageModal">
  <div class="flex w-full max-w-[520px] max-h-[90vh] flex-col overflow-hidden rounded-xl border border-bd-2 bg-bg-4 shadow !max-w-[960px] !h-[min(92vh,900px)] !max-h-[96vh]">
    <div class="flex shrink-0 items-center border-b border-bd px-[18px] py-[15px]">
      <h3 class="flex-1 text-[.93rem] font-semibold text-tx">页面编辑</h3>
      <button class="flex h-7 w-7 items-center justify-center rounded-sm border border-bd bg-bg-5 font-sans text-[.85rem] text-tx-2 transition hover:border-bd-2 hover:text-tx" id="apmClose"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg></button>
    </div>
    <div class="modal-body flex-1 overflow-y-auto px-[18px] py-4 flex flex-col gap-3 min-h-0 !overflow-hidden">
      <div class="flex flex-col gap-[5px] mb-3.5"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">标题</label><input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:shadow-[var(--focus-ring)]" type="text" id="apmTitle" placeholder="My Page"></div>
      <div class="flex flex-col gap-[5px] mb-3.5">
        <label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">Slug（URL 后缀）</label>
        <input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:shadow-[var(--focus-ring)]" type="text" id="apmSlug" placeholder="my-blog-post">
        <span class="text-[.72rem] text-tx-3 mt-1">访问地址：<span class="text-tx-2" id="apmSlugPreview"></span></span>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-[5px] mb-3.5"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">类型</label><select class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:shadow-[var(--focus-ring)]" id="apmType"><option value="markdown">Markdown</option><option value="html">HTML</option></select></div>
        <div class="flex flex-col gap-[5px] mb-3.5"><label class="flex items-center gap-2 mt-[26px] cursor-pointer"><input type="checkbox" id="apmPublic" checked> 公开访问</label></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-[5px] mb-3.5"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">项目</label><select class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:shadow-[var(--focus-ring)]" id="apmProject"><option value="">-- 无 --</option></select></div>
        <div class="flex flex-col gap-[5px] mb-3.5"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">分组</label><select class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:shadow-[var(--focus-ring)]" id="apmGroup"><option value="">-- 无 --</option></select></div>
      </div>
      <div class="flex flex-col gap-[5px] mb-3.5" id="apmPwdSection" style="display:none">
        <label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">访问密码</label>
        <div class="flex gap-2 items-center">
          <input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:shadow-[var(--focus-ring)] !w-[110px] !px-[10px] !py-2 font-mono tracking-[.18em] !text-[.95rem] !rounded-[7px] !border-bd-2" type="text" id="apmPassword" maxlength="6" autocomplete="off" spellcheck="false">
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx whitespace-nowrap shrink-0" type="button" id="apmPwdGen">重新生成</button>
        </div>
        <span class="text-[.7rem] text-tx-3 mt-1 block">6位字母+数字，访客凭密码访问私密页面</span>
      </div>
      <div class="flex flex-col gap-[5px] mb-3.5 flex-1 min-h-0">
        <label id="apmContentLabel">内容</label>
        <div class="hidden" id="apmVditor"></div>
        <textarea class="w-full flex-1 min-h-[360px] resize-y rounded-md border border-bd-2 bg-bg-2 px-[14px] py-3 font-mono text-[.84rem] leading-[1.7] text-tx" id="apmContent" rows="14" placeholder="# Hello World\n\n写点什么…"></textarea>
      </div>
    </div>
    <div class="flex shrink-0 justify-end gap-2 border-t border-bd px-[18px] py-3">
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="apmCancel">取消</button>
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-transparent bg-accent px-3 py-1.5 text-sm font-semibold leading-tight text-tx-inv transition hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(255,255,255,.08)] disabled:cursor-not-allowed disabled:bg-bg-5 disabled:text-tx-3 disabled:shadow-none" id="apmSave">创建</button>
    </div>
  </div>
</div>

<!-- Page Stats Modal -->
<div class="fixed inset-0 z-50 hidden items-center justify-center bg-overlay p-6 backdrop-blur-[8px] [&.show]:flex" id="adminPageBulkMoveModal">
  <div class="flex w-full max-w-[520px] max-h-[90vh] flex-col overflow-hidden rounded-xl border border-bd-2 bg-bg-4 shadow">
    <div class="flex shrink-0 items-center border-b border-bd px-[18px] py-[15px]"><h3 class="flex-1 text-[.93rem] font-semibold text-tx">批量移动页面</h3><button class="flex h-7 w-7 items-center justify-center rounded-sm border border-bd bg-bg-5 font-sans text-[.85rem] text-tx-2 transition hover:border-bd-2 hover:text-tx" id="apgMoveClose"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg></button></div>
    <div class="modal-body flex-1 overflow-y-auto px-[18px] py-4">
      <div class="flex flex-col gap-[5px] mb-3.5"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">目标项目</label><select class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:shadow-[var(--focus-ring)]" id="apgMoveProject"><option value="">-- 无 --</option></select></div>
      <div class="flex flex-col gap-[5px] mb-3.5"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">目标分组</label><select class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:shadow-[var(--focus-ring)]" id="apgMoveGroup"><option value="">-- 无 --</option></select></div>
      <p class="text-[.76rem] text-tx-3 mt-[6px]">选中的 <span class="font-semibold text-tx" id="apgMoveCount">0</span> 个页面将被移动到所选项目/分组</p>
    </div>
    <div class="flex shrink-0 justify-end gap-2 border-t border-bd px-[18px] py-3">
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="apgMoveCancel">取消</button>
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-transparent bg-accent px-3 py-1.5 text-sm font-semibold leading-tight text-tx-inv transition hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(255,255,255,.08)] disabled:cursor-not-allowed disabled:bg-bg-5 disabled:text-tx-3 disabled:shadow-none" id="apgMoveConfirm">确认移动</button>
    </div>
  </div>
</div>

<!-- New/Edit Group Modal -->
<div class="fixed inset-0 z-50 hidden items-center justify-center bg-overlay p-6 backdrop-blur-[8px] [&.show]:flex" id="adminNewGroupModal">
  <div class="flex w-full max-w-[520px] max-h-[90vh] flex-col overflow-hidden rounded-xl border border-bd-2 bg-bg-4 shadow">
    <div class="flex shrink-0 items-center border-b border-bd px-[18px] py-[15px]"><h3 class="flex-1 text-[.93rem] font-semibold text-tx" id="apgGrpModalTitle">新建分组</h3><button class="flex h-7 w-7 items-center justify-center rounded-sm border border-bd bg-bg-5 font-sans text-[.85rem] text-tx-2 transition hover:border-bd-2 hover:text-tx" id="apgNewGrpClose"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg></button></div>
    <div class="modal-body flex-1 overflow-y-auto px-[18px] py-4">
      <div class="flex flex-col gap-[5px] mb-3.5"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">所属项目 <span class="text-tx-3 font-normal">（可选）</span></label><select class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:shadow-[var(--focus-ring)]" id="apgNewGrpProject"><option value="">-- 独立分组 --</option></select></div>
      <div class="flex flex-col gap-[5px] mb-3.5"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">分组名称</label><input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:shadow-[var(--focus-ring)]" type="text" id="apgNewGrpName" placeholder="分组名称" maxlength="60"></div>
    </div>
    <div class="flex shrink-0 justify-end gap-2 border-t border-bd px-[18px] py-3">
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="apgNewGrpCancel">取消</button>
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-transparent bg-accent px-3 py-1.5 text-sm font-semibold leading-tight text-tx-inv transition hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(255,255,255,.08)] disabled:cursor-not-allowed disabled:bg-bg-5 disabled:text-tx-3 disabled:shadow-none" id="apgNewGrpConfirm">创建</button>
    </div>
  </div>
</div>

<!-- New/Edit Project Modal -->
<div class="fixed inset-0 z-50 hidden items-center justify-center bg-overlay p-6 backdrop-blur-[8px] [&.show]:flex" id="adminProjectModal">
  <div class="flex w-full max-w-[520px] max-h-[90vh] flex-col overflow-hidden rounded-xl border border-bd-2 bg-bg-4 shadow">
    <div class="flex shrink-0 items-center border-b border-bd px-[18px] py-[15px]"><h3 class="flex-1 text-[.93rem] font-semibold text-tx" id="apjModalTitle">新建项目</h3><button class="flex h-7 w-7 items-center justify-center rounded-sm border border-bd bg-bg-5 font-sans text-[.85rem] text-tx-2 transition hover:border-bd-2 hover:text-tx" id="apjModalClose"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg></button></div>
    <div class="modal-body flex-1 overflow-y-auto px-[18px] py-4">
      <div class="flex flex-col gap-[5px] mb-3.5"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">项目名称</label><input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:shadow-[var(--focus-ring)]" type="text" id="apjName" placeholder="项目名称" maxlength="64"></div>
    </div>
    <div class="flex shrink-0 justify-end gap-2 border-t border-bd px-[18px] py-3">
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="apjModalCancel">取消</button>
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-transparent bg-accent px-3 py-1.5 text-sm font-semibold leading-tight text-tx-inv transition hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(255,255,255,.08)] disabled:cursor-not-allowed disabled:bg-bg-5 disabled:text-tx-3 disabled:shadow-none" id="apjModalSave">创建</button>
    </div>
  </div>
</div>

<!-- Import Markdown / HTML Modal -->
<div class="fixed inset-0 z-50 hidden items-center justify-center bg-overlay p-6 backdrop-blur-[8px] [&.show]:flex" id="adminImportModal">
  <div class="flex w-full max-w-[540px] max-h-[90vh] flex-col overflow-hidden rounded-xl border border-bd-2 bg-bg-4 shadow">
    <div class="flex shrink-0 items-center border-b border-bd px-[18px] py-[15px]"><h3 class="flex-1 text-[.93rem] font-semibold text-tx">导入页面</h3><button class="flex h-7 w-7 items-center justify-center rounded-sm border border-bd bg-bg-5 font-sans text-[.85rem] text-tx-2 transition hover:border-bd-2 hover:text-tx" id="aimClose"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg></button></div>
    <div class="modal-body flex-1 overflow-y-auto px-[18px] py-4">
      <div class="text-tx-3 transition hover:text-tx p-7 text-center border-2 border-dashed border-bd-2 rounded-[10px] cursor-pointer" id="aimDropZone">
        <input class="hidden" type="file" id="aimFileInput" accept=".md,.markdown,.html,.htm,text/markdown,text/html">
        <div class="mb-2"><svg class="h-6 w-6 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h9l5 5v15H6V2z"/><path d="M15 2v5h5"/></svg></div>
        <div class="text-tx-2 text-[.84rem]">点击或拖拽 .md / .html 文件到此处</div>
        <div class="text-tx-3 text-[.72rem] mt-1">支持 YAML frontmatter（title, slug, projectId, groupId, type, isPublic）</div>
      </div>
      <div id="aimPreview" style="display:none">
        <div class="flex flex-col gap-[5px] mb-3.5 mt-3.5"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">标题</label><input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:shadow-[var(--focus-ring)]" type="text" id="aimTitle"></div>
        <div class="flex flex-col gap-[5px] mb-3.5"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">Slug</label><input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:shadow-[var(--focus-ring)]" type="text" id="aimSlug"></div>
        <div class="flex flex-col gap-[5px] mb-3.5"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">类型</label><select class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:shadow-[var(--focus-ring)]" id="aimType"><option value="markdown">Markdown</option><option value="html">HTML</option></select></div>
        <div class="flex flex-col gap-[5px] mb-3.5"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">所属项目</label><select class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:shadow-[var(--focus-ring)]" id="aimProject"><option value="">-- 无 --</option></select></div>
        <div class="flex flex-col gap-[5px] mb-3.5"><label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">所属分组</label><select class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:shadow-[var(--focus-ring)]" id="aimGroup"><option value="">-- 无 --</option></select></div>
        <div class="flex flex-col gap-[5px] mb-3.5"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="aimPublic" checked> 公开访问</label></div>
      </div>
    </div>
    <div class="flex shrink-0 justify-end gap-2 border-t border-bd px-[18px] py-3">
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="aimCancel">取消</button>
      <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-transparent bg-accent px-3 py-1.5 text-sm font-semibold leading-tight text-tx-inv transition hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(255,255,255,.08)] disabled:cursor-not-allowed disabled:bg-bg-5 disabled:text-tx-3 disabled:shadow-none" id="aimSave" disabled>导入</button>
    </div>
  </div>
</div>

<!-- Page Stats Modal -->
<div class="fixed inset-0 z-50 hidden items-center justify-center bg-overlay p-6 backdrop-blur-[8px] [&.show]:flex" id="pageStatsModal">
  <div class="modal stats-modal flex w-full max-w-[680px] max-h-[90vh] flex-col overflow-hidden rounded-xl border border-bd-2 bg-bg-4 shadow">
    <div class="flex shrink-0 items-center border-b border-bd px-[18px] py-[15px]">
      <h3 class="flex-1 text-[.93rem] font-semibold text-tx">页面统计 <span class="text-[.72rem] text-tx-3 font-normal" id="psmTitle"></span></h3>
      <button class="flex h-7 w-7 items-center justify-center rounded-sm border border-bd bg-bg-5 font-sans text-[.85rem] text-tx-2 transition hover:border-bd-2 hover:text-tx" id="psmClose"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg></button>
    </div>
    <div class="modal-body flex-1 overflow-y-auto px-[18px] py-4">
      <div class="grid grid-cols-3 gap-[10px] mb-[18px]">
        <div class="rounded-md border border-bd bg-bg-3 p-[14px] text-center"><div class="font-mono text-2xl font-bold text-tx" id="psmTotal">—</div><div class="mt-[5px] text-[.66rem] uppercase tracking-[.07em] text-tx-3">总访问次数</div></div>
        <div class="rounded-md border border-bd bg-bg-3 p-[14px] text-center"><div class="font-mono text-2xl font-bold text-tx" id="psmUniqueIps">—</div><div class="mt-[5px] text-[.66rem] uppercase tracking-[.07em] text-tx-3">独立 IP 数</div></div>
        <div class="rounded-md border border-bd bg-bg-3 p-[14px] text-center"><div class="font-mono text-2xl font-bold text-tx" id="psmLast">—</div><div class="mt-[5px] text-[.66rem] uppercase tracking-[.07em] text-tx-3">最后访问</div></div>
      </div>
      <div class="country-bars"><h4 class="mb-2 text-[.66rem] font-bold uppercase tracking-[.09em] text-tx-2">国家 / 地区分布</h4><div id="psmCountryBars"></div></div>
      <div class="mt-5">
        <h4 class="text-[.8rem] text-[#7a8fa8] mb-[10px] font-semibold">访问 IP Top 10</h4>
        <div id="psmIpBars"></div>
      </div>
      <div class="access-log mt-4">
        <h4 class="mb-2 text-[.66rem] font-bold uppercase tracking-[.09em] text-tx-2">最近访问记录</h4>
        <table class="log-table w-full border-collapse text-[.76rem] mt-1 [&_th]:text-left [&_th]:px-[10px] [&_th]:py-1.5 [&_th]:text-tx-3 [&_th]:font-semibold [&_th]:border-b [&_th]:border-bd [&_th]:uppercase [&_th]:tracking-[.06em] [&_th]:text-[.63rem] [&_td]:px-[10px] [&_td]:py-1.5 [&_td]:border-b [&_td]:border-bd [&_td]:text-tx-2 [&_td]:font-mono [&_td]:text-[.73rem]">
          <thead><tr><th>时间</th><th>IP</th><th>国家</th><th>城市</th><th>ISP</th></tr></thead>
          <tbody id="psmLogBody"></tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<!-- Image Stats Modal -->
<div class="fixed inset-0 z-50 hidden items-center justify-center bg-overlay p-6 backdrop-blur-[8px] [&.show]:flex" id="statsModal">
  <div class="modal stats-modal flex w-full max-w-[680px] max-h-[90vh] flex-col overflow-hidden rounded-xl border border-bd-2 bg-bg-4 shadow">
    <div class="flex shrink-0 items-center border-b border-bd px-[18px] py-[15px]">
      <h3 class="flex-1 text-[.93rem] font-semibold text-tx">访问统计 <span class="text-[.72rem] text-tx-3 font-normal" id="statsModalKey"></span></h3>
      <button class="flex h-7 w-7 items-center justify-center rounded-sm border border-bd bg-bg-5 font-sans text-[.85rem] text-tx-2 transition hover:border-bd-2 hover:text-tx" id="statsModalClose"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg></button>
    </div>
    <div class="modal-body flex-1 overflow-y-auto px-[18px] py-4">
      <div class="grid grid-cols-3 gap-[10px] mb-[18px]">
        <div class="rounded-md border border-bd bg-bg-3 p-[14px] text-center"><div class="font-mono text-2xl font-bold text-tx" id="smTotal">—</div><div class="mt-[5px] text-[.66rem] uppercase tracking-[.07em] text-tx-3">总访问次数</div></div>
        <div class="rounded-md border border-bd bg-bg-3 p-[14px] text-center"><div class="font-mono text-2xl font-bold text-tx" id="smCountries">—</div><div class="mt-[5px] text-[.66rem] uppercase tracking-[.07em] text-tx-3">国家/地区</div></div>
        <div class="rounded-md border border-bd bg-bg-3 p-[14px] text-center"><div class="font-mono text-2xl font-bold text-tx" id="smLast">—</div><div class="mt-[5px] text-[.66rem] uppercase tracking-[.07em] text-tx-3">最后访问</div></div>
      </div>
      <div class="country-bars"><h4 class="mb-2 text-[.66rem] font-bold uppercase tracking-[.09em] text-tx-2">国家 / 地区分布</h4><div id="countryBars"></div></div>
      <div class="access-log mt-4">
        <h4 class="mb-2 text-[.66rem] font-bold uppercase tracking-[.09em] text-tx-2">最近访问记录</h4>
        <table class="log-table w-full border-collapse text-[.76rem] mt-1 [&_th]:text-left [&_th]:px-[10px] [&_th]:py-1.5 [&_th]:text-tx-3 [&_th]:font-semibold [&_th]:border-b [&_th]:border-bd [&_th]:uppercase [&_th]:tracking-[.06em] [&_th]:text-[.63rem] [&_td]:px-[10px] [&_td]:py-1.5 [&_td]:border-b [&_td]:border-bd [&_td]:text-tx-2 [&_td]:font-mono [&_td]:text-[.73rem]">
          <thead><tr><th>时间</th><th>IP</th><th>国家</th><th>城市</th><th>ISP</th></tr></thead>
          <tbody id="accessLogBody"></tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<!-- Lightbox -->
<div class="lightbox fixed inset-0 z-[100] hidden items-center justify-center bg-overlay p-6 [&.show]:flex" id="lightbox">
  <button class="absolute right-[14px] top-[14px] flex h-8 w-8 items-center justify-center rounded-sm border border-bd bg-bg-5 text-[.9rem] text-tx-2 transition hover:border-bd-2 hover:text-tx" id="lbClose"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg></button>
  <div class="w-full max-w-[740px] overflow-hidden rounded-lg border border-bd-2 bg-bg-4 shadow">
    <div class="flex min-h-[260px] max-h-[55vh] items-center justify-center bg-bg"><img class="block max-h-[55vh] max-w-full object-contain" id="lbImg" src="" alt=""></div>
    <div class="px-[18px] py-[14px]">
      <div class="break-all font-mono text-[.84rem] text-tx-2" id="lbKey"></div>
      <div class="mt-[5px] flex gap-[14px] text-[.75rem] text-tx-3"><span id="lbSize"></span><span id="lbDate"></span></div>
      <div class="mt-3 flex gap-[7px]">
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="lbCopy">复制链接</button>
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="lbMd">复制 MD</button>
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" id="lbStats">访问统计</button>
        <div class="flex-1"></div>
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-red-r bg-red-g px-3 py-1.5 text-sm font-semibold leading-tight text-red transition hover:bg-red-r" id="lbDelete">删除</button>
      </div>
    </div>
  </div>
</div>

<!-- Proto Stats Modal -->
<div class="fixed inset-0 z-50 hidden items-center justify-center bg-overlay p-6 backdrop-blur-[8px] [&.show]:flex" id="protoStatsModal">
  <div class="modal stats-modal flex w-full max-w-[680px] max-h-[90vh] flex-col overflow-hidden rounded-xl border border-bd-2 bg-bg-4 shadow">
    <div class="flex shrink-0 items-center border-b border-bd px-[18px] py-[15px]">
      <h3 class="flex-1 text-[.93rem] font-semibold text-tx">原型统计 <span class="text-[.72rem] text-tx-3 font-normal" id="prsTitle"></span></h3>
      <button class="flex h-7 w-7 items-center justify-center rounded-sm border border-bd bg-bg-5 font-sans text-[.85rem] text-tx-2 transition hover:border-bd-2 hover:text-tx" id="prsClose"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg></button>
    </div>
    <div class="modal-body flex-1 overflow-y-auto px-[18px] py-4">
      <div class="grid grid-cols-3 gap-[10px] mb-[18px]">
        <div class="rounded-md border border-bd bg-bg-3 p-[14px] text-center"><div class="font-mono text-2xl font-bold text-tx" id="prsTotal">—</div><div class="mt-[5px] text-[.66rem] uppercase tracking-[.07em] text-tx-3">总访问次数</div></div>
        <div class="rounded-md border border-bd bg-bg-3 p-[14px] text-center"><div class="font-mono text-2xl font-bold text-tx" id="prsUniqueIps">—</div><div class="mt-[5px] text-[.66rem] uppercase tracking-[.07em] text-tx-3">独立 IP 数</div></div>
        <div class="rounded-md border border-bd bg-bg-3 p-[14px] text-center"><div class="font-mono text-2xl font-bold text-tx" id="prsLast">—</div><div class="mt-[5px] text-[.66rem] uppercase tracking-[.07em] text-tx-3">最后访问</div></div>
      </div>
      <div class="country-bars"><h4 class="mb-2 text-[.66rem] font-bold uppercase tracking-[.09em] text-tx-2">国家 / 地区分布</h4><div id="prsCountryBars"></div></div>
      <div class="access-log mt-4">
        <h4 class="mb-2 text-[.66rem] font-bold uppercase tracking-[.09em] text-tx-2">最近访问记录</h4>
        <table class="log-table w-full border-collapse text-[.76rem] mt-1 [&_th]:text-left [&_th]:px-[10px] [&_th]:py-1.5 [&_th]:text-tx-3 [&_th]:font-semibold [&_th]:border-b [&_th]:border-bd [&_th]:uppercase [&_th]:tracking-[.06em] [&_th]:text-[.63rem] [&_td]:px-[10px] [&_td]:py-1.5 [&_td]:border-b [&_td]:border-bd [&_td]:text-tx-2 [&_td]:font-mono [&_td]:text-[.73rem]">
          <thead><tr><th>时间</th><th>IP</th><th>国家</th></tr></thead>
          <tbody id="prsLogBody"></tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<!-- Proto Version History & Diff Modal -->
<div class="fixed inset-0 z-50 hidden items-center justify-center bg-overlay p-6 backdrop-blur-[8px] [&.show]:flex" id="protoVersionModal">
  <div class="flex w-full max-w-[520px] max-h-[90vh] flex-col overflow-hidden rounded-xl border border-bd-2 bg-bg-4 shadow !max-w-[900px] !w-[95vw] !max-h-[85vh] !h-[85vh]">
    <div class="flex shrink-0 items-center border-b border-bd px-[18px] py-[15px]">
      <h3 class="flex-1 text-[.93rem] font-semibold text-tx">版本历史 <span class="text-[.72rem] text-tx-3 font-normal" id="pvmTitle"></span></h3>
      <button class="flex h-7 w-7 items-center justify-center rounded-sm border border-bd bg-bg-5 font-sans text-[.85rem] text-tx-2 transition hover:border-bd-2 hover:text-tx" id="pvmClose"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg></button>
    </div>
    <div class="flex flex-1 min-h-0">
      <!-- Left: version list -->
      <div class="w-[200px] shrink-0 border-r border-[#1a1a1a] overflow-y-auto p-[12px_10px] flex flex-col gap-1.5" id="pvmVersionList"></div>
      <!-- Right: file view / diff -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Toolbar -->
        <div class="px-[14px] py-[10px] border-b border-[#1a1a1a] flex items-center gap-2 shrink-0 flex-wrap">
          <span class="text-[.78rem] text-tx-3" id="pvmMode">点击版本号查看文件列表，勾选两个版本进行对比</span>
          <div class="flex-1"></div>
          <input class="w-full rounded-md border border-bd bg-bg-2 px-3 py-[9px] font-sans text-sm text-tx outline-none transition focus:border-bd-focus focus:shadow-[var(--focus-ring)] !w-[160px] !px-2 !py-1 !border-bd !text-tx-2 !text-[.78rem]" type="text" id="pvmSearch" placeholder="搜索文件…">
          <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx hidden !px-[10px] !py-1 !text-[.78rem]" id="pvmDiffBtn">对比选中版本</button>
        </div>
        <!-- Content area -->
        <div class="flex-1 overflow-y-auto px-4 py-[14px]" id="pvmContent">
          <div class="text-tx-3 text-center py-[60px] text-[.85rem]"><svg class="inline-block h-4 w-4 -mt-0.5 mr-1" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="13" y1="8" x2="3" y2="8"/><polyline points="7,4 3,8 7,12"/></svg>点击左侧版本号查看文件列表</div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="toast fixed bottom-6 left-1/2 z-[300] -translate-x-1/2 translate-y-20 whitespace-nowrap rounded-md border border-bd-2 bg-bg-3 px-[18px] py-[9px] font-sans text-sm font-medium text-tx shadow-sm transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] [&.show]:translate-y-0 [&.t-success]:border-green-r [&.t-success]:bg-green-g [&.t-success]:text-green [&.t-warn]:border-amber-r [&.t-warn]:bg-amber-g [&.t-warn]:text-amber [&.t-error]:border-red-r [&.t-error]:bg-red-g [&.t-error]:text-red" id="toast"></div>

<script>
  // Tailwind utility-class constants for elements whose className is fully
  // reassigned at runtime (className=, not classList.add) — declared once
  // here so they survive every reassignment site.
  const TOAST_BASE = 'fixed bottom-6 left-1/2 z-[300] -translate-x-1/2 translate-y-20 whitespace-nowrap rounded-md border border-bd-2 bg-bg-3 px-[18px] py-[9px] font-sans text-sm font-medium text-tx shadow-sm transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] [&.show]:translate-y-0 [&.t-success]:border-green-r [&.t-success]:bg-green-g [&.t-success]:text-green [&.t-warn]:border-amber-r [&.t-warn]:bg-amber-g [&.t-warn]:text-amber [&.t-error]:border-red-r [&.t-error]:bg-red-g [&.t-error]:text-red';
  const BTN_GHOST_TOGGLE = 'inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx';
  const BTN_PRIMARY_TOGGLE = 'inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-transparent bg-accent px-3 py-1.5 text-sm font-semibold leading-tight text-tx-inv transition hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(255,255,255,.08)] disabled:cursor-not-allowed disabled:bg-bg-5 disabled:text-tx-3 disabled:shadow-none';
  const BULK_BAR_BASE = 'hidden flex-wrap items-center gap-[10px] mb-3 rounded-md border border-bd-2 bg-bg-3 px-[13px] py-[9px] text-[.82rem] text-tx-2 [&.show]:flex';
  const CF_FILL_BASE = 'h-[3px] rounded-sm overflow-hidden bg-brand transition-[width] duration-500 ease-in-out [&.warn]:bg-amber [&.full]:bg-red';
  const ICON_EYE = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>';
  const ICON_EYE_OFF = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 2l12 12"/><path d="M6.6 3.4C7 3.3 7.5 3 8 3c4.5 0 7 5 7 5a13 13 0 0 1-2.3 3M4.2 4.2A13 13 0 0 0 1 8s2.5 5 7 5c1 0 1.9-.2 2.7-.6M6.2 6.2a2 2 0 0 0 2.6 2.6"/></svg>';

  // Custom-styled dropdown: keeps the underlying <select> as the source of truth
  // (value/change events unchanged) but replaces the browser's native popup — which
  // can't be restyled for row height/hover/width — with a Tailwind-styled listbox.
  // Trigger padding/font matches adminPageSearch so it lines up with the search box.
  function initCustomSelect(select) {
    if (!select || select.dataset.csReady) return;
    select.dataset.csReady = '1';
    // Only carry over layout/sizing classes (width, margins, breakpoints) to the
    // wrapper — the visual chrome (border/bg/padding) lives solely on the trigger
    // button below, so we don't end up with a box nested inside another box.
    const layoutClasses = select.className.split(/\s+/)
      .filter(c => /^(w-|max-w-|min-w-|!w-|ml-|mr-|mt-|mb-|mob:|xs:|md:|lg:|xl:)/.test(c))
      .join(' ');
    const wrap = document.createElement('div');
    wrap.className = 'cs-wrap relative inline-block ' + layoutClasses;
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    select.className = 'hidden';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'flex w-full min-w-0 items-center justify-between gap-2 rounded-sm border border-bd bg-bg-3 px-[11px] py-[7px] font-sans text-[.83rem] text-tx outline-none transition cursor-pointer hover:border-bd-2 hover:bg-bg-hover focus:border-bd-focus [&.open]:border-bd-focus';
    const label = document.createElement('span');
    label.className = 'truncate min-w-0';
    const chevron = document.createElement('span');
    chevron.className = 'shrink-0 text-tx-3 transition-transform duration-150 [&.open]:rotate-180';
    chevron.innerHTML = '<svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="4,6 8,10 12,6"/></svg>';
    btn.append(label, chevron);
    wrap.appendChild(btn);

    const list = document.createElement('div');
    list.className = 'cs-list absolute left-0 top-[calc(100%+4px)] z-30 hidden min-w-full w-max max-w-[280px] overflow-y-auto rounded-md border border-bd-2 bg-bg-4 py-1.5 shadow-lg max-h-[280px]';
    wrap.appendChild(list);

    function buildOptions() {
      list.innerHTML = '';
      Array.from(select.options).forEach(opt => {
        const row = document.createElement('button');
        row.type = 'button';
        const active = opt.value === select.value;
        row.className = 'flex w-full items-center px-3.5 py-2.5 text-left text-[.84rem] transition cursor-pointer hover:bg-bg-hover' +
          (active ? ' bg-brand-muted text-tx font-semibold' : ' text-tx-2 hover:text-tx');
        row.textContent = opt.textContent;
        row.addEventListener('click', () => {
          if (select.value !== opt.value) {
            select.value = opt.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }
          syncLabel();
          closeList();
        });
        list.appendChild(row);
      });
    }
    function syncLabel() {
      const opt = select.options[select.selectedIndex];
      label.textContent = opt ? opt.textContent : '';
    }
    function openList() { buildOptions(); list.classList.remove('hidden'); btn.classList.add('open'); chevron.classList.add('open'); }
    function closeList() { list.classList.add('hidden'); btn.classList.remove('open'); chevron.classList.remove('open'); }
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      list.classList.contains('hidden') ? openList() : closeList();
    });
    document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) closeList(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeList(); });
    // options are rebuilt dynamically (e.g. project/group filters) — keep the label in sync
    new MutationObserver(syncLabel).observe(select, { childList: true });
    syncLabel();
  }

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
    // server createToken stores exp as ms timestamp
    try { return JSON.parse(atob(tok.split('.')[0])).exp; } catch { return null; }
  }

  function checkTokenValid() {
    if (!adminToken) return false;
    const exp = parseTokenExp(adminToken);
    if (exp && Date.now() > exp) { localStorage.removeItem(TOKEN_KEY); adminToken = null; return false; }
    return true;
  }

  // ── 统一 fetch 封装：自动拦截 401 过期 ──────────────────────────────────────
  let _unauthLock = false;
  async function adminFetch(url, opts) {
    const res = await fetch(url, opts);
    if (res.status === 401 && !_unauthLock) { _unauthLock = true; handleUnauth(); }
    return res;
  }

  // ── 启动时主动向服务端验证 token 是否有效 ──────────────────────────────────────
  async function validateTokenWithServer() {
    if (!adminToken) return false;
    try {
      const res = await fetch('/admin/stats', { headers: authH() });
      if (res.status === 401) { handleUnauth(); return false; }
      return true;
    } catch { return true; /* 网络错误不判定失效 */ }
  }

  // ── Tab 切换回来时验证 token ──────────────────────────────────────────────────
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || !adminToken) return;
    validateTokenWithServer();
  });

  if (adminToken && checkTokenValid()) {
    // 先显示界面，再异步验证 token
    showApp();
    validateTokenWithServer();
  } else {
    adminToken = null; showLogin();
  }

  function showLogin() { document.getElementById('loginScreen').style.display = 'flex'; document.getElementById('adminApp').classList.add('hidden'); }
  function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminApp').classList.remove('hidden');
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
    if (inp.type === 'password') { inp.type = 'text'; tog.innerHTML = ICON_EYE_OFF; } else { inp.type = 'password'; tog.innerHTML = ICON_EYE; }
  });

  loginBtn.addEventListener('click', async () => {
    const u = document.getElementById('loginUser').value.trim(), p = document.getElementById('loginPass').value;
    const err = document.getElementById('loginErr');
    if (!u || !p) { err.textContent = '请填写账号和密码'; shakeLoginCard(); return; }
    loginBtn.classList.add('loading'); loginBtn.textContent = '登录中…'; err.textContent = '';
    try {
      const remember = document.getElementById('loginRemember').checked;
      const res = await fetch('/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:u,password:p,remember}) });
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

  // ── Theme switch（跟随系统 / 浅色 / 暗色，三端共用 localStorage key）──
  (function initThemeSwitch() {
    const KEY = 'onimg_theme';
    // Two copies live in the DOM (fixed top-right on desktop, mob-header on mobile) — keep both in sync.
    const opts = document.querySelectorAll('.theme-switch .theme-opt');
    function syncActive() {
      const cur = localStorage.getItem(KEY) || 'system';
      opts.forEach(b => b.classList.toggle('active', b.dataset.themeVal === cur));
    }
    opts.forEach(btn => btn.addEventListener('click', () => {
      const val = btn.dataset.themeVal;
      if (val === 'system') { localStorage.removeItem(KEY); document.documentElement.removeAttribute('data-theme'); }
      else { localStorage.setItem(KEY, val); document.documentElement.setAttribute('data-theme', val); }
      syncActive();
    }));
    syncActive();
  })();

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

  // ── Dashboard stats tab switching ────────────────────────────────────────────
  document.querySelectorAll('[data-dash-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.dashTab;
      document.querySelectorAll('[data-dash-tab]').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.dash-tab-pane').forEach(p => {
        const id = 'dashTab' + t.charAt(0).toUpperCase() + t.slice(1);
        p.classList.toggle('active', p.id === id);
      });
    });
  });

  // ── Sidebar nav ripple ────────────────────────────────────────────────────────
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const r = document.createElement('span');
      r.className = 'absolute h-[60px] w-[60px] rounded-full bg-white/[.08] pointer-events-none [transform:translate(-50%,-50%)_scale(0)] animate-[navRipple_.55s_ease-out_forwards]';
      const rect = this.getBoundingClientRect();
      r.style.left = (e.clientX - rect.left) + 'px';
      r.style.top  = (e.clientY - rect.top)  + 'px';
      this.appendChild(r);
      r.addEventListener('animationend', () => r.remove());
    });
  });

  // ── Dashboard ──────────────────────────────────────────────────────────────
  let allPageStats = {};

  // 客户端趋势追踪：无历史后端时，用本地记录的每次刷新值模拟迷你趋势线 + 环比涨跌幅
  function sparkTrack(id, value) {
    const key = 'onimg_spark_' + id;
    let hist = [];
    try { hist = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) {}
    if (typeof value === 'number' && isFinite(value)) {
      hist.push(value);
      if (hist.length > 10) hist = hist.slice(-10);
      try { localStorage.setItem(key, JSON.stringify(hist)); } catch(e) {}
    }
    return hist;
  }
  function renderSpark(elId, id, value) {
    const el = document.getElementById(elId);
    if (!el) return;
    const hist = sparkTrack(id, value);
    if (hist.length < 2) { el.innerHTML = ''; return; }
    const n = hist.length, w = 52, h = 16;
    const min = Math.min(...hist), max = Math.max(...hist);
    const pts = hist.map((v, i) => {
      const x = (i / (n - 1)) * w;
      const y = max === min ? h / 2 : h - ((v - min) / (max - min)) * h;
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
    const prev = hist[n - 2], curr = hist[n - 1];
    const flat = curr === prev;
    const up = curr > prev;
    const delta = prev !== 0 ? Math.abs((curr - prev) / prev) * 100 : (curr > 0 ? 100 : 0);
    const color = flat ? 'var(--color-tx-3)' : (up ? 'var(--color-green)' : 'var(--color-red)');
    const arrow = flat ? '' : (up ? '↑' : '↓');
    const deltaTxt = flat ? '持平' : (arrow + ' ' + (delta >= 1000 ? Math.round(delta) : delta.toFixed(1)) + '%');
    el.innerHTML = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" fill="none">' +
      '<polyline points="' + pts + '" stroke="' + color + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '<span class="font-mono text-[.68rem] font-bold" style="color:' + color + '">' + deltaTxt + '</span>';
  }

  async function loadDashboard() {
    const [sRes, iRes, pRes, psRes, prRes, prsRes] = await Promise.all([
      adminFetch('/admin/stats',           { headers: authH() }),
      adminFetch('/admin/all-image-stats', { headers: authH() }),
      adminFetch('/admin/pages',           { headers: authH() }),
      adminFetch('/admin/all-page-stats',  { headers: authH() }),
      adminFetch('/admin/protos',          { headers: authH() }),
      adminFetch('/admin/all-proto-stats', { headers: authH() }),
    ]);
    // 任一并行请求返回 401 都视为登录失效
    if ([sRes, iRes, pRes, psRes, prRes, prsRes].some(r => r.status === 401)) { handleUnauth(); return; }
    if (!sRes.ok) { console.error('loadDashboard stats failed', sRes.status); return; }
    const { totalImages, totalSize } = await sRes.json();
    const { stats }   = iRes.ok  ? await iRes.json()  : { stats: {} };
    const { pages }   = pRes.ok  ? await pRes.json()  : { pages: [] };
    const { stats: pgStats } = psRes.ok ? await psRes.json() : { stats: {} };
    const { protos = [] }    = prRes.ok  ? await prRes.json()  : {};
    const { stats: protoStats = {} } = prsRes.ok ? await prsRes.json() : {};
    allStats = stats;
    allPageStats = pgStats;

    document.getElementById('statImages').textContent = totalImages.toLocaleString();
    renderSpark('statImagesSpark', 'images', totalImages);
    const { val, unit } = fmtSizeParts(totalSize);
    document.getElementById('statSize').textContent = val;
    document.getElementById('statSizeUnit').textContent = unit;
    renderSpark('statSizeSpark', 'size', totalSize);
    const freeGb = Math.max(0, 10 - totalSize/1073741824);
    document.getElementById('statFree').textContent = freeGb.toFixed(2);
    renderSpark('statFreeSpark', 'free', freeGb);
    const totalViews = Object.values(stats).reduce((s,v) => s+(v.count??0), 0);
    document.getElementById('statViews').textContent = totalViews.toLocaleString();
    renderSpark('statViewsSpark', 'views', totalViews);
    document.getElementById('statPages').textContent = pages.length.toLocaleString();
    renderSpark('statPagesSpark', 'pages', pages.length);
    const totalPageViews = Object.values(pgStats).reduce((s,v) => s+(v.count??0), 0);
    document.getElementById('statPageViews').textContent = totalPageViews.toLocaleString();
    renderSpark('statPageViewsSpark', 'pageviews', totalPageViews);

    // Tab count badges
    const imgWithViews = Object.values(stats).filter(s => (s.count??0) > 0).length;
    const pgWithViews  = Object.values(pgStats).filter(s => (s.count??0) > 0).length;
    const prWithViews  = Object.values(protoStats).filter(s => (s.count??0) > 0).length;
    document.getElementById('dashImgCount').textContent   = imgWithViews || Object.keys(stats).length;
    document.getElementById('dashPgCount').textContent    = pgWithViews  || pages.length;
    document.getElementById('dashProtoCount').textContent = prWithViews  || protos.length;

    // ── 图片 Tab ──
    const TYPE_IMG = \`<span class="text-[.62rem] font-semibold px-1.5 py-px rounded bg-[rgba(52,211,153,.1)] text-[#34d399] border border-[rgba(52,211,153,.2)]">图片</span>\`;
    const sortedImg = Object.entries(stats).sort((a,b) => (b[1].count??0)-(a[1].count??0)).slice(0,10);
    document.getElementById('topImagesBody').innerHTML = sortedImg.length
      ? sortedImg.map(([k,s]) => \`<tr>
          <td><img class="h-8 w-8 cursor-pointer rounded-xs border border-bd-2 object-cover" src="\${origin}/\${k}" loading="lazy" onclick="openLightbox('\${k}')"></td>
          <td class="font-mono text-[.77rem] text-tx-3 max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap">\${esc(k)}</td>
          <td>\${TYPE_IMG}</td>
          <td class="font-mono text-[.82rem] font-bold text-tx">\${(s.count??0).toLocaleString()}</td>
          <td class="text-[.79rem] text-tx-2">\${s.lastAccess ? timeAgo(s.lastAccess) : '—'}</td>
          <td><button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !px-2 !py-1 !text-[.73rem]" onclick="openStatsModal('\${esc(k)}')">详情</button></td>
        </tr>\`).join('')
      : '<tr><td colspan="6" class="text-center text-tx-3 p-8">暂无访问记录</td></tr>';

    // ── 页面 Tab ──
    const TYPE_PG = \`<span class="text-[.62rem] font-semibold px-1.5 py-px rounded bg-amber-g text-amber border border-amber-r">页面</span>\`;
    const pageMap = {};
    pages.forEach(p => pageMap[p.slug] = { title: p.title || p.slug, type: p.type || 'markdown' });
    const sortedPg = Object.entries(pgStats).sort((a,b) => (b[1].count??0)-(a[1].count??0)).slice(0,10);
    document.getElementById('topPagesBody').innerHTML = sortedPg.length
      ? sortedPg.map(([slug,s]) => {
          const pm = pageMap[slug] || { title: slug, type: '' };
          return \`<tr>
            <td>
              <div class="font-medium text-[.84rem] text-tx">\${esc(pm.title)}</div>
              <div class="font-mono text-[.7rem] text-tx-3 mt-0.5">/p/\${esc(slug)}</div>
            </td>
            <td>\${TYPE_PG}</td>
            <td class="font-mono text-[.82rem] font-bold text-tx">\${(s.count??0).toLocaleString()}</td>
            <td class="text-[.79rem] text-tx-2">\${s.lastAccess ? timeAgo(s.lastAccess) : '—'}</td>
            <td><button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !px-2 !py-1 !text-[.73rem]" data-title="\${esc(pm.title)}" onclick="openPageStatsModal('\${esc(slug)}',this.dataset.title)">详情</button></td>
          </tr>\`;
        }).join('')
      : '<tr><td colspan="5" class="text-center text-tx-3 p-8">暂无访问记录</td></tr>';

    // ── 原型 Tab ──
    const TYPE_PT = \`<span class="text-[.62rem] font-semibold px-1.5 py-px rounded bg-[rgba(200,200,200,.08)] text-tx-a border border-[rgba(200,200,200,.15)]">原型</span>\`;
    const protoMap = {};
    protos.forEach(p => protoMap[p.protoId] = p);
    const sortedPr = Object.entries(protoStats).sort((a,b) => (b[1].count??0)-(a[1].count??0)).slice(0,10);
    const protoTitleCell = (id, pm) => {
      const title = pm.title || id;
      const lock  = pm.hasPassword ? ' <span class="inline-flex text-amber" title="已加密"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7V4.5a3 3 0 0 1 6 0V7"/></svg></span>' : '';
      const ver   = (pm.version ?? 1) > 0
        ? \` <span class="font-mono text-[.66rem] font-semibold px-[5px] py-px rounded-[3px] bg-white/[.06] text-tx-2 border border-bd">v\${pm.version ?? 1}</span>\`
        : '';
      return \`
        <div class="font-medium text-[.84rem] text-tx flex items-center gap-0.5 flex-wrap">\${esc(title)}\${lock}\${ver}</div>
        <div class="font-mono text-[.7rem] text-tx-3 mt-0.5">/proto/\${esc(id)}/</div>\`;
    };
    const protoActions = (id, pm) => {
      const url = location.origin + '/proto/' + id + '/';
      const previewUrl = url + (pm.accessPassword ? '?pwd=' + encodeURIComponent(pm.accessPassword) : '');
      const pwdAttr = pm.accessPassword ? \` data-pwd="\${esc(pm.accessPassword)}"\` : '';
      return \`<div class="flex gap-1 flex-wrap">
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !px-2 !py-1 !text-[.73rem]" data-url="\${url}"\${pwdAttr} onclick="copyProtoAddr(this)">复制地址</button>
        <a href="\${previewUrl}" target="_blank" class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !px-2 !py-1 !text-[.73rem] no-underline">预览</a>
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !px-2 !py-1 !text-[.73rem]" data-title="\${esc(pm.title||id)}" onclick="openProtoStatsModal('\${esc(id)}',this.dataset.title)">统计数据</button>
      </div>\`;
    };
    const prRows = sortedPr.length
      ? sortedPr.map(([id,s]) => {
          const pm = protoMap[id] || { title: id, owner: '—' };
          return \`<tr>
            <td>\${protoTitleCell(id, pm)}</td>
            <td>\${TYPE_PT}</td>
            <td class="text-[.79rem] text-tx-2">\${esc(pm.owner||'—')}</td>
            <td class="font-mono text-[.82rem] font-bold text-tx">\${(s.count??0).toLocaleString()}</td>
            <td class="text-[.79rem] text-tx-2">\${s.lastAccess ? timeAgo(s.lastAccess) : '—'}</td>
            <td>\${protoActions(id, pm)}</td>
          </tr>\`;
        }).join('')
      : protos.slice(0,10).map(pm => \`<tr>
          <td>\${protoTitleCell(pm.protoId, pm)}</td>
          <td>\${TYPE_PT}</td>
          <td class="text-[.79rem] text-tx-2">\${esc(pm.owner||'—')}</td>
          <td class="font-mono text-[.82rem] font-bold text-tx">0</td>
          <td class="text-[.79rem] text-tx-2">—</td>
          <td>\${protoActions(pm.protoId, pm)}</td>
        </tr>\`).join('') || '<tr><td colspan="6" class="text-center text-tx-3 p-8">暂无原型</td></tr>';
    document.getElementById('topProtosBody').innerHTML = prRows;
  }

  // ── Gallery ─────────────────────────────────────────────────────────────────
  async function loadGallery(reset = false) {
    if (reset) { allImages = []; galleryCursor = null; selected.clear(); updateBulkBar(); }
    if (!Object.keys(allStats).length) {
      const r = await adminFetch('/admin/all-image-stats', { headers: authH() });
      if (r.ok) allStats = (await r.json()).stats;
    }
    const url = '/list?limit=50' + (galleryCursor ? '&cursor=' + encodeURIComponent(galleryCursor) : '');
    const res = await adminFetch(url, { headers: authH() });
    if (!res.ok) return;
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
      return \`<div class="gitem group relative cursor-pointer overflow-hidden rounded-md border border-bd bg-bg-3 transition hover:-translate-y-0.5 hover:border-bd-2 hover:shadow-[0_8px_28px_rgba(0,0,0,.5)] [&.selected]:border-tx-2 [&.selected]:shadow-[0_0_0_1px_var(--color-tx-2)]\${selected.has(item.key)?' selected':''}" onclick="handleGitem(event,'\${item.key}')">
        <div class="checkbox absolute left-1.5 top-1.5 flex h-[17px] w-[17px] items-center justify-center rounded-xs border-[1.5px] border-bd-2 bg-black/75 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-[.selected]:opacity-100 group-[.selected]:border-tx-2 group-[.selected]:bg-tx-2"><svg class="h-2.5 w-2.5 fill-none stroke-white stroke-[2.5]" viewBox="0 0 12 12"><polyline points="1.5,6 5,9.5 10.5,2.5"/></svg></div>
        <img class="block h-auto w-full aspect-square bg-bg-2 object-cover" src="\${origin}/\${item.key}" loading="lazy">
        <div class="px-[9px] py-[7px]">
          <div class="truncate font-mono text-[.68rem] text-tx-3">\${item.key}</div>
          <div class="mt-[3px] flex justify-between"><span class="text-[.65rem] text-tx-3">\${fmtSize(item.size)}</span><span class="font-mono text-[.65rem] font-semibold text-tx-a">\${views?views+' 次':''}</span></div>
          <div class="mt-1.5 flex gap-[3px]">
            <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !px-2 !py-[3px] !text-[.7rem]" onclick="event.stopPropagation();copyText('\${origin}/\${item.key}',this)">复制</button>
            <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !px-2 !py-[3px] !text-[.7rem]" onclick="event.stopPropagation();openStatsModal('\${item.key}')">统计</button>
            <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-red-r bg-red-g px-3 py-1.5 text-sm font-semibold leading-tight text-red transition hover:bg-red-r !px-2 !py-[3px] !text-[.7rem]" onclick="event.stopPropagation();deleteSingle('\${item.key}')">删除</button>
          </div>
        </div>
      </div>\`;
    }).join('');
  }
  function handleGitem(e, key) { if (e.target.closest('button')) return; if (selected.size > 0 || e.target.closest('.checkbox')) { toggleSel(key); } else { openLightbox(key); } }
  function toggleSel(key) { if (selected.has(key)) selected.delete(key); else selected.add(key); updateBulkBar(); renderGallery(); }
  function updateBulkBar() { const n=selected.size; document.getElementById('bulkBar').className=BULK_BAR_BASE+(n?' show':''); document.getElementById('bulkCount').textContent='已选 '+n+' 张'; }
  async function deleteSingle(key) { if (!confirm('确认删除？')) return; await doDelete(key); allImages=allImages.filter(i=>i.key!==key); selected.delete(key); updateBulkBar(); renderGallery(); toast('已删除'); }
  async function doDelete(key) { await adminFetch('/delete/'+key, { method:'DELETE', headers:authH() }); }

  // ── User Management ──────────────────────────────────────────────────────────
  async function loadUsers() {
    document.getElementById('usersBody').innerHTML = '<tr><td colspan="6" class="text-center text-tx-3 p-6">加载中…</td></tr>';
    const res = await adminFetch('/admin/users', { headers: authH() });
    if (!res.ok) return;
    const { users } = await res.json();
    renderUsers(users);
  }

  function timeLeft(ms) {
    if (ms <= 0) return '已过期';
    if (ms < 3600000)  return Math.ceil(ms / 60000) + ' 分钟后过期';
    if (ms < 86400000) return Math.ceil(ms / 3600000) + ' 小时后过期';
    return Math.ceil(ms / 86400000) + ' 天后过期';
  }

  function renderLoginStatus(u) {
    if (!u.lastLoginAt) return \`<td class="text-[.79rem] text-tx-2 whitespace-nowrap">—</td>\`;
    const ttlMs = (u.tokenTtlDays ?? 7) * 86400000;
    const expiresAt = u.lastLoginAt + ttlMs;
    const remaining = expiresAt - Date.now();
    const active = remaining > 0;
    const dot = active
      ? \`<span class="w-[7px] h-[7px] rounded-full bg-green shadow-[0_0_5px_rgba(52,211,153,.5)] inline-block shrink-0"></span>\`
      : \`<span class="w-[7px] h-[7px] rounded-full bg-tx-3 inline-block shrink-0"></span>\`;
    const label = active
      ? \`<span class="text-[.76rem] font-semibold text-green">活跃</span>\`
      : \`<span class="text-[.76rem] text-tx-3">离线</span>\`;
    const sub = active
      ? \`<span class="text-[.7rem] text-tx-3">\${timeAgo(u.lastLoginAt)} 登录 · \${timeLeft(remaining)}</span>\`
      : \`<span class="text-[.7rem] text-tx-3">\${timeAgo(u.lastLoginAt)} 登录 · \${timeLeft(remaining)}</span>\`;
    return \`<td class="whitespace-nowrap">
      <div class="flex items-center gap-[5px]">\${dot}\${label}</div>
      <div class="mt-0.5">\${sub}</div>
    </td>\`;
  }

  function renderUsers(users) {
    document.getElementById('usersBody').innerHTML = users.map(u => {
      const p = u.permissions;
      const perms = u.isAdmin
        ? \`<span class="inline-flex items-center rounded-xs border border-brand-ring bg-brand-muted px-1.5 py-0.5 text-[.68rem] font-semibold text-tx-a">超级管理员</span>\`
        : [
            p.canUpload ? '<span class="inline-flex items-center rounded-xs border border-green-r bg-green-g px-1.5 py-0.5 text-[.68rem] font-semibold text-green">上传</span>' : '<span class="inline-flex items-center rounded-xs border border-bd bg-white/[.04] px-1.5 py-0.5 text-[.68rem] font-semibold text-tx-3">禁止上传</span>',
            p.canDelete ? '<span class="inline-flex items-center rounded-xs border border-green-r bg-green-g px-1.5 py-0.5 text-[.68rem] font-semibold text-green">删除</span>' : '',
            p.canEdit   ? '<span class="inline-flex items-center rounded-xs border border-green-r bg-green-g px-1.5 py-0.5 text-[.68rem] font-semibold text-green">编辑</span>' : '',
          ].filter(Boolean).join(' ');
      const quota = u.isAdmin ? '<span class="text-tx-3">—</span>' : (u.quota ? \`今日 \${u.quota.daily} 次 · 共 \${u.quota.total} 次\` : '—');
      const limits = u.isAdmin ? '<span class="text-tx-3">无限制</span>' : \`每日 \${p.dailyUploadLimit===-1?'∞':p.dailyUploadLimit} · 总量 \${p.maxTotalUploads===-1?'∞':p.maxTotalUploads}\`;
      const disabled = u.disabled ? '<span class="inline-flex items-center rounded-xs border border-red-r bg-red-g px-1.5 py-0.5 text-[.68rem] font-semibold text-red">已禁用</span> ' : '';
      const actions = u.isAdmin ? '' : \`
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !px-2 !py-1 !text-[.75rem]" onclick="openEditUser('\${u.username}')">编辑</button>
        <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-red-r bg-red-g px-3 py-1.5 text-sm font-semibold leading-tight text-red transition hover:bg-red-r !px-2 !py-1 !text-[.75rem]" onclick="deleteUser('\${u.username}')">删除</button>\`;
      return \`<tr>
        <td class="font-medium">\${disabled}\${u.username}</td>
        <td>\${perms}</td>
        <td class="text-[.79rem] text-tx-2">\${quota}</td>
        <td class="text-[.79rem] text-tx-2">\${limits}</td>
        \${renderLoginStatus(u)}
        <td>\${actions}</td>
      </tr>\`;
    }).join('') || '<tr><td colspan="6" class="text-center text-tx-3 p-6">暂无用户</td></tr>';
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
    document.getElementById('pmTokenTtl').value = 7;
    document.getElementById('userModalSave').textContent = isEdit ? '保存' : '创建';
    document.getElementById('userModal').classList.add('show');
  }

  function openEditUser(username) {
    // Fetch user info to pre-fill
    adminFetch('/admin/users', { headers: authH() }).then(r => { if (r.status === 401) return null; return r.json(); }).then(data => { if (!data) return; const { users } = data;
      const u = users.find(x => x.username === username);
      if (!u) return;
      openUserModal(username);
      document.getElementById('pmUpload').checked  = u.permissions.canUpload;
      document.getElementById('pmDelete').checked  = u.permissions.canDelete;
      document.getElementById('pmEdit').checked    = u.permissions.canEdit;
      document.getElementById('pmDisabled').checked = u.disabled;
      document.getElementById('pmMaxTotal').value   = u.permissions.maxTotalUploads;
      document.getElementById('pmDailyLimit').value = u.permissions.dailyUploadLimit;
      document.getElementById('pmTokenTtl').value   = u.tokenTtlDays ?? 7;
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
    const tokenTtlDays = parseInt(document.getElementById('pmTokenTtl').value) || 7;
    if (!isEdit && !password) { toast('请设置密码'); return; }

    const body = isEdit
      ? { permissions, disabled, tokenTtlDays, ...(password ? { password } : {}) }
      : { username, password, permissions, tokenTtlDays };
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
    const res = await adminFetch('/admin/users/' + encodeURIComponent(username), { method: 'DELETE', headers: authH() });
    if (res.ok) { toast('已删除'); loadUsers(); }
    else toast('删除失败');
  }

  ['userModalClose','userModalCancel'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => document.getElementById('userModal').classList.remove('show'));
  });

  // ── Settings ─────────────────────────────────────────────────────────────────
  let enabledTypes = new Set();

  async function loadSettings() {
    const res = await adminFetch('/admin/config', { headers: authH() });
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
      \`<div class="type-chip flex cursor-pointer items-center gap-[5px] rounded-xs border border-bd bg-bg-2 px-[9px] py-1 text-[.74rem] font-medium text-tx-3 transition hover:border-bd-2 hover:text-tx-2 [&.on]:border-brand-ring [&.on]:bg-brand-muted [&.on]:text-tx-a\${enabledTypes.has(t)?' on':''}" data-type="\${t}" onclick="toggleType('\${t}')">\${TYPE_LABELS[t]}</div>\`
    ).join('');
  }
  function toggleType(t) { if (enabledTypes.has(t)) enabledTypes.delete(t); else enabledTypes.add(t); renderTypesGrid(); }

  document.getElementById('saveConfigBtn').addEventListener('click', async () => {
    const mb = parseFloat(document.getElementById('cfgSize').value);
    if (isNaN(mb) || mb < 0.1 || mb > 100) { toast('文件大小限制应在 0.1 - 100 MB 之间'); return; }
    if (enabledTypes.size === 0) { toast('至少选择一种文件类型'); return; }
    const res = await adminFetch('/admin/config', {
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
    document.getElementById('accessLogBody').innerHTML = '<tr><td class="text-tx-3 text-center p-4" colspan="5">加载中…</td></tr>';
    document.getElementById('statsModal').classList.add('show');
    try {
      const res = await adminFetch('/admin/image-stats/' + encodeURIComponent(key), { headers: authH() });
      const data = await res.json();
      document.getElementById('smTotal').textContent = (data.count??0).toLocaleString();
      const cl = Object.entries(data.countries??{}).sort((a,b)=>b[1]-a[1]);
      document.getElementById('smCountries').textContent = cl.length;
      document.getElementById('smLast').textContent = data.lastAccess ? timeAgo(data.lastAccess) : '—';
      const maxV = cl[0]?.[1]??1;
      document.getElementById('countryBars').innerHTML = cl.slice(0,8).map(([cc,cnt]) =>
        \`<div class="flex items-center gap-[10px] mb-[5px] text-[.78rem]"><span class="w-9 shrink-0 font-mono text-[.73rem] text-tx-2">\${cc}</span><div class="h-[5px] flex-1 rounded-[3px] bg-bd"><div class="h-[5px] rounded-[3px] bg-brand transition-[width] duration-[.4s]" style="width:\${(cnt/maxV*100).toFixed(1)}%"></div></div><span class="w-7 text-right text-[.73rem] text-tx-3">\${cnt}</span></div>\`
      ).join('') || '<span class="text-tx-3 text-[.82rem]">暂无数据</span>';
      document.getElementById('accessLogBody').innerHTML = (data.accesses??[]).slice(0,50).map(a =>
        \`<tr><td>\${new Date(a.ts).toLocaleString('zh-CN')}</td><td>\${a.ip}</td><td>\${a.country}</td><td>\${[a.city,a.region].filter(x=>x&&x!=='—').join(' ')}</td><td class="text-tx-3">\${a.org!=='—'?a.org:''}</td></tr>\`
      ).join('') || '<tr><td colspan="5" class="text-tx-3 text-center">暂无记录</td></tr>';
    } catch { document.getElementById('accessLogBody').innerHTML = '<tr><td colspan="5" class="text-tx-3 text-center">加载失败</td></tr>'; }
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
    document.getElementById('psmLogBody').innerHTML = '<tr><td class="text-tx-3 text-center p-4" colspan="5">加载中…</td></tr>';
    document.getElementById('pageStatsModal').classList.add('show');
    try {
      const res = await adminFetch('/admin/page-stats/' + encodeURIComponent(slug), { headers: authH() });
      const data = await res.json();
      document.getElementById('psmTotal').textContent = (data.count ?? 0).toLocaleString();
      document.getElementById('psmUniqueIps').textContent = (data.uniqueIps ?? 0).toLocaleString();
      document.getElementById('psmLast').textContent = data.lastAccess ? timeAgo(data.lastAccess) : '—';

      // Country bars
      const cl = Object.entries(data.countries ?? {}).sort((a,b) => b[1]-a[1]);
      const maxC = cl[0]?.[1] ?? 1;
      document.getElementById('psmCountryBars').innerHTML = cl.slice(0,8).map(([cc,cnt]) =>
        \`<div class="flex items-center gap-[10px] mb-[5px] text-[.78rem]"><span class="w-9 shrink-0 font-mono text-[.73rem] text-tx-2">\${cc}</span><div class="h-[5px] flex-1 rounded-[3px] bg-bd"><div class="h-[5px] rounded-[3px] bg-brand transition-[width] duration-[.4s]" style="width:\${(cnt/maxC*100).toFixed(1)}%"></div></div><span class="w-7 text-right text-[.73rem] text-tx-3">\${cnt}</span></div>\`
      ).join('') || '<span class="text-tx-3 text-[.82rem]">暂无数据</span>';

      // IP bars
      const il = Object.entries(data.ips ?? {}).sort((a,b) => b[1]-a[1]).slice(0,10);
      const maxI = il[0]?.[1] ?? 1;
      document.getElementById('psmIpBars').innerHTML = il.map(([ip,cnt]) =>
        \`<div class="flex items-center gap-[10px] mb-[5px] text-[.78rem]"><span class="w-[120px] font-mono text-[.75rem] text-[#aaa] shrink-0 overflow-hidden text-ellipsis">\${ip}</span><div class="h-[5px] flex-1 rounded-[3px] bg-bd"><div class="h-[5px] rounded-[3px] bg-brand transition-[width] duration-[.4s]" style="width:\${(cnt/maxI*100).toFixed(1)}%"></div></div><span class="w-7 text-right text-[.73rem] text-tx-3">\${cnt}</span></div>\`
      ).join('') || '<span class="text-tx-3 text-[.82rem]">暂无数据</span>';

      // Access log
      document.getElementById('psmLogBody').innerHTML = (data.accesses ?? []).slice(0,50).map(a =>
        \`<tr><td>\${new Date(a.ts).toLocaleString('zh-CN')}</td><td class="font-mono">\${a.ip}</td><td>\${a.country}</td><td>\${[a.city,a.region].filter(x=>x&&x!=='—').join(' ')}</td><td class="text-tx-3">\${a.org!=='—'?a.org:''}</td></tr>\`
      ).join('') || '<tr><td colspan="5" class="text-tx-3 text-center">暂无记录</td></tr>';
    } catch {
      document.getElementById('psmLogBody').innerHTML = '<tr><td colspan="5" class="text-tx-3 text-center">加载失败</td></tr>';
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
    document.getElementById('prsLogBody').innerHTML = '<tr><td colspan="3" class="text-tx-3 text-center">加载中…</td></tr>';
    document.getElementById('protoStatsModal').classList.add('show');
    try {
      const res = await adminFetch('/admin/proto-stats/' + encodeURIComponent(protoId), { headers: authH() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      document.getElementById('prsTotal').textContent = (data.count ?? 0).toLocaleString();
      document.getElementById('prsUniqueIps').textContent = (data.uniqueIps ?? 0).toLocaleString();
      document.getElementById('prsLast').textContent = data.lastAccess ? timeAgo(data.lastAccess) : '—';
      const cl = Object.entries(data.countries ?? {}).sort((a,b) => b[1]-a[1]).slice(0,10);
      const maxC = cl[0]?.[1] ?? 1;
      document.getElementById('prsCountryBars').innerHTML = cl.map(([c,cnt]) =>
        \`<div class="flex items-center gap-[10px] mb-[5px] text-[.78rem]"><span class="w-9 shrink-0 font-mono text-[.73rem] text-tx-2">\${c}</span><div class="h-[5px] flex-1 rounded-[3px] bg-bd"><div class="h-[5px] rounded-[3px] bg-brand transition-[width] duration-[.4s]" style="width:\${(cnt/maxC*100).toFixed(1)}%"></div></div><span class="w-7 text-right text-[.73rem] text-tx-3">\${cnt}</span></div>\`
      ).join('') || '<span class="text-tx-3 text-[.82rem]">暂无数据</span>';
      document.getElementById('prsLogBody').innerHTML = (data.accesses ?? []).slice(0,50).map(a =>
        \`<tr><td>\${new Date(a.ts).toLocaleString('zh-CN')}</td><td class="font-mono text-[.75rem]">\${a.ip}</td><td>\${a.country}</td></tr>\`
      ).join('') || '<tr><td colspan="3" class="text-tx-3 text-center">暂无记录</td></tr>';
    } catch {
      document.getElementById('prsLogBody').innerHTML = '<tr><td colspan="3" class="text-tx-3 text-center">加载失败</td></tr>';
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
    document.getElementById('pvmDiffBtn').classList.add('hidden');
    document.getElementById('pvmMode').textContent = '点击版本号查看文件列表，勾选两个版本进行对比';
    document.getElementById('pvmContent').innerHTML = '<div class="text-tx-3 text-center py-[60px] text-[.85rem]"><svg class="inline-block h-4 w-4 -mt-0.5 mr-1" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="13" y1="8" x2="3" y2="8"/><polyline points="7,4 3,8 7,12"/></svg>点击左侧版本号查看文件列表</div>';

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
      const cardBase = 'pvm-ver-card cursor-pointer rounded-md border border-bd bg-bg-2 px-[10px] py-[9px] transition hover:border-bd-2 [&.active]:border-brand [&.active]:bg-brand-muted [&.checked-a]:border-green [&.checked-a]:bg-green-g [&.checked-b]:border-amber [&.checked-b]:bg-amber-g';
      const cardClass = checkIdx === 0 ? cardBase+' checked-a'
                      : checkIdx === 1 ? cardBase+' checked-b'
                      : isActive       ? cardBase+' active'
                      :                  cardBase;
      return \`<div class="\${cardClass}" onclick="pvmSelectVersion(\${v.v})">
        <div class="flex items-center gap-1 flex-wrap">
          <span class="mr-1 rounded-xs border border-bd-2 bg-white/[.08] px-[7px] py-px font-mono text-[.72rem] font-bold text-tx">v\${v.v}</span>
          \${isLatest ? '<span class="rounded-[3px] border border-green-r bg-green-g px-1.5 py-px text-[.65rem] font-bold text-green">最新</span>' : ''}
          \${!isLatest ? \`<button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-red-r bg-red-g px-3 py-1.5 text-sm font-semibold leading-tight text-red transition hover:bg-red-r !px-1.5 !py-px !text-[.62rem] ml-auto" onclick="event.stopPropagation();pvmDeleteVersion(\${v.v})">删除</button>\` : ''}
        </div>
        <div class="mt-1 font-mono text-[.7rem] text-tx-3">\${v.at ? new Date(v.at).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—'}</div>
        <div class="mt-1 font-mono text-[.7rem] text-tx-3">\${v.files ?? '?'} 文件 · \${v.size ? fmtSize(v.size) : '—'}</div>
        <label class="flex items-center gap-[5px] mt-[5px] text-[.7rem] text-tx-3" onclick="event.stopPropagation()">
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
      document.getElementById('pvmContent').innerHTML = '<div class="text-tx-3 text-center py-[60px] text-[.85rem]"><svg class="inline-block h-4 w-4 -mt-0.5 mr-1" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="13" y1="8" x2="3" y2="8"/><polyline points="7,4 3,8 7,12"/></svg>点击左侧版本号查看文件列表</div>';
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
      diffBtn.classList.remove('hidden');
      document.getElementById('pvmMode').textContent = \`已选 v\${pvmChecked[0]}（A）与 v\${pvmChecked[1]}（B），点击"对比"查看差异\`;
    } else {
      diffBtn.classList.add('hidden');
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
    document.getElementById('pvmContent').innerHTML = '<div class="text-tx-3 text-center py-10">加载中…</div>';
  }

  function pvmShowFileList(files, title) {
    const q = document.getElementById('pvmSearch').value.toLowerCase();
    if (!files) {
      document.getElementById('pvmContent').innerHTML = \`<div class="text-tx-3 text-[.82rem] text-center py-10">该版本无文件记录（旧版本上传未记录文件列表）</div>\`;
      return;
    }
    const filtered = q ? files.filter(f => f.toLowerCase().includes(q)) : files;
    document.getElementById('pvmContent').innerHTML = \`
      <div class="text-[.75rem] text-tx-3 mb-[10px] font-medium">\${title}\${q ? \` — 过滤 "\${q}"\` : ''}</div>
      <div>\${filtered.map(f => \`<div class="flex items-center gap-1.5 rounded-xs px-1.5 py-[3px] font-mono text-[.7rem] mb-px text-tx-3 transition hover:bg-bg-hover hover:text-tx-2">\${esc(f)}</div>\`).join('') || '<div class="text-tx-3 text-[.82rem] py-5">无匹配文件</div>'}</div>\`;
  }

  document.getElementById('pvmDiffBtn').addEventListener('click', async () => {
    if (pvmChecked.length < 2) return;
    const [a, b] = pvmChecked;
    pvmShowLoading();
    const [filesA, filesB] = await Promise.all([pvmFetchFiles(a), pvmFetchFiles(b)]);
    if (!filesA && !filesB) {
      document.getElementById('pvmContent').innerHTML = '<div class="text-tx-3 text-center py-10 text-[.82rem]">两个版本均无文件记录（旧版本上传未记录文件列表）</div>';
      return;
    }
    if (!filesA || !filesB) {
      const missing = !filesA ? \`v\${a}\` : \`v\${b}\`;
      document.getElementById('pvmContent').innerHTML = \`<div class="text-tx-3 text-center py-10 text-[.82rem]">\${missing} 无文件记录，无法对比</div>\`;
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
    const summary = \`<div class="flex gap-3 mb-4 text-[.78rem] flex-wrap">
      <span>v\${verA} → v\${verB}</span>
      <span class="text-[#10b981]">+\${added.length} 新增</span>
      <span class="text-[#ef4444]">-\${removed.length} 删除</span>
      <span class="text-tx-3">\${same.length} 不变</span>
    </div>\`;

    const DIFF_FILE_BASE = 'flex items-center gap-1.5 rounded-xs px-1.5 py-[3px] font-mono text-[.72rem] mb-px';
    const mkRows = (files, cls, prefix) =>
      files.map(f => \`<div class="diff-file \${DIFF_FILE_BASE} \${cls}"><span class="w-[14px] shrink-0 font-bold">\${prefix}</span>\${esc(f)}</div>\`).join('');

    let html = summary;
    const DIFF_H4_BASE = 'text-[.72rem] font-bold mb-1.5 px-2 py-[5px] rounded-xs uppercase tracking-[.08em]';
    if (added.length)
      html += \`<div class="diff-section mb-[14px]"><h4 class="\${DIFF_H4_BASE} bg-green-g text-green flex items-center gap-1"><svg class="h-3 w-3 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>新增 \${added.length} 个文件（v\${verB} 新增）</h4>\${mkRows(added,'bg-green-g text-green','+')}</div>\`;
    if (removed.length)
      html += \`<div class="diff-section mb-[14px]"><h4 class="\${DIFF_H4_BASE} bg-red-g text-red flex items-center gap-1"><svg class="h-3 w-3 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="3" y1="8" x2="13" y2="8"/></svg>删除 \${removed.length} 个文件（v\${verB} 移除）</h4>\${mkRows(removed,'bg-red-g text-red','−')}</div>\`;
    if (same.length)
      html += \`<div class="diff-section mb-[14px]"><h4 class="\${DIFF_H4_BASE} bg-[rgba(255,255,255,.04)] text-tx-3">· 未变动 \${same.length} 个文件</h4>\${mkRows(same,'text-tx-3',' ')}</div>\`;
    if (!added.length && !removed.length && !same.length)
      html += '<div class="text-tx-3 text-center py-10 text-[.82rem]">无匹配文件</div>';

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

  // Vditor editor management (mirrors the front-end page editor)
  let apmVditorGen = 0;
  let apmVditorLoading = null;
  function getApmContent() {
    return apmVditorInst ? apmVditorInst.getValue() : document.getElementById('apmContent').value;
  }
  function ensureApmVditor() {
    if (window.Vditor) return Promise.resolve(true);
    if (apmVditorLoading) return apmVditorLoading;
    if (!document.getElementById('apmVditorCss')) {
      const l = document.createElement('link');
      l.id = 'apmVditorCss'; l.rel = 'stylesheet';
      l.href = 'https://cdn.jsdelivr.net/npm/vditor/dist/index.css';
      document.head.appendChild(l);
    }
    apmVditorLoading = new Promise(resolve => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/vditor/dist/index.min.js';
      s.onload = () => resolve(true);
      s.onerror = () => { apmVditorLoading = null; resolve(false); };
      document.body.appendChild(s);
    });
    return apmVditorLoading;
  }

  async function initApmVditor(content) {
    const gen = ++apmVditorGen;
    const seed = () => {
      const ta = document.getElementById('apmContent');
      if (ta && ta.value) return ta.value;
      return content || '';
    };
    const ok = await ensureApmVditor();
    if (gen !== apmVditorGen) return;
    if (!ok || !window.Vditor) {
      const ta = document.getElementById('apmContent');
      ta.value = seed(); ta.style.display = '';
      return;
    }
    if (apmVditorInst) {
      if (gen !== apmVditorGen) return;
      apmVditorInst.setValue(seed());
      return;
    }

    const box = document.getElementById('apmVditor');
    box.style.display = 'flex';
    document.getElementById('apmContent').style.display = 'none';

    const finalContent = seed();
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

    apmVditorInst = new Vditor('apmVditor', {
      height: editorH,
      mode: 'sv',
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
        headers: adminToken ? { Authorization: 'Bearer ' + adminToken } : {},
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
        if (gen !== apmVditorGen) return;
        try {
          window.dispatchEvent(new Event('resize'));
          apmVditorInst && apmVditorInst.focus();
        } catch {}
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

  function destroyApmVditor() {
    apmVditorGen++;
    if (apmVditorInst) { try { apmVditorInst.destroy(); } catch {} apmVditorInst = null; }
    const box = document.getElementById('apmVditor');
    if (box) { box.style.display = 'none'; box.innerHTML = ''; }
    document.getElementById('apmContent').style.display = '';
  }

  function switchApmEditorToType(type, content) {
    if (type === 'markdown') {
      const ta = document.getElementById('apmContent');
      if (ta) ta.value = content || '';
      initApmVditor(content || '');
    } else {
      const prev = apmVditorInst ? apmVditorInst.getValue() : content;
      destroyApmVditor();
      document.getElementById('apmContent').value = prev || content || '';
      document.getElementById('apmContent').style.display = '';
    }
  }

  let adminAllPages = [], adminAllProjects = [], adminAllGroups = [];
  let adminPageSortKey = 'updated', adminPageSortAsc = false;
  let adminPageSelectMode = false;
  const adminPageSelected = new Set();

  async function loadAdminPages() {
    document.getElementById('adminPagesBody').innerHTML = '<tr><td colspan="10" class="text-center text-tx-3 p-6">加载中…</td></tr>';
    const res = await adminFetch('/admin/pages', { headers: authH() });
    if (!res.ok) return;
    const data = await res.json();
    adminAllPages = data.pages || [];
    adminAllProjects = data.projects || [];
    adminAllGroups = data.groups || [];
    updateAdminPageProjFilter();
    updateAdminPageGrpFilter(true);
    updateAdminOrgActions();
    renderAdminPages();
  }

  function updateAdminPageProjFilter() {
    const sel = document.getElementById('adminPageProjFilter');
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="all">全部项目</option><option value="_none_">未分类</option>' +
      adminAllProjects.map(p => '<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join('');
    sel.value = adminAllProjects.some(p => p.id === cur) ? cur : 'all';
  }

  function updateAdminPageGrpFilter(preserveSelection) {
    const projSel = document.getElementById('adminPageProjFilter');
    const grpSel = document.getElementById('adminPageGrpFilter');
    if (!projSel || !grpSel) return;
    const cur = grpSel.value;
    const pid = projSel.value;
    const grps = pid && pid !== 'all' && pid !== '_none_' ? adminAllGroups.filter(g => g.projectId === pid) : [];
    grpSel.innerHTML = '<option value="all">全部分组</option>' +
      (grps.length ? '<option value="_none_">未分组</option>' : '') +
      grps.map(g => '<option value="'+esc(g.id)+'">'+esc(g.name)+'</option>').join('');
    if (preserveSelection && (cur === '_none_' || grps.some(g => g.id === cur))) grpSel.value = cur;
  }

  // A single project+group is selected → pages in view share one reorder scope
  // (mirrors the backend's inScope() check in handleReorderPages).
  function currentAdminPageScope() {
    const projFilter = document.getElementById('adminPageProjFilter')?.value || 'all';
    const grpFilter = document.getElementById('adminPageGrpFilter')?.value || 'all';
    if (projFilter === '_none_') return { scoped: true, projectId: null, groupId: null };
    if (projFilter !== 'all') {
      const hasGroups = adminAllGroups.some(g => g.projectId === projFilter);
      if (!hasGroups) return { scoped: true, projectId: projFilter, groupId: null };
      if (grpFilter !== 'all') return { scoped: true, projectId: projFilter, groupId: grpFilter === '_none_' ? null : grpFilter };
    }
    return { scoped: false, projectId: null, groupId: null };
  }

  const ICON_EDIT = '<svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2l3 3-8 8-3.5 1 1-3.5 8-8z"/></svg>';
  const ICON_TRASH = '<svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9.5a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9L12 4"/></svg>';
  const ORG_ACTION_BTN = 'flex h-6 w-6 items-center justify-center rounded-xs border border-transparent bg-transparent text-tx-3 transition cursor-pointer hover:border-bd hover:bg-bg-5 hover:text-tx';
  const ORG_ACTION_BTN_DANGER = 'flex h-6 w-6 items-center justify-center rounded-xs border border-transparent bg-transparent text-tx-3 transition cursor-pointer hover:border-red-r hover:bg-red-g hover:text-red';

  // Edit/delete icons next to the project & group filters — they double as the
  // "currently selected" management target, so there's no separate tree UI to build.
  function updateAdminOrgActions() {
    const projFilter = document.getElementById('adminPageProjFilter')?.value || 'all';
    const grpFilter = document.getElementById('adminPageGrpFilter')?.value || 'all';
    const projActions = document.getElementById('adminProjActions');
    const grpActions = document.getElementById('adminGrpActions');
    if (projActions) {
      projActions.innerHTML = (projFilter !== 'all' && projFilter !== '_none_')
        ? \`<button class="\${ORG_ACTION_BTN}" title="编辑项目" onclick="adminEditProject('\${esc(projFilter)}')">\${ICON_EDIT}</button><button class="\${ORG_ACTION_BTN_DANGER}" title="删除项目" onclick="adminDeleteProject('\${esc(projFilter)}')">\${ICON_TRASH}</button>\`
        : '';
    }
    if (grpActions) {
      grpActions.innerHTML = (grpFilter !== 'all' && grpFilter !== '_none_')
        ? \`<button class="\${ORG_ACTION_BTN}" title="编辑分组" onclick="adminEditGroup('\${esc(grpFilter)}')">\${ICON_EDIT}</button><button class="\${ORG_ACTION_BTN_DANGER}" title="删除分组" onclick="adminDeleteGroup('\${esc(grpFilter)}')">\${ICON_TRASH}</button>\`
        : '';
    }
  }

  function renderAdminPages() {
    const q = (document.getElementById('adminPageSearch')?.value || '').toLowerCase();
    const projFilter = document.getElementById('adminPageProjFilter')?.value || 'all';
    const grpFilter = document.getElementById('adminPageGrpFilter')?.value || 'all';
    const typeFilter = document.getElementById('adminPageTypeFilter')?.value || 'all';
    const projMap = Object.fromEntries(adminAllProjects.map(p => [p.id, p.name]));
    const grpMap = Object.fromEntries(adminAllGroups.map(g => [g.id, g.name]));
    let filtered = adminAllPages;
    if (q) filtered = filtered.filter(p =>
      (p.title||'').toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || (p.owner||'').toLowerCase().includes(q)
    );
    if (typeFilter !== 'all') filtered = filtered.filter(p => p.type === typeFilter);
    if (projFilter === '_none_') filtered = filtered.filter(p => !p.projectId);
    else if (projFilter !== 'all') filtered = filtered.filter(p => p.projectId === projFilter);
    if (grpFilter === '_none_') filtered = filtered.filter(p => !p.groupId);
    else if (grpFilter !== 'all') filtered = filtered.filter(p => p.groupId === grpFilter);
    const pageScope = currentAdminPageScope();
    const sorted = [...filtered].sort((a, b) => {
      // Scoped to one project/group: always show true drag order, not the column sort
      // (the reorder API also bumps updatedAt, so sorting by "updated" here would
      // immediately re-shuffle rows right after a drag and make it look broken).
      if (pageScope.scoped) return (a.sort ?? 0) - (b.sort ?? 0);
      let va, vb;
      switch (adminPageSortKey) {
        case 'title': va = (a.title||'').toLowerCase(); vb = (b.title||'').toLowerCase(); return adminPageSortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
        case 'type': va = a.type||''; vb = b.type||''; return adminPageSortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
        case 'owner': va = (a.owner||'').toLowerCase(); vb = (b.owner||'').toLowerCase(); return adminPageSortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
        case 'status': va = a.isPublic ? 0 : 1; vb = b.isPublic ? 0 : 1; return adminPageSortAsc ? va - vb : vb - va;
        case 'updated': default: va = a.updatedAt||0; vb = b.updatedAt||0; return adminPageSortAsc ? va - vb : vb - va;
      }
    });
    const TYPE_LABEL = { markdown: '<span class="bg-[rgba(59,130,246,.1)] text-accent px-1.5 py-0.5 rounded text-[.7rem]">MD</span>', html: '<span class="bg-[rgba(245,158,11,.1)] text-[#f59e0b] px-1.5 py-0.5 rounded text-[.7rem]">HTML</span>' };
    const selMode = adminPageSelectMode;
    const checkCol = (selMode ? 'pg-check-col selecting' : 'pg-check-col') + ' hidden w-[34px] text-center [&.selecting]:table-cell';
    const scope = pageScope;
    document.getElementById('pgDragHead')?.classList.toggle('scoped', true);
    document.getElementById('adminPageReorderHint')?.classList.toggle('hidden', false);
    const dragCol = 'pg-drag-col scoped hidden w-[28px] text-center [&.scoped]:table-cell';
    document.getElementById('adminPagesBody').innerHTML = sorted.length
      ? sorted.map(p => \`<tr data-slug="\${esc(p.slug)}" draggable="true" class="pg-drag-row" data-project-id="\${esc(p.projectId||'')}" data-group-id="\${esc(p.groupId||'')}">
          <td class="\${dragCol} cursor-grab select-none text-tx-3 active:cursor-grabbing pointer-events-none">⠿</td>
          <td class="\${checkCol}"><input type="checkbox" class="h-[15px] w-[15px] cursor-pointer accent-tx-2" data-slug="\${esc(p.slug)}" \${adminPageSelected.has(p.slug)?'checked':''} onchange="adminPageToggleSel('\${esc(p.slug)}',this.checked)"></td>
          <td>
            <div class="font-medium text-[.84rem]">\${esc(p.title)}</div>
            <div class="font-mono text-[.7rem] text-tx-3">/p/\${p.slug}</div>
          </td>
          <td>\${TYPE_LABEL[p.type] || p.type}</td>
          <td class="text-[.76rem] text-tx-2">@\${p.owner}</td>
          <td class="text-[.76rem] text-tx-2">\${p.projectId ? esc(projMap[p.projectId] || '--') : '--'}</td>
          <td class="text-[.76rem] text-tx-2">\${p.groupId ? esc(grpMap[p.groupId] || '--') : '--'}</td>
          <td>\${p.isPublic ? '<span class="text-green text-[.76rem]">公开</span>' : '<span class="text-tx-3 text-[.76rem]">私密</span>'}</td>
          <td class="text-[.76rem] text-tx-2">\${timeAgo(p.updatedAt)}</td>
          <td class="whitespace-nowrap">
            <a href="/p/\${p.slug}" target="_blank" draggable="false" class="inline-flex items-center rounded-sm border border-bd bg-bg-4 px-2 py-1 text-[.72rem] font-semibold text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx no-underline" onclick="event.stopPropagation()">预览</a>
            <button class="inline-flex items-center rounded-sm border border-bd bg-bg-4 px-2 py-1 text-[.72rem] font-semibold text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" onclick="event.stopPropagation();adminEditPage('\${p.slug}')">编辑</button>
            <button class="inline-flex items-center rounded-sm border border-bd bg-bg-4 px-2 py-1 text-[.72rem] font-semibold text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx" data-title="\${esc(p.title)}" onclick="event.stopPropagation();openPageStatsModal('\${p.slug}',this.dataset.title)">统计</button>
            <button class="inline-flex items-center rounded-sm border border-red-r bg-red-g px-2 py-1 text-[.72rem] font-semibold text-red transition hover:bg-red-r" onclick="event.stopPropagation();adminDeletePage('\${p.slug}')">删除</button>
          </td>
        </tr>\`).join('')
      : '<tr><td colspan="10" class="text-center text-tx-3 p-6">暂无页面</td></tr>';
    // update select-all checkbox state
    const allCbs = document.querySelectorAll('#adminPagesBody .pg-check');
    const visSlugs = [...allCbs].map(cb => cb.dataset.slug);
    const allSel = visSlugs.length > 0 && visSlugs.every(s => adminPageSelected.has(s));
    const saCb = document.getElementById('adminPageSelectAll');
    if (saCb) saCb.checked = allSel;
    initAdminPageDnD(scope);
  }

  // ── Drag-to-reorder: always available, cross-scope move when project/group differs ──
  let adminDragSlug = null, adminDragProjectId = null, adminDragGroupId = null;
  function initAdminPageDnD(scope) {
    if (adminPageSelectMode) return;
    document.querySelectorAll('#adminPagesBody tr.pg-drag-row').forEach(row => {
      row.addEventListener('dragstart', (e) => {
        if (e.target.closest('button, a, input, select')) { e.preventDefault(); return; }
        adminDragSlug = row.dataset.slug;
        adminDragProjectId = row.dataset.projectId || '';
        adminDragGroupId = row.dataset.groupId || '';
        row.classList.add('opacity-30');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', row.dataset.slug);
      });
      row.addEventListener('dragend', () => {
        row.classList.remove('opacity-30');
        document.querySelectorAll('#adminPagesBody tr').forEach(r => r.classList.remove('border-t-2', 'border-t-accent', 'shadow-[inset_0_3px_0_0_var(--color-accent)]'));
        adminDragSlug = null;
        adminDragProjectId = null;
        adminDragGroupId = null;
      });
      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!adminDragSlug || row.dataset.slug === adminDragSlug) return;
        document.querySelectorAll('#adminPagesBody tr').forEach(r => r.classList.remove('border-t-2', 'border-t-accent', 'shadow-[inset_0_3px_0_0_var(--color-accent)]'));
        row.classList.add('border-t-2', 'border-t-accent', 'shadow-[inset_0_3px_0_0_var(--color-accent)]');
      });
      row.addEventListener('drop', async (e) => {
        e.preventDefault();
        row.classList.remove('border-t-2', 'border-t-accent');
        if (!adminDragSlug || row.dataset.slug === adminDragSlug) return;
        const tgtProjectId = row.dataset.projectId || '';
        const tgtGroupId = row.dataset.groupId || '';
        const tbody = row.parentElement;
        const sameScope = adminDragProjectId === tgtProjectId && adminDragGroupId === tgtGroupId;
        if (sameScope) {
          // optimistic local reorder
          const fromRow = tbody.querySelector('tr[data-slug="' + CSS.escape(adminDragSlug) + '"]');
          if (fromRow) tbody.insertBefore(fromRow, row.nextSibling);
          const order = [...tbody.querySelectorAll('tr.pg-drag-row')].map(r => r.dataset.slug);
          adminFetch('/admin/pages/reorder', {
            method: 'PATCH', headers: authH(),
            body: JSON.stringify({ projectId: tgtProjectId || null, groupId: tgtGroupId || null, order }),
          }).catch(() => {});
        } else {
          // optimistic move: update row dataset + move visually
          row.dataset.projectId = tgtProjectId;
          row.dataset.groupId = tgtGroupId;
          // move/page persist, then reorder
          try { await adminFetch('/admin/pages/' + encodeURIComponent(adminDragSlug), {
            method: 'PATCH', headers: authH(),
            body: JSON.stringify({ projectId: tgtProjectId || null, groupId: tgtGroupId || null }),
          }); } catch {}
          const order = [...tbody.querySelectorAll('tr.pg-drag-row')].map(r => r.dataset.slug).filter(id => id !== adminDragSlug);
          const to = order.indexOf(row.dataset.slug);
          if (to !== -1) order.splice(to, 0, adminDragSlug);
          else order.push(adminDragSlug);
          adminFetch('/admin/pages/reorder', {
            method: 'PATCH', headers: authH(),
            body: JSON.stringify({ projectId: tgtProjectId || null, groupId: tgtGroupId || null, order }),
          }).catch(() => {});
        }
      });
    });
    initAdminTouchDnD();
  }

  // ── Admin touch drag support (long-press to activate, elementFromPoint for drop targets) ──
  function initAdminTouchDnD() {
    if (adminPageSelectMode) return;
    let tState = null, tGhost = null, tTimer = null;
    document.querySelectorAll('#adminPagesBody tr.pg-drag-row').forEach(row => {
      row.addEventListener('touchstart', (e) => {
        if (e.target.closest('button, a, input, select')) return;
        tTimer = setTimeout(() => {
          tState = { slug: row.dataset.slug, projectId: row.dataset.projectId || '', groupId: row.dataset.groupId || '', el: row };
          const r = row.getBoundingClientRect();
          tGhost = row.cloneNode(true);
          Object.assign(tGhost.style, {
            position: 'fixed', left: r.left + 'px', top: r.top + 'px',
            width: r.width + 'px', opacity: '0.7', pointerEvents: 'none',
            zIndex: '9999', transform: 'scale(1.02)',
            border: '2px dashed var(--color-accent)', borderRadius: '6px',
          });
          document.body.appendChild(tGhost);
          row.classList.add('opacity-30');
          document.body.style.overflow = 'hidden';
        }, 300);
      }, { passive: true });
      row.addEventListener('touchmove', (e) => {
        if (!tState) { clearTimeout(tTimer); return; }
        e.preventDefault();
        const t = e.touches[0];
        if (tGhost) { tGhost.style.left = (t.clientX - 20) + 'px'; tGhost.style.top = (t.clientY - 20) + 'px'; }
        document.querySelectorAll('#adminPagesBody tr').forEach(r => r.classList.remove('border-t-2', 'border-t-accent', 'shadow-[inset_0_3px_0_0_var(--color-accent)]'));
        const under = document.elementFromPoint(t.clientX, t.clientY);
        const tr = under?.closest('#adminPagesBody tr.pg-drag-row');
        if (tr && tr !== row) tr.classList.add('border-t-2', 'border-t-accent', 'shadow-[inset_0_3px_0_0_var(--color-accent)]');
      }, { passive: false });
      row.addEventListener('touchend', async (e) => {
        clearTimeout(tTimer);
        if (!tState) return;
        if (tGhost) { tGhost.remove(); tGhost = null; }
        document.body.style.overflow = '';
        const t = e.changedTouches[0];
        const under = document.elementFromPoint(t.clientX, t.clientY);
        const target = under?.closest('#adminPagesBody tr.pg-drag-row');
        if (target && target !== row) {
          const tgtProjectId = target.dataset.projectId || '';
          const tgtGroupId = target.dataset.groupId || '';
          const sameScope = tState.projectId === tgtProjectId && tState.groupId === tgtGroupId;
          if (sameScope) {
            const fromRow = row.parentElement.querySelector('tr[data-slug="' + CSS.escape(tState.slug) + '"]');
            if (fromRow) {
              if (target.nextSibling) target.parentElement.insertBefore(fromRow, target.nextSibling);
              else target.parentElement.appendChild(fromRow);
            }
            const order = [...row.parentElement.querySelectorAll('tr.pg-drag-row')].map(r => r.dataset.slug);
            adminFetch('/admin/pages/reorder', {
              method: 'PATCH', headers: authH(),
              body: JSON.stringify({ projectId: tgtProjectId || null, groupId: tgtGroupId || null, order }),
            }).catch(() => {});
          } else {
            target.dataset.projectId = tgtProjectId;
            target.dataset.groupId = tgtGroupId;
            const fromRow = row.parentElement.querySelector('tr[data-slug="' + CSS.escape(tState.slug) + '"]');
            if (fromRow) target.parentElement.insertBefore(fromRow, target);
            try { await adminFetch('/admin/pages/' + encodeURIComponent(tState.slug), {
              method: 'PATCH', headers: authH(),
              body: JSON.stringify({ projectId: tgtProjectId || null, groupId: tgtGroupId || null }),
            }); } catch {}
            const order = [...row.parentElement.querySelectorAll('tr.pg-drag-row')].map(r => r.dataset.slug).filter(id => id !== tState.slug);
            const to = order.indexOf(target.dataset.slug);
            if (to !== -1) order.splice(to, 0, tState.slug);
            else order.push(tState.slug);
            adminFetch('/admin/pages/reorder', {
              method: 'PATCH', headers: authH(),
              body: JSON.stringify({ projectId: tgtProjectId || null, groupId: tgtGroupId || null, order }),
            }).catch(() => {});
          }
        }
        row.classList.remove('opacity-30');
        document.querySelectorAll('#adminPagesBody tr').forEach(r => r.classList.remove('border-t-2', 'border-t-accent', 'shadow-[inset_0_3px_0_0_var(--color-accent)]'));
        tState = null;
      });
    });
  }

  window.adminPageSort = function(key) {
    if (adminPageSortKey === key) adminPageSortAsc = !adminPageSortAsc;
    else { adminPageSortKey = key; adminPageSortAsc = key === 'title' || key === 'owner'; }
    renderAdminPages();
  };

  window.adminPageToggleSel = function(slug, checked) {
    if (checked) adminPageSelected.add(slug); else adminPageSelected.delete(slug);
    document.getElementById('adminPageSelCount').textContent = '已选 ' + adminPageSelected.size;
    const allCbs = document.querySelectorAll('#adminPagesBody .pg-check');
    const visSlugs = [...allCbs].map(cb => cb.dataset.slug);
    const saCb = document.getElementById('adminPageSelectAll');
    if (saCb) saCb.checked = visSlugs.length > 0 && visSlugs.every(s => adminPageSelected.has(s));
  };

  // ── Page select mode toggle ──
  document.getElementById('pageSelectToggle')?.addEventListener('click', () => {
    adminPageSelectMode = !adminPageSelectMode;
    if (!adminPageSelectMode) adminPageSelected.clear();
    const bar = document.getElementById('adminPageBulkBar');
    const btn = document.getElementById('pageSelectToggle');
    const headCol = document.getElementById('pgCheckHead');
    bar.style.display = adminPageSelectMode ? 'flex' : 'none';
    btn.textContent = adminPageSelectMode ? '退出选择' : '选择';
    btn.className = adminPageSelectMode ? BTN_PRIMARY_TOGGLE : BTN_GHOST_TOGGLE;
    if (headCol) headCol.classList.toggle('selecting', adminPageSelectMode);
    document.getElementById('adminPageSelCount').textContent = '已选 0';
    renderAdminPages();
  });

  document.getElementById('adminPageSelectAll')?.addEventListener('change', function() {
    const allCbs = document.querySelectorAll('#adminPagesBody .pg-check');
    if (this.checked) allCbs.forEach(cb => { adminPageSelected.add(cb.dataset.slug); cb.checked = true; });
    else { allCbs.forEach(cb => cb.checked = false); adminPageSelected.clear(); }
    document.getElementById('adminPageSelCount').textContent = '已选 ' + adminPageSelected.size;
  });

  document.getElementById('adminPageCancelSel')?.addEventListener('click', () => {
    adminPageSelectMode = false;
    adminPageSelected.clear();
    document.getElementById('adminPageBulkBar').style.display = 'none';
    document.getElementById('pageSelectToggle').textContent = '选择';
    document.getElementById('pageSelectToggle').className = BTN_GHOST_TOGGLE;
    const headCol = document.getElementById('pgCheckHead');
    if (headCol) headCol.classList.remove('selecting');
    renderAdminPages();
  });

  // ── Page batch delete ──
  async function runAdminPagePool(items, limit, worker) {
    let ok = 0, fail = 0;
    const executing = new Set();
    for (const item of items) {
      if (executing.size >= limit) await Promise.race(executing);
      const p = worker(item).then(r => { ok++; return r; }).catch(() => { fail++; });
      executing.add(p); p.finally(() => executing.delete(p));
    }
    await Promise.all(executing);
    return { ok, fail };
  }

  document.getElementById('adminPageBulkDelete')?.addEventListener('click', async () => {
    const slugs = [...adminPageSelected];
    if (!slugs.length) return;
    if (!confirm('确认删除选中的 ' + slugs.length + ' 个页面？')) return;
    const btn = document.getElementById('adminPageBulkDelete');
    btn.textContent = '删除中…'; btn.disabled = true;
    await runAdminPagePool(slugs, 6, async slug => {
      await adminFetch('/admin/pages/' + encodeURIComponent(slug), { method:'DELETE', headers:authH() });
    });
    toast('已删除 ' + slugs.length + ' 个页面');
    adminPageSelected.clear();
    loadAdminPages();
  });

  // ── Page batch visibility ──
  async function adminPageBulkPatch(body, label) {
    const slugs = [...adminPageSelected];
    if (!slugs.length) return;
    await runAdminPagePool(slugs, 6, async slug => {
      await adminFetch('/admin/pages/' + encodeURIComponent(slug), { method:'PATCH', headers:authH(), body:JSON.stringify(body) });
    });
    toast(label + ' ' + slugs.length + ' 个页面');
    adminPageSelected.clear();
    loadAdminPages();
  }
  document.getElementById('adminPageBulkPublic')?.addEventListener('click', () => adminPageBulkPatch({ isPublic: true }, '已设为公开'));
  document.getElementById('adminPageBulkPrivate')?.addEventListener('click', () => adminPageBulkPatch({ isPublic: false }, '已设为私密'));

  // ── Page batch move ──
  document.getElementById('adminPageBulkMove')?.addEventListener('click', () => {
    const slugs = [...adminPageSelected];
    if (!slugs.length) return;
    const modal = document.getElementById('adminPageBulkMoveModal');
    document.getElementById('apgMoveCount').textContent = slugs.length;
    const sel = document.getElementById('apgMoveProject');
    sel.innerHTML = '<option value="">-- 无 --</option>' +
      adminAllProjects.map(p => '<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join('');
    document.getElementById('apgMoveGroup').innerHTML = '<option value="">-- 无 --</option>';
    modal.classList.add('show');
  });

  document.getElementById('apgMoveProject')?.addEventListener('change', function() {
    const pid = this.value;
    const gSel = document.getElementById('apgMoveGroup');
    const grps = pid ? adminAllGroups.filter(g => g.projectId === pid) : [];
    gSel.innerHTML = '<option value="">-- 无 --</option>' + grps.map(g => '<option value="'+esc(g.id)+'">'+esc(g.name)+'</option>').join('');
  });

  document.getElementById('apgMoveConfirm')?.addEventListener('click', async () => {
    const slugs = [...adminPageSelected];
    const projectId = document.getElementById('apgMoveProject').value || null;
    const groupId = document.getElementById('apgMoveGroup').value || null;
    document.getElementById('adminPageBulkMoveModal').classList.remove('show');
    await runAdminPagePool(slugs, 6, async slug => {
      await adminFetch('/admin/pages/' + encodeURIComponent(slug), { method:'PATCH', headers:{...authH(),'Content-Type':'application/json'}, body:JSON.stringify({projectId,groupId}) });
    });
    toast('已移动 ' + slugs.length + ' 个页面');
    adminPageSelected.clear();
    loadAdminPages();
  });
  ['apgMoveClose','apgMoveCancel'].forEach(id => document.getElementById(id)?.addEventListener('click', () => document.getElementById('adminPageBulkMoveModal').classList.remove('show')));

  // ── New/edit group modal ──
  let adminEditingGroupId = null;
  document.getElementById('adminNewGroupBtn')?.addEventListener('click', () => {
    adminEditingGroupId = null;
    document.getElementById('apgGrpModalTitle').textContent = '新建分组';
    document.getElementById('apgNewGrpConfirm').textContent = '创建';
    const sel = document.getElementById('apgNewGrpProject');
    sel.innerHTML = '<option value="">-- 独立分组 --</option>' +
      adminAllProjects.map(p => '<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join('');
    document.getElementById('apgNewGrpName').value = '';
    document.getElementById('adminNewGroupModal').classList.add('show');
  });
  window.adminEditGroup = function(id) {
    const grp = adminAllGroups.find(g => g.id === id);
    if (!grp) return;
    adminEditingGroupId = id;
    document.getElementById('apgGrpModalTitle').textContent = '编辑分组';
    document.getElementById('apgNewGrpConfirm').textContent = '保存';
    const sel = document.getElementById('apgNewGrpProject');
    sel.innerHTML = '<option value="">-- 独立分组 --</option>' +
      adminAllProjects.map(p => '<option value="'+esc(p.id)+'"'+(p.id===grp.projectId?' selected':'')+'>'+esc(p.name)+'</option>').join('');
    document.getElementById('apgNewGrpName').value = grp.name;
    document.getElementById('adminNewGroupModal').classList.add('show');
  };
  window.adminDeleteGroup = async function(id) {
    const grp = adminAllGroups.find(g => g.id === id);
    if (!grp) return;
    if (!confirm('确认删除分组「' + grp.name + '」？其下页面将变为未分组')) return;
    await adminFetch('/admin/groups/' + encodeURIComponent(id), { method:'DELETE', headers:authH() });
    toast('分组已删除');
    document.getElementById('adminPageGrpFilter').value = 'all';
    loadAdminPages();
  };
  document.getElementById('apgNewGrpConfirm')?.addEventListener('click', async () => {
    const projectId = document.getElementById('apgNewGrpProject').value || null;
    const name = document.getElementById('apgNewGrpName').value.trim();
    if (!name) { toast('请输入分组名称'); return; }
    const isEdit = !!adminEditingGroupId;
    const url = isEdit ? '/admin/groups/' + encodeURIComponent(adminEditingGroupId) : '/admin/groups';
    const meth = isEdit ? 'PATCH' : 'POST';
    const body = isEdit ? { name, projectId } : (projectId ? { projectId, name } : { name });
    const res = await adminFetch(url, { method: meth, headers: authH(), body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast('失败: ' + (data.error || '')); return; }
    document.getElementById('adminNewGroupModal').classList.remove('show');
    toast(isEdit ? '分组已更新' : '分组已创建');
    loadAdminPages();
  });
  ['apgNewGrpClose','apgNewGrpCancel'].forEach(id => document.getElementById(id)?.addEventListener('click', () => document.getElementById('adminNewGroupModal').classList.remove('show')));

  // ── New/edit/delete project modal ──
  let adminEditingProjectId = null;
  document.getElementById('adminNewProjectBtn')?.addEventListener('click', () => {
    adminEditingProjectId = null;
    document.getElementById('apjModalTitle').textContent = '新建项目';
    document.getElementById('apjModalSave').textContent = '创建';
    document.getElementById('apjName').value = '';
    document.getElementById('adminProjectModal').classList.add('show');
  });
  window.adminEditProject = function(id) {
    const proj = adminAllProjects.find(p => p.id === id);
    if (!proj) return;
    adminEditingProjectId = id;
    document.getElementById('apjModalTitle').textContent = '编辑项目';
    document.getElementById('apjModalSave').textContent = '保存';
    document.getElementById('apjName').value = proj.name;
    document.getElementById('adminProjectModal').classList.add('show');
  };
  window.adminDeleteProject = async function(id) {
    const proj = adminAllProjects.find(p => p.id === id);
    if (!proj) return;
    if (!confirm('确认删除项目「' + proj.name + '」？其下所有文档将变为未分类')) return;
    await adminFetch('/admin/projects/' + encodeURIComponent(id), { method:'DELETE', headers:authH() });
    toast('项目已删除');
    document.getElementById('adminPageProjFilter').value = 'all';
    loadAdminPages();
  };
  document.getElementById('apjModalSave')?.addEventListener('click', async () => {
    const name = document.getElementById('apjName').value.trim();
    if (!name) { toast('请输入项目名称'); return; }
    const isEdit = !!adminEditingProjectId;
    const url = isEdit ? '/admin/projects/' + encodeURIComponent(adminEditingProjectId) : '/admin/projects';
    const meth = isEdit ? 'PATCH' : 'POST';
    const res = await adminFetch(url, { method: meth, headers: authH(), body: JSON.stringify({ name }) });
    if (!res.ok) { toast('失败'); return; }
    document.getElementById('adminProjectModal').classList.remove('show');
    toast(isEdit ? '项目已更新' : '项目已创建');
    loadAdminPages();
  });
  ['apjModalClose','apjModalCancel'].forEach(id => document.getElementById(id)?.addEventListener('click', () => document.getElementById('adminProjectModal').classList.remove('show')));

  // ── Import ──
  let adminImportFile = null, adminImportMd = '';
  document.getElementById('adminImportBtn')?.addEventListener('click', () => {
    adminImportFile = null; adminImportMd = '';
    document.getElementById('aimDropZone').style.display = '';
    document.getElementById('aimPreview').style.display = 'none';
    document.getElementById('aimSave').disabled = true;
    document.getElementById('adminImportModal').classList.add('show');
  });
  document.getElementById('aimDropZone')?.addEventListener('click', () => document.getElementById('aimFileInput').click());
  document.getElementById('aimFileInput')?.addEventListener('change', (e) => { const f = e.target.files[0]; if (f) processAdminImportFile(f); });
  document.getElementById('aimDropZone')?.addEventListener('dragover', (e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)'; });
  document.getElementById('aimDropZone')?.addEventListener('dragleave', (e) => { e.currentTarget.style.borderColor = ''; });
  document.getElementById('aimDropZone')?.addEventListener('drop', (e) => {
    e.preventDefault(); e.currentTarget.style.borderColor = '';
    const f = e.dataTransfer.files[0]; if (f) processAdminImportFile(f);
  });
  function adminParseFrontmatter(text) {
    const match = text.match(/^---\\r?\\n([\\s\\S]*?)\\r?\\n---\\r?\\n?/);
    if (!match) return { metadata: {}, content: text };
    const yaml = match[1];
    const metadata = {};
    for (const line of yaml.split('\\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      if (key === 'isPublic') metadata[key] = val === 'true';
      else metadata[key] = val;
    }
    return { metadata, content: text.slice(match[0].length) };
  }
  function adminSlugFromFile(filename) {
    return filename.replace(/\\.(md|markdown|html?|htm)$/i, '').replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 120) || 'imported-' + Date.now();
  }
  function processAdminImportFile(file) {
    adminImportFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      adminImportMd = e.target.result;
      const { metadata } = adminParseFrontmatter(adminImportMd);
      const isHtml = /\.(html?|htm)$/i.test(file.name);
      document.getElementById('aimTitle').value = metadata.title || file.name.replace(/\\.(md|markdown|html?|htm)$/i, '');
      document.getElementById('aimSlug').value = metadata.slug || adminSlugFromFile(file.name);
      document.getElementById('aimType').value = metadata.type || (isHtml ? 'html' : 'markdown');
      document.getElementById('aimPublic').checked = metadata.isPublic !== false;
      const projSel = document.getElementById('aimProject');
      projSel.innerHTML = '<option value="">-- 无 --</option>' + adminAllProjects.map(p => '<option value="'+esc(p.id)+'"'+(p.id===metadata.projectId?' selected':'')+'>'+esc(p.name)+'</option>').join('');
      adminUpdateImportGroupSelect(metadata.projectId || '', metadata.groupId || '');
      document.getElementById('aimDropZone').style.display = 'none';
      document.getElementById('aimPreview').style.display = '';
      document.getElementById('aimSave').disabled = false;
    };
    reader.readAsText(file);
  }
  function adminUpdateImportGroupSelect(projectId, selectedId) {
    const sel = document.getElementById('aimGroup');
    const grps = projectId ? adminAllGroups.filter(g => g.projectId === projectId) : [];
    sel.innerHTML = '<option value="">-- 无 --</option>' + grps.map(g => '<option value="'+esc(g.id)+'"'+(g.id===selectedId?' selected':'')+'>'+esc(g.name)+'</option>').join('');
  }
  document.getElementById('aimProject')?.addEventListener('change', function() { adminUpdateImportGroupSelect(this.value, ''); });
  document.getElementById('aimSave')?.addEventListener('click', async () => {
    if (!adminImportFile || !adminImportMd) return;
    const fd = new FormData();
    fd.append('file', adminImportFile);
    fd.append('title', document.getElementById('aimTitle').value.trim());
    fd.append('slug', document.getElementById('aimSlug').value.trim());
    fd.append('type', document.getElementById('aimType').value);
    fd.append('isPublic', document.getElementById('aimPublic').checked ? 'true' : 'false');
    const pid = document.getElementById('aimProject').value;
    const gid = document.getElementById('aimGroup').value;
    if (pid) fd.append('projectId', pid);
    if (gid) fd.append('groupId', gid);
    const res = await adminFetch('/admin/pages/import', { method: 'POST', headers: { Authorization: 'Bearer ' + adminToken }, body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast('导入失败: ' + (data.error || '')); return; }
    document.getElementById('adminImportModal').classList.remove('show');
    toast('页面已导入');
    loadAdminPages();
  });
  ['aimClose','aimCancel'].forEach(id => document.getElementById(id)?.addEventListener('click', () => document.getElementById('adminImportModal').classList.remove('show')));

  // ── Page filters ──
  document.getElementById('adminPageSearch')?.addEventListener('input', renderAdminPages);
  document.getElementById('adminPageProjFilter')?.addEventListener('change', () => { updateAdminPageGrpFilter(); updateAdminOrgActions(); renderAdminPages(); });
  document.getElementById('adminPageGrpFilter')?.addEventListener('change', () => { updateAdminOrgActions(); renderAdminPages(); });
  document.getElementById('adminPageTypeFilter')?.addEventListener('change', renderAdminPages);
  initCustomSelect(document.getElementById('adminPageProjFilter'));
  initCustomSelect(document.getElementById('adminPageGrpFilter'));
  initCustomSelect(document.getElementById('adminPageTypeFilter'));

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
    const res = await adminFetch('/admin/pages/' + encodeURIComponent(slug), { headers: authH() });
    if (!res.ok) { toast('获取页面失败'); return; }
    const p = await res.json();
    adminOpenPageModal(p);
  }

  async function adminDeletePage(slug) {
    if (!confirm('确认删除页面 /p/' + slug + '？')) return;
    await adminFetch('/admin/pages/' + encodeURIComponent(slug), { method:'DELETE', headers:authH() });
    toast('已删除'); loadAdminPages();
  }

  function adminUpdateProjectSelect(selectedId) {
    const sel = document.getElementById('apmProject');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- 无 --</option>' +
      adminAllProjects.map(p => '<option value="'+esc(p.id)+'"'+(p.id===selectedId?' selected':'')+'>'+esc(p.name)+'</option>').join('');
  }

  function adminUpdateGroupSelect(projectId, selectedGroupId) {
    const sel = document.getElementById('apmGroup');
    if (!sel) return;
    const grps = adminAllGroups.filter(g => g.projectId === projectId);
    sel.innerHTML = '<option value="">-- 无 --</option>' +
      grps.map(g => '<option value="'+esc(g.id)+'"'+(g.id===selectedGroupId?' selected':'')+'>'+esc(g.name)+'</option>').join('');
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
    adminUpdateProjectSelect(page?.projectId || '');
    adminUpdateGroupSelect(page?.projectId || '', page?.groupId || '');
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
    const currentContent = getApmContent();
    switchApmEditorToType(type, currentContent);
  });

  document.getElementById('apmProject')?.addEventListener('change', () => {
    adminUpdateGroupSelect(document.getElementById('apmProject').value, '');
  });

  document.getElementById('apmSave').addEventListener('click', async () => {
    const slug    = document.getElementById('apmSlug').value.trim();
    const title   = document.getElementById('apmTitle').value.trim();
    const type    = document.getElementById('apmType').value;
    const content = type === 'markdown' && apmVditorInst
      ? apmVditorInst.getValue()
      : document.getElementById('apmContent').value;
    const isPublic = document.getElementById('apmPublic').checked;
    const accessPassword = !isPublic ? (document.getElementById('apmPassword').value.trim() || null) : null;
    const projectId = document.getElementById('apmProject')?.value || null;
    const groupId = document.getElementById('apmGroup')?.value || null;
    if (!slug || !content) { toast('Slug 和内容不能为空'); return; }
    const isEdit = !!adminEditingSlug;
    const url  = isEdit ? '/admin/pages/' + encodeURIComponent(adminEditingSlug) : '/admin/pages';
    const meth = isEdit ? 'PATCH' : 'POST';
    const body = isEdit
      ? { title, content, type, isPublic, accessPassword, projectId, groupId }
      : { slug, title, content, type, isPublic, accessPassword, projectId, groupId };
    const res = await fetch(url, { method:meth, headers:authH(), body:JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { toast('失败: ' + data.error); return; }
    destroyApmVditor();
    document.getElementById('adminPageModal').classList.remove('show');
    toast(isEdit ? '已保存' : '页面已创建');
    loadAdminPages();
  });
  function closeApmModal() {
    document.getElementById('adminPageModal').classList.remove('show');
    destroyApmVditor();
    document.getElementById('apmPwdSection').style.display = 'none';
    document.getElementById('apmPassword').value = '';
  }
  ['apmClose','apmCancel'].forEach(id => document.getElementById(id).addEventListener('click', closeApmModal));

  // ── Admin Protos ──────────────────────────────────────────────────────────────
  async function loadAdminProtos() {
    const tbody = document.getElementById('adminProtosBody');
    const empty = document.getElementById('adminProtosEmpty');
    tbody.innerHTML = '<tr><td colspan="10" class="text-center text-tx-3 p-6">加载中…</td></tr>';
    empty.style.display = 'none';
    try {
      const res = await adminFetch('/admin/protos', { headers: authH() });
      if (!res.ok) { tbody.innerHTML = '<tr><td colspan="10" class="text-center text-tx-3 p-6">加载失败</td></tr>'; return; }
      const { protos } = await res.json();
      if (!protos.length) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
      tbody.innerHTML = protos.map(p => {
        const url = location.origin + '/proto/' + p.protoId + '/';
        const previewUrl = url + (p.accessPassword ? '?pwd=' + encodeURIComponent(p.accessPassword) : '');
        const lock = p.hasPassword ? '<span class="inline-flex items-center bg-[rgba(251,191,36,.1)] text-[#fbbf24] rounded px-[5px] py-px"><svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7V4.5a3 3 0 0 1 6 0V7"/></svg></span>' : '';
        const priv = p.isPrivate ? '<span class="bg-white/[.06] text-tx-2 rounded text-[.68rem] px-[5px] py-px">私有</span>' : '';
        const pwdCell = p.hasPassword
          ? \`<div class="font-mono text-[.78rem] text-amber">\${esc(p.accessPassword || '••••••')}</div><div class="text-[.65rem] text-tx-3 mt-0.5">有效期：\${formatExpiry(p.passwordExpiry)}</div>\`
          : '<span class="text-tx-3 text-[.78rem]">无</span>';
        const verCount = (p.versions ?? []).length;
        const verBadge = \`<span class="font-mono text-[.72rem] text-tx-2">v\${p.version || 1}\${verCount > 1 ? ' ('+verCount+')' : ''}</span>\`;
        const visits = p.visitCount ?? 0;
        return \`<tr>
          <td>
            <div class="font-medium text-[.88rem] flex items-center gap-1 flex-wrap">\${esc(p.title || p.protoId)} \${lock}\${priv}</div>
            <div class="font-mono text-[.68rem] text-tx-3">\${p.protoId}</div>
          </td>
          <td class="text-[.79rem] text-tx-2">@\${esc(p.owner || '—')}</td>
          <td class="text-[.79rem] text-tx-2">\${p.fileCount ?? '—'}</td>
          <td class="text-[.79rem] text-tx-2">\${fmtSize(p.totalSize || 0)}</td>
          <td>\${pwdCell}</td>
          <td>\${verBadge}</td>
          <td class="font-mono text-[.82rem] font-bold text-tx">\${visits > 0 ? visits.toLocaleString() : '—'}</td>
          <td class="text-[.79rem] text-tx-2 whitespace-nowrap">\${fmtDate(p.createdAt)}</td>
          <td class="text-[.79rem] text-tx-2 whitespace-nowrap">\${timeAgo(p.updatedAt || p.createdAt)}</td>
          <td class="whitespace-nowrap">
            <a href="\${previewUrl}" target="_blank" class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-bd bg-bg-4 px-3 py-1.5 text-sm font-semibold leading-tight text-tx-2 transition hover:border-bd-2 hover:bg-bg-hover hover:text-tx !px-2 !py-1 !text-[.75rem] no-underline">预览</a>
            <button class="inline-flex min-h-8 items-center justify-center gap-[5px] rounded-sm border border-red-r bg-red-g px-3 py-1.5 text-sm font-semibold leading-tight text-red transition hover:bg-red-r !px-2 !py-1 !text-[.75rem]" onclick="adminDeleteProto('\${esc(p.protoId)}')">删除</button>
          </td>
        </tr>\`;
      }).join('');
    } catch { tbody.innerHTML = '<tr><td colspan="10" class="text-center text-tx-3 p-6">加载失败</td></tr>'; }
  }

  async function adminDeleteProto(protoId) {
    if (!confirm('确认删除此原型？将同时删除所有相关文件，此操作无法撤销。')) return;
    const res = await adminFetch('/admin/protos/' + encodeURIComponent(protoId), { method: 'DELETE', headers: authH() });
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
    const statusEl = document.getElementById('adminProtoStatusText');   statusEl.classList.remove('hidden'); statusEl.textContent = '';
    const errEl    = document.getElementById('adminProtoErr');          errEl.textContent = '';

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
      setStatus('正在解压 ZIP…', 3);
      const bytes = new Uint8Array(await zipFile.arrayBuffer());
      let files;
      try {
        const raw = _fflate().unzipSync(bytes);
        const fixed = {}; for (const [p,d] of Object.entries(raw)) fixed[_adminProtoFixEnc(p)] = d;
        files = _adminProtoStrip(fixed);
      } catch(e) { throw new Error('解压失败：' + e.message); }
      setStatus(\`分析文件结构… 发现 \${Object.keys(files).length} 个文件\`, 8);

      const safePaths = _adminProtoFilter(files);
      if (!safePaths.length) throw new Error('ZIP 中未找到有效文件');
      const entryPoint = _adminProtoDetectEntry(safePaths);
      if (!entryPoint) throw new Error('未找到入口文件（start.html 或 index.html）');
      const totalSize = safePaths.reduce((s, p) => s + (files[p]?.byteLength ?? 0), 0);

      setStatus('初始化上传会话…', 12);
      const initRes = await adminFetch('/admin/proto/init', {
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
        setStatus(\`上传第 \${b+1}/\${totalBatches} 批（\${from}–\${to} / \${safePaths.length} 个文件）\`, pct);
        const fd = new FormData();
        fd.append('protoId', protoId);
        batchPaths.forEach(p => { fd.append('paths[]', p); fd.append('files[]', new Blob([files[p]]), p); });
        const bRes = await adminFetch('/admin/proto/files', { method: 'POST', headers: { 'Authorization': 'Bearer ' + adminToken }, body: fd });
        if (!bRes.ok) { const d = await bRes.json().catch(()=>({})); throw new Error(d.error || \`批次 \${b+1} 上传失败\`); }
      }

      setStatus('正在写入元数据…', 93);
      const fRes = await adminFetch('/admin/proto/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
        body: JSON.stringify({ protoId, filePaths: safePaths }),
      });
      const fData = await fRes.json().catch(() => ({}));
      if (!fRes.ok) throw new Error(fData.error || '最终化失败');
      setStatus('上传完成！', 100);

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
  adminProtoDropZone.addEventListener('dragover', e => { e.preventDefault(); adminProtoDropZone.style.borderColor = 'var(--accent)'; adminProtoDropZone.style.color = 'var(--accent)'; });
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
      const res = await adminFetch('/admin/cf-quota', { headers: authH() });
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
      bar.className   = CF_FILL_BASE + (pct >= 90 ? ' alert' : pct >= 70 ? ' warn' : '');
    }
    if (pctEl && pctEl.tagName !== 'SPAN') pctEl.textContent = pct.toFixed(1) + '%';
  }

  async function loadR2Stats() {
    try {
      const res = await adminFetch('/admin/r2-stats', { headers: authH() });
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
      bar.style.background = usedPct >= 90 ? '#ef4444' : usedPct >= 70 ? '#f59e0b' : 'var(--accent)';
      // Donut chart (r=22, circumference ≈ 138.23)
      const circumference = 2 * Math.PI * 22;
      const arc = document.getElementById('r2DonutArc');
      arc.setAttribute('stroke-dashoffset', (circumference * (1 - usedPct / 100)).toFixed(2));
      arc.setAttribute('stroke', usedPct >= 90 ? '#ef4444' : usedPct >= 70 ? '#f59e0b' : 'var(--accent)');
      document.getElementById('r2DonutLabel').textContent = usedPct.toFixed(1) + '%';
    } catch {}
  }

  // ── Member Stats ──────────────────────────────────────────────────────────────
  let memberData = [], memberSortKey = 'total', memberSortAsc = false;

  async function loadMemberStats() {
    document.getElementById('memberTableBody').innerHTML =
      '<tr><td colspan="7" class="text-center text-tx-3 p-8">加载中…</td></tr>';
    const res = await adminFetch('/admin/member-stats', { headers: authH() });
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
        '<tr><td colspan="7" class="text-center text-tx-3 p-8">暂无成员账号</td></tr>';
      return;
    }

    document.getElementById('memberTableBody').innerHTML = sorted.map(u => {
      const p = u.permissions;
      const disabledBadge = u.disabled ? '<span class="inline-flex items-center rounded-xs border border-red-r bg-red-g px-1.5 py-0.5 text-[.68rem] font-semibold text-red mr-[5px]">已禁用</span>' : '';
      const statusDot = u.disabled
        ? '<span class="text-[#ef4444] text-[.75rem]">● 已禁用</span>'
        : '<span class="text-[#22c55e] text-[.75rem]">● 正常</span>';

      // Today quota bar
      const dLim = p ? p.dailyUploadLimit : -1;
      const dPct = dLim > 0 ? Math.min(100, u.uploads.today / dLim * 100) : 0;
      const dClass = dPct >= 100 ? ' full' : dPct >= 80 ? ' warn' : '';
      let todayCell;
      if (dLim === -1) {
        todayCell = '<span class="text-[.82rem]">' + u.uploads.today + ' <span class="text-tx-3">/ ∞</span></span>';
      } else {
        todayCell = '<div class="text-[.82rem]">' + u.uploads.today + ' <span class="text-tx-3">/ ' + dLim + '</span></div>'
          + '<div class="mt-1 h-1 w-[90px] rounded-sm bg-bd"><div class="quota-fill h-1 rounded-sm bg-brand transition-[width] [&.warn]:bg-amber [&.full]:bg-red' + dClass + '" style="width:' + dPct.toFixed(0) + '%"></div></div>';
      }

      // Total quota bar
      const tLim = p ? p.maxTotalUploads : -1;
      const tPct = tLim > 0 ? Math.min(100, u.uploads.total / tLim * 100) : 0;
      const tClass = tPct >= 100 ? ' full' : tPct >= 80 ? ' warn' : '';
      let totalCell;
      if (tLim === -1) {
        totalCell = '<span class="text-[.82rem]">' + u.uploads.total + ' <span class="text-tx-3">/ ∞</span></span>';
      } else {
        totalCell = '<div class="text-[.82rem]">' + u.uploads.total + ' <span class="text-tx-3">/ ' + tLim + '</span></div>'
          + '<div class="mt-1 h-1 w-[90px] rounded-sm bg-bd"><div class="quota-fill h-1 rounded-sm bg-brand transition-[width] [&.warn]:bg-amber [&.full]:bg-red' + tClass + '" style="width:' + tPct.toFixed(0) + '%"></div></div>';
      }

      const permsList = p ? [
        p.canUpload ? '<span class="inline-flex items-center rounded-xs border border-green-r bg-green-g px-1.5 py-0.5 text-[.68rem] font-semibold text-green">上传</span>' : '<span class="inline-flex items-center rounded-xs border border-bd bg-white/[.04] px-1.5 py-0.5 text-[.68rem] font-semibold text-tx-3">禁止上传</span>',
        p.canDelete ? '<span class="inline-flex items-center rounded-xs border border-green-r bg-green-g px-1.5 py-0.5 text-[.68rem] font-semibold text-green">删除</span>' : '',
        p.canEdit   ? '<span class="inline-flex items-center rounded-xs border border-green-r bg-green-g px-1.5 py-0.5 text-[.68rem] font-semibold text-green">编辑</span>' : '',
      ].filter(Boolean).join(' ') : '—';

      return '<tr>'
        + '<td class="font-medium">' + disabledBadge + esc(u.username) + '</td>'
        + '<td>' + statusDot + '</td>'
        + '<td class="min-w-[110px]">' + todayCell + '</td>'
        + '<td class="min-w-[110px]">' + totalCell + '</td>'
        + '<td class="text-center" style="color:' + (u.pages ? 'var(--tx)' : 'var(--tx-3)') + '">' + u.pages + '</td>'
        + '<td>' + permsList + '</td>'
        + '<td class="text-[.79rem] text-tx-2">' + (u.createdAt ? timeAgo(u.createdAt) : '—') + '</td>'
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
  function copyText(text, btn) { navigator.clipboard.writeText(text).then(() => { if(btn){const o=btn.innerHTML;btn.innerHTML='<svg class="inline-block h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,8 6.5,12 13,4"/></svg>';setTimeout(()=>btn.innerHTML=o,1400);} }); }
  function copyProtoAddr(btn) { const url = btn.dataset.url; const pwd = btn.dataset.pwd; copyText(pwd ? '内容：' + url + '\\n密码：' + pwd : url, btn); }
  function toast(msg, type) {
    const t = document.getElementById('toast');
    t.className = TOAST_BASE + ' toast show' + (type ? ' t-' + type : '');
    t.textContent = msg;
    clearTimeout(t._tid);
    t._tid = setTimeout(() => t.classList.remove('show'), 2800);
  }
  function timeAgo(ts) { const d=Date.now()-ts; if(d<60000) return '刚刚'; if(d<3600000) return Math.floor(d/60000)+' 分钟前'; if(d<86400000) return Math.floor(d/3600000)+' 小时前'; return Math.floor(d/86400000)+' 天前'; }
  function fmtDate(ms) { if(!ms) return '—'; return new Date(ms).toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit',year:'2-digit'}); }
  function formatExpiry(ts) { if(!ts) return '永久'; return new Date(ts).toLocaleDateString('zh-CN') + ' 到期'; }
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
<script type="text/plain" id="fflateSrc">${FFLATE_UMD}</script>
</body>
</html>`;
}
