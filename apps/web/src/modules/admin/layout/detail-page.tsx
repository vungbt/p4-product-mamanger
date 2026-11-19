import {
  Card,
  cn,
  EmptyState,
  type EmptyStateProps,
  PageHeader,
  type PageHeaderProps,
  Skeleton,
} from '@itclabs/react-ui';
import type { ReactNode } from 'react';

export type DetailPageProps = {
  title: ReactNode;
  back: NonNullable<PageHeaderProps['back']>;
  meta?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  loading?: boolean;
  notFound?: Pick<EmptyStateProps, 'title' | 'description' | 'action'>;
  children?: ReactNode;
};

export type DetailSectionProps = {
  title: ReactNode;
  actions?: ReactNode;
  description?: ReactNode;
  flush?: boolean;
  children?: ReactNode;
};

export function DetailSection({
  title,
  actions,
  description,
  flush = false,
  children,
}: DetailSectionProps) {
  return (
    <Card
      title={title}
      action={actions}
      description={description}
      className={cn(flush && 'overflow-hidden p-0')}
      classNames={{ header: cn(flush && 'px-6 pt-6') }}
    >
      {children}
    </Card>
  );
}

function SectionSkeleton() {
  return (
    <DetailSection title={<Skeleton className="h-7 w-40" />}>
      <Skeleton className="h-48 w-full" />
    </DetailSection>
  );
}

export function DetailPage({
  title,
  back,
  meta,
  description,
  actions,
  aside,
  loading = false,
  notFound,
  children,
}: DetailPageProps) {
  return (
    <div className="grid gap-6" aria-busy={loading}>
      <PageHeader
        back={back}
        classNames={{
          root: 'mb-0 min-w-0 gap-3 lg:items-center',
          content: 'min-w-0',
          title: 'flex flex-wrap items-center gap-x-3 gap-y-1 text-heading',
          actions: 'flex flex-wrap gap-2 lg:shrink',
        }}
        title={
          loading ? (
            <>
              <span className="sr-only">{title}</span>
              <Skeleton className="h-8 w-48 max-w-full" aria-hidden="true" />
            </>
          ) : (
            <>
              <span>{title}</span>
              {meta != null && (
                <span className="flex flex-wrap items-center gap-2 text-control font-normal text-muted">
                  {meta}
                </span>
              )}
            </>
          )
        }
        description={loading ? undefined : description}
        action={loading ? <Skeleton className="h-9 w-32" aria-hidden="true" /> : actions}
      />
      {!loading && notFound ? (
        <EmptyState {...notFound} variant="not-found" headingLevel={2} />
      ) : (
        <div
          className={cn(
            'grid min-w-0 gap-6',
            aside != null && 'xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]',
          )}
        >
          <div className="grid min-w-0 content-start gap-6">
            {loading ? (
              <div className="grid gap-6" aria-hidden="true">
                <SectionSkeleton />
                <SectionSkeleton />
                <SectionSkeleton />
              </div>
            ) : (
              children
            )}
          </div>
          {aside != null && (
            // The shell header uses min-h-14; top-20 leaves the existing gap-6 below it.
            <aside className="grid min-w-0 content-start gap-6 self-start xl:sticky xl:top-20">
              {loading ? (
                <div aria-hidden="true">
                  <SectionSkeleton />
                </div>
              ) : (
                aside
              )}
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
