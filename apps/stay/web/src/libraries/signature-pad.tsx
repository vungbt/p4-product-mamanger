import { Button, cn } from '@itclabs/react-ui';
import { type PointerEvent, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type SignaturePadProps = {
  /** Current signature as a PNG/JPEG data URL, `null` when empty. */
  value: string | null;
  /** A PNG data URL after each stroke, `null` when cleared. */
  onChange: (dataUrl: string | null) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
};

/** Width of the exported image: enough for a clear print, far below the 200 KB API limit. */
const EXPORT_WIDTH = 600;
/** The canvas keeps a 3:1 signature box. */
const RATIO = 3;

/** Ink colour from the kit's ink token (falls back to near-black). */
function inkColor(element: HTMLElement): string {
  return getComputedStyle(element).getPropertyValue('--color-ink').trim() || '#111827';
}

/**
 * Hand-drawn signature (O-35 owner, T-12 tenant): pointer events (mouse, touch, pen), crisp on
 * high-DPI screens, transparent background. Emits a PNG data URL when a stroke ends; "Xoá" clears
 * it. Keyboard users get the typed-name option of the signing form instead.
 */
export function SignaturePad({ value, onChange, label, hint, disabled }: SignaturePadProps) {
  const { t } = useTranslation('documents');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [inked, setInked] = useState(false);
  const labelId = useId();
  const hintId = useId();

  // Size the backing store to the box × device pixel ratio (kept on resize; strokes reset).
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;
    const resize = () => {
      const width = canvas.clientWidth;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round((width / RATIO) * ratio);
      const context = canvas.getContext('2d');

      context?.setTransform(ratio, 0, 0, ratio, 0, 0);
      setInked(false);
    };
    const observer = new ResizeObserver(resize);

    resize();
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const pointOf = (event: PointerEvent<HTMLCanvasElement>) => {
    const box = event.currentTarget.getBoundingClientRect();

    return { x: event.clientX - box.left, y: event.clientY - box.top };
  };

  const start = (event: PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = event.currentTarget;
    const context = canvas.getContext('2d');

    if (!context) return;
    if (!inked) context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.setPointerCapture(event.pointerId);
    drawing.current = true;
    last.current = pointOf(event);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = 2.5;
    context.strokeStyle = inkColor(canvas);
    context.fillStyle = context.strokeStyle;
    context.beginPath();
    context.arc(last.current.x, last.current.y, 1.2, 0, Math.PI * 2);
    context.fill();
    setInked(true);
  };

  const move = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !last.current) return;
    const context = event.currentTarget.getContext('2d');
    const point = pointOf(event);

    if (!context) return;
    context.beginPath();
    context.moveTo(last.current.x, last.current.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    last.current = point;
  };

  const end = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    const canvas = event.currentTarget;
    const output = document.createElement('canvas');
    const width = Math.min(EXPORT_WIDTH, canvas.width);

    output.width = width;
    output.height = Math.round(width / RATIO);
    output.getContext('2d')?.drawImage(canvas, 0, 0, output.width, output.height);
    onChange(output.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;

    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setInked(false);
    onChange(null);
  };

  return (
    <div className="grid min-w-0 gap-1.5">
      <span id={labelId} className="text-ui-sm font-medium text-ink">
        {label}
      </span>
      <div className="relative overflow-hidden rounded-control border border-control-border bg-surface">
        <canvas
          ref={canvasRef}
          role="img"
          aria-labelledby={labelId}
          aria-describedby={hint ? hintId : undefined}
          data-testid="signature-pad"
          className={cn(
            'block aspect-3/1 w-full touch-none',
            disabled ? 'cursor-not-allowed opacity-60' : 'cursor-crosshair',
          )}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        />
        {value && !inked ? (
          <img
            src={value}
            alt=""
            className="pointer-events-none absolute inset-0 size-full object-contain"
          />
        ) : null}
        {!value && !inked ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-ui-sm text-muted">
            {t('drawHere')}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {hint ? (
          <p id={hintId} className="text-ui-sm text-muted">
            {hint}
          </p>
        ) : (
          <span />
        )}
        <Button size="sm" variant="ghost" disabled={disabled || (!value && !inked)} onClick={clear}>
          {t('clearSignature')}
        </Button>
      </div>
    </div>
  );
}
