import { describe, test, expect, beforeEach } from 'vitest';
import { logAudit, handleAuditLog, clientIp } from '../../src/admin/audit.js';
import { createEnv } from '../helpers/mock-env.js';

const utcDay = (ts = Date.now()) => new Date(ts).toISOString().slice(0, 10);

describe('Audit log', () => {
  let env;
  beforeEach(() => { env = createEnv(); });

  test('logAudit writes an entry to today\'s key', async () => {
    await logAudit(env.STATS, { action: 'admin.login', actor: 'admin', status: 'ok', ip: '1.2.3.4' });
    const list = await env.STATS.get('audit:' + utcDay(), 'json');
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ action: 'admin.login', actor: 'admin', status: 'ok', ip: '1.2.3.4' });
    expect(typeof list[0].ts).toBe('number');
  });

  test('entries are prepended (newest first)', async () => {
    await logAudit(env.STATS, { action: 'a', actor: 'x' });
    await logAudit(env.STATS, { action: 'b', actor: 'y' });
    const list = await env.STATS.get('audit:' + utcDay(), 'json');
    expect(list.map(e => e.action)).toEqual(['b', 'a']);
  });

  test('caps at 500 entries per day', async () => {
    // seed 500 existing
    const seed = Array.from({ length: 500 }, (_, i) => ({ ts: i, action: 'seed', actor: 'x' }));
    await env.STATS.put('audit:' + utcDay(), JSON.stringify(seed));
    await logAudit(env.STATS, { action: 'new', actor: 'y' });
    const list = await env.STATS.get('audit:' + utcDay(), 'json');
    expect(list).toHaveLength(500);
    expect(list[0].action).toBe('new'); // newest kept
  });

  test('long fields are truncated', async () => {
    await logAudit(env.STATS, { action: 'x'.repeat(80), actor: 'a'.repeat(80), target: 't'.repeat(300) });
    const list = await env.STATS.get('audit:' + utcDay(), 'json');
    expect(list[0].action.length).toBeLessThanOrEqual(40);
    expect(list[0].actor.length).toBeLessThanOrEqual(64);
    expect(list[0].target.length).toBeLessThanOrEqual(200);
  });

  test('handleAuditLog merges recent days, newest first, clamps days', async () => {
    const today = utcDay();
    const yesterday = utcDay(Date.now() - 86400000);
    await env.STATS.put('audit:' + yesterday, JSON.stringify([{ ts: 1, action: 'old', actor: 'x' }]));
    await env.STATS.put('audit:' + today, JSON.stringify([{ ts: 2, action: 'new', actor: 'y' }]));
    const url = new URL('http://localhost/admin/audit?days=7');
    const res = await handleAuditLog(env, url);
    const data = await res.json();
    expect(data.days).toBe(7);
    expect(data.entries.map(e => e.action)).toEqual(['new', 'old']);
  });

  test('handleAuditLog clamps days to [1,31]', async () => {
    const big = await (await handleAuditLog(env, new URL('http://localhost/a?days=999'))).json();
    expect(big.days).toBe(31);
    const zero = await (await handleAuditLog(env, new URL('http://localhost/a?days=0'))).json();
    expect(zero.days).toBe(1);
  });

  test('clientIp reads CF-Connecting-IP header', () => {
    const req = new Request('http://localhost/', { headers: { 'CF-Connecting-IP': '9.9.9.9' } });
    expect(clientIp(req)).toBe('9.9.9.9');
    expect(clientIp(new Request('http://localhost/'))).toBe('—');
  });

  test('logAudit never throws on KV failure', async () => {
    const badStats = { get: async () => { throw new Error('kv down'); }, put: async () => {} };
    await expect(logAudit(badStats, { action: 'x', actor: 'y' })).resolves.toBeUndefined();
  });
});
