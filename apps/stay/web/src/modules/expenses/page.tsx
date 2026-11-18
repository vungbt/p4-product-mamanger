import {
  AlertDialog,
  Button,
  type ColumnDef,
  EmptyState,
  Icon,
  IconButton,
  Input,
  KpiCard,
  KpiGrid,
  Select,
  useDataTable,
} from '@itclabs/react-ui';
import { useDeleteExpense, useExpenseCategories, useExpenses, useRooms } from '@stay/sdk/react';
import { getErrorMessage } from '@stay/sdk/shared';
import { isPeriod, type StayExpense } from '@stay/shared';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { FilterBar } from '@/libraries/filter-bar';
import { displayDate, formatVnd, todayIsoDate } from '@/libraries/format';
import { FormError, LoadError } from '@/libraries/forms/page-states';
import { PeriodPicker } from '@/libraries/forms/period-picker';
import { ListTable, rowTestId } from '@/libraries/list-table';
import { ScreenHeader } from '@/libraries/screen-header';
import { latestSearchParams } from '@/libraries/search-params';
import { PAGE_SIZE_OPTIONS, useTableParams } from '@/libraries/table-params';
import { ExpenseForm } from './expense-form';

const TABLE_ID = 'expense-list';
const SORT_FIELDS = ['spentOn', 'amount', 'createdAt'] as const;

type RowActions = {
  onEdit: (expense: StayExpense) => void;
  onDelete: (expense: StayExpense) => void;
};

export default function ExpensesPage() {
  const { buildingId } = useActiveBuilding();

  return <BuildingExpenses key={buildingId ?? 'none'} buildingId={buildingId} />;
}

