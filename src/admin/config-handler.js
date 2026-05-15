const CONFIG_KEY = 'config:upload';

export async function getUploadConfig(env) {
  const stored = await env.STATS.get(CONFIG_KEY, 'json');
  return {
    maxFileSize: stored?.maxFileSize ?? parseInt(env.MAX_FILE_SIZE ?? '10485760'),
    allowedTypes: stored?.allowedTypes ?? (env.ALLOWED_TYPES ?? 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml'),
  };
}

export async function handleGetConfig(env) {
  return Response.json(await getUploadConfig(env));
}

export async function handleUpdateConfig(request, env) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const current = await getUploadConfig(env);
  const updated = {
    maxFileSize: body.maxFileSize != null ? parseInt(body.maxFileSize) : current.maxFileSize,
    allowedTypes: body.allowedTypes != null ? body.allowedTypes : current.allowedTypes,
  };

  if (isNaN(updated.maxFileSize) || updated.maxFileSize < 1024) {
    return Response.json({ error: 'Invalid maxFileSize' }, { status: 400 });
  }
  if (!updated.allowedTypes) {
    return Response.json({ error: 'allowedTypes cannot be empty' }, { status: 400 });
  }

  await env.STATS.put(CONFIG_KEY, JSON.stringify(updated));
  return Response.json(updated);
}
