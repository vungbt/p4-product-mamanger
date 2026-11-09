import { Icon } from '@itclabs/react-ui';
import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

export function useOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine);
}

/** C-03: top banner while the browser is offline; hides itself when the network returns. */
export function OfflineBanner() {
  const { t } = useTranslation();
  const online = useOnline();

  return (
    <div role="status" aria-live="polite" className="sticky top-0 z-50">
      {online ? null : (
        <p
          className="flex items-center justify-center gap-2 bg-warning-50 px-4 py-2 text-ui-sm font-medium text-warning-700"
          data-testid="offline-banner"
        >
          <Icon name="signalOff" className="size-4 shrink-0" aria-hidden />
          {t('errors.offline')}
        </p>
      )}
    </div>
  );
}
