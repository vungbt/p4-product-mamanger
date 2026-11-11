import { Button, EmptyState, Input, Select } from '@itclabs/react-ui';
import { useRequestInbox } from '@stay/sdk/react';
import { INBOX_KINDS, INBOX_STATUSES, type InboxItem } from '@stay/shared';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { ScreenHeader } from '@/libraries/screen-header';
import { latestSearchParams } from '@/libraries/search-params';
import { RequestDetailDialog } from './request-detail';
import { RequestList } from './request-list';
import { INBOX_STATUS_LABELS, KIND_LABELS } from './request-ui';

const PAGE_SIZE = 20;
const ALL = 'all';

const KIND_OPTIONS = [
  { value: ALL, label: 'Tất cả' },
  ...INBOX_KINDS.map((kind) => ({ value: kind, label: KIND_LABELS[kind] })),
];

/** O-26 Yêu cầu từ người thuê: báo hỏng, yêu cầu và báo chuyển khoản of the active building. */
export default function RequestsPage() {
  const { buildingId } = useActiveBuilding();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [selected, setSelected] = useState<InboxItem | null>(null);

  const q = params.get('q') ?? '';
  const kind = INBOX_KINDS.find((value) => value === params.get('kind'));
  const statusParam = params.get('status');
  // Default chip: "Mới"; `status=all` shows every status.
  const status =
    statusParam === ALL
      ? undefined
      : (INBOX_STATUSES.find((value) => value === statusParam) ?? 'pending');
  const page = Math.max(1, Number(params.get('page')) || 1);

  const query = useRequestInbox(
    {
      buildingId: buildingId ?? undefined,
      kind,
      status,
      q: q || undefined,
      page,
      pageSize: PAGE_SIZE,
    },
    { enabled: Boolean(buildingId) },
  );

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

  useEffect(() => {
    if (search.trim() === q) return;
    const timer = setTimeout(
      () =>
        setParams(
          () => {
            const next = latestSearchParams();

            if (search.trim()) next.set('q', search.trim());
            else next.delete('q');
            next.delete('page');
            return next;
          },
          { replace: true },
        ),
      300,
    );

    return () => clearTimeout(timer);
  }, [search, q, setParams]);

  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const counts = meta?.counts ?? [];
  const countOf = (value: string) => counts.find((row) => row.status === value)?.count ?? 0;
  const allCount = counts.reduce((sum, row) => sum + row.count, 0);
  const totalPages = Math.max(1, meta?.totalPages ?? 1);
  const filtered = Boolean(q || kind);

  return (
    <div className="grid min-w-0 gap-5">
      <ScreenHeader
        title="Yêu cầu từ người thuê"
        description="Báo hỏng, yêu cầu thay đổi hợp đồng và báo chuyển khoản gửi từ cổng người thuê."
      />
      {!buildingId ? (
        <p>Chọn toà nhà để xem yêu cầu.</p>
      ) : (
        <>
          <fieldset className="m-0 flex min-w-0 flex-wrap gap-2 border-0 p-0">
            <legend className="sr-only">Trạng thái</legend>
            {INBOX_STATUSES.map((value) => (
              <Button
                key={value}
                size="sm"
                variant={status === value ? 'primary' : 'secondary'}
                aria-pressed={status === value}
                data-testid={`status-${value}`}
                onClick={() => filter('status', value === 'pending' ? null : value)}
              >
                {INBOX_STATUS_LABELS[value]} {countOf(value)}
              </Button>
            ))}
            <Button
              size="sm"
              variant={status ? 'secondary' : 'primary'}
              aria-pressed={!status}
              data-testid="status-all"
              onClick={() => filter('status', ALL)}
            >
              Tất cả {allCount}
            </Button>
          </fieldset>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <Input
              label="Tìm kiếm"
              type="search"
              placeholder="Phòng, hợp đồng, người gửi, tiêu đề, mã hoá đơn"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select
              label="Loại"
              value={kind ?? ALL}
              options={KIND_OPTIONS}
              onValueChange={(value) => filter('kind', value === ALL ? null : value)}
            />
          </div>

          {query.isPending ? (
            <LoadingRows />
          ) : query.isError ? (
            <LoadError error={query.error} onRetry={() => void query.refetch()} />
          ) : !rows.length ? (
            <EmptyState
              title={filtered ? 'Không có yêu cầu phù hợp' : 'Không có yêu cầu'}
              description={
                filtered
                  ? 'Đổi loại, trạng thái hoặc từ khoá tìm kiếm.'
                  : 'Người thuê chưa gửi yêu cầu nào ở trạng thái này.'
              }
              variant={filtered ? 'no-results' : 'empty'}
            />
          ) : (
            <>
              <RequestList items={rows} onOpen={setSelected} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  variant="secondary"
                  disabled={page <= 1 || query.isFetching}
                  onClick={() => filter('page', String(page - 1))}
                >
                  Trước
                </Button>
                <span>
                  Trang {page}/{totalPages} · {meta?.total ?? 0} mục
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
      {selected ? <RequestDetailDialog item={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
