import { RenderIcon } from '@p4/ui';
import { type ComponentType, type LazyExoticComponent, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';
import BrandLogo from '@/libraries/brand-logo';
import type { IRoute } from '@/routing/route.types';
import { flattenRouteElements } from '@/routing/route.types';
import { GuestRoute, ProtectedRoute } from '@/routing/route-guards';

function PageLoading() {
  const { t } = useTranslation();

  return (
    <div
      className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center overflow-hidden bg-primary-background px-6"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-none absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-warning/15 blur-3xl" />

      <div className="relative flex w-full max-w-xs flex-col items-center rounded-3xl border border-white/70 bg-neutral-white/75 px-8 py-9 text-center shadow-2xl shadow-primary/10 backdrop-blur-xl">
        <BrandLogo variant="header" height={34} />

        <div className="relative mt-8 flex h-14 w-14 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-primary/20" />
          <div className="absolute inset-0 motion-safe:animate-ping rounded-full border border-primary/20" />
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/25">
            <RenderIcon name="loading" className="!h-5 !w-5 motion-safe:animate-spin" />
          </div>
        </div>

        <p className="mt-5 text-14 font-medium text-neutral-text-primary">{t('app.loading')}</p>
        <div className="mt-4 h-1 w-24 overflow-hidden rounded-full bg-primary/10">
          <div className="h-full w-1/2 rounded-full bg-primary motion-safe:animate-pulse" />
        </div>
      </div>
    </div>
  );
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
      {/* `/` is now a real route (storefront Home, see storefront.routes.tsx) — only truly
          unmatched paths fall back here. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
