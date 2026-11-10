import { Alert, Skeleton } from '@itclabs/react-ui';
import { useMoveInPreview } from '@stay/sdk/react';
import { formatVnd } from '@/libraries/format';
import { LoadError } from './contract-ui';

export function MoveInPreview({ id }: { id: string }) {
  const query = useMoveInPreview(id);

  if (query.isPending) return <Skeleton className="h-40" />;
  if (query.isError) return <LoadError error={query.error} retry={() => void query.refetch()} />;
  const invoice = query.data;

  return (
    <section className="grid gap-3" data-testid="move-in-preview">
      <h2 className="text-section font-semibold">
        Tiền nhận phòng · {invoice.period.split('-').reverse().join('/')}
      </h2>
      <p className="text-ui-sm text-muted">
        {invoice.occupantCount} người · {invoice.vehicleCount} xe. Hoá đơn sẽ được lập ở chức năng
        hoá đơn.
      </p>
      {invoice.warnings.map((w) => (
        <Alert key={w} tone="warning">
          {w}
        </Alert>
      ))}
      <ul className="divide-y divide-line">
        {invoice.lines.map((line, index) => (
          <li
            key={`${line.type}-${line.serviceId ?? index}`}
            className="flex flex-wrap justify-between gap-2 py-3"
          >
            <div>
              <p>{line.label}</p>
              {line.unitPrice !== null && (
                <p className="text-ui-sm text-muted">
                  {formatVnd(line.unitPrice)} × {line.quantity}
                  {line.ratioNum !== null && line.ratioDen !== null
                    ? ` × ${line.ratioNum}/${line.ratioDen}`
                    : ''}
                </p>
              )}
            </div>
            <strong>{formatVnd(line.amount)}</strong>
          </li>
        ))}
      </ul>
      <p className="flex justify-between gap-2 text-section font-bold">
        <span>Tổng</span>
        <span>{formatVnd(invoice.total)}</span>
      </p>
      <p className="text-ui-sm text-muted">Không gồm cọc và điện nước.</p>
    </section>
  );
}
