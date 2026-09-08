// userimgs:{username} 列表的并发安全更新助手。
//
// 背景：该列表是单个 KV JSON 数组，此前 6 处（上传 trackImage、公开切换、
// 标签、软删除、恢复、彻底删除）都在做「读 → 改 → 写」的裸更新。KV 没有
// 原子性，并发写入时后写者覆盖先写者（last-writer-wins）——批量并发上传
// 会丢列表条目、公开标记被回写覆盖。浏览器端上传改为并发后此问题必现。
//
// 方案：合并式更新 + 写后校验 + 有界重试。每次尝试都基于「最新读到的
// 列表」做合并（天然收敛），写完回读校验，未生效则带着最新状态再合并，
// 最多 tries 次。KV 同机房读己之写有保证，回读校验可靠；跨机房最终一致
// 场景下重试同样收敛（合并是幂等的）。
//
// patch 语义：值为 null/undefined 的字段会被从条目上删除（用于恢复时清
// deletedAt）；ensure=true 且条目不存在时以 patch 新建最小条目。

/**
 * @param {object} env  Workers env（STATS KV 绑定）
 * @param {string} username
 * @param {string} key  图片 key
 * @param {object} patch 要合并的字段（null 值删除该字段）
 * @param {object} opts  ensure: 条目缺失时是否新建（默认 false）；
 *                       remove: true 表示从列表移除该条目（patch 忽略）；
 *                       tries: 最大尝试次数（默认 6）
 * @returns {Promise<boolean>} 是否确认生效
 */
export async function mergeUserImgEntry(env, username, key, patch = {}, opts = {}) {
  const imgsKv = 'userimgs:' + username;
  const ensure = opts.ensure ?? false;
  const remove = opts.remove ?? false;
  const tries  = opts.tries ?? 6;

  const matchesPatch = (entry) => {
    if (!entry) return false;
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === undefined) { if (entry[k] !== undefined) return false; }
      else if (entry[k] !== v) return false;
    }
    return true;
  };

  for (let attempt = 0; attempt < tries; attempt++) {
    const list = await env.STATS.get(imgsKv, 'json') ?? [];

    let next;
    if (remove) {
      next = list.filter(e => e.key !== key);
    } else {
      const idx = list.findIndex(e => e.key === key);
      if (idx === -1) {
        if (!ensure) {
          // 条目不存在且不新建：无 op，直接视为成功（与旧行为一致）
          return true;
        }
        next = [{ key, uploadedAt: patch.uploadedAt ?? 0, ...patch }, ...list];
      } else {
        next = list.map((e, j) => {
          if (j !== idx) return e;
          const merged = { ...e, ...patch };
          for (const k of Object.keys(patch)) {
            if (patch[k] === null || patch[k] === undefined) delete merged[k];
          }
          return merged;
        });
      }
      // 防御性去重：修复历史上可能已产生的重复条目
      const seen = new Set();
      next = next.filter(e => (seen.has(e.key) ? false : (seen.add(e.key), true)));
    }

    await env.STATS.put(imgsKv, JSON.stringify(next));

    // 写后校验：确认本次 patch 在最新状态上生效；未生效则用最新状态重试
    const after = await env.STATS.get(imgsKv, 'json') ?? [];
    const mine = after.find(e => e.key === key);
    if (remove ? !mine : matchesPatch(mine)) return true;

    await new Promise(r => setTimeout(r, 25 * (attempt + 1)));
  }
  return false;
}
