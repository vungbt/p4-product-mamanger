import { useRequestInbox } from '@stay/sdk/react';
import { useCanOpen } from '@/libraries/ability';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';

/** New (`pending`) tenant requests of the active building, for the "Yêu cầu" menu badge. */
export function usePendingRequestCount(): number {
  const { buildingId } = useActiveBuilding();
  const canOpen = useCanOpen({ action: 'update', subject: 'Maintenance' });
  const query = useRequestInbox(
    { buildingId: buildingId ?? undefined, status: 'pending', pageSize: 1 },
    { enabled: canOpen && Boolean(buildingId) },
  );

  return query.data?.meta.counts.find((row) => row.status === 'pending')?.count ?? 0;
}
