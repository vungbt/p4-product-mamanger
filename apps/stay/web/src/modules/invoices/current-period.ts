import { settingsQueryOptions, useBuilding, useStaySdk } from '@stay/sdk/react';
import { currentBillingPeriod, DEFAULT_BILLING_SETTINGS, type Period } from '@stay/shared';
import { useQuery } from '@tanstack/react-query';
import { useCanOpen } from '@/libraries/ability';
import { todayIsoDate } from '@/libraries/format';

/**
 * The building's current billing period, by the overview's rule (`currentBillingPeriod`): the
 * latest month whose issue day is on or before today (Asia/Ho_Chi_Minh). The issue day is the
 * building's, else the system setting; managers cannot read system settings, so they fall back
 * to the system default (`DEFAULT_BILLING_SETTINGS`). `undefined` while it loads.
 */
export function useCurrentBillingPeriod(buildingId: string | null): Period | undefined {
  const canReadSettings = useCanOpen({ action: 'read', subject: 'Settings' });
  const building = useBuilding(buildingId ?? '');
  const own = building.data?.issueDay ?? null;
  const settings = useQuery({
    ...settingsQueryOptions(useStaySdk()).billing(),
    enabled: canReadSettings && !building.isPending && own === null,
  });

  if (!buildingId || building.isPending) return undefined;
  if (own !== null) return currentBillingPeriod(todayIsoDate(), own);
  if (canReadSettings && settings.isPending) return undefined;
  return currentBillingPeriod(
    todayIsoDate(),
    settings.data?.issueDay ?? DEFAULT_BILLING_SETTINGS.issueDay,
  );
}
