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
  /** `name` of the route shown before this one in the breadcrumb (sub-pages). */
  parent?: string;
};

const OverviewPage = lazy(() => import('@/modules/overview/page'));
const PlaceholderPage = lazy(() => import('@/modules/placeholder/page'));
const RoomMapPage = lazy(() => import('@/modules/rooms/page'));
const RoomDetailPage = lazy(() => import('@/modules/rooms/detail-page'));
const RoomFormPage = lazy(() => import('@/modules/rooms/form-page'));
const RoomBulkPage = lazy(() => import('@/modules/rooms/bulk-page'));

export const ROUTES = {
  login: '/login',
  overview: '/',
  rooms: '/rooms',
  roomNew: '/rooms/new',
  roomBulk: '/rooms/bulk',
} as const;

/** `/rooms/:id` and `/rooms/:id/edit`. */
export const roomPath = (id: string) => `${ROUTES.rooms}/${id}`;
export const roomEditPath = (id: string) => `${roomPath(id)}/edit`;

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
    path: ROUTES.rooms,
    name: 'rooms',
    icon: 'building',
    component: RoomMapPage,
    ability: { action: 'read', subject: 'Room' },
    bottomNav: true,
  },
  // Static room paths come before `/rooms/:id` (`useCurrentRoute` takes the first match).
  {
    path: ROUTES.roomNew,
    name: 'roomNew',
    icon: 'building',
    component: RoomFormPage,
    ability: { action: 'manage', subject: 'Room' },
    hideInMenu: true,
    parent: 'rooms',
  },
  {
    path: ROUTES.roomBulk,
    name: 'roomBulk',
    icon: 'building',
    component: RoomBulkPage,
    ability: { action: 'manage', subject: 'Room' },
    hideInMenu: true,
    parent: 'rooms',
  },
  {
    path: '/rooms/:id',
    name: 'roomDetail',
    icon: 'building',
    component: RoomDetailPage,
    ability: { action: 'read', subject: 'Room' },
    hideInMenu: true,
    parent: 'rooms',
  },
  {
    path: '/rooms/:id/edit',
    name: 'roomEdit',
    icon: 'building',
    component: RoomFormPage,
    ability: { action: 'manage', subject: 'Room' },
    hideInMenu: true,
    parent: 'rooms',
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
