import { cn } from '../../helpers';
import { RenderIcon } from '../icons';

export type InfoBannerProps = {
  className?: string;
  message: string;
  tone?: 'error' | 'info' | 'pending' | 'success';
};

export function InfoBanner({ className, message, tone = 'info' }: InfoBannerProps) {
  return (
    <div className={cn('flex items-center', className)}>
      {tone === 'success' ? (
        <div className="flex items-center gap-2.5 bg-success-bg border-success-border text-success border rounded-xl  px-4.5 py-3.5">
          <RenderIcon name="check-circle" className="!h-5.5 !w-5.5 rounded-full" />
          <span className="text-13 font-semibold">{message}</span>
        </div>
      ) : tone === 'error' ? (
        <div className="flex items-center gap-2.5 bg-error-bg border-error-border text-error border rounded-xl px-4.5 py-3.5">
          <RenderIcon name="exclamation-circle" className="!h-5.5 !w-5.5 rounded-full" />
          <span className="text-13 font-semibold">{message}</span>
        </div>
      ) : tone === 'pending' ? (
        <div className="flex items-center gap-2.5 bg-pending-bg border-pending-border text-pending  border rounded-xl px-4.5 py-3.5">
          <RenderIcon name="exclamation-triangle" className="!h-5.5 !w-5.5 rounded-full" />
          <span className="text-13 font-semibold">{message}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 bg-info-bg border-info-border text-info border rounded-xl  px-4.5 py-3.5">
          <RenderIcon name="information-circle" className="!h-5.5 !w-5.5 rounded-full" />
          <span className="text-13 font-semibold">{message}</span>
        </div>
      )}
    </div>
  );
}
