import {
  Alert,
  AlertDialog,
  Button,
  type ColumnDef,
  DataTable,
  Dialog,
  Spinner,
  Tag,
  type TagTone,
  Tooltip,
  useFormatters,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useProduct, useProductVariants, useUpdateProductPublication } from '@p4/api-sdk/react';
import { ApiSdkError, getErrorMessage } from '@p4/api-sdk/shared';
import type { ProductPublicationStatus } from '@p4/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ProductImage from './products-image';

const statusTone: Record<ProductPublicationStatus, TagTone> = {
  draft: 'neutral',
  active: 'success',
  inactive: 'warning',
  archived: 'danger',
};

export default function ProductDetails({ id, onClose }: { id: string; onClose: () => void }) {
  const { t } = useTranslation();
  const { formatCurrency } = useFormatters();
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const query = useProduct(id);
  const variantsQuery = useProductVariants(id);

  const product = query.data?.data;
  const variants = variantsQuery.data?.data ?? [];
  const updateProductPublication = useUpdateProductPublication();

  const missingRequirements: string[] = [];
  if (!product?.name?.trim()) missingRequirements.push(t('products.missingName', 'tên sản phẩm'));
  if (!product?.slug?.trim()) missingRequirements.push(t('products.missingSlug', 'slug'));
  if (!product?.description?.trim())
    missingRequirements.push(t('products.missingDescription', 'mô tả'));
  if (!product?.imageUrl?.trim())
    missingRequirements.push(t('products.missingImage', 'ảnh đại diện'));
  if (!variants.some((v) => v.status === 'active')) {
    missingRequirements.push(
      t('products.missingActiveSku', 'ít nhất 1 biến thể SKU đang hoạt động'),
    );
  }
  const isPublishDisabled = missingRequirements.length > 0;

  const variantColumns: ColumnDef<(typeof variants)[number], unknown>[] = [
    {
      id: 'sku',
      header: t('products.sku', 'Mã SKU'),
      cell: ({ row }) => <span className="font-mono font-medium">{row.original.sku}</span>,
    },
    {
      id: 'color',
      header: t('products.color', 'Màu sắc'),
      cell: ({ row }) => row.original.color || '-',
    },
    {
      id: 'size',
      header: t('products.size', 'Kích cỡ'),
      cell: ({ row }) => row.original.size || '-',
    },
    {
      id: 'available',
      header: t('products.available', 'Khả dụng'),
      cell: ({ row }) => row.original.available,
    },
    {
      id: 'price',
      header: t('products.price', 'Giá bán'),
      cell: ({ row }) => formatCurrency(row.original.price, 'VND'),
    },
    {
      id: 'status',
      header: t('products.status', 'Trạng thái'),
      cell: ({ row }) => (
        <Tag tone={row.original.status === 'active' ? 'success' : 'neutral'} size="sm">
          {t(`products.variantStatuses.${row.original.status}`, row.original.status)}
        </Tag>
      ),
    },
  ];

  const changeStatus = async (status: ProductPublicationStatus): Promise<boolean> => {
    if (!product) {
      return false;
    }
    try {
      await updateProductPublication.mutateAsync({
        id: product.id,
        body: {
          status,
          expectedVersion: product.version,
        },
      });
      toast.success(t('products.statusUpdated', 'Đã cập nhật trạng thái sản phẩm.'));
      return true;
    } catch (error: unknown) {
      if (error instanceof ApiSdkError && error.status === 409) {
        switch (error.code) {
          case 'version_conflict':
            toast.error(
              t(
                'products.conflictVersion',
                'Phiên bản sản phẩm đã bị thay đổi bởi người khác. Đang tải lại dữ liệu mới nhất...',
              ),
            );
            void query.refetch();
            return false;

          case 'product_incomplete':
            toast.error(
              t(
                'products.incompleteCondition',
                'Sản phẩm chưa đủ điều kiện xuất bản (cần có tên, slug, mô tả, ảnh đại diện và ít nhất một biến thể SKU đang hoạt động).',
              ),
            );
            return false;

          case 'invalid_state_transition':
            toast.error(
              t('products.invalidTransition', 'Không thể chuyển đổi sang trạng thái này.'),
            );
            return false;
        }
      }
      toast.error(
        getErrorMessage(error, t('products.statusUpdateFailed', 'Không thể đổi trạng thái.')),
      );
      return false;
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t('products.details', 'Chi tiết sản phẩm')}
    >
      {query.isPending ? (
        <Spinner label={t('products.loading', 'Đang tải....')} />
      ) : query.isError ? (
        <div className="grid gap-3">
          <Alert tone="danger">
            {getErrorMessage(
              query.error,
              t('products.loadFailed', 'Không thể tải chi tiết sản phẩm.'),
            )}
          </Alert>
          <Button variant="secondary" onClick={() => void query.refetch()}>
            {t('products.retry', 'Thử lại')}
          </Button>
        </div>
      ) : product ? (
        <div className="grid gap-6">
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="text-ui-sm font-medium">
                  {t('products.status', 'Trạng thái')}:
                </span>
                <Tag tone={statusTone[product.status]} size="sm">
                  {t(`products.statuses.${product.status}`, product.status)}
                </Tag>
              </div>
              <div className="flex items-center gap-1.5">
                {product.status !== 'active' &&
                  product.status !== 'archived' &&
                  (isPublishDisabled ? (
                    <Tooltip
                      content={t(
                        'products.publishMissing',
                        'Chưa đủ điều kiện kích hoạt. Còn thiếu: {{missing}}.',
                        {
                          missing: missingRequirements.join(', '),
                        },
                      )}
                    >
                      <span className="inline-block cursor-not-allowed">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled
                          loading={updateProductPublication.isPending}
                        >
                          {t('products.activate', 'Kích hoạt')}
                        </Button>
                      </span>
                    </Tooltip>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={updateProductPublication.isPending}
                      onClick={() => void changeStatus('active')}
                    >
                      {t('products.activate', 'Kích hoạt')}
                    </Button>
                  ))}
                {product.status === 'active' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={updateProductPublication.isPending}
                    onClick={() => void changeStatus('inactive')}
                  >
                    {t('products.statuses.inactive', 'Tạm ngưng')}
                  </Button>
                )}
                {product.status !== 'archived' && (
                  <Button
                    size="sm"
                    variant="danger"
                    loading={updateProductPublication.isPending}
                    onClick={() => setArchiveConfirmOpen(true)}
                  >
                    {t('products.archive', 'Lưu trữ')}
                  </Button>
                )}
              </div>
            </div>

            <div className="mb-4 flex items-center gap-4">
              <ProductImage
                src={product.imageUrl}
                alt={product.name}
                className="size-20 rounded border border-line object-cover"
                fallbackClassName="flex size-20 items-center justify-center rounded border border-line bg-muted/10 text-center text-ui-xs text-muted"
              />
              <div>
                <h3 className="font-semibold text-ui-base">{product.name}</h3>
                <p className="font-mono text-ui-xs text-muted">{product.slug}</p>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              <div>
                <dt className="text-ui-sm text-muted">{t('products.name', 'Tên sản phẩm')}</dt>
                <dd className="font-medium">{product.name}</dd>
              </div>
              <div>
                <dt className="text-ui-sm text-muted">{t('products.slug', 'Đường dẫn')}</dt>
                <dd className="font-mono text-ui-sm">{product.slug || '-'}</dd>
              </div>
              <div>
                <dt className="text-ui-sm text-muted">{t('products.price', 'Giá bán')}</dt>
                <dd>{formatCurrency(product.price, 'VND')}</dd>
              </div>
              <div>
                <dt className="text-ui-sm text-muted">{t('products.stock', 'Số lượng tồn kho')}</dt>
                <dd>{product.stock}</dd>
              </div>
              <div>
                <dt className="text-ui-sm text-muted">{t('products.brand', 'Thương hiệu')}</dt>
                <dd>{product.brand || '-'}</dd>
              </div>
              <div>
                <dt className="text-ui-sm text-muted">{t('products.material', 'Chất liệu')}</dt>
                <dd>{product.material || '-'}</dd>
              </div>
              <div>
                <dt className="text-ui-sm text-muted">{t('products.category', 'Danh mục')}</dt>
                <dd>{product.category?.name || t('products.none', 'Chưa phân loại')}</dd>
              </div>
              <div>
                <dt className="text-ui-sm text-muted">{t('products.status', 'Trạng thái')}</dt>
                <dd>{product.status}</dd>
              </div>
              <div>
                <dt className="text-ui-sm text-muted">
                  {t('products.version', 'Phiên bản (version)')}
                </dt>
                <dd>v{product.version}</dd>
              </div>
              {product.careInstructions && (
                <div className="sm:col-span-2">
                  <dt className="text-ui-sm text-muted">
                    {t('products.careInstructions', 'Hướng dẫn bảo quản')}
                  </dt>
                  <dd>{product.careInstructions}</dd>
                </div>
              )}
              <div className="sm:col-span-2">
                <dt className="text-ui-sm text-muted">{t('products.description', 'Mô tả')}</dt>
                <dd className="whitespace-pre-line text-ui-sm">
                  {product.description || t('products.noDescription', 'Chưa có mô tả.')}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h4 className="mb-2 border-b border-line pb-2 font-semibold text-ui-sm">
              {t('products.skus', 'Danh sách biến thể SKU')}
              {!variantsQuery.isPending && !variantsQuery.isError ? ` (${variants.length})` : ''}
            </h4>
            <DataTable
              mode="client"
              pagination={false}
              caption={t('products.skus', 'Danh sách biến thể SKU')}
              rows={variants}
              columns={variantColumns}
              rowId={(row) => row.id}
              loading={variantsQuery.isPending}
              error={
                variantsQuery.isError
                  ? getErrorMessage(
                      variantsQuery.error,
                      t('products.loadSkusFailed', 'Không thể tải danh sách biến thể SKU.'),
                    )
                  : undefined
              }
              onRetry={() => void variantsQuery.refetch()}
              emptyText={t('products.noVariants', 'Chưa có biến thể SKU nào.')}
            />
          </div>
        </div>
      ) : null}

      <AlertDialog
        open={archiveConfirmOpen}
        onOpenChange={(open) => {
          if (!open) setArchiveConfirmOpen(false);
        }}
        title={t('products.archiveTitle', 'Xác nhận lưu trữ sản phẩm')}
        description={t(
          'products.archiveConfirm',
          'Lưu trữ sản phẩm sẽ ẩn khỏi cửa hàng nhưng vẫn bảo toàn lịch sử đơn hàng cũ. Bạn có chắc chắn muốn lưu trữ?',
        )}
        confirmLabel={t('products.archive', 'Lưu trữ')}
        cancelLabel={t('products.cancel', 'Hủy')}
        confirmVariant="danger"
        confirmLoading={updateProductPublication.isPending}
        closeOnConfirm={false}
        onConfirm={async () => {
          const ok = await changeStatus('archived');
          if (ok) {
            setArchiveConfirmOpen(false);
          }
        }}
      />
    </Dialog>
  );
}
