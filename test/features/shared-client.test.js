// 共享客户端工具层（src/ui/client/shared.js）的回归测试。
//
// 为什么需要它：这一层的代码是**字符串**，注入到前后台两个页面的 <script> 里
// 交给浏览器执行 —— Node 端既不会 import 它，语法检查也覆盖不到。历史上同类的
// 坑是「模板字符串把反斜杠吃掉」，测试全绿但浏览器端整段脚本失效。
//
// 覆盖三件事：
//   1. 注入的源码能在真实 V8 里执行（含 jsStr 这种码点构造的转义实现）
//   2. 语义是两边期望的超集（fmtSize 到 GB、timeAgo 处理空值与 30 天以上）
//   3. 两个页面都只保留这一份，没有各自偷偷重新定义（漂移的复发入口）
import { describe, test, expect } from 'vitest';
import vm from 'node:vm';
import { CLIENT_SHARED_JS } from '../../src/ui/client/shared.js';
import { renderPage } from '../../src/page.js';
import { renderAdminPage } from '../../src/admin-page.js';

/** 在干净的上下文里执行一次共享层，拿到它定义的函数 */
function loadShared() {
  const toastEl = {
    className: '', textContent: '',
    classList: { remove() {}, add() {} },
  };
  const ctx = {
    document: { getElementById: (id) => (id === 'toast' ? toastEl : null) },
    navigator: { clipboard: { writeText: async () => {} } },
    setTimeout: () => 0,
    clearTimeout: () => {},
    console,
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(CLIENT_SHARED_JS, ctx);
  return { ctx, toastEl };
}

describe('共享客户端工具层：脚本可执行', () => {
  test('注入的源码在 V8 里无误执行，且导出预期函数', () => {
    const { ctx } = loadShared();
    for (const fn of ['esc', 'escAttr', 'jsStr', 'fmtSize', 'fmtNum', 'fmtDate', 'timeAgo', 'copyText', 'toast']) {
      expect(typeof ctx[fn]).toBe('function');
    }
    // 前台的 cp / 后台的 copyText 是同一个实现
    expect(ctx.cp).toBe(ctx.copyText);
  });

  test('toast 会写文案并加 show 类', () => {
    const { ctx, toastEl } = loadShared();
    ctx.toast('已保存', 'success');
    expect(toastEl.textContent).toBe('已保存');
    expect(toastEl.className).toContain('t-success');
    expect(toastEl.className).toContain('show');
  });
});

describe('共享客户端工具层：转义语义', () => {
  test('esc 只转 & < >（不碰引号，文本节点上下文）', () => {
    const { ctx } = loadShared();
    expect(ctx.esc('a<b>&c')).toBe('a&lt;b&gt;&amp;c');
    expect(ctx.esc('say "hi"')).toBe('say "hi"');
  });

  test('escAttr 额外转双引号（属性上下文）', () => {
    const { ctx } = loadShared();
    expect(ctx.escAttr('a"b<c')).toBe('a&quot;b&lt;c');
  });

  test('jsStr 产出属性+JS 双重上下文的单引号字面量', () => {
    const { ctx } = loadShared();
    expect(ctx.jsStr('x')).toBe("'x'");
    // 单引号要转义成 \'，否则字面量被截断
    expect(ctx.jsStr("a'b")).toBe(String.raw`'a\'b'`);
    // HTML 特殊字符由 escAttr 兜住
    expect(ctx.jsStr('a<b')).toBe("'a&lt;b'");
    expect(ctx.jsStr('a"b')).toBe("'a&quot;b'");
    expect(ctx.jsStr(null)).toBe("''");
  });
});

describe('共享客户端工具层：格式化语义（前后台统一后的口径）', () => {
  test('fmtSize 到 GB —— 前台此前只到 MB，1.2GB 会显示成 1228.8 MB', () => {
    const { ctx } = loadShared();
    expect(ctx.fmtSize(0)).toBe('0 B');
    expect(ctx.fmtSize(1024)).toBe('1.0 KB');
    expect(ctx.fmtSize(1536)).toBe('1.5 KB');
    expect(ctx.fmtSize(1048576)).toBe('1.0 MB');
    expect(ctx.fmtSize(1073741824)).toBe('1.00 GB');
    expect(ctx.fmtSize(1288490188.8)).toBe('1.20 GB');
  });

  test('fmtNum：千分位与 K/M 缩写', () => {
    const { ctx } = loadShared();
    expect(ctx.fmtNum(999)).toBe('999');
    expect(ctx.fmtNum(1500)).toBe('1.5K');
    expect(ctx.fmtNum(2_400_000)).toBe('2.40M');
    expect(ctx.fmtNum(null)).toBe('—');
  });

  test('timeAgo 处理空值与 30 天以上（后台此前会把 0 显示成「刚刚」）', () => {
    const { ctx } = loadShared();
    expect(ctx.timeAgo(0)).toBe('—');
    expect(ctx.timeAgo(undefined)).toBe('—');
    expect(ctx.timeAgo(Date.now() - 5_000)).toBe('刚刚');
    expect(ctx.timeAgo(Date.now() - 90_000)).toBe('1 分钟前');
    expect(ctx.timeAgo(Date.now() - 40 * 86400_000)).not.toContain('天前');
  });

  test('fmtDate 空值回落为短横线', () => {
    const { ctx } = loadShared();
    expect(ctx.fmtDate(0)).toBe('—');
    expect(ctx.fmtDate(Date.now())).toMatch(/\d{2}\/\d{2}\/\d{2}/);
  });
});

describe('两个页面只保留一份实现（防止漂移复发）', () => {
  const cases = [
    ['前台 page.js', renderPage({})],
    ['后台 admin-page.js', renderAdminPage({})],
  ];

  for (const [name, html] of cases) {
    test(`${name}：工具函数各只有一处定义`, () => {
      for (const fn of ['esc', 'escAttr', 'jsStr', 'fmtSize', 'fmtNum', 'fmtDate', 'timeAgo', 'toast', 'copyText']) {
        const n = (html.match(new RegExp(`function ${fn}\\(`, 'g')) || []).length;
        expect(n, `${name} 里 function ${fn} 出现 ${n} 次`).toBe(1);
      }
    });

    test(`${name}：TOAST_BASE 由共享层提供，页面不再自建`, () => {
      expect((html.match(/var TOAST_BASE/g) || []).length).toBe(1);
      expect((html.match(/const TOAST_BASE/g) || []).length).toBe(0);
    });
  }
});
