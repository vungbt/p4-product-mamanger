import { cn } from '@itclabs/react-ui';
import type { components } from '@stay/sdk/shared';
import { ROOM_STATUS_FILTERS, type RoomStatus } from '@stay/shared';
import { useTranslation } from 'react-i18next';

export type Room = components['schemas']['StayRoom'];
export type RoomDetail = components['schemas']['StayRoomDetail'];

/** Fixed status colours of screens.md O-07: vacant grey, reserved yellow, occupied green, maintenance orange. */
export const ROOM_STATUS_STYLES: Record<
  RoomStatus,
  { surface: string; accent: string; text: string }
> = {
  vacant: { surface: 'bg-surface', accent: 'bg-control-border', text: 'text-muted' },
  reserved: { surface: 'bg-warning-50', accent: 'bg-warning-700', text: 'text-warning-700' },
  occupied: { surface: 'bg-success-50', accent: 'bg-success-700', text: 'text-success-700' },
  maintenance: { surface: 'bg-caution-50', accent: 'bg-caution-700', text: 'text-caution-700' },
};

export const ROOM_STATUSES_IN_ORDER: readonly RoomStatus[] = ROOM_STATUS_FILTERS;

export function isRoomStatus(value: unknown): value is RoomStatus {
  return ROOM_STATUSES_IN_ORDER.some((status) => status === value);
}

/** Status label with its colour dot; the colour is never the only cue. */
export function RoomStatusBadge({ status, className }: { status: RoomStatus; className?: string }) {
  const { t } = useTranslation();

  const style = ROOM_STATUS_STYLES[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-ui-sm font-medium',
        style.text,
        className,
      )}
      data-status={status}
    >
      <span aria-hidden className={cn('size-2 shrink-0 rounded-full', style.accent)} />
      {t(`rooms.status.${status}`)}
    </span>
  );
}

/** Colour legend shown at the end of the room map. */
export function RoomStatusLegend() {
  const { t } = useTranslation();

  return (
    <section aria-labelledby="room-legend-title" className="rounded-panel border border-line p-4">
      <h2 id="room-legend-title" className="text-ui-sm font-semibold text-ink">
        {t('rooms.map.legend')}
      </h2>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
        {ROOM_STATUSES_IN_ORDER.map((status) => (
          <li key={status} className="flex items-center gap-2 text-ui-sm text-ink">
            <span
              aria-hidden
              className={cn(
                'size-4 rounded border border-line',
                ROOM_STATUS_STYLES[status].surface,
              )}
            >
              <span
                className={cn('block h-full w-1 rounded-l', ROOM_STATUS_STYLES[status].accent)}
              />
            </span>
            {t(`rooms.status.${status}`)}
          </li>
        ))}
      </ul>
    </section>
  );
}
