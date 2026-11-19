import {
  Button,
  type ColumnDef,
  cn,
  DataTable,
  EmptyState,
  FormSection,
  Icon,
  IconButton,
  Tag,
  Tooltip,
} from '@itclabs/react-ui';
import { type ReactNode, useState } from 'react';

export type CollectionChange = 'new' | 'edited' | 'deleted' | undefined;

export type CollectionEditorLabels = {
  title: string;
  description: string;
  add: string;
  edit: string;
  remove: string;
  undo: string;
  emptyTitle: string;
  emptyDescription: string;
  error: string;
  new: string;
  edited: string;
  deleted: string;
};

export type CollectionEditorProps<Row> = {
  rows: Row[];
  columns: ColumnDef<Row, unknown>[];
  rowKey: (row: Row) => string;
  rowLabel: (row: Row) => string;
  change: (row: Row) => CollectionChange;
  createRow: () => Row;
  saveRow: (row: Row) => void;
  toggleRemoval: (row: Row) => void;
  errors: Record<string, Record<string, string>>;
  errorLabel: (error: string) => string;
  disabled: boolean;
  labels: CollectionEditorLabels;
  renderDialog: (props: {
    initial: Row;
    errors: Record<string, string>;
    onClose: () => void;
    onSave: (row: Row) => void;
  }) => ReactNode;
};

const noErrors: Record<string, string> = {};

export function CollectionEditor<Row>({
  rows,
  columns,
  rowKey,
  rowLabel,
  change,
  createRow,
  saveRow,
  toggleRemoval,
  errors,
  errorLabel,
  disabled,
  labels,
  renderDialog,
}: CollectionEditorProps<Row>) {
  const [editing, setEditing] = useState<Row | null>(null);

  const addButton = (
    <Button type="button" disabled={disabled} onClick={() => setEditing(createRow())}>
      <Icon name="plus" />
      {labels.add}
    </Button>
  );
  const tableColumns: ColumnDef<Row, unknown>[] = [
    ...columns,
    {
      id: 'collection-change',
      header: '',
      cell: ({ row: { original: row } }) => {
        const state = change(row);

        return state ? (
          <Tag tone={state === 'deleted' ? 'danger' : state === 'new' ? 'info' : 'warning'}>
            {labels[state]}
          </Tag>
        ) : null;
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row: { original: row } }) => {
        const removed = change(row) === 'deleted';
        const removalLabel = removed ? labels.undo : labels.remove;

        return (
          <div className="flex items-center justify-end gap-1">
            {!removed && (
              <Tooltip content={labels.edit}>
                <IconButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon="edit"
                  className="bg-warning-50 text-warning-700 hover:bg-warning-50 hover:text-warning-700"
                  label={`${labels.edit}: ${rowLabel(row)}`}
                  disabled={disabled}
                  onClick={() => setEditing(row)}
                />
              </Tooltip>
            )}
            <Tooltip content={removalLabel}>
              <IconButton
                type="button"
                variant="ghost"
                size="sm"
                icon={removed ? 'rotateLeft' : 'delete'}
                className={
                  removed
                    ? 'bg-info-50 text-info-700 hover:bg-info-50 hover:text-info-700'
                    : 'bg-danger-50 text-danger-700 hover:bg-danger-50 hover:text-danger-800'
                }
                label={`${removalLabel}: ${rowLabel(row)}`}
                disabled={disabled}
                onClick={() => toggleRemoval(row)}
              />
            </Tooltip>
            {Object.keys(errors[rowKey(row)] ?? {}).length > 0 && (
              <Tag
                tone="danger"
                icon="edit"
                disabled={disabled}
                onClick={() => setEditing(row)}
                title={Object.values(errors[rowKey(row)]).map(errorLabel).join(' ')}
              >
                {labels.error}
              </Tag>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <FormSection
        variant="card"
        title={labels.title}
        description={labels.description}
        action={addButton}
      >
        <DataTable
          mode="client"
          rows={rows}
          columns={tableColumns.map((column) => ({
            ...column,
            cell: (
              context: Parameters<Exclude<ColumnDef<Row, unknown>['cell'], string | undefined>>[0],
            ) => (
              <div
                className={cn(
                  change(context.row.original) === 'deleted' && 'text-muted line-through',
                )}
              >
                {typeof column.cell === 'function'
                  ? column.cell(context)
                  : String(context.getValue() ?? '')}
              </div>
            ),
          }))}
          rowId={rowKey}
          caption={labels.title}
          pagination={false}
          emptyState={
            <EmptyState
              variant="empty"
              size="compact"
              title={labels.emptyTitle}
              description={labels.emptyDescription}
              action={addButton}
            />
          }
        />
      </FormSection>
      {editing !== null &&
        renderDialog({
          initial: editing,
          errors: errors[rowKey(editing)] ?? noErrors,
          onClose: () => setEditing(null),
          onSave: (row) => {
            saveRow(row);
            setEditing(null);
          },
        })}
    </>
  );
}
