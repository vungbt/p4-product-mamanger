import {
  Alert,
  Button,
  Card,
  EmptyState,
  KpiCard,
  KpiGrid,
  PageHeader,
  ProgressList,
  Select,
  Skeleton,
  Tag,
  useFormatters,
} from '@itclabs/react-ui';
import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants/constants';
import useAuth from '@/hooks/use-auth';
import {
  DASHBOARD_RANGES,
  type DashboardRange,
  type DashboardSummary,
  useDashboardReports,
} from './use-dashboard-reports';

const RevenueChart = lazy(() =>
  import('./dashboard-charts').then((module) => ({ default: module.RevenueChart })),
);
const OrderStatusChart = lazy(() =>
  import('./dashboard-charts').then((module) => ({ default: module.OrderStatusChart })),
);

const chartFallback = <Skeleton className="h-72 w-full" />;

/** Percent change, or nothing when the previous period has no baseline to compare with. */
function changeFrom(current: number, previous: number) {
  return previous > 0 ? ((current - previous) / previous) * 100 : undefined;
}

function DashboardMetrics({
  summary,
  loading,
  days,
}: {
  summary: DashboardSummary | null;
  loading: boolean;
  days: DashboardRange;
}) {
  const { t } = useTranslation();
  const { formatCurrency, formatNumber } = useFormatters();
  const label = t('adminDashboard.versusPrevious', { days });
  const revenueChange = summary ? changeFrom(summary.revenue, summary.previousRevenue) : undefined;
  const orderChange = summary
    ? changeFrom(summary.orderTotal, summary.previousOrderTotal)
    : undefined;

  return (
    <KpiGrid columns={4}>
      <KpiCard
        label={t('adminDashboard.netRevenue')}
        value={summary ? formatCurrency(summary.revenue, summary.currency) : ''}
        loading={loading}
        {...(revenueChange === undefined ? {} : { trend: { value: revenueChange, label } })}
      />
      <KpiCard
        label={t('adminDashboard.newOrders')}
        value={summary ? formatNumber(summary.orderTotal) : ''}
        loading={loading}
        {...(orderChange === undefined ? {} : { trend: { value: orderChange, label } })}
      />
      <KpiCard
        label={t('adminDashboard.completionRate')}
        value={
          summary ? `${formatNumber(summary.completionRate, { maximumFractionDigits: 1 })}%` : ''
        }
        hint={t('adminDashboard.completionHint')}
        loading={loading}
      />
      <KpiCard
        label={t('adminDashboard.lowStock')}
        value={summary ? formatNumber(summary.lowStockCount) : ''}
        hint={t('adminDashboard.lowStockHint')}
        tone={summary?.lowStockCount ? 'warning' : 'success'}
        href={ROUTES.admin.products}
        loading={loading}
      />
    </KpiGrid>
  );
}

function LowStockList({ summary }: { summary: DashboardSummary }) {
  const { t } = useTranslation();
  const { formatNumber } = useFormatters();

  if (!summary.lowStock.length) return <EmptyState title={t('adminDashboard.noLowStock')} />;

  return (
    <ul className="grid gap-3">
      {summary.lowStock.map((item) => (
        <li key={item.id} className="flex min-w-0 items-center justify-between gap-3">
          <span className="min-w-0 truncate font-medium text-ink">{item.sku}</span>
          <Tag tone={item.available > 0 ? 'warning' : 'danger'} className="shrink-0">
            {item.available > 0
              ? t('adminDashboard.unitsLeft', {
                  count: item.available,
                  value: formatNumber(item.available),
                })
              : t('adminDashboard.outOfStock')}
          </Tag>
        </li>
      ))}
    </ul>
  );
}

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { formatNumber } = useFormatters();
  const [days, setDays] = useState<DashboardRange>(30);
  const { summary, isPending, isError, refetch } = useDashboardReports(days);

  const topUnits = Math.max(1, ...(summary?.topProducts.map((item) => item.units) ?? []));

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader
        classNames={{ title: 'text-heading' }}
        title={t('adminDashboard.greeting', {
          name: user?.displayName?.trim() || user?.email || t('app.admin'),
        })}
        description={t('adminDashboard.description')}
        action={
          <Select
            aria-label={t('adminDashboard.range')}
            rootClassName="w-full sm:w-52"
            searchable={false}
            value={String(days)}
            options={DASHBOARD_RANGES.map((value) => ({
              value: String(value),
              label: t('adminDashboard.lastDays', { days: value }),
            }))}
            onValueChange={(value) => {
              if (value) setDays(Number(value) as DashboardRange);
            }}
          />
        }
      />

      {isError ? (
        <Alert tone="danger" title={t('adminDashboard.loadError')}>
          <Button variant="secondary" size="sm" className="mt-2" onClick={() => void refetch()}>
            {t('adminDashboard.retry')}
          </Button>
        </Alert>
      ) : (
        <>
          <DashboardMetrics summary={summary} loading={isPending} days={days} />

          <div className="grid min-w-0 gap-6 xl:grid-cols-3">
            <Card
              title={t('adminDashboard.revenueChart')}
              description={t('adminDashboard.lastDays', { days })}
              className="min-w-0 xl:col-span-2"
            >
              {summary ? (
                <Suspense fallback={chartFallback}>
                  <RevenueChart summary={summary} />
                </Suspense>
              ) : (
                chartFallback
              )}
            </Card>
            <Card
              title={t('adminDashboard.orderStatus')}
              description={t('adminDashboard.lastDays', { days })}
              className="min-w-0"
            >
              {!summary ? (
                chartFallback
              ) : summary.statuses.length ? (
                <Suspense fallback={chartFallback}>
                  <OrderStatusChart summary={summary} />
                </Suspense>
              ) : (
                <EmptyState title={t('adminDashboard.noOrders')} />
              )}
            </Card>
          </div>

          <div className="grid min-w-0 gap-6 xl:grid-cols-2">
            <Card
              title={t('adminDashboard.topProducts')}
              description={t('adminDashboard.topProductsHint')}
              className="min-w-0"
            >
              {!summary ? (
                <Skeleton className="h-48 w-full" />
              ) : summary.topProducts.length ? (
                <ProgressList
                  label={t('adminDashboard.topProducts')}
                  items={summary.topProducts.map((item) => ({
                    id: item.id,
                    label: item.sku,
                    value: item.units,
                    max: topUnits,
                  }))}
                  valueFormatter={(_, item) => formatNumber(item.value ?? 0)}
                />
              ) : (
                <EmptyState title={t('adminDashboard.noProducts')} />
              )}
            </Card>
            <Card
              title={t('adminDashboard.lowStock')}
              description={t('adminDashboard.lowStockHint')}
              action={
                <Button href={ROUTES.admin.products} variant="ghost" size="sm">
                  {t('adminDashboard.viewProducts')}
                </Button>
              }
              className="min-w-0"
            >
              {summary ? <LowStockList summary={summary} /> : <Skeleton className="h-48 w-full" />}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
