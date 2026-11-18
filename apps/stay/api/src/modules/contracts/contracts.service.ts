import {
  BaseError,
  buildPaginationMeta,
  InputValidError,
  listSearch,
  NotFound,
  searchPattern,
  selectFields,
  setAuditChanges,
} from '@p4/server-core';
import type { ListQuery, PaginationMeta } from '@p4/shared';
import {
  type ContractInput,
  type ContractStatus,
  isoDateInTimeZone,
  type MoveInPreview,
  type StayContract,
  type StayUser,
} from '@stay/shared';
import { literal, Op, type Transaction, type WhereOptions } from 'sequelize';
import { accessibleBuildingIds, canAccessRecord } from '@/middlewares/ability.middleware.js';
import { accessibleWhere } from '@/middlewares/accessible-where.js';
import type { ContractAttributes } from '@/sequelize/models/contract.model.js';
import {
  BuildingModel,
  ContractEventModel,
  ContractModel,
  ContractOccupantModel,
  ContractServiceModel,
  ContractVehicleModel,
  DepositEntryModel,
  FileModel,
  InvoiceModel,
  MeterModel,
  RoomModel,
  ServiceDefinitionModel,
  sequelize,
  TenantModel,
  UserModel,
  VehicleModel,
} from '@/sequelize/models/index.js';
import { auditedTransaction, recordAudit } from '@/shared/audit.js';
import { assertVersion } from '@/shared/input.js';
import { runIdempotent } from '@/shared/persistence.js';
import type { ModelOrder } from '@/types/database.js';
import { billingContext, computeMoveInDraft } from '../invoices/invoices.billing.js';
import { createMoveInForActivation } from '../invoices/invoices.service.js';
import { latestMeterReadings } from '../rooms/rooms.usage.js';
import { attachableFile, signedFileUrl } from '../uploads/uploads.service.js';

import { contractFactsAt } from './contracts.resolvers.js';

export type ContractSortField = 'code' | 'startDate' | 'endDate' | 'createdAt';
export interface ContractListQuery extends ListQuery<ContractSortField> {
  buildingId?: string;
  roomId?: string;
  status?: ContractStatus;
  expiring?: boolean;
}

export async function findContract(
  user: StayUser,
  id: string,
  action: 'read' | 'update',
  transaction?: Transaction,
) {
  const row = await ContractModel.findOne({
    where: {
      [Op.and]: [
        { id },
        accessibleWhere(user, action, 'Contract', { buildingId: 'buildingId', contractId: 'id' }),
      ],
    },
    transaction,
    ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
  });

  if (
    !row ||
    !canAccessRecord(user, action, 'Contract', { buildingId: row.buildingId, contractId: row.id })
  )
    throw new NotFound('contract_not_found');
  return row;
}

