export async function handleGet(env, ctx, key, request) {
  if (!key) return new Response('Not Found', { status: 404 });

  const object = await env.BUCKET.get(key);
  if (!object) return new Response('Image Not Found', { status: 404 });

  // 后台记录访问，不阻塞响应
  ctx.waitUntil(recordAccess(env, key, request));

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000',
      'ETag': object.etag,
    }
  });
}

async function recordAccess(env, key, request) {
  if (!env.STATS) return;

  const cf = request.cf ?? {};
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';

  const statsKey = 'stats:' + key;
  const existing = await env.STATS.getWithMetadata(statsKey, 'json');
  const accesses = existing?.value ?? [];
  const count = (existing?.metadata?.count ?? 0) + 1;

  accesses.unshift({
    ip,
    country: cf.country ?? '—',
    city: cf.city ?? '—',
    region: cf.region ?? '—',
    org: cf.asOrganization ?? '—',
    ts: Date.now(),
  });
  // 最多保留 200 条访问记录
  if (accesses.length > 200) accesses.length = 200;

  await env.STATS.put(statsKey, JSON.stringify(accesses), {
    metadata: { count, lastAccess: Date.now() },
  });
}
