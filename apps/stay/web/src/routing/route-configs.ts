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

const DepositsPage = lazy(() => import('@/modules/deposits/page'));
const ReadingsPage = lazy(() => import('@/modules/readings/page'));
const InvoiceListPage = lazy(() => import('@/modules/invoices/list-page'));
const BillingRunPage = lazy(() => import('@/modules/invoices/run-page'));
const InvoiceDetailPage = lazy(() => import('@/modules/invoices/detail-page'));
const PeriodSharePage = lazy(() => import('@/modules/invoices/share/period-share-page'));
const PaymentsPage = lazy(() => import('@/modules/payments/page'));
const ReceivablesPage = lazy(() => import('@/modules/receivables/page'));
const ExpensesPage = lazy(() => import('@/modules/expenses/page'));
const ExpenseCategoriesPage = lazy(() => import('@/modules/expenses/categories-page'));
const ContractListPage = lazy(() => import('@/modules/contracts/list-page'));
const ContractWizardPage = lazy(() => import('@/modules/contracts/wizard-page'));
const ContractDetailPage = lazy(() => import('@/modules/contracts/detail-page'));
const AuditPage = lazy(() => import('@/modules/audit/page'));
const OverviewPage = lazy(() => import('@/modules/overview/page'));
const PlaceholderPage = lazy(() => import('@/modules/placeholder/page'));
const RoomMapPage = lazy(() => import('@/modules/rooms/page'));
const RoomDetailPage = lazy(() => import('@/modules/rooms/detail-page'));
const RoomFormPage = lazy(() => import('@/modules/rooms/form-page'));
const RoomBulkPage = lazy(() => import('@/modules/rooms/bulk-page'));
const TenantListPage = lazy(() => import('@/modules/tenants/list-page'));
const TenantProfilePage = lazy(() => import('@/modules/tenants/profile-page'));
const TenantFormPage = lazy(() => import('@/modules/tenants/form-page'));
const TenantImportPage = lazy(() => import('@/modules/tenants/import-page'));
const SettingsPage = lazy(() => import('@/modules/settings/page'));
const ServicesPage = lazy(() => import('@/modules/settings/services/page'));
const BillingSettingsPage = lazy(() => import('@/modules/settings/billing/page'));
const BuildingsPage = lazy(() => import('@/modules/buildings/page'));
const BuildingFormPage = lazy(() => import('@/modules/buildings/form/page'));
const BuildingPricesPage = lazy(() => import('@/modules/buildings/prices/page'));

export const ROUTES = {
  login: '/login',
  /** Public shared invoice (ST-16), outside the signed-in shell. */
  publicInvoice: '/i/:token',
  overview: '/',
  rooms: '/rooms',
  roomNew: '/rooms/new',
  roomBulk: '/rooms/bulk',
  settings: '/settings',
  services: '/settings/services',
  billing: '/settings/billing',
  buildings: '/buildings',
  newBuilding: '/buildings/new',
} as const;

