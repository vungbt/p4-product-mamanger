import { cn, Icon, Progress } from '@itclabs/react-ui';
import { StarIcon } from '@itclabs/react-ui/icons/bold';
import { useTranslation } from 'react-i18next';

export type RatingBreakdownItem = {
  star: 1 | 2 | 3 | 4 | 5;
  count: number;
};

export type RatingBreakdownProps = {
  average: number;
  total: number;
  description?: string;
  className?: string;
  breakdown?: RatingBreakdownItem[];
};

export const RatingBreakdown: React.FC<RatingBreakdownProps> = ({
  average,
  total,
  description,
  breakdown = [],
  className,
}) => {
  const displayScore = (average ?? 0).toFixed(1);

  const { t } = useTranslation('blocks');

  const displayDescription =
    description ??
    (!total || total <= 0
      ? t('ratingBreakdown.noReviews')
      : `${total} ${t('ratingBreakdown.reviews')}`);

  const sortedBreakdown = [...breakdown].sort((a, b) => b.star - a.star);

  return (
    <div className={cn('flex items-center gap-4 min-w-80', className)}>
      <div className="text-center flex-none min-w-16">
        <div className="text-title font-extrabold tracking-tight leading-none text-ink">
          {displayScore}
        </div>
        <div className="text-xs text-muted mt-1 whitespace-nowrap">{displayDescription}</div>
      </div>

      <div className="flex-1 flex flex-col gap-1.5">
        {sortedBreakdown.map((item) => {
          const starLevel = item.star;
          return (
            <div key={item.star} className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-muted w-2.5 text-center">{starLevel}</span>
                <Icon glyph={StarIcon} className="text-accent !w-3 !h-3" />
              </div>
              <div className="flex-1">
                <Progress
                  value={total > 0 ? (item.count / total) * 100 : 0}
                  size="sm"
                  aria-label={String(item.star)}
                />
              </div>
              <span className="text-xs text-muted w-3.5 text-right">{item.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
