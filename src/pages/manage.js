// CRUD for hosted pages (MD / HTML)

const SLUG_RE = /^[a-zA-Z0-9_\-][a-zA-Z0-9_\-/]{0,119}$/;

export async function listPages(env, ownerFilter) {
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
  return Response.json({ pages: await listPages(env, ownerFilter) });
}

export async function handleCreatePage(request, env, owner) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { slug, title, content, type, isPublic } = body;
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

  const page = {
    slug, title: title || slug, content, type,
    isPublic: isPublic !== false,
    owner, createdAt: Date.now(), updatedAt: Date.now(),
  };
  await env.STATS.put(key, JSON.stringify(page));
  return Response.json({ slug, title: page.title, type, isPublic: page.isPublic }, { status: 201 });
}

export async function handleUpdatePage(request, env, slug, callerUsername, isAdmin) {
  const page = await env.STATS.get('page:' + slug, 'json');
  if (!page) return Response.json({ error: 'Page not found' }, { status: 404 });
  if (!isAdmin && page.owner !== callerUsername) return Response.json({ error: 'Forbidden' }, { status: 403 });

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (body.title   != null) page.title   = body.title;
  if (body.content != null) page.content = body.content;
  if (body.type    != null) page.type    = body.type;
  if (body.isPublic != null) page.isPublic = !!body.isPublic;
  page.updatedAt = Date.now();

  await env.STATS.put('page:' + slug, JSON.stringify(page));
  return Response.json({ slug, title: page.title, isPublic: page.isPublic });
}

export async function handleDeletePage(env, slug, callerUsername, isAdmin) {
  const page = await env.STATS.get('page:' + slug, 'json');
  if (!page) return Response.json({ error: 'Page not found' }, { status: 404 });
  if (!isAdmin && page.owner !== callerUsername) return Response.json({ error: 'Forbidden' }, { status: 403 });

  await env.STATS.delete('page:' + slug);
  return Response.json({ deleted: slug });
}
