import { useFormatters } from '@itclabs/react-ui';
import { Chart } from '@itclabs/react-ui/chart';
import { useTranslation } from 'react-i18next';
import type { DashboardSummary } from './use-dashboard-reports';

const STATUS_COLORS: Record<string, string> = {
  pending_confirmation: 'var(--color-warning-700)',
  confirmed: 'var(--color-brand-500)',
  processing: 'var(--color-info-700)',
  completed: 'var(--color-success-700)',
  cancelled: 'var(--color-danger-700)',
};

/** Loaded on demand: the chart library is the heaviest part of the admin dashboard. */
export function RevenueChart({ summary }: { summary: DashboardSummary }) {
  const { t } = useTranslation();
  const { formatCurrency, formatDate, formatNumber } = useFormatters();

  return (
    <Chart
      type="bar"
      label={t('adminDashboard.revenueChart')}
      data={summary.daily.map(({ date, net }) => ({
        id: date.toISOString(),
        label: formatDate(date, { day: '2-digit', month: '2-digit' }),
        values: { net },
      }))}
      series={[
        { id: 'net', label: t('adminDashboard.netRevenue'), color: 'var(--color-brand-700)' },
      ]}
      height={280}
      legend={false}
      valueFormatter={(value) => formatCurrency(value, summary.currency)}
      axisValueFormatter={(value) => formatNumber(value, { notation: 'compact' })}
    />
  );
}

export function OrderStatusChart({ summary }: { summary: DashboardSummary }) {
  const { t } = useTranslation();

  return (
    <Chart
      type="donut"
      label={t('adminDashboard.orderStatus')}
      data={summary.statuses.map(({ status, count }) => ({
        id: status,
        label: t(`adminDashboard.status.${status}`, { defaultValue: status }),
        value: count,
        color: STATUS_COLORS[status] ?? 'var(--color-muted)',
      }))}
      height={280}
    />
  );
}
