import { type CSSProperties, type ReactNode, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { type IconName, RenderIcon } from '../icons';

type TagProps = {
  content: string | ReactNode;
  color?: string;
  closeIcon?: IconName;
  icon?: IconName;
  className?: string;
  type?: 'default' | 'outline';
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
    if (!color) return undefined;
    if (type === 'default') {
      return { background: color, color: 'white', border: `1px solid ${color}` };
    }
    // outline: tint the color without external colorScaleGenerator
    return {
      color: color,
      background: `${color}1a`, // ~10% opacity
      border: `1px solid ${color}4d`, // ~30% opacity
    };
  }, [color, type]);

  return (
    <span
      className={cn(
        'flex w-fit items-center gap-1 rounded border border-solid px-1 py-0.5 text-xs font-medium',
        {
          '!border-neutral-border !bg-neutral-bg !text-neutral-text-primary':
            type === 'default' && !color,
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
