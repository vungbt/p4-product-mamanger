import { type Attributes, cast, col, type Model, type ModelStatic, Op, where } from 'sequelize';
import { searchPattern } from './list-filters.js';

/** Literal substring search on explicitly selected model fields, including UUID identifiers. */
export function listSearch<M extends Model>(
  model: ModelStatic<M>,
  value: string | undefined,
  fields: readonly Extract<keyof Attributes<M>, string>[],
  alias = model.name,
): { [Op.or]?: ReturnType<typeof where>[] } {
  if (!value) return {};
  const attributes = model.getAttributes();
  return {
    [Op.or]: fields.map((field) =>
      where(cast(col(`${alias}.${attributes[field]?.field ?? field}`), 'text'), {
        [Op.iLike]: searchPattern(value),
      }),
    ),
  };
}
