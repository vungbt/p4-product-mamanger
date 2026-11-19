import { Card } from '@itclabs/react-ui';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProductFormValues } from '@/modules/admin/products/hooks/use-product-form';

type SeoPreviewProps = Pick<
  ProductFormValues,
  'seoTitle' | 'seoDescription' | 'name' | 'slug' | 'description'
>;

export function SeoPreview({ seoTitle, seoDescription, name, slug, description }: SeoPreviewProps) {
  const { t } = useTranslation();

  const plainDescription = useMemo(
    () => new DOMParser().parseFromString(description, 'text/html').body.textContent?.trim() ?? '',
    [description],
  );

  const title = seoTitle || name || t('adminProductForm.seoPreviewTitlePlaceholder');
  const summary =
    seoDescription || plainDescription || t('adminProductForm.seoPreviewDescriptionPlaceholder');

  return (
    <div className="flex min-w-0 flex-col gap-2 lg:h-full">
      <h3 className="text-ui-sm font-medium text-ink">{t('adminProductForm.seoPreview')}</h3>
      <Card
        aria-label={t('adminProductForm.seoPreview')}
        className="rounded-control border border-line bg-canvas p-4 shadow-none lg:flex-1"
        contentClassName="grid min-w-0 content-start gap-1"
      >
        <p className="truncate text-ui-sm text-muted">p4.vn › san-pham › {slug}</p>
        <p className="truncate text-section text-brand-700">{title}</p>
        <p className="line-clamp-2 text-ui-sm text-muted">{summary}</p>
      </Card>
    </div>
  );
}
