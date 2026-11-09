import type { IconName } from '@itclabs/react-ui';
import { type ComponentType, type LazyExoticComponent, lazy } from 'react';
import type { AbilityCheck } from '@/libraries/ability';

export type StayRoute = {
  path: string;
  /** Stable id, also the `nav.<name>` translation key of its label. */
  name: string;
  icon: IconName;
  component: LazyExoticComponent<ComponentType>;
  /** Unconditional CASL access needed to open the route; menus hide it otherwise. */
  ability: AbilityCheck;
  /** Shown in the mobile bottom bar (in this order); the rest go under "Thêm". */
  bottomNav?: boolean;
  /** Match only this exact path for the active menu state. */
  exact?: boolean;
  /** Reachable by URL but not listed in the menus. */
  hideInMenu?: boolean;
};

const OverviewPage = lazy(() => import('@/modules/overview/page'));
const PlaceholderPage = lazy(() => import('@/modules/placeholder/page'));

export const ROUTES = {
  login: '/login',
  overview: '/',
} as const;

/** Signed-in app routes (screens.md C-02 menu order). Menus are derived from this list. */
export const appRoutes: StayRoute[] = [
  {
    path: ROUTES.overview,
    name: 'overview',
    icon: 'home',
    component: OverviewPage,
    ability: { action: 'read', subject: 'Report' },
    bottomNav: true,
    exact: true,
  },
  {
    path: '/rooms',
    name: 'rooms',
    icon: 'building',
    component: PlaceholderPage,
    ability: { action: 'read', subject: 'Room' },
    bottomNav: true,
  },
  {
    path: '/readings',
    name: 'readings',
    icon: 'bolt',
    component: PlaceholderPage,
    // screens.md says `manage`; managers hold create/read/update/delete, not `manage`.
    ability: { action: 'update', subject: 'MeterReading' },
    bottomNav: true,
  },
  {
    path: '/invoices',
    name: 'invoices',
    icon: 'receipt',
    component: PlaceholderPage,
    ability: { action: 'read', subject: 'Invoice' },
    bottomNav: true,
  },
  {
    path: '/receivables',
    name: 'receivables',
    icon: 'moneyTime',
    component: PlaceholderPage,
    ability: { action: 'read', subject: 'Invoice' },
  },
  {
    path: '/contracts',
    name: 'contracts',
    icon: 'clipboardText',
    component: PlaceholderPage,
    ability: { action: 'read', subject: 'Contract' },
  },
  {
    path: '/tenants',
    name: 'tenants',
    icon: 'users',
    component: PlaceholderPage,
    ability: { action: 'read', subject: 'Tenant' },
  },
  {
    path: '/requests',
    name: 'requests',
    icon: 'messages',
    component: PlaceholderPage,
    ability: { action: 'update', subject: 'Maintenance' },
  },
  {
    path: '/expenses',
    name: 'expenses',
    icon: 'creditCard',
    component: PlaceholderPage,
    ability: { action: 'manage', subject: 'Expense' },
  },
  {
    path: '/reports',
    name: 'reports',
    icon: 'chart',
    component: PlaceholderPage,
    ability: { action: 'read', subject: 'Report' },
  },
  {
    path: '/settings',
    name: 'settings',
    icon: 'settings',
    component: PlaceholderPage,
    ability: { action: 'manage', subject: 'Settings' },
  },
  {
    path: '/settings/members',
    name: 'members',
    icon: 'users',
    component: PlaceholderPage,
    ability: { action: 'manage', subject: 'Member' },
    hideInMenu: true,
  },
];
