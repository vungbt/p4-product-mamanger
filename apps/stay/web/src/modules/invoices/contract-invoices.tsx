import { Button } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useCreateMoveInInvoice, useInvoices } from '@stay/sdk/react';
import type { StayContract } from '@stay/shared';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCanOn } from '@/libraries/ability';
import { formatVnd } from '@/libraries/format';
import { FormError, LoadError, LoadingRows } from '@/libraries/forms/page-states';
import {
  displayPeriod,
  INVOICE_KIND_LABELS,
  InvoiceStatusTag,
  invoiceErrorMessage,
  invoicePath,
} from './invoice-ui';

/** O-17 tab "Hoá đơn": the contract's invoices and, when missing, its move-in invoice. */
export function ContractInvoices({ contract }: { contract: StayContract }) {
  const query = useInvoices({
    contractId: contract.id,
    pageSize: 100,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const createMoveIn = useCreateMoveInInvoice();
  const canCreate = useCanOn('create', 'Invoice', {
    buildingId: contract.buildingId,
    contractId: contract.id,
  });
  const [error, setError] = useState<string | null>(null);

  if (query.isPending) return <LoadingRows rows={2} />;
  if (query.isError) return <LoadError error={query.error} onRetry={() => void query.refetch()} />;

  const invoices = query.data.data;
  const hasMoveIn = invoices.some(
    (invoice) => invoice.kind === 'move_in' && invoice.status !== 'void',
  );
  const canCreateMoveIn =
    canCreate && !hasMoveIn && (contract.status === 'active' || contract.status === 'ending');

  const create = async () => {
    setError(null);
    try {
      await createMoveIn.mutateAsync(contract.id);
      toast.success('Đã tạo bản nháp hoá đơn nhận phòng.');
    } catch (cause) {
      setError(invoiceErrorMessage(cause, 'Không thể tạo hoá đơn nhận phòng.'));
    }
  };

  return (
    <div className="grid min-w-0 gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-section font-semibold">Hoá đơn</h2>
        {canCreateMoveIn ? (
          <Button loading={createMoveIn.isPending} onClick={() => void create()}>
            Tạo hoá đơn nhận phòng
          </Button>
        ) : null}
      </div>
      <FormError message={error} />
      {!invoices.length ? (
        <p className="text-muted">Hợp đồng chưa có hoá đơn.</p>
      ) : (
        <ul className="grid divide-y divide-line" aria-label="Hoá đơn của hợp đồng">
          {invoices.map((invoice) => (
            <li
              key={invoice.id}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3"
              data-testid="contract-invoice"
            >
              <div className="grid min-w-0 gap-0.5">
                <Link className="font-semibold text-accent underline" to={invoicePath(invoice.id)}>
                  {invoice.code ?? 'Nháp'}
                </Link>
                <span className="text-ui-sm text-muted">
                  {INVOICE_KIND_LABELS[invoice.kind]} · Kỳ {displayPeriod(invoice.period)} · Phòng{' '}
                  {invoice.roomCode}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="whitespace-nowrap">
                  {formatVnd(invoice.total)}
                  {invoice.remaining > 0 &&
                  invoice.status !== 'draft' &&
                  invoice.status !== 'void' ? (
                    <span className={invoice.overdue ? 'text-danger-700' : 'text-muted'}>
                      {' '}
                      · còn {formatVnd(invoice.remaining)}
                    </span>
                  ) : null}
                </span>
                <InvoiceStatusTag invoice={invoice} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
