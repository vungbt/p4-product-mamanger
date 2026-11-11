import {
  Button,
  Input,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@itclabs/react-ui';
import { useRevenueReport, useRoomsReport, useUtilitiesReport } from '@stay/sdk/react';
import { isPeriod, type RevenueReport, type RoomsReport, type UtilitiesReport } from '@stay/shared';
import { lazy, type ReactNode, Suspense, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { formatVnd, todayIsoDate } from '@/libraries/format';
import { LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { latestSearchParams } from '@/libraries/search-params';
import { displayPeriod } from '@/modules/invoices/invoice-ui';
import { ExportDialog } from './export-dialog';

const PeriodChart = lazy(() => import('../overview/period-chart'));

export default function ReportsPage() {
  const { building, buildingId } = useActiveBuilding();
  const [params, setParams] = useSearchParams();
  const [exportOpen, setExportOpen] = useState(false);

  const now = todayIsoDate().slice(0, 7);
  const rawFrom = params.get('from');
  const rawTo = params.get('to');
  const from = isPeriod(rawFrom) ? rawFrom : `${now.slice(0, 4)}-01`;
  const to = isPeriod(rawTo) ? rawTo : now;
  const rawTab = params.get('tab');
  const tab = rawTab === 'rooms' || rawTab === 'utilities' ? rawTab : 'revenue';
  const range = { buildingId: buildingId ?? '', from, to };
  const year = Number(from.slice(0, 4));

  const update = (key: string, value: string) => {
    setParams(
      () => {
        const next = latestSearchParams();

        next.set('from', from);
        next.set('to', to);
        next.set(key, value);
        return next;
      },
      { replace: true },
    );
  };

  return (
    <div className="grid min-w-0 max-w-full gap-5">
      <header className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-heading font-bold">Báo cáo</h1>
          <p className="text-muted">{building?.name ?? 'Chọn toà nhà'}</p>
        </div>
        <Button disabled={!buildingId} onClick={() => setExportOpen(true)}>
          Xuất Excel
        </Button>
      </header>
      <div className="grid min-w-0 grid-cols-2 gap-3 sm:max-w-md">
        <Input
          type="month"
          label="Từ tháng"
          value={from}
          onChange={(e) => {
            if (isPeriod(e.target.value)) update('from', e.target.value);
          }}
        />
        <Input
          type="month"
          label="Đến tháng"
          value={to}
          onChange={(e) => {
            if (isPeriod(e.target.value)) update('to', e.target.value);
          }}
        />
      </div>
      <p className="text-ui-sm text-muted">
        Đã thu tính theo ngày thu; phải thu tính theo kỳ hoá đơn. Khoảng tối đa 24 tháng.
      </p>
      {!buildingId ? (
        <p>Chọn toà nhà để xem báo cáo.</p>
      ) : (
        <Tabs
          value={tab}
          onValueChange={(value) => update('tab', value)}
          className="min-w-0"
          label="Loại báo cáo"
        >
          <div className="min-w-0 max-w-full overflow-x-auto">
            <TabsList className="w-max">
              <TabsTrigger value="revenue">Doanh thu – Chi phí – Lãi/lỗ</TabsTrigger>
              <TabsTrigger value="rooms">Theo phòng</TabsTrigger>
              <TabsTrigger value="utilities">Điện nước</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="revenue">
            <Revenue range={range} />
          </TabsContent>
          <TabsContent value="rooms">
            <Rooms buildingId={buildingId} year={year} />
          </TabsContent>
          <TabsContent value="utilities">
            <Utilities range={range} />
          </TabsContent>
        </Tabs>
      )}
      {exportOpen && buildingId ? (
        <ExportDialog range={range} onClose={() => setExportOpen(false)} />
      ) : null}
    </div>
  );
}

function ScrollTable({ children, label }: { children: ReactNode; label: string }) {
  return (
    <section
      className="min-w-0 max-w-full overflow-x-auto rounded-panel border border-line bg-surface"
      aria-label={label}
    >
      <table className="w-full whitespace-nowrap text-left text-ui-sm [&_th]:p-3 [&_td]:p-3 [&_tr]:border-b [&_tr]:border-line">
        {children}
      </table>
    </section>
  );
}

function Revenue({ range }: { range: { buildingId: string; from: string; to: string } }) {
  const query = useRevenueReport(range);

  if (query.isPending) return <LoadingRows rows={4} />;
  if (query.isError) return <LoadError error={query.error} onRetry={() => void query.refetch()} />;

  return <RevenueContent data={query.data} />;
}

function RevenueContent({ data }: { data: RevenueReport }) {
  const series = [
    { id: 'billed', label: 'Phải thu theo kỳ hoá đơn' },
    { id: 'collected', label: 'Đã thu theo ngày thu' },
    { id: 'expenses', label: 'Chi phí' },
    { id: 'profit', label: 'Lãi/lỗ' },
  ];
  const empty = data.months.every((m) => m.billed === 0 && m.collected === 0 && m.expenses === 0);

  return (
    <section
      className="grid min-w-0 gap-4"
      data-testid="revenue-report"
      data-from={data.from}
      data-to={data.to}
    >
      {empty ? <p>Chưa có hoá đơn, khoản thu hoặc chi phí trong khoảng này.</p> : null}
      <div className="min-w-0 rounded-panel border border-line bg-surface p-3">
        <Suspense fallback={<Skeleton className="h-64" />}>
          <PeriodChart
            data-testid="reports-chart"
            type="bar"
            label="Doanh thu, chi phí và lãi/lỗ theo tháng"
            description="Phải thu theo kỳ hoá đơn; đã thu theo ngày thu thực tế."
            data={
              empty
                ? []
                : data.months.map((m) => ({
                    id: m.period,
                    label: displayPeriod(m.period),
                    values: {
                      billed: m.billed,
                      collected: m.collected,
                      expenses: m.expenses,
                      profit: m.profit,
                    },
                  }))
            }
            series={series}
            valueFormatter={formatVnd}
            emptyMessage="Chưa có dữ liệu."
          />
        </Suspense>
      </div>
      <ScrollTable label="Doanh thu theo tháng">
        <thead>
          <tr>
            <th scope="col">Tháng</th>
            {series.map((s) => (
              <th scope="col" key={s.id}>
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.months.map((m) => (
            <tr key={m.period}>
              <th scope="row">{displayPeriod(m.period)}</th>
              <td>{formatVnd(m.billed)}</td>
              <td>{formatVnd(m.collected)}</td>
              <td>{formatVnd(m.expenses)}</td>
              <td>{formatVnd(m.profit)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr data-testid="revenue-totals" className="font-bold">
            <th scope="row">Tổng</th>
            <td data-testid="total-billed">{formatVnd(data.totals.billed)}</td>
            <td data-testid="total-collected">{formatVnd(data.totals.collected)}</td>
            <td>{formatVnd(data.totals.expenses)}</td>
            <td>{formatVnd(data.totals.profit)}</td>
          </tr>
        </tfoot>
      </ScrollTable>
    </section>
  );
}

function Rooms({ buildingId, year }: { buildingId: string; year: number }) {
  const query = useRoomsReport(buildingId, year);

  if (query.isPending) return <LoadingRows />;
  if (query.isError) return <LoadError error={query.error} onRetry={() => void query.refetch()} />;
  return <RoomsContent data={query.data} />;
}

function RoomsContent({ data }: { data: RoomsReport }) {
  return (
    <section className="grid min-w-0 gap-3">
      <p>
        Cả năm {data.year} (năm của “Từ tháng”). Phải thu theo kỳ; đã thu theo ngày thu. Lấp đầy =
        ngày có người / ngày phòng tồn tại trong năm, gồm ngày trả phòng.
      </p>
      {!data.rooms.length ? (
        <p>Chưa có phòng.</p>
      ) : (
        <ScrollTable label="Báo cáo theo phòng">
          <thead>
            <tr>
              {[
                'Phòng',
                'Phải thu',
                'Đã thu',
                'Tháng có người',
                'Ngày có người',
                'Tỷ lệ lấp đầy',
              ].map((label) => (
                <th scope="col" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rooms.map((r) => (
              <tr key={r.roomId}>
                <th scope="row">{r.roomCode}</th>
                <td>{formatVnd(r.billed)}</td>
                <td>{formatVnd(r.collected)}</td>
                <td>{r.occupiedMonths}</td>
                <td>
                  {r.occupiedDays} / {r.availableDays}
                </td>
                <td>{r.occupancyRate === null ? '—' : `${(r.occupancyRate * 100).toFixed(2)}%`}</td>
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      )}
    </section>
  );
}

function Utilities({ range }: { range: { buildingId: string; from: string; to: string } }) {
  const query = useUtilitiesReport(range);

  if (query.isPending) return <LoadingRows />;
  if (query.isError) return <LoadError error={query.error} onRetry={() => void query.refetch()} />;
  return <UtilitiesContent data={query.data} />;
}

function UtilitiesContent({ data }: { data: UtilitiesReport }) {
  const percent = (value: number | null) => (value === null ? '—' : `${value.toFixed(2)}%`);

  return (
    <section className="grid min-w-0 gap-3">
      <p>
        Theo tháng tiêu thụ trên hoá đơn đã phát hành. Hao hụt tiền = (chi − phải thu) / chi × 100;
        “—” khi chưa có chi. Không phải tỷ lệ hao hụt sản lượng.
      </p>
      <p className="text-ui-sm text-muted">
        Danh mục “Điện tổng” và “Nước tổng” dùng cho từng loại; “Điện nước tổng” hiển thị riêng,
        không phân bổ. Tên khớp không phân biệt hoa thường, bỏ khoảng trắng đầu/cuối.
      </p>
      {data.months.every(
        (m) =>
          !m.electricityQuantity &&
          !m.waterQuantity &&
          !m.electricityExpenses &&
          !m.waterExpenses &&
          !m.combinedExpenses,
      ) ? (
        <p>Chưa có dữ liệu điện nước trong khoảng này.</p>
      ) : null}
      <ScrollTable label="Báo cáo điện nước">
        <thead>
          <tr>
            {[
              'Tháng tiêu thụ',
              'Điện (kWh)',
              'Phải thu điện',
              'Chi điện',
              'Hao hụt tiền điện',
              'Nước (m³)',
              'Phải thu nước',
              'Chi nước',
              'Hao hụt tiền nước',
              'Chi điện nước chung',
            ].map((label) => (
              <th scope="col" key={label}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.months.map((m) => (
            <tr key={m.period}>
              <th scope="row">{displayPeriod(m.period)}</th>
              <td>{m.electricityQuantity}</td>
              <td>{formatVnd(m.electricityBilled)}</td>
              <td>{formatVnd(m.electricityExpenses)}</td>
              <td>{percent(m.electricityLossPercent)}</td>
              <td>{m.waterQuantity}</td>
              <td>{formatVnd(m.waterBilled)}</td>
              <td>{formatVnd(m.waterExpenses)}</td>
              <td>{percent(m.waterLossPercent)}</td>
              <td>{formatVnd(m.combinedExpenses)}</td>
            </tr>
          ))}
        </tbody>
      </ScrollTable>
    </section>
  );
}
