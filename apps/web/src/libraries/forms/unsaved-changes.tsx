import { AlertDialog } from '@itclabs/react-ui';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import { type BlockerFunction, useBlocker } from 'react-router-dom';
import { createUnsavedChangesRegistry } from './unsaved-changes-registry';

type Registry = ReturnType<typeof createUnsavedChangesRegistry>;

const UnsavedChangesContext = createContext<Registry | null>(null);

/** React Router supports one blocker; all mounted forms register with this provider. */
export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  const registry = useMemo(createUnsavedChangesRegistry, []);

  const shouldBlock = useCallback<BlockerFunction>(() => registry.isDirty(), [registry]);

  const blocker = useBlocker(shouldBlock);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => registry.beforeUnload(event);

    window.addEventListener('beforeunload', warn);

    return () => window.removeEventListener('beforeunload', warn);
  }, [registry]);

  return (
    <UnsavedChangesContext.Provider value={registry}>
      {children}
      <AlertDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => {
          if (!open && blocker.state === 'blocked') blocker.reset();
        }}
        title={t('unsavedChanges.title')}
        description={t('unsavedChanges.description')}
        confirmLabel={t('unsavedChanges.leave')}
        cancelLabel={t('unsavedChanges.stay')}
        confirmIcon="logout"
        cancelIcon="edit"
        tone="danger"
        closeOnConfirm={false}
        onConfirm={() => {
          if (blocker.state === 'blocked') blocker.proceed();
        }}
        data-testid="unsaved-changes-dialog"
      />
    </UnsavedChangesContext.Provider>
  );
}

/** Bypass only after a successful save/delete; Cancel still asks when dirty. */
export function useUnsavedChanges(dirty: boolean) {
  const registry = useContext(UnsavedChangesContext);

  const guard = useRef({ dirty, bypass: false });

  if (!registry) throw new Error('useUnsavedChanges requires UnsavedChangesProvider');

  useLayoutEffect(() => {
    guard.current.dirty = dirty;
    guard.current.bypass = false;
  }, [dirty]);

  useLayoutEffect(() => registry.register(guard.current), [registry]);

  const allowNavigation = useCallback(() => {
    guard.current.bypass = true;
  }, []);

  return { allowNavigation };
}
