import {
  Button,
  Checkbox,
  type ColumnDef,
  DataTable,
  EmptyState,
  Input,
  Select,
  Skeleton,
} from '@itclabs/react-ui';
import { useContracts, useRooms } from '@stay/sdk/react';
import { CONTRACT_STATUSES, type StayContract } from '@stay/shared';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCanOn } from '@/libraries/ability';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { displayDate, formatVnd } from '@/libraries/format';
import { latestSearchParams } from '@/libraries/search-params';
import { CONTRACT_LABELS, LoadError } from './contract-ui';

export default function ContractListPage() {
  const { buildingId } = useActiveBuilding();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const canCreate = useCanOn('create', 'Contract', { buildingId: buildingId ?? undefined });
  const [search, setSearch] = useState(params.get('q') ?? '');
  const q = params.get('q') ?? '';
  const status = CONTRACT_STATUSES.find((s) => s === params.get('status'));
  const page = Math.max(1, Number(params.get('page')) || 1);
  const rooms = useRooms(buildingId ?? '', { pageSize: 100 });
  const query = useContracts({
    buildingId: buildingId ?? undefined,
    page,
    pageSize: 20,
    q: q || undefined,
    status,
    roomId: params.get('roomId') || undefined,
    expiring: params.get('expiring') === 'true' ? 'true' : undefined,
  });

  const filter = (key: string, value: string | null) =>
    setParams(
      () => {
        const next = latestSearchParams();

        if (value) next.set(key, value);
        else next.delete(key);
        next.delete('page');
        return next;
      },
      { replace: true },
    );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim() !== q)
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

  const columns: ColumnDef<StayContract, unknown>[] = [
    {
      id: 'code',
      header: 'Mã HĐ',
      cell: ({ row }) => (
        <Link className="text-accent font-semibold" to={`/contracts/${row.original.id}`}>
          {row.original.code}
        </Link>
      ),
    },
    { accessorKey: 'roomCode', header: 'Phòng' },
    { accessorKey: 'primaryTenantName', header: 'Người đại diện' },
    {
      id: 'startDate',
      header: 'Ngày bắt đầu',
      cell: ({ row }) => displayDate(row.original.startDate),
    },
    {
      id: 'endDate',
      header: 'Ngày kết thúc',
      cell: ({ row }) => (row.original.endDate ? displayDate(row.original.endDate) : '—'),
    },
    { id: 'rent', header: 'Giá thuê', cell: ({ row }) => formatVnd(row.original.rent) },
    {
      id: 'deposit',
      header: 'Cọc đang giữ',
      cell: ({ row }) => formatVnd(row.original.depositHeld),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: ({ row }) =>
        row.original.status === 'ending' && row.original.noticeDate
          ? `${CONTRACT_LABELS.ending} · trả ${displayDate(row.original.noticeDate)}`
          : CONTRACT_LABELS[row.original.status],
    },
  ];

  return (
    <div className="grid min-w-0 gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-heading font-bold">Hợp đồng</h1>
        {canCreate && <Button onClick={() => navigate('/contracts/new')}>Tạo hợp đồng</Button>}
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input label="Tìm hợp đồng" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select
          label="Trạng thái"
          value={status ?? ''}
          options={[
            { value: '', label: 'Tất cả' },
            ...CONTRACT_STATUSES.map((s) => ({ value: s, label: CONTRACT_LABELS[s] })),
          ]}
          onValueChange={(v) => filter('status', v)}
        />
        <Select
          label="Phòng"
          value={params.get('roomId') ?? ''}
          options={[
            { value: '', label: 'Tất cả' },
            ...(rooms.data?.data ?? []).map((r) => ({ value: r.id, label: r.code })),
          ]}
          onValueChange={(v) => filter('roomId', v)}
        />
        <Checkbox
          label="Sắp hết hạn ≤ 30 ngày"
          checked={params.get('expiring') === 'true'}
          onCheckedChange={(v) => filter('expiring', v === true ? 'true' : null)}
        />
      </div>
      {!buildingId || query.isPending ? (
        <Skeleton className="h-48" />
      ) : query.isError ? (
        <LoadError error={query.error} retry={() => void query.refetch()} />
      ) : !query.data?.data.length ? (
        <EmptyState
          title="Chưa có hợp đồng"
          description="Tạo hợp đồng cho một phòng trống hoặc đổi bộ lọc."
        />
      ) : (
        <>
          <div className="min-w-0 overflow-x-auto">
            <DataTable<StayContract>
              caption="Hợp đồng"
              state={{ sorting: [], pagination: { pageIndex: page - 1, pageSize: 20 } }}
              onStateChange={(next) =>
                setParams((p) => {
                  p.set('page', String(next.pagination.pageIndex + 1));
                  return p;
                })
              }
              columns={columns}
              rows={query.data.data}
              mode="server"
              rowCount={query.data.meta.total}
              rowId={(row) => row.id}
              paginationPlacement="none"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() =>
                setParams((p) => {
                  p.set('page', String(page - 1));
                  return p;
                })
              }
            >
              Trước
            </Button>
            <span>
              Trang {page} · {query.data.meta.total} hợp đồng
            </span>
            <Button
              variant="secondary"
              disabled={page * 20 >= query.data.meta.total}
              onClick={() =>
                setParams((p) => {
                  p.set('page', String(page + 1));
                  return p;
                })
              }
            >
              Sau
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
