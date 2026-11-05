import type { Category, CategoryInput, CategoryListQuery } from '@p4/shared';
import { col, fn, Op, type WhereOptions, where } from 'sequelize';
import { errorKeys } from '@/constants/index.js';
import { CategoryModel } from '@/sequelize/models/index.js';
import { NotFound } from '@/utils/errors/index.js';
import { buildPaginationMeta } from '@/utils/pagination.js';

function toCategory(row: CategoryModel): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
  };
}

export async function listCategories(query?: CategoryListQuery) {
  if (!query) {
    const rows = await CategoryModel.findAll({
      order: [
        ['name', 'ASC'],
        ['id', 'ASC'],
      ],
    });
    return { data: rows.map(toCategory) };
  }

  const conditions: WhereOptions[] = [];

  if (query.q) {
    // Escape LIKE wildcards so user input is a literal substring, not a pattern.
    const pattern = `%${query.q.replace(/[\\%_]/g, '\\$&')}%`;
    conditions.push({
      [Op.or]: ['name', 'slug', 'description'].map((field) => ({
        [field]: { [Op.iLike]: pattern },
      })),
    });
  }

  if (query.description === 'has' || query.description === 'none') {
    conditions.push(
      where(fn('btrim', col('description')), { [query.description === 'has' ? Op.ne : Op.eq]: '' }),
    );
  }

  const { rows, count } = await CategoryModel.findAndCountAll({
    where: conditions.length ? { [Op.and]: conditions } : undefined,
    order: [
      [query.sortBy ?? 'name', query.sortOrder === 'desc' ? 'DESC' : 'ASC'],
      ['id', 'ASC'],
    ],
    limit: query.pageSize,
    offset: (query.page - 1) * query.pageSize,
  });

  return {
    data: rows.map(toCategory),
    meta: buildPaginationMeta(query.page, query.pageSize, count),
  };
}

export async function getCategoryById(id: string) {
  const row = await CategoryModel.findByPk(id);
  if (!row) throw new NotFound(errorKeys.categoryNotFound);
  return toCategory(row);
}

export async function createCategory(input: CategoryInput) {
  const row = await CategoryModel.create({
    name: input.name,
    slug: input.slug.trim().toLowerCase(),
    description: input.description ?? '',
  });
  return toCategory(row);
}

export async function updateCategory(id: string, input: Partial<CategoryInput>) {
  const row = await CategoryModel.findByPk(id);
  if (!row) throw new NotFound(errorKeys.categoryNotFound);
  await row.update({
    name: input.name ?? row.name,
    slug: input.slug != null ? input.slug.trim().toLowerCase() : row.slug,
    description: input.description ?? row.description,
  });
  return toCategory(row);
}

export async function deleteCategory(id: string) {
  const row = await CategoryModel.findByPk(id);
  if (!row) throw new NotFound(errorKeys.categoryNotFound);
  const data = toCategory(row);
  await row.destroy();
  return data;
}
