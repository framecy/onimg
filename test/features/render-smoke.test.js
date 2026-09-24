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

// ─────────────────────────────────────────────────────────────────────────────
// 内联 <script> 的浏览器端语法校验
//
// 为什么需要：上面的测试只保证「渲染不抛异常」，但那只覆盖 Node 端。产物里的
// 内联脚本是交给浏览器执行的，Node 端语法检查不到。一旦某个页面脚本块有语法
// 错误（例如大括号多写一个），浏览器会**静默丢弃整段脚本**——页面还能正常打开、
// renderPage 也返回 200，但所有 onclick / addEventListener 都不会注册，
// 用户表现为「点了没反应」。
//
// 真实发生过：jsStr() 结尾多写一个 `}`，253 项测试全绿，线上前后台全部点不动。
// 这里直接把产物里每个脚本块交给 V8 真实解析，就能在提交前抓住这类错误。
//
// 注意：内联脚本在浏览器里是「裸脚本」（没有模块包装）。node --check 会给文件
// 套一层 CJS wrapper，会改变花括号配对的语境。所以先包一层 `{ ... }`，
// 脚本内部若花括号不平衡，外层就会报「Unexpected token '}'」。
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from 'node:child_process';
import { writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const tmp = mkdtempSync(join(tmpdir(), 'onimg-script-check-'));
let seq = 0;

function checkInlineScripts(label, html) {
  const blocks = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)];
  expect(blocks.length, `${label}: 应至少有一个 script 块`).toBeGreaterThan(0);

  const failures = [];
  for (let i = 0; i < blocks.length; i++) {
    const body = blocks[i][1];
    if (!body.trim()) continue;
    const file = join(tmp, `blk-${seq++}.js`);
    try {
      writeFileSync(file, `{
${body}
}`);
      execFileSync('node', ['--check', file], { stdio: 'pipe' });
    } catch (e) {
      const msg = String(e.stderr || e.message).split('\n').slice(0, 6).join('\n');
      failures.push(`[${i}] ${msg}`);
    } finally {
      rmSync(file, { force: true });
    }
  }

  expect(failures, `${label}: 内联脚本存在浏览器端语法错误\n${failures.join('\n---\n')}`).toEqual([]);
}

describe('内联脚本的浏览器端语法（真实交给 V8 解析）', () => {
  test('首页 /  的所有内联脚本块都能解析', () => {
    checkInlineScripts('首页 /', renderPage({}));
  });

  test('管理端 /admin  的所有内联脚本块都能解析', () => {
    checkInlineScripts('管理端 /admin', renderAdminPage({}));
  });

  test('大括号配对正确（模拟浏览器裸脚本语境，抓「多写一个 }」）', () => {
    // 直接验证上面包裹手法的敏感性：多写一个 `}` 时必须报错。
    const file = join(tmp, `sensitivity-${seq++}.js`);
    try {
      writeFileSync(file, '{\nfunction f() { return 1; }\n}\n}');
      expect(() => execFileSync('node', ['--check', file], { stdio: 'pipe' }))
        .toThrow();
    } finally {
      rmSync(file, { force: true });
    }
  });
});

