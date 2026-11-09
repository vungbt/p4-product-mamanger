import { Alert, Button, Spinner } from '@itclabs/react-ui';
import { useCapabilities } from '@stay/sdk/react';
import { getErrorMessage } from '@stay/sdk/shared';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { type AbilityCheck, useCanOpen } from '@/libraries/ability';
import { useAuth } from '@/libraries/session/auth-provider';
import ForbiddenPage from '@/modules/errors/forbidden-page';
import { ROUTES } from './route-configs';

export type LoginRedirectState = { from?: string };

/** A same-app path to return to after sign-in (never an absolute or protocol-relative URL). */
export function safeReturnPath(state: unknown): string {
  if (!state || typeof state !== 'object' || !('from' in state)) return ROUTES.overview;

  const { from } = state;

  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//'))
    return ROUTES.overview;
  return from.startsWith(ROUTES.login) ? ROUTES.overview : from;
}

export function PageSpinner() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-64 items-center justify-center" role="status" aria-live="polite">
      <Spinner label={t('app.loading')} />
    </div>
  );
}

function FullPageSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas">
      <PageSpinner />
    </div>
  );
}

/** Signed-out visitors go to the login page, which brings them back here afterwards. */
export function RequireAuth() {
  const { user, isRestoring } = useAuth();
  const location = useLocation();

  if (isRestoring && !user) return <FullPageSpinner />;

  if (!user) {
    const state: LoginRedirectState = {
      from: `${location.pathname}${location.search}${location.hash}`,
    };

    return <Navigate to={ROUTES.login} replace state={state} />;
  }

  return <Outlet />;
}

/** The login page: already signed-in users continue to the page they wanted. */
export function GuestOnly() {
  const { user, isRestoring } = useAuth();
  const location = useLocation();

  if (isRestoring && !user) return <FullPageSpinner />;
  if (user) return <Navigate to={safeReturnPath(location.state)} replace />;
  return <Outlet />;
}

/** Opens a page only with unconditional access to its subject; otherwise shows 403. */
export function RequireAbility({
  ability,
  children,
}: {
  ability: AbilityCheck;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const capabilities = useCapabilities(user?.id);
  const allowed = useCanOpen(ability);

  if (capabilities.isPending) return <PageSpinner />;

  if (capabilities.isError && !capabilities.data) {
    return (
      <Alert
        tone="danger"
        title={t('errors.loadFailed')}
        action={
          <Button variant="secondary" size="sm" onClick={() => void capabilities.refetch()}>
            {t('errors.retry')}
          </Button>
        }
      >
        {getErrorMessage(capabilities.error, t('errors.loadFailed'))}
      </Alert>
    );
  }

  return allowed ? children : <ForbiddenPage />;
}
