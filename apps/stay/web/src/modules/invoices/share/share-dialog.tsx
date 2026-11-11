import { AlertDialog, Button, Input } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useRevokeInvoiceShare, useShareInvoice } from '@stay/sdk/react';
import type { InvoiceShareLink, StayInvoiceSummary } from '@stay/shared';
import { useState } from 'react';
import { FormError } from '@/libraries/forms/page-states';
import { Overlay } from '../invoice-dialogs';
import { displayExpiry, displayPeriod, invoiceErrorMessage } from '../invoice-ui';
import { InvoiceImageButton } from './invoice-image-button';
import { canWebShare, copyWithToast, shareLink } from './share-tools';

type SharedInvoice = Pick<
  StayInvoiceSummary,
  'id' | 'code' | 'roomCode' | 'period' | 'shareExpiresAt'
>;

/** Message sent with the link through the share sheet. */
export function shareMessage(invoice: Pick<SharedInvoice, 'code' | 'roomCode' | 'period'>) {
  return `Hoá đơn ${invoice.code ?? ''} phòng ${invoice.roomCode} kỳ ${displayPeriod(invoice.period)}`;
}

/** Copy / Web Share / image / print buttons of a link the owner has just created. */
export function ShareLinkActions({
  invoice,
  link,
}: {
  invoice: Pick<SharedInvoice, 'code' | 'roomCode' | 'period'>;
  link: Pick<InvoiceShareLink, 'url' | 'path'>;
}) {
  const token = link.path.slice('/i/'.length);

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => void copyWithToast(link.url, 'link')}>Sao chép link</Button>
      {canWebShare() ? (
        <Button
          variant="secondary"
          onClick={() => void shareLink('Hoá đơn tiền phòng', shareMessage(invoice), link.url)}
        >
          Chia sẻ…
        </Button>
      ) : null}
      <InvoiceImageButton token={token} />
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-2 font-semibold text-accent underline"
      >
        Mở trang in / PDF
      </a>
    </div>
  );
}

/**
 * "Chia sẻ hoá đơn" (O-22): create or refresh the link (shown once: only its hash is stored),
 * copy, Web Share, invoice image, print page and revoke with confirmation.
 */
export function ShareInvoiceDialog({
  invoice,
  link,
  onLinkChange,
  onClose,
}: {
  invoice: SharedInvoice;
  /** The link created in this page session (kept by the page while the dialog is closed). */
  link: InvoiceShareLink | null;
  onLinkChange: (link: InvoiceShareLink | null) => void;
  onClose: () => void;
}) {
  const share = useShareInvoice();
  const revoke = useRevokeInvoiceShare();
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeUntil = link?.expiresAt ?? invoice.shareExpiresAt;

  const create = async () => {
    setError(null);
    try {
      onLinkChange(await share.mutateAsync(invoice.id));
      toast.success(activeUntil ? 'Đã tạo link mới; link cũ không còn mở được.' : 'Đã tạo link.');
    } catch (cause) {
      setError(invoiceErrorMessage(cause, 'Không tạo được link chia sẻ.'));
    }
  };

  const confirmRevoking = async () => {
    setError(null);
    try {
      await revoke.mutateAsync(invoice.id);
      onLinkChange(null);
      toast.success('Đã thu hồi link chia sẻ.');
    } catch (cause) {
      setError(invoiceErrorMessage(cause, 'Không thu hồi được link.'));
    }
    setConfirmRevoke(false);
  };

  const close = () => {
    if (!share.isPending && !revoke.isPending) onClose();
  };

  return (
    <Overlay
      title="Chia sẻ hoá đơn"
      description={`Gửi hoá đơn ${invoice.code ?? ''} phòng ${invoice.roomCode} cho người thuê: link xem không cần đăng nhập, có mã VietQR số tiền còn lại.`}
      onClose={close}
    >
      <div className="grid min-w-0 gap-4">
        <FormError message={error} />
        {link ? (
          <>
            <Input label="Link hoá đơn" value={link.url} readOnly data-testid="share-link-url" />
            <p className="text-ui-sm text-muted" data-testid="share-link-expiry">
              Link có hiệu lực đến {displayExpiry(link.expiresAt)}. Link chỉ hiện một lần: tạo link
              mới sẽ làm link cũ hết hiệu lực.
            </p>
            <ShareLinkActions invoice={invoice} link={link} />
          </>
        ) : activeUntil ? (
          <p data-testid="share-link-expiry">
            Đã có link đang hoạt động đến {displayExpiry(activeUntil)}. Link chỉ hiện một lần khi
            tạo; hãy tạo link mới để sao chép (link cũ sẽ hết hiệu lực).
          </p>
        ) : (
          <p>Chưa có link chia sẻ cho hoá đơn này. Link có hiệu lực 60 ngày.</p>
        )}
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <Button
            variant={link ? 'secondary' : 'primary'}
            loading={share.isPending}
            onClick={() => void create()}
          >
            {activeUntil ? 'Tạo link mới' : 'Tạo link'}
          </Button>
          {activeUntil ? (
            <Button variant="danger" onClick={() => setConfirmRevoke(true)}>
              Thu hồi link
            </Button>
          ) : null}
          <Button variant="ghost" onClick={close}>
            Đóng
          </Button>
        </div>
      </div>
      <AlertDialog
        open={confirmRevoke}
        onOpenChange={(open) => {
          if (!open && !revoke.isPending) setConfirmRevoke(false);
        }}
        title="Thu hồi link chia sẻ?"
        description="Người đang giữ link sẽ không mở được hoá đơn nữa. Bạn có thể tạo link mới sau."
        confirmLabel="Thu hồi"
        cancelLabel="Quay lại"
        confirmVariant="danger"
        closeOnConfirm={false}
        confirmLoading={revoke.isPending}
        onConfirm={() => void confirmRevoking()}
      />
    </Overlay>
  );
}