export async function contractDto(
  row: ContractModel,
  transaction?: Transaction,
): Promise<StayContract> {
  const today = isoDateInTimeZone(new Date());
  const current = await contractFactsAt(row.id, today, transaction);
  const [room, occupants, links, cars, events, deposits, settlement] = await Promise.all([
    RoomModel.findByPk(current.roomId, { transaction }),
    ContractOccupantModel.findAll({ where: { contractId: row.id }, transaction }),
    ContractServiceModel.findAll({ where: { contractId: row.id }, transaction }),
    ContractVehicleModel.findAll({ where: { contractId: row.id }, transaction }),
    ContractEventModel.findAll({
      where: { contractId: row.id },
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ],
      transaction,
    }),
    DepositEntryModel.findAll({ where: { contractId: row.id }, transaction }),
    InvoiceModel.findOne({
      where: { contractId: row.id, kind: 'settlement', status: { [Op.ne]: 'void' } },
      attributes: ['id'],
      transaction,
    }),
  ]);
  const actors = await UserModel.findAll({
    where: { id: { [Op.in]: events.map((e) => e.actorId) } },
    transaction,
  });
  const membershipDate = today < row.startDate ? row.startDate : today;
  const isCurrent = (o: { fromDate: string; toDate: string | null }) =>
    o.fromDate <= membershipDate && (!o.toDate || o.toDate > membershipDate);
  const [tenants, services, vehicles] = await Promise.all([
    TenantModel.findAll({
      where: { id: { [Op.in]: occupants.map((o) => o.tenantId) } },
      transaction,
    }),
    ServiceDefinitionModel.findAll({
      where: { id: { [Op.in]: links.map((o) => o.serviceId) } },
      transaction,
    }),
    VehicleModel.findAll({ where: { id: { [Op.in]: cars.map((o) => o.vehicleId) } }, transaction }),
  ]);
  const photoUrl = async (id: string | null) => {
    const file = id ? await FileModel.findByPk(id, { transaction }) : null;

    return file ? (signedFileUrl(file)?.url ?? null) : null;
  };
  const initialElectricPhotoUrl = await photoUrl(row.initialElectricPhotoFileId);
  const initialWaterPhotoUrl = await photoUrl(row.initialWaterPhotoFileId);
  const primary = occupants.find((o) => o.isPrimary && isCurrent(o));

  return {
    ...selectFields(row, [
      'id',
      'buildingId',
      'roomId',
      'code',
      'status',
      'startDate',
      'endDate',
      'rent',
      'depositAmount',
      'depositCollected',
      'depositMethod',
      'depositDate',
      'initialElectricPhotoFileId',
      'initialWaterPhotoFileId',
      'depositNote',
      'initialElectric',
      'initialWater',
      'note',
      'noticeDate',
      'movedOutAt',
      'version',
    ]),
    settlementInvoiceId: settlement?.id ?? null,
    roomId: current.roomId,
    rent: current.rent,
    initialElectric: current.initialElectric,
    initialWater: current.initialWater,
    roomCode: room?.code ?? '',
    initialElectricPhotoUrl,
    initialWaterPhotoUrl,
    occupantIds: occupants.filter((o) => isCurrent(o)).map((o) => o.tenantId),
    primaryTenantId: primary?.tenantId ?? null,
    primaryTenantName: tenants.find((t) => t.id === primary?.tenantId)?.fullName ?? null,
    serviceIds: links.filter((o) => isCurrent(o)).map((o) => o.serviceId),
    vehicleIds: cars.filter((o) => isCurrent(o)).map((o) => o.vehicleId),
    depositHeld: deposits.reduce(
      (sum, entry) => sum + (entry.type === 'received' ? entry.amount : -entry.amount),
      0,
    ),
    occupants: occupants.map((o) => ({
      ...selectFields(o, ['tenantId', 'isPrimary', 'fromDate', 'toDate']),
      fullName: tenants.find((t) => t.id === o.tenantId)?.fullName ?? '',
    })),
    services: links.map((o) => {
      const s = services.find((s) => s.id === o.serviceId);
      return {
        ...selectFields(o, ['serviceId', 'fromDate', 'toDate']),
        name: s?.name ?? '',
        kind: s?.kind ?? 'per_room',
      };
    }),
    vehicles: cars.map((o) => ({
      ...selectFields(o, ['vehicleId', 'fromDate', 'toDate']),
      plate: vehicles.find((v) => v.id === o.vehicleId)?.plate ?? '',
    })),
    events: events.map((e) => ({
      ...selectFields(e, ['id', 'type', 'actorId', 'payload']),
      actorName: actors.find((a) => a.id === e.actorId)?.displayName ?? e.actorId,
      createdAt: e.createdAt.toISOString(),
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getContract(user: StayUser, id: string): Promise<StayContract> {
  return contractDto(await findContract(user, id, 'read'));
}

export async function listContracts(
  user: StayUser,
  query: ContractListQuery,
): Promise<{ data: StayContract[]; meta: PaginationMeta }> {
  const scope = accessibleBuildingIds(user, 'read');
  const conditions: WhereOptions<ContractAttributes>[] = [
    query.q
      ? {
          [Op.or]: [
            listSearch(ContractModel, query.q, ['code']),
            literal(
              `EXISTS (SELECT 1 FROM rooms r WHERE r.id="ContractModel".room_id AND r.code ILIKE ${sequelize.escape(searchPattern(query.q))})`,
            ),
            literal(
              `EXISTS (SELECT 1 FROM contract_occupants co JOIN tenants t ON t.id=co.tenant_id WHERE co.contract_id="ContractModel".id AND co.is_primary AND co.from_date <= GREATEST("ContractModel".start_date, '${isoDateInTimeZone(new Date())}'::date) AND (co.to_date IS NULL OR co.to_date > GREATEST("ContractModel".start_date, '${isoDateInTimeZone(new Date())}'::date)) AND t.full_name ILIKE ${sequelize.escape(searchPattern(query.q))})`,
            ),
          ],
        }
      : {},
  ];

  if (scope !== 'all') conditions.push({ buildingId: { [Op.in]: scope } });
  if (query.buildingId) {
    if (!canAccessRecord(user, 'read', 'Contract', { buildingId: query.buildingId }))
      throw new NotFound('building_not_found');
    conditions.push({ buildingId: query.buildingId });
  }
  if (query.roomId)
    conditions.push(
      literal(
        `stay_contract_room_at("ContractModel".id, ${sequelize.escape(isoDateInTimeZone(new Date()))}) = ${sequelize.escape(query.roomId)}::uuid`,
      ),
    );
  if (query.status) conditions.push({ status: query.status });
  if (query.expiring) {
    const today = isoDateInTimeZone(new Date());
    const end = new Date(`${today}T00:00:00Z`);

    end.setUTCDate(end.getUTCDate() + 30);
    conditions.push({
      status: { [Op.in]: ['active', 'ending'] },
      endDate: { [Op.between]: [today, end.toISOString().slice(0, 10)] },
    });
  }
  const order: ModelOrder<ContractAttributes> = [
    [query.sortBy ?? 'createdAt', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
    ['id', 'ASC'],
  ];
  const { rows, count } = await ContractModel.findAndCountAll({
    where: { [Op.and]: conditions },
    order,
    limit: query.pageSize,
    offset: (query.page - 1) * query.pageSize,
  });

  return {
    data: await Promise.all(rows.map((row) => contractDto(row))),
    meta: buildPaginationMeta(query.page, query.pageSize, count),
  };
}

async function targetRoom(
  user: StayUser,
  roomId: string,
  transaction: Transaction,
  action: 'create' | 'update' = 'update',
) {
  const room = await RoomModel.findByPk(roomId, { transaction, lock: transaction.LOCK.UPDATE });

  if (!room || !canAccessRecord(user, action, 'Contract', { buildingId: room.buildingId }))
    throw new NotFound('room_not_found');
  const building = await BuildingModel.findByPk(room.buildingId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!building || building.archivedAt || room.archivedAt)
    throw new BaseError('room_unavailable', 409, 'room_unavailable');
  return { room, building };
}

async function replaceLinks(row: ContractModel, input: ContractInput, transaction: Transaction) {
  const [tenants, services, vehicles] = await Promise.all([
    TenantModel.findAll({
      where: {
        id: { [Op.in]: input.occupantIds },
        buildingId: row.buildingId,
        archivedAt: { [Op.is]: null },
      },
      transaction,
    }),
    ServiceDefinitionModel.findAll({
      where: { id: { [Op.in]: input.serviceIds }, active: true },
      transaction,
    }),
    VehicleModel.findAll({
      where: { id: { [Op.in]: input.vehicleIds }, tenantId: { [Op.in]: input.occupantIds } },
      transaction,
    }),
  ]);
  const errors: Record<string, string[]> = {};

  if (tenants.length !== input.occupantIds.length)
    errors.occupantIds = ['Người thuê không hợp lệ hoặc ngoài toà.'];
  if (services.length !== input.serviceIds.length) errors.serviceIds = ['Dịch vụ không hợp lệ.'];
  if (vehicles.length !== input.vehicleIds.length)
    errors.vehicleIds = ['Xe phải thuộc người ở trong hợp đồng.'];
  if (Object.keys(errors).length) throw new InputValidError('input_valid_error', errors);
  await ContractOccupantModel.destroy({ where: { contractId: row.id }, transaction });
  await ContractServiceModel.destroy({ where: { contractId: row.id }, transaction });
  await ContractVehicleModel.destroy({ where: { contractId: row.id }, transaction });
  const common = { contractId: row.id, fromDate: input.startDate, toDate: null };

  await ContractOccupantModel.bulkCreate(
    input.occupantIds.map((tenantId) => ({
      ...common,
      tenantId,
      isPrimary: tenantId === input.primaryTenantId,
    })),
    { transaction },
  );
  await ContractServiceModel.bulkCreate(
    input.serviceIds.map((serviceId) => ({ ...common, serviceId })),
    { transaction },
  );
  await ContractVehicleModel.bulkCreate(
    input.vehicleIds.map((vehicleId) => ({ ...common, vehicleId })),
    { transaction },
  );
}

function fields(input: ContractInput) {
  return selectFields(input, [
    'roomId',
    'startDate',
    'endDate',
    'rent',
    'depositAmount',
    'depositCollected',
    'depositMethod',
    'depositDate',
    'initialElectricPhotoFileId',
    'initialWaterPhotoFileId',
    'depositNote',
    'initialElectric',
    'initialWater',
    'note',
  ]);
}

async function validatePhotos(
  user: StayUser,
  input: ContractInput,
  buildingId: string,
  transaction: Transaction,
  existing?: ContractModel,
) {
  for (const field of ['initialElectricPhotoFileId', 'initialWaterPhotoFileId'] as const) {
    const id = input[field];

    if (
      id &&
      id !== existing?.[field] &&
      !(await attachableFile(user, id, 'contract_meter', buildingId, transaction))
    )
      throw new InputValidError('input_valid_error', {
        [field]: ['Ảnh không hợp lệ hoặc không thuộc toà này.'],
      });
  }
}

async function event(row: ContractModel, user: StayUser, type: string, transaction: Transaction) {
  const facts = {
    buildingId: row.buildingId,
    contractId: row.id,
    status: row.status,
    version: row.version,
    roomId: row.roomId,
    startDate: row.startDate,
    endDate: row.endDate,
    rent: row.rent,
    depositAmount: row.depositAmount,
    depositCollected: row.depositCollected,
    initialElectric: row.initialElectric,
    initialWater: row.initialWater,
  };
  await ContractEventModel.create(
    { contractId: row.id, type, actorId: user.id, payload: facts },
    { transaction },
  );
  await recordAudit(
    { action: `contract.${type}`, resourceType: 'contract', resourceId: row.id, changes: facts },
    transaction,
  );
  // Never log names, phone numbers, plates or free text notes.
  setAuditChanges(facts);
}

export async function createContract(
  user: StayUser,
  input: ContractInput,
  key?: string,
): Promise<StayContract> {
  const insert = async (transaction: Transaction) => {
    const { building } = await targetRoom(user, input.roomId, transaction, 'create');
    await validatePhotos(user, input, building.id, transaction);
    const count = await ContractModel.count({ where: { buildingId: building.id }, transaction });
    const row = await ContractModel.create(
      {
        ...fields(input),
        buildingId: building.id,
        code: `HD-${building.code}-${String(count + 1).padStart(4, '0')}`,
        status: 'draft',
      },
      { transaction },
    );

    await replaceLinks(row, input, transaction);
    await event(row, user, 'created', transaction);
    return row;
  };

  if (key) {
    const { result } = await runIdempotent(
      { scope: 'contract.create', actorId: user.id, key, payload: { ...input } },
      async (transaction) => (await insert(transaction)).id,
    );

    if (typeof result !== 'string') throw new Error('Invalid stored contract id');
    return getContract(user, result);
  }
  return auditedTransaction(async (transaction) =>
    contractDto(await insert(transaction), transaction),
  );
}

export async function updateContract(
  user: StayUser,
  id: string,
  input: ContractInput,
  version: number,
): Promise<StayContract> {
  return auditedTransaction(async (transaction) => {
    const row = await findContract(user, id, 'update', transaction);

    assertVersion(row.version, version);
    if (row.status !== 'draft')
      throw new BaseError('contract_not_draft', 409, 'contract_not_draft');
    const { building } = await targetRoom(user, input.roomId, transaction);

    if (building.id !== row.buildingId)
      throw new InputValidError('input_valid_error', {
        roomId: ['Không thể đổi toà của bản nháp.'],
      });
    await validatePhotos(user, input, building.id, transaction, row);
    row.set(fields(input));
    row.changed('updatedAt', true);
    await row.save({ transaction });
    await replaceLinks(row, input, transaction);
    await event(row, user, 'updated', transaction);
    return contractDto(row, transaction);
  });
}

export async function moveInPreview(user: StayUser, id: string): Promise<MoveInPreview> {
  const row = await findContract(user, id, 'read');
  const building = await BuildingModel.findByPk(row.buildingId, { rejectOnEmpty: true });
  const room = await RoomModel.findByPk(row.roomId);
  // Same computation (start-date prices, occupants, vehicles) as the persisted move-in invoice.
  const draft = await auditedTransaction(async (transaction) =>
    computeMoveInDraft(await billingContext(building, transaction), row, transaction),
  );
  const invoice = draft.invoice;
  const lines = invoice.lines.filter((line) => line.type !== 'rounding');
  const quantity = (kind: string) =>
    lines.find((line) => line.meta.serviceKind === kind)?.quantity ?? null;
  const contract = await contractDto(row);
  const activeOnStart = (link: { fromDate: string; toDate: string | null }) =>
    link.fromDate <= row.startDate && (!link.toDate || link.toDate > row.startDate);
  const occupantCount = quantity('per_person') ?? contract.occupants.filter(activeOnStart).length;
  const vehicleCount = quantity('per_vehicle') ?? contract.vehicles.filter(activeOnStart).length;

  return {
    ...selectFields(invoice, ['period', 'subtotal', 'rounding', 'total']),
    occupantCount,
    vehicleCount,
    warnings:
      occupantCount > (room?.maxOccupants ?? 0) ? ['Số người ở vượt giới hạn của phòng.'] : [],
    lines: invoice.lines.map((line) => ({
      ...selectFields(line, [
        'type',
        'serviceId',
        'quantity',
        'unitPrice',
        'ratioNum',
        'ratioDen',
        'amount',
      ]),
      label:
        line.type === 'rent'
          ? 'Tiền phòng'
          : line.type === 'rounding'
            ? 'Làm tròn'
            : `${String(line.description.params.name ?? 'Dịch vụ')}${
                line.meta.serviceDescription ? ` (${line.meta.serviceDescription})` : ''
              }`,
    })),
  };
}

export async function activateContract(user: StayUser, id: string): Promise<StayContract> {
  return auditedTransaction(async (transaction) => {
    const row = await findContract(user, id, 'update', transaction);

    if (row.status !== 'draft')
      throw new BaseError('contract_not_draft', 409, 'contract_not_draft');
    // Every activation and maintenance command locks the same room row. The partial unique
    // index is an independent backstop for every other write path (including future tasks).
    const { room } = await targetRoom(user, row.roomId, transaction);

    if (room.maintenance) throw new BaseError('room_maintenance', 409, 'room_maintenance');
    if (
      await ContractModel.count({
        where: {
          [Op.and]: literal(
            `(room_id = ${sequelize.escape(room.id)} OR stay_contract_room_at(id, ${sequelize.escape(isoDateInTimeZone(new Date()))}) = ${sequelize.escape(room.id)}::uuid OR EXISTS (SELECT 1 FROM contract_events e WHERE e.contract_id="ContractModel".id AND e.type='room-change' AND e.payload->>'roomId'=${sequelize.escape(room.id)} AND e.payload->>'effectiveDate'>=${sequelize.escape(isoDateInTimeZone(new Date()))}))`,
          ),
          status: { [Op.in]: ['active', 'ending'] },
        },
        transaction,
      })
    )
      throw new BaseError('room_has_contract', 409, 'room_has_contract');
    const occupants = await ContractOccupantModel.findAll({
      where: { contractId: row.id, toDate: { [Op.is]: null } },
      transaction,
    });
    const errors: Record<string, string[]> = {};
    const tenants = await TenantModel.findAll({
      where: { id: { [Op.in]: occupants.map((o) => o.tenantId) } },
      order: [['id', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (
      tenants.length !== occupants.length ||
      tenants.some((t) => t.archivedAt || t.buildingId !== row.buildingId)
    )
      errors.occupantIds = ['Người ở không hợp lệ hoặc đã lưu trữ.'];
    if (occupants.filter((o) => o.isPrimary).length !== 1)
      errors.primaryTenantId = ['Chọn đúng một người đại diện.'];
    if (occupants.length > room.maxOccupants)
      errors.occupantIds = ['Số người ở vượt giới hạn của phòng.'];
    const meters = await MeterModel.findAll({
      where: { roomId: room.id, removedOn: { [Op.is]: null } },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const latest = await latestMeterReadings(
      meters.map((m) => m.id),
      transaction,
    );

    for (const meter of meters) {
      const field = meter.kind === 'electricity' ? 'initialElectric' : 'initialWater';
      const baseline = Math.max(meter.initialReading, latest.get(meter.id)?.reading ?? 0);

      if (row[field] < baseline) errors[field] = [`Chỉ số phải ≥ ${baseline}.`];
    }
    if (row.depositCollected && !row.depositDate) errors.depositDate = ['Nhập ngày thu cọc.'];
    if (Object.keys(errors).length) throw new InputValidError('input_valid_error', errors);
    await row.update({ status: 'active' }, { transaction });
    if (row.depositCollected && row.depositAmount > 0)
      await DepositEntryModel.create(
        {
          contractId: row.id,
          type: 'received',
          amount: row.depositAmount,
          method: row.depositMethod,
          occurredOn: row.depositDate ?? row.startDate,
          note: row.depositNote,
        },
        { transaction },
      );
    await event(row, user, 'activated', transaction);
    // ST-14: the move-in invoice is created as a draft from the same computation as the preview.
    await createMoveInForActivation(row, transaction);
    return contractDto(row, transaction);
  });
}

export async function cancelContract(user: StayUser, id: string): Promise<StayContract> {
  return auditedTransaction(async (transaction) => {
    const row = await findContract(user, id, 'update', transaction);

    if (row.status !== 'draft')
      throw new BaseError('contract_not_draft', 409, 'contract_not_draft');
    await row.update({ status: 'cancelled' }, { transaction });
    await event(row, user, 'cancelled', transaction);
    return contractDto(row, transaction);
  });
}
