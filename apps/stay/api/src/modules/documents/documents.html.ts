import { InputValidError } from '@p4/server-core';
import { DOCUMENT_BODY_MAX_LENGTH, type DocxImportResult } from '@stay/shared';
import mammoth from 'mammoth';
import sanitizeHtml from 'sanitize-html';

const ALIGN = /^(left|right|center|justify)$/;
const BLOCK_ALIGN = { 'text-align': [ALIGN] };

/**
 * Allowlist of template/document HTML: what the editor and the PDF renderer support. Anything
 * else (scripts, links, images, inline colours, event handlers) is dropped.
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'h1',
    'h2',
    'h3',
    'h4',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'ul',
    'ol',
    'li',
    'blockquote',
    'hr',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'span',
    'mark',
  ],
  allowedAttributes: {
    td: ['colspan', 'rowspan', 'style'],
    th: ['colspan', 'rowspan', 'style'],
    p: ['style'],
    h1: ['style'],
    h2: ['style'],
    h3: ['style'],
    h4: ['style'],
    span: ['data-missing', 'data-variable'],
    mark: ['data-blank'],
  },
  allowedStyles: { '*': BLOCK_ALIGN },
  allowedSchemes: [],
  disallowedTagsMode: 'discard',
  nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript', 'title'],
  transformTags: {
    b: 'strong',
    i: 'em',
    // Mammoth marks aligned paragraphs with a class (see `importDocx`).
    p: (tagName, attribs) => {
      const align = /\bstay-align-(center|right|justify)\b/.exec(attribs.class ?? '')?.[1];
      const style = align ? `text-align: ${align}` : attribs.style;
      const kept: Record<string, string> = style ? { style } : {};

      return { tagName, attribs: kept };
    },
  },
};

/** Sanitized template/document HTML; 422 when it is empty or too long. */
export function sanitizeBody(html: string, field = 'bodyHtml'): string {
  if (html.length > DOCUMENT_BODY_MAX_LENGTH)
    throw new InputValidError('input_valid_error', { [field]: ['too_long'] });

  const clean = sanitizeHtml(html, SANITIZE_OPTIONS).trim();

  if (!sanitizeHtml(clean, { allowedTags: [], allowedAttributes: {} }).trim())
    throw new InputValidError('input_valid_error', { [field]: ['required_field'] });
  return clean;
}

/** Blanks of a printed contract: `[Họ tên]`, `___`, `……`, `....` (4+ dots or ellipses). */
const BLANK = /\[[^[\]<>]{1,40}\]|_{3,}|…{2,}|(?:…|\.){4,}/g;

/** Wraps blanks of the text parts (never inside tags) in `<mark data-blank="">`. */
export function highlightBlanks(html: string): { html: string; blanks: number } {
  let blanks = 0;
  const parts = html.split(/(<[^>]*>)/);
  const out = parts.map((part) =>
    part.startsWith('<')
      ? part
      : part.replace(BLANK, (match) => {
          blanks += 1;
          return `<mark data-blank="">${match}</mark>`;
        }),
  );

  return { html: out.join(''), blanks };
}

/** `.docx` = a ZIP container (`PK\x03\x04`) holding `word/document.xml`. */
function isDocx(bytes: Buffer): boolean {
  return (
    bytes.length > 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04 &&
    bytes.includes('word/document.xml')
  );
}

/** The part of mammoth's document model `alignParagraphs` reads. */
interface MammothElement {
  type: string;
  children?: MammothElement[];
  styleId?: string | null;
  styleName?: string | null;
  alignment?: string | null;
  numbering?: unknown;
}

/** Gives centred/right/justified plain paragraphs a style the style map turns into a class. */
function alignParagraphs(element: MammothElement): MammothElement {
  const children = element.children?.map(alignParagraphs);
  const node = children ? { ...element, children } : element;
  const align = node.alignment;

  if (
    node.type !== 'paragraph' ||
    /heading|title/i.test(node.styleName ?? '') ||
    node.numbering ||
    !align ||
    !['center', 'right', 'both', 'justify'].includes(align)
  )
    return node;
  const name = `stay-align-${align === 'both' ? 'justify' : align}`;

  return { ...node, styleId: name, styleName: name };
}

/**
 * Converts an uploaded Word file to editor HTML (ST-30 owner request): keeps headings,
 * paragraphs, tables, bold/italic/underline, lists and centred/right paragraphs; drops images
 * and everything outside the allowlist; highlights blanks to replace with variables. The file is
 * never stored: only the returned HTML is kept when the owner saves a version.
 */
export async function importDocx(bytes: Buffer | undefined): Promise<DocxImportResult> {
  if (!bytes?.length || !isDocx(bytes))
    throw new InputValidError('input_valid_error', { file: ['docx_invalid'] });

  let converted: Awaited<ReturnType<typeof mammoth.convertToHtml>>;

  try {
    converted = await mammoth.convertToHtml(
      { buffer: bytes },
      {
        externalFileAccess: false,
        styleMap: [
          'u => u',
          'strike => s',
          "p[style-name='stay-align-center'] => p.stay-align-center:fresh",
          "p[style-name='stay-align-right'] => p.stay-align-right:fresh",
          "p[style-name='stay-align-justify'] => p.stay-align-justify:fresh",
        ],
        transformDocument: alignParagraphs,
      },
    );
  } catch {
    throw new InputValidError('input_valid_error', { file: ['docx_invalid'] });
  }

  // `transformTags.p` reads the alignment class before attributes are filtered.
  const sanitized = sanitizeHtml(converted.value, SANITIZE_OPTIONS);
  const { html, blanks } = highlightBlanks(sanitized);
  const warnings = [
    ...new Set(
      converted.messages
        .filter((message) => message.type === 'warning')
        .map((message) => message.message.slice(0, 200)),
    ),
  ].slice(0, 20);

  if (!sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).trim())
    throw new InputValidError('input_valid_error', { file: ['docx_empty'] });
  if (html.length > DOCUMENT_BODY_MAX_LENGTH)
    throw new InputValidError('input_valid_error', { file: ['too_long'] });
  return { bodyHtml: html, blanks, warnings };
}
