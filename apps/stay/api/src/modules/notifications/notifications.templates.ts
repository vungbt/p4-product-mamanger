import type { NotificationKind } from '@stay/shared';
import { webOrigin } from '../invoices/invoices.share.js';
import { type EmailTone, renderEmailLayout } from './email-layout.js';
import type { InvoiceEmailExtras } from './notifications.invoice-email.js';

export interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

/** Badge/colour and button label of each notification email. */
const KINDS: Record<NotificationKind, { tone: EmailTone; action: string }> = {
  'document.sent': { tone: 'action', action: 'Đọc và ký văn bản' },
  'document.signed': { tone: 'action', action: 'Xem và ký văn bản' },
  'document.completed': { tone: 'done', action: 'Xem văn bản' },
  'document.rejected': { tone: 'rejected', action: 'Xem văn bản' },
  'payment_claim.created': { tone: 'action', action: 'Xác nhận chuyển khoản' },
  'maintenance.created': { tone: 'action', action: 'Xem báo hỏng' },
  'tenant_request.created': { tone: 'action', action: 'Xem yêu cầu' },
  'reading.reminder': { tone: 'deadline', action: 'Chốt chỉ số' },
  'drafts.ready': { tone: 'action', action: 'Xem hoá đơn nháp' },
  'reminder.unreachable': { tone: 'attention', action: 'Xem hoá đơn' },
  automation: { tone: 'info', action: 'Xem chi tiết' },
  'payment.recorded': { tone: 'done', action: 'Xem hoá đơn' },
  'payment_claim.rejected': { tone: 'rejected', action: 'Xem hoá đơn' },
  'invoice.issued': { tone: 'invoice', action: 'Xem hoá đơn và mã QR' },
  'invoice.due_soon': { tone: 'deadline', action: 'Xem hoá đơn và mã QR' },
  'invoice.overdue': { tone: 'overdue', action: 'Xem hoá đơn và mã QR' },
  'request.updated': { tone: 'info', action: 'Xem yêu cầu' },
  'announcement.created': { tone: 'info', action: 'Xem thông báo' },
};

/** Absolute URL of the app icon for the email header. */
export function emailLogoUrl() {
  const origin = webOrigin(undefined);

  return origin ? `${origin}/icons/icon-192.png` : null;
}

/**
 * Vietnamese email of one notification: building name in the subject and header, a kind badge,
 * the in-app title and body, a button (shared invoice for tenants, the screen for staff) and a
 * footer explaining how to turn these emails off.
 */
export function renderEmail(input: {
  kind: NotificationKind;
  buildingName: string;
  title: string;
  body: string;
  link: string | null;
  audience: 'staff' | 'tenant';
  recipientName?: string | null;
  invoice?: InvoiceEmailExtras | null;
}): EmailContent & { attachments?: InvoiceEmailExtras['attachments'] } {
  const kind = KINDS[input.kind] ?? { tone: 'info' as const, action: 'Xem chi tiết' };
  const subject = `[${input.buildingName}] ${input.title}`;
  const footer =
    input.audience === 'staff'
      ? `Bạn nhận email này vì là chủ trọ/quản lý ${input.buildingName}. Tắt email trong Tài khoản → Cài đặt thông báo.`
      : `Email tự động từ ${input.buildingName}. Tắt email trong cổng người thuê → Thêm → Thông báo của tôi.`;
  const { html, text } = renderEmailLayout({
    subject,
    tone: kind.tone,
    context: input.buildingName,
    logoUrl: emailLogoUrl(),
    greeting: input.recipientName ? `Xin chào ${input.recipientName},` : undefined,
    title: input.title,
    body: input.body,
    money: input.invoice?.money ?? null,
    details: input.invoice?.details,
    qr: input.invoice?.qr ?? null,
    action: input.link ? { label: kind.action, url: input.link } : null,
    footer,
  });

  return {
    subject,
    text,
    html,
    ...(input.invoice?.attachments.length ? { attachments: input.invoice.attachments } : {}),
  };
}
