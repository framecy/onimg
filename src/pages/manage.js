// CRUD for hosted pages (MD / HTML)

const SLUG_RE = /^[a-zA-Z0-9_\-][a-zA-Z0-9_\-/]{0,119}$/;

export async function listPages(env, ownerFilter) {
  // prefer userpages index; fallback to legacy scan (one-time lazy migration)
  if (ownerFilter) {
    const pages = await ensureUserPagesIndex(env, ownerFilter);
    if (pages) return pages;
  }
  // legacy path or admin (no owner filter)
  const list = await env.STATS.list({ prefix: 'page:' });
  const pages = await Promise.all(
    list.keys.map(async k => {
      const p = await env.STATS.get(k.name, 'json');
      return p ? {
        slug: k.name.slice(5),
        title: p.title,
        type: p.type,
        content: p.content,
        owner: p.owner,
        isPublic: p.isPublic,
        accessPassword: p.accessPassword,
        projectId: p.projectId ?? null,
        groupId: p.groupId ?? null,
        sort: p.sort ?? 0,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        contentLength: p.content?.length ?? 0,
      } : null;
    })
  );
  const all = pages.filter(Boolean);
  return ownerFilter ? all.filter(p => p.owner === ownerFilter) : all;
}

export async function handleListPages(request, env, ownerFilter) {
  const pages = await listPages(env, ownerFilter);

  // resolve projects & groups for tree data
  let projects = [], groups = [];
  if (ownerFilter) {
    const { listUserProjects } = await import('./project.js');
    const { listProjectGroups } = await import('./group.js');
    projects = await listUserProjects(env, ownerFilter);
    const projIds = [...new Set(pages.map(p => p.projectId).filter(Boolean))];
    for (const pid of projIds) {
      const grps = await listProjectGroups(env, ownerFilter, pid);
      groups.push(...grps);
    }
  } else {
    // admin: list all projects & groups
    const projKv = await env.STATS.list({ prefix: 'proj:' });
    const grpKv = await env.STATS.list({ prefix: 'grp:' });
    projects = (await Promise.all(projKv.keys.map(k => env.STATS.get(k.name, 'json')))).filter(Boolean).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
    groups = (await Promise.all(grpKv.keys.map(k => env.STATS.get(k.name, 'json')))).filter(Boolean).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  }

  return Response.json({ pages, projects, groups });
}

export async function handleCreatePage(request, env, owner) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { slug, title, content, type, isPublic, accessPassword, projectId, groupId } = body;
  if (!slug || !SLUG_RE.test(slug)) {
    return Response.json({ error: 'Invalid slug. Use letters, numbers, - _ / (max 120 chars)' }, { status: 400 });
  }
  if (!content) return Response.json({ error: 'content is required' }, { status: 400 });
  if (!['markdown', 'html'].includes(type)) return Response.json({ error: 'type must be markdown or html' }, { status: 400 });

  const key = 'page:' + slug;
  const existing = await env.STATS.get(key, 'json');
  if (existing) {
    const msg = existing.owner === owner
      ? 'Slug already exists. Use the edit function to update it.'
      : 'Slug already taken by another user';
    return Response.json({ error: msg }, { status: 409 });
  }

  // validate projectId/groupId ownership (skip for admin — handled by caller)
  if (projectId) {
    const proj = await env.STATS.get('proj:' + owner + ':' + projectId, 'json');
    if (!proj || proj.owner !== owner) return Response.json({ error: '项目不存在或无权限' }, { status: 400 });
  }
  if (groupId) {
    const grpKv = await env.STATS.list({ prefix: 'grp:' + owner + ':' + (projectId ?? '') + ':' });
    let found = false;
    for (const k of grpKv.keys) {
      if (k.name.endsWith(':' + groupId)) {
        const g = await env.STATS.get(k.name, 'json');
        if (g && g.id === groupId && g.owner === owner) { found = true; break; }
      }
    }
    if (!found) return Response.json({ error: '分组不存在或无权限' }, { status: 400 });
  }

  const pub = isPublic !== false;
  const now = Date.now();

  // auto sort within group (or project root, or ungrouped)
  const pageIdx = await env.STATS.get('userpages:' + owner, 'json') ?? [];
  const siblings = pageIdx.filter(p =>
    (groupId ? p.groupId === groupId : (projectId ? p.projectId === projectId && !p.groupId : !p.projectId))
  );
  const maxSort = siblings.reduce((m, p) => Math.max(m, p.sort ?? 0), -1);

  const page = {
    slug, title: title || slug, content, type,
    isPublic: pub, owner,
    projectId: projectId ?? null,
    groupId: groupId ?? null,
    sort: maxSort + 1,
    createdAt: now, updatedAt: now,
  };
  if (!pub && accessPassword) {
    page.accessPassword = String(accessPassword).replace(/[^A-Za-z0-9]/g, '').slice(0, 6) || undefined;
  }

  await env.STATS.put(key, JSON.stringify(page));

  // update userpages index
  pageIdx.unshift({
    slug, title: page.title, type, isPublic: pub,
    owner, projectId: page.projectId, groupId: page.groupId,
    sort: page.sort, contentLength: content.length,
    createdAt: now, updatedAt: now,
  });
  await env.STATS.put('userpages:' + owner, JSON.stringify(pageIdx));

  return Response.json({ slug, title: page.title, type, isPublic: page.isPublic, projectId: page.projectId, groupId: page.groupId, sort: page.sort }, { status: 201 });
}

