import { type CSSProperties, type ReactNode, useMemo } from 'react';
import { cn } from '../../helpers/utils';
import { type IconName, RenderIcon } from '../icons';

export const TAG_COLORS = {
  success: '#22c55e',
  pending: '#eab308',
  error: '#ef4444',
  info: '#0ea5e9',
  primary: '#f97316',
} as const;

export type TagColorName = keyof typeof TAG_COLORS;

function resolveTagColor(color?: TagColorName | (string & {})): string | undefined {
  if (!color) return undefined;
  if (color in TAG_COLORS) return TAG_COLORS[color as TagColorName];
  return color;
}

type TagProps = {
  content: string | ReactNode;
  color?: TagColorName | (string & {});
  closeIcon?: IconName;
  icon?: IconName;
  className?: string;
  type?: 'default' | 'outline' | 'solid';
  onClose?: () => void;
};

export function Tag({
  content,
  color,
  closeIcon,
  icon,
  type = 'default',
  className,
  onClose,
}: TagProps) {
  const colorStyle: CSSProperties | undefined = useMemo(() => {
    const hex = resolveTagColor(color);
    if (!hex) return undefined;
    return {
      color: hex,
      background: `${hex}1a`,
      border: `1px solid ${hex}4d`,
    };
  }, [color]);

  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1 rounded-full border border-solid px-2.5 py-[3px] text-[11.5px] font-bold',
        {
          '!border-neutral-border !bg-neutral-bg !text-neutral-text-primary':
            type === 'default' && !color,
          '!bg-error !border-error !text-neutral-white': type === 'solid',
        },
        className,
      )}
      style={colorStyle}
    >
      {icon && <RenderIcon name={icon} className="!h-3 !w-3" />}
      {content}
      {(closeIcon || onClose) && (
        <button type="button" onClick={onClose} className="cursor-pointer">
          <RenderIcon name={closeIcon ?? 'x-mark'} className="!h-3 !w-3 hover:text-error" />
        </button>
      )}
    </span>
  );
}
