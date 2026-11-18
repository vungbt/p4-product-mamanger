import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export default function ProductImage({
  src,
  alt,
  className = 'size-10 rounded border border-line object-cover',
  fallbackClassName = 'text-ui-xs text-muted',
}: ProductImageProps) {
  const { t } = useTranslation();
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return <span className={fallbackClassName}>{t('products.noImage', 'Không có ảnh')}</span>;
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailedSrc(src)} />;
}
