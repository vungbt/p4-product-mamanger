import { type ComponentType, type LazyExoticComponent, lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { appRoutes, ROUTES } from './route-configs';
import { GuestOnly, PageSpinner, RequireAbility, RequireAuth } from './route-guards';

const LoginPage = lazy(() => import('@/modules/login/page'));
const AppLayout = lazy(() => import('@/modules/layout/app-layout'));
const NotFoundPage = lazy(() => import('@/modules/errors/not-found-page'));
const PublicInvoicePage = lazy(() => import('@/modules/invoices/share/public-page'));
const PortalLayout = lazy(() => import('@/modules/portal/portal-layout'));
const PortalEntryPage = lazy(() => import('@/modules/portal/entry-page'));
const PortalSignedOutPage = lazy(() => import('@/modules/portal/signed-out-page'));
const PortalHomePage = lazy(() => import('@/modules/portal/home-page'));
const PortalInvoicesPage = lazy(() => import('@/modules/portal/invoices-page'));
const PortalInvoicePage = lazy(() => import('@/modules/portal/invoice-page'));
const PortalContractPage = lazy(() => import('@/modules/portal/contract-page'));
const PortalUsagePage = lazy(() => import('@/modules/portal/usage-page'));
const PortalNoticesPage = lazy(() => import('@/modules/portal/notices-page'));
const PortalMorePage = lazy(() => import('@/modules/portal/more-page'));
const PortalNotificationsPage = lazy(() => import('@/modules/portal/notifications-page'));
const PortalMaintenancePage = lazy(() => import('@/modules/portal/maintenance-page'));
const PortalMaintenanceNewPage = lazy(() => import('@/modules/portal/maintenance-new-page'));
const PortalRequestsPage = lazy(() => import('@/modules/portal/requests-page'));
const PortalRequestNewPage = lazy(() => import('@/modules/portal/request-new-page'));

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
      {/* T-01 shared invoice: public, outside the signed-in shell (works signed in or out). */}
      <Route path={ROUTES.publicInvoice} element={<LazyPage component={PublicInvoicePage} />} />

      {/* ST-25 tenant portal: outside the staff shell and sign-in (portal session cookie). */}
      <Route path={ROUTES.portalEntry} element={<LazyPage component={PortalEntryPage} />} />
      <Route path={ROUTES.portalSignedOut} element={<LazyPage component={PortalSignedOutPage} />} />
      <Route path={ROUTES.portal} element={<LazyPage component={PortalLayout} />}>
        <Route index element={<LazyPage component={PortalHomePage} />} />
        <Route path="invoices" element={<LazyPage component={PortalInvoicesPage} />} />
        <Route path="invoices/:id" element={<LazyPage component={PortalInvoicePage} />} />
        <Route path="contract" element={<LazyPage component={PortalContractPage} />} />
        <Route path="usage" element={<LazyPage component={PortalUsagePage} />} />
        <Route path="notices" element={<LazyPage component={PortalNoticesPage} />} />
        <Route path="more" element={<LazyPage component={PortalMorePage} />} />
        <Route path="notifications" element={<LazyPage component={PortalNotificationsPage} />} />
        <Route path="maintenance" element={<LazyPage component={PortalMaintenancePage} />} />
        <Route path="maintenance/new" element={<LazyPage component={PortalMaintenanceNewPage} />} />
        <Route path="requests" element={<LazyPage component={PortalRequestsPage} />} />
        <Route path="requests/new" element={<LazyPage component={PortalRequestNewPage} />} />
      </Route>

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
