import { Button, Select, Skeleton } from '@itclabs/react-ui';
import { useDeposits } from '@stay/sdk/react';
import { CONTRACT_STATUSES } from '@stay/shared';
import { Link, useSearchParams } from 'react-router-dom';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { FilterBar } from '@/libraries/filter-bar';
import { formatVnd } from '@/libraries/format';
import { ScreenHeader } from '@/libraries/screen-header';
import { latestSearchParams } from '@/libraries/search-params';
import { CONTRACT_LABELS, LoadError } from '@/modules/contracts/contract-ui';
import { DepositActions } from './actions';

export default function DepositsPage() {
  const { buildingId } = useActiveBuilding();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const status = CONTRACT_STATUSES.find((value) => value === params.get('status'));
  const query = useDeposits({
    buildingId: buildingId ?? undefined,
    status,
    page,
    pageSize: 20,
    sortBy: 'code',
    sortOrder: 'asc',
  });

  const changePage = (next: number) =>
    setParams(
      () => {
        const result = latestSearchParams();
        result.set('page', String(next));
        return result;
      },
      { replace: true },
    );

  return (
    <div className="grid min-w-0 gap-5">
      <ScreenHeader
        title="Sổ cọc"
        description="Theo dõi tiền cọc theo hợp đồng. Sửa sai bằng bút toán mới."
      />
      <FilterBar>
        <Select
          label="Trạng thái"
          aria-label="Trạng thái hợp đồng"
          placeholder="Tất cả trạng thái"
          clearable
          options={CONTRACT_STATUSES.map((value) => ({ value, label: CONTRACT_LABELS[value] }))}
          value={status ?? null}
          onValueChange={(value) => setParams(value ? { status: value } : {}, { replace: true })}
        />
      </FilterBar>
      {query.isPending ? (
        <Skeleton className="h-64" />
      ) : query.isError ? (
        <LoadError error={query.error} retry={() => void query.refetch()} />
      ) : (
        <>
          <section
            className="grid gap-0.5 rounded-panel border border-line bg-surface p-3 sm:max-w-sm"
            aria-label="Tổng cọc đang giữ"
            data-testid="deposit-total"
          >
            <p className="text-ui-sm text-muted">
              Tổng cọc đang giữ {buildingId ? 'của toà' : 'tất cả toà'} (theo bộ lọc)
            </p>
            <strong className="text-ink">{formatVnd(query.data.meta.totalHeld)}</strong>
          </section>
          {!query.data.data.length ? (
            <p>Chưa có hợp đồng phù hợp.</p>
          ) : (
            <div className="relative overflow-x-auto rounded-panel border border-line bg-surface">
              <table className="w-full text-left" aria-label="Sổ cọc">
                <thead>
                  <tr>
                    {[
                      'Hợp đồng',
                      'Phòng',
                      'Người đại diện',
                      'Trạng thái',
                      'Đã thu',
                      'Đang giữ',
                      'Thao tác',
                    ].map((label) => (
                      <th className="whitespace-nowrap p-3" key={label}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {query.data.data.map((row) => (
                    <tr
                      className="border-t border-line"
                      key={row.contractId}
                      data-testid="deposit-row"
                    >
                      <td className="whitespace-nowrap p-3">
                        <Link
                          className="text-accent underline"
                          to={`/contracts/${row.contractId}?tab=Cọc`}
                        >
                          {row.code}
                        </Link>
                      </td>
                      <td className="p-3">{row.roomCode}</td>
                      <td className="p-3">{row.primaryTenantName ?? '—'}</td>
                      <td className="p-3">{CONTRACT_LABELS[row.status]}</td>
                      <td className="whitespace-nowrap p-3">{formatVnd(row.received)}</td>
                      <td className="whitespace-nowrap p-3" data-testid="deposit-held">
                        {formatVnd(row.held)}
                      </td>
                      <td className="p-3">
                        <DepositActions
                          contractId={row.contractId}
                          buildingId={row.buildingId}
                          status={row.status}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="secondary"
              disabled={page <= 1 || query.isFetching}
              onClick={() => changePage(page - 1)}
            >
              Trước
            </Button>
            <span>Trang {page}</span>
            <Button
              variant="secondary"
              disabled={page >= query.data.meta.totalPages || query.isFetching}
              onClick={() => changePage(page + 1)}
            >
              Sau
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
