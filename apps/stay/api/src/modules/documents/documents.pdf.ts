import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STAY_TIME_ZONE } from '@stay/shared';
import { parseDocument } from 'htmlparser2';
import pdfmake from 'pdfmake';
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces.js';

/**
 * Server-side PDF of a document (ST-30): pure Node (pdfmake/pdfkit), no headless browser. The
 * body HTML is the sanitized allowlist of `documents.html.ts`, mapped to pdfmake blocks; Be
 * Vietnam Pro (SIL OFL, `assets/fonts`) is embedded and subset.
 */
const FONT_DIR = fileURLToPath(new URL('../../assets/fonts/', import.meta.url));
const font = (file: string) => path.join(FONT_DIR, file);

pdfmake.setFonts({
  BeVietnamPro: {
    normal: font('BeVietnamPro-Regular.ttf'),
    bold: font('BeVietnamPro-Bold.ttf'),
    italics: font('BeVietnamPro-Italic.ttf'),
    bolditalics: font('BeVietnamPro-BoldItalic.ttf'),
  },
});
// Documents never load remote URLs or other local files (signatures are data URLs).
pdfmake.setUrlAccessPolicy(() => false);
pdfmake.setLocalAccessPolicy((file) => path.resolve(file).startsWith(FONT_DIR));

type HtmlNode = ReturnType<typeof parseDocument>['children'][number];
type HtmlElement = Extract<HtmlNode, { attribs: Record<string, string> }>;
type HtmlText = Extract<HtmlNode, { type: 'text' }>;

const isTag = (node: HtmlNode): node is HtmlElement => 'name' in node && 'attribs' in node;
const isText = (node: HtmlNode): node is HtmlText => node.type === 'text' && 'data' in node;

/** Every `<tr>` under `nodes`, in document order. */
function rowsOf(nodes: readonly HtmlNode[]): HtmlElement[] {
  return nodes.flatMap((node) =>
    isTag(node) ? (node.name === 'tr' ? [node] : rowsOf(node.children)) : [],
  );
}

interface InlineStyle {
  bold?: boolean;
  italics?: boolean;
  decoration?: 'underline' | 'lineThrough';
  background?: string;
  color?: string;
}

interface Inline extends InlineStyle {
  text: string;
}

const HEADING_SIZES: Record<string, number> = { h1: 16, h2: 14, h3: 12, h4: 11 };
const BLOCK_TAGS = new Set([
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'table',
  'blockquote',
  'hr',
  'li',
  'tbody',
  'thead',
  'tr',
]);

function alignmentOf(style: string | undefined) {
  const value = /text-align:\s*(left|right|center|justify)/.exec(style ?? '')?.[1];

  return value === 'left' || value === 'right' || value === 'center' || value === 'justify'
    ? value
    : undefined;
}

function inlineStyle(name: string, attribs: Record<string, string>, parent: InlineStyle) {
  const style: InlineStyle = { ...parent };

  if (name === 'strong' || name === 'b') style.bold = true;
  if (name === 'em' || name === 'i') style.italics = true;
  if (name === 'u') style.decoration = 'underline';
  if (name === 's') style.decoration = 'lineThrough';
  if (name === 'mark') style.background = '#FFF3BF';
  if (name === 'span' && attribs['data-missing'] !== undefined) style.color = '#C92A2A';
  return style;
}

/** Text runs of inline content; whitespace collapsed like a browser. */
function inlines(nodes: readonly HtmlNode[], style: InlineStyle = {}): Inline[] {
  const runs: Inline[] = [];

  for (const node of nodes) {
    if (isText(node)) {
      const text = node.data.replace(/\s+/g, ' ');

      if (text) runs.push({ ...style, text });
    } else if (isTag(node)) {
      if (node.name === 'br') runs.push({ ...style, text: '\n' });
      else if (!BLOCK_TAGS.has(node.name))
        runs.push(...inlines(node.children, inlineStyle(node.name, node.attribs, style)));
    }
  }
  return runs;
}

function trimRuns(runs: Inline[]): Inline[] {
  const first = runs[0];
  const last = runs.at(-1);

  if (first) first.text = first.text.replace(/^ +/, '');
  if (last) last.text = last.text.replace(/ +$/, '');
  return runs.filter((run) => run.text.length > 0);
}

function paragraph(runs: Inline[], extra: Record<string, unknown> = {}): Content | null {
  const text = trimRuns(runs);

  return text.length ? { text, margin: [0, 0, 0, 6], ...extra } : null;
}

function cells(row: HtmlNode, columns: number): Content[] {
  const out: Content[] = [];

  if (!isTag(row)) return out;
  for (const cell of row.children) {
    if (!isTag(cell) || (cell.name !== 'td' && cell.name !== 'th')) continue;
    const span = Math.max(1, Math.min(columns, Number(cell.attribs.colspan) || 1));
    const content = blocks(cell.children);

    out.push({
      stack: content.length ? content : [''],
      bold: cell.name === 'th',
      alignment: alignmentOf(cell.attribs.style),
      ...(span > 1 ? { colSpan: span } : {}),
    });
    for (let index = 1; index < span; index += 1) out.push('');
  }
  return out;
}

