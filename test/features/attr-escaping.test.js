// 属性上下文转义与文件名净化的回归测试。
//
// 背景：原文件名只去控制符，引号、尖括号、& 全部原样保留。而原名会被渲染进
// title="" / data-*="" 这类属性，前端 esc() 只转义 &<>、不含引号 ——
// 一个名为 `a" onload="alert(1).jpg` 的文件就能突破属性边界。
//
// 三层防御：
//   1. 源头：sanitizeOriginalName 剔除危险字符
//   2. 属性上下文：escAttr() 额外转义引号
//   3. 测试守住这两点，防止以后被「优化」回去
import { describe, test, expect } from 'vitest';
import { sanitizeOriginalName, baseName, MAX_NAME_LEN } from '../../src/upload.js';

describe('sanitizeOriginalName：剔除 HTML/属性危险字符', () => {
  test('双引号被剔除（属性突破的主要载体）', () => {
    expect(sanitizeOriginalName('a" onload="alert(1).jpg')).toBe('a onload=alert(1).jpg');
    expect(sanitizeOriginalName('e"quote.jpg')).toBe('equote.jpg');
  });

  test('单引号与反引号被剔除（JS 字符串上下文）', () => {
    expect(sanitizeOriginalName("b' onclick='x.jpg")).toBe('b onclick=x.jpg');
    expect(sanitizeOriginalName('c`tick`.jpg')).toBe('ctick.jpg');
  });

  test('尖括号与 & 被剔除（标签注入与实体混淆）', () => {
    expect(sanitizeOriginalName('c<script>.jpg')).toBe('cscript.jpg');
    expect(sanitizeOriginalName('d&amp;.jpg')).toBe('damp;.jpg');
  });

  test('反斜杠保留（它是路径分隔符，baseName 依赖它取末段）', () => {
    expect(sanitizeOriginalName('a\\b.jpg')).toBe('a\\b.jpg');
    // 引号被删、反斜杠保留，末段仍可正确取出
    expect(baseName(sanitizeOriginalName('a"b\\c.png'))).toBe('c.png');
  });

  test('正常文件名不受影响', () => {
    expect(sanitizeOriginalName('normal.jpg')).toBe('normal.jpg');
    expect(sanitizeOriginalName('我的照片 2024.png')).toBe('我的照片 2024.png');
    expect(sanitizeOriginalName('report-v1.2_final.PDF')).toBe('report-v1.2_final.PDF');
    expect(sanitizeOriginalName('dir/sub/file.jpg')).toBe('dir/sub/file.jpg');
  });

  test('清理后仍保留控制符过滤与空白折叠', () => {
    // 制表符属控制符，先被第一条规则删除（不是折成空格）—— 这是既有行为
    expect(sanitizeOriginalName('a\t\tb.jpg')).toBe('ab.jpg');
    expect(sanitizeOriginalName('a\u0000b.jpg')).toBe('ab.jpg');
    // 普通空格仍按「连续空白折成一个」处理
    expect(sanitizeOriginalName('a    b.jpg')).toBe('a b.jpg');
    expect(sanitizeOriginalName('a \n b.jpg')).toBe('a b.jpg');
  });

  test('清理后仍保留首尾点/空白规则', () => {
    expect(sanitizeOriginalName('.hidden.jpg')).toBe('hidden.jpg');
    expect(sanitizeOriginalName('trail .jpg')).toBe('trail .jpg');
  });

  test('超长名按 UTF-8 字节截断且不产生半个字符', () => {
    const long = '中'.repeat(200) + '.jpg';
    const out = sanitizeOriginalName(long);
    expect(new TextEncoder().encode(out).byteLength).toBeLessThanOrEqual(MAX_NAME_LEN);
    expect(out).not.toContain('\uFFFD');
  });

  test('清理引号后不影响 baseName 取末段', () => {
    expect(baseName(sanitizeOriginalName('dir/a"b.jpg'))).toBe('ab.jpg');
  });

  test('空输入返回空串', () => {
    expect(sanitizeOriginalName('')).toBe('');
    expect(sanitizeOriginalName(null)).toBe('');
    expect(sanitizeOriginalName(undefined)).toBe('');
  });

  test('只有危险字符时，危险字符被清空（反斜杠按路径分隔符保留）', () => {
    expect(sanitizeOriginalName('"\'`<>&')).toBe('');
    expect(sanitizeOriginalName('"\'`<>&\\')).toBe('\\');
  });
});
