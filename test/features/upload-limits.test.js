import { describe, test, expect, beforeEach } from 'vitest';
import { verifyUserToken, getUploadLimits, handleUserLogin } from '../../src/user-auth.js';
import {
  createEnv,
  createRequest,
  authedRequest,
  createTestUser,
} from '../helpers/mock-env.js';

// ── /auth/upload-limits 端点（前端体积/类型预检的数据源） ────────────────────

describe('Upload limits endpoint (getUploadLimits)', () => {
  let env;
  beforeEach(() => { env = createEnv(); });

  test('returns maxFileSize and allowedTypes from env defaults', async () => {
    const limits = await getUploadLimits(env);
    expect(limits.maxFileSize).toBe(10485760);
    expect(limits.allowedTypes).toBe('image/jpeg,image/png,image/gif,image/webp,image/svg+xml');
  });

  test('respects admin-stored config over env defaults', async () => {
    await env.STATS.put('config:upload', JSON.stringify({
      maxFileSize: 52428800,
      allowedTypes: 'image/png',
    }));
    const limits = await getUploadLimits(env);
    expect(limits.maxFileSize).toBe(52428800);
    expect(limits.allowedTypes).toBe('image/png');
  });

  test('falls back to env when stored config is partial', async () => {
    await env.STATS.put('config:upload', JSON.stringify({ maxFileSize: 20971520 }));
    const limits = await getUploadLimits(env);
    expect(limits.maxFileSize).toBe(20971520);
    expect(limits.allowedTypes).toBe('image/jpeg,image/png,image/gif,image/webp,image/svg+xml');
  });
});

// ── 前端 appendFiles 预检算法（从 page.js 中提取的同一段逻辑） ────────────────

// 与 src/page.js appendFiles 保持一致的纯函数版本，用于在 Node 环境验证拦截规则
function preflight(files, uploadLimits, fmtShortSize) {
  const cfg = uploadLimits;
  if (!cfg) return { accepted: files, rejected: [] };
  const maxSize = cfg.maxFileSize, allowed = cfg.allowedTypes;
  const rejected = [], accepted = [];
  for (const f of files) {
    const mime = (f.type || '').split(';')[0].trim();
    if (f.size > maxSize) {
      rejected.push(f.name + '（' + fmtShortSize(f.size) + ' > 上限 ' + fmtShortSize(maxSize) + '）');
    } else if (allowed && !allowed.split(',').map(t => t.trim()).includes(mime)) {
      rejected.push(f.name + '（类型 ' + (mime || '未知') + ' 不在允许列表）');
    } else accepted.push(f);
  }
  return { accepted, rejected };
}

const fmtShortSize = b => b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
const LIMITS = { maxFileSize: 10485760, allowedTypes: 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml' };

describe('Client-side preflight (appendFiles logic)', () => {
  test('accepts files within size limit and allowed types', () => {
    const files = [
      { name: 'a.jpg', size: 5 * 1048576, type: 'image/jpeg' },
      { name: 'b.png', size: 1024, type: 'image/png' },
    ];
    const { accepted, rejected } = preflight(files, LIMITS, fmtShortSize);
    expect(accepted).toHaveLength(2);
    expect(rejected).toHaveLength(0);
  });

  test('rejects oversized files with a readable reason', () => {
    const files = [{ name: 'big.jpg', size: 12 * 1048576, type: 'image/jpeg' }];
    const { accepted, rejected } = preflight(files, LIMITS, fmtShortSize);
    expect(accepted).toHaveLength(0);
    expect(rejected[0]).toContain('big.jpg');
    expect(rejected[0]).toContain('12.0 MB');
    expect(rejected[0]).toContain('上限');
  });

  test('rejects disallowed types', () => {
    const files = [{ name: 'evil.exe', size: 1024, type: 'application/x-msdownload' }];
    const { accepted, rejected } = preflight(files, LIMITS, fmtShortSize);
    expect(accepted).toHaveLength(0);
    expect(rejected[0]).toContain('不在允许列表');
  });

  test('handles missing type as unknown', () => {
    const files = [{ name: 'mystery', size: 1024, type: '' }];
    const { rejected } = preflight(files, LIMITS, fmtShortSize);
    expect(rejected[0]).toContain('未知');
  });

  test('keeps valid files when the batch is mixed', () => {
    const files = [
      { name: 'ok.png', size: 1024, type: 'image/png' },
      { name: 'huge.png', size: 99 * 1048576, type: 'image/png' },
      { name: 'bad.pdf', size: 1024, type: 'application/pdf' },
    ];
    const { accepted, rejected } = preflight(files, LIMITS, fmtShortSize);
    expect(accepted.map(f => f.name)).toEqual(['ok.png']);
    expect(rejected).toHaveLength(2);
  });

  test('passes everything through when limits are unavailable (degraded mode)', () => {
    const files = [{ name: 'a.jpg', size: 999 * 1048576, type: 'image/jpeg' }];
    const { accepted, rejected } = preflight(files, null, fmtShortSize);
    expect(accepted).toHaveLength(1);
    expect(rejected).toHaveLength(0);
  });
});

// ── 端到端：登录 → 调 upload-limits ──────────────────────────────────────────

describe('Upload limits flow', () => {
  let env;
  beforeEach(() => { env = createEnv(); });

  test('logged-in user can fetch limits via verifyUserToken path', async () => {
    await createTestUser(env, 'alice', 'UserP@ss123!');
    const loginRes = await handleUserLogin(
      createRequest('POST', 'http://localhost/auth/login', { body: { username: 'alice', password: 'UserP@ss123!' } }),
      env,
    );
    expect(loginRes.status).toBe(200);
    const { token } = await loginRes.json();
    const user = await verifyUserToken(authedRequest('GET', 'http://localhost/x', token), env);
    expect(user).not.toBeNull();
    expect(user.username).toBe('alice');

    const limits = await getUploadLimits(env);
    expect(limits.maxFileSize).toBeGreaterThan(0);
    expect(typeof limits.allowedTypes).toBe('string');
  });
});
