import { lazy } from 'react';
import { ROUTES } from '@/constants/constants';
import type { IRoute } from '@/routing/route.types';

const AdminLoginScreen = lazy(() => import('@/modules/admin/login/page'));
const AdminDashboardScreen = lazy(() => import('@/modules/admin/dashboard/page'));
const AdminProductsScreen = lazy(() => import('@/modules/admin/products/page'));
const AdminProductDetailScreen = lazy(() => import('@/modules/admin/products/detail/page'));
const AdminVariantsScreen = lazy(() => import('@/modules/admin/products/variants/page'));
const AdminCategoriesScreen = lazy(() => import('@/modules/admin/categories/page'));
const AdminOrdersScreen = lazy(() => import('@/modules/admin/orders/page'));
const AdminLayout = lazy(() => import('@/modules/admin/layout/layout'));

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
        ability: { action: 'read', subject: 'Report' },
        label: 'Dashboard',
        iconName: 'chart',
        component: AdminDashboardScreen,
        exact: true,
      },
      {
        path: ROUTES.admin.products,
        name: 'admin-products',
        label: 'Products',
        iconName: 'grid',
        component: AdminProductsScreen,
        existSubMenu: true,
        routes: [
          {
            path: ROUTES.admin.products,
            name: 'product-list',
            ability: { action: 'read', subject: 'Catalog' },
            label: 'Product list',
            component: AdminProductsScreen,
            exact: true,
          },
          {
            path: ROUTES.admin['product-variants'],
            name: 'product-variants',
            ability: { action: 'read', subject: 'Catalog' },
            label: 'SKUs',
            component: AdminVariantsScreen,
            exact: true,
          },
          {
            path: ROUTES.admin['product-categories'],
            name: 'product-categories',
            ability: { action: 'read', subject: 'Catalog' },
            label: 'Categories',
            component: AdminCategoriesScreen,
            exact: true,
          },
          {
            path: ROUTES.admin['product-new'],
            name: 'product-new',
            ability: { action: 'write', subject: 'Catalog' },
            label: 'Create product',
            component: AdminProductsScreen,
            exact: true,
          },
          {
            path: '/admin/products/:id/edit',
            name: 'product-edit',
            ability: { action: 'write', subject: 'Catalog' },
            label: 'Edit product',
            component: AdminProductsScreen,
            hideInMenu: true,
          },
          {
            path: '/admin/products/:id',
            name: 'product-detail',
            ability: { action: 'read', subject: 'Catalog' },
            label: 'Product details',
            component: AdminProductDetailScreen,
            hideInMenu: true,
          },
        ],
      },
      {
        path: ROUTES.admin.orders,
        name: 'admin-orders',
        ability: { action: 'read', subject: 'Order' },
        label: 'Orders',
        iconName: 'receiptSearch',
        component: AdminOrdersScreen,
        exact: true,
      },
    ],
  },
];
