import type { WhereOptions } from 'sequelize';
import type { CategoryAttributes } from '@/sequelize/models/category.model.js';
import type { ProductAttributes } from '@/sequelize/models/product.model.js';
import type { ModelOrder, SortDirection, StringField } from '@/types/database.js';

export const validOrder: ModelOrder<CategoryAttributes> = [
  ['name', 'ASC'],
  ['id', 'DESC'],
];
export const validSearch: StringField<CategoryAttributes>[] = ['name', 'slug', 'description'];

// @ts-expect-error Invalid SQL directions must be rejected, even though Sequelize accepts strings.
export const invalidDirection: SortDirection = '23423';

export const invalidOrder: ModelOrder<CategoryAttributes> = [
  // @ts-expect-error Unknown model columns must be rejected.
  ['23423', 'ASC'],
];

export const invalidSearch: StringField<CategoryAttributes>[] = [
  // @ts-expect-error Dynamic search field lists must still be checked against model attributes.
  '23423',
];

export const numericSearch: StringField<ProductAttributes>[] = [
  // @ts-expect-error Numeric fields cannot be used as text substring search fields.
  'price',
];

export const invalidWhere: WhereOptions<CategoryAttributes> = {
  // @ts-expect-error Model-specific filters must reject unknown attribute names.
  missingAttribute: 'value',
};