function tableBlock(node: HtmlNode): Content | null {
  if (!isTag(node)) return null;
  const rows = rowsOf(node.children);
  const width = Math.max(
    1,
    ...rows.map((row) =>
      row.children
        .filter((cell) => isTag(cell) && (cell.name === 'td' || cell.name === 'th'))
        .reduce((sum, cell) => sum + (isTag(cell) ? Number(cell.attribs.colspan) || 1 : 1), 0),
    ),
  );
  const body = rows.map((row) => {
    const line = cells(row, width).slice(0, width);

    while (line.length < width) line.push('');
    return line;
  });

  if (!body.length) return null;
  return {
    table: { headerRows: 0, widths: Array(width).fill('*'), body },
    fontSize: 10,
    margin: [0, 2, 0, 8],
  };
}

function listBlock(node: HtmlNode, ordered: boolean): Content | null {
  if (!isTag(node)) return null;
  const items: Content[] = node.children
    .filter((child) => isTag(child) && child.name === 'li')
    .map((item) => {
      const content = isTag(item) ? blocks(item.children) : [];

      return { stack: content.length ? content : [''] };
    });

  if (!items.length) return null;
  return ordered ? { ol: items, margin: [0, 0, 0, 6] } : { ul: items, margin: [0, 0, 0, 6] };
}

/** Block content of sanitized HTML; loose inline content is grouped into paragraphs. */
function blocks(nodes: readonly HtmlNode[]): Content[] {
  const out: Content[] = [];
  let pending: HtmlNode[] = [];
  const flush = () => {
    const block = paragraph(inlines(pending));

    if (block) out.push(block);
    pending = [];
  };

  for (const node of nodes) {
    if (!isTag(node) || !BLOCK_TAGS.has(node.name)) {
      pending.push(node);
      continue;
    }
    flush();
    const align = alignmentOf(node.attribs.style);
    let block: Content | null = null;

    if (node.name === 'p') block = paragraph(inlines(node.children), { alignment: align });
    else if (node.name in HEADING_SIZES)
      block = paragraph(inlines(node.children, { bold: true }), {
        alignment: align,
        fontSize: HEADING_SIZES[node.name],
        margin: [0, 8, 0, 6],
      });
    else if (node.name === 'ul' || node.name === 'ol') block = listBlock(node, node.name === 'ol');
    else if (node.name === 'table') block = tableBlock(node);
    else if (node.name === 'blockquote')
      block = { stack: blocks(node.children), margin: [16, 0, 0, 6] };
    else if (node.name === 'hr')
      block = {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5 }],
        margin: [0, 4, 0, 8],
      };
    else block = { stack: blocks(node.children) };
    if (block) out.push(block);
  }
  flush();
  return out;
}

export function htmlToPdfContent(html: string): Content[] {
  return blocks(parseDocument(html).children);
}

/* -------------------------------------------------------------------------- */
/* Document PDF                                                                */
/* -------------------------------------------------------------------------- */

export interface PdfSigner {
  name: string;
  role: 'tenant' | 'owner';
  required: boolean;
  status: string;
  signedAt: Date | null;
  method: string | null;
  /** `data:image/png;base64,…` of a drawn/stored signature. */
  signatureDataUrl: string | null;
  typedName: string | null;
  ip: string | null;
  userAgent: string | null;
  verification: string | null;
}

export interface DocumentPdfInput {
  code: string;
  title: string;
  bodyHtml: string;
  dataSha256: string | null;
  draft: boolean;
  signers: PdfSigner[];
  verifyUrl: string;
  completedAt: Date | null;
}

