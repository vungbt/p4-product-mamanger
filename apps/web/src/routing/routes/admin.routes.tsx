import { lazy } from 'react';
import { ROUTES } from '@/constants/constants';
import type { IRoute } from '@/routing/route.types';

const AdminLoginScreen = lazy(() => import('@/modules/admin/admin-login-page'));
const AdminDashboardScreen = lazy(() => import('@/modules/admin/admin-dashboard-page'));
const AdminProductsScreen = lazy(() => import('@/modules/admin/admin-products-page'));
const AdminOrdersScreen = lazy(() => import('@/modules/admin/admin-orders-page'));
const AdminLayout = lazy(() => import('@/modules/admin/admin-layout'));

export const adminLoginRoute: IRoute = {
  path: ROUTES.admin.login,
  name: 'admin-login',
  component: AdminLoginScreen,
  guestOnly: true,
  guestAuthority: ['admin'],
  guestRedirect: ROUTES.admin.dashboard,
  hideInMenu: true,
};

export const adminPortalRoutes: IRoute[] = [
  {
    path: '/admin',
    name: 'admin-portal',
    component: AdminLayout,
    authority: ['admin'],
    loginPath: ROUTES.admin.login,
    hideInMenu: true,
    routes: [
      {
        path: ROUTES.admin.dashboard,
        name: 'admin-dashboard',
        label: 'Dashboard',
        iconName: 'graph',
        component: AdminDashboardScreen,
        exact: true,
      },
      {
        path: ROUTES.admin.products,
        name: 'admin-products',
        label: 'Products',
        iconName: 'frame',
        component: AdminProductsScreen,
        exact: true,
      },
      {
        path: ROUTES.admin['product-new'],
        name: 'product-new',
        label: 'Thêm mới',
        component: AdminProductsScreen,
        hideInMenu: true,
      },
      {
        path: '/admin/products/:id/edit',
        name: 'product-edit',
        label: 'Chỉnh sửa',
        component: AdminProductsScreen,
        hideInMenu: true,
      },
      {
        path: ROUTES.admin.orders,
        name: 'admin-orders',
        label: 'Orders',
        iconName: 'receipt-search',
        component: AdminOrdersScreen,
        exact: true,
      },
    ],
  },
];
