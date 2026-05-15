import { verifyAdminToken } from './admin/auth.js';
import { verifyUserToken } from './user-auth.js';

export async function handleDelete(request, env, key) {
  const isAdmin = await verifyAdminToken(request, env);
  let username = null;

  if (!isAdmin) {
    const user = await verifyUserToken(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!user.permissions.canDelete) return Response.json({ error: 'Delete permission denied' }, { status: 403 });
    username = user.username;
  }

  if (!key) return Response.json({ error: 'Missing key' }, { status: 400 });

  const object = await env.BUCKET.head(key);
  if (!object) return Response.json({ error: 'Image not found' }, { status: 404 });

  await env.BUCKET.delete(key);

  // Clean up KV metadata
  const owner = object.customMetadata?.uploadedBy ?? username;
  await Promise.all([
    env.STATS.delete('imgmeta:' + key),
    owner ? removeFromUserList(env, owner, key) : Promise.resolve(),
  ]);

  return Response.json({ deleted: key });
}

async function removeFromUserList(env, username, key) {
  const imgsKv = 'userimgs:' + username;
  const list = await env.STATS.get(imgsKv, 'json') ?? [];
  const updated = list.filter(e => e.key !== key);
  if (updated.length !== list.length) {
    await env.STATS.put(imgsKv, JSON.stringify(updated));
  }
}
