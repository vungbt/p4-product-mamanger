import { lazy } from 'react';
import { ROUTES } from '@/constants/constants';
import type { IRoute } from '@/routing/route.types';

const StorefrontLoginScreen = lazy(() => import('@/modules/storefront/storefront-login-page'));
const ShopScreen = lazy(() => import('@/modules/storefront/shop-page'));
const CartScreen = lazy(() => import('@/modules/storefront/cart-page'));
const StorefrontLayout = lazy(() => import('@/modules/storefront/storefront-layout'));

export const storefrontLoginRoute: IRoute = {
  path: ROUTES.storefront.login,
  name: 'storefront-login',
  component: StorefrontLoginScreen,
  guestOnly: true,
  guestAuthority: ['user'],
  guestRedirect: ROUTES.storefront.shop,
  hideInMenu: true,
};

export const storefrontPortalRoutes: IRoute[] = [
  {
    path: '/',
    name: 'storefront-portal',
    component: StorefrontLayout,
    authority: ['user'],
    loginPath: ROUTES.storefront.login,
    hideInMenu: true,
    routes: [
      {
        path: ROUTES.storefront.shop,
        name: 'shop',
        label: 'Shop',
        iconName: 'home',
        component: ShopScreen,
        exact: true,
      },
      {
        path: ROUTES.storefront.cart,
        name: 'cart',
        label: 'Cart',
        iconName: 'briefcase',
        component: CartScreen,
        exact: true,
      },
    ],
  },
];
