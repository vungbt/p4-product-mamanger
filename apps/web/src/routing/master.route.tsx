import { type ComponentType, type LazyExoticComponent, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';
import type { IRoute } from '@/routing/route.types';
import { flattenRouteElements } from '@/routing/route.types';
import { GuestRoute, ProtectedRoute } from '@/routing/route-guards';

function PageLoading() {
  const { t } = useTranslation();
  return <p style={{ padding: 16 }}>{t('app.loading')}</p>;
}

function LazyPage({ component: Page }: { component: LazyExoticComponent<ComponentType<object>> }) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Page />
    </Suspense>
  );
}

function renderLeafRoutes(routes: IRoute[]): React.ReactNode {
  return flattenRouteElements(routes).map((route) => {
    const page = <LazyPage component={route.component} />;

    if (route.authority?.length) {
      return (
        <Route
          key={route.name}
          element={
            <ProtectedRoute
              allowedRoles={route.authority}
              loginPath={route.loginPath ?? ROUTES.storefront.login}
            />
          }
        >
          <Route path={route.path} element={page} />
        </Route>
      );
    }

    return <Route key={route.name} path={route.path} element={page} />;
  });
}

function renderLayoutChildren(route: IRoute): React.ReactNode {
  return (
    <>
      {route.name === 'admin-portal' && (
        <Route path="/admin" element={<Navigate to={ROUTES.admin.dashboard} replace />} />
      )}
      {renderLeafRoutes(route.routes ?? [])}
    </>
  );
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

  if (route.routes?.length) {
    const layout = <LazyPage component={route.component} />;

    if (route.authority?.length) {
      return (
        <Route
          key={route.name}
          element={
            <ProtectedRoute
              allowedRoles={route.authority}
              loginPath={route.loginPath ?? ROUTES.storefront.login}
            />
          }
        >
          <Route element={layout}>{renderLayoutChildren(route)}</Route>
        </Route>
      );
    }

    return (
      <Route key={route.name} element={layout}>
        {renderLayoutChildren(route)}
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
