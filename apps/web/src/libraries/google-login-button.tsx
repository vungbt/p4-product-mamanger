import { Button, cn } from '@p4/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import useAuth from '@/hooks/use-auth';

const GIS_SCRIPT = 'https://accounts.google.com/gsi/client';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

type GoogleCredentialResponse = {
  credential: string;
};

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
      width?: number;
      logo_alignment?: 'left' | 'center';
    },
  ) => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

function loadGisScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('gis_load_failed')), {
        once: true,
      });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('gis_load_failed'));
    document.head.appendChild(script);
  });
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <title>Google</title>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

type GoogleLoginButtonProps = {
  className?: string;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

export default function GoogleLoginButton({
  className,
  onSuccess,
  onError,
}: GoogleLoginButtonProps) {
  const { t } = useTranslation();
  const { loginWithGoogle } = useAuth();
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [gisReady, setGisReady] = useState(!GOOGLE_CLIENT_ID);

  const handleCredential = useCallback(
    async (credential: string) => {
      setLoading(true);
      try {
        await loginWithGoogle(credential, 'storefront');
        onSuccess?.();
      } catch (error) {
        onError?.(error);
        let message = t('auth.googleFailed');
        if (error instanceof Error && error.message) {
          message = error.message.startsWith('auth.')
            ? t(error.message, { defaultValue: t('auth.googleFailed') })
            : error.message;
        }
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [loginWithGoogle, onError, onSuccess, t],
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    const mountGoogleButton = () => {
      const host = googleBtnRef.current;
      if (cancelled || !host || !window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          void handleCredential(response.credential);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      const width = Math.max(host.offsetWidth || 320, 280);
      host.innerHTML = '';
      window.google.accounts.id.renderButton(host, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width,
        logo_alignment: 'left',
      });
      setGisReady(true);
    };

    loadGisScript()
      .then(() => {
        mountGoogleButton();
        if (googleBtnRef.current && typeof ResizeObserver !== 'undefined') {
          resizeObserver = new ResizeObserver(() => mountGoogleButton());
          resizeObserver.observe(googleBtnRef.current);
        }
      })
      .catch(() => {
        if (!cancelled) toast.error(t('auth.googleFailed'));
      });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
    };
  }, [handleCredential, t]);

  const label = (
    <span className="inline-flex items-center justify-center gap-2.5">
      <GoogleMark className="h-5 w-5 shrink-0" />
      <span>{t('auth.continueWithGoogle')}</span>
    </span>
  );

  // Chưa cấu hình Client ID → không fake, báo cấu hình
  if (!GOOGLE_CLIENT_ID) {
    return (
      <Button
        type="button"
        variant="outline"
        color="neutral"
        size="large"
        className={cn('w-full', className)}
        onClick={() => toast.info(t('auth.googleNotConfigured'))}
      >
        {label}
      </Button>
    );
  }

  // Custom skin + Google iframe trong suốt phủ lên (click vẫn đi qua GIS)
  return (
    <div className={cn('relative w-full', className)}>
      <Button
        type="button"
        variant="outline"
        color="neutral"
        size="large"
        className="pointer-events-none w-full border-neutral-border bg-neutral-white text-neutral-text-primary shadow-none"
        loading={loading || !gisReady}
        tabIndex={-1}
        aria-hidden
      >
        {label}
      </Button>

      <div
        ref={googleBtnRef}
        className={cn(
          'absolute inset-0 z-10 overflow-hidden rounded-lg opacity-0',
          '[&>div]:!h-full [&>div]:!w-full',
          '[&_iframe]:!h-full [&_iframe]:!min-h-full [&_iframe]:!w-full',
          (loading || !gisReady) && 'pointer-events-none',
        )}
      />
    </div>
  );
}
