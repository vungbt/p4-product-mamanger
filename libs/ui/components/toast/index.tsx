import type { ReactNode } from 'react';
import { type ExternalToast, Toaster as SonnerToaster, type ToasterProps, toast } from 'sonner';
import { cn } from '../../helpers/utils';
import { RenderIcon } from '../icons';
import './toast.css';

type ToastTone = 'success' | 'error' | 'pending' | 'info';

const toneClasses: Record<ToastTone, string> = {
  success: 'bg-success',
  error: 'bg-error',
  pending: 'bg-pending',
  info: 'bg-info',
};

function ToastBadge({ tone, children }: { tone: ToastTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white',
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}

// Per docs/design/p4-product-manager-design.html (Section A · Toast): success uses a check icon,
// error/pending/info use a bold "!"/"!"/"i" glyph (not an outline icon).
const TOAST_ICONS = {
  success: (
    <ToastBadge tone="success">
      <RenderIcon name="check" strokeWidth={3} className="!h-3 !w-3" />
    </ToastBadge>
  ),
  error: (
    <ToastBadge tone="error">
      <span className="text-[12px] font-extrabold leading-none">!</span>
    </ToastBadge>
  ),
  warning: (
    <ToastBadge tone="pending">
      <span className="text-[12px] font-extrabold leading-none">!</span>
    </ToastBadge>
  ),
  info: (
    <ToastBadge tone="info">
      <span className="text-[12px] font-extrabold leading-none">i</span>
    </ToastBadge>
  ),
};

export const Toaster = (props: ToasterProps) => {
  return <SonnerToaster richColors {...props} icons={TOAST_ICONS} />;
};

export const toastSuccess = (message: string, options?: ExternalToast) =>
  toast.success(message, { ...options });

export const toastError = (message: string, options?: ExternalToast) =>
  toast.error(message, { ...options });

export const toastWarning = (message: string, options?: ExternalToast) =>
  toast.warning(message, { ...options });

export const toastInfo = (message: string, options?: ExternalToast) =>
  toast.info(message, { ...options });
