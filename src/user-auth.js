import { createToken, verifyToken, bearerToken, timingSafeEqual } from './admin/auth.js';

const USER_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000;

export async function handleUserLogin(request, env) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { username, password } = body;
  if (!username || !password) return Response.json({ error: 'Missing credentials' }, { status: 400 });

  // Check admin credentials first (stored in env secrets, not KV)
  if (env.ADMIN_USERNAME && timingSafeEqual(username, env.ADMIN_USERNAME)) {
    if (!env.ADMIN_PASSWORD || !timingSafeEqual(password, env.ADMIN_PASSWORD)) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const unlimitedPerms = { canUpload: true, canDelete: true, canEdit: true, maxTotalUploads: -1, dailyUploadLimit: -1 };
    const token = await createToken({ type: 'user', username, isAdmin: true }, USER_TOKEN_TTL, env.TOKEN_SECRET);
    return Response.json({ token, username, permissions: unlimitedPerms });
  }

  const user = await getUser(env, username);
  if (!user || user.disabled) return Response.json({ error: 'Invalid credentials' }, { status: 401 });

  const hash = await hashPassword(password, user.salt);
  if (!timingSafeEqual(hash, user.passwordHash)) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await createToken({ type: 'user', username }, USER_TOKEN_TTL, env.TOKEN_SECRET);
  return Response.json({ token, username, permissions: user.permissions });
}

// Returns { username, permissions } or null
export async function verifyUserToken(request, env) {
  if (!env.TOKEN_SECRET) return null;
  const raw = bearerToken(request);
  if (!raw) return null;
  const payload = await verifyToken(raw, env.TOKEN_SECRET);
  if (!payload || payload.type !== 'user') return null;

  // Admin user token — skip KV lookup, return unlimited permissions
  if (payload.isAdmin) {
    return {
      username: payload.username,
      permissions: { canUpload: true, canDelete: true, canEdit: true, maxTotalUploads: -1, dailyUploadLimit: -1 },
    };
  }

  const user = await getUser(env, payload.username);
  if (!user || user.disabled) return null;
  return { username: payload.username, permissions: user.permissions };
}

// ── User helpers ─────────────────────────────────────────────────────────────

export async function getUser(env, username) {
  return env.STATS.get('user:' + username, 'json');
}

export async function putUser(env, username, data) {
  await env.STATS.put('user:' + username, JSON.stringify(data));
}

export async function hashPassword(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  return btoa(String.fromCharCode(...new Uint8Array(bits)));
}

export function randomSalt() {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
}

// ── Upload quota helpers ──────────────────────────────────────────────────────

export async function checkAndIncrementQuota(env, username, permissions) {
  // -1 means unlimited
  const today = new Date().toISOString().slice(0, 10);
  const totalKey = 'ucount:total:' + username;
  const dailyKey = 'ucount:daily:' + username + ':' + today;

  const [totalStr, dailyStr] = await Promise.all([
    env.STATS.get(totalKey),
    env.STATS.get(dailyKey),
  ]);
  const total = parseInt(totalStr ?? '0');
  const daily = parseInt(dailyStr ?? '0');

  if (permissions.maxTotalUploads !== -1 && total >= permissions.maxTotalUploads) {
    return { allowed: false, reason: `已达上传总量限制 (${permissions.maxTotalUploads} 张)` };
  }
  if (permissions.dailyUploadLimit !== -1 && daily >= permissions.dailyUploadLimit) {
    return { allowed: false, reason: `已达今日上传限制 (${permissions.dailyUploadLimit} 张/天)` };
  }

  await Promise.all([
    env.STATS.put(totalKey, String(total + 1)),
    env.STATS.put(dailyKey, String(daily + 1), { expirationTtl: 172800 }), // 2 days TTL
  ]);
  return { allowed: true };
}

export async function getUserQuotaInfo(env, username) {
  const today = new Date().toISOString().slice(0, 10);
  const [totalStr, dailyStr] = await Promise.all([
    env.STATS.get('ucount:total:' + username),
    env.STATS.get('ucount:daily:' + username + ':' + today),
  ]);
  return { total: parseInt(totalStr ?? '0'), daily: parseInt(dailyStr ?? '0') };
}
