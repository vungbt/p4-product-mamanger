import { buildVietQrPayload, toTransferText } from '@stay/shared';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { formatVnd } from '@/libraries/format';
import { findBank } from '../banks';

/** Amount of the test transfer encoded in the preview QR (screens.md O-05). */
export const TEST_AMOUNT = 10_000;

const ACCOUNT_PATTERN = /^[0-9A-Za-z]{4,19}$/;

/**
 * O-05 "Xem trước mã VietQR thử với số tiền 10.000đ": the EMVCo payload is built client-side
 * (`buildVietQrPayload`, no network) so the owner can scan it with a banking app and check the
 * account before tenants pay to it.
 */
export function VietQrPreview({
  bin,
  account,
  accountName,
}: {
  bin: string;
  account: string;
  accountName: string;
}) {
  const { t } = useTranslation('buildings');

  const bank = findBank(bin);
  const number = account.replace(/\s+/g, '');
  const ready = Boolean(bank) && ACCOUNT_PATTERN.test(number);
  const payload = ready
    ? buildVietQrPayload({
        bin,
        accountNumber: number,
        amount: TEST_AMOUNT,
        content: toTransferText(t('form.qrContent')),
      })
    : null;

  return (
    <figure
      className="flex flex-col items-center gap-3 rounded-panel border border-dashed border-line bg-canvas p-4 text-center"
      data-testid="vietqr-preview"
    >
      {payload && bank ? (
        <>
          <div className="rounded-control bg-surface p-2 text-ink">
            <QRCodeSVG
              value={payload}
              size={176}
              level="M"
              marginSize={2}
              fgColor="currentColor"
              title={t('form.qrTitle')}
              data-testid="vietqr-code"
              data-payload={payload}
            />
          </div>
          <figcaption className="grid gap-1 text-ui-sm">
            <span className="font-semibold text-ink">
              {t('form.qrAmount', { amount: formatVnd(TEST_AMOUNT) })}
            </span>
            <span className="text-muted">
              {bank.shortName} · {number}
              {accountName.trim() ? ` · ${accountName.trim()}` : ''}
            </span>
            <span className="text-muted">{t('form.qrHint')}</span>
          </figcaption>
        </>
      ) : (
        <figcaption className="py-8 text-ui-sm text-muted">{t('form.qrEmpty')}</figcaption>
      )}
    </figure>
  );
}
