import { useRef } from 'react';
import { cn } from '../../helpers/utils';
import { Avatar } from '../avatar';
import { Button } from '../button';
import { RenderIcon } from '../icons';

export type AvatarUploadProps = {
  src?: string;
  initials: string;
  size?: 'md' | 'lg';
  className?: string;
  accept?: string;
  label?: string;
  onUpload: (url: string) => void;
};

export const AvatarUpload = ({
  src,
  initials,
  size = 'lg',
  className,
  accept = 'Đổi ảnh đại diện',
  label = 'PNG/JPG, tối đa 2MB',
  onUpload,
}: AvatarUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      const url = URL.createObjectURL(file);
      onUpload(url);
    }
  };

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
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".png,.jpg,.jpeg,.webp"
      />
      <Button
        variant="outline"
        className="text-neutral-black border-neutral-disable hover:bg-neutral"
        onClick={() => fileInputRef.current?.click()}
      >
        <RenderIcon name="arrow-up-from-line" className="text-neutral-black" />
        <span className="">{accept}</span>
      </Button>
      <div className="text-11.5 text-neutral-placeholder text-center">{label}</div>
    </div>
  );
};
