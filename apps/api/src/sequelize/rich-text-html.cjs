'use strict';

/**
 * Converts stored product descriptions to the HTML read by the UI kit's RichTextView
 * and written by its Editor. Handles Lexical editor state (including rows whose
 * pretty-printed newlines lost their backslash), plain text and existing HTML.
 */

const TEXT_FORMATS = [
  [1, 'strong'],
  [2, 'em'],
  [4, 's'],
  [8, 'u'],
  [16, 'code'],
  [32, 'sub'],
  [64, 'sup'],
];
const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isHtml(value) {
  return /^\s*<([a-z][a-z0-9]*)\b[^>]*>/i.test(value);
}

function safeUrl(url) {
  return typeof url === 'string' && /^(https?:|mailto:)/i.test(url.trim()) ? url.trim() : null;
}

function renderText(node) {
  let html = escapeHtml(node.text ?? '');
  const format = Number(node.format) || 0;
  for (const [bit, tag] of TEXT_FORMATS) if (format & bit) html = `<${tag}>${html}</${tag}>`;
  return html;
}

function renderChildren(node) {
  return (Array.isArray(node.children) ? node.children : []).map(renderNode).join('');
}

function renderNode(node) {
  if (!node || typeof node !== 'object') return '';
  switch (node.type) {
    case 'text':
      return renderText(node);
    case 'linebreak':
      return '<br>';
    case 'tab':
      return ' ';
    case 'paragraph': {
      const inner = renderChildren(node);
      return inner ? `<p>${inner}</p>` : '';
    }
    case 'heading': {
      const tag = HEADINGS.has(node.tag) ? node.tag : 'h2';
      return `<${tag}>${renderChildren(node)}</${tag}>`;
    }
    case 'list': {
      const tag = node.listType === 'number' || node.tag === 'ol' ? 'ol' : 'ul';
      return `<${tag}>${renderChildren(node)}</${tag}>`;
    }
    case 'listitem':
      return `<li>${renderChildren(node)}</li>`;
    case 'quote':
      return `<blockquote>${renderChildren(node)}</blockquote>`;
    case 'code':
      return `<pre><code>${renderChildren(node)}</code></pre>`;
    case 'link':
    case 'autolink': {
      const href = safeUrl(node.url);
      const inner = renderChildren(node);
      return href ? `<a href="${escapeHtml(href)}">${inner}</a>` : inner;
    }
    default:
      return renderChildren(node);
  }
}

function parseLexical(value) {
  const attempts = [
    value,
    // Pretty-printed JSON whose "\n" lost its backslash: "{n  "root": {n ...}n}".
    value.replace(/([{[,])n(\s+)/g, '$1$2').replace(/n(\s*)(?=[}\]])/g, '$1'),
  ];
  for (const attempt of attempts) {
    try {
      const parsed = JSON.parse(attempt);
      if (parsed && typeof parsed === 'object' && parsed.root) return parsed.root;
    } catch {
      // Try the next repair.
    }
  }
  return null;
}

function plainTextToHtml(value) {
  return value
    .trim()
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\r?\n/g, '<br>')}</p>`)
    .join('');
}

function lexicalTexts(value) {
  return [...value.matchAll(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g)].map((match) => {
    try {
      return JSON.parse(`"${match[1]}"`);
    } catch {
      return match[1];
    }
  });
}

/** Returns HTML for any stored description; empty input stays empty. */
function descriptionToHtml(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  if (isHtml(value)) return value.trim();

  const trimmed = value.trim();
  if (/^\{\s*n?\s*"root"/.test(trimmed)) {
    const root = parseLexical(trimmed);
    if (root) return renderNode(root);
    // Unrepairable editor state: keep its words rather than raw JSON.
    return plainTextToHtml(lexicalTexts(trimmed).join('\n\n'));
  }
  return plainTextToHtml(trimmed);
}

module.exports = { descriptionToHtml, escapeHtml, isHtml };
