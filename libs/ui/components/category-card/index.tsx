import { cn } from '../../helpers';
import { RenderIcon } from '../icons';

export type Category = {
  name: string;
  count: number;
  image?: string;
};

export type CategoryCardProps = {
  className?: string;
  category: Category;
};

export const CategoryCard = ({ className, category }: CategoryCardProps) => {
  return (
    <div
      className={cn(
        ' border rounded-xl transition-all duration-300 hover:-translate-y-2 hover:bg-primary hover:shadow-lg',
        className,
      )}
    >
      <div className={cn('flex flex-col items-center justify-center gap-2 p-6', className)}>
        <RenderIcon name="keyboard" style={{ width: 50, height: 50 }} />
        {category.image && <img src={category.image} alt={category.name} />}
      </div>
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-neutral-white w-full rounded-b-xl transition-all duration-200 ease-in-out',
          className,
        )}
      >
        {category.name && <span className="">{category.name}</span>}
        {category.count && <span className="">{category.count}</span>}
      </div>
    </div>
  );
};
