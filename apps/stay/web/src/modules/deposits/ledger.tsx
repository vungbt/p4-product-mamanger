import { Skeleton } from '@itclabs/react-ui';
import { useDepositLedger } from '@stay/sdk/react';
import type { ContractStatus } from '@stay/shared';
import { displayDate, formatVnd } from '@/libraries/format';
import { LoadError } from '@/modules/contracts/contract-ui';
import { DepositActions } from './actions';

const LABELS = {
  received: 'Thu cọc',
  refunded: 'Hoàn cọc',
  forfeited: 'Mất cọc',
  applied: 'Cấn trừ thanh lý',
};
const METHODS = { cash: 'Tiền mặt', bank_transfer: 'Chuyển khoản', other: 'Khác' };

export function DepositLedger({
  contractId,
  buildingId,
  status,
}: {
  contractId: string;
  buildingId: string;
  status: ContractStatus;
}) {
  const query = useDepositLedger(contractId);

  if (query.isPending) return <Skeleton className="h-40" />;
  if (!query.data) return <LoadError error={query.error} retry={() => void query.refetch()} />;

  return (
    <div className="grid min-w-0 gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Cọc đang giữ: {formatVnd(query.data.balance.held)}</h2>
        <DepositActions contractId={contractId} buildingId={buildingId} status={status} />
      </div>
      <p>
        Đã thu: {formatVnd(query.data.balance.received)} · Đã hoàn:{' '}
        {formatVnd(query.data.balance.refunded)} · Mất cọc:{' '}
        {formatVnd(query.data.balance.forfeited)} · Cấn trừ: {formatVnd(query.data.balance.applied)}
      </p>
      {!query.data.entries.length ? (
        <p className="text-muted">Chưa có bút toán cọc.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left" aria-label="Lịch sử bút toán cọc">
            <thead>
              <tr>
                {['Ngày', 'Loại', 'Số tiền', 'Phương thức', 'Lý do'].map((label) => (
                  <th className="p-2" key={label}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {query.data.entries.map((entry) => (
                <tr key={entry.id} className="border-t border-line">
                  <td className="whitespace-nowrap p-2">{displayDate(entry.occurredOn)}</td>
                  <td className="p-2">{LABELS[entry.type]}</td>
                  <td className="whitespace-nowrap p-2">{formatVnd(entry.amount)}</td>
                  <td className="p-2">
                    {entry.type === 'applied' ? 'Cấn trừ' : METHODS[entry.method]}
                  </td>
                  <td className="max-w-64 whitespace-pre-wrap break-words p-2">
                    {entry.note ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
