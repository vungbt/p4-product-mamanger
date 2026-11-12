import { isoDateInTimeZone, type NotificationKind } from '@stay/shared';
import QRCode from 'qrcode';
import { InvoiceModel } from '@/sequelize/models/index.js';
import { isTenantVisible, publicInvoiceView } from '../invoices/invoices.share.js';
import type { EmailDetail, EmailMoney, EmailQr } from './email-layout.js';
import { displayDate, formatVnd } from './notifications.publish.js';
import type { EmailMessage } from './notifications.transports.js';

export interface InvoiceEmailExtras {
  money: EmailMoney | null;
  details: EmailDetail[];
  qr: EmailQr | null;
  attachments: NonNullable<EmailMessage['attachments']>;
}

const QR_CID = 'vietqr@stay';
const DAY_MS = 86_400_000;

/** "Hạn 10/11/2026 · còn 3 ngày", coloured by urgency; null once nothing is left to pay. */
export function dueChip(dueOn: string, today: string): EmailMoney['due'] {
  const days = Math.round((Date.parse(dueOn) - Date.parse(today)) / DAY_MS);
  const date = displayDate(dueOn);

  if (days < 0) return { label: `Quá hạn ${-days} ngày · hạn ${date}`, urgency: 'overdue' };
  if (days === 0) return { label: `Hạn thanh toán hôm nay · ${date}`, urgency: 'soon' };
  return { label: `Hạn ${date} · còn ${days} ngày`, urgency: days <= 3 ? 'soon' : 'ok' };
}

function periodLabel(period: string) {
  const [year, month] = period.split('-');

  return month && year ? `Tháng ${month}/${year}` : period;
}

/**
 * Amounts, due date and VietQR of the invoice behind a money notification, read at send time so
 * the email shows what is still owed. Staff emails get the amounts without a QR.
 */
export async function invoiceEmailExtras(input: {
  kind: NotificationKind;
  invoiceId: string;
  emailAmount: number | null;
  audience: 'staff' | 'tenant';
  now?: Date;
}): Promise<InvoiceEmailExtras | null> {
  const row = await InvoiceModel.findByPk(input.invoiceId);

  if (!isTenantVisible(row)) return null;
  const view = await publicInvoiceView(row);
  const today = isoDateInTimeZone(input.now ?? new Date());
  const owing = view.remaining > 0;
  const due = owing && view.dueOn ? dueChip(view.dueOn, today) : null;
  const paidNote =
    view.paidTotal > 0
      ? `Tổng hoá đơn ${formatVnd(view.total)} · đã trả ${formatVnd(view.paidTotal)}`
      : `Hoá đơn ${view.code} · ${periodLabel(view.period)}`;
  let money: EmailMoney;

  if (input.kind === 'payment.recorded' && input.emailAmount !== null)
    money = {
      label: 'Đã nhận',
      amount: formatVnd(input.emailAmount),
      note: owing ? `Còn phải trả ${formatVnd(view.remaining)}` : 'Hoá đơn đã thanh toán đủ',
      due,
    };
  else if (input.kind === 'payment_claim.created' && input.emailAmount !== null)
    money = {
      label: 'Số tiền báo đã chuyển',
      amount: formatVnd(input.emailAmount),
      note: `Hoá đơn còn phải thu ${formatVnd(view.remaining)}`,
      due,
    };
  else
    money = {
      label: view.paidTotal > 0 ? 'Còn phải thanh toán' : 'Số tiền cần thanh toán',
      amount: formatVnd(view.remaining),
      note: paidNote,
      due,
    };

  const details: EmailDetail[] = [
    { label: 'Mã hoá đơn', value: view.code },
    { label: 'Phòng', value: view.roomCode },
    { label: 'Kỳ', value: periodLabel(view.period) },
    { label: 'Tổng hoá đơn', value: formatVnd(view.total) },
  ];
  const attachments: InvoiceEmailExtras['attachments'] = [];
  let qr: EmailQr | null = null;

  if (input.audience === 'tenant' && owing && view.vietQrPayload && view.payee) {
    attachments.push({
      filename: 'vietqr.png',
      content: await QRCode.toBuffer(view.vietQrPayload, {
        type: 'png',
        width: 360,
        margin: 1,
        errorCorrectionLevel: 'M',
      }),
      cid: QR_CID,
      contentType: 'image/png',
    });
    qr = {
      cid: QR_CID,
      rows: [
        {
          label: 'Ngân hàng',
          value: view.payee.bankShortName ?? view.payee.bankName ?? view.payee.bankBin,
        },
        { label: 'Số tài khoản', value: view.payee.accountNumber },
        { label: 'Chủ tài khoản', value: view.payee.accountName },
        { label: 'Số tiền', value: formatVnd(view.remaining) },
        { label: 'Nội dung', value: view.transferContent },
      ],
    };
  }
  return { money, details, qr, attachments };
}
