import clsx from 'clsx';
import type { IconProps } from '.';

export default function Radio({
  className,
  style,
  transform,
  strokeWidth = 1.5,
}: Readonly<IconProps>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={clsx('size-6', className)}
      style={style}
      strokeWidth={strokeWidth}
      transform={transform}
      stroke="currentColor"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" />
      <circle cx="12" cy="12" r="6" fill="currentColor" />
    </svg>
  );
}
