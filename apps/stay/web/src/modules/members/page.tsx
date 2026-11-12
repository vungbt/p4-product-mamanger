import {
  AlertDialog,
  Button,
  type ColumnDef,
  EmptyState,
  Icon,
  IconButton,
  Input,
  useDataTable,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useMemberMutations, useMembers } from '@stay/sdk/react';
import { getErrorMessage } from '@stay/sdk/shared';
import { MANAGER_PERMISSION_LABELS, type StayMember } from '@stay/shared';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FilterBar } from '@/libraries/filter-bar';
import { ListTable } from '@/libraries/list-table';
import { ScreenHeader } from '@/libraries/screen-header';
import { latestSearchParams } from '@/libraries/search-params';
import { PAGE_SIZE_OPTIONS, useTableParams } from '@/libraries/table-params';
import { MemberDialog } from './member-form';

const SORT_FIELDS = ['email', 'displayName'] as const;

export default function MembersPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const [searchText, setSearchText] = useState(q);
  const [editing, setEditing] = useState<StayMember | 'new' | null>(null);
  const [pending, setPending] = useState<StayMember | null>(null);
  const { disable } = useMemberMutations();
  const table = useTableParams({
    sortFields: SORT_FIELDS,
    defaultSort: { sortBy: 'email', sortOrder: 'asc' },
  });
  const query = useMembers({
    page: table.page,
    pageSize: table.pageSize,
    sortBy: table.sortBy,
    sortOrder: table.sortOrder,
    q: params.get('q') ?? undefined,
  });

  const columns: ColumnDef<StayMember, unknown>[] = [
    { id: 'email', header: 'Email', accessorKey: 'email' },
    {
      id: 'buildings',
      header: 'Toà được gán',
      cell: ({ row }) => row.original.buildingNames.join(', '),
    },
    {
      id: 'permissions',
      header: 'Nhóm quyền',
      cell: ({ row }) =>
        row.original.permissionGroups
          .map((group) => MANAGER_PERMISSION_LABELS[group])
          .join(' · ') || 'Chỉ xem',
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => (row.original.accountStatus === 'active' ? 'Đang hoạt động' : 'Đã khoá'),
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <IconButton
            icon="edit"
            label={`Sửa ${row.original.email}`}
            variant="ghost"
            onClick={() => setEditing(row.original)}
          />
          {row.original.accountStatus === 'active' ? (
            <IconButton
              icon="delete"
              label={`Khoá ${row.original.email}`}
              variant="danger"
              onClick={() => setPending(row.original)}
            />
          ) : null}
        </div>
      ),
    },
  ];
  const controller = useDataTable<StayMember>({
    caption: 'Người quản lý theo toà',
    mode: 'server',
    rows: query.data?.data ?? [],
    rowCount: query.data?.meta.total ?? 0,
    columns,
    rowId: (row) => row.id,
    state: table.state,
    onStateChange: table.onStateChange,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    loading: query.isPending,
    error: query.isError ? getErrorMessage(query.error, 'Không tải được thành viên.') : undefined,
    onRetry: () => void query.refetch(),
    emptyState: (
      <EmptyState
        title="Chưa có người quản lý"
        description="Mời người quản lý và gán toà được phép thao tác."
      />
    ),
  });

  useEffect(() => {
    setSearchText(q);
  }, [q]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const value = searchText.trim();

      if (value === q) return;
      setParams(
        () => {
          const next = latestSearchParams();

          if (value) next.set('q', value);
          else next.delete('q');
          next.delete('page');
          return next;
        },
        { replace: true },
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText, q, setParams]);

  const confirm = async () => {
    if (!pending || disable.isPending) return;
    try {
      await disable.mutateAsync(pending.id);
      setPending(null);
      toast.success('Đã khoá tài khoản và thu hồi phiên.');
    } catch (cause) {
      toast.error(getErrorMessage(cause, 'Không khoá được tài khoản.'));
    }
  };

  return (
    <div className="grid min-w-0 gap-5">
      <ScreenHeader
        title="Thành viên"
        description="Người quản lý chỉ xem và thao tác trên các toà được gán."
      />
      <FilterBar
        actions={
          <Button onClick={() => setEditing('new')}>
            <Icon name="plus" className="size-4" aria-hidden />
            Mời người quản lý
          </Button>
        }
      >
        <Input
          label="Tìm email"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
      </FilterBar>
      <ListTable
        controller={controller}
        refreshing={query.isFetching && !query.isPending}
        cards={(rows) => (
          <ul className="grid gap-3">
            {rows.map((row) => (
              <li
                key={row.id}
                className="grid gap-2 rounded-panel border border-line bg-surface p-4"
              >
                <p className="font-semibold break-words">{row.email}</p>
                <p>{row.buildingNames.join(', ')}</p>
                <p>
                  {row.permissionGroups
                    .map((group) => MANAGER_PERMISSION_LABELS[group])
                    .join(' · ') || 'Chỉ xem'}
                </p>
                <p>{row.accountStatus === 'active' ? 'Đang hoạt động' : 'Đã khoá'}</p>
                <div className="flex gap-1">
                  <IconButton
                    icon="edit"
                    label={`Sửa ${row.email}`}
                    variant="ghost"
                    onClick={() => setEditing(row)}
                  />
                  {row.accountStatus === 'active' ? (
                    <IconButton
                      icon="delete"
                      label={`Khoá ${row.email}`}
                      variant="danger"
                      onClick={() => setPending(row)}
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      />
      {editing ? (
        <MemberDialog
          member={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
      <AlertDialog
        open={Boolean(pending)}
        onOpenChange={(open) => {
          if (!open && !disable.isPending) setPending(null);
        }}
        title="Khoá người quản lý?"
        description={`Thu hồi mọi phiên của ${pending?.email ?? ''}. Người này không thể đăng nhập hoặc truy cập dữ liệu.`}
        confirmLabel="Khoá tài khoản"
        cancelLabel="Huỷ"
        confirmVariant="danger"
        closeOnConfirm={false}
        onConfirm={() => void confirm()}
      />
    </div>
  );
}
