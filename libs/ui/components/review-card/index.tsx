import { DateFormat, formatDate } from '../../helpers/format';
import { cn } from '../../helpers/utils';
import { Avatar } from '../avatar/index';
import { RenderIcon } from '../icons';

export type ReviewCardProps = {
  userEmail: string;
  rating: number;
  maxRating?: number;
  date: Date;
  comment?: string;
};

export function ReviewCard({ userEmail, rating, date, comment, maxRating = 5 }: ReviewCardProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <div className="flex gap-2 items-center">
          <div className="text-primary">
            <Avatar size="sm" name={userEmail} />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <p className="text-neutral-text-primary font-bold">{userEmail}</p>
              {rating >= 1 &&
                rating <= 5 &&
                Array.from({ length: maxRating }, (_, index) => (
                  <RenderIcon
                    key={index}
                    name="star-outline"
                    className={cn(
                      'transition-colors !h-4 !w-4',
                      rating >= index + 1 ? 'text-primary fill-current' : 'text-primary',
                    )}
                  />
                ))}
            </div>

            <p className="text-neutral-text-secondary">{formatDate(date, DateFormat.DMY)}</p>
          </div>
        </div>
      </div>
      <div>
        <p>{comment}</p>
      </div>
    </div>
  );
}
