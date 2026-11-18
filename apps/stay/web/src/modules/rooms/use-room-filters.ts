import { ROOM_FLOOR_MAX, ROOM_FLOOR_MIN, type RoomStatus } from '@stay/shared';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { latestSearchParams } from '@/libraries/search-params';
import { isRoomStatus } from './room-status';

/** The room map shows a whole building on one page; larger ones paginate. */
export const ROOM_MAP_PAGE_SIZE = 100;

export type RoomFilters = {
  q: string;
  status: RoomStatus | null;
  floor: number | null;
  page: number;
};

function readFloor(value: string | null): number | null {
  const floor = value === null || value === '' ? Number.NaN : Number(value);

  return Number.isInteger(floor) && floor >= ROOM_FLOOR_MIN && floor <= ROOM_FLOOR_MAX
    ? floor
    : null;
}

/** Room map filters kept in the URL (`?q=&status=&floor=&page=`), so reload and links keep them. */
export function useRoomFilters() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo<RoomFilters>(() => {
    const status = params.get('status');
    const page = Number(params.get('page'));

    return {
      q: params.get('q')?.trim() ?? '',
      status: isRoomStatus(status) ? status : null,
      floor: readFloor(params.get('floor')),
      page: Number.isInteger(page) && page > 1 ? page : 1,
    };
  }, [params]);

  /** Changing a filter returns to the first page. */
  const setFilters = useCallback(
    (changes: Partial<RoomFilters>) => {
      setParams(
        () => {
          const next = latestSearchParams();
          const merged = { ...filters, page: 1, ...changes };

          for (const [key, value] of Object.entries(merged)) {
            if (value === null || value === '' || (key === 'page' && value === 1)) next.delete(key);
            else next.set(key, String(value));
          }
          return next;
        },
        { replace: true },
      );
    },
    [filters, setParams],
  );

  const clearFilters = useCallback(() => setParams({}, { replace: true }), [setParams]);

  const hasFilters = Boolean(filters.q || filters.status || filters.floor !== null);

  return { filters, setFilters, clearFilters, hasFilters };
}
