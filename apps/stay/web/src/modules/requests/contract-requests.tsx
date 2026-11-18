import { EmptyState } from '@itclabs/react-ui';
import { useRequestInbox } from '@stay/sdk/react';
import type { InboxItem } from '@stay/shared';
import { useState } from 'react';
import { LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { RequestDetailDialog } from './request-detail';
import { RequestList } from './request-list';

/** O-17 tab "Yêu cầu": everything the contract's tenants sent, with the inbox actions. */
export function ContractRequests({ contractId }: { contractId: string }) {
  const query = useRequestInbox({ contractId, pageSize: 20 });
  const [selected, setSelected] = useState<InboxItem | null>(null);

  const rows = query.data?.data ?? [];

  return (
    <div className="grid min-w-0 gap-3" data-testid="contract-requests">
      <h2 className="text-section font-semibold">Yêu cầu từ người thuê</h2>
      {query.isPending ? (
        <LoadingRows rows={2} />
      ) : query.isError ? (
        <LoadError error={query.error} onRetry={() => void query.refetch()} />
      ) : rows.length ? (
        <RequestList items={rows} onOpen={setSelected} showRoom={false} />
      ) : (
        <EmptyState
          title="Chưa có yêu cầu"
          description="Báo hỏng và yêu cầu từ cổng người thuê hiện ở đây."
        />
      )}
      {selected ? <RequestDetailDialog item={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
