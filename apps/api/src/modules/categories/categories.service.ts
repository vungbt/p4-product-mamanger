import type {
  ApiPaginatedSuccess,
  ApiSuccess,
  Category,
  CategoryInput,
  CategoryListQuery,
} from '@p4/shared';
import type { Transaction } from 'sequelize';
import { col, fn, Op, type WhereOptions, where } from 'sequelize';
import { errorKeys } from '@/constants/index.js';
import type { CategoryAttributes } from '@/sequelize/models/category.model.js';
import { CategoryModel } from '@/sequelize/models/index.js';
import { recordAudit } from '@/shared/commerce/persistence.js';
import { searchPattern } from '@/shared/list-filters.js';
import { requestStore } from '@/shared/request-store.js';
import { inTransaction } from '@/shared/transaction.js';
import type { ModelOrder, StringField } from '@/types/database.js';
import { NotFound } from '@/utils/errors/index.js';
import { buildPaginationMeta } from '@/utils/pagination.js';
import { selectFields } from '@/utils/select-fields.js';

const categoryFields = ['id', 'name', 'slug', 'description'] satisfies (keyof Category)[];

const searchFields: StringField<CategoryAttributes>[] = ['name', 'slug', 'description'];

export async function listCategories(
  query?: CategoryListQuery,
): Promise<ApiSuccess<Category[]> | ApiPaginatedSuccess<Category>> {
  const order: ModelOrder<CategoryAttributes> = [
    [query?.sortBy ?? 'name', query?.sortOrder === 'desc' ? 'DESC' : 'ASC'],
    ['id', 'ASC'],
  ];

  if (!query) {
    const rows = await CategoryModel.findAll({
      order,
    });
    return { data: rows.map((row) => selectFields(row, categoryFields)) };
  }

  const conditions: WhereOptions<CategoryAttributes>[] = [];

  if (query.q) {
    const pattern = searchPattern(query.q);
    conditions.push({
      [Op.or]: searchFields.map((field) => ({
        [field]: { [Op.iLike]: pattern },
      })),
    });
  }

  if (query.description && query.description !== 'all') {
    conditions.push(
      where(fn('btrim', col('description')), { [query.description === 'has' ? Op.ne : Op.eq]: '' }),
    );
  }

  const { rows, count } = await CategoryModel.findAndCountAll({
    where: conditions.length ? { [Op.and]: conditions } : undefined,
    order,
    limit: query.pageSize,
    offset: (query.page - 1) * query.pageSize,
  });

  return {
    data: rows.map((row) => selectFields(row, categoryFields)),
    meta: buildPaginationMeta(query.page, query.pageSize, count),
  };
}

export async function getCategoryById(id: string): Promise<Category> {
  const row = await CategoryModel.findByPk(id);
  if (!row) throw new NotFound(errorKeys.categoryNotFound);
  return selectFields(row, categoryFields);
}

export async function createCategory(
  input: CategoryInput,
  transaction?: Transaction,
): Promise<Category> {
  return inTransaction(transaction, async (transaction) => {
    const row = await CategoryModel.create(
      {
        name: input.name,
        slug: input.slug.trim().toLowerCase(),
        description: input.description ?? '',
      },
      { transaction },
    );
    await recordAudit(
      {
        actorId: requestStore.getStore()?.user?.id,
        action: 'category.created',
        resourceType: 'category',
        resourceId: row.id,
      },
      transaction,
    );
    return selectFields(row, categoryFields);
  });
}

export async function updateCategory(
  id: string,
  input: Partial<CategoryInput>,
  transaction?: Transaction,
): Promise<Category> {
  return inTransaction(transaction, async (transaction) => {
    const row = await CategoryModel.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!row) throw new NotFound(errorKeys.categoryNotFound);
    await row.update(
      {
        name: input.name ?? row.name,
        slug: input.slug != null ? input.slug.trim().toLowerCase() : row.slug,
        description: input.description ?? row.description,
      },
      { transaction },
    );
    await recordAudit(
      {
        actorId: requestStore.getStore()?.user?.id,
        action: 'category.updated',
        resourceType: 'category',
        resourceId: row.id,
      },
      transaction,
    );
    return selectFields(row, categoryFields);
  });
}

export async function deleteCategory(id: string): Promise<Category> {
  return inTransaction(undefined, async (transaction) => {
    const row = await CategoryModel.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!row) throw new NotFound(errorKeys.categoryNotFound);
    const data = selectFields(row, categoryFields);
    await row.destroy({ transaction });
    await recordAudit(
      {
        actorId: requestStore.getStore()?.user?.id,
        action: 'category.deleted',
        resourceType: 'category',
        resourceId: id,
      },
      transaction,
    );
    return data;
  });
}
