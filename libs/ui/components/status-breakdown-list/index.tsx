import { cn } from '../../helpers';
export type StatusBreakdownListProps = {
  className?: string;
  rows: {
    label: string;
    color: string;
    order: string;
    progress?: number;
    total?: number;
    remaining?: number;
  }[];
};
export const StatusBreakdownList = ({ className, rows }: StatusBreakdownListProps) => {
  const percent = rows.map((rows) =>
    rows.progress && rows.total ? Math.floor((rows.progress / rows.total) * 100) : 0,
  );
  const count = rows.map((rows) =>
    rows.total && rows.remaining ? rows.total - rows.remaining : 0,
  );
  return (
    <div className={cn(`p-4 flex flex-col gap-3.5 min-w-96 ${className}`)}>
      {rows.length > 0 &&
        rows.map((rows) => (
          <div key={rows.label} className="flex flex-col rounded-full">
            <div className="flex items-center justify-between text-neutral-text-secondar gap-2.5 mb-1.5">
              <span className="text-ui-mono leading-5">{rows.label}</span>
              <div className="flex items-center text-12 leading-5">
                {percent && (
                  <>
                    <span>
                      {count} {rows.order}
                    </span>
                    <span className="flex justify-center items-center">{'.'}</span>
                    <span>
                      {percent}
                      {'%'}
                    </span>
                  </>
                )}
              </div>
            </div>
            {percent.map((percent) => (
              <div key={`${percent}`} className={cn(`bg-neutral-border rounded-full leading-6`)}>
                {percent > 0 && (
                  <div
                    className={cn(
                      `bg-${rows.color} h-2 ${percent === 100 ? 'rounded-full' : 'rounded-l-lg'}`,
                    )}
                    style={{ width: `${percent}%` }}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
    </div>
  );
};
