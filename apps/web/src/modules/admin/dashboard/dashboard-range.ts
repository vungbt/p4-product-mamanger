import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export const DASHBOARD_RANGES = [7, 30, 90] as const;

export type DashboardRange = (typeof DASHBOARD_RANGES)[number];

const DEFAULT_RANGE: DashboardRange = 30;

function parseRange(value: string | null): DashboardRange {
  return DASHBOARD_RANGES.find((range) => String(range) === value) ?? DEFAULT_RANGE;
}

/** The selected range lives in the URL so the shell header and the page stay in sync. */
export function useDashboardRange() {
  const [params, setParams] = useSearchParams();

  const days = parseRange(params.get('range'));

  const setDays = useCallback(
    (next: DashboardRange) => {
      setParams(
        (current) => {
          const updated = new URLSearchParams(current);

          updated.set('range', String(next));
          return updated;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return { days, setDays };
}
