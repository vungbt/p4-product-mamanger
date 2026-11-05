import type { Category } from '@p4/shared';
import type { CategoryModel } from '@/sequelize/models/category.model.js';
import { selectFields } from '@/utils/select-fields.js';

declare const row: CategoryModel;

export const category: Category = selectFields(row, ['id', 'name', 'slug', 'description']);

// @ts-expect-error Field names must exist on the actual source model.
export const unknownField = selectFields(row, ['23423']);

// @ts-expect-error Selecting too few fields cannot satisfy the DTO contract.
export const incomplete: Category = selectFields(row, ['id', 'name']);

// @ts-expect-error Field values retain their original types; string IDs cannot become numbers.
export const wrongValueType: { id: number } = selectFields(row, ['id']);

const selected = selectFields(row, ['id', 'name']);
// @ts-expect-error Fields and model methods that were not selected must not appear in the result type.
export const modelMethod = selected.save;
