import { AlertDialog } from '@itclabs/react-ui';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import { type BlockerFunction, useBlocker } from 'react-router-dom';

/** A mounted form: whether it has unsaved changes, and whether leaving was allowed on purpose. */
type Guard = { dirty: boolean; bypass: boolean };

type Registry = {
  register: (guard: Guard) => () => void;
};

const UnsavedChangesContext = createContext<Registry | null>(null);

/**
 * One navigation blocker for the whole app (React Router supports a single active `useBlocker`;
 * with several, none blocks). Forms register through `useUnsavedChanges`; leaving asks first
 * while any registered form is dirty. Mount once inside the data router.
 */
export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation('forms');
  const guards = useRef(new Set<Guard>());

  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) =>
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search) &&
      [...guards.current].some((guard) => guard.dirty && !guard.bypass),
    [],
  );
  const blocker = useBlocker(shouldBlock);

  const registry = useMemo<Registry>(
    () => ({
      register: (guard) => {
        guards.current.add(guard);
        return () => {
          guards.current.delete(guard);
        };
      },
    }),
    [],
  );

  return (
    <UnsavedChangesContext.Provider value={registry}>
      {children}
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
    </UnsavedChangesContext.Provider>
  );
}

type UnsavedChanges = {
  /** Kept for call sites; the prompt itself is rendered by `UnsavedChangesProvider`. */
  prompt: ReactNode;
  /** Call right before navigating away on purpose (after a save or an explicit cancel). */
  allowNavigation: () => void;
};

/**
 * screens.md "Quy ước chung": leaving a form with unsaved changes asks first. In-app navigation
 * (links, back button) opens a confirmation; reload/close uses the browser's own prompt.
 */
export function useUnsavedChanges(dirty: boolean): UnsavedChanges {
  const registry = useContext(UnsavedChangesContext);
  const guard = useRef<Guard>({ dirty, bypass: false });

  useEffect(() => {
    guard.current.dirty = dirty;
    if (dirty) guard.current.bypass = false;
  }, [dirty]);

  useEffect(() => registry?.register(guard.current), [registry]);

  useEffect(() => {
    if (!dirty) return;

    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const allowNavigation = useCallback(() => {
    guard.current.bypass = true;
  }, []);

  return { prompt: null, allowNavigation };
}
