import { Button, type ButtonProps, Icon } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { invoiceQueryOptions, useStaySdk } from '@stay/sdk/react';
import type { PublicInvoice } from '@stay/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { InvoiceCard } from './invoice-card';
import { downloadNodeImage, invoiceImageName } from './share-tools';

/**
 * "Tải ảnh hoá đơn" for a share token: loads the public invoice (the same data the tenant sees),
 * renders `InvoiceCard` off-screen and downloads it as a PNG.
 */
export function InvoiceImageButton({
  token,
  label = 'Tải ảnh hoá đơn',
  variant = 'secondary',
  size,
}: {
  token: string;
  label?: string;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
}) {
  const sdk = useStaySdk();
  const client = useQueryClient();
  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const captured = useRef<PublicInvoice | null>(null);

  useEffect(() => {
    const node = cardRef.current;

    // Once per loaded invoice (StrictMode runs effects twice in development).
    if (!invoice || !node || captured.current === invoice) return;
    captured.current = invoice;
    downloadNodeImage(node, invoiceImageName(invoice.code))
      .then(() => toast.success('Đã tải ảnh hoá đơn.'))
      .catch(() => toast.error('Không tạo được ảnh hoá đơn.'))
      .finally(() => {
        setInvoice(null);
        setBusy(false);
      });
  }, [invoice]);

  const start = async () => {
    setBusy(true);
    try {
      setInvoice(await client.fetchQuery(invoiceQueryOptions(sdk).publicInvoice(token)));
    } catch {
      toast.error('Không tải được hoá đơn để tạo ảnh. Link có thể đã bị làm mới hoặc thu hồi.');
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant={variant} size={size} loading={busy} onClick={() => void start()}>
        <Icon name="download" className="size-4" aria-hidden />
        {label}
      </Button>
      {invoice ? (
        <div aria-hidden inert className="pointer-events-none fixed top-0 left-full w-md">
          <InvoiceCard ref={cardRef} invoice={invoice} headingLevel={2} />
        </div>
      ) : null}
    </>
  );
}
