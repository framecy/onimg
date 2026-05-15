const ADMIN_TOKEN_TTL = 24 * 60 * 60 * 1000;
const USER_TOKEN_TTL  = 7 * 24 * 60 * 60 * 1000; // 7 days

// ── Admin login ──────────────────────────────────────────────────────────────

export async function handleAdminLogin(request, env) {
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD || !env.TOKEN_SECRET) {
    return Response.json({ error: 'Admin not configured' }, { status: 503 });
  }
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const ok = timingSafeEqual(body.username ?? '', env.ADMIN_USERNAME)
           & timingSafeEqual(body.password  ?? '', env.ADMIN_PASSWORD);
  if (!ok) return Response.json({ error: 'Invalid credentials' }, { status: 401 });

  const token = await createToken({ type: 'admin' }, ADMIN_TOKEN_TTL, env.TOKEN_SECRET);
  return Response.json({ token, username: env.ADMIN_USERNAME });
}

export async function verifyAdminToken(request, env) {
  if (!env.TOKEN_SECRET) return false;
  const raw = bearerToken(request);
  if (!raw) return false;
  const payload = await verifyToken(raw, env.TOKEN_SECRET);
  return payload?.type === 'admin';
}

// ── Shared crypto helpers (exported for user-auth.js) ────────────────────────

export async function createToken(payload, ttl, secret) {
  const full = { ...payload, iat: Date.now(), exp: Date.now() + ttl };
  const b64  = btoa(JSON.stringify(full));
  const sig  = await hmacSign(b64, secret);
  return b64 + '.' + sig;
}

export async function verifyToken(token, secret) {
  const dot = token.lastIndexOf('.');
  if (dot < 1) return null;
  const b64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  try {
    const expected = await hmacSign(b64, secret);
    if (!timingSafeEqual(sig, expected)) return null;
    const payload = JSON.parse(atob(b64));
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch { return null; }
}

export async function hmacSign(data, secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export function timingSafeEqual(a, b) {
  const maxLen = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < maxLen; i++) diff |= (a.charCodeAt(i) ?? 0) ^ (b.charCodeAt(i) ?? 0);
  return diff === 0;
}

export function bearerToken(request) {
  const h = request.headers.get('Authorization') ?? '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}
