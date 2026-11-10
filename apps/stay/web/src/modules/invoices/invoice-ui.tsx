import { Button, Tag, type TagTone, Tooltip } from '@itclabs/react-ui';
import { formatNumber } from '@itclabs/react-ui/format';
import { ApiSdkError, getErrorMessage } from '@stay/sdk/shared';
import {
  type BillingExclusionReason,
  type BillingPreviewRow,
  type InvoiceKind,
  type InvoiceStatus,
  isIsoDate,
  isPeriod,
  type StayInvoiceLine,
  type StayInvoiceSummary,
} from '@stay/shared';
import { useTranslation } from 'react-i18next';
import { displayDate, formatVnd } from '@/libraries/format';

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Nháp',
  issued: 'Chưa thu',
  partially_paid: 'Thu một phần',
  paid: 'Đã thu',
  void: 'Đã huỷ',
};

const STATUS_TONES: Record<InvoiceStatus, TagTone> = {
  draft: 'neutral',
  issued: 'info',
  partially_paid: 'warning',
  paid: 'success',
  void: 'neutral',
};

export const INVOICE_KIND_LABELS: Record<InvoiceKind, string> = {
  monthly: 'Kỳ',
  move_in: 'Nhận phòng',
  settlement: 'Thanh lý',
};

const METER_LABELS = { electricity: 'điện', water: 'nước' };

/** `YYYY-MM` → `MM/YYYY` (screens.md: kỳ `11/2026`). */
export function displayPeriod(period: string): string {
  return isPeriod(period) ? `${period.slice(5)}/${period.slice(0, 4)}` : period;
}

export const invoicePath = (id: string) => `/invoices/${id}`;
export const billingRunPath = (period: string) => `/invoices/run?period=${period}`;

/** Status with its colour; an overdue invoice reads "Quá hạn" in the danger tone. */
export function InvoiceStatusTag({
  invoice,
}: {
  invoice: Pick<StayInvoiceSummary, 'status' | 'overdue'>;
}) {
  return invoice.overdue ? (
    <Tag tone="danger" size="sm" data-status="overdue">
      Quá hạn
    </Tag>
  ) : (
    <Tag tone={STATUS_TONES[invoice.status]} size="sm" data-status={invoice.status}>
      {INVOICE_STATUS_LABELS[invoice.status]}
    </Tag>
  );
}

/** Vietnamese reason of a contract excluded from the billing run. */
export function exclusionLabel(
  reason: BillingExclusionReason,
  detail: BillingPreviewRow['reasonDetail'],
): string {
  const meter = detail?.kind ? ` ${METER_LABELS[detail.kind]}` : '';
  const month = detail?.period ? ` tháng ${displayPeriod(detail.period)}` : '';

  switch (reason) {
    case 'missing_reading':
      return `Thiếu chỉ số${meter}${month}`;
    case 'missing_meter':
      return `Phòng chưa có đồng hồ${meter}`;
    case 'negative_consumption':
      return `Chỉ số${meter} mới nhỏ hơn số cũ`;
    case 'already_issued':
      return 'Đã phát hành hoá đơn kỳ này';
    case 'move_in_invoice':
      return 'Đã có hoá đơn nhận phòng trong kỳ';
    case 'no_occupancy':
      return 'Không ở ngày nào trong kỳ';
    case 'invalid_data':
      return 'Dữ liệu tính tiền không hợp lệ';
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  version_conflict: 'Dữ liệu đã thay đổi, tải lại?',
  invoice_not_draft: 'Hoá đơn không còn là bản nháp. Tải lại để xem trạng thái mới.',
  invoice_readings_changed:
    'Chỉ số điện nước đã thay đổi sau khi lập nháp. Bấm "Tạo bản nháp" để làm mới rồi phát hành lại.',
  invoice_total_mismatch: 'Tổng các dòng không khớp tổng hoá đơn. Hãy làm mới bản nháp.',
  invoice_line_not_manual: 'Chỉ xoá được dòng thêm tay.',
  invoice_sequence_exhausted: 'Đã hết số hoá đơn của kỳ (tối đa 999).',
  invoice_already_void: 'Hoá đơn đã bị huỷ.',
  invoice_has_payments: 'Hoá đơn đã có thanh toán, không thể void.',
  move_in_invoice_exists: 'Hợp đồng đã có hoá đơn nhận phòng.',
  period_already_invoiced: 'Tháng bắt đầu của hợp đồng đã có hoá đơn kỳ.',
  contract_not_active: 'Hợp đồng chưa có hiệu lực.',
  building_archived: 'Toà nhà đã lưu trữ.',
};

/** Invoice API errors in Vietnamese (the API returns error codes for conflicts). */
export function invoiceErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiSdkError && error.code) {
    const known = ERROR_MESSAGES[error.code];

    if (known) return known;
    if (error.code.startsWith('billing_')) {
      const reason = error.code.slice('billing_'.length);
      const match = [
        'missing_reading',
        'missing_meter',
        'negative_consumption',
        'already_issued',
        'move_in_invoice',
        'no_occupancy',
        'invalid_data',
      ].find((value): value is BillingExclusionReason => value === reason);

      if (match) return exclusionLabel(match, null);
    }
  }
  return getErrorMessage(error, fallback);
}

