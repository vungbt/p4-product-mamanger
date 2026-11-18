export function extractRichText(value?: string | null): string {
  if (!value) return '';

  const trimmed = value.trim();

  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
    return trimmed;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== 'object' || !parsed.root) {
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
    return trimmed;
  }
}
