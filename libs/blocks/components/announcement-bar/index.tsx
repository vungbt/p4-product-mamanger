import { cn } from '@itclabs/react-ui';

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
        'flex items-center justify-center border gap-2 rounded-lg text-ui-sm px-4 py-2.5 border-brand-100 bg-brand-50 text-ink font-medium',
        className,
      )}
    >
      <div className="flex gap-1">
        <span className="">{`${label} ·`}</span>
        <span className="">{description}</span>
        <span className="text-accent font-bold">{code}</span>
      </div>
    </div>
  );
};
