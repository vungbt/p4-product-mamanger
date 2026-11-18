import {
  AlertDialog,
  Button,
  type ColumnDef,
  EmptyState,
  Icon,
  IconButton,
  Select,
  Tag,
  useDataTable,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useAnnouncements, useArchiveAnnouncement, useDeleteAnnouncement } from '@stay/sdk/react';
import { getErrorMessage } from '@stay/sdk/shared';
import {
  ANNOUNCEMENT_STATUSES,
  type AnnouncementStatus,
  isoDateInTimeZone,
  type StayAnnouncement,
} from '@stay/shared';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { FilterBar } from '@/libraries/filter-bar';
import { displayDate } from '@/libraries/format';
import { ListTable, rowTestId } from '@/libraries/list-table';
import { ScreenHeader } from '@/libraries/screen-header';
import { latestSearchParams } from '@/libraries/search-params';
import { PAGE_SIZE_OPTIONS, useTableParams } from '@/libraries/table-params';
import { AnnouncementDialog } from './announcement-form';

const TABLE_ID = 'announcement-list';
const SORT_FIELDS = ['createdAt', 'expiresAt'] as const;

const STATUS_LABELS: Record<AnnouncementStatus, string> = {
  active: 'Đang hiển thị',
  expired: 'Đã hết hạn',
  all: 'Tất cả',
};

const dateOf = (iso: string) => displayDate(isoDateInTimeZone(new Date(iso)));

type Pending = { kind: 'archive' | 'delete'; announcement: StayAnnouncement };

type RowActions = {
  onEdit: (announcement: StayAnnouncement) => void;
  onPending: (pending: Pending) => void;
};

