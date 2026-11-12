import { buildPaginationMeta, listSearch, NotFound, selectFields } from '@p4/server-core';
import type { ListQuery, PaginationMeta } from '@p4/shared';
import type {
  MaintenanceInput,
  MaintenanceSource,
  MaintenanceStatus,
  MaintenanceUpdateInput,
  StayMaintenance,
  StayUser,
} from '@stay/shared';
import { Op, type Transaction, type WhereOptions } from 'sequelize';
import { canAccessRecord } from '@/middlewares/ability.middleware.js';
import { accessibleWhere } from '@/middlewares/accessible-where.js';
import {
  BuildingModel,
  ExpenseModel,
  MaintenanceRequestModel,
  RoomModel,
} from '@/sequelize/models/index.js';
import type { MaintenanceRequestAttributes } from '@/sequelize/models/maintenance-request.model.js';
import { auditedCommand, auditedTransaction, recordAudit } from '@/shared/audit.js';
import { assertVersion } from '@/shared/input.js';
import type { ModelOrder } from '@/types/database.js';
import { type ExpenseInput, saveExpense } from '../expenses/expenses.service.js';
import { publishNotification } from '../notifications/notifications.publish.js';
import { conflict, invalid, photoMap, photosOf } from '../requests/requests.shared.js';
import { attachableFile } from '../uploads/uploads.service.js';

export type MaintenanceSortField = 'createdAt';

export interface MaintenanceListQuery extends ListQuery<MaintenanceSortField> {
  buildingId?: string;
  roomId?: string;
  status?: MaintenanceStatus;
  source?: MaintenanceSource;
}

async function dto(
  row: MaintenanceRequestModel,
  transaction?: Transaction,
): Promise<StayMaintenance> {
  const [room, photos, expense] = await Promise.all([
    row.roomId ? RoomModel.findByPk(row.roomId, { transaction }) : null,
    photoMap(row.photos, transaction),
    row.costExpenseId ? ExpenseModel.findByPk(row.costExpenseId, { transaction }) : null,
  ]);

  return {
    ...selectFields(row, [
      'id',
      'buildingId',
      'roomId',
      'title',
      'description',
      'source',
      'status',
      'reply',
      'history',
      'version',
    ]),
    roomCode: room?.code ?? null,
    photos: photosOf(row.photos, photos),
    expense: expense
      ? {
          ...selectFields(expense, [
            'id',
            'buildingId',
            'roomId',
            'categoryId',
            'amount',
            'spentOn',
            'period',
            'note',
            'receiptFileId',
            'version',
          ]),
          receipt: null,
        }
      : null,
    createdAt: row.createdAt.toISOString(),
  };
}

async function findJob(
  user: StayUser,
  id: string,
  action: 'read' | 'update',
  transaction?: Transaction,
) {
  const row = await MaintenanceRequestModel.findOne({
    where: { [Op.and]: [{ id }, accessibleWhere(user, action, 'Maintenance')] },
    transaction,
    ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
  });

  if (!row || !canAccessRecord(user, action, 'Maintenance', { buildingId: row.buildingId }))
    throw new NotFound();
  return row;
}

