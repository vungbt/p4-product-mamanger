import { useTranslation } from 'react-i18next';
import { cn } from '../../helpers';
import { RenderIcon } from '../icons';

export type Category = {
  name: string;
  count: number;
  label?: string;
  image?: string;
};

export type CategoryCardProps = {
  className?: string;
  category: Category;
};

export const CategoryCard = ({ className, category }: CategoryCardProps) => {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        ' border border-neutral-border rounded-2xl transition-all duration-200 hover:shadow-raised cursor-pointer overflow-hidden',
        className,
      )}
    >
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 h-32 bg-neutral-bg',
          className,
        )}
      >
        {category.image ? (
          <img src={category.image} alt={category.name} className="h-full w-full object-cover" />
        ) : (
          <RenderIcon name="keyboard" style={{ width: 32, height: 32 }} />
        )}
      </div>
      <div className="flex flex-col items-center rounded-b-2xl bg-neutral-white p-3">
        {category.name && <span className="font-bold text-13.5">{category.name}</span>}
        {category.count && (
          <span className="text-neutral-text-secondary text-12">
            {category.count} {category.label || t('categoryCard.products')}
          </span>
        )}
      </div>
    </div>
  );
};
