import { Alert } from '@itclabs/react-ui';
export type InfoBannerProps = {
  className?: string;
  message: string;
  tone: 'error' | 'info' | 'pending' | 'success';
};
export function InfoBanner({ className, message, tone = 'info' }: InfoBannerProps) {
  return (
    <Alert
      className={className}
      tone={tone === 'error' ? 'danger' : tone === 'pending' ? 'warning' : tone}
    >
      {message}
    </Alert>
  );
}
