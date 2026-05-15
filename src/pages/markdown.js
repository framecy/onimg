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

// Module-level state reset before each parse (marked.parse is synchronous).
let _usedIds = {};

marked.use({
  gfm: true,
  breaks: false,
  renderer: {
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
