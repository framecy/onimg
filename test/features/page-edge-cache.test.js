// /p/* 边缘缓存回归测试
//
// 性能报告两次都把「二级页 max-age=0、每次回源 ~1s」列为最大短板。
// 加缓存时最容易踩的是安全：私有 / 密码页一旦进缓存，别人就能读到。
// 这里把边界钉死：
//   1. 公开无密码页 → 可缓存、写进 Cache API、第二次命中
//   2. 私有 / 密码页 → 绝不进缓存，Header 保持 no-store / max-age=0
//   3. 带 Cookie / Authorization → 绕过缓存（可能是属主或已解锁的访客）
//   4. 改内容后主动失效，编辑者立即看到新版
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { createEnv, createTestUser } from '../helpers/mock-env.js';
import { servePage } from '../../src/pages/handler.js';
import { handleUpdatePage } from '../../src/pages/manage.js';
import { createToken } from '../../src/admin/auth.js';

const SECRET = 'test-secret-at-least-32-bytes!!';

function fakeCaches() {
  const store = new Map();
  return {
    default: {
      async match(req) { const r = store.get(req.url); return r ? r.clone() : undefined; },
      async put(req, res) { store.set(req.url, res.clone()); },
      async delete(req) { return store.delete(req.url); },
    },
    _store: store,
  };
}

let origCaches;
beforeEach(() => { origCaches = globalThis.caches; globalThis.caches = fakeCaches(); });
afterEach(() => {
  if (origCaches === undefined) delete globalThis.caches;
  else globalThis.caches = origCaches;
});

function makeCtx() {
  const pending = [];
  return { ctx: { waitUntil: p => pending.push(Promise.resolve(p).catch(() => {})) }, drain: () => Promise.all(pending.splice(0)) };
}

async function seedPage(env, slug, extra = {}) {
  await env.STATS.put('page:' + slug, JSON.stringify({
    slug, title: '测试页', content: '# 标题\n\n正文内容', type: 'markdown',
    owner: 'admin', isPublic: true, createdAt: 1, updatedAt: 1, ...extra,
  }));
}

const req = (slug, headers = {}) => new Request('https://img.diswant.space/p/' + slug, { headers });

describe('/p/* 边缘缓存', () => {
  test('公开页可缓存：第二次请求命中 Cache API', async () => {
    const env = createEnv();
    await seedPage(env, 'pub');
    const { ctx, drain } = makeCtx();

    const first = await servePage(env, 'pub', ctx, req('pub'));
    expect(first.headers.get('Cache-Control')).toContain('max-age=3600');
    await drain();

    const second = await servePage(env, 'pub', ctx, req('pub'));
    expect(second.headers.get('X-Cache')).toBe('HIT');
    await drain();
  });

  test('私有页绝不进缓存，Header 保持 max-age=0', async () => {
    const env = createEnv();
    await seedPage(env, 'priv', { isPublic: false, accessPassword: 'abc123' });
    const { ctx, drain } = makeCtx();

    const res = await servePage(env, 'priv', ctx, req('priv', { Cookie: 'onimg_p_priv=abc123' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).not.toContain('max-age=3600');
    await drain();
    expect(globalThis.caches._store.size).toBe(0);   // 一个字节都没缓存
  });

  test('密码页未解锁时给密码提示，且不进缓存', async () => {
    const env = createEnv();
    await seedPage(env, 'pwd', { isPublic: false, accessPassword: 'xyz789', type: 'html', content: '<html><body>x</body></html>' });
    const { ctx, drain } = makeCtx();
    const res = await servePage(env, 'pwd', ctx, req('pwd'));
    expect(res.status).toBe(403);       // 密码提示页
    await drain();
    expect(globalThis.caches._store.size).toBe(0);
  });

  test('带 Cookie 的请求绕过缓存（不读也不写）', async () => {
    const env = createEnv();
    await seedPage(env, 'ck');
    const { ctx, drain } = makeCtx();

    await servePage(env, 'ck', ctx, req('ck'));
    await drain();
    expect(globalThis.caches._store.size).toBe(1);

    const withCookie = await servePage(env, 'ck', ctx, req('ck', { Cookie: 'a=1' }));
    expect(withCookie.headers.get('X-Cache')).toBe(null);   // 没走缓存
    await drain();
  });

  test('带 Authorization 的请求绕过缓存', async () => {
    const env = createEnv();
    await seedPage(env, 'auth');
    const { ctx, drain } = makeCtx();
    const res = await servePage(env, 'auth', ctx, req('auth', { Authorization: 'Bearer t' }));
    expect(res.headers.get('X-Cache')).toBe(null);
    await drain();
    expect(globalThis.caches._store.size).toBe(0);
  });

  test('缓存命中时仍然记访问统计', async () => {
    const env = createEnv();
    await seedPage(env, 'cnt');
    const { ctx, drain } = makeCtx();

    await servePage(env, 'cnt', ctx, req('cnt'));
    await drain();
    const hit = await servePage(env, 'cnt', ctx, req('cnt'));
    expect(hit.headers.get('X-Cache')).toBe('HIT');
    await drain();

    const row = await env.STATS.getWithMetadata('astat:page:cnt', 'json');
    expect(row?.metadata?.count).toBe(2);
  });

  test('改内容后主动失效，编辑者立刻看到新版', async () => {
    const env = createEnv();
    await seedPage(env, 'edit');
    const { ctx, drain } = makeCtx();

    await servePage(env, 'edit', ctx, req('edit'));
    await drain();
    expect(globalThis.caches._store.size).toBe(1);

    // 用管理端接口改内容
    await createTestUser(env, 'admin', 'pw123456', { canUpload: true });
    const token = await createToken({ type: 'admin', username: 'admin' }, 3600_000, SECRET);
    const res = await handleUpdatePage(
      new Request('https://img.diswant.space/admin/pages/edit', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '改过的标题' }),
      }), env, 'edit', 'admin', true);
    expect(res.status).toBe(200);

    // 缓存被清掉 → 下一次是 MISS，拿到新内容
    const after = await servePage(env, 'edit', ctx, req('edit'));
    expect(after.headers.get('X-Cache')).toBe(null);
    expect(await after.text()).toContain('改过的标题');
  });

  test('没有 Cache API 时（本地 / 单测）行为不变', async () => {
    delete globalThis.caches;
    const env = createEnv();
    await seedPage(env, 'nocache');
    const { ctx } = makeCtx();
    const res = await servePage(env, 'nocache', ctx, req('nocache'));
    expect(res.status).toBe(200);
  });
});
