import {
  Alert,
  Button,
  Card,
  EmptyState,
  KpiGrid,
  MetricTrend,
  ProgressList,
  Skeleton,
  Tag,
  useFormatters,
} from '@itclabs/react-ui';
import {
  BanknotesIcon,
  ChartSuccessIcon,
  PackageIcon,
  ShoppingBagIcon,
} from '@itclabs/react-ui/icons/outline';
import { type ComponentType, lazy, type ReactNode, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants/constants';
import { useDashboardRange } from './dashboard-range';
import RecentOrders from './recent-orders';
import { type DashboardSummary, useDashboardReports } from './use-dashboard-reports';

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

type MetricCardProps = {
  label: string;
  value: ReactNode;
  icon: ComponentType;
  loading: boolean;
  trend?: number | undefined;
  trendLabel?: string;
  hint?: string;
};

function MetricCard({
  label,
  value,
  icon: Glyph,
  loading,
  trend,
  trendLabel,
  hint,
}: MetricCardProps) {
  return (
    <Card aria-label={label}>
      <span className="mb-4 grid size-10 place-items-center rounded-control bg-brand-50 text-accent">
        <Glyph />
      </span>
      <h2 className="text-ui-sm font-medium text-muted">{label}</h2>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-32" />
      ) : (
        <p className="mt-2 text-heading font-bold text-ink tabular-nums">{value}</p>
      )}
      {trend === undefined ? (
        hint ? (
          <p className="mt-3 text-ui-sm text-muted">{hint}</p>
        ) : null
      ) : (
        <MetricTrend className="mt-3" value={trend} label={trendLabel} />
      )}
    </Card>
  );
}

function DashboardMetrics({
  summary,
  loading,
  days,
}: {
  summary: DashboardSummary | null;
  loading: boolean;
  days: number;
}) {
  const { t } = useTranslation();
  const { formatCurrency, formatNumber } = useFormatters();

  const trendLabel = t('adminDashboard.versusPrevious', { days });

  return (
    <KpiGrid columns={4}>
      <MetricCard
        label={t('adminDashboard.netRevenue')}
        icon={BanknotesIcon}
        loading={loading}
        value={summary ? formatCurrency(summary.revenue, summary.currency) : ''}
        trend={summary ? changeFrom(summary.revenue, summary.previousRevenue) : undefined}
        trendLabel={trendLabel}
      />
      <MetricCard
        label={t('adminDashboard.newOrders')}
        icon={ShoppingBagIcon}
        loading={loading}
        value={summary ? formatNumber(summary.orderTotal) : ''}
        trend={summary ? changeFrom(summary.orderTotal, summary.previousOrderTotal) : undefined}
        trendLabel={trendLabel}
      />
      <MetricCard
        label={t('adminDashboard.completionRate')}
        icon={ChartSuccessIcon}
        loading={loading}
        value={
          summary ? `${formatNumber(summary.completionRate, { maximumFractionDigits: 1 })}%` : ''
        }
        hint={t('adminDashboard.completionHint')}
      />
      <MetricCard
        label={t('adminDashboard.lowStock')}
        icon={PackageIcon}
        loading={loading}
        value={summary ? formatNumber(summary.lowStockCount) : ''}
        hint={t('adminDashboard.lowStockHint')}
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
  const { formatNumber } = useFormatters();
  const { days } = useDashboardRange();
  const { summary, isPending, isError, refetch } = useDashboardReports(days);

  const topUnits = Math.max(1, ...(summary?.topProducts.map((item) => item.units) ?? []));

  if (isError)
    return (
      <Alert tone="danger" title={t('adminDashboard.loadError')}>
        <Button variant="secondary" size="sm" className="mt-2" onClick={() => void refetch()}>
          {t('adminDashboard.retry')}
        </Button>
      </Alert>
    );

  return (
    <div className="grid min-w-0 gap-6">
      <DashboardMetrics summary={summary} loading={isPending} days={days} />

      <div className="grid min-w-0 gap-6 xl:grid-cols-3">
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

      <RecentOrders />
    </div>
  );
}