export async function listMaintenance(
  user: StayUser,
  query: MaintenanceListQuery,
): Promise<{ data: StayMaintenance[]; meta: PaginationMeta }> {
  if (
    query.buildingId &&
    !canAccessRecord(user, 'read', 'Maintenance', { buildingId: query.buildingId })
  )
    throw new NotFound();
  if (query.roomId) {
    const room = await RoomModel.findByPk(query.roomId);

    if (
      !room ||
      !canAccessRecord(user, 'read', 'Maintenance', { buildingId: room.buildingId }) ||
      (query.buildingId && room.buildingId !== query.buildingId)
    )
      throw new NotFound();
  }
  const conditions: WhereOptions<MaintenanceRequestAttributes>[] = [
    accessibleWhere(user, 'read', 'Maintenance'),
    listSearch(MaintenanceRequestModel, query.q, ['title', 'description']),
  ];

  if (query.buildingId) conditions.push({ buildingId: query.buildingId });
  if (query.roomId) conditions.push({ roomId: query.roomId });
  if (query.status) conditions.push({ status: query.status });
  if (query.source) conditions.push({ source: query.source });
  const order: ModelOrder<MaintenanceRequestAttributes> = [
    ['createdAt', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
    ['id', 'ASC'],
  ];
  const { rows, count } = await MaintenanceRequestModel.findAndCountAll({
    where: { [Op.and]: conditions },
    order,
    limit: query.pageSize,
    offset: (query.page - 1) * query.pageSize,
  });

  return {
    data: await Promise.all(rows.map((row) => dto(row))),
    meta: buildPaginationMeta(query.page, query.pageSize, count),
  };
}

export async function getMaintenance(user: StayUser, id: string): Promise<StayMaintenance> {
  return dto(await findJob(user, id, 'read'));
}

async function checkPhotos(
  user: StayUser,
  ids: string[],
  buildingId: string,
  retained: string[],
  transaction: Transaction,
) {
  for (const id of ids)
    if (
      !retained.includes(id) &&
      !(await attachableFile(user, id, 'maintenance_photo', buildingId, transaction))
    )
      invalid('photoFileIds', 'Ảnh không hợp lệ.');
}

export async function createMaintenance(
  user: StayUser,
  input: MaintenanceInput,
): Promise<StayMaintenance> {
  return auditedTransaction(async (transaction) => {
    const room = await RoomModel.findByPk(input.roomId, { transaction });

    if (
      !room ||
      room.archivedAt ||
      !canAccessRecord(user, 'create', 'Maintenance', { buildingId: room.buildingId })
    )
      throw new NotFound();
    const building = await BuildingModel.findByPk(room.buildingId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!building || building.archivedAt) conflict('building_archived');
    const photos = input.photoFileIds ?? [];

    await checkPhotos(user, photos, room.buildingId, [], transaction);
    const row = await MaintenanceRequestModel.create(
      {
        buildingId: room.buildingId,
        roomId: room.id,
        source: 'owner',
        category: input.category ?? 'other',
        severity: input.severity ?? 'normal',
        title: input.title,
        description: input.description,
        photos,
        status: 'open',
        createdBy: user.id,
      },
      { transaction },
    );

    await recordAudit(
      {
        action: 'maintenance.create',
        resourceType: 'maintenance',
        resourceId: row.id,
        changes: {
          buildingId: row.buildingId,
          roomId: room.id,
          status: row.status,
          photoCount: photos.length,
        },
      },
      transaction,
    );
    await row.reload({ transaction });
    return dto(row, transaction);
  });
}

export async function updateMaintenance(
  user: StayUser,
  id: string,
  input: MaintenanceUpdateInput,
): Promise<StayMaintenance> {
  return auditedTransaction(async (transaction) => {
    const row = await findJob(user, id, 'update', transaction);

    assertVersion(row.version, input.version);
    const before = row.status;
    const status = input.status ?? before;
    const next: Partial<Record<MaintenanceStatus, MaintenanceStatus[]>> = {
      new: ['open'],
      open: ['in_progress'],
      in_progress: ['done', 'cancelled'],
    };

    if (status !== before && !next[before]?.includes(status))
      conflict('maintenance_invalid_transition');
    const photos = input.photoFileIds ?? row.photos;

    await checkPhotos(user, photos, row.buildingId, row.photos, transaction);
    await row.update(
      {
        title: input.title ?? row.title,
        description: input.description ?? row.description,
        photos,
        status,
        ...(input.reply !== undefined
          ? { reply: input.reply, repliedAt: new Date(), repliedBy: user.id }
          : {}),
        ...(status !== before ? { handledBy: user.id, handledAt: new Date() } : {}),
      },
      { transaction },
    );
    await recordAudit(
      {
        action: 'maintenance.update',
        resourceType: 'maintenance',
        resourceId: id,
        changes: {
          buildingId: row.buildingId,
          statusBefore: before,
          statusAfter: status,
          photoCount: photos.length,
        },
      },
      transaction,
    );
    if (
      row.source === 'tenant' &&
      row.contractId &&
      (status !== before || input.reply !== undefined)
    ) {
      await publishNotification(
        {
          buildingId: row.buildingId,
          kind: 'request.updated',
          title: 'Cập nhật báo hỏng',
          body: status !== before ? `Trạng thái: ${status}` : 'Chủ trọ đã trả lời báo hỏng.',
          path: '/p/maintenance',
          audience: 'tenant',
          contractId: row.contractId,
          tenantId: row.tenantId,
        },
        transaction,
      );
    }
    await row.reload({ transaction });
    return dto(row, transaction);
  });
}

export async function addMaintenanceExpense(
  user: StayUser,
  id: string,
  input: Omit<ExpenseInput, 'buildingId' | 'roomId'>,
): Promise<StayMaintenance> {
  return auditedTransaction(async (transaction) => {
    const row = await findJob(user, id, 'update', transaction);

    if (!canAccessRecord(user, 'create', 'Expense', { buildingId: row.buildingId }))
      throw new NotFound();
    if (row.costExpenseId) conflict('maintenance_expense_exists');
    if (row.status === 'cancelled' || row.status === 'rejected') conflict('maintenance_closed');
    const expense = await auditedCommand({ action: 'create', resourceType: 'expense' }, () =>
      saveExpense(
        user,
        { ...input, buildingId: row.buildingId, roomId: row.roomId },
        undefined,
        undefined,
        'create',
      ),
    );

    await row.update({ costExpenseId: expense.id }, { transaction });
    await recordAudit(
      {
        action: 'maintenance.expense',
        resourceType: 'maintenance',
        resourceId: id,
        changes: { buildingId: row.buildingId, expenseId: expense.id },
      },
      transaction,
    );
    return dto(row, transaction);
  });
}
