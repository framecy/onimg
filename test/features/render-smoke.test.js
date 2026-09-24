// 页面渲染的烟雾测试 —— 守住「模板字符串插值在 Node 端被求值」这类错误。
//
// 为什么需要它：page.js / admin-page.js 的整体 HTML 是**在 Node 端拼出来的模板字符串**，
// 里面嵌着要交给浏览器的 JS。浏览器端的辅助函数（esc / escAttr / jsStr …）在 Node 端
// 并不存在，所以引用它们时必须写成 `\${fn(x)}`（转义），否则会在 Node 端立即求值并
// 抛 ReferenceError。
//
// 这个错误单元测试抓不到 —— 绝大多数测试直接调 handler，不走 renderPage。
// 实际发生过一次：把 `\${esc(x)}` 改成 `${jsStr(x)}` 时漏了转义反斜杠，
// 测试 243 项全绿，但线上页面直接 500（"jsStr is not defined"）。
// 所以必须有这个直接调用 renderPage / renderAdminPage 的测试。
import { describe, test, expect } from 'vitest';
import { renderPage } from '../../src/page.js';
import { renderAdminPage } from '../../src/admin-page.js';

describe('renderPage 能成功渲染（不抛异常）', () => {
  test('无参数调用不抛异常', () => {
    expect(() => renderPage({})).not.toThrow();
  });

  test('默认参数调用不抛异常', () => {
    expect(() => renderPage()).not.toThrow();
  });

  test('带 env 调用不抛异常', () => {
    expect(() => renderPage({
      SITE_NOTES: '测试存储|说明二|说明三',
      ADMIN_USERNAME: 'admin',
    })).not.toThrow();
  });

  test('产物是一段完整 HTML', () => {
    const html = renderPage({});
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
    expect(html.length).toBeGreaterThan(10000);
  });

  test('浏览器端辅助函数以「定义」形式出现在产物里', () => {
    const html = renderPage({});
    // 这些函数要在浏览器里执行，产物中应有定义
    for (const fn of ['function esc(', 'function escAttr(', 'function jsStr(']) {
      expect(html).toContain(fn);
    }
  });

  test('onclick 里的辅助函数调用保留为「未求值」的文本（交给浏览器）', () => {
    const html = renderPage({});
    // 源码里写的是 \${jsStr(...)}（转义），Node 端求值模板字符串后
    // 产物里留下的是不带反斜杠的 ${jsStr(...)} —— 这正是要交给浏览器的形态。
    // 若源码漏了转义，Node 端会直接抛 ReferenceError（renderPage 就挂了），
    // 所以这里只要产物里存在该文本，就说明求值发生在浏览器侧。
    const calls = html.match(/\$\{jsStr\(/g) || [];
    expect(calls.length).toBeGreaterThan(0);
    // 且产物里不应出现「已求值成字面量」的痕迹：jsStr 是浏览器函数，
    // Node 端求值必然报错，能渲染出来就说明没被求值
    expect(html).toContain('onclick=');
  });
});

describe('renderAdminPage 能成功渲染（不抛异常）', () => {
  test('无参数调用不抛异常', () => {
    expect(() => renderAdminPage()).not.toThrow();
  });

  test('产物是一段完整 HTML', () => {
    const html = renderAdminPage();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
    expect(html.length).toBeGreaterThan(10000);
  });

  test('审计日志与趋势相关元素存在', () => {
    const html = renderAdminPage();
    for (const id of ['section-audit', 'auditBody', 'auditDays', 'auditAction', 'auditActor']) {
      expect(html).toContain(id);
    }
  });

  test('浏览器端辅助函数已定义', () => {
    const html = renderAdminPage();
    for (const fn of ['function esc(', 'function escAttr(', 'function jsStr(']) {
      expect(html).toContain(fn);
    }
  });
});
