import { cn, Icon, type IconGlyph, UiImage } from '@itclabs/react-ui';
import { KeyboardIcon } from '@itclabs/react-ui/icons/outline';
import { useTranslation } from 'react-i18next';

export type CategoryCardProps = {
  className?: string;
  icon?: IconGlyph;
  name: string;
  count: number;
  label?: string;
  image?: {
    url: string;
    alt?: string;
  };
};

export const CategoryCard = ({
  className,
  icon = KeyboardIcon,
  name,
  image,
  count,
  label,
}: CategoryCardProps) => {
  const { t } = useTranslation('blocks');
  return (
    <div
      className={cn(
        'border border-line rounded-2xl transition-all duration-200 hover:shadow-floating cursor-pointer overflow-hidden flex flex-col items-center bg-canvas',
        className,
      )}
    >
      <div className="flex flex-1 w-full items-center justify-center overflow-hidden min-h-32">
        {image?.url ? (
          <UiImage
            src={image?.url}
            alt={image?.alt ?? name}
            className="h-full w-full object-cover"
          />
        ) : (
          <Icon glyph={icon} className="text-ink !h-8 !w-8" />
        )}
      </div>
      <div className="flex flex-col items-center rounded-b-2xl bg-surface w-full mt-auto p-3">
        {name && (
          <span className="font-bold text-control" title={name}>
            {name}
          </span>
        )}
        {count !== undefined && count >= 0 && (
          <span className="text-muted text-xs">
            {count} {label || t('categoryCard.products')}
          </span>
        )}
      </div>
    </div>
  );
};
