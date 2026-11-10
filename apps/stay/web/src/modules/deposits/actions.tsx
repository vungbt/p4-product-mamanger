import { IconButton } from '@itclabs/react-ui';
import type { ContractStatus, DepositInput } from '@stay/shared';
import { useState } from 'react';
import { useCanOn } from '@/libraries/ability';
import { DEPOSIT_ACTIONS, DepositEntryDialog } from './entry-dialog';

export function DepositActions({
  contractId,
  buildingId,
  status,
}: {
  contractId: string;
  buildingId: string;
  status: ContractStatus;
}) {
  const canManage = useCanOn('manage', 'Deposit', { buildingId, contractId });
  const [type, setType] = useState<DepositInput['type'] | null>(null);

  if (!canManage || status === 'draft' || status === 'cancelled') return null;

  return (
    <>
      <div className="flex gap-1">
        {DEPOSIT_ACTIONS.map((action) => (
          <IconButton
            key={action.value}
            icon={action.icon}
            label={action.label}
            variant="ghost"
            onClick={() => setType(action.value)}
          />
        ))}
      </div>
      {type && (
        <DepositEntryDialog contractId={contractId} type={type} onClose={() => setType(null)} />
      )}
    </>
  );
}
