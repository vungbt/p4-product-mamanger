import { Select } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_RANGES, useDashboardRange } from './dashboard-range';

export function DashboardTitle() {
  const { t } = useTranslation();

  return (
    <h1 className="truncate text-heading font-semibold text-ink">{t('adminDashboard.title')}</h1>
  );
}

export function DashboardRangeSelect() {
  const { t } = useTranslation();
  const { days, setDays } = useDashboardRange();

  return (
    <Select
      aria-label={t('adminDashboard.range')}
      rootClassName="w-52"
      searchable={false}
      value={String(days)}
      options={DASHBOARD_RANGES.map((value) => ({
        value: String(value),
        label: t('adminDashboard.lastDays', { days: value }),
      }))}
      onValueChange={(value) => {
        const next = DASHBOARD_RANGES.find((range) => String(range) === value);

        if (next) setDays(next);
      }}
    />
  );
}
