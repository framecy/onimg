import { marked } from 'marked';

// Slug logic must stay in sync between renderMarkdown and extractHeadings.
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w一-鿿\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim() || 'heading';
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Module-level state reset before each parse (marked.parse is synchronous).
let _usedIds = {};

const ALERT_LABELS = {
  note: '注意', tip: '提示', important: '重要', warning: '警告', caution: '当心',
};

// $$...$$ / $...$ 交给前端 KaTeX 渲染，服务端只做标记与转义
const mathExtensions = [
  {
    name: 'mathBlock',
    level: 'block',
    start(src) { return src.indexOf('$$'); },
    tokenizer(src) {
      const m = /^\$\$([\s\S]+?)\$\$(?:\n+|$)/.exec(src);
      if (m) return { type: 'mathBlock', raw: m[0], text: m[1].trim() };
    },
    renderer(token) { return `<div class="math math-block">${escapeHtml(token.text)}</div>\n`; },
  },
  {
    name: 'mathInline',
    level: 'inline',
    start(src) { return src.indexOf('$'); },
    tokenizer(src) {
      const m = /^\$(?!\s)((?:\\\$|[^$\n])+?)(?<!\s)\$(?!\d)/.exec(src);
      if (m) return { type: 'mathInline', raw: m[0], text: m[1] };
    },
    renderer(token) { return `<span class="math math-inline">${escapeHtml(token.text)}</span>`; },
  },
];

marked.use({
  gfm: true,
  breaks: false,
  extensions: mathExtensions,
  renderer: {
    // mermaid 代码块交给前端 mermaid.js 渲染，不能进 <pre><code>
    code({ text, lang }) {
      const info = (lang || '').trim().split(/\s+/)[0].toLowerCase();
      if (info === 'mermaid') return `<pre class="mermaid">${escapeHtml(text)}</pre>\n`;
      const cls = info ? ` class="language-${escapeHtml(info)}"` : '';
      return `<pre><code${cls}>${escapeHtml(text)}</code></pre>\n`;
    },
    // GitHub 警告块：> [!NOTE] / [!TIP] / [!IMPORTANT] / [!WARNING] / [!CAUTION]
    blockquote({ tokens }) {
      const body = this.parser.parse(tokens);
      const m = /^\s*<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i.exec(body);
      if (!m) return `<blockquote>\n${body}</blockquote>\n`;
      const type = m[1].toLowerCase();
      const rest = body.slice(m[0].length).replace(/^<\/p>\n?/, '');
      return `<blockquote class="alert alert-${type}">\n<p class="alert-title">${ALERT_LABELS[type]}</p>\n${rest.startsWith('<') ? rest : '<p>' + rest}</blockquote>\n`;
    },
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const base = slugify(text.replace(/<[^>]+>/g, ''));
      _usedIds[base] = (_usedIds[base] ?? 0) + 1;
      const id = _usedIds[base] === 1 ? base : `${base}-${_usedIds[base]}`;
      return `<h${depth} id="${id}">${text}</h${depth}>\n`;
    },
  },
});

export function renderMarkdown(md) {
  _usedIds = {};
  return marked.parse(md);
}

// Extract headings for server-side TOC — same slug+dedup logic as the renderer.
export function extractHeadings(md) {
  const headings = [];
  const usedIds = {};
  // Strip code blocks so headings inside them are ignored
  const stripped = md.replace(/```[\s\S]*?```/g, '');
  for (const line of stripped.split('\n')) {
    const hm = line.match(/^(#{1,6})\s+(.*)/);
    if (hm) {
      const text = hm[2].trim();
      const base = slugify(text);
      usedIds[base] = (usedIds[base] ?? 0) + 1;
      const id = usedIds[base] === 1 ? base : `${base}-${usedIds[base]}`;
      headings.push({ level: hm[1].length, text, id });
    }
  }
  return headings;
}
