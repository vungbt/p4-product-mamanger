import { useTranslation } from 'react-i18next';
import { cn } from '../../helpers';
import { type IconName, RenderIcon } from '../icons';
import { UiImage } from '../link-image-provider';

export type CategoryCardProps = {
  className?: string;
  icon?: IconName;
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
  icon = 'keyboard',
  name,
  image,
  count,
  label,
}: CategoryCardProps) => {
  const { t } = useTranslation('ui');
  return (
    <div
      className={cn(
        'border border-neutral-border rounded-2xl transition-all duration-200 hover:shadow-raised cursor-pointer overflow-hidden flex flex-col items-center bg-neutral-bg',
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
          <RenderIcon name={icon} className="text-neutral-text-primary !h-8 !w-8" />
        )}
      </div>
      <div className="flex flex-col items-center rounded-b-2xl bg-neutral-white w-full mt-auto p-3">
        {name && (
          <span className="font-bold text-13.5" title={name}>
            {name}
          </span>
        )}
        {count !== null && count !== undefined && (
          <span className="text-neutral-text-secondary text-12">
            {count} {label || t('categoryCard.products')}
          </span>
        )}
      </div>
    </div>
  );
};
