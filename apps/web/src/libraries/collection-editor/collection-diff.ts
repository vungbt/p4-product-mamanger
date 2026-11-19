export type CollectionDiffConfig<Row, Baseline, Id, Create, Update> = {
  path: string;
  rowKey: (row: Row) => string;
  rowId: (row: Row) => Id | undefined;
  baselineId: (row: Baseline) => Id;
  isRemoved: (row: Row) => boolean;
  create: (row: Row) => Create;
  update: (row: Row, previous: Baseline) => Update | undefined;
};

/** Paths follow payload indices so API field errors can be routed to stable row keys. */
export function collectionDiff<Row, Baseline, Id, Create, Update>(
  rows: readonly Row[],
  baseline: readonly Baseline[],
  config: CollectionDiffConfig<Row, Baseline, Id, Create, Update>,
) {
  const changes: { create: Create[]; update: Update[]; delete: Id[] } = {
    create: [],
    update: [],
    delete: [],
  };
  const paths: Record<string, string> = {};
  const previousRows = new Map(baseline.map((row) => [config.baselineId(row), row]));

  for (const row of rows) {
    const id = config.rowId(row);
    if (config.isRemoved(row)) {
      if (id !== undefined) {
        paths[`${config.path}.delete.${changes.delete.length}`] = config.rowKey(row);
        changes.delete.push(id);
      }
      continue;
    }
    const previous = id === undefined ? undefined : previousRows.get(id);
    if (previous === undefined) {
      paths[`${config.path}.create.${changes.create.length}`] = config.rowKey(row);
      changes.create.push(config.create(row));
    } else {
      const update = config.update(row, previous);
      if (update !== undefined) {
        paths[`${config.path}.update.${changes.update.length}`] = config.rowKey(row);
        changes.update.push(update);
      }
    }
  }

  return {
    changes,
    paths,
    changed: Boolean(changes.create.length || changes.update.length || changes.delete.length),
  };
}

export function saveCollectionRow<Row>(
  rows: readonly Row[],
  value: Row,
  rowKey: (row: Row) => string,
): Row[] {
  return rows.some((row) => rowKey(row) === rowKey(value))
    ? rows.map((row) => (rowKey(row) === rowKey(value) ? value : row))
    : [...rows, value];
}

export function toggleCollectionRemoval<Row, Id>(
  rows: readonly Row[],
  key: string,
  config: {
    rowKey: (row: Row) => string;
    rowId: (row: Row) => Id | undefined;
    toggleRemoved: (row: Row) => Row;
  },
): Row[] {
  return rows.flatMap((row) =>
    config.rowKey(row) !== key
      ? [row]
      : config.rowId(row) === undefined
        ? []
        : [config.toggleRemoved(row)],
  );
}
