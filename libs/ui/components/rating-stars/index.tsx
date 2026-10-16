import { cn } from '../../helpers';
import { RenderIcon } from '../icons';

export interface RatingStarsProps {
  rating: number;
  maxRating: number;
  className?: string;
  count?: number;
  label?: string;
  orientation?: boolean;
  onChange?: (rating: number) => void;
}

export function RatingStars({
  rating,
  maxRating,
  className,
  count,
  label,
  orientation = true,
  onChange,
}: RatingStarsProps) {
  const evaluation = `${rating}/${maxRating}`;
  const isClickable = !orientation;
  const formatRating = (val: number) => {
    return Number.isInteger(val) ? `${val}.0` : val;
  };
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex">
        {Array.from({ length: maxRating }).map((_, index) => {
          return (
            <button
              type="button"
              key={index}
              onClick={() => isClickable && onChange?.(index + 1)}
              disabled={!isClickable}
              className={cn(isClickable ? 'cursor-pointer' : 'cursor-default')}
            >
              <RenderIcon
                name="star-outline"
                className={cn(
                  'transition-colors !h-4 !w-4',
                  rating >= index + 1
                    ? 'text-primary fill-current'
                    : 'text-neutral-disable fill-current',
                )}
              />
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-1 text-12 leading-5">
        {!isClickable ? (
          <>
            <span className="text-13 font-bold">{formatRating(rating)}</span>
            {(count ?? 0) > 0 && (
              <>
                <span className="text-neutral-text-secondary">·</span>
                <span className="text-neutral-text-secondary">{count}</span>
                <span className="text-neutral-text-secondary">{label}</span>
              </>
            )}
          </>
        ) : (
          <>
            <span className="text-13 ml-1 text-neutral-text-secondary">{evaluation}</span>
            <span className="text-neutral-text-secondary">{label}</span>
          </>
        )}
      </div>
    </div>
  );
}
