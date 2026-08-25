import { lazy } from 'react';
import { ROUTES } from '@/constants/constants';
import type { IRoute } from '@/routing/route.types';

const StorefrontLoginScreen = lazy(() => import('@/modules/storefront/login/page'));
const StorefrontRegisterScreen = lazy(() => import('@/modules/storefront/register/page'));
const StorefrontPasswordScreen = lazy(() => import('@/modules/storefront/password/page'));
const HomeScreen = lazy(() => import('@/modules/storefront/home/page'));
const ShopScreen = lazy(() => import('@/modules/storefront/shop/page'));
const CartScreen = lazy(() => import('@/modules/storefront/cart/page'));
const StorefrontLayout = lazy(() => import('@/modules/storefront/layout/layout'));

export const storefrontLoginRoute: IRoute = {
  path: ROUTES.storefront.login,
  name: 'storefront-login',
  component: StorefrontLoginScreen,
  guestOnly: true,
  guestAuthority: ['user'],
  guestRedirect: ROUTES.storefront.shop,
  hideInMenu: true,
};

export const storefrontRegisterRoute: IRoute = {
  path: ROUTES.storefront.register,
  name: 'storefront-register',
  component: StorefrontRegisterScreen,
  guestOnly: true,
  guestAuthority: ['user'],
  guestRedirect: ROUTES.storefront.shop,
  hideInMenu: true,
};

export const storefrontPasswordRoute: IRoute = {
  path: ROUTES.storefront.password,
  name: 'storefront-password',
  component: StorefrontPasswordScreen,
  authority: ['user'],
  hideInMenu: true,
};

/** Shop/cart are public. Only attach `authority: ['user']` on the leaf that needs login (e.g. checkout). */
export const storefrontPortalRoutes: IRoute[] = [
  {
    path: '/',
    name: 'storefront-portal',
    component: StorefrontLayout,
    hideInMenu: true,
    routes: [
      {
        path: ROUTES.storefront.home,
        name: 'home',
        label: 'Home',
        iconName: 'home',
        component: HomeScreen,
        exact: true,
      },
      {
        path: ROUTES.storefront.shop,
        name: 'shop',
        label: 'Shop',
        iconName: 'building-storefront',
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
        hideInMenu: true,
      },
    ],
  },
];
