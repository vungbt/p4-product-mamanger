import { Button, EmptyState } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { usePublicInvoice } from '@stay/sdk/react';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { isNotFound } from '@/libraries/forms/api-errors';
import { LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { InvoiceCard } from './invoice-card';
import { downloadNodeImage, invoiceImageName } from './share-tools';

/** Generic on purpose: link previews (Zalo, Messenger) must not reveal invoice data. */
const PUBLIC_TITLE = 'Hoá đơn tiền phòng';

const PUBLIC_META: [attribute: 'name' | 'property', key: string, content: string][] = [
  ['name', 'robots', 'noindex, nofollow'],
  // The token is in the URL: never send it to other origins.
  ['name', 'referrer', 'no-referrer'],
  ['name', 'description', PUBLIC_TITLE],
  ['property', 'og:title', PUBLIC_TITLE],
  ['property', 'og:description', PUBLIC_TITLE],
];

/** Sets the generic title and meta tags while the public page is open. */
function usePublicDocumentMeta() {
  useEffect(() => {
    const previousTitle = document.title;
    const restore = PUBLIC_META.map(([attribute, key, content]) => {
      const existing = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
      const element = existing ?? document.createElement('meta');
      const previous = existing?.getAttribute('content') ?? null;

      element.setAttribute(attribute, key);
      element.setAttribute('content', content);
      if (!existing) document.head.append(element);
      return () => {
        if (!existing) element.remove();
        else if (previous !== null) element.setAttribute('content', previous);
      };
    });

    document.title = PUBLIC_TITLE;
    return () => {
      document.title = previousTitle;
      for (const undo of restore) undo();
    };
  }, []);
}

/**
 * T-01 `/i/:token`: the shared invoice, outside the signed-in shell (no sidebar, no sign-in),
 * mobile-first, with the VietQR code, copy buttons, image download and print (PDF).
 */
export default function PublicInvoicePage() {
  const { token = '' } = useParams();
  const query = usePublicInvoice(token);
  const cardRef = useRef<HTMLElement>(null);
  const [downloading, setDownloading] = useState(false);
  usePublicDocumentMeta();

  const invoice = query.data;

  const download = async () => {
    if (!cardRef.current || !invoice) return;
    setDownloading(true);
    try {
      await downloadNodeImage(cardRef.current, invoiceImageName(invoice.code));
    } catch {
      toast.error('Không tạo được ảnh hoá đơn.');
    }
    setDownloading(false);
  };

  return (
    <main className="min-h-dvh bg-canvas px-4 py-6 sm:py-10 print:bg-surface print:p-0">
      <div className="mx-auto grid w-full max-w-xl min-w-0 gap-4">
        {query.isPending ? (
          <LoadingRows rows={3} />
        ) : !invoice ? (
          isNotFound(query.error) ? (
            <div data-testid="public-invoice-not-found">
              <EmptyState
                headingLevel={1}
                variant="not-found"
                title="Link hoá đơn không còn hiệu lực"
                description="Link đã hết hạn, đã bị thu hồi hoặc không đúng. Hãy liên hệ chủ trọ để nhận link mới."
              />
            </div>
          ) : (
            <LoadError error={query.error} onRetry={() => void query.refetch()} />
          )
        ) : (
          <>
            <InvoiceCard ref={cardRef} invoice={invoice} copyable />
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button variant="secondary" loading={downloading} onClick={() => void download()}>
                Tải ảnh hoá đơn
              </Button>
              <Button variant="secondary" onClick={() => window.print()}>
                In / Lưu PDF
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
