import { hashPassword, randomSalt } from '../../src/user-auth.js';

// In-memory KV Namespace
export function createKV() {
  const store = new Map();    // key -> string value
  const metaStore = new Map(); // key -> metadata object
  return {
    async get(key, type) {
      const val = store.get(key) ?? null;
      if (type === 'json' && val !== null) {
        try { return JSON.parse(val); } catch { return null; }
      }
      return val;
    },
    async getWithMetadata(key, type) {
      const raw = store.get(key) ?? null;
      let value = raw;
      if (type === 'json' && raw !== null) {
        try { value = JSON.parse(raw); } catch { value = null; }
      }
      return { value, metadata: metaStore.get(key) ?? null };
    },
    async put(key, value, opts = {}) {
      store.set(key, String(value));
      if (opts.metadata !== undefined) metaStore.set(key, opts.metadata);
    },
    async delete(key) {
      store.delete(key);
      metaStore.delete(key);
    },
    async list(opts = {}) {
      const prefix = opts.prefix ?? '';
      const keys = [...store.keys()]
        .filter(k => k.startsWith(prefix))
        .map(name => ({ name, metadata: metaStore.get(name) ?? null }));
      return { keys, list_complete: true };
    },
    _store: store,
  };
}

// In-memory R2 Bucket
export function createR2() {
  const store = new Map();
  // 真实 R2 会把 ReadableStream 完整落盘；mock 需要同样物化，
  // 否则流式直传（src/upload.js、src/proto/upload.js）在测试里存进去的是流对象本身
  async function materialize(body) {
    if (body && typeof body.getReader === 'function') {
      const reader = body.getReader();
      const chunks = [];
      let total = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value); total += value.byteLength ?? 0;
      }
      const out = new Uint8Array(total);
      let off = 0;
      for (const c of chunks) { out.set(c, off); off += c.byteLength ?? 0; }
      return out.buffer;
    }
    return body;
  }
  return {
    async put(key, body, opts = {}) {
      body = await materialize(body);
      const isStr = typeof body === 'string';
      const size = isStr ? body.length : (body?.byteLength ?? 0);
      store.set(key, {
        key,
        size,
        body,                         // raw: string | ArrayBuffer | Uint8Array
        httpMetadata: opts.httpMetadata ?? {},
        customMetadata: opts.customMetadata ?? {},
        uploaded: new Date(),
      });
      return { key };
    },
    async get(key) {
      const obj = store.get(key);
      if (!obj) return null;
      const body = obj.body;
      return {
        ...obj,
        async text() { return typeof body === 'string' ? body : new TextDecoder().decode(body); },
        async json() { return JSON.parse(typeof body === 'string' ? body : new TextDecoder().decode(body)); },
        async arrayBuffer() { return body instanceof ArrayBuffer ? body : (body?.buffer ?? new ArrayBuffer(0)); },
      };
    },
    async head(key) {
      const obj = store.get(key);
      if (!obj) return null;
      return { key: obj.key, size: obj.size, customMetadata: obj.customMetadata, uploaded: obj.uploaded };
    },
    async delete(key) {
      // R2 supports deleting a single key or an array (≤1000) of keys
      if (Array.isArray(key)) { for (const k of key) store.delete(k); }
      else store.delete(key);
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
    MAX_FILE_SIZE: '10485760',  // 与线上默认一致的 10MB；streaming 测试按此断言 413
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