const number = (value: number) => formatNumber(value, { locale: 'vi-VN' });
const shortDate = (date: string) => displayDate(date).slice(0, 5);

/** i18n description parameters as the UI shows them (periods `MM/YYYY`, dates `dd/MM/yyyy`). */
function descriptionParams(params: Record<string, string | number>) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === 'number') return [key, number(value)];
      if (isPeriod(value)) return [key, displayPeriod(value)];
      if (isIsoDate(value)) return [key, displayDate(value)];
      return [key, value];
    }),
  );
}

export function useLineDescription() {
  const { t } = useTranslation('invoices');

  return (line: StayInvoiceLine) =>
    t(line.description.key, {
      ...descriptionParams(line.description.params),
      defaultValue: line.type,
    });
}

/** How a line was computed, e.g. "(1.250 − 1.130) kWh × 3.500 ₫" or "3.000.000 ₫ × 20/30 ngày". */
export function lineFormula(line: StayInvoiceLine): string | null {
  if (line.unitPrice === null) return null;
  const unit = line.unit ? ` ${line.unit}` : '';

  if (line.type === 'electricity' || line.type === 'water') {
    const segments =
      line.meta.segments ??
      (line.meta.startReading !== undefined && line.meta.endReading !== undefined
        ? [{ startReading: line.meta.startReading, endReading: line.meta.endReading }]
        : []);

    if (!segments.length) return `${number(line.quantity)}${unit} × ${formatVnd(line.unitPrice)}`;
    const usage = segments
      .map((segment) => `(${number(segment.endReading)} − ${number(segment.startReading)})`)
      .join(' + ');

    return `${usage}${unit} × ${formatVnd(line.unitPrice)}`;
  }

  if (line.type === 'rent' || line.type === 'service' || line.type === 'refund') {
    const parts = [formatVnd(line.unitPrice)];

    if (line.type !== 'rent' && line.quantity !== 1) parts.push(`${number(line.quantity)}${unit}`);
    const partial =
      line.ratioNum !== null && line.ratioDen !== null && line.ratioNum !== line.ratioDen;

    if (partial) parts.push(`${line.ratioNum}/${line.ratioDen} ngày`);
    const covered =
      partial && line.meta.coveredFrom && line.meta.coveredTo
        ? ` (${shortDate(line.meta.coveredFrom)}–${shortDate(line.meta.coveredTo)})`
        : '';

    return `${parts.join(' × ')}${covered}${partial ? '' : line.type === 'rent' ? ' · cả tháng' : ''}`;
  }

  return null;
}

/** Start/end readings of a metered line ("Chỉ số đầu 1.130 · cuối 1.250"). */
export function lineReadings(line: StayInvoiceLine): string | null {
  const { startReading, endReading } = line.meta;

  if (startReading === undefined || endReading === undefined) return null;
  return `Chỉ số đầu ${number(startReading)} · cuối ${number(endReading)}${line.meta.roomId ? ' · phòng cũ' : ''}`;
}

/** ST-15/ST-16 actions: shown disabled with a "Sắp có" tooltip (focusable wrapper). */
export function ComingSoonButton({ children }: { children: string }) {
  return (
    <Tooltip content="Sắp có">
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: a disabled button cannot receive focus; the wrapper keeps the tooltip reachable by keyboard. */}
      <span tabIndex={0} className="inline-flex rounded-control">
        <Button variant="secondary" disabled>
          {children}
        </Button>
      </span>
    </Tooltip>
  );
}
