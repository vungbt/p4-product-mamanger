import {
  Alert,
  Button,
  cn,
  EmptyState,
  Input,
  PageHeader,
  Pagination,
  Select,
  Skeleton,
  useDebouncedCallback,
} from '@itclabs/react-ui';
import { useRoomSummary, useRooms } from '@stay/sdk/react';
import { getErrorMessage, type RoomListQuery } from '@stay/sdk/shared';
import type { RoomStatus } from '@stay/shared';
import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useCanAccess, useCanOn } from '@/libraries/ability';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { ROUTES } from '@/routing/route-configs';
import { RoomPaymentDialog } from '../payments/payment-dialog';
import { MaintenanceDialog } from './components/maintenance-dialog';
import { RoomTile } from './components/room-tile';
import {
  ROOM_STATUS_STYLES,
  ROOM_STATUSES_IN_ORDER,
  type Room,
  RoomStatusLegend,
} from './room-status';
import { ROOM_MAP_PAGE_SIZE, useRoomFilters } from './use-room-filters';

const SEARCH_DEBOUNCE_MS = 300;

/** Rooms of the page grouped by floor, floors ascending (the API sorts by floor, then code). */
function groupByFloor(rooms: readonly Room[]) {
  const floors = new Map<number, Room[]>();

  for (const room of rooms) floors.set(room.floor, [...(floors.get(room.floor) ?? []), room]);
  return [...floors.entries()].sort(([a], [b]) => a - b);
}

