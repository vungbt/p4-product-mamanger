import { Alert, Button, Dialog, Icon, UploadField } from '@itclabs/react-ui';
import { type CccdQrData, type CccdQrError, parseCccdQr } from '@stay/shared';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { decodeQrFile, drawScaled, loadQrDecoder } from './qr-decoder';

/** Camera frames are decoded at most this often (ms). */
const FRAME_INTERVAL = 250;
/** Longer side of a decoded camera frame (px). */
const FRAME_MAX_SIDE = 1280;

type Status =
  | { kind: 'starting' | 'scanning' | 'reading' }
  | { kind: 'warning'; message: string }
  | { kind: 'error'; message: string };

const PARSE_MESSAGES: Record<CccdQrError, string> = {
  empty: 'tenants.scan.notFound',
  not_cccd: 'tenants.scan.notCccd',
  invalid_id_number: 'tenants.scan.invalidId',
};

/** `getUserMedia` failure → message key (permission, no device, busy device). */
function cameraErrorKey(error: unknown): string {
  const name = error instanceof DOMException ? error.name : '';

  if (name === 'NotAllowedError' || name === 'SecurityError') return 'tenants.scan.denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'tenants.scan.noCamera';
  return 'tenants.scan.cameraFailed';
}

/**
 * "Quét CCCD": opens the rear camera in a dialog and decodes the QR code on the card in the
 * browser, or reads a picked photo. On a CCCD code it calls `onScanned` and closes; the QR text
 * itself is never stored, logged or uploaded.
 */
export function CccdScanButton({
  onScanned,
  disabled,
}: {
  onScanned: (data: CccdQrData) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'starting' });
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const onScannedRef = useRef(onScanned);
  const fileId = useId();

  onScannedRef.current = onScanned;

  /** Parses decoded text; `true` when it was a CCCD (then the dialog closes). */
  const accept = (text: string): boolean => {
    const result = parseCccdQr(text);

    if (!result.ok) {
      setStatus({ kind: 'warning', message: t(PARSE_MESSAGES[result.error]) });
      return false;
    }
    setOpen(false);
    onScannedRef.current(result.data);
    return true;
  };
  const acceptRef = useRef(accept);

  acceptRef.current = accept;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    setStatus({ kind: 'starting' });
    setCameraOn(false);

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus({ kind: 'error', message: t('tenants.scan.noCamera') });
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
      } catch (error) {
        if (!cancelled) setStatus({ kind: 'error', message: t(cameraErrorKey(error)) });
        return;
      }

      const video = videoRef.current;

      if (cancelled || !video) {
        for (const track of stream.getTracks()) track.stop();
        return;
      }
      video.srcObject = stream;
      await video.play().catch(() => undefined);
      setCameraOn(true);
      setStatus({ kind: 'scanning' });

      let decode: Awaited<ReturnType<typeof loadQrDecoder>>;

      try {
        decode = await loadQrDecoder();
      } catch {
        if (!cancelled) setStatus({ kind: 'error', message: t('tenants.scan.decoderFailed') });
        return;
      }

      const canvas = document.createElement('canvas');
      const tick = async () => {
        if (cancelled) return;
        const ready =
          video.readyState >= video.HAVE_CURRENT_DATA &&
          drawScaled(canvas, video, video.videoWidth, video.videoHeight, FRAME_MAX_SIDE);
        const text = ready ? await decode(canvas).catch(() => null) : null;

        if (cancelled || (text && acceptRef.current(text))) return;
        timer = setTimeout(() => void tick(), FRAME_INTERVAL);
      };

      void tick();
    };

    void start();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      for (const track of stream?.getTracks() ?? []) track.stop();
    };
  }, [open, t]);

  const readPhoto = async (file: File) => {
    setStatus({ kind: 'reading' });
    try {
      const text = await decodeQrFile(file);

      if (!text) setStatus({ kind: 'warning', message: t('tenants.scan.notFound') });
      else accept(text);
    } catch {
      setStatus({ kind: 'warning', message: t('tenants.scan.notFound') });
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        disabled={disabled}
        onClick={() => setOpen(true)}
        data-testid="cccd-scan-button"
      >
        <Icon name="camera" className="size-4" aria-hidden />
        {t('tenants.scan.button')}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={t('tenants.scan.title')}
        description={t('tenants.scan.description')}
        data-testid="cccd-scan-dialog"
      >
        <div className="grid min-w-0 gap-3">
          <div className="relative aspect-video w-full overflow-hidden rounded-control bg-ink">
            <video
              ref={videoRef}
              className="size-full object-cover"
              playsInline
              muted
              aria-label={t('tenants.scan.video')}
              hidden={!cameraOn}
            />
            {cameraOn ? (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-1/5 rounded-control border-2 border-surface"
              />
            ) : null}
          </div>
          <div role="status" aria-live="polite" className="min-h-6">
            {status.kind === 'error' || status.kind === 'warning' ? (
              <Alert tone={status.kind === 'error' ? 'danger' : 'warning'}>{status.message}</Alert>
            ) : (
              <p className="text-ui-sm text-muted">{t(`tenants.scan.${status.kind}`)}</p>
            )}
          </div>
          <div className="grid gap-1.5">
            <UploadField
              id={fileId}
              accept="image/*"
              data-testid="cccd-scan-file"
              label={t('tenants.scan.pickPhoto')}
              maxBytes={Number.MAX_SAFE_INTEGER}
              onValueChange={(files) => {
                const file = files[0];
                if (file) void readPhoto(file);
              }}
            />
            <p className="text-ui-sm text-muted">{t('tenants.scan.pickPhotoHint')}</p>
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t('tenants.scan.manual')}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

/** Field labels (`tenants.fields.*` keys) of the values a scan provides. */
export function cccdFilledFields(data: CccdQrData): string[] {
  return [
    data.fullName ? 'fullName' : null,
    'idNumber',
    data.birthDate ? 'birthDate' : null,
    data.gender ? 'gender' : null,
    data.permanentAddress ? 'permanentAddress' : null,
    data.issuedAt ? 'idIssuedAt' : null,
  ].filter((field): field is string => field !== null);
}
