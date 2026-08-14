import { getGlobalStats, reconcileGlobalStats } from './gstats.js';

// ── Cloudflare 免费额度 — CF Analytics API 优先，自追踪降级 ──────────────────────
export async function handleCfQuota(env) {
  const day        = new Date().toISOString().slice(0, 10);
  const month      = new Date().toISOString().slice(0, 7);
  const monthStart = month + '-01';

  // R2 存储始终直接扫描（实时精确，CF API 存储数据有 24h 延迟）
  const r2ScanProm = (async () => {
    let count = 0, bytes = 0, cursor;
    do {
      const r = await env.BUCKET.list({ limit: 1000, cursor });
      for (const o of r.objects) { count++; bytes += o.size; }
      cursor = r.truncated ? r.cursor : undefined;
    } while (cursor);
    return { count, bytes };
  })();

  if (env.CF_API_TOKEN && env.CF_ACCOUNT_ID) {
    // ── 精确模式：CF Analytics GraphQL API ──────────────────────────────────
    const [r2Scan, cfData] = await Promise.all([
      r2ScanProm,
      _fetchCfAnalytics(env, day, month, monthStart),
    ]);
    return Response.json({
      source: 'cf-api',
      day, month,
      workers: {
        reqToday:      cfData.workers.today,
        reqMonthTotal: cfData.workers.month,
        limit:         100000,
      },
      r2: {
        storageBytes:      r2Scan.bytes,
        storageObjects:    r2Scan.count,
        storageLimitBytes: 10 * 1073741824,
        classAMonth:       cfData.r2.classA,
        classALimit:       1000000,
        classBMonth:       cfData.r2.classB,
        classBLimit:       10000000,
      },
      kv: {
        readsMonth:       cfData.kv.reads,
        writesMonth:      cfData.kv.writes,
        listsMonth:       cfData.kv.lists,
        deletesMonth:     cfData.kv.deletes,
        readsToday:       cfData.kv.readsToday,
        writesToday:      cfData.kv.writesToday,
        listsToday:       cfData.kv.listsToday,
        deletesToday:     cfData.kv.deletesToday,
        readDailyLimit:   100000,
        writeDailyLimit:  1000,
        listDailyLimit:   1000,
        deleteDailyLimit: 1000,
        storageLimitGb:   1,
      },
    });
  }

  // ── 降级模式：自追踪计数器 + KV 全量枚举 ────────────────────────────────────
  const [r2Scan, cfCounters, kvCount] = await Promise.all([
    r2ScanProm,
    (async () => {
      const [reqVal, r2aVal, r2bVal] = await Promise.all([
        env.STATS.get(`cf:req:${day}`),
        env.STATS.get(`cf:r2a:${month}`),
        env.STATS.get(`cf:r2b:${month}`),
      ]);
      return {
        reqSampled: parseInt(reqVal  ?? '0'),
        r2aMonth:   parseInt(r2aVal ?? '0'),
        r2bMonth:   parseInt(r2bVal ?? '0'),
      };
    })(),
    (async () => {
      let total = 0, cursor;
      do {
        const list = await env.STATS.list({ limit: 1000, cursor });
        total += list.keys.length;
        cursor = list.list_complete ? undefined : list.cursor;
      } while (cursor);
      return total;
    })(),
  ]);

  return Response.json({
    source: 'self-tracked',
    day, month,
    workers: {
      reqToday:      cfCounters.reqSampled * 100,  // 1% 采样 × 100
      reqMonthTotal: null,
      limit:         100000,
    },
    r2: {
      storageBytes:      r2Scan.bytes,
      storageObjects:    r2Scan.count,
      storageLimitBytes: 10 * 1073741824,
      classAMonth:       cfCounters.r2aMonth,
      classALimit:       1000000,
      classBMonth:       cfCounters.r2bMonth,
      classBLimit:       10000000,
    },
    kv: {
      readsMonth: null, writesMonth: null, listsMonth: null, deletesMonth: null,
      readsToday: null, writesToday: null, listsToday: null, deletesToday: null,
      totalKeys:        kvCount,
      readDailyLimit:   100000,
      writeDailyLimit:  1000,
      listDailyLimit:   1000,
      deleteDailyLimit: 1000,
      storageLimitGb:   1,
    },
  });
}

