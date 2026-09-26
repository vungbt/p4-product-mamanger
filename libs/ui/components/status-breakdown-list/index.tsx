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
    <div className={cn(`p-4 flex flex-col gap-3.5 min-w-96 ${className}`)}>
      {rows?.map((rows) => (
        <div key={rows.label} className="flex flex-col rounded-full">
          <div className="flex items-center justify-between text-neutral-text-secondar gap-2.5 mb-1.5">
            <span className="text-ui-mono leading-5">{rows.label}</span>
            <div className="flex items-center text-12 leading-5">
              <span>
                {rows.count} {t('statusBreakdownList.single')}
              </span>
              <span className="flex justify-center items-center">
                {t('statusBreakdownList.period')}
              </span>
              <span>
                {rows.percent}
                {t('statusBreakdownList.percent')}
              </span>
            </div>
          </div>
          <div className=" bg-neutral-border h-2 rounded-full leading-6">
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
