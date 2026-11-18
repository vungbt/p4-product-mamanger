import {
  applyAuditPolicies,
  currentUser,
  queryNumber,
  queryText,
  uuidRouteId,
  validateListQuery,
} from '@p4/server-core';
import { ROOM_FLOOR_MAX, ROOM_FLOOR_MIN, ROOM_STATUS_FILTERS } from '@stay/shared';
import { Router } from 'express';
import { requireAbility, requireScopedAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { formBody } from '@/shared/input.js';
import { auditPolicies } from './rooms.audit.js';
import {
  readBulkInput,
  readBulkPreviewInput,
  readMaintenanceInput,
  readNewRoomInput,
  readRoomInput,
} from './rooms.input.js';
import {
  archiveRoom,
  createRoom,
  findAccessibleRoom,
  findRoomBuilding,
  getRoom,
  listRooms,
  type RoomListQuery,
  type RoomSortField,
  roomSummary,
  setRoomMaintenance,
  updateRoom,
} from './rooms.service.js';
import { bulkCreateRooms, previewBulkRooms } from './rooms-bulk.service.js';

const router = Router();
const sortFields: RoomSortField[] = ['floor', 'code', 'listPrice', 'createdAt'];

const validateRoomListQuery = validateListQuery({
  sortFields,
  defaultSort: 'floor',
  rules: () => ({
    floor: `sometimes|required|integer|min:${ROOM_FLOOR_MIN}|max:${ROOM_FLOOR_MAX}`,
    status: `sometimes|required|in:${ROOM_STATUS_FILTERS.join(',')}`,
  }),
  normalize: (query, base): RoomListQuery => ({
    ...base,
    floor: queryNumber(query, 'floor'),
    status: ROOM_STATUS_FILTERS.find((value) => value === queryText(query, 'status')),
  }),
});

router.get(
  '/buildings/:buildingId/rooms',
  authRequired,
  requireScopedAbility('read', 'Room'),
  validateRoomListQuery,
  listHandler((req, query: RoomListQuery) =>
    listRooms(currentUser(req), uuidRouteId(req, 'buildingId'), query),
  ),
);
router.get(
  '/buildings/:buildingId/rooms/summary',
  authRequired,
  requireScopedAbility('read', 'Room'),
  apiHandler((req) => roomSummary(currentUser(req), uuidRouteId(req, 'buildingId'))),
);
router.post(
  '/buildings/:buildingId/rooms',
  authRequired,
  requireAbility('manage', 'Room'),
  apiHandler(async (req) => {
    const user = currentUser(req);
    const building = await findRoomBuilding(user, uuidRouteId(req, 'buildingId'), 'manage');

    return createRoom(user, building.id, await readNewRoomInput(formBody(req), building.id));
  }, 201),
);
router.post(
  '/buildings/:buildingId/rooms/bulk/preview',
  authRequired,
  requireAbility('manage', 'Room'),
  apiHandler(async (req) =>
    previewBulkRooms(
      currentUser(req),
      uuidRouteId(req, 'buildingId'),
      readBulkPreviewInput(formBody(req)),
    ),
  ),
);
router.post(
  '/buildings/:buildingId/rooms/bulk',
  authRequired,
  requireAbility('manage', 'Room'),
  apiHandler(async (req) => {
    const user = currentUser(req);
    const building = await findRoomBuilding(user, uuidRouteId(req, 'buildingId'), 'manage');

    return bulkCreateRooms(
      user,
      building.id,
      req.header('Idempotency-Key') ?? '',
      await readBulkInput(formBody(req)),
    );
  }, 201),
);
router.get(
  '/rooms/:id',
  authRequired,
  requireScopedAbility('read', 'Room'),
  apiHandler((req) => getRoom(currentUser(req), uuidRouteId(req))),
);
router.put(
  '/rooms/:id',
  authRequired,
  requireAbility('manage', 'Room'),
  apiHandler(async (req) => {
    const user = currentUser(req);
    const room = await findAccessibleRoom(user, uuidRouteId(req), 'manage');
    const { version, ...input } = await readRoomInput(formBody(req), room);

    return updateRoom(user, room.id, input, version);
  }),
);
router.post(
  '/rooms/:id/maintenance',
  authRequired,
  requireAbility('manage', 'Room'),
  apiHandler((req) =>
    setRoomMaintenance(currentUser(req), uuidRouteId(req), readMaintenanceInput(formBody(req))),
  ),
);
router.post(
  '/rooms/:id/archive',
  authRequired,
  requireAbility('manage', 'Room'),
  apiHandler((req) => archiveRoom(currentUser(req), uuidRouteId(req))),
);

export default applyAuditPolicies(router, auditPolicies);
