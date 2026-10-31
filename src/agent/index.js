import { readImageIndex } from '../admin/image-index.js';
import { listPages } from '../pages/manage.js';
import { listUserProjects } from '../pages/project.js';
import { listUserGroups } from '../pages/group.js';
import { listProtos } from '../proto/manage.js';
import { getUserQuotaInfo } from '../user-auth.js';
import { apiAccessOf, canUseAgent, isReadOnly } from '../agent-access.js';

// GET /api/index —— Agent(Skill) 的检索入口。
//
// 一次调用返回「这个账号下有什么」的完整索引：目录（项目/分组）、页面、
// 图片、原型（含版本列表）。文件正文不在这里，按下述 url 逐个取。
//
// 为什么不复用 /list 和 /api/protos：
//   · /list 对普通用户走清单补全，超过 200 张时部分条目**没有文件名**
//     （见 src/list.js 的 EXPAND_LIMIT），拿来做检索会静默漏字段；
//   · 原型/页面/项目/分组分散在四个接口，Agent 每步都要拼路径、判空、处理
//     各自的错误格式，错一次就是静默丢数据。
//
// 刻意不返回的字段：
//   · 页面正文（可能很大，检索不需要；要正文走 GET /api/pages/:slug）
//   · 任何密码（accessPassword）：只给 hasPassword 布尔值
//   · 访问统计：统计类数据仅管理员可见（产品决定）
export async function handleAgentIndex(request, env, user) {
  if (!canUseAgent(user)) {
    return Response.json({ error: '该账号未开放 Agent 访问', code: 'agent_access_denied' }, { status: 403 });
  }

  const origin = new URL(request.url).origin;
  const [projects, groups, pages, protos, quota, imageIdx] = await Promise.all([
    listUserProjects(env, user.username),
    listUserGroups(env, user.username),
    listPages(env, user.username),
    listProtos(env, user.username, false),
    getUserQuotaInfo(env, user.username),
    readImageIndex(env),
  ]);

  const mine = imageIdx.items.filter(it => it.owner === user.username && !it.deletedAt);

  // KV 回退路径（没绑 D1）下 list 只带 key + metadata，取不到 value 里的
  // 文件名 / 体积。检索靠的就是文件名，所以这里按 key 补前 40 条，
  // 与 readImageNames 的子请求预算一致；超出预算的条目保留 key 兜底。
  let degradedNames = false;
  if (imageIdx.degraded && mine.length) {
    const budget = mine.slice(0, 40);
    for (let i = 0; i < budget.length; i += 10) {
      await Promise.all(budget.slice(i, i + 10).map(async it => {
        const v = await env.STATS.get('imgmeta:' + it.key, 'json').catch(() => null);
        if (!v) return;
        it.name = v.name || v.basename || it.name;
        it.size = Number(v.size) || it.size;
        it.uploadedAt = Number(v.uploadedAt) || it.uploadedAt;
      }));
    }
    degradedNames = mine.length > budget.length;
  }

  const images = mine.map(it => ({
    key: it.key,
    name: it.name ?? null,
    size: it.size,
    isPublic: it.isPublic,
    tags: it.tags,
    uploadedAt: it.uploadedAt,
    url: origin + '/' + it.key,
  }));

  return Response.json({
    account: {
      username: user.username,
      isAdmin: !!user.isAdmin,
      apiAccess: apiAccessOf(user.permissions),
      readOnly: isReadOnly(user),
      permissions: user.permissions ?? null,
      quota,
    },
    generatedAt: Date.now(),
    counts: {
      projects: projects.length,
      groups: groups.length,
      pages: pages.length,
      images: images.length,
      protos: protos.length,
      protoVersions: protos.reduce((n, p) => n + (p.versions?.length ?? 1), 0),
    },
    imageIndexSource: imageIdx.source,
    // true = 图片名只补了前 40 条（无 D1 的 KV 回退路径），其余按 key 兜底
    degradedImageNames: degradedNames,
    projects: projects.map(p => ({ id: p.id, name: p.name, sort: p.sort ?? 0, createdAt: p.createdAt ?? null })),
    groups: groups.map(g => ({ id: g.id, projectId: g.projectId ?? null, name: g.name, sort: g.sort ?? 0 })),
    pages: pages.map(p => ({
      slug: p.slug,
      title: p.title,
      type: p.type,
      projectId: p.projectId ?? null,
      groupId: p.groupId ?? null,
      isPublic: !!p.isPublic,
      hasPassword: !!p.accessPassword,
      contentLength: p.content?.length ?? p.contentLength ?? 0,
      createdAt: p.createdAt ?? null,
      updatedAt: p.updatedAt ?? null,
      url: origin + '/p/' + encodeURIComponent(p.slug),
    })),
    images,
    protos: protos.map(p => ({
      protoId: p.protoId,
      title: p.title,
      entryPoint: p.entryPoint,
      version: p.version ?? 1,
      versions: p.versions ?? [],
      fileCount: p.fileCount ?? 0,
      totalSize: p.totalSize ?? 0,
      isPrivate: !!p.isPrivate,
      hasPassword: !!p.hasPassword,
      tags: p.tags ?? [],
      createdAt: p.createdAt ?? null,
      updatedAt: p.updatedAt ?? null,
      url: origin + '/proto/' + encodeURIComponent(p.protoId) + '/',
    })),
  });
}
