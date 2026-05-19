import { hashPassword, randomSalt } from '../../src/user-auth.js';

// In-memory KV Namespace
export function createKV() {
  const store = new Map();
  return {
    async get(key, type) {
      const val = store.get(key) ?? null;
      if (type === 'json' && val !== null) {
        try { return JSON.parse(val); } catch { return null; }
      }
      return val;
    },
    async put(key, value, _opts) {
      store.set(key, String(value));
    },
    async delete(key) {
      store.delete(key);
    },
    async list(opts = {}) {
      const prefix = opts.prefix ?? '';
      const keys = [...store.keys()]
        .filter(k => k.startsWith(prefix))
        .map(name => ({ name, metadata: null }));
      return { keys, list_complete: true };
    },
    _store: store,
  };
}

// In-memory R2 Bucket
export function createR2() {
  const store = new Map();
  return {
    async put(key, body, opts = {}) {
      store.set(key, {
        key,
        size: body?.byteLength ?? 0,
        httpMetadata: opts.httpMetadata ?? {},
        customMetadata: opts.customMetadata ?? {},
        uploaded: new Date(),
      });
      return { key };
    },
    async get(key) {
      return store.get(key) ?? null;
    },
    async head(key) {
      const obj = store.get(key);
      if (!obj) return null;
      return { key: obj.key, size: obj.size, customMetadata: obj.customMetadata, uploaded: obj.uploaded };
    },
    async delete(key) {
      store.delete(key);
    },
    async list(opts = {}) {
      const { limit = 1000, cursor, prefix = '' } = opts;
      const objects = [...store.values()].filter(o => o.key.startsWith(prefix));
      return { objects, truncated: false };
    },
    _store: store,
  };
}

// Build a test environment
export function createEnv(overrides = {}) {
  return {
    STATS: createKV(),
    BUCKET: createR2(),
    ADMIN_USERNAME: 'admin',
    ADMIN_PASSWORD: 'AdminP@ss99!',
    TOKEN_SECRET: 'test-secret-at-least-32-bytes!!',
    MAX_FILE_SIZE: '10485760',
    ALLOWED_TYPES: 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml',
    ...overrides,
  };
}

// Build a Request with optional JSON body and headers
export function createRequest(method, url, { headers = {}, body } = {}) {
  const hdrs = new Headers(headers);
  const init = { method, headers: hdrs };
  if (body !== undefined) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
    if (!hdrs.has('Content-Type')) hdrs.set('Content-Type', 'application/json');
  }
  return new Request(url, init);
}

// Build an authenticated Request (Bearer token)
export function authedRequest(method, url, token, opts = {}) {
  return createRequest(method, url, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, ...(opts.headers ?? {}) },
  });
}

// Build a binary upload Request (raw body, not multipart)
export function createUploadRequest(token, { mimeType = 'image/jpeg', size = 1024 } = {}) {
  const body = new Uint8Array(size).fill(0xff).buffer;
  return new Request('http://localhost/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': mimeType,
    },
    body,
  });
}

// Create and store a test user in KV; returns the plaintext password
export async function createTestUser(env, username, password, {
  canUpload = true,
  canDelete = true,
  canEdit = true,
  maxTotalUploads = -1,
  dailyUploadLimit = -1,
  disabled = false,
} = {}) {
  const salt = randomSalt();
  const passwordHash = await hashPassword(password, salt);
  const user = {
    passwordHash,
    salt,
    disabled,
    permissions: { canUpload, canDelete, canEdit, maxTotalUploads, dailyUploadLimit },
  };
  await env.STATS.put('user:' + username, JSON.stringify(user));
  return user;
}

// Store a fake image in both R2 and KV
export async function createTestImage(env, key, owner) {
  await env.BUCKET.put(key, new Uint8Array(512).buffer, {
    customMetadata: { uploadedBy: owner },
  });
  await env.STATS.put('imgmeta:' + key, JSON.stringify({ uploadedAt: Date.now() }), {
    metadata: { isPublic: true, owner },
  });
  const list = await env.STATS.get('userimgs:' + owner, 'json') ?? [];
  list.unshift({ key, size: 512, uploadedAt: Date.now(), isPublic: true });
  await env.STATS.put('userimgs:' + owner, JSON.stringify(list));
}
