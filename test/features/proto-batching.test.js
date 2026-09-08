import { describe, test, expect } from 'vitest';

// 从 src/page.js 提取的批次规划纯逻辑（与实现保持同参数、同语义）。
// 用途：在 Node 环境验证双约束切批的关键性质。

const PROTO_BATCH_MAX_FILES = 45;
const PROTO_BATCH_MAX_BYTES = 24 * 1024 * 1024;

function planBatches(paths, files) {
  const batches = [];
  let cur = [], curBytes = 0;
  for (const p of paths) {
    const size = files[p]?.byteLength ?? 0;
    if (cur.length && (cur.length >= PROTO_BATCH_MAX_FILES || curBytes + size > PROTO_BATCH_MAX_BYTES)) {
      batches.push(cur); cur = []; curBytes = 0;
    }
    cur.push(p); curBytes += size;
  }
  if (cur.length) batches.push(cur);
  return batches;
}

const MB = 1024 * 1024;
const u8 = n => ({ byteLength: n }); // 测试替身，只用到 byteLength

describe('Prototype batch planning (dual-constraint)', () => {
  test('respects max 45 files per batch', () => {
    const paths = Array.from({ length: 100 }, (_, i) => 'f' + i + '.css');
    const files = Object.fromEntries(paths.map(p => [p, u8(1024)]));
    const batches = planBatches(paths, files);
    expect(batches.length).toBe(3); // 45 + 45 + 10
    expect(batches[0].length).toBe(45);
    expect(batches[1].length).toBe(45);
    expect(batches[2].length).toBe(10);
  });

  test('respects 24 MB byte cap per batch', () => {
    // 20 张 3 MB 的图：按个数只有一批，按字节必须拆
    const paths = Array.from({ length: 20 }, (_, i) => 'img' + i + '.png');
    const files = Object.fromEntries(paths.map(p => [p, u8(3 * MB)]));
    const batches = planBatches(paths, files);
    expect(batches.length).toBe(3); // 8 + 8 + 4（24MB 边界）
    for (const b of batches) {
      const bytes = b.reduce((s, p) => s + files[p].byteLength, 0);
      expect(bytes).toBeLessThanOrEqual(PROTO_BATCH_MAX_BYTES);
    }
  });

  test('a single file larger than the byte cap gets its own batch', () => {
    const paths = ['huge.mp4', 'a.js', 'b.js'];
    const files = { 'huge.mp4': u8(40 * MB), 'a.js': u8(1024), 'b.js': u8(1024) };
    const batches = planBatches(paths, files);
    expect(batches.length).toBe(2);
    expect(batches[0]).toEqual(['huge.mp4']);
    expect(batches[1]).toEqual(['a.js', 'b.js']);
  });

  test('never drops or duplicates a path', () => {
    const paths = Array.from({ length: 137 }, (_, i) => 'p' + i);
    const files = Object.fromEntries(paths.map(p => [p, u8(Math.floor(Math.random() * 5 * MB))]));
    const batches = planBatches(paths, files);
    const flat = batches.flat();
    expect(flat).toEqual(paths); // 顺序保持、无重复、无丢失
  });

  test('empty input yields no batches', () => {
    expect(planBatches([], {})).toEqual([]);
  });

  test('mixed sizes keep every batch within both constraints', () => {
    const paths = [];
    for (let i = 0; i < 60; i++) paths.push('css' + i + '.css');   // 小文件
    for (let i = 0; i < 30; i++) paths.push('png' + i + '.png');   // 2 MB 图
    paths.push('video.mp4');                                        // 30 MB 大文件
    const files = {
      ...Object.fromEntries(paths.filter(p => p.endsWith('.css')).map(p => [p, u8(50 * 1024)])),
      ...Object.fromEntries(paths.filter(p => p.endsWith('.png')).map(p => [p, u8(2 * MB)])),
      'video.mp4': u8(30 * MB),
    };
    const batches = planBatches(paths, files);
    for (const b of batches) {
      expect(b.length).toBeLessThanOrEqual(PROTO_BATCH_MAX_FILES);
      const bytes = b.reduce((s, p) => s + files[p].byteLength, 0);
      expect(bytes).toBeLessThanOrEqual(Math.max(PROTO_BATCH_MAX_BYTES, 30 * MB)); // 大文件独立成批例外
      if (b.length > 1) expect(bytes).toBeLessThanOrEqual(PROTO_BATCH_MAX_BYTES);
    }
  });
});
