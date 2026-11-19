import { Alert, Tag, UploadField, type UploadGalleryItem } from '@itclabs/react-ui';
import { createUploadReorder } from '@itclabs/react-ui/dnd';
import type { useTicketUpload } from '@p4/api-sdk/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ProductImageEntry } from '@/modules/admin/products/hooks/use-product-form';

const MAX_IMAGES = 20;
// Drag-and-drop ordering; the first image is the thumbnail. Created once (opt-in kit plugin).
const reorder = createUploadReorder();
const ACCEPT = 'image/png,image/jpeg,image/webp';

export function ProductGallery({
  images,
  upload,
  disabled,
  onRemove,
  onItemsReorder,
}: {
  images: ProductImageEntry[];
  upload: ReturnType<typeof useTicketUpload>;
  disabled: boolean;
  onRemove: (id: string) => void;
  onItemsReorder: (ids: string[]) => void;
}) {
  const { t } = useTranslation();

  const [error, setError] = useState('');

  const items: UploadGalleryItem[] = images.map((image, index) => ({
    id: image.key,
    src: image.url,
    alt: image.alt || t('adminProductForm.imageAlt', { index: index + 1 }),
    status: image.status,
    progress: image.progress,
    error: image.error,
    badge:
      index === 0 ? (
        <Tag size="sm" tone="brand" className="whitespace-nowrap">
          {t('adminProductForm.thumbnailBadge')}
        </Tag>
      ) : undefined,
  }));

  const addFiles = (files: File[]) => {
    if (disabled || !files.length) return;
    if (files.length + items.length > MAX_IMAGES) {
      setError(t('adminProductForm.imageLimit'));
      return;
    }

    setError('');
    upload.add(files);
  };

  return (
    <div className="grid gap-3">
      <UploadField
        variant="gallery"
        label={t('adminProductForm.gallery')}
        size="md"
        classNames={{ label: 'sr-only', root: 'gap-3' }}
        items={items}
        disabled={disabled}
        accept={ACCEPT}
        maxFiles={MAX_IMAGES}
        hint={t('adminProductForm.imageHint', { count: items.length, max: MAX_IMAGES })}
        onValueChange={addFiles}
        onReject={setError}
        reorder={reorder}
        onItemsReorder={onItemsReorder}
        onItemRemove={onRemove}
        onItemRetry={(id) => {
          const item = upload.items.find((item) => item.id === id);
          if (item) void upload.retry(item);
        }}
      />
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  );
}