/** O-32 Thông báo cho người thuê of the active building (whole building or rooms, pin, expiry). */
export default function AnnouncementsPage() {
  const { buildingId } = useActiveBuilding();
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<StayAnnouncement | 'new' | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const archive = useArchiveAnnouncement();
  const remove = useDeleteAnnouncement();
  const table = useTableParams({
    sortFields: SORT_FIELDS,
    defaultSort: { sortBy: 'createdAt', sortOrder: 'desc' },
  });

  const status = ANNOUNCEMENT_STATUSES.find((value) => value === params.get('status')) ?? 'active';
  const query = useAnnouncements({
    buildingId: buildingId ?? undefined,
    status,
    page: table.page,
    pageSize: table.pageSize,
    sortBy: table.sortBy,
    sortOrder: table.sortOrder,
  });

  const filter = (field: string, value: string | null) =>
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

  const confirm = async () => {
    if (!pending || archive.isPending || remove.isPending) return;
    try {
      if (pending.kind === 'archive') {
        await archive.mutateAsync(pending.announcement.id);
        toast.success('Đã lưu trữ thông báo.');
      } else {
        await remove.mutateAsync(pending.announcement.id);
        toast.success('Đã xoá thông báo.');
      }
    } catch (cause) {
      toast.error(getErrorMessage(cause, 'Không thực hiện được. Vui lòng thử lại.'));
    }
    setPending(null);
  };

  const actions: RowActions = { onEdit: setEditing, onPending: setPending };

  const controller = useDataTable<StayAnnouncement>({
    caption: 'Thông báo cho người thuê',
    mode: 'server',
    rows: query.data?.data ?? [],
    rowCount: query.data?.meta.total ?? 0,
    // Keep the page height only once rows exist (not the first load's skeleton).
    preservePageHeight: (query.data?.meta.total ?? 0) > 0,
    columns: announcementColumns(actions),
    rowId: (row) => row.id,
    state: table.state,
    onStateChange: table.onStateChange,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    loading: query.isPending,
    error: query.isError ? getErrorMessage(query.error, 'Không tải được thông báo.') : undefined,
    onRetry: () => void query.refetch(),
    emptyState: (
      <EmptyState
        size="compact"
        title="Chưa có thông báo"
        description="Tạo thông báo cho cả toà hoặc một số phòng."
      />
    ),
    'data-testid': TABLE_ID,
  });

  return (
    <div className="grid min-w-0 gap-5">
      <ScreenHeader
        title="Thông báo cho người thuê"
        description="Người thuê thấy thông báo còn hạn của cả toà hoặc phòng mình trên cổng người thuê."
      />
      {!buildingId ? (
        <p>Chọn toà nhà để xem thông báo.</p>
      ) : (
        <>
          <FilterBar
            actions={
              <Button onClick={() => setEditing('new')}>
                <Icon name="plus" className="size-4" aria-hidden />
                Tạo thông báo
              </Button>
            }
          >
            <Select
              label="Trạng thái"
              value={status}
              options={ANNOUNCEMENT_STATUSES.map((value) => ({
                value,
                label: STATUS_LABELS[value],
              }))}
              onValueChange={(value) => filter('status', value === 'active' ? null : value)}
            />
          </FilterBar>
          <ListTable
            controller={controller}
            refreshing={query.isFetching && !query.isPending}
            cards={(items) => (
              <ul className="grid gap-3">
                {items.map((row) => (
                  <li
                    key={row.id}
                    className="grid min-w-0 gap-2 rounded-panel border border-line bg-surface p-4 sm:grid-cols-[1fr_auto]"
                    data-testid={rowTestId(TABLE_ID, row.id)}
                  >
                    <div className="grid min-w-0 gap-1">
                      <Title row={row} />
                      <p className="line-clamp-3 whitespace-pre-wrap break-words text-ui-sm">
                        {row.body}
                      </p>
                      <p className="text-ui-sm text-muted break-words">
                        {audience(row)} · Tạo {dateOf(row.createdAt)}
                        {row.expiresAt ? ` · Hết hạn ${dateOf(row.expiresAt)}` : ''}
                      </p>
                    </div>
                    <Actions row={row} {...actions} />
                  </li>
                ))}
              </ul>
            )}
          />
        </>
      )}
      {editing && buildingId ? (
        <AnnouncementDialog
          buildingId={buildingId}
          announcement={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
      <AlertDialog
        open={Boolean(pending)}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title={pending?.kind === 'delete' ? 'Xoá thông báo?' : 'Lưu trữ thông báo?'}
        description={
          pending?.kind === 'delete'
            ? 'Thông báo bị xoá hẳn và không khôi phục được.'
            : 'Người thuê không còn thấy thông báo này.'
        }
        confirmLabel={pending?.kind === 'delete' ? 'Xoá' : 'Lưu trữ'}
        cancelLabel="Huỷ"
        confirmVariant="danger"
        closeOnConfirm={false}
        onConfirm={() => void confirm()}
      />
    </div>
  );
}

const audience = (row: StayAnnouncement) =>
  row.roomIds?.length ? `Phòng ${row.roomCodes.join(', ')}` : 'Cả toà';

function Title({ row }: { row: StayAnnouncement }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="min-w-0 font-semibold break-words">{row.title}</p>
      {row.pinned ? (
        <Tag tone="info" size="sm">
          Ghim
        </Tag>
      ) : null}
      {row.expired ? (
        <Tag tone="neutral" size="sm">
          Đã hết hạn
        </Tag>
      ) : null}
    </div>
  );
}

/** Sửa · Lưu trữ · Xoá, inline (at most three actions per row). */
function Actions({ row, onEdit, onPending }: RowActions & { row: StayAnnouncement }) {
  return (
    <div className="inline-flex gap-1">
      <IconButton
        icon="edit"
        label={`Sửa thông báo ${row.title}`}
        variant="ghost"
        onClick={() => onEdit(row)}
      />
      {row.expired ? null : (
        <IconButton
          icon="archive"
          label={`Lưu trữ thông báo ${row.title}`}
          variant="ghost"
          onClick={() => onPending({ kind: 'archive', announcement: row })}
        />
      )}
      <IconButton
        icon="delete"
        label={`Xoá thông báo ${row.title}`}
        variant="danger"
        onClick={() => onPending({ kind: 'delete', announcement: row })}
      />
    </div>
  );
}

function announcementColumns(actions: RowActions): ColumnDef<StayAnnouncement, unknown>[] {
  return [
    {
      id: 'title',
      header: 'Thông báo',
      cell: ({ row }) => (
        <div className="grid max-w-md gap-1">
          <Title row={row.original} />
          <p className="line-clamp-2 whitespace-pre-wrap break-words text-ui-sm text-muted">
            {row.original.body}
          </p>
        </div>
      ),
    },
    { id: 'audience', header: 'Gửi tới', cell: ({ row }) => audience(row.original) },
    {
      id: 'createdAt',
      header: 'Ngày tạo',
      accessorFn: (row) => row.createdAt,
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{dateOf(row.original.createdAt)}</span>
      ),
    },
    {
      id: 'expiresAt',
      header: 'Hết hạn',
      accessorFn: (row) => row.expiresAt ?? '',
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {row.original.expiresAt ? dateOf(row.original.expiresAt) : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Thao tác</span>,
      cell: ({ row }) => <Actions row={row.original} {...actions} />,
    },
  ];
}
