import { Alert, cn, EmptyState, IconButton, Tag, Timeline } from '@itclabs/react-ui';
import { useBuilding, useBuildingPrices } from '@stay/sdk/react';
import type { BuildingServicePrice } from '@stay/shared';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { displayDate, formatVnd, todayIsoDate } from '@/libraries/format';
import { isNotFound } from '@/libraries/forms/api-errors';
import { LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { ScreenHeader } from '@/libraries/screen-header';
import NotFoundPage from '@/modules/errors/not-found-page';
import { type PriceAction, PriceDialog } from './price-dialog';

const COLUMNS = {
  default: 'lg:w-36 lg:text-right',
  building: 'lg:w-44 lg:text-right',
  from: 'lg:w-32',
  actions: 'lg:w-32',
};

function PriceHistory({ item }: { item: BuildingServicePrice }) {
  const { t } = useTranslation('buildings');

  const today = todayIsoDate();

  if (item.history.length === 0) return <EmptyState size="compact" title={t('prices.noHistory')} />;

  return (
    <Timeline
      aria-label={t('prices.historyOf', { name: item.name })}
      showStatus={false}
      items={item.history.map((entry) => ({
        id: entry.id,
        state: entry.effectiveFrom > today ? 'upcoming' : 'completed',
        title: (
          <div
            className="flex flex-wrap items-center gap-x-3 gap-y-1 text-ui-sm"
            data-testid="price-history-entry"
          >
            <span className="w-28 font-medium text-ink">
              {t('prices.from', { date: displayDate(entry.effectiveFrom) })}
            </span>
            <span className="tabular-nums text-ink">
              {entry.price === null ? t('prices.backToDefault') : formatVnd(entry.price)}
            </span>
            {entry.effectiveFrom === item.effectiveFrom ? (
              <Tag size="sm" tone="success">
                {t('prices.current')}
              </Tag>
            ) : entry.effectiveFrom > today ? (
              <Tag size="sm" tone="info">
                {t('prices.upcoming')}
              </Tag>
            ) : null}
          </div>
        ),
      }))}
    />
  );
}

/** O-06 Đơn giá của toà: default vs building price per service, dated overrides and history. */
export default function BuildingPricesPage() {
  const { t } = useTranslation('buildings');
  const { t: ts } = useTranslation('settings');
  const { id = '' } = useParams();
  const { reportMissingBuilding } = useActiveBuilding();
  const building = useBuilding(id);
  const prices = useBuildingPrices(id);
  const [action, setAction] = useState<PriceAction | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const missing = isNotFound(building.error) || isNotFound(prices.error);

  useEffect(() => {
    if (missing) reportMissingBuilding(id);
  }, [missing, id, reportMissingBuilding]);

  if (missing) return <NotFoundPage />;

  const archived = Boolean(building.data?.archivedAt);
  const items = prices.data?.items ?? [];

  return (
    <div className="grid gap-6">
      <ScreenHeader
        title={t('prices.title')}
        description={
          building.data
            ? t('prices.description', { name: building.data.name, code: building.data.code })
            : undefined
        }
      />

      {archived ? <Alert tone="warning">{t('prices.archivedNotice')}</Alert> : null}

      {prices.isPending ? (
        <LoadingRows rows={6} />
      ) : prices.isError && !prices.data ? (
        <LoadError error={prices.error} onRetry={() => void prices.refetch()} />
      ) : (
        <section
          aria-label={t('prices.title')}
          className="overflow-hidden rounded-panel border border-line bg-surface shadow-panel"
          data-testid="prices-table"
        >
          <div aria-hidden="true" className="hidden border-b border-line bg-canvas lg:block">
            <div className="flex items-center gap-3 px-4 py-2.5 text-eyebrow font-semibold uppercase text-muted">
              <span className="min-w-0 flex-1">{t('prices.service')}</span>
              <span className={COLUMNS.default}>{t('prices.defaultPrice')}</span>
              <span className={COLUMNS.building}>{t('prices.buildingPrice')}</span>
              <span className={COLUMNS.from}>{t('prices.effectiveFrom')}</span>
              <span className={COLUMNS.actions}>
                <span className="sr-only">{t('actions')}</span>
              </span>
            </div>
          </div>

          <ul aria-label={t('prices.title')}>
            {items.map((item) => {
              const isOpen = expanded === item.serviceId;
              const override = item.source === 'override';

              return (
                <li
                  key={item.serviceId}
                  className="border-b border-line last:border-b-0"
                  data-testid={`price-row-${item.code}`}
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
                    <span className="min-w-0 flex-1 basis-full lg:basis-auto">
                      <span className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                        {item.name}
                        {item.active ? null : (
                          <Tag size="sm" tone="neutral">
                            {ts('services.inactive')}
                          </Tag>
                        )}
                      </span>
                      <span className="block text-ui-sm text-muted">
                        {ts(`services.kinds.${item.kind}`)} · {item.unit}
                      </span>
                    </span>
                    <span className={cn('text-ui-sm text-muted', COLUMNS.default)}>
                      <span className="lg:hidden">{t('prices.defaultShort')} </span>
                      <span className="tabular-nums">{formatVnd(item.defaultPrice)}</span>
                    </span>
                    <span
                      className={cn('flex items-center gap-2 lg:justify-end', COLUMNS.building)}
                      data-testid="building-price"
                    >
                      <span className="font-semibold tabular-nums text-ink">
                        {formatVnd(item.price)}
                      </span>
                      <Tag size="sm" tone={override ? 'brand' : 'neutral'}>
                        {override ? t('prices.override') : t('prices.default')}
                      </Tag>
                    </span>
                    <span className={cn('text-ui-sm text-ink', COLUMNS.from)}>
                      {item.effectiveFrom
                        ? t('prices.from', { date: displayDate(item.effectiveFrom) })
                        : '—'}
                    </span>
                    <span className={cn('ml-auto flex justify-end gap-1', COLUMNS.actions)}>
                      {archived ? null : (
                        <IconButton
                          icon="edit"
                          variant="ghost"
                          size="sm"
                          label={t('prices.set', { name: item.name })}
                          onClick={() => setAction({ mode: 'set', item })}
                        />
                      )}
                      {archived || !override ? null : (
                        <IconButton
                          icon="rotateLeft"
                          variant="ghost"
                          size="sm"
                          label={t('prices.reset', { name: item.name })}
                          onClick={() => setAction({ mode: 'reset', item })}
                        />
                      )}
                      <IconButton
                        icon="history"
                        variant="ghost"
                        size="sm"
                        label={t('prices.history', { name: item.name })}
                        aria-expanded={isOpen}
                        onClick={() => setExpanded(isOpen ? null : item.serviceId)}
                      />
                    </span>
                  </div>
                  {isOpen ? (
                    <div className="border-t border-line bg-canvas px-4 py-3">
                      <PriceHistory item={item} />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <PriceDialog buildingId={id} action={action} onClose={() => setAction(null)} />
    </div>
  );
}
