import { Alert, Button, type ButtonProps, Icon, IconButton } from '@itclabs/react-ui';
import { useBuilding, useContract, useInvoice, useStaySettings } from '@stay/sdk/react';
import {
  abbreviatePersonName,
  buildVietQrPayload,
  DEFAULT_BILLING_SETTINGS,
  findVietQrBank,
  type PublicInvoiceBase,
  type PublicInvoicePayee,
  type StayBuilding,
  type StayInvoice,
  TRANSFER_CONTENT_INVOICE_CODE,
  toTransferText,
} from '@stay/shared';
import { useState } from 'react';
import { LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { Overlay } from '../invoice-dialogs';
import { InvoiceCard } from './invoice-card';

/** Same limit as the API's transfer content (VietQR additional data). */
const MAX_TRANSFER_CONTENT = 50;

function payeeOf(building: StayBuilding | undefined): PublicInvoicePayee | null {
  if (!building?.bankBin || !building.bankAccount || !building.bankAccountName) return null;
  const bank = findVietQrBank(building.bankBin);

  return {
    bankBin: building.bankBin,
    bankShortName: bank?.shortName ?? null,
    bankName: bank?.name ?? null,
    accountNumber: building.bankAccount,
    accountName: building.bankAccountName,
  };
}

function transferContent(template: string, code: string): string {
  const text = template.includes(TRANSFER_CONTENT_INVOICE_CODE)
    ? template.replaceAll(TRANSFER_CONTENT_INVOICE_CODE, code)
    : `${template} ${code}`;

  return toTransferText(text).slice(0, MAX_TRANSFER_CONTENT).trim();
}

function vietQr(payee: PublicInvoicePayee | null, amount: number, content: string) {
  if (!payee || amount <= 0) return null;
  try {
    return buildVietQrPayload({
      bin: payee.bankBin,
      accountNumber: payee.accountNumber,
      amount,
      content,
    });
  } catch {
    return null;
  }
}

/**
 * The tenant view (`PublicInvoiceBase`) built from staff data, mirroring the API's public
 * invoice mapping, so the owner can preview a link before creating it.
 */
export function toPublicPreview({
  invoice,
  building,
  template,
  representativeName,
}: {
  invoice: StayInvoice;
  building: StayBuilding | undefined;
  template: string;
  representativeName: string | null | undefined;
}): PublicInvoiceBase {
  // Drafts have no code until issued; the preview says so instead of an empty code.
  const code = invoice.code ?? 'Chưa phát hành';
  const payee = payeeOf(building);
  const content = transferContent(template, invoice.code ?? '');

  return {
    buildingName: building?.name ?? '',
    buildingAddress: building?.address ?? null,
    roomCode: invoice.roomCode,
    kind: invoice.kind,
    period: invoice.period,
    code,
    status: invoice.status,
    issuedOn: invoice.issuedOn,
    dueOn: invoice.dueOn,
    overdue: invoice.overdue,
    lines: invoice.lines.map((line) => ({
      type: line.type,
      description: line.description,
      period: line.period,
      quantity: line.quantity,
      unit: line.unit,
      unitPrice: line.unitPrice,
      ratioNum: line.ratioNum,
      ratioDen: line.ratioDen,
      amount: line.amount,
      meta: {
        ...(line.meta.coveredFrom ? { coveredFrom: line.meta.coveredFrom } : {}),
        ...(line.meta.coveredTo ? { coveredTo: line.meta.coveredTo } : {}),
        ...(line.meta.startReading !== undefined ? { startReading: line.meta.startReading } : {}),
        ...(line.meta.endReading !== undefined ? { endReading: line.meta.endReading } : {}),
        ...(line.meta.segments ? { segments: line.meta.segments } : {}),
      },
    })),
    subtotal: invoice.subtotal,
    rounding: invoice.rounding,
    total: invoice.total,
    paidTotal: invoice.paidTotal,
    remaining: invoice.remaining,
    representative: representativeName ? abbreviatePersonName(representativeName) : null,
    payee,
    transferContent: content,
    vietQrPayload: vietQr(payee, invoice.remaining, content),
  };
}

function PreviewContent({ invoiceId }: { invoiceId: string }) {
  const invoice = useInvoice(invoiceId);
  const building = useBuilding(invoice.data?.buildingId ?? '');
  const contract = useContract(invoice.data?.contractId ?? '');
  const settings = useStaySettings();

  if (invoice.isPending || (invoice.data && building.isPending)) return <LoadingRows rows={3} />;
  if (!invoice.data)
    return <LoadError error={invoice.error} onRetry={() => void invoice.refetch()} />;

  const preview = toPublicPreview({
    invoice: invoice.data,
    building: building.data,
    template:
      settings.data?.transferContentTemplate ?? DEFAULT_BILLING_SETTINGS.transferContentTemplate,
    representativeName: contract.data?.primaryTenantName,
  });

  return (
    <div className="grid min-w-0 gap-3" data-testid="invoice-share-preview">
      <Alert tone="info" title="Bản xem trước">
        Người thuê sẽ thấy trang này khi mở link. Xem trước không tạo link.
      </Alert>
      <InvoiceCard invoice={preview} headingLevel={2} />
    </div>
  );
}

/** "Xem trước": the public invoice page as the tenant will see it, without creating a link. */
export function InvoicePreviewButton({
  invoiceId,
  label = 'Xem trước',
  variant = 'secondary',
  size,
  iconOnly = false,
}: {
  invoiceId: string;
  label?: string;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  /** Row action: an IconButton named by `label`. */
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {iconOnly ? (
        <IconButton
          icon="view"
          variant={variant}
          size={size}
          label={label}
          onClick={() => setOpen(true)}
        />
      ) : (
        <Button variant={variant} size={size} onClick={() => setOpen(true)}>
          <Icon name="view" className="size-4" aria-hidden />
          {label}
        </Button>
      )}
      {open ? (
        <Overlay
          title="Xem trước hoá đơn"
          description="Trang hoá đơn người thuê sẽ thấy qua link chia sẻ."
          onClose={() => setOpen(false)}
        >
          <PreviewContent invoiceId={invoiceId} />
        </Overlay>
      ) : null}
    </>
  );
}
