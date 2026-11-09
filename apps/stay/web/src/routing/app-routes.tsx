import { type ComponentType, type LazyExoticComponent, lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { appRoutes, ROUTES } from './route-configs';
import { GuestOnly, PageSpinner, RequireAbility, RequireAuth } from './route-guards';

const LoginPage = lazy(() => import('@/modules/login/page'));
const AppLayout = lazy(() => import('@/modules/layout/app-layout'));
const NotFoundPage = lazy(() => import('@/modules/errors/not-found-page'));

function LazyPage({ component: Page }: { component: LazyExoticComponent<ComponentType> }) {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Page />
    </Suspense>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path={ROUTES.login} element={<LazyPage component={LoginPage} />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<LazyPage component={AppLayout} />}>
          {appRoutes.map((route) => (
            <Route
              key={route.name}
              path={route.path}
              element={
                <RequireAbility ability={route.ability}>
                  <LazyPage component={route.component} />
                </RequireAbility>
              }
            />
          ))}
          <Route path="*" element={<LazyPage component={NotFoundPage} />} />
        </Route>
      </Route>
    </Routes>
  );
}
