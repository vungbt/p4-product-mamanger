import { Alert, Button, Spinner } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useCanAccess } from '@p4/ability/browser';
import type { AbilityCheck } from '@p4/ability/shared';
import { useCapabilities } from '@p4/api-sdk/react';
import { ApiSdkError } from '@p4/api-sdk/shared';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';
import useAuth from '@/hooks/use-auth';
import type { Role } from '@/types/types';

function UnauthorizedRedirect({ to }: { to: string }) {
  const { t } = useTranslation();

  useEffect(() => {
    toast.error(t('auth.unauthorized'));
  }, [t]);

  return <Navigate to={to} replace />;
}

export function ProtectedRoute({
  allowedRoles,
  loginPath,
}: {
  allowedRoles: Role[];
  loginPath: string;
}) {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  }

  if (role && !allowedRoles.includes(role)) {
    const fallback = role === 'admin' ? ROUTES.admin.dashboard : ROUTES.storefront.shop;
    return <UnauthorizedRedirect to={fallback} />;
  }

  return <Outlet />;
}

export function GuestRoute({
  allowedRoles,
  redirectTo,
}: {
  allowedRoles: Role[];
  redirectTo: string;
}) {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated && role && allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}

export function CapabilityRoute({
  ability,
  children,
}: {
  ability: AbilityCheck;
  children: ReactNode;
}) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const query = useCapabilities(user?.id);
  const allowed = useCanAccess(ability.action, ability.subject);
  const status = query.error instanceof ApiSdkError ? query.error.status : undefined;

  useEffect(() => {
    if (status === 401) logout();
  }, [status, logout]);

  if (query.isPending || status === 401) return <Spinner label={t('app.loading')} />;

  if (status === 403 || (!query.isError && !allowed)) {
    return <Alert tone="danger">403 — {t('auth.unauthorized')}</Alert>;
  }

  if (query.isError) {
    return (
      <div className="grid gap-3">
        <Alert tone="danger">{query.error.message}</Alert>
        <Button variant="secondary" onClick={() => void query.refetch()}>
          {t('categories.retry')}
        </Button>
      </div>
    );
  }

  return children;
}
