import { type ComponentType, type LazyExoticComponent, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';
import type { IRoute } from '@/routing/route.types';
import { flattenRouteElements } from '@/routing/route.types';
import { GuestRoute, ProtectedRoute } from '@/routing/route-guards';

function LazyPage({ component: Page }: { component: LazyExoticComponent<ComponentType<object>> }) {
  return (
    <Suspense fallback={<p style={{ padding: 16 }}>Đang tải...</p>}>
      <Page />
    </Suspense>
  );
}

function renderLeafRoutes(routes: IRoute[]): React.ReactNode {
  return flattenRouteElements(routes).map((route) => (
    <Route key={route.name} path={route.path} element={<LazyPage component={route.component} />} />
  ));
}

function renderRouteConfig(route: IRoute): React.ReactNode {
  if (route.guestOnly) {
    return (
      <Route
        key={route.name}
        element={
          <GuestRoute
            allowedRoles={route.guestAuthority ?? []}
            redirectTo={route.guestRedirect ?? '/'}
          />
        }
      >
        <Route path={route.path} element={<LazyPage component={route.component} />} />
      </Route>
    );
  }

  if (route.authority && route.routes?.length) {
    return (
      <Route
        key={route.name}
        element={
          <ProtectedRoute allowedRoles={route.authority} loginPath={route.loginPath ?? '/login'} />
        }
      >
        <Route element={<LazyPage component={route.component} />}>
          {route.name === 'admin-portal' && (
            <Route path="/admin" element={<Navigate to={ROUTES.admin.dashboard} replace />} />
          )}
          {renderLeafRoutes(route.routes)}
        </Route>
      </Route>
    );
  }

  return (
    <Route key={route.name} path={route.path} element={<LazyPage component={route.component} />} />
  );
}

export default function MasterRoutes({ routes }: { routes: IRoute[] }) {
  return (
    <Routes>
      {routes.map((route) => renderRouteConfig(route))}
      <Route path="/" element={<Navigate to={ROUTES.storefront.shop} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
