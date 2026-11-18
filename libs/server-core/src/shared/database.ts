/** SQL directions used by database queries, distinct from HTTP asc/desc values. */
export type SortDirection = 'ASC' | 'DESC';

/** Restrict simple model ordering; Sequelize's Order accepts arbitrary strings. */
export type ModelOrder<Attributes> = [Extract<keyof Attributes, string>, SortDirection][];

/** Only text attributes can be used by substring search. */
export type StringField<Attributes> = {
  [Field in keyof Attributes]-?: NonNullable<Attributes[Field]> extends string ? Field : never;
}[keyof Attributes] &
  string;