/** `/rooms/:id` and `/rooms/:id/edit`. */
export const roomPath = (id: string) => `${ROUTES.rooms}/${id}`;
export const roomEditPath = (id: string) => `${roomPath(id)}/edit`;
export const buildingEditPath = (id: string) => `/buildings/${id}/edit`;
export const buildingPricesPath = (id: string) => `/buildings/${id}/prices`;

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
    component: ReadingsPage,
    // screens.md says `manage`; managers hold create/read/update/delete, not `manage`.
    ability: { action: 'update', subject: 'MeterReading' },
    bottomNav: true,
  },
  {
    path: '/invoices',
    name: 'invoices',
    icon: 'receipt',
    component: InvoiceListPage,
    ability: { action: 'read', subject: 'Invoice' },
    bottomNav: true,
  },
  // Static invoice paths come before `/invoices/:id` (`useCurrentRoute` takes the first match).
  {
    path: '/invoices/run',
    name: 'invoiceRun',
    icon: 'receipt',
    component: BillingRunPage,
    ability: { action: 'create', subject: 'Invoice' },
    hideInMenu: true,
    parent: 'invoices',
  },
  {
    path: '/invoices/share',
    name: 'invoiceShare',
    icon: 'receipt',
    component: PeriodSharePage,
    // Sharing writes links: managers hold `update Invoice` in assigned buildings.
    ability: { action: 'update', subject: 'Invoice' },
    hideInMenu: true,
    parent: 'invoices',
  },
  {
    path: '/invoices/:id',
    name: 'invoiceDetail',
    icon: 'receipt',
    component: InvoiceDetailPage,
    ability: { action: 'read', subject: 'Invoice' },
    hideInMenu: true,
    parent: 'invoices',
  },
  {
    path: '/receivables',
    name: 'receivables',
    icon: 'moneyTime',
    component: ReceivablesPage,
    ability: { action: 'read', subject: 'Invoice' },
  },
  {
    path: '/payments',
    name: 'payments',
    icon: 'walletMoney',
    component: PaymentsPage,
    ability: { action: 'read', subject: 'Payment' },
  },
  {
    path: '/contracts',
    name: 'contracts',
    icon: 'clipboardText',
    component: ContractListPage,
    ability: { action: 'read', subject: 'Contract' },
  },
  {
    path: '/contracts/new',
    name: 'contractNew',
    icon: 'clipboardText',
    component: ContractWizardPage,
    ability: { action: 'create', subject: 'Contract' },
    hideInMenu: true,
    parent: 'contracts',
  },
  {
    path: '/contracts/:id',
    name: 'contractDetail',
    icon: 'clipboardText',
    component: ContractDetailPage,
    ability: { action: 'read', subject: 'Contract' },
    hideInMenu: true,
    parent: 'contracts',
  },
  {
    path: '/deposits',
    name: 'deposits',
    icon: 'creditCard',
    component: DepositsPage,
    ability: { action: 'read', subject: 'Deposit' },
  },
  {
    path: '/tenants',
    name: 'tenants',
    icon: 'users',
    component: TenantListPage,
    ability: { action: 'read', subject: 'Tenant' },
  },
  // Static tenant paths come before `/tenants/:id` (`useCurrentRoute` takes the first match).
  {
    path: '/tenants/new',
    name: 'tenantNew',
    icon: 'users',
    component: TenantFormPage,
    ability: { action: 'create', subject: 'Tenant' },
    hideInMenu: true,
  },
  {
    path: '/tenants/import',
    name: 'tenantImport',
    icon: 'users',
    component: TenantImportPage,
    ability: { action: 'manage', subject: 'Tenant' },
    hideInMenu: true,
  },
  {
    path: '/tenants/:id',
    name: 'tenantProfile',
    icon: 'users',
    component: TenantProfilePage,
    ability: { action: 'read', subject: 'Tenant' },
    hideInMenu: true,
  },
  {
    path: '/tenants/:id/edit',
    name: 'tenantEdit',
    icon: 'users',
    component: TenantFormPage,
    ability: { action: 'update', subject: 'Tenant' },
    hideInMenu: true,
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
    component: ExpensesPage,
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
    path: '/audit',
    name: 'audit',
    icon: 'clipboardText',
    component: AuditPage,
    ability: { action: 'read', subject: 'AuditLog' },
  },
  {
    path: ROUTES.settings,
    name: 'settings',
    icon: 'settings',
    component: SettingsPage,
    ability: { action: 'manage', subject: 'Settings' },
  },
  {
    path: ROUTES.services,
    name: 'services',
    icon: 'receipt',
    component: ServicesPage,
    ability: { action: 'manage', subject: 'Settings' },
    hideInMenu: true,
    parent: 'settings',
  },
  {
    path: ROUTES.billing,
    name: 'billing',
    icon: 'calendar',
    component: BillingSettingsPage,
    ability: { action: 'manage', subject: 'Settings' },
    hideInMenu: true,
    parent: 'settings',
  },
  {
    path: ROUTES.buildings,
    name: 'buildings',
    icon: 'buildings',
    component: BuildingsPage,
    ability: { action: 'read', subject: 'Building' },
    hideInMenu: true,
    parent: 'settings',
  },
  {
    path: ROUTES.newBuilding,
    name: 'newBuilding',
    icon: 'buildings',
    component: BuildingFormPage,
    ability: { action: 'manage', subject: 'Building' },
    hideInMenu: true,
    parent: 'buildings',
  },
  {
    path: '/buildings/:id/edit',
    name: 'editBuilding',
    icon: 'buildings',
    component: BuildingFormPage,
    ability: { action: 'manage', subject: 'Building' },
    hideInMenu: true,
    parent: 'buildings',
  },
  {
    path: '/buildings/:id/prices',
    name: 'buildingPrices',
    icon: 'receipt',
    component: BuildingPricesPage,
    ability: { action: 'manage', subject: 'Building' },
    hideInMenu: true,
    parent: 'buildings',
  },
  {
    path: '/settings/expense-categories',
    name: 'expenseCategories',
    icon: 'creditCard',
    component: ExpenseCategoriesPage,
    ability: { action: 'manage', subject: 'Expense' },
    hideInMenu: true,
    parent: 'settings',
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
