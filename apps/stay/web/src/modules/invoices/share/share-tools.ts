import { toast } from '@itclabs/react-ui/toast';

/** Marks nodes (copy/print buttons) left out of the downloaded invoice image. */
export const IMAGE_EXCLUDE_ATTRIBUTE = 'data-image-exclude';

/**
 * Copies `text`: the async Clipboard API in secure contexts, else a hidden textarea with
 * `execCommand('copy')` (older in-app browsers such as Zalo's). Returns whether it worked.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (window.isSecureContext && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* permission denied: try the fallback */
  }

  const area = document.createElement('textarea');

  area.value = text;
  area.setAttribute('readonly', '');
  area.className = 'fixed top-0 left-0 opacity-0';
  document.body.append(area);
  area.select();
  let copied = false;

  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }
  area.remove();
  return copied;
}

/** Copies and tells the user; `label` names what was copied ("link", "số tài khoản"…). */
export async function copyWithToast(text: string, label: string) {
  if (await copyText(text)) toast.success(`Đã sao chép ${label}.`);
  else toast.error(`Không sao chép được ${label}. Hãy chọn và sao chép thủ công.`);
}

/** Web Share API (mobile share sheet: Zalo, Messenger…). */
export function canWebShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export async function shareLink(title: string, text: string, url: string) {
  try {
    await navigator.share({ title, text, url });
  } catch (cause) {
    // Closing the share sheet is not an error.
    if (cause instanceof DOMException && cause.name === 'AbortError') return;
    toast.error('Không mở được chia sẻ. Hãy sao chép link.');
  }
}

/** Renders `node` (an invoice card) to a PNG and downloads it. */
export async function downloadNodeImage(node: HTMLElement, fileName: string) {
  // Loaded on demand: only owners/tenants who download an image pay for the library.
  const { toPng } = await import('html-to-image');
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    cacheBust: true,
    filter: (element) =>
      !(element instanceof HTMLElement && element.hasAttribute(IMAGE_EXCLUDE_ATTRIBUTE)),
  });
  const anchor = document.createElement('a');

  anchor.href = dataUrl;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

/** `hoa-don-A-202611-001.png`. */
export function invoiceImageName(code: string): string {
  return `hoa-don-${code.replace(/[^A-Za-z0-9-]+/g, '-')}.png`;
}
