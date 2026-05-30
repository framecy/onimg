/**
 * 全局图片计数缓存
 *
 * 目的：后台「概览」统计原本每次都全量 list() 扫描整个 R2 桶（每 1000 个对象一次
 * Class A 调用），对象越多越慢——这是后台加载比前台慢的主因之一。
 *
 * 方案：用一个 KV key 缓存累计计数，上传 +1/+size、删除 -1/-size 增量维护（best-effort，
 * 通过 ctx.waitUntil 非阻塞）。后台读取时 O(1) 直接取缓存；缓存缺失（冷启动/未播种）
 * 时退化为全量扫描一次并播种。提供 reconcile 全量重算以修正任何漂移。
 *
 * 注意：KV 无原子 CAS，高并发下增量可能有极少量漂移（与 cfCounters 同样的权衡）。
 * 个人图床并发极低，可接受；任何漂移都可通过 reconcile 一键修正。
 *
 * 计数口径：仅统计图片对象，排除 `proto/` 前缀（与原 handleAdminStats 一致）。
 */

const GKEY = 'gstats:v1';

/** 读取缓存，未播种返回 null */
export async function getGlobalStats(env) {
  const v = await env.STATS.get(GKEY, 'json');
  return v && typeof v.totalImages === 'number' ? v : null;
}

/**
 * 增量更新缓存（best-effort，失败静默，不影响主业务）。
 * 未播种时跳过——待 reconcile 全量播种后再开始增量，避免基于不完整基数累加。
 */
export async function bumpGlobalStats(env, dImages, dSize) {
  try {
    const cur = await getGlobalStats(env);
    if (!cur) return; // 未播种，跳过
    const next = {
      totalImages: Math.max(0, cur.totalImages + dImages),
      totalSize:   Math.max(0, cur.totalSize + dSize),
      updatedAt: Date.now(),
      seeded: true,
    };
    await env.STATS.put(GKEY, JSON.stringify(next));
  } catch { /* best-effort，静默忽略 */ }
}

/** 全量扫描 R2 重算并写入缓存，返回最新值 */
export async function reconcileGlobalStats(env) {
  let totalImages = 0, totalSize = 0, cursor;
  do {
    const r = await env.BUCKET.list({ limit: 1000, cursor });
    for (const o of r.objects) {
      if (o.key.startsWith('proto/') || o.key.startsWith('manifests/')) continue; // 排除原型文件与增量清单
      totalImages++;
      totalSize += o.size;
    }
    cursor = r.truncated ? r.cursor : undefined;
  } while (cursor);
  const val = { totalImages, totalSize, updatedAt: Date.now(), seeded: true };
  await env.STATS.put(GKEY, JSON.stringify(val));
  return val;
}
