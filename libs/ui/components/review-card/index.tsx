import { DateFormat, formatDate } from '../../helpers/format';
import { cn } from '../../helpers/utils';
import { Avatar } from '../avatar/index';
import { RenderIcon } from '../icons';

export type ReviewCardProps = {
  userEmail: string;
  rating: number;
  maxRating: number;
  date: Date;
  comment?: string;
};

export function ReviewCard({ userEmail, rating, date, comment, maxRating }: ReviewCardProps) {
  return (
    <div className="flex gap-2">
      <div className="text-neutral-text-secondary ">
        <Avatar
          className="text-11.5 bg-neutral-bg border-neutral-border [&_span]:!text-neutral-text-secondary w-9.5 h-9.5"
          name={userEmail}
        />
      </div>
      <div className="flex flex-col">
        <div className="flex gap-2 items-center">
          <p className="text-neutral-text-primary font-bold">{userEmail}</p>
          {rating > 0 &&
            rating <= maxRating &&
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
          <div className="text-neutral-text-secondary">{formatDate(date, DateFormat.DMY)}</div>
        </div>
        <div className="text-neutral-text-secondary text-13 mt-1">{comment}</div>
      </div>
    </div>
  );
}
