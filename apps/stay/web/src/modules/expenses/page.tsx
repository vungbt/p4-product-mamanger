import { AlertDialog, Button, IconButton, Input, Select } from '@itclabs/react-ui';
import { useDeleteExpense, useExpenseCategories, useExpenses, useRooms } from '@stay/sdk/react';
import { getErrorMessage } from '@stay/sdk/shared';
import { isPeriod, type StayExpense } from '@stay/shared';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { displayDate, formatVnd, todayIsoDate } from '@/libraries/format';
import { FormError, LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { ScreenHeader } from '@/libraries/screen-header';
import { ExpenseForm } from './expense-form';

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

  const period = isPeriod(params.get('period'))
    ? (params.get('period') ?? '')
    : todayIsoDate().slice(0, 7);
  const page = Math.max(1, Number(params.get('page')) || 1);
  const categories = useExpenseCategories();
  const rooms = useRooms(buildingId ?? '', { pageSize: 100 });
  const expenses = useExpenses({
    buildingId: buildingId ?? undefined,
    period,
    page,
    pageSize: 20,
    sortOrder: 'desc',
    categoryId: params.get('categoryId') || undefined,
    roomId: params.get('roomId') || undefined,
    q: params.get('q') || undefined,
  });
  const remove = useDeleteExpense();

  const filter = (field: string, value: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);

        if (value) next.set(field, value);
        else next.delete(field);
        if (field !== 'page') next.delete('page');
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
          (current) => {
            const next = new URLSearchParams(current);

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

  const reload = () => {
    setEditing(null);
    void expenses.refetch();
    void categories.refetch();
  };

  return (
    <div className="grid min-w-0 gap-5">
      <ScreenHeader
        title="Chi phí vận hành"
        description="Theo dõi khoản chi theo kỳ và danh mục."
      />
      <div className="flex flex-wrap gap-3">
        <Button disabled={!buildingId} onClick={() => setEditing('new')}>
          Thêm chi phí
        </Button>
        <Link to="/settings/expense-categories" className="self-center text-accent underline">
          Quản lý danh mục
        </Link>
      </div>
      {!buildingId ? (
        <p>Chọn hoặc tạo toà nhà để ghi chi phí.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              aria-label="Kỳ"
              type="month"
              value={period}
              onChange={(event) => filter('period', event.target.value)}
            />
            <Select
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
              aria-label="Lọc phòng"
              placeholder="Tất cả phòng"
              clearable
              options={rooms.data?.data.map((room) => ({ value: room.id, label: room.code })) ?? []}
              value={params.get('roomId')}
              onValueChange={(value) => filter('roomId', value ?? '')}
            />
            <Input
              aria-label="Tìm chi phí"
              placeholder="Tìm ghi chú"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
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
          {expenses.isLoading ? (
            <LoadingRows />
          ) : expenses.isError ? (
            <LoadError error={expenses.error} onRetry={() => void expenses.refetch()} />
          ) : (
            <>
              <section
                aria-label="Tổng theo danh mục"
                className="grid gap-3 sm:grid-cols-3"
                data-testid="expense-totals"
              >
                <div className="rounded-panel border border-line bg-surface p-4">
                  <p>Tổng chi phí</p>
                  <strong>{formatVnd(total)}</strong>
                </div>
                {expenses.data?.meta.totalsByCategory.map((category) => (
                  <div
                    key={category.categoryId}
                    className="rounded-panel border border-line bg-surface p-4"
                  >
                    <p>{names.get(category.categoryId) ?? 'Danh mục'}</p>
                    <strong>{formatVnd(category.amount)}</strong>
                  </div>
                ))}
              </section>
              {!expenses.data?.data.length ? (
                <p className="p-4 text-muted">Chưa có chi phí trong kỳ này.</p>
              ) : (
                <ul className="grid gap-3" aria-label="Danh sách chi phí">
                  {expenses.data.data.map((expense) => (
                    <li
                      key={expense.id}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-panel border border-line bg-surface p-4"
                      data-testid="expense-row"
                    >
                      <div className="grid min-w-0 gap-1 break-words">
                        <strong>
                          {formatVnd(expense.amount)} · {names.get(expense.categoryId)}
                        </strong>
                        <p>
                          {displayDate(expense.spentOn)} ·{' '}
                          {rooms.data?.data.find((room) => room.id === expense.roomId)?.code ??
                            'Cả toà'}
                        </p>
                        <p className="whitespace-pre-wrap">{expense.note}</p>
                        {expense.receipt ? (
                          <a
                            href={expense.receipt.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-accent underline"
                          >
                            Ảnh hoá đơn
                          </a>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        <IconButton
                          icon="edit"
                          label="Sửa chi phí"
                          variant="ghost"
                          onClick={() => setEditing(expense)}
                        />
                        <IconButton
                          icon="delete"
                          label="Xoá chi phí"
                          variant="danger"
                          onClick={() => setDeleting(expense)}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  variant="secondary"
                  disabled={page <= 1 || expenses.isFetching}
                  onClick={() => filter('page', String(page - 1))}
                >
                  Trước
                </Button>
                <span>Trang {page}</span>
                <Button
                  variant="secondary"
                  disabled={page >= (expenses.data?.meta.totalPages ?? 1) || expenses.isFetching}
                  onClick={() => filter('page', String(page + 1))}
                >
                  Sau
                </Button>
              </div>
            </>
          )}
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
