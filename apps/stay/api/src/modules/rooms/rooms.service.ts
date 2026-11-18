import {
  BaseError,
  buildPaginationMeta,
  listSearch,
  NotFound,
  searchPattern,
  selectFields,
  setAuditChanges,
} from '@p4/server-core';
import type { ListQuery, PaginationMeta } from '@p4/shared';
import {
  isoDateInTimeZone,
  METER_KINDS,
  type MeterKind,
  type RoomMeter,
  type RoomStatus,
  type RoomStatusCounts,
  type RoomSummary,
  type StayRoom,
  type StayRoomDetail,
  type StayUser,
} from '@stay/shared';
import { literal, Op, type Transaction, type WhereOptions } from 'sequelize';
import { canAccessRecord } from '@/middlewares/ability.middleware.js';
import { accessibleWhere } from '@/middlewares/accessible-where.js';
import {
  BuildingModel,
  MaintenanceRequestModel,
  MeterModel,
  RoomDefaultServiceModel,
  RoomModel,
  ServiceDefinitionModel,
  sequelize,
} from '@/sequelize/models/index.js';
import type { MeterAttributes } from '@/sequelize/models/meter.model.js';
import type { RoomAttributes } from '@/sequelize/models/room.model.js';
import type { ServiceDefinitionAttributes } from '@/sequelize/models/service-definition.model.js';
import { auditedTransaction, recordAudit } from '@/shared/audit.js';
import { assertVersion } from '@/shared/input.js';
import type { ModelOrder } from '@/types/database.js';
import {
  deriveRoomStatus,
  holdingContract,
  type RoomOccupancy,
  roomOccupancies,
  roomStatusWhere,
} from './room-status.js';
import {
  latestMeterReadings,
  roomDebts,
  roomOccupants,
  roomRecentInvoices,
} from './rooms.usage.js';

export type RoomSortField = 'floor' | 'code' | 'listPrice' | 'createdAt';

export interface RoomListQuery extends ListQuery<RoomSortField> {
  floor?: number;
  status?: RoomStatus;
}

/** Editable fields of a room (`POST /buildings/:buildingId/rooms`, `PUT /rooms/:id`). */
export type RoomInput = Pick<
  RoomAttributes,
  'code' | 'floor' | 'areaM2' | 'listPrice' | 'maxOccupants' | 'note'
> & {
  serviceIds: string[];
};

/** Meter of a new room: initial whole reading and optional serial. */
export interface MeterInput {
  initialReading: number;
  serial: string | null;
}

export interface NewRoomInput extends RoomInput {
  meters: Record<MeterKind, MeterInput>;
}

export interface MaintenanceInput {
  maintenance: boolean;
  reason: string | null;
  until: string | null;
  version: number;
}

/** Invoices shown on the room detail (screens.md O-08). */
const RECENT_INVOICE_COUNT = 6;

const roomFields = [
  'id',
  'buildingId',
  'code',
  'floor',
  'areaM2',
  'listPrice',
  'maxOccupants',
  'maintenance',
  'maintenanceReason',
  'maintenanceUntil',
  'note',
  'version',
] satisfies (keyof StayRoom)[];

const meterFields = [
  'id',
  'kind',
  'serial',
  'installedOn',
  'initialReading',
] satisfies (keyof RoomMeter)[];

interface RoomContext {
  serviceIds: Map<string, string[]>;
  occupancies: Map<string, RoomOccupancy>;
  debts: Map<string, number>;
  openJobs: Set<string | null>;
}