// CF Analytics GraphQL 查询 ────────────────────────────────────────────────────
async function _fetchCfAnalytics(env, today, month, monthStart) {
  const acct   = env.CF_ACCOUNT_ID;
  const kvNsId = env.CF_KV_STATS_ID  ?? '';
  const bucket = env.CF_R2_BUCKET    ?? 'onimg-images';
  const script = env.CF_WORKER_NAME  ?? 'onimg';

  // R2: B-class ops (reads). Everything else is A-class.
  const R2_B = new Set([
    'GetObject','HeadObject','HeadBucket','GetBucketLocation',
    'GetBucketEncryption','GetBucketCors',
    'GetBucketLifecycleConfiguration','GetBucketPolicy',
  ]);

  const gql = async (query, vars) => {
    const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${env.CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables: vars }),
    });
    const j = await res.json();
    // CF's GraphQL API returns 200 with an `errors` array on bad queries (wrong field
    // name, bad filter, etc) — data stays null, so silently falling back below would
    // just look like "0 usage" forever. Log it so a broken query is visible in tail.
    if (j?.errors?.length) console.error('[cf-quota] GraphQL error:', JSON.stringify(j.errors));
    return j?.data?.viewer?.accounts?.[0] ?? {};
  };

  // 并发查询所有指标
  const [r2Ops, kvMonth, kvToday, wkToday, wkMonth] = await Promise.all([

    // R2 操作（本月，按 actionType 分组）
    gql(`query($a:String!,$s:Date!,$u:Date!,$b:String!){
      viewer{accounts(filter:{accountTag:$a}){
        r2OperationsAdaptiveGroups(limit:200
          filter:{date_geq:$s,date_leq:$u,bucketName:$b}){
          sum{requests} dimensions{actionType}
        }
      }}
    }`, { a: acct, s: monthStart, u: today, b: bucket }),

    // KV 操作（本月，按 actionType 分组）
    kvNsId ? gql(`query($a:String!,$s:Date!,$u:Date!,$n:String!){
      viewer{accounts(filter:{accountTag:$a}){
        kvOperationsAdaptiveGroups(limit:200
          filter:{date_geq:$s,date_leq:$u,namespaceId:$n}){
          sum{requests} dimensions{actionType}
        }
      }}
    }`, { a: acct, s: monthStart, u: today, n: kvNsId }) : {},

    // KV 操作（今日，按 actionType 分组）
    kvNsId ? gql(`query($a:String!,$s:Date!,$n:String!){
      viewer{accounts(filter:{accountTag:$a}){
        kvOperationsAdaptiveGroups(limit:200
          filter:{date_geq:$s,date_leq:$s,namespaceId:$n}){
          sum{requests} dimensions{actionType}
        }
      }}
    }`, { a: acct, s: today, n: kvNsId }) : {},

    // Workers 今日请求
    gql(`query($a:String!,$s:Date!,$sc:String!){
      viewer{accounts(filter:{accountTag:$a}){
        workersInvocationsAdaptive(limit:200
          filter:{date_geq:$s,date_leq:$s,scriptName:$sc}){
          sum{requests}
        }
      }}
    }`, { a: acct, s: today, sc: script }),

    // Workers 本月请求
    gql(`query($a:String!,$s:Date!,$u:Date!,$sc:String!){
      viewer{accounts(filter:{accountTag:$a}){
        workersInvocationsAdaptive(limit:200
          filter:{date_geq:$s,date_leq:$u,scriptName:$sc}){
          sum{requests}
        }
      }}
    }`, { a: acct, s: monthStart, u: today, sc: script }),
  ]);

  // 解析 R2 操作
  let r2ClassA = 0, r2ClassB = 0;
  for (const g of (r2Ops.r2OperationsAdaptiveGroups ?? [])) {
    const n = g.sum?.requests ?? 0;
    R2_B.has(g.dimensions?.actionType) ? (r2ClassB += n) : (r2ClassA += n);
  }

  // 解析 KV 操作（月+日）
  const _kvParse = (groups) => {
    const m = { reads: 0, writes: 0, lists: 0, deletes: 0 };
    for (const g of (groups ?? [])) {
      const n = g.sum?.requests ?? 0;
      const t = (g.dimensions?.actionType ?? '').toLowerCase();
      if      (t === 'read')   m.reads   += n;
      else if (t === 'write')  m.writes  += n;
      else if (t === 'list')   m.lists   += n;
      else if (t === 'delete') m.deletes += n;
    }
    return m;
  };
  const kvM = _kvParse(kvMonth.kvOperationsAdaptiveGroups);
  const kvD = _kvParse(kvToday.kvOperationsAdaptiveGroups);

  // 解析 Workers
  const _wkSum = (d) => (d.workersInvocationsAdaptive ?? [])
    .reduce((s, g) => s + (g.sum?.requests ?? 0), 0);

  return {
    r2:      { classA: r2ClassA, classB: r2ClassB },
    kv:      { ...kvM, readsToday: kvD.reads, writesToday: kvD.writes, listsToday: kvD.lists, deletesToday: kvD.deletes },
    workers: { today: _wkSum(wkToday), month: _wkSum(wkMonth) },
  };
}

