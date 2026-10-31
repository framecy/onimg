// Agent / API 访问权限（Skill 用）。
//
// 设计取舍：
//   · 权限存在 user.permissions 里，而 verifyUserToken 每次都读用户记录，
//     所以改权限**立即生效**，不用等旧 token 过期、也不用重新签发。
//   · 三级：off（完全关闭）/ read（只读）/ write（读写上限）。
//   · 缺省视为 'write' —— 本功能上线前所有用户都没有这个字段，
//     缺省 write 才能保证他们的 Typora / CLI 上传不被打断。
//     要收紧时由管理员逐个改，而不是上线瞬间批量断掉。

export const API_ACCESS_LEVELS = ['off', 'read', 'write'];

/** 规范化 permissions.apiAccess，非法值一律按 write（向后兼容）。 */
export function apiAccessOf(permissions) {
  const v = permissions?.apiAccess;
  return API_ACCESS_LEVELS.includes(v) ? v : 'write';
}

/** 该账号是否允许通过 Agent / API 读取（off 时连索引和私有原型都不给）。 */
export function canUseAgent(user) {
  return apiAccessOf(user?.permissions) !== 'off';
}

/** 该账号是否有写上限（write 才算有；read/off 都算只读）。 */
export function canWriteViaAgent(user) {
  return apiAccessOf(user?.permissions) === 'write';
}

/**
 * 只读判定：token 自身声明了 scope=read，或账号上限是 read，都算只读。
 * 两个来源要同时看 —— 账号上限是管理员定的天花板，token scope 是
 * 这次授权自己申请的额度，取更严的那个。
 */
export function isReadOnly(user) {
  return user?.scope === 'read' || apiAccessOf(user?.permissions) === 'read';
}

export function agentDenied(message = '该账号未开放 Agent 访问') {
  return Response.json({ error: message, code: 'agent_access_denied' }, { status: 403 });
}
