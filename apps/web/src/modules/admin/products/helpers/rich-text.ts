export function extractRichText(value?: string | null): string {
  if (!value) return '';

  const trimmed = value.trim();
  function stripHtml(html: string): string {
    return html
      .replace(/<\/p>|<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .trim();
  }
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
    return stripHtml(trimmed);
  }

  try {
    const parsed = JSON.parse(trimmed);
    const root = parsed && typeof parsed === 'object' ? parsed.root : null;
    if (
      !root ||
      typeof root !== 'object' ||
      root.type !== 'root' ||
      !Array.isArray(root.children)
    ) {
      return trimmed;
    }

    const extractNode = (node: unknown): string => {
      if (!node || typeof node !== 'object') return '';
      const n = node as { type?: string; text?: string; children?: unknown[] };

      if (n.type === 'linebreak') return '\n';
      if (typeof n.text === 'string') return n.text;

      if (Array.isArray(n.children)) {
        const text = n.children.map(extractNode).join('');
        if (
          n.type === 'paragraph' ||
          n.type === 'heading' ||
          n.type === 'listitem' ||
          n.type === 'quote' ||
          n.type === 'code'
        ) {
          return text ? `${text}\n` : '';
        }
        return text;
      }
      return '';
    };

    const result = extractNode(parsed.root).trim();
    return result;
  } catch {
    return stripHtml(trimmed);
  }
}
