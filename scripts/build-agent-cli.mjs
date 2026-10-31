// 把 scripts/onimg-agent.py 打成字符串常量 src/agent-cli.generated.js。
// 为什么走构建而不是直接把 Python 塞进模板字符串：Python 里的反斜杠
// （正则、转义、\\n）在 JS 模板字面量里会被吃掉，历史上已经踩过一次。
// 生成产物由 /scripts/onimg-agent.py 路由直接吐给用户。
import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync(new URL('../scripts/onimg-agent.py', import.meta.url), 'utf8');
const out = `// 自动生成 —— 勿手改。源码：scripts/onimg-agent.py；重新生成：npm run build:agent
export const ONIMG_AGENT_PY = ${JSON.stringify(src)};
`;
writeFileSync(new URL('../src/agent-cli.generated.js', import.meta.url), out);
console.log('src/agent-cli.generated.js 已生成，', out.length, 'bytes');
