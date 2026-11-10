export {
  type BuildingCreateInput,
  type BuildingListQuery,
  type BuildingPriceInput,
  type BuildingUpdateInput,
  createBuildingApi,
} from './buildings.js';
export { createStaySdk, type StaySdk, type StaySdkOptions } from './client.js';
export { ApiSdkError, getErrorMessage, getFieldError, unwrap } from './errors.js';
export type { components, operations, paths } from './generated.js';
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
