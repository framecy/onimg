// 双重上下文转义（HTML 属性 + JS 字符串字面量）的测试。
//
// onclick="fn('${x}')" 有两层解析：HTML 先解析属性值，再把内容当 JS 执行。
// 单用 esc()（只转 &<>）会让含引号的值突破属性；单用 escAttr()（转成 &quot;）
// 又会让 JS 收到的不是引号 —— 两层都要处理。
//
// 这里的测试不只看「输出长什么样」，而是**把输出真的解析回来**，
// 断言「HTML 属性解析 → JS 求值」之后拿到的值与输入完全一致。
// 这是唯一能证明转义正确的方式：转义错了，往返就不等。
import { describe, test, expect } from 'vitest';

// 与 page.js / admin-page.js 中保持一致的实现（同源复制，避免依赖渲染产物）
function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function jsStr(v) {
  const s = String(v == null ? '' : v)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  return escAttr("'" + s + "'");
}

/** 把 HTML 属性值解码回原始文本（模拟浏览器解析属性） */
function decodeAttr(v) {
  return String(v)
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

/** 完整往返：拼进 onclick → 解析属性 → 求值 JS 字符串字面量 */
function roundTrip(value) {
  const attr = `fn(${jsStr(value)})`;          // 生成 onclick 的内容
  const js = decodeAttr(attr);                  // 浏览器解析属性后交给 JS 的文本
  // eslint-disable-next-line no-new-func
  return new Function('fn', `return ${js.slice(3, -1)};`)(undefined);
}

describe('jsStr：HTML 属性 + JS 字符串双重上下文', () => {
  test('往返后与原值完全一致（普通值）', () => {
    for (const v of ['abc', 'a-b_c', '12345', '中文标签', 'file.jpg', 'pr_1a2b3c4d']) {
      expect(roundTrip(v)).toBe(v);
    }
  });

  test('往返后与原值一致（含引号 —— 攻击载荷）', () => {
    const payloads = [
      `a" onload="alert(1)`,
      `a' onclick='alert(1)`,
      `x" onmouseover="alert(1)" y="`,
      `'); alert(1); //`,
      `\`); alert(1); //`,
      `"</option><script>alert(1)</script>`,
      `a\\b`,
      `line1\nline2`,
      `tab\there`,
    ];
    for (const p of payloads) {
      expect(roundTrip(p)).toBe(p);
    }
  });

  test('属性值里不含裸引号（否则会突破属性边界）', () => {
    const out = jsStr(`a" onload="alert(1)`);
    expect(out).not.toMatch(/(?<!\\)"/);      // 没有未转义的双引号
    expect(out.startsWith("'")).toBe(true);   // 外层是单引号字面量
    expect(out.endsWith("'")).toBe(true);
  });

  test('双引号被转成 &quot;，不会出现在属性文本里', () => {
    expect(jsStr('a"b')).toContain('&quot;');
    expect(jsStr('a"b')).not.toContain('"a"');
  });

  test('单引号与反斜杠被 JS 层转义', () => {
    expect(jsStr("a'b")).toContain("\\'");
    expect(jsStr('a\\b')).toContain('\\\\');
  });

  test('尖括号与 & 被转义（HTML 层）', () => {
    expect(jsStr('a<b>c')).toContain('&lt;');
    expect(jsStr('a<b>c')).toContain('&gt;');
    expect(jsStr('a&b')).toContain('&amp;');
  });

  test('U+2028 / U+2029 被转义（JS 行分隔符会截断字符串字面量）', () => {
    expect(jsStr('a\u2028b')).toContain('\\u2028');
    expect(jsStr('a\u2029b')).toContain('\\u2029');
    expect(roundTrip('a\u2028b')).toBe('a\u2028b');
  });

  test('null / undefined 变成空字符串而不是 "null"', () => {
    expect(jsStr(null)).toBe("''");
    expect(jsStr(undefined)).toBe("''");
  });

  test('与只用 esc() 的旧写法对比：旧写法会被突破', () => {
    const evil = `x'); alert(1); //`;
    // 旧写法：esc 不转义单引号 → JS 里字符串提前闭合
    const oldAttr = `fn('${evil.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}')`;
    // eslint-disable-next-line no-new-func
    const oldJs = decodeAttr(oldAttr);
    expect(() => new Function(`return ${oldJs.slice(3, -1)};`)()).toThrow();  // 语法被破坏
    // 新写法：往返正确
    expect(roundTrip(evil)).toBe(evil);
  });
});

describe('escAttr：纯属性上下文', () => {
  test('引号被转义，属性不被突破', () => {
    expect(escAttr('a" onload="alert(1)')).toBe('a&quot; onload=&quot;alert(1)');
  });

  test('往返后与原值一致', () => {
    for (const v of ['a"b', `x' y`, 'a<b>&c', '中文']) {
      expect(decodeAttr(escAttr(v))).toBe(v);
    }
  });
});
