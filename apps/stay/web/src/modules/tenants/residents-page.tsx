import {
  Button,
  type ColumnDef,
  DataTable,
  EmptyState,
  Input,
  Pagination,
  Switch,
  Tag,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useExportResidents, useResidents, useRevealTenantIdNumber } from '@stay/sdk/react';
import { downloadBlob, getErrorMessage } from '@stay/sdk/shared';
import { isIsoDate, maskIdNumber, type StayResident } from '@stay/shared';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCanOn } from '@/libraries/ability';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { displayDate, todayIsoDate } from '@/libraries/format';
import { LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { latestSearchParams } from '@/libraries/search-params';
import { RegistrationDialog } from './registration-dialog';

function ResidentId({ resident }: { resident: StayResident }) {
  const reveal = useRevealTenantIdNumber();
  const [full, setFull] = useState<string | null>(null);

  const show = async () => {
    try {
      setFull((await reveal.mutateAsync(resident.tenantId)).idNumber);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể hiện CCCD.'));
    }
  };

  return (
    <span className="flex flex-wrap items-center gap-1">
      <span className="font-mono">
        {full ?? (resident.idNumber ? maskIdNumber(resident.idNumber) : '—')}
      </span>
      {resident.idNumber ? (
        <Button
          size="sm"
          variant="ghost"
          aria-label={`${full ? 'Ẩn' : 'Hiện'} CCCD ${resident.fullName}`}
          loading={reveal.isPending}
          onClick={() => (full ? setFull(null) : void show())}
        >
          {full ? 'Ẩn' : 'Hiện'}
        </Button>
      ) : null}
    </span>
  );
}

function RegistrationStatus({ resident }: { resident: StayResident }) {
  return resident.registeredOn ? (
    <Tag tone="success">Đã khai báo · {displayDate(resident.registeredOn)}</Tag>
  ) : (
    <Tag tone="warning" data-testid="resident-unregistered">
      Mới · Chưa khai báo
    </Tag>
  );
}

/** O-34: registration belongs to the occupant stay visible on the selected date. */
export default function ResidentsPage() {
  const { buildingId, isLoading: buildingLoading } = useActiveBuilding();
  const [params, setParams] = useSearchParams();
  const canManage = useCanOn('manage', 'Tenant', { buildingId: buildingId ?? undefined });
  const [editing, setEditing] = useState<StayResident | null>(null);
  const exportFile = useExportResidents();

  const rawDate = params.get('date');
  const date = isIsoDate(rawDate) ? rawDate : todayIsoDate();
  const q = params.get('q') ?? '';
  const status = params.get('status') === 'unregistered' ? 'unregistered' : 'all';
  const rawPage = Number(params.get('page'));
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const [search, setSearch] = useState(q);
  const residents = useResidents(buildingId ?? '', {
    date,
    q: q || undefined,
    status,
    page,
    pageSize: 20,
  });

  const rows = residents.data?.data ?? [];
  const meta = residents.data?.meta;

  const update = (changes: Record<string, string | null>) =>
    setParams(
      () => {
        const next = latestSearchParams();

        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace: true },
    );

  useEffect(() => {
    if (isIsoDate(rawDate)) return;
    setParams(
      () => {
        const next = latestSearchParams();

        next.set('date', date);
        return next;
      },
      { replace: true },
    );
  }, [rawDate, date, setParams]);

  useEffect(() => setSearch(q), [q]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim() === q) return;
      setParams(
        () => {
          const next = latestSearchParams();

          if (search.trim()) next.set('q', search.trim());
          else next.delete('q');
          next.delete('page');
          return next;
        },
        { replace: true },
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [search, q, setParams]);

  const download = async () => {
    if (!buildingId) return;
    try {
      downloadBlob(await exportFile.mutateAsync({ buildingId, date }), `tam-tru-${date}.xlsx`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể xuất Excel.'));
    }
  };

  const action = (resident: StayResident) =>
    canManage && !resident.registeredOn ? (
      <Button size="sm" variant="secondary" onClick={() => setEditing(resident)}>
        Đánh dấu đã khai báo
      </Button>
    ) : null;
  const columns: ColumnDef<StayResident, unknown>[] = [
    {
      id: 'fullName',
      header: 'Họ tên',
      cell: ({ row }) => (
        <Link className="font-semibold text-accent" to={`/tenants/${row.original.tenantId}`}>
          {row.original.fullName}
        </Link>
      ),
    },
    {
      id: 'birthDate',
      header: 'Ngày sinh',
      cell: ({ row }) => (row.original.birthDate ? displayDate(row.original.birthDate) : '—'),
    },
    {
      id: 'idNumber',
      header: 'Số CCCD',
      cell: ({ row }) => <ResidentId resident={row.original} />,
    },
    {
      id: 'address',
      header: 'Quê quán/Địa chỉ thường trú',
      cell: ({ row }) => (
        <span className="break-words">
          {[row.original.hometown, row.original.permanentAddress].filter(Boolean).join(' / ') ||
            '—'}
        </span>
      ),
    },
    { id: 'roomCode', header: 'Phòng', cell: ({ row }) => row.original.roomCode },
    {
      id: 'arrivalDate',
      header: 'Ngày đến',
      cell: ({ row }) => displayDate(row.original.arrivalDate),
    },
    {
      id: 'registration',
      header: 'Đã khai báo',
      cell: ({ row }) => <RegistrationStatus resident={row.original} />,
    },
    { id: 'actions', header: 'Thao tác', cell: ({ row }) => action(row.original) },
  ];

  if (buildingLoading) return <LoadingRows />;

  return (
    <div className="grid min-w-0 gap-5" data-testid="residents-page">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-heading font-bold text-ink">Tạm trú</h1>
        <Button
          variant="secondary"
          disabled={!buildingId}
          loading={exportFile.isPending}
          onClick={() => void download()}
        >
          Xuất Excel
        </Button>
      </header>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <Input
          label="Ngày đang ở"
          type="date"
          value={date}
          onChange={(event) => update({ date: event.target.value || null, page: null })}
        />
        <Input
          type="search"
          aria-label="Tìm người tạm trú"
          placeholder="Tìm theo họ tên, phòng"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Switch
          label="Chỉ người chưa khai báo"
          checked={status === 'unregistered'}
          onCheckedChange={(checked) =>
            update({ status: checked ? 'unregistered' : null, page: null })
          }
        />
      </div>
      {residents.isError ? (
        <LoadError error={residents.error} onRetry={() => void residents.refetch()} />
      ) : residents.isPending ? (
        <LoadingRows />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="users"
          title="Không có người tạm trú phù hợp"
          description="Thử đổi ngày hoặc bộ lọc."
        />
      ) : (
        <>
          <div className="hidden min-w-0 overflow-x-auto lg:block">
            <DataTable
              caption="Danh sách tạm trú"
              mode="server"
              rows={rows}
              rowCount={meta?.total ?? 0}
              columns={columns}
              rowId={(row) => row.occupantId}
              paginationPlacement="none"
              state={{ sorting: [], pagination: { pageIndex: page - 1, pageSize: 20 } }}
              onStateChange={(next) => update({ page: String(next.pagination.pageIndex + 1) })}
            />
          </div>
          <ul className="grid min-w-0 gap-3 lg:hidden">
            {rows.map((resident) => (
              <li
                key={resident.occupantId}
                className="grid min-w-0 gap-3 rounded-panel border border-line bg-surface p-4"
              >
                <Link
                  to={`/tenants/${resident.tenantId}`}
                  className="break-words font-semibold text-accent"
                >
                  {resident.fullName}
                </Link>
                <dl className="grid min-w-0 gap-2 text-ui-sm">
                  <div>
                    <dt className="text-muted">Phòng · Ngày đến</dt>
                    <dd>
                      {resident.roomCode} · {displayDate(resident.arrivalDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Ngày sinh</dt>
                    <dd>{resident.birthDate ? displayDate(resident.birthDate) : '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Số CCCD</dt>
                    <dd>
                      <ResidentId resident={resident} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Quê quán/Địa chỉ thường trú</dt>
                    <dd className="break-words">
                      {[resident.hometown, resident.permanentAddress].filter(Boolean).join(' / ') ||
                        '—'}
                    </dd>
                  </div>
                </dl>
                <div>
                  <RegistrationStatus resident={resident} />
                </div>
                <div>{action(resident)}</div>
              </li>
            ))}
          </ul>
        </>
      )}
      {meta && meta.totalPages > 1 ? (
        <Pagination
          pageIndex={page - 1}
          pageCount={meta.totalPages}
          onPageChange={(index) => update({ page: String(index + 1) })}
          aria-label="Phân trang tạm trú"
        />
      ) : null}
      {editing ? (
        <RegistrationDialog
          key={editing.occupantId}
          resident={editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}