function MapSkeleton() {
  return (
    <div className="grid gap-3" role="status" aria-busy="true">
      {[0, 1].map((floor) => (
        <div key={floor} className="grid gap-2">
          <Skeleton className="h-5 w-24" />
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {[0, 1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-14 sm:h-28" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** O-07 Sơ đồ phòng: the active building's rooms by floor, with status colours and filters. */
export default function RoomMapPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { building, buildingId } = useActiveBuilding();
  const { filters, setFilters, clearFilters } = useRoomFilters();
  const canManage = useCanAccess('manage', 'Room');
  const [search, setSearch] = useState(filters.q);
  const [maintenanceRoom, setMaintenanceRoom] = useState<Room | null>(null);
  const [collectRoom, setCollectRoom] = useState<Room | null>(null);
  const canPay = useCanOn('create', 'Payment', { buildingId: buildingId ?? undefined });

  const query: RoomListQuery = {
    page: filters.page,
    pageSize: ROOM_MAP_PAGE_SIZE,
    ...(filters.q ? { q: filters.q } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.floor !== null ? { floor: filters.floor } : {}),
  };
  const rooms = useRooms(buildingId ?? '', query);
  const summary = useRoomSummary(buildingId ?? '');

  // Keep the box in step with the URL (back/forward, "clear filters").
  useEffect(() => setSearch(filters.q), [filters.q]);

  const applySearch = useDebouncedCallback((value: string) => {
    setFilters({ q: value.trim() });
  }, SEARCH_DEBOUNCE_MS);

  const changeSearch = (value: string) => {
    setSearch(value);
    applySearch(value);
  };

  const toggleStatus = (status: RoomStatus) => {
    setFilters({ status: filters.status === status ? null : status });
  };

  const reload = () => {
    void rooms.refetch();
    void summary.refetch();
  };

  const counts = summary.data?.counts;
  const floors = summary.data?.floors ?? [];
  const groups = groupByFloor(rooms.data?.data ?? []);
  const pageCount = rooms.data?.meta.totalPages ?? 1;
  const buildingEmpty = summary.data?.total === 0;

  const statusOptions = ROOM_STATUSES_IN_ORDER.map((status) => ({
    value: status,
    label: t(`rooms.status.${status}`),
  }));
  const floorOptions = floors.map((floor) => ({
    value: String(floor),
    label: t('rooms.map.floor', { floor }),
  }));

  const actions = canManage ? (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={() => navigate(ROUTES.roomBulk)}>
        {t('rooms.actions.bulk')}
      </Button>
      <Button onClick={() => navigate(ROUTES.roomNew)}>{t('rooms.actions.create')}</Button>
    </div>
  ) : null;

  let content: ReactNode;

  if (!buildingId || rooms.isPending || summary.isPending) content = <MapSkeleton />;
  else if (rooms.isError || summary.isError)
    content = (
      <Alert
        tone="danger"
        title={t('errors.loadFailed')}
        action={
          <Button variant="secondary" size="sm" onClick={reload}>
            {t('errors.retry')}
          </Button>
        }
      >
        {getErrorMessage(rooms.error ?? summary.error, t('errors.loadFailed'))}
      </Alert>
    );
  else if (buildingEmpty)
    content = (
      <EmptyState
        icon="building"
        title={t('rooms.map.emptyTitle')}
        description={t('rooms.map.emptyDescription')}
        action={
          canManage ? (
            <Button onClick={() => navigate(ROUTES.roomBulk)}>{t('rooms.actions.bulk')}</Button>
          ) : undefined
        }
        secondaryAction={
          canManage ? (
            <Button variant="secondary" onClick={() => navigate(ROUTES.roomNew)}>
              {t('rooms.actions.create')}
            </Button>
          ) : undefined
        }
        data-testid="rooms-empty"
      />
    );
  else if (!groups.length)
    content = (
      <EmptyState
        variant="no-results"
        title={t('rooms.map.noResults')}
        description={t('rooms.map.noResultsDescription')}
        action={
          <Button variant="secondary" onClick={clearFilters}>
            {t('rooms.map.clearFilters')}
          </Button>
        }
      />
    );
  else
    content = (
      <div className={cn('grid gap-5', rooms.isPlaceholderData && 'opacity-60')}>
        {groups.map(([floor, floorRooms]) => (
          <section key={floor} aria-labelledby={`floor-${floor}`} data-testid="room-floor">
            <h2 id={`floor-${floor}`} className="mb-2 text-ui-sm font-semibold text-muted">
              {t('rooms.map.floor', { floor })}
              <span className="font-normal">
                {' '}
                · {t('rooms.map.roomCount', { count: floorRooms.length })}
              </span>
            </h2>
            <ul className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {floorRooms.map((room) => (
                <RoomTile
                  key={room.id}
                  room={room}
                  canManage={canManage}
                  onMaintenance={setMaintenanceRoom}
                  onCollect={canPay ? setCollectRoom : undefined}
                />
              ))}
            </ul>
          </section>
        ))}
        {pageCount > 1 ? (
          <Pagination
            pageIndex={filters.page - 1}
            pageCount={pageCount}
            onPageChange={(index) => setFilters({ ...filters, page: index + 1 })}
            aria-label={t('rooms.map.pages')}
          />
        ) : null}
      </div>
    );

  return (
    <div className="grid gap-5">
      <PageHeader
        title={t('nav.rooms')}
        description={building ? t('rooms.map.description', { building: building.name }) : undefined}
        action={actions}
      />

      {counts && !buildingEmpty ? (
        <fieldset className="grid gap-2">
          <legend className="sr-only">{t('rooms.map.countsLabel')}</legend>
          <p className="text-ui-sm text-muted" data-testid="room-total">
            {t('rooms.map.total', { count: summary.data?.total ?? 0 })}
          </p>
          <div className="flex flex-wrap gap-2">
            {ROOM_STATUSES_IN_ORDER.map((status) => (
              <button
                key={status}
                type="button"
                aria-pressed={filters.status === status}
                onClick={() => toggleStatus(status)}
                className={cn(
                  'flex items-center gap-2 rounded-control border px-3 py-1.5 text-ui-sm transition-colors',
                  ROOM_STATUS_STYLES[status].surface,
                  filters.status === status ? 'border-accent ring-1 ring-accent' : 'border-line',
                )}
                data-testid={`room-count-${status}`}
              >
                <span
                  aria-hidden
                  className={cn('size-2 rounded-full', ROOM_STATUS_STYLES[status].accent)}
                />
                <span className="text-ink">{t(`rooms.status.${status}`)}</span>
                <span className="font-semibold text-ink">{counts[status]}</span>
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      {!buildingEmpty ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            rootClassName="sm:flex-1"
            type="search"
            icon="search"
            value={search}
            onChange={(event) => changeSearch(event.target.value)}
            placeholder={t('rooms.map.searchPlaceholder')}
            aria-label={t('rooms.map.search')}
            clearable
            onClear={() => changeSearch('')}
            data-testid="room-search"
          />
          <Select
            aria-label={t('rooms.map.statusFilter')}
            placeholder={t('rooms.map.allStatuses')}
            options={statusOptions}
            value={filters.status}
            onValueChange={(value) =>
              setFilters({
                status: ROOM_STATUSES_IN_ORDER.find((status) => status === value) ?? null,
              })
            }
            clearable
            rootClassName="sm:w-48"
            data-testid="room-status-filter"
          />
          <Select
            aria-label={t('rooms.map.floorFilter')}
            placeholder={t('rooms.map.allFloors')}
            options={floorOptions}
            value={filters.floor === null ? null : String(filters.floor)}
            onValueChange={(value) => setFilters({ floor: value === null ? null : Number(value) })}
            clearable
            rootClassName="sm:w-48"
            data-testid="room-floor-filter"
          />
        </div>
      ) : null}

      {content}

      {!buildingEmpty && counts ? <RoomStatusLegend /> : null}

      <MaintenanceDialog
        room={maintenanceRoom}
        onClose={() => setMaintenanceRoom(null)}
        onReload={reload}
      />
      {collectRoom ? (
        <RoomPaymentDialog
          roomId={collectRoom.id}
          roomCode={collectRoom.code}
          onClose={() => setCollectRoom(null)}
        />
      ) : null}
    </div>
  );
}
