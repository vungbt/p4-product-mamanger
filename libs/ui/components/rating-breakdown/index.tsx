import { cn } from '../../helpers/utils';
import { RenderIcon } from '../icons';
import { ProgressBar } from '../progress-bar';

export type RatingBreakdownItem = {
  star: 1 | 2 | 3 | 4 | 5;
  count: number;
};

export type RatingBreakdownProps = {
  average?: number;
  score?: number;
  total: number;
  title?: string;
  description?: string;
  className?: string;
  breakdown?: RatingBreakdownItem[];
};

export const RatingBreakdown: React.FC<RatingBreakdownProps> = ({
  average,
  score,
  total,
  title,
  description,
  breakdown = [],
  className,
}) => {
  const displayScore = title ?? (average ?? score ?? 0).toFixed(1);
  const displayDescription = description ?? `${total} đánh giá`;

  const sortedBreakdown = [...breakdown].sort((a, b) => b.star - a.star);

  return (
    <div className={cn('flex items-center gap-4 min-w-80', className)}>
      <div className="text-center flex-none min-w-16">
        <div className="text-32 font-extrabold tracking-tight leading-none text-neutral-text-primary">
          {displayScore}
        </div>
        <div className="text-11.5 text-neutral-text-secondary mt-1 whitespace-nowrap">
          {displayDescription}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1.5">
        {sortedBreakdown.map((item) => {
          const starLevel = item.star;
          return (
            <div key={item.star} className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-11 font-bold text-neutral-text-secondary w-2.5 text-center">
                  {starLevel}
                </span>
                <RenderIcon name="star-solid" className="text-primary !w-3 !h-3" />
              </div>

              <div className="flex-1">
                <ProgressBar
                  currentValue={item.count}
                  total={total}
                  className={cn(
                    'h-1.5 bg-neutral-divider',
                    starLevel === 5 ? '[&>div]:bg-primary' : '[&>div]:bg-primary-border',
                  )}
                />
              </div>

              <span className="text-11 text-neutral-placeholder w-3.5 text-right">
                {item.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
