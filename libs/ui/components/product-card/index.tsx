import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn, formatCurrency } from '../../helpers';
import { Button } from '../button';
import { IconButton } from '../icon-button';
import { RenderIcon } from '../icons';

export type ProductCartProps = {
  type?: 'best-seller' | 'new-arrival' | 'featured';
  className?: string;
  favorited?: boolean;
  onFavorite?: () => void;

  imageUrl?: string;

  category?: string;
  rating?: number;
  sold?: number;

  name: string;
  description?: string;

  price: number;
  stock: number;

  onBuy?: () => void;
};
export function ProductCart({
  type,
  className = '',
  favorited = false,
  onFavorite,
  imageUrl,
  category,
  rating,
  sold,
  name,
  description,
  price,
  stock,
  onBuy,
}: ProductCartProps) {
  const { t } = useTranslation('ui');

  return (
    <div
      className={cn(
        'max-w-80 max-h-full border border-neutral-divider bg-neutral-white rounded-xl p-4',
        className,
      )}
    >
      <div className="relative h-48 mb-2">
        <div className="w-full h-full bg-neutral-divider rounded-xl p-4">
          {imageUrl ? (
            <img className="w-full h-full rounded-xl" src={imageUrl} alt="" />
          ) : (
            <div className="w-full h-full rounded-xl bg-gray-200 flex items-center justify-center">
              <RenderIcon
                name="keyboard"
                style={{ width: 70, height: 70 }}
                strokeWidth={1.5}
                className="text-neutral-disable"
              />
            </div>
          )}
        </div>
        {type && (
          <div className="absolute top-2 left-2 bg-error-bg text-error-base px-2 py-1 rounded-full border border-error-border">
            <span className="font-bold text-sm">
              {type === 'best-seller' && t('product-card.best-seller')}
              {type === 'new-arrival' && t('product-card.new-arrival')}
              {type === 'featured' && t('product-card.featured')}
            </span>
          </div>
        )}
        <div className="absolute top-2 right-2 rounded-full bg-neutral-white">
          <IconButton
            icon={favorited ? 'heart-solid' : 'heart'}
            iconClassName={favorited ? 'text-primary fill-current' : 'text-neutral-disable'}
            onClick={onFavorite}
          />
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-neutral-disable font-bold">{category}</span>
        <div className="flex gap-2 items-center">
          <RenderIcon
            name="star"
            style={{ width: 14, height: 14 }}
            className="text-primary-base fill-current"
          />
          <span className="text-neutral-text-secondary font-bold">{rating}</span>
          <span className="text-neutral-disable">.{sold}</span>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="font-bold line-clamp-2">{name}</span>
        <span className="text-neutral-disable text-sm line-clamp-2">{description}</span>
      </div>
      <div className="justify-between flex items-center mb-2 h-10">
        <span className="text-primary-base font-bold text-xl">{formatCurrency(price)}</span>
        <span className="bg-success-bg text-success-base border border-success rounded-2xl px-2 font-bold h-8 flex items-center">
          {t('product-card.stock')}: {stock}
        </span>
      </div>
      <Button
        className="w-full text-pending-clicked hover:text-neutral-white bg-primary-border hover:bg-primary-hover flex items-center border-primary"
        onClick={onBuy}
      >
        <RenderIcon className="mr-2" name="cart" />
        <span>{t('product-card.add-to-cart')}</span>
      </Button>
    </div>
  );
}
