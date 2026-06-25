// CRUD for page groups (分组) — lives within a project

export async function handleCreateGroup(request, env, owner, isAdmin) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { projectId, name } = body;
  if (!projectId) return Response.json({ error: 'projectId 必填' }, { status: 400 });
  const grpName = String(name ?? '').trim();
  if (!grpName || grpName.length > 64) return Response.json({ error: '分组名称必填，最长 64 字符' }, { status: 400 });

  // verify project exists & ownership
  const proj = await findProject(env, projectId, owner, isAdmin);
  if (!proj) return Response.json({ error: '项目不存在或无权限' }, { status: 404 });

  const id = 'gr_' + Array.from(crypto.getRandomValues(new Uint8Array(4))).map(b => b.toString(16).padStart(2, '0')).join('');
  const now = Date.now();

  // auto sort within project
  const existing = await listProjectGroups(env, proj.owner, projectId);
  const maxSort = existing.reduce((m, g) => Math.max(m, g.sort ?? 0), -1);

  const grp = { id, projectId: proj.id, name: grpName, owner: proj.owner, sort: maxSort + 1, createdAt: now, updatedAt: now };
  await env.STATS.put('grp:' + proj.owner + ':' + proj.id + ':' + id, JSON.stringify(grp));
  return Response.json(grp, { status: 201 });
}

export async function handleListGroups(request, env, owner, isAdmin) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');
  if (!projectId) return Response.json({ error: 'projectId 参数必填' }, { status: 400 });

  const proj = await findProject(env, projectId, owner, isAdmin);
  if (!proj) return Response.json({ error: '项目不存在或无权限' }, { status: 404 });

  const groups = await listProjectGroups(env, proj.owner, proj.id);
  return Response.json({ groups });
}

export async function handleUpdateGroup(request, env, id, callerUsername, isAdmin) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const grp = await findGroupById(env, id, callerUsername, isAdmin);
  if (!grp) return Response.json({ error: '分组不存在或无权限' }, { status: 404 });

  if (body.name != null) {
    const name = String(body.name).trim();
    if (!name || name.length > 64) return Response.json({ error: '分组名称最长 64 字符' }, { status: 400 });
    grp.name = name;
  }

  // move group to another project
  if (body.projectId != null && body.projectId !== grp.projectId) {
    const newProj = await findProject(env, body.projectId, callerUsername, isAdmin);
    if (!newProj) return Response.json({ error: '目标项目不存在或无权限' }, { status: 404 });
    // remove old KV key
    await env.STATS.delete('grp:' + grp.owner + ':' + grp.projectId + ':' + grp.id);
    grp.projectId = newProj.id;
    grp.owner = newProj.owner;
    // update all pages in this group
    const pageIdx = await env.STATS.get('userpages:' + grp.owner, 'json') ?? [];
    for (const p of pageIdx) {
      if (p.groupId === id) {
        p.projectId = newProj.id;
        const page = await env.STATS.get('page:' + p.slug, 'json');
        if (page) {
          page.projectId = newProj.id;
          page.updatedAt = Date.now();
          await env.STATS.put('page:' + p.slug, JSON.stringify(page));
        }
      }
    }
    if (pageIdx.some(p => p.groupId === id)) await env.STATS.put('userpages:' + grp.owner, JSON.stringify(pageIdx));
  }

  grp.updatedAt = Date.now();
  await env.STATS.put('grp:' + grp.owner + ':' + grp.projectId + ':' + grp.id, JSON.stringify(grp));
  return Response.json(grp);
}

export async function handleDeleteGroup(env, id, callerUsername, isAdmin) {
  const grp = await findGroupById(env, id, callerUsername, isAdmin);
  if (!grp) return Response.json({ error: '分组不存在或无权限' }, { status: 404 });

  // orphan all pages in this group (keep projectId, clear groupId)
  const pageIdx = await env.STATS.get('userpages:' + grp.owner, 'json') ?? [];
  let updated = false;
  for (const p of pageIdx) {
    if (p.groupId === id) {
      p.groupId = null;
      updated = true;
      const page = await env.STATS.get('page:' + p.slug, 'json');
      if (page) {
        page.groupId = null;
        page.updatedAt = Date.now();
        await env.STATS.put('page:' + p.slug, JSON.stringify(page));
      }
    }
  }
  if (updated) await env.STATS.put('userpages:' + grp.owner, JSON.stringify(pageIdx));

  await env.STATS.delete('grp:' + grp.owner + ':' + grp.projectId + ':' + id);
  return Response.json({ deleted: id });
}

export async function handleReorderGroups(request, env, owner, isAdmin) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { projectId, order } = body;
  if (!projectId || !Array.isArray(order)) return Response.json({ error: 'projectId 和 order 必填' }, { status: 400 });

  const proj = await findProject(env, projectId, owner, isAdmin);
  if (!proj) return Response.json({ error: '项目不存在或无权限' }, { status: 404 });

  for (let i = 0; i < order.length; i++) {
    const grp = await findGroupById(env, order[i], proj.owner, isAdmin);
    if (grp && grp.projectId === proj.id) {
      grp.sort = i;
      grp.updatedAt = Date.now();
      await env.STATS.put('grp:' + grp.owner + ':' + grp.projectId + ':' + grp.id, JSON.stringify(grp));
    }
  }
  return Response.json({ ok: true });
}

// ── Helpers ──────────────────────────────────────────────

export async function listProjectGroups(env, owner, projectId) {
  const prefix = 'grp:' + owner + ':' + projectId + ':';
  const kv = await env.STATS.list({ prefix });
  const groups = await Promise.all(kv.keys.map(async k => {
    const g = await env.STATS.get(k.name, 'json');
    return g;
  }));
  return groups.filter(Boolean).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
}

async function findProject(env, projectId, owner, isAdmin) {
  if (isAdmin) {
    const kv = await env.STATS.list({ prefix: 'proj:' });
    for (const k of kv.keys) {
      if (k.name.endsWith(':' + projectId)) {
        const p = await env.STATS.get(k.name, 'json');
        if (p && p.id === projectId) return p;
      }
    }
    return null;
  }
  const key = 'proj:' + owner + ':' + projectId;
  const p = await env.STATS.get(key, 'json');
  return (p && p.owner === owner) ? p : null;
}

async function findGroupById(env, id, owner, isAdmin) {
  if (isAdmin) {
    const kv = await env.STATS.list({ prefix: 'grp:' });
    for (const k of kv.keys) {
      if (k.name.endsWith(':' + id)) {
        const g = await env.STATS.get(k.name, 'json');
        if (g && g.id === id) return g;
      }
    }
    return null;
  }
  const kv = await env.STATS.list({ prefix: 'grp:' + owner + ':' });
  for (const k of kv.keys) {
    if (k.name.endsWith(':' + id)) {
      const g = await env.STATS.get(k.name, 'json');
      if (g && g.id === id && g.owner === owner) return g;
    }
  }
  return null;
}
