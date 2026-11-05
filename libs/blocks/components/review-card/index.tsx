import { Avatar, Rating } from '@itclabs/react-ui';
import { DateFormat, formatDate } from '../../helpers';
export type ReviewCardProps = {
  userEmail: string;
  rating: number;
  maxRating: number;
  date: Date;
  comment?: string;
};
export function ReviewCard({ userEmail, rating, date, comment, maxRating }: ReviewCardProps) {
  return (
    <div className="flex gap-3">
      <Avatar alt={userEmail} size="sm" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-ink">{userEmail}</p>
          <Rating value={rating} max={maxRating} readOnly size="sm" label={userEmail} />
          <span className="text-ui-sm text-muted">{formatDate(date, DateFormat.DMY)}</span>
        </div>
        <p className="mt-1 text-control text-muted">{comment}</p>
      </div>
    </div>
  );
}