const vnTime = (date: Date) =>
  new Intl.DateTimeFormat('vi-VN', {
    timeZone: STAY_TIME_ZONE,
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date);

const roleLabel = (role: PdfSigner['role']) => (role === 'owner' ? 'Bên cho thuê' : 'Bên thuê');

const VERIFICATION_LABELS: Record<string, string> = {
  portal_phone_last4: 'Link cổng người thuê + 4 số cuối SĐT + họ tên',
  password: 'Đăng nhập + xác nhận lại mật khẩu',
};

function signatureCell(signer: PdfSigner): Content {
  const mark: Content = signer.signatureDataUrl
    ? { image: signer.signatureDataUrl, fit: [150, 60], margin: [0, 4, 0, 4] }
    : signer.typedName
      ? { text: signer.typedName, italics: true, fontSize: 16, margin: [0, 12, 0, 12] }
      : { text: '(chưa ký)', color: '#868E96', margin: [0, 20, 0, 20] };

  return {
    stack: [
      { text: roleLabel(signer.role).toUpperCase(), bold: true },
      mark,
      { text: signer.name, bold: true },
      signer.signedAt
        ? { text: `Ký lúc ${vnTime(signer.signedAt)}`, fontSize: 8, color: '#495057' }
        : '',
    ],
    alignment: 'center',
  };
}

function signaturePage(signers: PdfSigner[]): Content[] {
  const owners = signers.filter((row) => row.role === 'owner');
  const tenants = signers.filter((row) => row.role === 'tenant' && (row.required || row.signedAt));
  const ordered = [...owners, ...tenants];
  const rows: Content[][] = [];

  for (let index = 0; index < ordered.length; index += 2) {
    const left = ordered[index];
    const right = ordered[index + 1];

    rows.push([left ? signatureCell(left) : '', right ? signatureCell(right) : '']);
  }
  return [
    { text: 'CHỮ KÝ CÁC BÊN', bold: true, alignment: 'center', margin: [0, 16, 0, 8] },
    rows.length
      ? { table: { widths: ['*', '*'], body: rows }, layout: 'noBorders' }
      : { text: '(chưa có người ký)', alignment: 'center' },
  ];
}

function evidencePage(input: DocumentPdfInput): Content[] {
  const signerRows: Content[][] = input.signers.map((signer) => [
    { text: `${signer.name}\n${roleLabel(signer.role)}${signer.required ? '' : ' (tuỳ chọn)'}` },
    {
      text: signer.signedAt
        ? `Đã ký ${vnTime(signer.signedAt)}\n${signer.method === 'typed' ? 'Chữ ký đánh máy' : signer.method === 'stored' ? 'Chữ ký mẫu' : 'Chữ ký vẽ tay'}`
        : signer.status === 'rejected'
          ? 'Từ chối'
          : 'Chưa ký',
    },
    { text: `${VERIFICATION_LABELS[signer.verification ?? ''] ?? '—'}` },
    { text: `IP: ${signer.ip ?? '—'}\n${signer.userAgent ?? '—'}`, fontSize: 7 },
  ]);

  return [
    {
      text: 'TRANG BẰNG CHỨNG KÝ ĐIỆN TỬ',
      bold: true,
      fontSize: 13,
      alignment: 'center',
      pageBreak: 'before',
      margin: [0, 0, 0, 10],
    },
    {
      text: [
        'Văn bản được ký bằng chữ ký điện tử đơn giản theo Luật Giao dịch điện tử 2023: người ký được xác định qua đường dẫn riêng và xác minh số điện thoại, thể hiện ý chí đồng ý; nội dung được bảo toàn bằng mã băm SHA-256. ',
        { text: 'Đây không phải chữ ký số có chứng thư.', italics: true },
      ],
      fontSize: 9,
      margin: [0, 0, 0, 10],
    },
    {
      table: {
        widths: [110, '*'],
        body: [
          ['Mã văn bản', { text: input.code, bold: true }],
          ['Tiêu đề', input.title],
          ['SHA-256 nội dung', { text: input.dataSha256 ?? '—', fontSize: 8 }],
          ['Hoàn tất', input.completedAt ? vnTime(input.completedAt) : '—'],
          ['Kiểm tra', input.verifyUrl],
        ],
      },
      fontSize: 9,
      margin: [0, 0, 0, 12],
    },
    {
      table: {
        headerRows: 1,
        widths: [110, 90, 100, '*'],
        body: [
          [
            { text: 'Người ký', bold: true },
            { text: 'Trạng thái', bold: true },
            { text: 'Xác minh', bold: true },
            { text: 'Thiết bị', bold: true },
          ],
          ...signerRows,
        ],
      },
      fontSize: 8,
    },
    {
      text: `Thời điểm theo giờ Việt Nam (${STAY_TIME_ZONE}). Mã băm của file PDF này được lưu ở máy chủ; tải file lên trang kiểm tra để so khớp.`,
      fontSize: 8,
      color: '#495057',
      margin: [0, 10, 0, 0],
    },
  ];
}

/** A4 PDF: body, signature block and the evidence page; "BẢN NHÁP" watermark for drafts. */
export async function renderDocumentPdf(input: DocumentPdfInput): Promise<Buffer> {
  const definition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [56, 48, 56, 56],
    info: { title: input.title, subject: input.code, creator: 'Stay' },
    defaultStyle: { font: 'BeVietnamPro', fontSize: 11, lineHeight: 1.25 },
    ...(input.draft ? { watermark: { text: 'BẢN NHÁP', opacity: 0.12, bold: true } } : {}),
    footer: (page: number, pages: number) => ({
      text: `Mã văn bản ${input.code} · Trang ${page}/${pages}`,
      alignment: 'center',
      fontSize: 8,
      color: '#495057',
      margin: [0, 20, 0, 0],
    }),
    content: [
      ...htmlToPdfContent(input.bodyHtml),
      ...signaturePage(input.signers),
      ...evidencePage(input),
    ],
  };

  return Buffer.from(await pdfmake.createPdf(definition).getBuffer());
}
