import { Avatar, cn, Input, Skeleton } from '@itclabs/react-ui';
import { useBuildingOverview } from '@stay/sdk/react';
import { isPeriod, type StayOverview } from '@stay/shared';
import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { formatVnd } from '@/libraries/format';
import { LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { latestSearchParams } from '@/libraries/search-params';
import { useAuth } from '@/libraries/session/auth-provider';
import { displayPeriod } from '@/modules/invoices/invoice-ui';
import { OnboardingSteps } from './onboarding';
import { OccupancyCard, StatCard } from './stat-cards';
import { TodoList } from './todo-list';

const PeriodChart = lazy(() => import('./period-chart'));

/**
 * O-01 Tổng quan tháng (ST-19): figures of billing period M aggregated by the API, the to-do
 * list in monthly calendar order and the last six periods. `?period=` keeps the chosen period.
 */
export default function OverviewPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { buildingId } = useActiveBuilding();
  const [params, setParams] = useSearchParams();

  const raw = params.get('period');
  const requested = isPeriod(raw) ? raw : undefined;

  const query = useBuildingOverview(buildingId ?? '', requested);

  const choosePeriod = (value: string) => {
    if (!isPeriod(value)) return;
    setParams(
      () => {
        const next = latestSearchParams();

        next.set('period', value);
        return next;
      },
      { replace: true },
    );
  };

  if (!user) return null;

  const name = user.displayName.trim() || user.email;
  const data = query.data;
  // Placeholder data of another period stays visible (dimmed) until the new period loads.
  const current = data && (!requested || data.period === requested) ? data : undefined;
  const shown = current ?? (query.isPlaceholderData ? data : undefined);
  // A building without rooms leads with the setup guide (screens.md O-01 "Rỗng").
  const empty = shown?.rooms.total === 0;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6">
      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar
            src={user.avatarUrl ?? undefined}
            alt=""
            fallback={name.charAt(0).toUpperCase()}
            size="lg"
          />
          <div className="min-w-0">
            <h1 className="text-heading font-bold text-ink">{t('overview.greeting', { name })}</h1>
            <p className="truncate text-ui-sm text-muted" data-testid="signed-in-user">
              {t('overview.signedInAs', { email: user.email, role: t(`roles.${user.role}`) })}
            </p>
          </div>
        </div>
        {buildingId ? (
          <Input
            label="Kỳ"
            type="month"
            value={requested ?? data?.period ?? ''}
            className="w-full sm:max-w-48"
            data-testid="overview-period"
            onChange={(event) => choosePeriod(event.target.value)}
          />
        ) : null}
      </header>

      {empty ? <OnboardingSteps empty /> : null}

      {!buildingId ? (
        <p>Chọn toà nhà để xem tổng quan.</p>
      ) : query.isPending ? (
        <LoadingRows rows={5} />
      ) : query.isError && !shown ? (
        <LoadError error={query.error} onRetry={() => void query.refetch()} />
      ) : shown ? (
        <OverviewContent
          data={shown}
          loading={!current}
          refreshing={query.isFetching}
          onRetry={query.isError ? () => void query.refetch() : undefined}
          error={query.isError ? query.error : null}
        />
      ) : null}

      {empty ? null : <OnboardingSteps empty={false} />}
    </div>
  );
}

function OverviewContent({
  data,
  loading,
  refreshing,
  error,
  onRetry,
}: {
  data: StayOverview;
  loading: boolean;
  refreshing: boolean;
  error: unknown;
  onRetry?: () => void;
}) {
  const period = displayPeriod(data.period);
  const previous = displayPeriod(data.previousPeriod);

  const chartData = data.series.map((point) => ({
    id: point.period,
    label: displayPeriod(point.period),
    values: { billed: point.billed, collected: point.collected },
  }));
  const hasSeries = data.series.some((point) => point.billed > 0 || point.collected > 0);

  return (
    <div
      className={cn('grid min-w-0 gap-6', loading && 'opacity-60')}
      aria-busy={loading || refreshing}
      data-testid="overview"
      data-period={loading ? '' : data.period}
    >
      {error && onRetry ? <LoadError error={error} onRetry={onRetry} /> : null}

      <section aria-labelledby="overview-stats-title" className="grid min-w-0 gap-3">
        <h2 id="overview-stats-title" className="text-section font-semibold text-ink">
          Kỳ {period}
        </h2>
        <ul className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            id="billed"
            label="Phải thu kỳ này"
            value={data.current.billed}
            previous={data.previous.billed}
            previousLabel={previous}
            note={`${data.current.invoiceCount} hoá đơn đã phát hành`}
            href={`/invoices?period=${data.period}`}
          />
          <StatCard
            id="collected"
            label="Đã thu"
            value={data.current.collected}
            previous={data.previous.collected}
            previousLabel={previous}
            note={`Thu trong tháng ${period} (theo ngày thu): ${formatVnd(data.collectedInMonth)}`}
            href="/payments"
          />
          <StatCard
            id="remaining"
            label="Còn lại"
            value={data.current.remaining}
            note={`Của các hoá đơn kỳ ${period}`}
            href={`/invoices?period=${data.period}`}
            tone={data.current.remaining > 0 ? 'warning' : undefined}
          />
          <StatCard
            id="overdue"
            label="Công nợ quá hạn"
            value={data.receivables.overdueRemaining}
            note={`Tổng công nợ mọi kỳ: ${formatVnd(data.receivables.totalRemaining)}`}
            href="/receivables"
            tone={data.receivables.overdueRemaining > 0 ? 'danger' : undefined}
          />
          <OccupancyCard data={data} previousLabel={previous} />
        </ul>
      </section>

      <TodoList todos={data.todos} />

      <section aria-labelledby="overview-chart-title" className="grid min-w-0 gap-3">
        <h2 id="overview-chart-title" className="text-section font-semibold text-ink">
          6 kỳ gần nhất
        </h2>
        <div className="min-w-0 rounded-panel border border-line bg-surface p-3 sm:p-5">
          <Suspense fallback={<Skeleton className="h-64" />}>
            <PeriodChart
              type="bar"
              label={`Phải thu và đã thu từ kỳ ${displayPeriod(data.series[0]?.period ?? data.period)} đến kỳ ${period}`}
              description="Mỗi kỳ: tổng hoá đơn đã phát hành (phải thu) và số đã thu của chính các hoá đơn đó."
              data={hasSeries ? chartData : []}
              series={[
                { id: 'billed', label: 'Phải thu' },
                { id: 'collected', label: 'Đã thu' },
              ]}
              valueFormatter={formatVnd}
              emptyMessage="Chưa có hoá đơn phát hành trong 6 kỳ này."
              loadingLabel="Đang tải biểu đồ"
              loading={loading}
              data-testid="overview-chart"
            />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
