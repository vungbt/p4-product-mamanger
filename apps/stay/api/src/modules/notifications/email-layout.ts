/**
 * Shared HTML email layout (notifications and account emails), modelled on the ttms email kit:
 * table layout for Outlook/Gmail, inline styles, a hidden preheader, a coloured accent and badge
 * per kind, an optional details table, a bulletproof button with a copyable fallback link, and
 * dark-mode overrides. Every value passed in is plain text and is escaped here.
 */

export const EMAIL_FONT = "'Be Vietnam Pro',Arial,Helvetica,sans-serif";

const COLORS = {
  page: '#eef4f3',
  card: '#ffffff',
  soft: '#f5f9f8',
  border: '#dce7e5',
  brand: '#0e7066',
  textStrong: '#10201e',
  text: '#26332f',
  muted: '#64748b',
  link: '#0e7066',
  onAccent: '#ffffff',
} as const;

const DARK = {
  page: '#0b1513',
  card: '#13201e',
  soft: '#1a2a27',
  text: '#e5ece9',
  muted: '#9fb0ab',
  border: '#24403b',
} as const;

export type EmailTone =
  | 'action'
  | 'invoice'
  | 'deadline'
  | 'overdue'
  | 'attention'
  | 'done'
  | 'rejected'
  | 'info'
  | 'account';

/** Badge label and colours of each tone. */
export const EMAIL_TONES: Record<
  EmailTone,
  { label: string; accent: string; badgeBackground: string; badgeColor: string }
> = {
  action: {
    label: 'Cần xử lý',
    accent: '#0e7066',
    badgeBackground: '#d7f0ec',
    badgeColor: '#0b5a52',
  },
  invoice: {
    label: 'Hoá đơn',
    accent: '#0e7066',
    badgeBackground: '#d7f0ec',
    badgeColor: '#0b5a52',
  },
  deadline: {
    label: 'Nhắc hạn',
    accent: '#b45309',
    badgeBackground: '#fef3c7',
    badgeColor: '#92400e',
  },
  overdue: {
    label: 'Quá hạn',
    accent: '#b91c1c',
    badgeBackground: '#fee2e2',
    badgeColor: '#991b1b',
  },
  attention: {
    label: 'Cần chú ý',
    accent: '#b45309',
    badgeBackground: '#fef3c7',
    badgeColor: '#92400e',
  },
  done: { label: 'Hoàn tất', accent: '#15803d', badgeBackground: '#dcfce7', badgeColor: '#166534' },
  rejected: {
    label: 'Bị từ chối',
    accent: '#b91c1c',
    badgeBackground: '#fee2e2',
    badgeColor: '#991b1b',
  },
  info: {
    label: 'Thông báo',
    accent: '#334155',
    badgeBackground: '#e2e8f0',
    badgeColor: '#1e293b',
  },
  account: {
    label: 'Tài khoản',
    accent: '#0e7066',
    badgeBackground: '#d7f0ec',
    badgeColor: '#0b5a52',
  },
};

export interface EmailDetail {
  label: string;
  value: string;
}

/** Big amount at the top of a money email, with an optional due-date chip. */
export interface EmailMoney {
  label: string;
  amount: string;
  /** Small line under the amount, e.g. "Tổng 5.430.000 ₫ · đã trả 3.000.000 ₫". */
  note?: string;
  due?: { label: string; urgency: 'ok' | 'soon' | 'overdue' } | null;
}

/** VietQR block: the image is an inline attachment referenced by `cid`. */
export interface EmailQr {
  cid: string;
  rows: readonly EmailDetail[];
}

