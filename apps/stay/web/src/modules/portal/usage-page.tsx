import { EmptyState } from '@itclabs/react-ui';
import { Chart } from '@itclabs/react-ui/chart';
import { formatNumber } from '@itclabs/react-ui/format';
import { usePortalUsage } from '@stay/sdk/react';
import type { MeterKind, PortalUsagePeriod, PortalUsageReading } from '@stay/shared';
import { formatVnd } from '@/libraries/format';
import { displayPeriod } from '@/modules/invoices/invoice-ui';
import { PortalQuery, PortalSection } from './portal-ui';

const KINDS: { kind: MeterKind; label: string; unit: string }[] = [
  { kind: 'electricity', label: 'Điện', unit: 'kWh' },
  { kind: 'water', label: 'Nước', unit: 'm³' },
];

function reading(value: number | null) {
  return value === null ? '—' : formatNumber(value);
}

function UsageRow({ label, row }: { label: string; row: PortalUsageReading | null }) {
  if (!row) return null;

  return (
    <li className="grid gap-0.5">
      <p className="font-medium">
        {label}: {formatNumber(row.consumption)} {row.unit ?? ''} · {formatVnd(row.amount)}
      </p>
      <p className="text-ui-sm text-muted">
        Chỉ số {reading(row.startReading)} → {reading(row.endReading)}
        {row.unitPrice !== null ? ` · ${formatVnd(row.unitPrice)}/${row.unit ?? ''}` : ''}
      </p>
    </li>
  );
}

/** T-07 `/p/usage`: 12 months of electricity/water as billed (chart + table). */
export default function PortalUsagePage() {
  const usage = usePortalUsage();

  return (
    <>
      <h1 className="text-heading font-bold">Điện nước của tôi</h1>
      <PortalQuery query={usage}>
        {({ periods }) =>
          periods.length === 0 ? (
            <EmptyState
              title="Chưa có số liệu điện nước"
              description="Số liệu hiện ở đây khi có hoá đơn tính điện nước."
            />
          ) : (
            <>
              {KINDS.map(({ kind, label, unit }) => (
                <PortalSection key={kind} title={`${label} (${unit})`}>
                  <Chart
                    type="bar"
                    label={`Tiêu thụ ${label.toLowerCase()} theo tháng`}
                    height={200}
                    legend={false}
                    data={periods.map((period: PortalUsagePeriod) => ({
                      id: period.period,
                      label: displayPeriod(period.period),
                      values: { consumption: period[kind]?.consumption ?? null },
                    }))}
                    series={[{ id: 'consumption', label: `${label} (${unit})` }]}
                    valueFormatter={(value) => `${formatNumber(value)} ${unit}`}
                  />
                </PortalSection>
              ))}
              <PortalSection title="Chi tiết theo tháng">
                <ul className="grid gap-4">
                  {[...periods].reverse().map((period) => (
                    <li key={period.period} className="grid gap-2">
                      <h3 className="font-semibold">Tháng {displayPeriod(period.period)}</h3>
                      <ul className="grid gap-2">
                        <UsageRow label="Điện" row={period.electricity} />
                        <UsageRow label="Nước" row={period.water} />
                      </ul>
                    </li>
                  ))}
                </ul>
              </PortalSection>
            </>
          )
        }
      </PortalQuery>
    </>
  );
}
