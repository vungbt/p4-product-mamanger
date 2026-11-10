import {
  BaseError,
  buildPaginationMeta,
  InputValidError,
  listSearch,
  NotFound,
  selectFields,
  setAuditChanges,
} from '@p4/server-core';
import type { ListQuery, PaginationMeta } from '@p4/shared';
import {
  type ExpenseCategoryTotal,
  periodOfIsoDate,
  type StayExpense,
  type StayExpenseCategory,
  type StayUser,
} from '@stay/shared';
import { Op, Transaction, UniqueConstraintError, type WhereOptions } from 'sequelize';
import { accessibleBuildingIds, canAccessRecord } from '@/middlewares/ability.middleware.js';
import type { ExpenseAttributes } from '@/sequelize/models/expense.model.js';
import type { ExpenseCategoryAttributes } from '@/sequelize/models/expense-category.model.js';
import {
  BuildingModel,
  ExpenseCategoryModel,
  ExpenseModel,
  FileModel,
  RoomModel,
} from '@/sequelize/models/index.js';
import { auditedTransaction } from '@/shared/audit.js';
import { assertVersion } from '@/shared/input.js';
import type { ModelOrder } from '@/types/database.js';
import { attachableFile, signedFileUrl } from '../uploads/uploads.service.js';

export type ExpenseSortField = 'spentOn' | 'amount' | 'createdAt';
export interface ExpenseListQuery extends ListQuery<ExpenseSortField> {
  buildingId?: string;
  period?: string;
  categoryId?: string;
  roomId?: string;
}
export type ExpenseInput = Pick<
  ExpenseAttributes,
  'buildingId' | 'categoryId' | 'roomId' | 'receiptFileId' | 'amount' | 'spentOn' | 'note'
>;
const fields = [
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
] as const;
const categoryFields = ['id', 'name', 'active', 'version'] as const;

async function expenseDto(row: ExpenseModel, transaction?: Transaction): Promise<StayExpense> {
  const file = row.receiptFileId
    ? await FileModel.findByPk(row.receiptFileId, { transaction })
    : null;

  return { ...selectFields(row, fields), receipt: file ? signedFileUrl(file) : null };
}

export async function listCategories(): Promise<StayExpenseCategory[]> {
  const order: ModelOrder<ExpenseCategoryAttributes> = [['name', 'ASC']];

  return (await ExpenseCategoryModel.findAll({ order })).map((row) =>
    selectFields(row, categoryFields),
  );
}

export async function saveCategory(
  input: { name: string; active: boolean },
  id?: string,
  version?: number,
): Promise<StayExpenseCategory> {
  try {
    return await auditedTransaction(async (transaction) => {
      if (!id) {
        const row = await ExpenseCategoryModel.create(input, { transaction });

        setAuditChanges({ after: selectFields(row, categoryFields) });
        return selectFields(row, categoryFields);
      }
      const row = await ExpenseCategoryModel.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!row) throw new NotFound();
      assertVersion(row.version, version ?? 0);
      setAuditChanges({ before: selectFields(row, categoryFields), after: input });
      await row.update(input, { transaction });
      return selectFields(row, categoryFields);
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError)
      throw new InputValidError('input_valid_error', { name: ['Tên danh mục đã tồn tại.'] });
    throw error;
  }
}

export async function listExpenses(
  user: StayUser,
  query: ExpenseListQuery,
): Promise<{
  data: StayExpense[];
  meta: PaginationMeta & { totalsByCategory: ExpenseCategoryTotal[] };
}> {
  const ids = accessibleBuildingIds(user, 'read');
  const conditions: WhereOptions<ExpenseAttributes>[] = [
    listSearch(ExpenseModel, query.q, ['note']),
  ];

  if (ids !== 'all') conditions.push({ buildingId: { [Op.in]: ids } });
  if (query.buildingId) conditions.push({ buildingId: query.buildingId });
  if (query.period) conditions.push({ period: query.period });
  if (query.categoryId) conditions.push({ categoryId: query.categoryId });
  if (query.roomId) conditions.push({ roomId: query.roomId });
  const where: WhereOptions<ExpenseAttributes> = { [Op.and]: conditions };
  const order: ModelOrder<ExpenseAttributes> = [
    [query.sortBy ?? 'spentOn', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
    ['id', 'ASC'],
  ];

  return auditedTransaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
    async (transaction) => {
      const { rows, count } = await ExpenseModel.findAndCountAll({
        where,
        order,
        limit: query.pageSize,
        offset: (query.page - 1) * query.pageSize,
        transaction,
      });
      const all = await ExpenseModel.findAll({
        where,
        attributes: ['categoryId', 'amount'],
        transaction,
      });
      const totals = new Map<string, number>();

      for (const row of all)
        totals.set(row.categoryId, (totals.get(row.categoryId) ?? 0) + row.amount);
      return {
        data: await Promise.all(rows.map((row) => expenseDto(row, transaction))),
        meta: {
          ...buildPaginationMeta(query.page, query.pageSize, count),
          totalsByCategory: [...totals].map(([categoryId, amount]) => ({ categoryId, amount })),
        },
      };
    },
  );
}

async function findExpense(user: StayUser, id: string, transaction: Transaction) {
  const row = await ExpenseModel.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });

  if (!row || !canAccessRecord(user, 'manage', 'Expense', { buildingId: row.buildingId }))
    throw new NotFound();
  return row;
}

export async function saveExpense(
  user: StayUser,
  input: ExpenseInput,
  id?: string,
  version?: number,
): Promise<StayExpense> {
  return auditedTransaction(async (transaction) => {
    const row = id ? await findExpense(user, id, transaction) : null;

    if (row) assertVersion(row.version, version ?? 0);
    if (!canAccessRecord(user, 'manage', 'Expense', { buildingId: input.buildingId }))
      throw new NotFound();
    const building = await BuildingModel.findByPk(input.buildingId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!building) throw new NotFound('building_not_found');
    if (building.archivedAt) throw new BaseError('building_archived', 409, 'building_archived');
    const category = await ExpenseCategoryModel.findByPk(input.categoryId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!category || (!category.active && row?.categoryId !== category.id))
      throw new InputValidError('input_valid_error', {
        categoryId: ['Chọn danh mục đang hoạt động.'],
      });
    if (
      input.roomId &&
      !(await RoomModel.findOne({
        where: { id: input.roomId, buildingId: input.buildingId, archivedAt: null },
        transaction,
      }))
    )
      throw new InputValidError('input_valid_error', {
        roomId: ['Phòng không thuộc toà đã chọn.'],
      });
    if (
      input.receiptFileId &&
      (input.receiptFileId !== row?.receiptFileId || input.buildingId !== row?.buildingId) &&
      !(await attachableFile(
        user,
        input.receiptFileId,
        'expense_receipt',
        input.buildingId,
        transaction,
      ))
    )
      throw new InputValidError('input_valid_error', {
        receiptFileId: ['Ảnh hoá đơn không hợp lệ.'],
      });
    const values = { ...input, period: periodOfIsoDate(input.spentOn) };

    setAuditChanges({ before: row ? selectFields(row, fields) : null, after: values });
    const saved = row
      ? await row.update(values, { transaction })
      : await ExpenseModel.create(values, { transaction });

    return expenseDto(saved, transaction);
  });
}

export async function deleteExpense(user: StayUser, id: string): Promise<{ id: string }> {
  return auditedTransaction(async (transaction) => {
    const row = await findExpense(user, id, transaction);

    setAuditChanges({ before: selectFields(row, fields) });
    await row.destroy({ transaction });
    return { id };
  });
}
