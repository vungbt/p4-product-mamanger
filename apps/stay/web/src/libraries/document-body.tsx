import { cn } from '@itclabs/react-ui';

/**
 * A filled contract body (ST-30). The HTML is sanitized by the API with an allowlist (headings,
 * paragraphs, lists, tables, bold/italic, highlighted blanks, missing-data marks): no scripts,
 * links, images or styles other than text alignment reach the browser.
 */
export function DocumentBody({
  html,
  className,
  label,
}: {
  html: string;
  className?: string;
  label?: string;
}) {
  return (
    <section
      aria-label={label}
      className={cn(
        'pod-rich-text min-w-0 break-words text-ink',
        '[&_h1]:my-3 [&_h1]:text-section [&_h1]:font-bold',
        '[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-ui-sm',
        '[&_td]:border [&_td]:border-line [&_td]:p-2 [&_td]:align-top',
        '[&_th]:border [&_th]:border-line [&_th]:bg-canvas [&_th]:p-2 [&_th]:text-left',
        '[&_mark]:rounded-sm [&_mark]:bg-warning-50 [&_mark]:px-0.5',
        '[&_[data-missing]]:font-semibold [&_[data-missing]]:text-danger-700',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
