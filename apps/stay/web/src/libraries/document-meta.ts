import { useEffect } from 'react';

type MetaEntry = [attribute: 'name' | 'property', key: string, content: string];

/**
 * Generic title and meta tags for pages opened from a link (shared invoice, tenant portal):
 * link previews (Zalo, Messenger) and search engines must not reveal personal data, and the
 * token in the URL is never sent to other origins. Restored when the page closes.
 */
export function useGenericDocumentMeta(title: string) {
  useEffect(() => {
    const entries: MetaEntry[] = [
      ['name', 'robots', 'noindex, nofollow'],
      ['name', 'referrer', 'no-referrer'],
      ['name', 'description', title],
      ['property', 'og:title', title],
      ['property', 'og:description', title],
    ];
    const previousTitle = document.title;
    const restore = entries.map(([attribute, key, content]) => {
      const existing = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
      const element = existing ?? document.createElement('meta');
      const previous = existing?.getAttribute('content') ?? null;

      element.setAttribute(attribute, key);
      element.setAttribute('content', content);
      if (!existing) document.head.append(element);
      return () => {
        if (!existing) element.remove();
        else if (previous !== null) element.setAttribute('content', previous);
      };
    });

    document.title = title;
    return () => {
      document.title = previousTitle;
      for (const undo of restore) undo();
    };
  }, [title]);
}
