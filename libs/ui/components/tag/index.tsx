import { type CSSProperties, type ReactNode, useMemo } from 'react';
import { cn } from '../../helpers/utils';
import { type IconName, RenderIcon } from '../icons';

type TagProps = {
  content: string | ReactNode;
  color?: string;
  closeIcon?: IconName;
  icon?: IconName;
  className?: string;
  type?: 'default' | 'outline' | 'sold';
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
  // Per docs/design/p4-product-manager-design.html (Section A · Tag): every tag/badge in the design
  // (order status, stock, category...) follows a single pill-tint formula — no tag is filled with a
  // solid color + white text. Keep the tint formula for every `type` to match the design.
  const colorStyle: CSSProperties | undefined = useMemo(() => {
    if (!color) return undefined;
    return {
      color: color,
      background: `${color}1a`, // ~10% opacity
      border: `1px solid ${color}4d`, // ~30% opacity
    };
  }, [color]);

  return (
    <span
      className={cn(
        // pill: radius 9999px, padding 3px 10px, text 11.5px/700 — matches the TAG() formula in the design exactly
        'inline-flex w-fit items-center gap-1 rounded-full border border-solid px-2.5 py-[3px] text-[11.5px] font-bold',
        {
          '!border-neutral-border !bg-neutral-bg !text-neutral-text-primary':
            type === 'default' && !color,
          '!bg-error !border-error !text-neutral-white': type === 'sold',
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
