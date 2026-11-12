import {
  Button,
  EmptyState,
  Icon,
  IconButton,
  Input,
  Pagination,
  Tabs,
  TabsList,
  TabsTrigger,
  Tag,
  useDebounce,
} from '@itclabs/react-ui';
import { useBuildings } from '@stay/sdk/react';
import type { StayBuilding } from '@stay/shared';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useCanAccess } from '@/libraries/ability';
import { FILTER_WIDE, FilterBar } from '@/libraries/filter-bar';
import { LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { ScreenHeader } from '@/libraries/screen-header';
import { buildingEditPath, buildingPricesPath, ROUTES } from '@/routing/route-configs';
import { ArchiveBuildingDialog } from './archive-dialog';

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 300;

type StatusFilter = 'active' | 'archived';

function occupancy({ roomCount, occupiedRoomCount }: StayBuilding['stats']): number | null {
  return roomCount > 0 ? Math.round((occupiedRoomCount / roomCount) * 100) : null;
}

function BuildingCard({
  building,
  canManage,
  onArchive,
}: {
  building: StayBuilding;
  canManage: boolean;
  onArchive: () => void;
}) {
  const { t } = useTranslation('buildings');
  const navigate = useNavigate();

  const rate = occupancy(building.stats);
  const archived = Boolean(building.archivedAt);
  const editable = canManage && !archived;

  return (
    <li
      className="flex flex-col gap-4 rounded-panel border border-line bg-surface p-4 shadow-panel sm:p-5"
      data-testid={`building-card-${building.code}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-brand-50 text-accent">
          <Icon name="buildings" className="size-5" aria-hidden />
        </span>
        <div className="grid min-w-0 flex-1 gap-1">
          <h2 className="flex flex-wrap items-center gap-2 text-section font-semibold text-ink">
            {editable ? (
              <Link to={buildingEditPath(building.id)} className="truncate hover:underline">
                {building.name}
              </Link>
            ) : (
              <span className="truncate">{building.name}</span>
            )}
            <Tag size="sm" tone="brand">
              {t('list.code', { code: building.code })}
            </Tag>
            {archived ? (
              <Tag size="sm" tone="neutral">
                {t('list.archived')}
              </Tag>
            ) : null}
          </h2>
          <p className="truncate text-ui-sm text-muted">
            {building.address || t('list.noAddress')}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-ui-sm">
        <div className="rounded-control bg-canvas p-3">
          <dt className="text-muted">{t('list.rooms')}</dt>
          <dd className="text-section font-semibold text-ink">{building.stats.roomCount}</dd>
        </div>
        <div className="rounded-control bg-canvas p-3">
          <dt className="text-muted">{t('list.occupancy')}</dt>
          <dd className="text-section font-semibold text-ink">
            {rate === null ? '—' : `${rate}%`}
          </dd>
        </div>
      </dl>

      {editable ? (
        <div className="mt-auto flex justify-end gap-1">
          <IconButton
            icon="edit"
            variant="ghost"
            label={t('list.edit', { name: building.name })}
            onClick={() => navigate(buildingEditPath(building.id))}
          />
          <IconButton
            icon="receipt"
            variant="ghost"
            label={t('list.prices', { name: building.name })}
            onClick={() => navigate(buildingPricesPath(building.id))}
          />
          <IconButton
            icon="archive"
            variant="ghost"
            label={t('list.archive', { name: building.name })}
            onClick={onArchive}
          />
        </div>
      ) : null}
    </li>
  );
}

/** O-04 Danh sách toà. With a single building the owner goes straight to its form (O-05). */
export default function BuildingsPage() {
  const { t } = useTranslation('buildings');
  const navigate = useNavigate();
  const canManage = useCanAccess('manage', 'Building');
  const [params, setParams] = useSearchParams();
  const [archiving, setArchiving] = useState<StayBuilding | null>(null);

  const status: StatusFilter = params.get('status') === 'archived' ? 'archived' : 'active';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const urlQuery = params.get('q') ?? '';
  const [search, setSearch] = useState(urlQuery);
  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS);

  const query = useBuildings({
    status,
    page,
    pageSize: PAGE_SIZE,
    ...(urlQuery ? { q: urlQuery } : {}),
  });

  const updateParams = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);

    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  };

  // Debounced search → URL (kept on reload and when shared); a new search starts at page 1.
  useEffect(() => {
    const q = debouncedSearch.trim();

    if (q === (params.get('q') ?? '')) return;

    const next = new URLSearchParams(params);

    if (q) next.set('q', q);
    else next.delete('q');
    next.delete('page');
    setParams(next, { replace: true });
  }, [debouncedSearch, params, setParams]);

  const buildings = query.data?.data ?? [];
  const meta = query.data?.meta;
  // Redirect only on fresh data: a cached count from before "Thêm toà" must not hide the new one.
  const onlyBuilding =
    canManage &&
    status === 'active' &&
    !urlQuery &&
    page === 1 &&
    !query.isStale &&
    !query.isFetching &&
    meta?.total === 1
      ? buildings[0]
      : undefined;

  if (onlyBuilding) return <Navigate to={buildingEditPath(onlyBuilding.id)} replace />;

  return (
    <div className="grid gap-6">
      <ScreenHeader title={t('list.title')} description={t('list.description')} />

      <FilterBar
        actions={
          canManage ? (
            <Button onClick={() => navigate(ROUTES.newBuilding)}>
              <Icon name="plus" className="size-4" aria-hidden />
              {t('list.add')}
            </Button>
          ) : null
        }
      >
        <div className={FILTER_WIDE}>
          <Tabs
            variant="segmented"
            label={t('list.statusFilter')}
            value={status}
            onValueChange={(value) =>
              updateParams({ status: value === 'archived' ? 'archived' : null, page: null })
            }
          >
            <TabsList>
              <TabsTrigger value="active">{t('list.status.active')}</TabsTrigger>
              <TabsTrigger value="archived">{t('list.status.archived')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Input
          type="search"
          icon="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('list.searchPlaceholder')}
          aria-label={t('list.search')}
          rootClassName={FILTER_WIDE}
        />
      </FilterBar>

      {query.isPending ? (
        <LoadingRows rows={3} />
      ) : query.isError && !query.data ? (
        <LoadError error={query.error} onRetry={() => void query.refetch()} />
      ) : buildings.length === 0 ? (
        <EmptyState
          icon="buildings"
          variant={urlQuery ? 'no-results' : 'empty'}
          title={urlQuery ? t('list.noResults') : t(`list.empty.${status}`)}
          description={urlQuery ? t('list.noResultsDescription') : undefined}
          action={
            canManage && status === 'active' && !urlQuery ? (
              <Button onClick={() => navigate(ROUTES.newBuilding)}>{t('list.add')}</Button>
            ) : null
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="building-list">
          {buildings.map((building) => (
            <BuildingCard
              key={building.id}
              building={building}
              canManage={canManage}
              onArchive={() => setArchiving(building)}
            />
          ))}
        </ul>
      )}

      {meta && meta.totalPages > 1 ? (
        <Pagination
          pageIndex={page - 1}
          pageCount={meta.totalPages}
          onPageChange={(index) => updateParams({ page: index > 0 ? String(index + 1) : null })}
          aria-label={t('list.pagination')}
          className="justify-center"
        />
      ) : null}

      <ArchiveBuildingDialog building={archiving} onClose={() => setArchiving(null)} />
    </div>
  );
}
