import { AlertDialog, Button, EmptyState, IconButton, Select, Tag } from '@itclabs/react-ui';
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
import { displayDate } from '@/libraries/format';
import { LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { ScreenHeader } from '@/libraries/screen-header';
import { latestSearchParams } from '@/libraries/search-params';
import { AnnouncementDialog } from './announcement-form';

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<AnnouncementStatus, string> = {
  active: 'Đang hiển thị',
  expired: 'Đã hết hạn',
  all: 'Tất cả',
};

const dateOf = (iso: string) => displayDate(isoDateInTimeZone(new Date(iso)));

type Pending = { kind: 'archive' | 'delete'; announcement: StayAnnouncement };

/** O-32 Thông báo cho người thuê of the active building (whole building or rooms, pin, expiry). */
export default function AnnouncementsPage() {
  const { buildingId } = useActiveBuilding();
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<StayAnnouncement | 'new' | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const archive = useArchiveAnnouncement();
  const remove = useDeleteAnnouncement();

  const status = ANNOUNCEMENT_STATUSES.find((value) => value === params.get('status')) ?? 'active';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const query = useAnnouncements({
    buildingId: buildingId ?? undefined,
    status,
    page,
    pageSize: PAGE_SIZE,
  });

  const filter = (field: string, value: string | null) =>
    setParams(
      () => {
        const next = latestSearchParams();

        if (value) next.set(field, value);
        else next.delete(field);
        if (field !== 'page') next.delete('page');
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

  const rows = query.data?.data ?? [];
  const totalPages = Math.max(1, query.data?.meta.totalPages ?? 1);

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
          <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
            <div className="w-full sm:w-56">
              <Select
                label="Trạng thái"
                value={status}
                options={ANNOUNCEMENT_STATUSES.map((value) => ({
                  value,
                  label: STATUS_LABELS[value],
                }))}
                onValueChange={(value) => filter('status', value === 'active' ? null : value)}
              />
            </div>
            <Button onClick={() => setEditing('new')}>Tạo thông báo</Button>
          </div>
          {query.isPending ? (
            <LoadingRows />
          ) : query.isError ? (
            <LoadError error={query.error} onRetry={() => void query.refetch()} />
          ) : rows.length === 0 ? (
            <EmptyState
              title="Chưa có thông báo"
              description="Tạo thông báo cho cả toà hoặc một số phòng."
            />
          ) : (
            <>
              <ul className="grid gap-3" data-testid="announcement-list">
                {rows.map((row) => (
                  <li
                    key={row.id}
                    className="grid min-w-0 gap-2 rounded-panel border border-line bg-surface p-4 sm:grid-cols-[1fr_auto]"
                    data-testid={`announcement-${row.id}`}
                  >
                    <div className="grid min-w-0 gap-1">
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
                      <p className="line-clamp-3 whitespace-pre-wrap break-words text-ui-sm">
                        {row.body}
                      </p>
                      <p className="text-ui-sm text-muted break-words">
                        {row.roomIds?.length ? `Phòng ${row.roomCodes.join(', ')}` : 'Cả toà'} · Tạo{' '}
                        {dateOf(row.createdAt)}
                        {row.expiresAt ? ` · Hết hạn ${dateOf(row.expiresAt)}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <IconButton
                        icon="edit"
                        label={`Sửa thông báo ${row.title}`}
                        variant="ghost"
                        onClick={() => setEditing(row)}
                      />
                      {row.expired ? null : (
                        <IconButton
                          icon="archive"
                          label={`Lưu trữ thông báo ${row.title}`}
                          variant="ghost"
                          onClick={() => setPending({ kind: 'archive', announcement: row })}
                        />
                      )}
                      <IconButton
                        icon="delete"
                        label={`Xoá thông báo ${row.title}`}
                        variant="danger"
                        onClick={() => setPending({ kind: 'delete', announcement: row })}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  variant="secondary"
                  disabled={page <= 1 || query.isFetching}
                  onClick={() => filter('page', String(page - 1))}
                >
                  Trước
                </Button>
                <span>
                  Trang {page}/{totalPages}
                </span>
                <Button
                  variant="secondary"
                  disabled={page >= totalPages || query.isFetching}
                  onClick={() => filter('page', String(page + 1))}
                >
                  Sau
                </Button>
              </div>
            </>
          )}
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