export interface EmailLayoutInput {
  /** Subject line (also the HTML title). */
  subject: string;
  tone: EmailTone;
  /** Small line under the brand, e.g. the building name. */
  context?: string;
  /** Absolute URL of the square logo (PNG); omitted when unknown. */
  logoUrl?: string | null;
  greeting?: string;
  title: string;
  /** Body text; one paragraph per line. */
  body: string;
  money?: EmailMoney | null;
  details?: readonly EmailDetail[];
  qr?: EmailQr | null;
  action?: { label: string; url: string } | null;
  /** Why the recipient gets this email / how to stop it. */
  footer: string;
}

export const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

/** Only http(s) links become clickable; anything else is dropped. */
function safeUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);

    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function paragraphs(body: string) {
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 12px 0;">${escapeHtml(line)}</p>`)
    .join('');
}

function detailsTable(details: readonly EmailDetail[]) {
  const rows = details
    .map(
      (detail) => `<tr>
<td class="detail-label text-muted" width="40%" valign="top" style="padding:10px 16px;font-family:${EMAIL_FONT};font-size:13px;line-height:20px;color:${COLORS.muted};">${escapeHtml(detail.label)}</td>
<td class="detail-value text-main" valign="top" style="padding:10px 16px;font-family:${EMAIL_FONT};font-size:14px;line-height:20px;color:${COLORS.textStrong};font-weight:bold;">${escapeHtml(detail.value)}</td>
</tr>`,
    )
    .join('');

  return `<tr><td class="px" style="padding:8px 32px 0 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-soft border" style="background-color:${COLORS.soft};border:1px solid ${COLORS.border};border-radius:8px;">${rows}</table>
</td></tr>`;
}

const URGENCY = {
  ok: { color: '#0b5a52', background: '#d7f0ec' },
  soon: { color: '#92400e', background: '#fef3c7' },
  overdue: { color: '#991b1b', background: '#fee2e2' },
} as const;

function moneyBlock(money: EmailMoney, accent: string) {
  const due = money.due
    ? `<tr><td style="padding:12px 20px 0 20px;font-family:${EMAIL_FONT};"><span style="display:inline-block;padding:6px 12px;border-radius:999px;background-color:${URGENCY[money.due.urgency].background};color:${URGENCY[money.due.urgency].color};font-size:13px;line-height:18px;font-weight:bold;">&#128197;&nbsp;${escapeHtml(money.due.label)}</span></td></tr>`
    : '';

  return `<tr><td class="px" style="padding:20px 32px 0 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-soft border" style="background-color:${COLORS.soft};border:1px solid ${COLORS.border};border-left:5px solid ${accent};border-radius:10px;">
<tr><td class="text-muted" style="padding:16px 20px 0 20px;font-family:${EMAIL_FONT};font-size:13px;line-height:18px;color:${COLORS.muted};text-transform:uppercase;letter-spacing:0.4px;font-weight:bold;">${escapeHtml(money.label)}</td></tr>
<tr><td style="padding:4px 20px 0 20px;font-family:${EMAIL_FONT};font-size:32px;line-height:40px;font-weight:bold;color:${accent};">${escapeHtml(money.amount)}</td></tr>
${money.note ? `<tr><td class="text-muted" style="padding:2px 20px 0 20px;font-family:${EMAIL_FONT};font-size:13px;line-height:20px;color:${COLORS.muted};">${escapeHtml(money.note)}</td></tr>` : ''}
${due}
<tr><td style="padding:16px 0 0 0;font-size:0;line-height:0;">&nbsp;</td></tr>
</table>
</td></tr>`;
}