// ─────────────────────────────────────────────────────────────────────────────

export async function handleAdminStats(env) {
  // 优先读计数缓存（O(1)）；缓存缺失时退化为全量扫描一次并播种。
  let g = await getGlobalStats(env);
  if (!g) g = await reconcileGlobalStats(env);
  return Response.json({
    totalImages: g.totalImages,
    totalSize: g.totalSize,
    cached: true,
    updatedAt: g.updatedAt,
  });
}

// 全量重算计数缓存（修正任何增量漂移）
export async function handleReconcileStats(env) {
  const g = await reconcileGlobalStats(env);
  return Response.json({
    totalImages: g.totalImages,
    totalSize: g.totalSize,
    updatedAt: g.updatedAt,
    reconciled: true,
  });
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

// 返回所有页面的访问次数（KV metadata）
export async function handleAllPageStats(env) {
  const result = { stats: {} };
  let cursor;
  do {
    const list = await env.STATS.list({ prefix: 'pstats:', cursor, limit: 1000 });
    for (const key of list.keys) {
      const slug = key.name.slice(7);
      result.stats[slug] = key.metadata ?? { count: 0, lastAccess: null };
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);
  return Response.json(result);
}

// 返回单个页面的详细访问记录
export async function handlePageStats(env, slug) {
  if (!slug) return Response.json({ error: 'Missing slug' }, { status: 400 });
  const data = await env.STATS.getWithMetadata('pstats:' + slug, 'json');
  if (!data?.value) return Response.json({ count: 0, lastAccess: null, accesses: [], countries: {}, ips: {} });
  const accesses = data.value;
  const countries = {}, ips = {};
  for (const a of accesses) {
    countries[a.country] = (countries[a.country] ?? 0) + 1;
    ips[a.ip] = (ips[a.ip] ?? 0) + 1;
  }
  return Response.json({
    count: data.metadata?.count ?? accesses.length,
    lastAccess: data.metadata?.lastAccess ?? null,
    uniqueIps: Object.keys(ips).length,
    countries,
    ips,
    accesses: accesses.slice(0, 100),
  });
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

// 返回所有原型的访问次数（KV metadata）
export async function handleAllProtoStats(env) {
  const result = { stats: {} };
  let cursor;
  do {
    const list = await env.STATS.list({ prefix: 'prstats:', cursor, limit: 1000 });
    for (const key of list.keys) {
      const protoId = key.name.slice(8); // strip 'prstats:'（8 字符，原 slice(9) 会误删 ID 首字符）
      result.stats[protoId] = key.metadata ?? { count: 0, lastAccess: null };
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);
  return Response.json(result);
}

// 返回单个原型的详细访问记录
export async function handleProtoStats(env, protoId) {
  if (!protoId) return Response.json({ error: 'Missing protoId' }, { status: 400 });
  const statsKey = 'prstats:' + protoId;
  const data = await env.STATS.getWithMetadata(statsKey, 'json');
  if (!data?.value) return Response.json({ count: 0, lastAccess: null, accesses: [], countries: {}, ips: {} });
  const accesses = Array.isArray(data.value) ? data.value : [];
  const countries = {}, ips = {};
  for (const a of accesses) {
    countries[a.country] = (countries[a.country] ?? 0) + 1;
    ips[a.ip] = (ips[a.ip] ?? 0) + 1;
  }
  return Response.json({
    count: data.metadata?.count ?? accesses.length,
    lastAccess: data.metadata?.lastAccess ?? null,
    uniqueIps: Object.keys(ips).length,
    countries,
    ips,
    accesses: accesses.slice(0, 100),
  });
}
