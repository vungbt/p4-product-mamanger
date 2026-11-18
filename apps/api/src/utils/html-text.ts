/** Visible text of stored rich-text HTML, for emptiness checks; not a sanitizer. */
export function htmlText(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
