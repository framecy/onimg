// /list 分页回归测试（2026-11-04：图库变大后一次性返回全量太重）
//
// 要点：
//   1. 传 limit/offset 时只对**当前页**做展开，返回 total / nextOffset
//   2. 不传 limit 时行为与旧版完全一致（全量，CLI / Agent 依赖这一点）
//   3. 页与页之间不重不漏；末页 nextOffset 为 null
import { describe, test, expect } from 'vitest';
import { createEnv, createTestUser } from '../helpers/mock-env.js';
import { handleList } from '../../src/list.js';
import { createToken } from '../../src/admin/auth.js';
import { userImgRecordKey, minimalEntry } from '../../src/imglist.js';

const SECRET = 'test-secret-at-least-32-bytes!!';

/** 建一个用户 + N 张图（清单里放最小种子，逼 list 走单图记录补全） */
async function seed(n) {
  const env = createEnv();
  const password = 'pw';
  await createTestUser(env, 'alice', password, { canUpload: true });
  const token = await createToken({ type: 'user', username: 'alice' }, 3600_000, SECRET);

  const manifest = [];
  for (let i = 0; i < n; i++) {
    const key = `img${String(i).padStart(3, '0')}.png`;
    const rec = { key, size: 100 + i, uploadedAt: 1000 + i, name: `图${i}`, basename: key, isPublic: i % 2 === 0 };
    await env.STATS.put(userImgRecordKey('alice', key), JSON.stringify(rec));
    manifest.push(minimalEntry(rec));
  }
  await env.STATS.put('userimgs:alice', JSON.stringify(manifest));
  return { env, token };
}


describe('/list 分页', () => {
  test('不传 limit 时返回全量（与旧版行为一致）', async () => {
    const { env, token } = await seed(25);
    const res = await handleList(
      new Request('http://x/list', { headers: { Authorization: 'Bearer ' + token } }), env);
    const data = await res.json();
    expect(data.items).toHaveLength(25);
    expect(data.total).toBe(25);
  });

  test('传 limit 时只返回当前页，并给 total / nextOffset', async () => {
    const { env, token } = await seed(25);
    const res = await handleList(
      new Request('http://x/list?limit=10', { headers: { Authorization: 'Bearer ' + token } }), env);
    const data = await res.json();
    expect(data.items).toHaveLength(10);
    expect(data.total).toBe(25);
    expect(data.limit).toBe(10);
    expect(data.nextOffset).toBe(10);
  });

  test('逐页翻完不重不漏，末页 nextOffset 为 null', async () => {
    const { env, token } = await seed(25);
    const seen = [];
    let offset = 0;
    for (let guard = 0; guard < 10; guard++) {
      const res = await handleList(
        new Request(`http://x/list?limit=10&offset=${offset}`, {
          headers: { Authorization: 'Bearer ' + token },
        }), env);
      const data = await res.json();
      seen.push(...data.items.map(i => i.key));
      offset = data.nextOffset;
      if (offset == null) break;
    }
    expect(seen).toHaveLength(25);
    expect(new Set(seen).size).toBe(25);          // 不重
    expect(seen).toEqual([...seen].sort());        // 顺序稳定（清单按上传时间倒序后切页）
  });

  test('limit 超过上限被钳到 500，非法值兜底 200', async () => {
    const { env, token } = await seed(3);
    const big = await (await handleList(
      new Request('http://x/list?limit=99999', { headers: { Authorization: 'Bearer ' + token } }), env)).json();
    expect(big.limit).toBe(500);

    const bad = await (await handleList(
      new Request('http://x/list?limit=abc', { headers: { Authorization: 'Bearer ' + token } }), env)).json();
    expect(bad.limit).toBe(200);
  });

  test('offset 超出范围返回空页而不是报错', async () => {
    const { env, token } = await seed(5);
    const res = await handleList(
      new Request('http://x/list?limit=10&offset=100', { headers: { Authorization: 'Bearer ' + token } }), env);
    const data = await res.json();
    expect(data.items).toEqual([]);
    expect(data.total).toBe(5);
    expect(data.nextOffset).toBe(null);
  });

  test('分页显著缩小响应体积（浏览器只拿一页）', async () => {
    const { env, token } = await seed(120);

    const full = await (await handleList(
      new Request('http://x/list', { headers: { Authorization: 'Bearer ' + token } }), env)).json();
    const page = await (await handleList(
      new Request('http://x/list?limit=20', { headers: { Authorization: 'Bearer ' + token } }), env)).json();

    expect(page.items).toHaveLength(20);
    expect(full.items).toHaveLength(120);
    // 单页 JSON 体积远小于全量（这才是分页要解决的问题：传输 + 渲染压力）
    expect(JSON.stringify(page).length * 3).toBeLessThan(JSON.stringify(full).length);
  });

  test('explain：展开必须在过滤之前（deletedAt 只存在单图记录里）', async () => {
    // 清单是最小种子，没有 deletedAt；只有展开后才知道哪张在回收站。
    // 如果先过滤再展开，回收站里的图会被当成正常图返回 —— 这里钉死顺序。
    const { env, token } = await seed(3);
    await env.STATS.put(userImgRecordKey('alice', 'img001.png'), JSON.stringify({
      key: 'img001.png', size: 101, uploadedAt: 1001, deletedAt: 5000,
    }));
    const data = await (await handleList(
      new Request('http://x/list?limit=10', { headers: { Authorization: 'Bearer ' + token } }), env)).json();
    expect(data.items.map(i => i.key)).not.toContain('img001.png');
    expect(data.total).toBe(2);
  });
});