function qrBlock(qr: EmailQr) {
  const rows = qr.rows
    .filter((row) => row.value)
    .map(
      (row) =>
        `<tr><td class="text-muted" style="padding:3px 0;font-family:${EMAIL_FONT};font-size:13px;line-height:18px;color:${COLORS.muted};">${escapeHtml(row.label)}</td></tr><tr><td class="text-main" style="padding:0 0 8px 0;font-family:${EMAIL_FONT};font-size:14px;line-height:20px;font-weight:bold;color:${COLORS.textStrong};word-break:break-all;">${escapeHtml(row.value)}</td></tr>`,
    )
    .join('');

  return `<tr><td class="px" style="padding:20px 32px 0 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="border" style="border:1px solid ${COLORS.border};border-radius:10px;">
<tr><td colspan="2" class="text-main" style="padding:14px 18px 4px 18px;font-family:${EMAIL_FONT};font-size:15px;line-height:22px;font-weight:bold;color:${COLORS.textStrong};">Quét mã VietQR để chuyển khoản</td></tr>
<tr><td colspan="2" class="text-muted" style="padding:0 18px 10px 18px;font-family:${EMAIL_FONT};font-size:13px;line-height:18px;color:${COLORS.muted};">Mở app ngân hàng → Quét QR. Số tiền và nội dung đã điền sẵn.</td></tr>
<tr>
<td width="196" valign="top" class="qr-cell" style="padding:0 0 14px 18px;"><img src="cid:${escapeHtml(qr.cid)}" width="180" height="180" alt="Mã VietQR" style="display:block;width:180px;height:180px;border:1px solid ${COLORS.border};border-radius:8px;background:#ffffff;"></td>
<td valign="top" class="qr-cell" style="padding:0 18px 14px 12px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table></td>
</tr>
</table>
</td></tr>`;
}

function button(label: string, url: string, accent: string) {
  const href = escapeHtml(url);
  const text = escapeHtml(label);

  return `<tr><td class="px" align="left" style="padding:24px 32px 0 32px;">
<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}" style="height:44px;v-text-anchor:middle;width:240px;" arcsize="18%" stroke="f" fillcolor="${accent}"><w:anchorlock/><center style="color:${COLORS.onAccent};font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">${text}</center></v:roundrect><![endif]-->
<!--[if !mso]><!--><a href="${href}" target="_blank" style="display:inline-block;background-color:${accent};color:${COLORS.onAccent};font-family:${EMAIL_FONT};font-size:15px;font-weight:bold;line-height:44px;text-align:center;text-decoration:none;padding:0 28px;border-radius:8px;mso-hide:all;">${text}</a><!--<![endif]-->
</td></tr>
<tr><td class="px text-muted" style="padding:14px 32px 0 32px;font-family:${EMAIL_FONT};font-size:12px;line-height:18px;color:${COLORS.muted};">
Nếu nút không bấm được, sao chép liên kết sau vào trình duyệt:<br><a href="${href}" style="color:${COLORS.link};word-break:break-all;">${href}</a>
</td></tr>`;
}

