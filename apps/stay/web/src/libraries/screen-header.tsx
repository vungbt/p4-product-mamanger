import { PageHeader, type PageHeaderProps } from '@itclabs/react-ui';

/** Kit `PageHeader` sized for app screens (heading scale, as Tổng quan), not marketing pages. */
export function ScreenHeader(props: Omit<PageHeaderProps, 'classNames'>) {
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
