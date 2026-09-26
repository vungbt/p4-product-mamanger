import { useState } from 'react';
import { cn } from '../../helpers/utils';
import { UiImage } from '../link-image-provider';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

type AvatarProps = {
  name?: string | null;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
};

const sizeMap: Record<AvatarSize, { container: string; text: string; px: number }> = {
  sm: { container: 'h-7 w-7', text: 'text-xs', px: 28 },
  md: { container: 'h-9 w-9', text: 'text-sm', px: 36 },
  lg: { container: 'h-12 w-12', text: 'text-base', px: 48 },
  xl: { container: 'h-16 w-16', text: 'text-xl', px: 64 },
};

function getInitials(name?: string | null) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const { container, text, px } = sizeMap[size];

  const showImage = src && !imgError;

  return (
    <div
      className={cn(
        'relative shrink-0 rounded-full overflow-hidden ring-1 ring-neutral-border',
        showImage ? 'bg-transparent' : 'bg-primary',
        container,
        className,
      )}
    >
      {showImage ? (
        <UiImage
          src={src}
          alt={name ?? 'avatar'}
          width={px}
          height={px}
          className="object-cover w-full h-full"
          onError={() => setImgError(true)}
        />
      ) : (
        <span
          className={cn(
            'flex h-full w-full items-center justify-center font-semibold text-white',
            text,
          )}
        >
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}
