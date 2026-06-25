// CRUD for page projects (项目)

export async function handleCreateProject(request, env, owner, isAdmin) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const name = String(body.name ?? '').trim();
  if (!name || name.length > 64) return Response.json({ error: '项目名称必填，最长 64 字符' }, { status: 400 });

  const id = 'pr_' + Array.from(crypto.getRandomValues(new Uint8Array(4))).map(b => b.toString(16).padStart(2, '0')).join('');
  const now = Date.now();

  // auto sort: current max + 1
  const existing = await listUserProjects(env, owner);
  const maxSort = existing.reduce((m, p) => Math.max(m, p.sort ?? 0), -1);

  const proj = { id, name, owner, sort: maxSort + 1, createdAt: now, updatedAt: now };
  await env.STATS.put('proj:' + owner + ':' + id, JSON.stringify(proj));
  return Response.json(proj, { status: 201 });
}

export async function handleListProjects(request, env, owner, isAdmin) {
  if (isAdmin) {
    // admin: list all projects across all users
    const kv = await env.STATS.list({ prefix: 'proj:' });
    const projects = await Promise.all(kv.keys.map(async k => {
      const p = await env.STATS.get(k.name, 'json');
      return p;
    }));
    return Response.json({ projects: projects.filter(Boolean).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)) });
  }
  const projects = await listUserProjects(env, owner);
  return Response.json({ projects });
}

export async function handleUpdateProject(request, env, id, callerUsername, isAdmin) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const proj = await findProjectById(env, id, callerUsername, isAdmin);
  if (!proj) return Response.json({ error: '项目不存在或无权限' }, { status: 404 });

  if (body.name != null) {
    const name = String(body.name).trim();
    if (!name || name.length > 64) return Response.json({ error: '项目名称最长 64 字符' }, { status: 400 });
    proj.name = name;
  }
  proj.updatedAt = Date.now();
  await env.STATS.put('proj:' + proj.owner + ':' + proj.id, JSON.stringify(proj));
  return Response.json(proj);
}

export async function handleDeleteProject(env, id, callerUsername, isAdmin) {
  const proj = await findProjectById(env, id, callerUsername, isAdmin);
  if (!proj) return Response.json({ error: '项目不存在或无权限' }, { status: 404 });

  const owner = proj.owner;
  const projectId = proj.id;

  // orphan all pages in this project (set projectId/groupId to null)
  const pageIdx = await env.STATS.get('userpages:' + owner, 'json') ?? [];
  let updated = false;
  for (const p of pageIdx) {
    if (p.projectId === projectId) {
      p.projectId = null;
      p.groupId = null;
      updated = true;
      // also update the individual page record
      const page = await env.STATS.get('page:' + p.slug, 'json');
      if (page) {
        page.projectId = null;
        page.groupId = null;
        page.updatedAt = Date.now();
        await env.STATS.put('page:' + p.slug, JSON.stringify(page));
      }
    }
  }
  if (updated) await env.STATS.put('userpages:' + owner, JSON.stringify(pageIdx));

  // delete all groups under this project
  const grpPrefix = 'grp:' + owner + ':' + projectId + ':';
  const grpList = await env.STATS.list({ prefix: grpPrefix });
  await Promise.all(grpList.keys.map(k => env.STATS.delete(k.name)));

  // delete project
  await env.STATS.delete('proj:' + owner + ':' + projectId);
  return Response.json({ deleted: projectId });
}

export async function handleReorderProjects(request, env, owner, isAdmin) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { order } = body;
  if (!Array.isArray(order)) return Response.json({ error: 'order must be an array' }, { status: 400 });

  const o = isAdmin ? null : owner;
  for (let i = 0; i < order.length; i++) {
    const proj = await findProjectById(env, order[i], o ?? '', isAdmin);
    if (proj) {
      proj.sort = i;
      proj.updatedAt = Date.now();
      await env.STATS.put('proj:' + proj.owner + ':' + proj.id, JSON.stringify(proj));
    }
  }
  return Response.json({ ok: true });
}

// ── Helpers ──────────────────────────────────────────────

export async function listUserProjects(env, owner) {
  const kv = await env.STATS.list({ prefix: 'proj:' + owner + ':' });
  const projects = await Promise.all(kv.keys.map(async k => {
    const p = await env.STATS.get(k.name, 'json');
    return p;
  }));
  return projects.filter(Boolean).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
}

async function findProjectById(env, id, owner, isAdmin) {
  if (isAdmin) {
    // search across all users
    const kv = await env.STATS.list({ prefix: 'proj:' });
    for (const k of kv.keys) {
      if (k.name.endsWith(':' + id)) {
        const p = await env.STATS.get(k.name, 'json');
        if (p && p.id === id) return p;
      }
    }
    return null;
  }
  const key = 'proj:' + owner + ':' + id;
  const p = await env.STATS.get(key, 'json');
  return (p && p.owner === owner) ? p : null;
}
