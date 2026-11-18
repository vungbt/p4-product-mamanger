import {
  Card,
  type ColumnDef,
  DataTable,
  Tag,
  type TagTone,
  useFormatters,
} from '@itclabs/react-ui';
import { getApiSdk, useQuery } from '@p4/api-client';
import { unwrap } from '@p4/api-sdk/shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const RECENT_ORDER_COUNT = 5;

const STATUS_TONES: Record<string, TagTone> = {
  pending: 'warning',
  paid: 'info',
  shipping: 'info',
  completed: 'success',
  cancelled: 'danger',
};

async function fetchRecentOrders(signal: AbortSignal) {
  const query = {
    page: 1,
    pageSize: RECENT_ORDER_COUNT,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  } as const;

  return unwrap(await getApiSdk().GET('/api/orders', { params: { query }, signal })).data;
}

type RecentOrder = Awaited<ReturnType<typeof fetchRecentOrders>>[number];

export default function RecentOrders() {
  const { t } = useTranslation();
  const { formatCurrency, formatDate } = useFormatters();

  const { data = [], isPending } = useQuery({
    queryKey: ['admin-dashboard', 'recent-orders'],
    queryFn: ({ signal }) => fetchRecentOrders(signal),
  });

  const columns = useMemo<ColumnDef<RecentOrder, unknown>[]>(
    () => [
      { accessorKey: 'id', header: t('adminDashboard.orderId') },
      { accessorKey: 'userEmail', header: t('adminDashboard.customer') },
      {
        accessorKey: 'status',
        header: t('adminDashboard.statusColumn'),
        cell: ({ row }) => (
          <Tag tone={STATUS_TONES[row.original.status] ?? 'neutral'}>
            {t(`adminDashboard.status.${row.original.status}`, {
              defaultValue: row.original.status,
            })}
          </Tag>
        ),
      },
      {
        accessorKey: 'total',
        header: t('adminDashboard.total'),
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatCurrency(row.original.total, row.original.currency ?? 'VND')}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: t('adminDashboard.createdAt'),
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
    ],
    [formatCurrency, formatDate, t],
  );

  return (
    <Card title={t('adminDashboard.recentOrders')} classNames={{ root: 'min-w-0', content: 'p-0' }}>
      <DataTable
        caption={t('adminDashboard.recentOrders')}
        className="rounded-none border-0 shadow-none"
        rows={data}
        columns={columns}
        rowId={(row) => row.id}
        verticalAlign="middle"
        loading={isPending}
        emptyText={t('adminDashboard.noRecentOrders')}
      />
    </Card>
  );
}
