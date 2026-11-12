import {
  Alert,
  Button,
  cn,
  type DataTableController,
  DataTablePagination,
  DataTableRoot,
  EmptyState,
} from '@itclabs/react-ui';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { LoadingRows } from './forms/page-states';
import { useIsDesktop } from './use-media-query';

/**
 * A list screen's table: the kit DataTable from `lg`, `cards` on phones with the same
 * pagination footer (one `useDataTable` controller, so paging, page size and loading match).
 * Card items use `data-testid={rowTestId(testId, id)}` like the table rows.
 */
export function ListTable<T>({
  controller,
  cards,
  refreshing = false,
}: {
  controller: DataTableController<T>;
  cards: (rows: readonly T[]) => ReactNode;
  /** Refetch with rows on screen: dim them instead of showing skeletons. */
  refreshing?: boolean;
}) {
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();
  const { error, onRetry, initialLoading, emptyState, emptyText, count } = controller;
  const rows = controller.props.rows;

  if (isDesktop)
    return (
      <Refreshing active={refreshing}>
        <DataTableRoot controller={controller} />
      </Refreshing>
    );

  return (
    <Refreshing active={refreshing}>
      <div className="grid min-w-0 gap-3" data-testid={controller.testId}>
        {error ? (
          <Alert
            tone="danger"
            title={t('errors.loadFailed')}
            action={
              onRetry ? (
                <Button variant="secondary" size="sm" onClick={onRetry}>
                  {t('errors.retry')}
                </Button>
              ) : undefined
            }
          >
            {error}
          </Alert>
        ) : null}
        {initialLoading ? (
          <LoadingRows />
        ) : rows.length ? (
          cards(rows)
        ) : (
          (emptyState ?? <EmptyState size="compact" title={emptyText} />)
        )}
        {count > 0 ? (
          <DataTablePagination
            controller={controller}
            className="rounded-panel border border-line bg-surface"
          />
        ) : null}
      </div>
    </Refreshing>
  );
}

/**
 * Keeps a list in place while it refetches (filters, search, paging): slightly dimmed and
 * `aria-busy`, never replaced by skeletons. Skeletons are for the first load only (`isPending`).
 */
export function Refreshing({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <div
      aria-busy={active || undefined}
      className={cn('min-w-0 transition-opacity', active && 'opacity-60')}
    >
      {children}
    </div>
  );
}

/** Test id of a list row: the DataTable's own `<table id>-row-<row id>`, reused by phone cards. */
export function rowTestId(tableTestId: string, id: string): string {
  return `${tableTestId}-row-${encodeURIComponent(id)}`;
}
