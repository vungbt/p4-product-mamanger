/** Copy only explicitly selected properties, including Sequelize instance getters. */
export function selectFields<Source extends object, const Fields extends readonly (keyof Source)[]>(
  source: Source,
  fields: Fields,
): Pick<Source, Fields[number]> {
  // Object.fromEntries loses the key/value relationship; the selected keys define it here.
  return Object.fromEntries(fields.map((field) => [field, source[field]])) as Pick<
    Source,
    Fields[number]
  >;
}