function roomDto(row: RoomModel, context: RoomContext): StayRoom {
  const occupancy = context.occupancies.get(row.id);

  return {
    ...selectFields(row, roomFields),
    archivedAt: row.archivedAt?.toISOString() ?? null,
    status: deriveRoomStatus(row, occupancy),
    defaultServiceIds: context.serviceIds.get(row.id) ?? [],
    contract: occupancy?.contract ?? null,
    occupantCount: occupancy?.occupantCount ?? 0,
    debt: context.debts.get(row.id) ?? 0,
    hasOpenMaintenance: context.openJobs.has(row.id),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Default services, holding contracts and debts of `rows`, loaded together. */
async function roomContext(rows: readonly RoomModel[], transaction?: Transaction) {
  const ids = rows.map((row) => row.id);
  const [links, occupancies, debts, jobs] = await Promise.all([
    ids.length
      ? RoomDefaultServiceModel.findAll({ where: { roomId: { [Op.in]: ids } }, transaction })
      : [],
    roomOccupancies(ids, transaction),
    roomDebts(ids),
    ids.length
      ? MaintenanceRequestModel.findAll({
          where: { roomId: { [Op.in]: ids }, status: { [Op.in]: ['new', 'open', 'in_progress'] } },
          attributes: ['roomId'],
          transaction,
        })
      : [],
  ]);
  const serviceIds = new Map<string, string[]>();

  for (const link of links)
    serviceIds.set(link.roomId, [...(serviceIds.get(link.roomId) ?? []), link.serviceId]);
  return {
    serviceIds,
    occupancies,
    debts,
    openJobs: new Set(jobs.map((job) => job.roomId)),
  } satisfies RoomContext;
}

export async function roomDtos(rows: readonly RoomModel[], transaction?: Transaction) {
  const context = await roomContext(rows, transaction);

  return rows.map((row) => roomDto(row, context));
}

async function detailDto(row: RoomModel, transaction?: Transaction): Promise<StayRoomDetail> {
  const room = roomDto(row, await roomContext([row], transaction));
  const serviceOrder: ModelOrder<ServiceDefinitionAttributes> = [
    ['sortOrder', 'ASC'],
    ['name', 'ASC'],
  ];
  const meterOrder: ModelOrder<MeterAttributes> = [['kind', 'ASC']];
  const [building, services, meters, occupants, invoices] = await Promise.all([
    BuildingModel.findByPk(row.buildingId, { transaction }),
    room.defaultServiceIds.length
      ? ServiceDefinitionModel.findAll({
          where: { id: { [Op.in]: room.defaultServiceIds } },
          order: serviceOrder,
          transaction,
        })
      : [],
    MeterModel.findAll({
      where: { roomId: row.id, removedOn: { [Op.is]: null } },
      order: meterOrder,
      transaction,
    }),
    roomOccupants(row.id),
    roomRecentInvoices(row.id, RECENT_INVOICE_COUNT),
  ]);

  if (!building) throw new NotFound('building_not_found');

  const readings = await latestMeterReadings(meters.map((meter) => meter.id));

  return {
    ...room,
    buildingCode: building.code,
    buildingName: building.name,
    defaultServices: services.map((service) =>
      selectFields(service, ['id', 'code', 'name', 'kind', 'unit', 'active']),
    ),
    meters: meters.map((meter) => ({
      ...selectFields(meter, meterFields),
      latestReading: readings.get(meter.id)?.reading ?? null,
      latestPeriod: readings.get(meter.id)?.period ?? null,
    })),
    occupants,
    invoices,
  };
}

/**
 * The building of a room list or creation, when `user` may `action` its rooms. Buildings outside
 * the user's scope answer 404 like missing ones.
 */
export async function findRoomBuilding(
  user: StayUser,
  buildingId: string,
  action: 'read' | 'manage',
  transaction?: Transaction,
): Promise<BuildingModel> {
  const row = canAccessRecord(user, action, 'Room', { buildingId })
    ? await BuildingModel.findByPk(buildingId, {
        transaction,
        ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
      })
    : null;

  if (!row) throw new NotFound('building_not_found');
  return row;
}

/** A room `user` may `action`; rooms of other buildings answer 404. Locked inside `transaction`. */
export async function findAccessibleRoom(
  user: StayUser,
  id: string,
  action: 'read' | 'manage',
  transaction?: Transaction,
): Promise<RoomModel> {
  const row = await RoomModel.findOne({
    where: { [Op.and]: [{ id }, accessibleWhere(user, action, 'Room')] },
    transaction,
    ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
  });

  if (!row || !canAccessRecord(user, action, 'Room', { buildingId: row.buildingId }))
    throw new NotFound('room_not_found');
  return row;
}

export function assertBuildingOpen(building: BuildingModel) {
  if (building.archivedAt) throw new BaseError('building_archived', 409, 'building_archived');
}

function assertRoomOpen(row: RoomModel) {
  if (row.archivedAt) throw new BaseError('room_archived', 409, 'room_archived');
}

/** Active (non-archived) room of the building with `code`, other than `exceptId`. */
export async function roomCodeTaken(buildingId: string, code: string, exceptId?: string) {
  const count = await RoomModel.count({
    where: {
      buildingId,
      code,
      archivedAt: { [Op.is]: null },
      ...(exceptId ? { id: { [Op.ne]: exceptId } } : {}),
    },
  });

  return count > 0;
}

/** Active rooms of a building for the room map: filters on URL, paginated, floor then code. */
export async function listRooms(
  user: StayUser,
  buildingId: string,
  query: RoomListQuery,
): Promise<{ data: StayRoom[]; meta: PaginationMeta }> {
  const building = await findRoomBuilding(user, buildingId, 'read');
  const conditions: WhereOptions<RoomAttributes>[] = [
    accessibleWhere(user, 'read', 'Room'),
    { buildingId: building.id, archivedAt: { [Op.is]: null } },
    query.q
      ? {
          [Op.or]: [
            listSearch(RoomModel, query.q, ['code']),
            literal(
              `EXISTS (SELECT 1 FROM contracts c JOIN contract_occupants co ON co.contract_id=c.id JOIN tenants t ON t.id=co.tenant_id WHERE stay_contract_room_at(c.id, '${isoDateInTimeZone(new Date())}')="RoomModel".id AND c.status IN ('active','ending') AND co.is_primary AND co.from_date <= GREATEST(c.start_date, '${isoDateInTimeZone(new Date())}'::date) AND (co.to_date IS NULL OR co.to_date > GREATEST(c.start_date, '${isoDateInTimeZone(new Date())}'::date)) AND t.full_name ILIKE ${sequelize.escape(searchPattern(query.q))})`,
            ),
          ],
        }
      : {},
  ];

  if (query.floor !== undefined) conditions.push({ floor: query.floor });
  if (query.status) conditions.push(roomStatusWhere(query.status));

  const direction = query.sortOrder === 'desc' ? 'DESC' : 'ASC';
  const order: ModelOrder<RoomAttributes> =
    query.sortBy === 'floor'
      ? [
          ['floor', direction],
          ['code', 'ASC'],
          ['id', 'ASC'],
        ]
      : [
          [query.sortBy ?? 'code', direction],
          ['id', 'ASC'],
        ];
  const { rows, count } = await RoomModel.findAndCountAll({
    where: { [Op.and]: conditions },
    order,
    limit: query.pageSize,
    offset: (query.page - 1) * query.pageSize,
  });

  return {
    data: await roomDtos(rows),
    meta: buildPaginationMeta(query.page, query.pageSize, count),
  };
}

/** Counters per status and floors of a building's active rooms (room map header). */
export async function roomSummary(user: StayUser, buildingId: string): Promise<RoomSummary> {
  const building = await findRoomBuilding(user, buildingId, 'read');
  const rows = await RoomModel.findAll({
    attributes: ['id', 'floor', 'maintenance'],
    where: {
      [Op.and]: [accessibleWhere(user, 'read', 'Room')],
      buildingId: building.id,
      archivedAt: { [Op.is]: null },
    },
  });
  const occupancies = await roomOccupancies(rows.map((row) => row.id));
  const counts: RoomStatusCounts = { vacant: 0, reserved: 0, occupied: 0, maintenance: 0 };

  for (const row of rows) counts[deriveRoomStatus(row, occupancies.get(row.id))] += 1;

  return {
    buildingId: building.id,
    total: rows.length,
    counts,
    floors: [...new Set(rows.map((row) => row.floor))].sort((a, b) => a - b),
  };
}

export async function getRoom(user: StayUser, id: string): Promise<StayRoomDetail> {
  return detailDto(await findAccessibleRoom(user, id, 'read'));
}

/** Room row, default services and one electricity + one water meter installed today. */
export async function insertRoom(
  buildingId: string,
  input: NewRoomInput,
  transaction: Transaction,
): Promise<RoomModel> {
  const { serviceIds, meters, ...fields } = input;
  const installedOn = isoDateInTimeZone(new Date());
  const row = await RoomModel.create({ ...fields, buildingId }, { transaction });

  await RoomDefaultServiceModel.bulkCreate(
    serviceIds.map((serviceId) => ({ roomId: row.id, serviceId })),
    { transaction },
  );
  await MeterModel.bulkCreate(
    METER_KINDS.map((kind) => ({ roomId: row.id, kind, installedOn, ...meters[kind] })),
    { transaction },
  );
  return row;
}

export async function createRoom(
  user: StayUser,
  buildingId: string,
  input: NewRoomInput,
): Promise<StayRoomDetail> {
  return auditedTransaction(async (transaction) => {
    // Locking the building serialises room creation, so the code check holds.
    const building = await findRoomBuilding(user, buildingId, 'manage', transaction);

    assertBuildingOpen(building);
    if (await roomCodeTaken(building.id, input.code))
      throw new BaseError('room_code_taken', 409, 'room_code_taken', { code: input.code });

    const row = await insertRoom(building.id, input, transaction);

    setAuditChanges({
      buildingId: building.id,
      after: { ...selectFields(row, roomFields), serviceIds: input.serviceIds },
      meters: METER_KINDS.map((kind) => ({ kind, ...input.meters[kind] })),
    });
    return detailDto(row, transaction);
  });
}

export async function updateRoom(
  user: StayUser,
  id: string,
  input: RoomInput,
  expectedVersion: number,
): Promise<StayRoomDetail> {
  return auditedTransaction(async (transaction) => {
    const row = await findAccessibleRoom(user, id, 'manage', transaction);

    assertRoomOpen(row);
    assertVersion(row.version, expectedVersion);
    assertBuildingOpen(await findRoomBuilding(user, row.buildingId, 'manage', transaction));
    if (await roomCodeTaken(row.buildingId, input.code, row.id))
      throw new BaseError('room_code_taken', 409, 'room_code_taken', { code: input.code });

    const { serviceIds, ...fields } = input;
    const links = await RoomDefaultServiceModel.findAll({ where: { roomId: row.id }, transaction });
    const beforeServices = links.map((link) => link.serviceId).sort();
    const afterServices = [...new Set(serviceIds)].sort();
    const servicesChanged = beforeServices.join() !== afterServices.join();
    const before = { ...selectFields(row, roomFields), serviceIds: beforeServices };

    row.set(fields);
    // A change of default services alone still bumps the version.
    if (servicesChanged && !row.changed()) row.changed('updatedAt', true);
    await row.save({ transaction });

    if (servicesChanged) {
      await RoomDefaultServiceModel.destroy({ where: { roomId: row.id }, transaction });
      await RoomDefaultServiceModel.bulkCreate(
        afterServices.map((serviceId) => ({ roomId: row.id, serviceId })),
        { transaction },
      );
    }

    setAuditChanges({
      buildingId: row.buildingId,
      before,
      after: { ...selectFields(row, roomFields), serviceIds: afterServices },
    });
    return detailDto(row, transaction);
  });
}

/**
 * Switches maintenance on (reason, expected end) or off. Refused with 409 `room_has_contract`
 * while a contract holds the room (same derivation as the room map).
 */
export async function setRoomMaintenance(
  user: StayUser,
  id: string,
  input: MaintenanceInput,
): Promise<StayRoomDetail> {
  return auditedTransaction(async (transaction) => {
    const row = await findAccessibleRoom(user, id, 'manage', transaction);

    assertRoomOpen(row);
    assertVersion(row.version, input.version);

    const contract = await holdingContract(row.id, transaction);

    if (contract)
      throw new BaseError('room_has_contract', 409, 'room_has_contract', {
        contractId: contract.id,
        contractCode: contract.code,
      });

    const fields = ['maintenance', 'maintenanceReason', 'maintenanceUntil'] as const;
    const before = selectFields(row, fields);

    await row.update(
      input.maintenance
        ? { maintenance: true, maintenanceReason: input.reason, maintenanceUntil: input.until }
        : { maintenance: false, maintenanceReason: null, maintenanceUntil: null },
      { transaction },
    );
    await recordAudit(
      {
        action: input.maintenance ? 'room.maintenance_on' : 'room.maintenance_off',
        resourceType: 'room',
        resourceId: row.id,
        changes: { buildingId: row.buildingId, before, after: selectFields(row, fields) },
        reason: input.reason ?? undefined,
      },
      transaction,
    );
    return detailDto(row, transaction);
  });
}

/** Archives a room; refused (409 `room_has_contract`) while a contract holds it. */
export async function archiveRoom(user: StayUser, id: string): Promise<StayRoomDetail> {
  return auditedTransaction(async (transaction) => {
    const row = await findAccessibleRoom(user, id, 'manage', transaction);

    assertRoomOpen(row);

    const contract = await holdingContract(row.id, transaction);

    if (contract)
      throw new BaseError('room_has_contract', 409, 'room_has_contract', {
        contractId: contract.id,
        contractCode: contract.code,
      });

    await row.update({ archivedAt: new Date() }, { transaction });
    setAuditChanges({
      buildingId: row.buildingId,
      code: row.code,
      archivedAt: row.archivedAt?.toISOString() ?? null,
    });
    return detailDto(row, transaction);
  });
}
