import { Alert, Button, Dialog, Spinner, Tag, type TagTone } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useProduct, useProductVariants, useUpdateProductPublication } from '@p4/api-sdk/react';
import { getErrorMessage } from '@p4/api-sdk/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const statusTone: Record<string, TagTone> = {
  draft: 'neutral',
  active: 'success',
  inactive: 'warning',
  archived: 'danger',
};

export default function ProductDetails({ id, onClose }: { id: string; onClose: () => void }) {
  const { t } = useTranslation();
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const query = useProduct(id);
  const variantsQuery = useProductVariants(id);

  const products = query.data?.data;
  const variants = variantsQuery.data?.data ?? [];
  const updateProductPublication = useUpdateProductPublication();
  const changeStatus = async (status: 'active' | 'inactive' | 'archived') => {
    if (!products) return;
    try {
      await updateProductPublication.mutateAsync({
        id: products.id,
        body: {
          status,
          expectedVersion: (products as { version?: number }).version ?? 1,
        },
      });
      toast.success(t('products.statusUpdated', 'Đã cập nhật trạng thái sản phẩm.'));
      void query.refetch();
    } catch (error: unknown) {
      const err = error as { status?: number; statusCode?: number } | null;
      const isConflict = err?.status === 409 || err?.statusCode === 409;
      toast.error(
        isConflict
          ? t(
              'products.conflictVersion',
              'Phiên bản sản phẩm đã bị thay đổi bởi người khác. Vui lòng tải lại trang.',
            )
          : getErrorMessage(error, t('products.statusUpdateFailed', 'Không thể đổi trạng thái.')),
      );
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
      ) : products ? (
        <div className="grid gap-6">
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="text-ui-sm font-medium">
                  {t('products.status', 'Trạng thái')}:
                </span>
                <Tag tone={statusTone[products.status] ?? 'neutral'} size="sm">
                  {products.status || 'draft'}
                </Tag>
              </div>
              <div className="flex items-center gap-1.5">
                {products.status !== 'active' && products.status !== 'archived' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={updateProductPublication.isPending}
                    onClick={() => void changeStatus('active')}
                  >
                    {t('products.activate', 'Kích hoạt')}
                  </Button>
                )}
                {products.status !== 'inactive' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={updateProductPublication.isPending}
                    onClick={() => void changeStatus('inactive')}
                  >
                    {t('products.deactivate', 'Tạm ngưng')}
                  </Button>
                )}
                {products.status === 'archived' && (
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
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              <div>
                <dt className="text-ui-sm text-muted">{t('products.name', 'Tên sản phẩm')}</dt>
                <dd>{products.name}</dd>
              </div>
              <div>
                <dt className="text-ui-sm text-muted">{t('products.slug', 'Đường dẫn')}</dt>
                <dd>{products.slug || '-'}</dd>
              </div>
              <div>
                <dt className="text-ui-sm text-muted">{t('products.price', 'Giá bán')}</dt>
                <dd>{products.price?.toLocaleString('vi-VN') ?? 0}đ</dd>
              </div>
              <div>
                <dt className="text-ui-sm text-muted">{t('products.stock', 'Số lượng tồn kho')}</dt>
                <dd>{products.stock ?? 0}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-ui-sm text-muted">{t('products.description', 'Mô tả')}</dt>
                <dd>{products.description || t('products.noDescription', 'Chưa có mô tả.')}</dd>
              </div>
              <div>
                <dt className="text-ui-sm text-muted">
                  {t('products.version', 'Phiên bản (version)')}
                </dt>
                <dd>v{products.version ?? 1}</dd>
              </div>
              <div>
                <dt className="text-ui-sm text-muted">{t('products.category', 'Danh mục')}</dt>
                <dd>{products.category?.name || t('products.none', 'Chưa phân loại')}</dd>
              </div>
            </dl>
          </div>
          <div>
            <h4 className="mb-2 border-b border-line pb-2 font-semibold text-ui-sm">
              {t('products.skus', 'Danh sách biến thể SKU')}({variants.length})
            </h4>
            {variantsQuery.isPending ? (
              <Spinner label={t('products.loadingSkus', 'Đang tải SKU...')} />
            ) : variants.length === 0 ? (
              <p className="">{t('products.noVariants', 'Chưa có biến thể SKU nào.')}</p>
            ) : (
              <div className="overflow-x-auto rounded border border-line">
                <table className="w-full text-left text-ui-sm">
                  <thead className="border-b border-line bg-table-header text-ink">
                    <tr>
                      <th className="p-2 font-medium">{t('products.sku', 'Mã SKU')}</th>
                      <th className="p-2 font-medium">{t('products.color', 'Màu sắc')}</th>
                      <th className="p-2 font-medium">{t('products.size', 'Kích cỡ')}</th>
                      <th className="p-2 font-medium">{t('products.available', 'Khả dụng')}</th>
                      <th className="p-2 font-medium">{t('products.price', 'Giá bán')}</th>
                      <th className="p-2 font-medium">{t('products.status', 'Trạng thái')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v) => (
                      <tr key={v.id} className="border-line last:border-b-0 hover:bg-hover ">
                        <td className="p-2 font-mono font-medium">{v.sku}</td>
                        <td className="p-2">{v.color || '-'}</td>
                        <td className="p-2">{v.size || '-'}</td>
                        <td className="p-2">{v.available}</td>
                        <td className="p-2">{v.price?.toLocaleString('vi-VN')}đ</td>
                        <td className="p-2">
                          <Tag tone={v.status === 'active' ? 'success' : 'neutral'} size="sm">
                            {v.status}
                          </Tag>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
      {archiveConfirmOpen && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setArchiveConfirmOpen(false);
          }}
          title={t('products.archiveTitle', 'Xác nhận lưu trữ sản phẩm')}
          description={t(
            'products.archiveConfirm',
            'Lưu trữ sản phẩm sẽ ẩn khỏi cửa hàng nhưng vẫn bảo toàn lịch sử đơn hàng cũ. Bạn có chắc chắn muốn lưu trữ?',
          )}
          actions={[
            {
              id: 'cancel',
              label: t('products.cancel', 'Hủy'),
              variant: 'secondary',
              onClick: () => setArchiveConfirmOpen(false),
            },
            {
              id: 'archive',
              label: t('products.archive', 'Lưu trữ'),
              variant: 'danger',
              loading: updateProductPublication.isPending,
              onClick: () => {
                void changeStatus('archived');
                setArchiveConfirmOpen(false);
              },
            },
          ]}
        />
      )}
    </Dialog>
  );
}