export async function handleUpdatePage(request, env, slug, callerUsername, isAdmin) {
  const page = await env.STATS.get('page:' + slug, 'json');
  if (!page) return Response.json({ error: 'Page not found' }, { status: 404 });
  if (!isAdmin && page.owner !== callerUsername) return Response.json({ error: 'Forbidden' }, { status: 403 });

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (body.title    != null) page.title    = body.title;
  if (body.content  != null) page.content  = body.content;
  if (body.type     != null) page.type     = body.type;
  if (body.isPublic != null) page.isPublic = !!body.isPublic;
  if (body.accessPassword !== undefined) {
    page.accessPassword = body.accessPassword
      ? String(body.accessPassword).replace(/[^A-Za-z0-9]/g, '').slice(0, 6) || undefined
      : undefined;
  }
  // project/group reassignment
  if (body.projectId !== undefined) page.projectId = body.projectId ?? null;
  if (body.groupId   !== undefined) page.groupId   = body.groupId ?? null;
  if (body.sort      !== undefined) page.sort      = body.sort;
  page.updatedAt = Date.now();

  await env.STATS.put('page:' + slug, JSON.stringify(page));

  // update userpages index
  const owner = page.owner;
  const pageIdx = await env.STATS.get('userpages:' + owner, 'json') ?? [];
  const idx = pageIdx.findIndex(p => p.slug === slug);
  if (idx !== -1) {
    pageIdx[idx].title = page.title;
    pageIdx[idx].type = page.type;
    pageIdx[idx].isPublic = page.isPublic;
    pageIdx[idx].projectId = page.projectId;
    pageIdx[idx].groupId = page.groupId;
    pageIdx[idx].sort = page.sort;
    pageIdx[idx].updatedAt = page.updatedAt;
    pageIdx[idx].contentLength = page.content?.length ?? 0;
    await env.STATS.put('userpages:' + owner, JSON.stringify(pageIdx));
  }

  return Response.json({ slug, title: page.title, isPublic: page.isPublic, projectId: page.projectId, groupId: page.groupId, sort: page.sort });
}

export async function handleDeletePage(env, slug, callerUsername, isAdmin) {
  const page = await env.STATS.get('page:' + slug, 'json');
  if (!page) return Response.json({ error: 'Page not found' }, { status: 404 });
  if (!isAdmin && page.owner !== callerUsername) return Response.json({ error: 'Forbidden' }, { status: 403 });

  await env.STATS.delete('page:' + slug);

  // remove from userpages index
  const owner = page.owner;
  const pageIdx = await env.STATS.get('userpages:' + owner, 'json') ?? [];
  const newIdx = pageIdx.filter(p => p.slug !== slug);
  if (newIdx.length !== pageIdx.length) {
    await env.STATS.put('userpages:' + owner, JSON.stringify(newIdx));
  }

  return Response.json({ deleted: slug });
}

