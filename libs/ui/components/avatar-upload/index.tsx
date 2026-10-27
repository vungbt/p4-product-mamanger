import { cn } from '../../helpers/utils';
import { Avatar } from '../avatar';
import { Button } from '../button';
import { RenderIcon } from '../icons';

export type AvatarUploadProps = {
  src: string;
  initials: string;
  size?: 'md' | 'lg';
  className?: string;
  accept?: string;
  label?: string;
  onUplaod: (url: string) => void;
};

export const AvatarUpload = ({
  src,
  initials,
  size = 'lg',
  className,
  accept,
  label,
  onUplaod,
}: AvatarUploadProps) => {
  return (
    <div className={cn('flex justify-center items-center flex-col gap-2 min-w-56', className)}>
      <div className="mb-3">
        <Avatar
          src={src}
          name={initials}
          size={size}
          className="w-24 h-24 border rounded-full border-primary-border bg-primary-background [&_span]:!text-28 [&_span]:!text-primary-clicked [&_span]:font-extrabold"
        />
      </div>
      <Button
        variant="outline"
        className="text-neutral-black border-neutral-disable hover:bg-neutral"
        onClick={() => onUplaod}
      >
        <RenderIcon name="arrow-up-from-line" className="text-neutral-black" />
        <span className="">{accept}</span>
      </Button>
      <div className="text-11.5 text-neutral-placeholder text-center">{label}</div>
    </div>
  );
};
