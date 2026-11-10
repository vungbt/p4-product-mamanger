import { Tag } from '@itclabs/react-ui';
import { ApiSdkError } from '@stay/sdk/shared';
import type { PaymentMethod, StayInvoiceSummary, StayPayment } from '@stay/shared';
import { formatVnd } from '@/libraries/format';
import { invoiceErrorMessage } from '../invoices/invoice-ui';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  other: 'Khác',
};

export const PAYMENT_METHOD_OPTIONS = (Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(
  (value) => ({ value, label: PAYMENT_METHOD_LABELS[value] }),
);

/** Issued invoices with something left to collect (the "Thu tiền" action). */
export function isCollectable(invoice: Pick<StayInvoiceSummary, 'status' | 'remaining'>) {
  return (
    (invoice.status === 'issued' || invoice.status === 'partially_paid') && invoice.remaining > 0
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  invoice_not_issued: 'Hoá đơn chưa phát hành, chưa thể thu tiền.',
  invoice_void: 'Hoá đơn đã void, không nhận thanh toán.',
  invoice_already_paid: 'Hoá đơn đã thu đủ. Tải lại để xem trạng thái mới.',
  payment_already_reversed: 'Bút toán thu đã được huỷ trước đó.',
  idempotency_conflict: 'Yêu cầu thu tiền đã được gửi với nội dung khác. Đóng và mở lại hộp thoại.',
};

/** Payment API errors in Vietnamese (codes for conflicts), else the invoice messages. */
export function paymentErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiSdkError && error.code && ERROR_MESSAGES[error.code])
    return ERROR_MESSAGES[error.code] ?? fallback;
  return invoiceErrorMessage(error, fallback);
}

/** `payment_exceeds_remaining` (422): the remaining amount the API reported, if any. */
export function exceededRemaining(error: unknown): number | null {
  if (!(error instanceof ApiSdkError) || error.code !== 'payment_exceeds_remaining') return null;
  const body = error.data;
  const extensions =
    body && typeof body === 'object' && 'extensions' in body ? body.extensions : undefined;
  const remaining =
    extensions && typeof extensions === 'object' && 'remaining' in extensions
      ? extensions.remaining
      : undefined;

  return typeof remaining === 'number' ? remaining : -1;
}

export function overpayMessage(remaining: number) {
  return remaining >= 0
    ? `Số tiền vượt số còn lại (${formatVnd(remaining)}).`
    : 'Số tiền vượt số còn lại của hoá đơn.';
}

export function PaymentStatusTag({ payment }: { payment: Pick<StayPayment, 'status'> }) {
  return payment.status === 'reversed' ? (
    <Tag tone="neutral" size="sm" data-payment-badge="reversed">
      Đã huỷ
    </Tag>
  ) : (
    <Tag tone="success" size="sm" data-payment-badge="recorded">
      Đã ghi
    </Tag>
  );
}