export async function handleReorderPages(request, env, callerUsername, isAdmin) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { groupId, order } = body;
  if (!Array.isArray(order)) return Response.json({ error: 'order must be an array' }, { status: 400 });

  for (let i = 0; i < order.length; i++) {
    const page = await env.STATS.get('page:' + order[i], 'json');
    if (!page) continue;
    if (!isAdmin && page.owner !== callerUsername) continue;
    // only reorder pages in the same group
    if (groupId ? page.groupId !== groupId : page.groupId != null) continue;
    page.sort = i;
    page.updatedAt = Date.now();
    await env.STATS.put('page:' + order[i], JSON.stringify(page));
  }

  // refresh userpages index for the owner
  const owner = isAdmin ? null : callerUsername;
  if (owner) {
    const pageIdx = await env.STATS.get('userpages:' + owner, 'json') ?? [];
    for (const slug of order) {
      const idx = pageIdx.findIndex(p => p.slug === slug);
      if (idx !== -1) pageIdx[idx].sort = order.indexOf(slug);
    }
    await env.STATS.put('userpages:' + owner, JSON.stringify(pageIdx));
  }

  return Response.json({ ok: true });
}

export async function handleImportPage(request, env, owner) {
  let formData;
  try { formData = await request.formData(); } catch { return Response.json({ error: 'Invalid form data' }, { status: 400 }); }

  const file = formData.get('file');
  if (!file || typeof file === 'string') return Response.json({ error: '请上传 .md 文件' }, { status: 400 });

  const text = await file.text();
  const { metadata, content } = parseFrontmatter(text);

  // explicit form fields override frontmatter
  const slug = (formData.get('slug')?.trim()) || metadata.slug || generateSlugFromFile(file.name);
  const title = (formData.get('title')?.trim()) || metadata.title || slug;
  const type = formData.get('type') || metadata.type || 'markdown';
  const isPublic = formData.has('isPublic') ? formData.get('isPublic') === 'true' : (metadata.isPublic !== false);
  const projectId = formData.get('projectId') || metadata.projectId || null;
  const groupId = formData.get('groupId') || metadata.groupId || null;

  const body = { slug, title, content, type, isPublic, projectId, groupId };

  // reuse create handler logic
  return handleCreatePage({ json: async () => body }, env, owner);
}

// ── Helpers ──────────────────────────────────────────────

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { metadata: {}, content: text };
  const yaml = match[1];
  const content = text.slice(match[0].length);
  const metadata = {};
  for (const line of yaml.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim();
    if (key === 'isPublic') metadata[key] = val === 'true';
    else if (key === 'projectId' || key === 'groupId') metadata[key] = val || null;
    else metadata[key] = val;
  }
  return { metadata, content };
}

function generateSlugFromFile(filename) {
  return filename
    .replace(/\.(md|markdown)$/i, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || 'imported-' + Date.now();
}

async function ensureUserPagesIndex(env, owner) {
  const key = 'userpages:' + owner;
  const existing = await env.STATS.get(key, 'json');
  if (existing) return existing;

  // one-time lazy build from page: prefix scan
  const list = await env.STATS.list({ prefix: 'page:' });
  const pages = [];
  for (const k of list.keys) {
    const p = await env.STATS.get(k.name, 'json');
    if (p && p.owner === owner) {
      pages.push({
        slug: k.name.slice(5), title: p.title, type: p.type,
        isPublic: p.isPublic, owner: p.owner,
        projectId: p.projectId ?? null, groupId: p.groupId ?? null,
        sort: p.sort ?? 0, contentLength: p.content?.length ?? 0,
        createdAt: p.createdAt, updatedAt: p.updatedAt,
      });
    }
  }
  await env.STATS.put(key, JSON.stringify(pages));
  return pages;
}
