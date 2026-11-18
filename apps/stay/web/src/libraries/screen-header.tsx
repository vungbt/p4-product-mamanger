import { PageHeader, type PageHeaderProps } from '@itclabs/react-ui';
import type { ReactNode } from 'react';
import { useSetPageDescription } from './page-meta';

type ScreenHeaderProps = Omit<PageHeaderProps, 'classNames' | 'title'> & {
  title: string;
  /** Keep the visible title block (the overview greeting); other screens rely on the breadcrumb. */
  visible?: boolean;
};

/**
 * Screen title. The breadcrumb names the screen, so the `<h1>` is visually hidden and the
 * description moves under the breadcrumb in the app header. Page-level controls in `action`
 * (period pickers, form shortcuts) stay in a compact right-aligned row.
 */
export function ScreenHeader({ visible = false, ...props }: ScreenHeaderProps) {
  if (visible) return <VisibleHeader {...props} />;
  return <HiddenHeader title={props.title} description={props.description} action={props.action} />;
}

function VisibleHeader(props: Omit<ScreenHeaderProps, 'visible'>) {
  return (
    <PageHeader
      {...props}
      classNames={{
        root: 'mb-0 gap-3 sm:flex-row sm:items-end',
        content: 'min-w-0',
        title: 'text-heading font-bold',
        description: 'mt-1 text-ui-sm',
        actions: 'flex flex-wrap items-end gap-2',
      }}
    />
  );
}

function HiddenHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  // Only text: a new element on every render would re-publish it in a loop.
  useSetPageDescription(typeof description === 'string' ? description : null);

  return (
    <>
      <h1 className="sr-only">{title}</h1>
      {action ? (
        <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-end sm:justify-end">{action}</div>
      ) : null}
    </>
  );
}
