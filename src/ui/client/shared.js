// 共享浏览器端工具层 —— page.js（前台）与 admin-page.js（后台）共用。
//
// 导出源码字符串，两个页面以 <script>${CLIENT_SHARED_JS}</script> 注入
// （与 fflate-inline.js 的 FFLATE_UMD、proto-upload-engine.js 的 PROTO_ENGINE_JS
// 同一模式）。注入后页面脚本作用域内可直接调用 esc / fmtSize / toast 等。
//
// ── 为什么需要这一层 ────────────────────────────────────────────────────────
// 两个页面是两次独立开发出来的（各约 3.9k 行），同样的工具函数各写了一份，
// 语义已经漂移，而且没人发现：
//   · fmtSize —— 前台只到 MB，1.2 GB 的图会显示成 1228.8 MB；后台到 GB
//   · timeAgo —— 前台处理空值与 30 天以上（回落成日期），后台一律"N 天前"，
//                传 0/undefined 会显示"刚刚"
//   · toast   —— 停留时间 2600ms / 2800ms 不一致
//   · 复制反馈 —— 前台是 .copy-btn 的 CSS 动画，后台是换勾号图标，两份实现
// 现在只保留这一份，语义取两边的超集（所有既有调用点都接受的结果）。
//
// ── 维护约定 ────────────────────────────────────────────────────────────────
// 1. 字符串内**不使用反引号和 ${**，避免与页面外层模板字面量冲突。
// 2. 这里的代码是给浏览器执行的，Node 端无法直接引用；改完务必跑
//    test/features/shared-client.test.js（真实执行 + 检查两端没有重新定义副本）。
// 3. 只放与 DOM 结构无关的工具。登录态失效这类要动具体弹窗的逻辑留在各页面。

export const CLIENT_SHARED_JS = `
  // ── shared/client ── 由 src/ui/client/shared.js 注入，前后台共用，改这里两边一起变
  var TOAST_BASE = 'fixed bottom-6 left-1/2 z-[300] -translate-x-1/2 translate-y-20 whitespace-nowrap rounded-md border border-bd-2 bg-bg-3 px-[18px] py-[9px] font-sans text-sm font-medium text-tx shadow-sm transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] [&.show]:translate-y-0 [&.t-success]:border-green-r [&.t-success]:bg-green-g [&.t-success]:text-green [&.t-warn]:border-amber-r [&.t-warn]:bg-amber-g [&.t-warn]:text-amber [&.t-error]:border-red-r [&.t-error]:bg-red-g [&.t-error]:text-red';
  var COPY_MARK = '<svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,8 6.5,12 13,4"/></svg>';

  // ── 转义三件套 ────────────────────────────────────────────────────────────
  // 文本节点：只转 & < >
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  // 属性值：额外转 " 防止突破属性边界。不要拿它替换 onclick 里的 esc()。
  function escAttr(s) {
    return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;')
      .replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  // 属性 + JS 字符串双重上下文：返回自带引号的 JS 单引号字面量。
  // ⚠ 实现刻意不使用反斜杠字面量（历史上被外层模板字符串吃掉过三次），
  // 用 String.fromCharCode(92) 与码点判断代替。
  function jsStr(v) {
    var BS = String.fromCharCode(92);
    var SQ = String.fromCharCode(39);
    var s = String(v == null ? '' : v);
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var c = s[i], code = s.charCodeAt(i);
      if (c === BS) out += BS + BS;
      else if (c === SQ) out += BS + SQ;
      else if (code === 13) out += BS + 'r';
      else if (code === 10) out += BS + 'n';
      else if (code === 0x2028) out += BS + 'u2028';
      else if (code === 0x2029) out += BS + 'u2029';
      else out += c;
    }
    return escAttr(SQ + out + SQ);
  }

  // ── 格式化 ────────────────────────────────────────────────────────────────
  function fmtSize(b) {
    if (!b) return '0 B';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b/1024).toFixed(1) + ' KB';
    if (b < 1073741824) return (b/1048576).toFixed(1) + ' MB';
    return (b/1073741824).toFixed(2) + ' GB';
  }
  function fmtNum(n) {
    if (n === null || n === undefined) return '—';
    if (n >= 1e6) return (n/1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
    return n.toLocaleString();
  }
  function fmtDate(ms) {
    if (!ms) return '—';
    return new Date(ms).toLocaleDateString('zh-CN', { month:'2-digit', day:'2-digit', year:'2-digit' });
  }
  function timeAgo(ts) {
    if (!ts) return '—';
    var s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return '刚刚';
    if (s < 3600) return Math.floor(s/60) + ' 分钟前';
    if (s < 86400) return Math.floor(s/3600) + ' 小时前';
    if (s < 2592000) return Math.floor(s/86400) + ' 天前';
    return new Date(ts).toLocaleDateString('zh-CN');
  }

  // ── 复制 ──────────────────────────────────────────────────────────────────
  // 前台按钮（.copy-btn）走 CSS 动画：把原内容包进 .cp-label，再插入 .cp-mark；
  // 其余按钮没有这套样式，直接把内容换成勾号图标，1.4s 后还原。
  function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(function () {
      if (!btn) return;
      if (btn.classList.contains('copy-btn')) {
        if (!btn.dataset.cpReady) {
          var label = btn.innerHTML;
          btn.innerHTML = '<span class="cp-label">' + label + '</span><span class="cp-mark">' + COPY_MARK + '</span>';
          btn.dataset.cpReady = '1';
        }
        btn.classList.add('copied');
        clearTimeout(btn._copyTid);
        btn._copyTid = setTimeout(function () { btn.classList.remove('copied'); }, 1400);
        return;
      }
      var old = btn.innerHTML;
      btn.innerHTML = COPY_MARK;
      setTimeout(function () { btn.innerHTML = old; }, 1400);
    });
  }
  var cp = copyText;

  // ── Toast ─────────────────────────────────────────────────────────────────
  function toast(msg, type) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.className = TOAST_BASE + ' toast show' + (type ? ' t-' + type : '');
    t.textContent = msg;
    clearTimeout(t._tid);
    t._tid = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }
`;