function BuildingExpenses({ buildingId }: { buildingId: string | null }) {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [editing, setEditing] = useState<StayExpense | 'new' | null>(null);
  const [deleting, setDeleting] = useState<StayExpense | null>(null);
  const [error, setError] = useState<string | null>(null);
  const table = useTableParams({
    sortFields: SORT_FIELDS,
    defaultSort: { sortBy: 'spentOn', sortOrder: 'desc' },
  });

  const period = isPeriod(params.get('period'))
    ? (params.get('period') ?? '')
    : todayIsoDate().slice(0, 7);
  const categories = useExpenseCategories();
  const rooms = useRooms(buildingId ?? '', { pageSize: 100 });
  const expenses = useExpenses({
    buildingId: buildingId ?? undefined,
    period,
    page: table.page,
    pageSize: table.pageSize,
    sortBy: table.sortBy,
    sortOrder: table.sortOrder,
    categoryId: params.get('categoryId') || undefined,
    roomId: params.get('roomId') || undefined,
    q: params.get('q') || undefined,
  });
  const remove = useDeleteExpense();

  const filter = (field: string, value: string) =>
    setParams(
      () => {
        const next = latestSearchParams();

        if (value) next.set(field, value);
        else next.delete(field);
        next.delete('page');
        return next;
      },
      { replace: true },
    );

  useEffect(() => {
    setSearch(params.get('q') ?? '');
  }, [params]);
  useEffect(() => {
    if (search === (params.get('q') ?? '')) return;
    const timer = setTimeout(
      () =>
        setParams(
          () => {
            const next = latestSearchParams();

            if (search) next.set('q', search);
            else next.delete('q');
            next.delete('page');
            return next;
          },
          { replace: true },
        ),
      300,
    );

    return () => clearTimeout(timer);
  }, [search, params, setParams]);

  const names = new Map(categories.data?.map((category) => [category.id, category.name]));
  const total =
    expenses.data?.meta.totalsByCategory.reduce((sum, category) => sum + category.amount, 0) ?? 0;

  const roomCode = (expense: StayExpense) =>
    rooms.data?.data.find((room) => room.id === expense.roomId)?.code ?? 'Cả toà';
  const actions: RowActions = { onEdit: setEditing, onDelete: setDeleting };

  const reload = () => {
    setEditing(null);
    void expenses.refetch();
    void categories.refetch();
  };

  const controller = useDataTable<StayExpense>({
    caption: 'Danh sách chi phí',
    mode: 'server',
    rows: expenses.data?.data ?? [],
    rowCount: expenses.data?.meta.total ?? 0,
    // Keep the page height only once rows exist (not the first load's skeleton).
    preservePageHeight: (expenses.data?.meta.total ?? 0) > 0,
    columns: expenseColumns({ names, roomCode, ...actions }),
    rowId: (row) => row.id,
    state: table.state,
    onStateChange: table.onStateChange,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    loading: expenses.isPending,
    error: expenses.isError
      ? getErrorMessage(expenses.error, 'Không tải được chi phí.')
      : undefined,
    onRetry: () => void expenses.refetch(),
    emptyState: <EmptyState size="compact" title="Chưa có chi phí trong kỳ này." />,
    'data-testid': TABLE_ID,
  });

  return (
    <div className="grid min-w-0 gap-5">
      <ScreenHeader
        title="Chi phí vận hành"
        description="Theo dõi khoản chi theo kỳ và danh mục."
      />
      {!buildingId ? (
        <p>Chọn hoặc tạo toà nhà để ghi chi phí.</p>
      ) : (
        <>
          <FilterBar
            actions={
              <>
                <Link
                  to="/settings/expense-categories"
                  className="self-center px-2 text-center font-semibold text-accent underline"
                >
                  Quản lý danh mục
                </Link>
                <Button onClick={() => setEditing('new')}>
                  <Icon name="plus" className="size-4" aria-hidden />
                  Thêm chi phí
                </Button>
              </>
            }
          >
            <PeriodPicker
              label="Kỳ"
              value={period}
              clearable
              onChange={(value) => filter('period', value)}
            />
            <Select
              label="Danh mục"
              aria-label="Lọc danh mục"
              placeholder="Tất cả danh mục"
              clearable
              options={
                categories.data?.map((category) => ({
                  value: category.id,
                  label: category.name,
                })) ?? []
              }
              value={params.get('categoryId')}
              onValueChange={(value) => filter('categoryId', value ?? '')}
            />
            <Select
              label="Phòng"
              aria-label="Lọc phòng"
              placeholder="Tất cả phòng"
              clearable
              options={rooms.data?.data.map((room) => ({ value: room.id, label: room.code })) ?? []}
              value={params.get('roomId')}
              onValueChange={(value) => filter('roomId', value ?? '')}
            />
            <Input
              label="Tìm"
              aria-label="Tìm chi phí"
              type="search"
              placeholder="Tìm ghi chú"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </FilterBar>
          {categories.isError ? (
            <LoadError error={categories.error} onRetry={() => void categories.refetch()} />
          ) : null}
          {rooms.isError ? (
            <LoadError error={rooms.error} onRetry={() => void rooms.refetch()} />
          ) : null}
          {editing ? (
            <ExpenseForm
              key={`${buildingId}-${editing === 'new' ? 'new' : editing.id}`}
              buildingId={buildingId}
              categories={categories.data ?? []}
              rooms={rooms.data?.data ?? []}
              expense={editing === 'new' ? undefined : editing}
              onDone={() => setEditing(null)}
              onReload={reload}
            />
          ) : null}
          <FormError message={error} />
          {expenses.data ? (
            <KpiGrid aria-label="Tổng theo danh mục" data-testid="expense-totals">
              <KpiCard
                label="Tổng chi phí"
                value={formatVnd(total)}
                icon="receipt"
                tone="warning"
                compact
              />
              {expenses.data.meta.totalsByCategory.map((category) => (
                <KpiCard
                  key={category.categoryId}
                  label={names.get(category.categoryId) ?? 'Danh mục'}
                  value={formatVnd(category.amount)}
                  tone="neutral"
                  compact
                />
              ))}
            </KpiGrid>
          ) : null}
          <ListTable
            controller={controller}
            refreshing={expenses.isFetching && !expenses.isPending}
            cards={(items) => (
              <ul className="grid gap-3" aria-label="Danh sách chi phí">
                {items.map((expense) => (
                  <li
                    key={expense.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-panel border border-line bg-surface p-4"
                    data-testid={rowTestId(TABLE_ID, expense.id)}
                  >
                    <div className="grid min-w-0 gap-1 break-words">
                      <strong>
                        {formatVnd(expense.amount)} · {names.get(expense.categoryId)}
                      </strong>
                      <p>
                        {displayDate(expense.spentOn)} · {roomCode(expense)}
                      </p>
                      <p className="whitespace-pre-wrap">{expense.note}</p>
                      <ReceiptLink expense={expense} />
                    </div>
                    <ExpenseActions expense={expense} {...actions} />
                  </li>
                ))}
              </ul>
            )}
          />
        </>
      )}
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Xoá chi phí?"
        description={`Xoá khoản chi ${formatVnd(deleting?.amount ?? 0)}?`}
        confirmLabel="Xoá"
        cancelLabel="Huỷ"
        confirmVariant="danger"
        closeOnConfirm={false}
        onConfirm={async () => {
          if (!deleting || remove.isPending) return;
          try {
            await remove.mutateAsync(deleting.id);
            setDeleting(null);
            setError(null);
          } catch (cause) {
            setError(getErrorMessage(cause, 'Không thể xoá chi phí.'));
            setDeleting(null);
          }
        }}
      />
    </div>
  );
}

function ReceiptLink({ expense }: { expense: StayExpense }) {
  if (!expense.receipt) return null;
  return (
    <a
      href={expense.receipt.url}
      target="_blank"
      rel="noreferrer"
      className="text-accent underline"
    >
      Ảnh hoá đơn
    </a>
  );
}

function ExpenseActions({ expense, onEdit, onDelete }: RowActions & { expense: StayExpense }) {
  return (
    <div className="inline-flex gap-1">
      <IconButton icon="edit" label="Sửa chi phí" variant="ghost" onClick={() => onEdit(expense)} />
      <IconButton
        icon="delete"
        label="Xoá chi phí"
        variant="danger"
        onClick={() => onDelete(expense)}
      />
    </div>
  );
}

function expenseColumns({
  names,
  roomCode,
  ...actions
}: RowActions & {
  names: ReadonlyMap<string, string>;
  roomCode: (expense: StayExpense) => string;
}): ColumnDef<StayExpense, unknown>[] {
  return [
    {
      id: 'spentOn',
      header: 'Ngày chi',
      accessorFn: (row) => row.spentOn,
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{displayDate(row.original.spentOn)}</span>
      ),
    },
    {
      id: 'category',
      header: 'Danh mục',
      cell: ({ row }) => names.get(row.original.categoryId) ?? '—',
    },
    { id: 'room', header: 'Phòng', cell: ({ row }) => roomCode(row.original) },
    {
      id: 'note',
      header: 'Ghi chú',
      cell: ({ row }) => (
        <span className="grid max-w-80 gap-0.5">
          <span className="line-clamp-2 whitespace-pre-wrap break-words">
            {row.original.note || '—'}
          </span>
          <ReceiptLink expense={row.original} />
        </span>
      ),
    },
    {
      id: 'amount',
      header: 'Số tiền',
      meta: { align: 'right' },
      accessorFn: (row) => row.amount,
      cell: ({ row }) => (
        <span className="whitespace-nowrap font-semibold">{formatVnd(row.original.amount)}</span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Thao tác</span>,
      cell: ({ row }) => <ExpenseActions expense={row.original} {...actions} />,
    },
  ];
}
