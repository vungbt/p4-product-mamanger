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
      {Array.from({ length: maxRating }).map((_, index) => (
        <button type="button" key={index} onClick={() => onChange?.(index + 1)}>
          <RenderIcon
            name="star-outline"
            className={cn(
              'cursor-pointer transition-colors !h-3 !w-3',
              index + 1 <= rating
                ? 'text-primary fill-current'
                : 'text-neutral-disable fill-current',
            )}
          />
        </button>
      ))}
      <div className="flex items-center gap-1 text-12 leading-5">
        {orientation === 'readonly' ? (
          <>
            <span className="text-13 font-bold">{rating}</span>
            {count !== undefined && count > 0 && (
              <>
                <span className="text-neutral-text-secondary">·</span>
                <span className="text-neutral-text-secondary">{count}</span>
                <span className="text-neutral-text-secondary">{label}</span>
              </>
            )}
          </>
        ) : (
          <>
            <span className="text-13 ml-2 text-neutral-text-secondary">{evaluation}</span>
            <span className="text-neutral-text-secondary">{label}</span>
          </>
        )}
      </div>
    </div>
  );
}
