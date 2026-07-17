// CRUD for page groups (分组) — may live within a project or independently

const NONE_KEY = '_none_';

function groupKey(owner, projectId, id) {
  return 'grp:' + owner + ':' + (projectId || NONE_KEY) + ':' + id;
}

export async function handleCreateGroup(request, env, owner, isAdmin) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const rawProjectId = body.projectId || null;
  const grpName = String(body.name ?? '').trim();
  if (!grpName || grpName.length > 64) return Response.json({ error: '分组名称必填，最长 64 字符' }, { status: 400 });

  let projectId = null;
  let grpOwner = owner;
  if (rawProjectId) {
    const proj = await findProject(env, rawProjectId, owner, isAdmin);
    if (!proj) return Response.json({ error: '项目不存在或无权限' }, { status: 404 });
    projectId = proj.id;
    grpOwner = proj.owner;
  }

  const id = 'gr_' + Array.from(crypto.getRandomValues(new Uint8Array(4))).map(b => b.toString(16).padStart(2, '0')).join('');
  const now = Date.now();

  // auto sort within same project namespace (or independent groups)
  const existing = projectId
    ? await listProjectGroups(env, grpOwner, projectId)
    : await listIndependentGroups(env, grpOwner);
  const maxSort = existing.reduce((m, g) => Math.max(m, g.sort ?? 0), -1);

  const grp = {
    id,
    projectId,
    name: grpName,
    owner: grpOwner,
    sort: maxSort + 1,
    createdAt: now,
    updatedAt: now,
  };
  await env.STATS.put(groupKey(grpOwner, projectId, id), JSON.stringify(grp));
  return Response.json(grp, { status: 201 });
}

export async function handleListGroups(request, env, owner, isAdmin) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');

  // No projectId → list all groups for owner (or all for admin)
  if (!projectId) {
    if (isAdmin) {
      const kv = await env.STATS.list({ prefix: 'grp:' });
      const groups = (await Promise.all(kv.keys.map(k => env.STATS.get(k.name, 'json')))).filter(Boolean)
        .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
      return Response.json({ groups });
    }
    const groups = await listUserGroups(env, owner);
    return Response.json({ groups });
  }

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

  // move group to another project or make independent (projectId: null)
  const wantsProjectChange = Object.prototype.hasOwnProperty.call(body, 'projectId');
  if (wantsProjectChange) {
    const newProjectId = body.projectId || null;
    const oldProjectId = grp.projectId || null;
    if (newProjectId !== oldProjectId) {
      let newOwner = grp.owner;
      if (newProjectId) {
        const newProj = await findProject(env, newProjectId, callerUsername, isAdmin);
        if (!newProj) return Response.json({ error: '目标项目不存在或无权限' }, { status: 404 });
        newOwner = newProj.owner;
      }
      // remove old KV key
      await env.STATS.delete(groupKey(grp.owner, oldProjectId, grp.id));
      grp.projectId = newProjectId;
      grp.owner = newOwner;
      // update all pages in this group
      const pageIdx = await env.STATS.get('userpages:' + grp.owner, 'json') ?? [];
      let updated = false;
      for (const p of pageIdx) {
        if (p.groupId === id) {
          p.projectId = newProjectId;
          updated = true;
          const page = await env.STATS.get('page:' + p.slug, 'json');
          if (page) {
            page.projectId = newProjectId;
            page.updatedAt = Date.now();
            await env.STATS.put('page:' + p.slug, JSON.stringify(page));
          }
        }
      }
      if (updated) await env.STATS.put('userpages:' + grp.owner, JSON.stringify(pageIdx));
    }
  }

  grp.updatedAt = Date.now();
  await env.STATS.put(groupKey(grp.owner, grp.projectId, grp.id), JSON.stringify(grp));
  return Response.json(grp);
}

export async function handleDeleteGroup(env, id, callerUsername, isAdmin) {
  const grp = await findGroupById(env, id, callerUsername, isAdmin);
  if (!grp) return Response.json({ error: '分组不存在或无权限' }, { status: 404 });

  // orphan all pages in this group (keep projectId if any, clear groupId)
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

  await env.STATS.delete(groupKey(grp.owner, grp.projectId, id));
  return Response.json({ deleted: id });
}

export async function handleReorderGroups(request, env, owner, isAdmin) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { projectId, order } = body;
  if (!Array.isArray(order)) return Response.json({ error: 'order 必填' }, { status: 400 });

  if (projectId) {
    const proj = await findProject(env, projectId, owner, isAdmin);
    if (!proj) return Response.json({ error: '项目不存在或无权限' }, { status: 404 });
    for (let i = 0; i < order.length; i++) {
      const grp = await findGroupById(env, order[i], proj.owner, isAdmin);
      if (grp && grp.projectId === proj.id) {
        grp.sort = i;
        grp.updatedAt = Date.now();
        await env.STATS.put(groupKey(grp.owner, grp.projectId, grp.id), JSON.stringify(grp));
      }
    }
  } else {
    // independent groups
    for (let i = 0; i < order.length; i++) {
      const grp = await findGroupById(env, order[i], owner, isAdmin);
      if (grp && !grp.projectId) {
        grp.sort = i;
        grp.updatedAt = Date.now();
        await env.STATS.put(groupKey(grp.owner, null, grp.id), JSON.stringify(grp));
      }
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

export async function listIndependentGroups(env, owner) {
  const prefix = 'grp:' + owner + ':' + NONE_KEY + ':';
  const kv = await env.STATS.list({ prefix });
  const groups = await Promise.all(kv.keys.map(async k => env.STATS.get(k.name, 'json')));
  return groups.filter(Boolean).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
}

/** List all groups for a user (project-bound + independent). */
export async function listUserGroups(env, owner) {
  const prefix = 'grp:' + owner + ':';
  const kv = await env.STATS.list({ prefix });
  const groups = await Promise.all(kv.keys.map(async k => env.STATS.get(k.name, 'json')));
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
