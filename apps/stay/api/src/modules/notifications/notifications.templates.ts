import type { NotificationKind } from '@stay/shared';

export interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

/** Button label of the email per event. */
const ACTIONS: Partial<Record<NotificationKind, string>> = {
  'payment_claim.created': 'Xác nhận chuyển khoản',
  'maintenance.created': 'Xem báo hỏng',
  'tenant_request.created': 'Xem yêu cầu',
  'reading.reminder': 'Chốt chỉ số',
  'drafts.ready': 'Xem hoá đơn nháp',
  'invoice.issued': 'Xem hoá đơn',
  'invoice.due_soon': 'Xem hoá đơn và mã QR',
  'invoice.overdue': 'Xem hoá đơn và mã QR',
};

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

/**
 * Vietnamese email of one notification: the building name in the subject, the in-app title and
 * body, a link (shared invoice for tenants, the screen for staff) and a footer explaining how to
 * turn these emails off.
 */
export function renderEmail(input: {
  kind: NotificationKind;
  buildingName: string;
  title: string;
  body: string;
  link: string | null;
  audience: 'staff' | 'tenant';
}): EmailContent {
  const action = ACTIONS[input.kind] ?? 'Xem chi tiết';
  const footer =
    input.audience === 'staff'
      ? 'Bạn nhận email này vì là chủ trọ/quản lý toà. Tắt email trong Tài khoản → Thông báo.'
      : 'Email tự động từ chủ trọ. Tắt email trong cổng người thuê → Thêm → Thông báo.';
  const text = [
    input.title,
    '',
    input.body,
    ...(input.link ? ['', `${action}: ${input.link}`] : []),
    '',
    '—',
    input.buildingName,
    footer,
  ].join('\n');
  const paragraphs = input.body
    .split('\n')
    .map((line) => `<p style="margin:0 0 8px">${escapeHtml(line)}</p>`)
    .join('');
  const button = input.link
    ? `<p style="margin:20px 0 0"><a href="${escapeHtml(input.link)}" style="display:inline-block;background:#ea580c;color:#ffffff;text-decoration:none;font-weight:600;padding:10px 18px;border-radius:8px">${escapeHtml(action)}</a></p>`
    : '';
  const html = `<!doctype html>
<html lang="vi">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(input.title)}</title></head>
<body style="margin:0;background:#f4f5f7;font-family:'Be Vietnam Pro',Arial,sans-serif;color:#1f2933">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<p style="margin:0 0 12px;font-size:13px;color:#64748b">${escapeHtml(input.buildingName)}</p>
<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px">
<h1 style="margin:0 0 12px;font-size:18px">${escapeHtml(input.title)}</h1>
<div style="font-size:15px;line-height:1.5">${paragraphs}</div>
${button}
</div>
<p style="margin:16px 0 0;font-size:12px;color:#64748b">${escapeHtml(footer)}</p>
</div>
</body>
</html>`;

  return { subject: `[${input.buildingName}] ${input.title}`, text, html };
}
