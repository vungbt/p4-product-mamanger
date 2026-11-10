import { AlertDialog } from '@itclabs/react-ui';
import { type ReactNode, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { type BlockerFunction, useBlocker } from 'react-router-dom';

type UnsavedChanges = {
  /** Render once: asks before leaving the page while `dirty`. */
  prompt: ReactNode;
  /** Call right before navigating away on purpose (after a save or an explicit cancel). */
  allowNavigation: () => void;
};

/**
 * screens.md "Quy ước chung": leaving a form with unsaved changes asks first. In-app navigation
 * (links, back button) opens a confirmation; reload/close uses the browser's own prompt.
 */
export function useUnsavedChanges(dirty: boolean): UnsavedChanges {
  const { t } = useTranslation('forms');
  const dirtyRef = useRef(dirty);
  const bypassRef = useRef(false);

  useEffect(() => {
    dirtyRef.current = dirty;
    if (dirty) bypassRef.current = false;
  }, [dirty]);

  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) =>
      dirtyRef.current &&
      !bypassRef.current &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search),
    [],
  );
  const blocker = useBlocker(shouldBlock);

  useEffect(() => {
    if (!dirty) return;

    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const allowNavigation = useCallback(() => {
    bypassRef.current = true;
  }, []);

  const prompt = (
    <AlertDialog
      open={blocker.state === 'blocked'}
      onOpenChange={(open) => {
        if (!open && blocker.state === 'blocked') blocker.reset();
      }}
      title={t('unsaved.title')}
      description={t('unsaved.description')}
      confirmLabel={t('unsaved.leave')}
      cancelLabel={t('unsaved.stay')}
      confirmVariant="danger"
      closeOnConfirm={false}
      onConfirm={() => {
        if (blocker.state === 'blocked') blocker.proceed();
      }}
      data-testid="unsaved-changes-dialog"
    />
  );

  return { prompt, allowNavigation };
}
