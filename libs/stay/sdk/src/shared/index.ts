export { type AuditListQuery, createAuditApi } from './audit.js';
export {
  type BuildingCreateInput,
  type BuildingListQuery,
  type BuildingPriceInput,
  type BuildingUpdateInput,
  createBuildingApi,
} from './buildings.js';
export { createStaySdk, type StaySdk, type StaySdkOptions } from './client.js';
export * from './contracts.js';
export * from './deposits.js';
export { ApiSdkError, getErrorMessage, getFieldError, unwrap } from './errors.js';
export * from './expenses.js';
export type { components, operations, paths } from './generated.js';
export * from './invoices.js';
export * from './payments.js';
export * from './readings.js';
export * from './receivables.js';
export {
  createRoomApi,
  type RoomBulkInput,
  type RoomBulkPreviewInput,
  type RoomCreateInput,
  type RoomListQuery,
  type RoomMaintenanceInput,
  type RoomUpdateInput,
} from './rooms.js';
export {
  createSettingsApi,
  type StayServiceCreateInput,
  type StayServiceUpdateInput,
  type StaySettingsInput,
} from './settings.js';
export {
  createTenantApi,
  type DuplicateTenantRef,
  getDuplicateTenant,
  type TenantCreateInput,
  type TenantDocumentInput,
  type TenantImportCommitInput,
  type TenantListQuery,
  type TenantUpdateInput,
  type VehicleInput,
} from './tenants.js';
export { createUploadApi, type StayUploadPurpose } from './uploads.js';
