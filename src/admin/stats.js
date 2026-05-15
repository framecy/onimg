export async function handleAdminStats(env) {
  let totalImages = 0;
  let totalSize = 0;
  let cursor;

  do {
    const result = await env.BUCKET.list({ limit: 1000, cursor });
    for (const obj of result.objects) {
      totalImages++;
      totalSize += obj.size;
    }
    cursor = result.truncated ? result.cursor : undefined;
  } while (cursor);

  return Response.json({ totalImages, totalSize });
}

// 返回所有图片的访问次数（KV metadata，单次 list 调用）
export async function handleAllImageStats(env) {
  const result = { stats: {} };
  let cursor;

  do {
    const list = await env.STATS.list({ prefix: 'stats:', cursor, limit: 1000 });
    for (const key of list.keys) {
      const imageKey = key.name.slice(6); // 去掉 'stats:' 前缀
      result.stats[imageKey] = key.metadata ?? { count: 0, lastAccess: null };
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);

  return Response.json(result);
}

// R2 存储 + 操作统计（实时）
export async function handleR2DetailedStats(env) {
  const [storageResult, readsResult, writesResult, membersResult] = await Promise.all([
    // R2 real-time: object count + total size
    (async () => {
      let count = 0, size = 0, cursor;
      do {
        const r = await env.BUCKET.list({ limit: 1000, cursor });
        for (const o of r.objects) { count++; size += o.size; }
        cursor = r.truncated ? r.cursor : undefined;
      } while (cursor);
      return { count, size };
    })(),
    // B-class proxy: sum access counts from stats: key metadata
    (async () => {
      let total = 0, cursor;
      do {
        const list = await env.STATS.list({ prefix: 'stats:', cursor, limit: 1000 });
        for (const k of list.keys) total += (k.metadata?.count ?? 0);
        cursor = list.list_complete ? undefined : list.cursor;
      } while (cursor);
      return total;
    })(),
    // A-class proxy: sum per-user total upload counts
    (async () => {
      let total = 0, cursor;
      do {
        const list = await env.STATS.list({ prefix: 'ucount:total:', cursor, limit: 1000 });
        await Promise.all(list.keys.map(async k => {
          const v = await env.STATS.get(k.name);
          total += parseInt(v ?? '0');
        }));
        cursor = list.list_complete ? undefined : list.cursor;
      } while (cursor);
      return total;
    })(),
    // Member count
    (async () => {
      const list = await env.STATS.list({ prefix: 'user:' });
      return list.keys.length;
    })(),
  ]);

  return Response.json({
    storage: storageResult.size,
    objects: storageResult.count,
    reads: readsResult,
    writes: writesResult,
    members: membersResult,
    freeGb: Math.max(0, 10 - storageResult.size / 1073741824),
  });
}

// 成员详细统计：每用户上传数、配额、页面数
export async function handleMemberStats(env) {
  const today = new Date().toISOString().slice(0, 10);

  const [userList, pageList] = await Promise.all([
    env.STATS.list({ prefix: 'user:' }),
    env.STATS.list({ prefix: 'page:' }),
  ]);

  // Count pages per owner
  const pageOwnerCounts = {};
  await Promise.all(pageList.keys.map(async k => {
    const p = await env.STATS.get(k.name, 'json');
    if (p?.owner) pageOwnerCounts[p.owner] = (pageOwnerCounts[p.owner] ?? 0) + 1;
  }));

  const users = await Promise.all(userList.keys.map(async k => {
    const username = k.name.slice(5);
    const [user, totalStr, dailyStr] = await Promise.all([
      env.STATS.get(k.name, 'json'),
      env.STATS.get('ucount:total:' + username),
      env.STATS.get('ucount:daily:' + username + ':' + today),
    ]);
    return {
      username,
      disabled: user?.disabled ?? false,
      permissions: user?.permissions ?? null,
      createdAt: user?.createdAt ?? null,
      uploads: {
        total: parseInt(totalStr ?? '0'),
        today: parseInt(dailyStr ?? '0'),
      },
      pages: pageOwnerCounts[username] ?? 0,
    };
  }));

  return Response.json({ users, date: today });
}

// 返回单张图片的详细访问记录
export async function handleImageStats(env, imageKey) {
  if (!imageKey) return Response.json({ error: 'Missing key' }, { status: 400 });

  const statsKey = 'stats:' + imageKey;
  const data = await env.STATS.getWithMetadata(statsKey, 'json');

  if (!data?.value) {
    return Response.json({ count: 0, lastAccess: null, accesses: [], countries: {} });
  }

  const accesses = data.value;
  const countries = {};
  for (const a of accesses) {
    countries[a.country] = (countries[a.country] ?? 0) + 1;
  }

  return Response.json({
    count: data.metadata?.count ?? accesses.length,
    lastAccess: data.metadata?.lastAccess ?? null,
    countries,
    accesses: accesses.slice(0, 100), // 最多返回 100 条
  });
}
