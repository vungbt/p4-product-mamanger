import { cn } from '../../helpers';
import { RenderIcon } from '../icons';

export interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  className?: string;
  count?: number;
  label?: string;
  orientation?: 'readonly' | 'clickable';
  onChange?: (rating: number) => void;
}

export function RatingStars({
  rating,
  maxRating = 5,
  className,
  count,
  label,
  orientation,
  onChange,
}: RatingStarsProps) {
  const evaluation = `${rating}/${maxRating}`;
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex">
        {Array.from({ length: maxRating }).map((_, index) => {
          const isClickable = orientation === 'clickable';
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
        {orientation === 'readonly' ? (
          <>
            <span className="text-13 font-bold">
              {Number.isInteger(rating) ? `${rating}.0` : rating}
            </span>
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
