import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ROUTES } from '@/constants/constants';
import useAuth from '@/hooks/use-auth';
import type { Role } from '@/types/types';

function UnauthorizedRedirect({ to }: { to: string }) {
  useEffect(() => {
    toast.error('Không có quyền truy cập');
  }, []);

  return <Navigate to={to} replace />;
}

export function ProtectedRoute({
  allowedRoles,
  loginPath,
}: {
  allowedRoles: Role[];
  loginPath: string;
}) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

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
  const { isAuthenticated, role } = useAuth();

  if (isAuthenticated && role && allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
