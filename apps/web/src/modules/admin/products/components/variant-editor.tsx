import {
  Alert,
  Button,
  Checkbox,
  cn,
  Dialog,
  Form,
  FormField,
  Input,
  Select,
} from '@itclabs/react-ui';
import type { ProductImage } from '@p4/shared';
import { useTranslation } from 'react-i18next';
import useVariantEditor, { type VariantEditorOptions } from '../hooks/use-variant-editor';

type VariantEditorProps = VariantEditorOptions & { images: ProductImage[] };

export default function VariantEditor({ images, ...options }: VariantEditorProps) {
  const { t } = useTranslation();
  const {
    form,
    schema,
    error,
    conflict,
    reloading,
    pending,
    variant,
    reloadLatest,
    clearServerError,
    changeOpen,
  } = useVariantEditor(options);

  return (
    <Dialog
      open
      onOpenChange={changeOpen}
      title={t(variant ? 'adminProducts.variant.editTitle' : 'adminProducts.variant.addTitle')}
      description={t('adminProducts.variant.hint')}
    >
      <Form form={form} schema={schema} className="grid gap-4">
        {conflict && (
          <Alert
            tone="warning"
            title={t('adminProducts.variant.conflictTitle')}
            action={
              <Button
                type="button"
                size="sm"
                variant="secondary"
                loading={reloading}
                onClick={reloadLatest}
              >
                {t('adminProducts.variant.reload')}
              </Button>
            }
          >
            {t('adminProducts.variant.conflict')}
          </Alert>
        )}
        {error && <Alert tone="danger">{error}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField name="sku" label={t('adminProducts.sku')} required className="mb-0">
            <Input
              maxLength={120}
              disabled={pending}
              autoComplete="off"
              onChange={() => clearServerError('sku')}
            />
          </FormField>
          <FormField name="barcode" label={t('adminProducts.variant.barcode')} className="mb-0">
            <Input
              maxLength={120}
              disabled={pending}
              onChange={() => clearServerError('barcode')}
            />
          </FormField>
          <FormField name="size" label={t('adminProducts.size')} required className="mb-0">
            <Input maxLength={80} disabled={pending} onChange={() => clearServerError('size')} />
          </FormField>
          <FormField name="color" label={t('adminProducts.color')} required className="mb-0">
            <Input maxLength={80} disabled={pending} onChange={() => clearServerError('color')} />
          </FormField>
          <FormField name="price" label={t('adminProducts.priceVnd')} required className="mb-0">
            <Input
              inputMode="numeric"
              disabled={pending}
              onChange={() => clearServerError('price')}
            />
          </FormField>
          <FormField name="status" label={t('adminProducts.statusLabel')} className="mb-0">
            {(field) => (
              <Select
                aria-label={t('adminProducts.statusLabel')}
                searchable={false}
                disabled={pending}
                value={field.state.value}
                options={(['active', 'inactive'] as const).map((status) => ({
                  value: status,
                  label: t(`adminProducts.skuStatus.${status}`),
                }))}
                onValueChange={(value) => field.handleChange(value ?? 'active')}
              />
            )}
          </FormField>
        </div>

        <FormField name="isDefault" className="mb-0">
          {(field) => (
            <Checkbox
              label={t('adminProducts.variant.isDefault')}
              disabled={pending}
              checked={field.state.value}
              onCheckedChange={(checked) => field.handleChange(checked === true)}
            />
          )}
        </FormField>

        <FormField name="imageIds" className="mb-0">
          {(field) => (
            <fieldset className="grid gap-2">
              <legend className="mb-2 text-ui-sm font-medium text-ink">
                {t('adminProducts.variant.images')}
              </legend>
              {images.length ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {images.map((image, index) => {
                    const selected: string[] = field.state.value;
                    const checked = selected.includes(image.fileId);

                    return (
                      <div
                        key={image.id}
                        className={cn(
                          'grid gap-1 rounded-control border p-1',
                          checked ? 'border-brand-500' : 'border-line',
                        )}
                      >
                        <img
                          src={image.url}
                          alt=""
                          className="aspect-square w-full rounded-control object-cover"
                        />
                        <Checkbox
                          label={t('adminProducts.variant.imageOption', { index: index + 1 })}
                          disabled={pending}
                          checked={checked}
                          onCheckedChange={(next) =>
                            field.handleChange(
                              next === true
                                ? [...selected, image.fileId]
                                : selected.filter((id) => id !== image.fileId),
                            )
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-ui-sm text-muted">{t('adminProducts.variant.noImages')}</p>
              )}
            </fieldset>
          )}
        </FormField>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" disabled={pending} onClick={options.onClose}>
            {t('adminProducts.cancel')}
          </Button>
          <Button type="submit" loading={pending} disabled={conflict}>
            {t('adminProducts.variant.save')}
          </Button>
        </div>
      </Form>
    </Dialog>
  );
}
