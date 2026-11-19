import { AlertDialog, type IconName } from '@itclabs/react-ui';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

export type ConfirmOptions = {
  title: string;
  description?: ReactNode;
  tone?: 'default' | 'danger';
  confirmLabel?: string;
  cancelLabel?: string;
  confirmIcon?: IconName;
  onConfirm?: () => Promise<unknown> | unknown;
};

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

type Request = {
  options: ConfirmOptions;
  resolve: (confirmed: boolean) => void;
  opener: HTMLElement | null;
};

const ConfirmContext = createContext<Confirm | null>(null);

/** A single dialog serializes requests; promises settle only after its closing focus event. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  const requests = useRef<Request[]>([]);

  const busy = useRef(false);

  const result = useRef(false);

  const [request, setRequest] = useState<Request>();

  const [open, setOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  const confirm = useCallback<Confirm>((options) => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    return new Promise((resolve) => {
      const next = { options, resolve, opener };
      requests.current.push(next);
      if (requests.current.length === 1) {
        setRequest(next);
        setOpen(true);
      }
    });
  }, []);

  useEffect(
    () => () => {
      for (const pending of requests.current.splice(0)) pending.resolve(false);
    },
    [],
  );

  const close = (confirmed: boolean) => {
    if (busy.current) return;
    result.current = confirmed;
    setOpen(false);
  };

  const accept = async () => {
    if (!request || busy.current) return;
    if (!request.options.onConfirm) {
      close(true);
      return;
    }

    busy.current = true;
    setLoading(true);
    try {
      await request.options.onConfirm();
      if (requests.current[0] !== request) return;
      busy.current = false;
      close(true);
    } catch {
      // The caller reports its own error. Keep this request pending so it can retry or cancel.
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  // Radix AlertDialog intentionally suppresses outside dismissal; observe its overlay directly.
  useEffect(() => {
    if (!open) return;

    const dismiss = (event: PointerEvent) => {
      if (
        !busy.current &&
        event.target instanceof HTMLElement &&
        event.target.dataset.testid === 'shared-confirm-overlay'
      ) {
        result.current = false;
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', dismiss, true);
    return () => document.removeEventListener('pointerdown', dismiss, true);
  }, [open]);

  const options = request?.options;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && options && (
        <AlertDialog
          data-testid="shared-confirm"
          open={open}
          onOpenChange={(next) => {
            if (!next) close(false);
          }}
          title={options.title}
          description={options.description}
          confirmLoading={loading}
          contentProps={{
            onCloseAutoFocus: (event) => {
              event.preventDefault();
              if (open || requests.current[0] !== request) return;
              request.opener?.focus();
              requests.current.shift()?.resolve(result.current);
              result.current = false;
              const next = requests.current[0];
              setRequest(next);
              setOpen(Boolean(next));
            },
          }}
          closeOnConfirm={false}
          onConfirm={() => void accept()}
          tone={options.tone}
          confirmLabel={options.confirmLabel ?? t('confirm.confirm')}
          cancelLabel={options.cancelLabel ?? t('confirm.cancel')}
          confirmIcon={options.confirmIcon ?? (options.tone === 'danger' ? 'delete' : 'check')}
          cancelIcon="close"
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext);

  if (!confirm) throw new Error('useConfirm must be used within ConfirmProvider');
  return confirm;
}
