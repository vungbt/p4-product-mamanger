import type { Category, CategoryInput } from '@p4/shared';
import { errorKeys } from '@/constants/index.js';
import { CategoryModel } from '@/sequelize/models/index.js';
import { NotFound } from '@/utils/errors/index.js';

function toCategory(row: CategoryModel): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
  };
}

export async function listCategories() {
  const rows = await CategoryModel.findAll({ order: [['name', 'ASC']] });
  return rows.map(toCategory);
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
