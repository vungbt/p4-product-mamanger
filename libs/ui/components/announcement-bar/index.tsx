import { cn } from '../../helpers';

export type AnnouncementBarProps = {
  className?: string;
  label: string;
  code: string;
  description: string;
};

export const AnnouncementBar = ({ className, label, code, description }: AnnouncementBarProps) => {
  return (
    <div
      className={cn(
        'flex items-center justify-center border gap-2 rounded-lg text-13 px-4 py-2.5 border-primary-border bg-primary-background text-neutral-text-primary font-medium',
        className,
      )}
    >
      <div className="flex gap-1">
        <span className="">{`${label} ·`}</span>
        <span className="">{description}</span>
        <span className="text-primary font-bold">{code}</span>
      </div>
    </div>
  );
};