/** Renders the HTML and plain-text versions of one email. */
export function renderEmailLayout(input: EmailLayoutInput): { html: string; text: string } {
  const tone = EMAIL_TONES[input.tone];
  const actionUrl = safeUrl(input.action?.url);
  const logoUrl = safeUrl(input.logoUrl);
  const details = input.details?.filter((detail) => detail.value) ?? [];
  const preheader = escapeHtml(input.body.split('\n')[0]?.slice(0, 140) ?? '');
  const logo = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" width="36" height="36" alt="Stay" style="display:block;width:36px;height:36px;border-radius:9px;">`
    : '';

  const html = `<!doctype html>
<html lang="vi" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(input.subject)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body { margin:0; padding:0; width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table { border-collapse:collapse; }
  img { border:0; outline:none; text-decoration:none; }
  a { color:${COLORS.link}; }
  @media only screen and (max-width:620px) {
    .container { width:100% !important; }
    .px { padding-left:20px !important; padding-right:20px !important; }
    .detail-label { display:block !important; width:100% !important; padding-bottom:0 !important; }
    .detail-value { display:block !important; width:100% !important; padding-top:2px !important; }
    .qr-cell { display:block !important; width:100% !important; padding:0 18px 12px 18px !important; }
  }
  @media (prefers-color-scheme: dark) {
    .bg-page { background-color:${DARK.page} !important; }
    .bg-card { background-color:${DARK.card} !important; }
    .bg-soft { background-color:${DARK.soft} !important; }
    .text-main { color:${DARK.text} !important; }
    .text-muted { color:${DARK.muted} !important; }
    .border { border-color:${DARK.border} !important; }
  }
</style>
</head>
<body class="bg-page" style="margin:0;padding:0;background-color:${COLORS.page};">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${preheader}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-page" style="background-color:${COLORS.page};">
<tr><td align="center" style="padding:28px 12px;">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="container" style="width:600px;max-width:600px;">
<tr><td class="px" style="padding:0 8px 16px 8px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
${logo ? `<td valign="middle" style="padding-right:12px;">${logo}</td>` : ''}
<td valign="middle" style="font-family:${EMAIL_FONT};">
<div class="text-main" style="font-size:16px;line-height:20px;font-weight:bold;color:${COLORS.brand};">Stay</div>
${input.context ? `<div class="text-muted" style="font-size:13px;line-height:18px;color:${COLORS.muted};">${escapeHtml(input.context)}</div>` : ''}
</td></tr></table>
</td></tr>
<tr><td class="bg-card border" style="background-color:${COLORS.card};border:1px solid ${COLORS.border};border-top:4px solid ${tone.accent};border-radius:12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td class="px" style="padding:26px 32px 0 32px;font-family:${EMAIL_FONT};">
<span style="display:inline-block;padding:4px 10px;border-radius:999px;background-color:${tone.badgeBackground};color:${tone.badgeColor};font-size:12px;font-weight:bold;">${tone.label}</span>
</td></tr>
<tr><td class="px text-main" style="padding:12px 32px 0 32px;font-family:${EMAIL_FONT};color:${COLORS.textStrong};">
<h1 style="margin:0;font-size:20px;line-height:28px;font-weight:bold;">${escapeHtml(input.title)}</h1>
</td></tr>
<tr><td class="px text-main" style="padding:16px 32px 0 32px;font-family:${EMAIL_FONT};font-size:15px;line-height:24px;color:${COLORS.text};">
${input.greeting ? `<p style="margin:0 0 12px 0;">${escapeHtml(input.greeting)}</p>` : ''}${paragraphs(input.body)}
</td></tr>
${input.money ? moneyBlock(input.money, tone.accent) : ''}
${details.length ? detailsTable(details) : ''}
${input.qr ? qrBlock(input.qr) : ''}
${actionUrl && input.action ? button(input.action.label, actionUrl, tone.accent) : ''}
<tr><td style="padding:28px 0 0 0;font-size:0;line-height:0;">&nbsp;</td></tr>
</table>
</td></tr>
<tr><td class="px text-muted" style="padding:18px 8px 0 8px;font-family:${EMAIL_FONT};font-size:12px;line-height:18px;color:${COLORS.muted};">
${escapeHtml(input.footer)}<br>Email tự động, vui lòng không trả lời thư này.
</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`;

  const text = [
    `[${tone.label}] ${input.title}`,
    ...(input.context ? [input.context] : []),
    '',
    ...(input.greeting ? [input.greeting, ''] : []),
    input.body,
    ...(input.money
      ? [
          '',
          `${input.money.label}: ${input.money.amount}`,
          ...(input.money.note ? [input.money.note] : []),
          ...(input.money.due ? [input.money.due.label] : []),
        ]
      : []),
    ...(details.length ? ['', ...details.map((detail) => `${detail.label}: ${detail.value}`)] : []),
    ...(input.qr
      ? [
          '',
          'Chuyển khoản:',
          ...input.qr.rows.filter((row) => row.value).map((row) => `${row.label}: ${row.value}`),
        ]
      : []),
    ...(actionUrl && input.action ? ['', `${input.action.label}: ${actionUrl}`] : []),
    '',
    '—',
    input.footer,
    'Email tự động, vui lòng không trả lời thư này.',
  ].join('\n');

  return { html, text };
}
