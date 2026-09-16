import { useTranslation } from 'react-i18next';
import { cn } from '../../helpers';
export type StatusBreakdownListProps = {
  className?: string;

  rows: {
    label: string;
    count: number;
    percent: number;
    color?: string;
  }[];
};
export const StatusBreakdownList = ({ className, rows }: StatusBreakdownListProps) => {
  const { t } = useTranslation('ui');
  return (
    <div className={cn(`p-4 flex flex-col gap-3.5 max-w-[380px] ${className}`)}>
      {rows?.map((rows) => (
        <div key={rows.label} className="flex flex-col rounded-full">
          <div className="flex items-center justify-between text-neutral-text-secondary">
            <span className="text-12.5 font-bold ">{rows.label}</span>
            <div className="flex gap-2 items-center">
              <span className="text-12">
                {rows.count} {t('status-breakdown-list.single')}
              </span>
              <span className="flex justify-center items-center">
                {t('status-breakdown-list.period')}
              </span>
              <span className="text-12">
                {rows.percent}
                {t('status-breakdown-list.percent')}
              </span>
            </div>
          </div>
          <div className=" bg-neutral-border h-2 rounded-full">
            {rows.percent > 0 && rows.percent < 100 && (
              <div
                className={cn(`bg-${rows.color} h-2 rounded-l-lg`)}
                style={{ width: `${rows.percent}%` }}
              />
            )}
            {rows.percent === 100 && (
              <div
                className={cn(`bg-${rows.color} h-2 rounded-full`)}
                style={{ width: `${rows.percent}%` }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
