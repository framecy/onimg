import { getUser, putUser, hashPassword, randomSalt, getUserQuotaInfo } from '../user-auth.js';

const UNLIMITED_PERMS = {
  canUpload: true,
  canDelete: true,
  canEdit: true,
  maxTotalUploads: -1,
  dailyUploadLimit: -1,
};

export async function handleListUsers(env) {
  const [list, adminLastLoginRaw] = await Promise.all([
    env.STATS.list({ prefix: 'user:' }),
    env.STATS.get('admin:lastLoginAt'),
  ]);
  const users = await Promise.all(
    list.keys.map(async k => {
      const username = k.name.slice(5);
      const user = await env.STATS.get(k.name, 'json');
      const quota = await getUserQuotaInfo(env, username);
      return {
        username,
        disabled: user?.disabled ?? false,
        permissions: user?.permissions ?? UNLIMITED_PERMS,
        createdAt: user?.createdAt,
        lastLoginAt: user?.lastLoginAt ?? null,
        tokenTtlDays: user?.tokenTtlDays ?? 7,
        quota,
      };
    })
  );
  const adminEntry = {
    username: env.ADMIN_USERNAME ?? 'admin',
    isAdmin: true,
    disabled: false,
    permissions: UNLIMITED_PERMS,
    createdAt: null,
    lastLoginAt: adminLastLoginRaw ? parseInt(adminLastLoginRaw) : null,
    tokenTtlDays: 7,
    quota: null,
  };
  return Response.json({ users: [adminEntry, ...users] });
}

export async function handleCreateUser(request, env) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { username, password, permissions } = body;
  if (!username || !password) return Response.json({ error: 'username and password required' }, { status: 400 });
  if (!/^[a-zA-Z0-9_-]{2,32}$/.test(username)) {
    return Response.json({ error: 'username must be 2-32 chars: letters, numbers, _ -' }, { status: 400 });
  }
  if (username === (env.ADMIN_USERNAME ?? 'admin')) {
    return Response.json({ error: 'Cannot create user with admin username' }, { status: 409 });
  }
  const existing = await getUser(env, username);
  if (existing) return Response.json({ error: 'User already exists' }, { status: 409 });

  const salt = randomSalt();
  const passwordHash = await hashPassword(password, salt);

  // Validate storageQuota if provided
  let storageQuota = -1;
  if (body.storageQuota !== undefined && body.storageQuota !== -1) {
    storageQuota = Number(body.storageQuota);
    if (isNaN(storageQuota) || storageQuota < 100 * 1024 * 1024) {
      return Response.json({ error: 'storageQuota must be -1 (unlimited) or >= 100 MB' }, { status: 400 });
    }
    if (storageQuota > 5 * 1024 * 1024 * 1024) {
      return Response.json({ error: 'storageQuota must be <= 5 GB' }, { status: 400 });
    }
  }

  const ttlDays = body.tokenTtlDays !== undefined ? parseInt(body.tokenTtlDays) : 7;
  const user = {
    passwordHash,
    salt,
    disabled: false,
    permissions: {
      canUpload: permissions?.canUpload ?? true,
      canDelete: permissions?.canDelete ?? false,
      canEdit: permissions?.canEdit ?? false,
      maxTotalUploads: permissions?.maxTotalUploads ?? 100,
      dailyUploadLimit: permissions?.dailyUploadLimit ?? 20,
      storageQuota,
    },
    tokenTtlDays: (isNaN(ttlDays) || ttlDays < 1) ? 7 : Math.min(ttlDays, 365),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await putUser(env, username, user);
  return Response.json({ username, permissions: user.permissions }, { status: 201 });
}

export async function handleUpdateUser(request, env, username) {
  if (username === (env.ADMIN_USERNAME ?? 'admin')) {
    return Response.json({ error: 'Cannot modify built-in admin' }, { status: 403 });
  }
  const existing = await getUser(env, username);
  if (!existing) return Response.json({ error: 'User not found' }, { status: 404 });

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (body.password) {
    existing.salt = randomSalt();
    existing.passwordHash = await hashPassword(body.password, existing.salt);
  }
  if (body.disabled !== undefined) existing.disabled = !!body.disabled;
  if (body.permissions) {
    existing.permissions = { ...existing.permissions, ...body.permissions };
  }
  if (body.tokenTtlDays !== undefined) {
    const ttl = parseInt(body.tokenTtlDays);
    existing.tokenTtlDays = (!isNaN(ttl) && ttl >= 1) ? Math.min(ttl, 365) : 7;
  }
  // Validate storageQuota if provided at top level or in permissions
  const sqRaw = body.storageQuota ?? body.permissions?.storageQuota;
  if (sqRaw !== undefined) {
    const sq = Number(sqRaw);
    if (sq !== -1) {
      if (isNaN(sq) || sq < 100 * 1024 * 1024) {
        return Response.json({ error: 'storageQuota must be -1 (unlimited) or >= 100 MB' }, { status: 400 });
      }
      if (sq > 5 * 1024 * 1024 * 1024) {
        return Response.json({ error: 'storageQuota must be <= 5 GB' }, { status: 400 });
      }
    }
    existing.permissions.storageQuota = sq;
  }
  existing.updatedAt = Date.now();

  await putUser(env, username, existing);
  return Response.json({ username, permissions: existing.permissions, disabled: existing.disabled });
}

export async function handleDeleteUser(env, username) {
  if (username === (env.ADMIN_USERNAME ?? 'admin')) {
    return Response.json({ error: 'Cannot delete built-in admin' }, { status: 403 });
  }
  const existing = await getUser(env, username);
  if (!existing) return Response.json({ error: 'User not found' }, { status: 404 });

  await env.STATS.delete('user:' + username);
  return Response.json({ deleted: username });
}
