import {
  Alert,
  Button,
  ColorPicker,
  clearErrors,
  Dialog,
  Form,
  FormField,
  FormGrid,
  Icon,
  Input,
  NumberInput,
  OptionGroup,
  Select,
  Switch,
  setErrors,
  slugify,
  UploadField,
  useAppForm,
  useLinkedField,
} from '@itclabs/react-ui';
import { createUploadReorder } from '@itclabs/react-ui/dnd';
import { useTicketUpload } from '@p4/api-sdk/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';
import type { ProductImageEntry } from '@/modules/admin/products/hooks/use-product-form';
import { useVariantErrorLabel } from '@/modules/admin/products/hooks/use-variant-error-label';
import {
  customVariantColor,
  matchVariantColor,
  type VariantColorOption,
  type VariantRow,
} from '@/modules/admin/products/hooks/variant-diff';

const reorder = createUploadReorder();
const MAX_IMAGES = 10;

// Keep a durable local preview after the dialog upload hook releases its blob URLs.
function previewFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function VariantDialog({
  initial,
  rows,
  images,
  sizes,
  colors,
  slug,
  disabled,
  errors,
  onClose,
  onSave,
}: {
  initial: VariantRow;
  rows: VariantRow[];
  images: ProductImageEntry[];
  sizes: string[];
  colors: VariantColorOption[];
  slug: string;
  disabled: boolean;
  errors: Record<string, string>;
  onClose: () => void;
  onSave: (row: VariantRow) => void;
}) {
  const { t } = useTranslation();

  const upload = useTicketUpload({
    purpose: 'product',
    mode: 'batch',
    failureMessage: t('adminProductForm.uploadFailed'),
  });

  const [skuImages, setSkuImages] = useState<ProductImageEntry[]>(() =>
    initial.images.map((image) => ({
      ...image,
      key: image.storageId,
      alt: initial.sku,
      status: 'idle',
    })),
  );

  const [uploadError, setUploadError] = useState('');

  const incomplete = upload.busy || skuImages.some((image) => !image.storageId);

  useEffect(() => {
    setSkuImages((previous) => {
      const uploads: ProductImageEntry[] = upload.items.map((item) => ({
        key: item.id,
        storageId: item.result?.storageId,
        url: item.preview,
        alt: item.file.name,
        status:
          item.status === 'completed' ? 'idle' : item.status === 'error' ? 'error' : 'uploading',
        progress: item.progress,
        error: item.error,
      }));
      const byKey = new Map(uploads.map((item) => [item.key, item]));
      return [
        ...previous.map((item) => byKey.get(item.key) ?? item),
        ...uploads.filter((item) => !previous.some((existing) => existing.key === item.key)),
      ];
    });
  }, [upload.items]);

  const element = useRef<HTMLFormElement>(null);

  const message = useVariantErrorLabel();

  const skuSource = useCallback(
    (size: string, color: string) =>
      [slug, size, color.replace(/^#/, '')]
        .map((part) => slugify(part))
        .filter(Boolean)
        .join('-')
        .toUpperCase()
        .slice(0, 120),
    [slug],
  );

  const form = useAppForm({
    defaultValues: {
      ...initial,
      barcode: initial.barcode ?? '',
      skuSource: skuSource(initial.size, initial.color),
    },
    onSubmit: async ({ value }) => {
      if (disabled || incomplete) return;
      const others = rows.filter((row) => !row.removed && row.key !== initial.key);

      const colorValue = (color: string) =>
        (matchVariantColor(color, colors)?.value ?? color).toLowerCase();

      const duplicate: Record<string, string[]> = {};
      if (
        others.some(
          (row) => row.size === value.size && colorValue(row.color) === colorValue(value.color),
        )
      ) {
        duplicate.color = [message('duplicate_variant_combination')];
      }
      if (others.some((row) => row.sku.trim().toUpperCase() === value.sku.trim().toUpperCase())) {
        duplicate.sku = [message('duplicate_sku')];
      }
      if (Object.keys(duplicate).length) {
        setErrors(form, duplicate);
        return;
      }
      const { skuSource: _, ...row } = value;
      onSave({
        ...row,
        sku: row.sku.trim(),
        barcode: row.barcode || null,
        images: await Promise.all(
          skuImages.flatMap((image) => {
            const storageId = image.storageId;
            if (!storageId) return [];
            const item = upload.items.find((item) => item.id === image.key);
            return [
              item
                ? previewFile(item.file).then((url) => ({
                    storageId,
                    url,
                  }))
                : Promise.resolve({ storageId, url: image.url }),
            ];
          }),
        ),
      });
    },
  });

  // The kit's AnyFormApi parameter rejects typed array fields; the hook only
  // reads/subscribes to values and writes the two scalar fields selected here.
  useLinkedField(
    form as unknown as Parameters<
      typeof useLinkedField<typeof form.state.values, 'skuSource', 'sku'>
    >[0],
    {
      source: 'skuSource',
      target: 'sku',
      transform: (value) => value,
      initiallyLinked: !initial.sku,
    },
  );

  useEffect(() => {
    form.setFieldValue('skuSource', skuSource(form.state.values.size, form.state.values.color));
  }, [skuSource, form]);

  useEffect(() => {
    if (!Object.keys(errors).length) return;
    const frame = requestAnimationFrame(() =>
      setErrors(
        form,
        Object.fromEntries(
          Object.entries(errors).map(([field, error]) => [
            field === 'imageStorageIds' ? 'images' : field,
            [message(error)],
          ]),
        ),
      ),
    );
    return () => cancelAnimationFrame(frame);
  }, [errors, form, message]);

  const required = v.pipe(v.string(), v.trim(), v.minLength(1, t('adminProductForm.required')));
  const integer = v.pipe(
    v.number(),
    v.integer(t('adminProductForm.integer')),
    v.minValue(0, t('adminProductForm.integer')),
    v.maxValue(2147483647, t('adminProductForm.integer')),
  );
  const schema = {
    size: required,
    color: required,
    sku: v.pipe(required, v.maxLength(120, t('adminProductForm.tooLong', { max: 120 }))),
    barcode: v.pipe(
      v.string(),
      v.regex(/^(?:[0-9]{8,14})?$/, t('adminProductForm.barcodeInvalid')),
    ),
    price: integer,
    stock: integer,
    status: v.picklist(['active', 'inactive']),
    isDefault: v.boolean(),
    images: v.array(v.object({ storageId: v.string(), url: v.string() })),
  };
  const unknownErrors = Object.entries(errors).filter(
    ([field]) => !(field in schema) && field !== 'imageStorageIds',
  );

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={t(initial.sku ? 'adminProductForm.editVariant' : 'adminProductForm.addVariant')}
      // Wide enough for the two-column FormGrid (container query @lg).
      classNames={{ content: 'max-w-2xl' }}
      contentProps={{
        onOpenAutoFocus: (event) => {
          event.preventDefault();
          requestAnimationFrame(() => {
            const target =
              element.current?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
              element.current?.querySelector<HTMLElement>('input, [role="radio"], button');
            target?.focus();
          });
        },
      }}
    >
      <Form
        ref={element}
        form={form}
        schema={schema}
        className="grid gap-4"
        aria-label={t('adminProductForm.variantSection')}
      >
        {unknownErrors.map(([field, error]) => (
          <Alert key={field} tone="danger">
            {message(error)}
          </Alert>
        ))}
        <FormField name="size" label={t('adminProducts.size')} required binding="value">
          <OptionGroup
            variant="chip"
            options={sizes.map((size) => ({ value: size, label: size }))}
            disabled={disabled}
            onValueChange={(size) => {
              clearErrors(form, ['color']);
              form.setFieldValue('skuSource', skuSource(size, form.state.values.color));
            }}
          />
        </FormField>
        <form.Subscribe selector={(state) => state.values.color}>
          {(selectedColor) => (
            <>
              <FormField
                name="color"
                label={t('adminProducts.color')}
                required
                binding="value"
                mapValue={(value) => matchVariantColor(String(value), colors)?.value ?? value}
              >
                <OptionGroup
                  variant="swatch"
                  showSelectedLabel
                  options={[
                    ...colors,
                    ...(!matchVariantColor(selectedColor, colors) && selectedColor
                      ? [customVariantColor(selectedColor)]
                      : []),
                  ]}
                  disabled={disabled}
                  onValueChange={(color) =>
                    form.setFieldValue('skuSource', skuSource(form.state.values.size, color))
                  }
                />
              </FormField>
              <ColorPicker
                label={t('adminProducts.variant.otherColor')}
                disabled={disabled}
                value={
                  matchVariantColor(selectedColor, colors)?.color ??
                  (selectedColor.startsWith('#') ? selectedColor : '#000000')
                }
                onValueChange={(color) => {
                  form.setFieldValue('color', color.toLowerCase());
                  form.setFieldValue('skuSource', skuSource(form.state.values.size, color));
                }}
              />
            </>
          )}
        </form.Subscribe>
        <FormGrid columns={2}>
          <FormField name="sku" label={t('adminProducts.sku')} required>
            <Input maxLength={120} disabled={disabled} />
          </FormField>
          <FormField name="barcode" label={t('adminProducts.variant.barcode')}>
            <Input inputMode="numeric" maxLength={14} disabled={disabled} />
          </FormField>
          <FormField name="price" label={t('adminProducts.price')} required>
            <NumberInput
              min={0}
              max={2147483647}
              controls={false}
              endAddon="đ"
              disabled={disabled}
            />
          </FormField>
          {!initial.id && (
            <FormField name="stock" label={t('adminProductForm.stock')} required>
              <NumberInput min={0} max={2147483647} disabled={disabled} />
            </FormField>
          )}
          <FormField name="status" label={t('adminProducts.statusLabel')} binding="value">
            <Select
              disabled={disabled}
              options={[
                { value: 'active', label: t('adminProductForm.variantActive') },
                { value: 'inactive', label: t('adminProductForm.variantInactive') },
              ]}
            />
          </FormField>
          <form.Subscribe selector={(state) => state.values.status}>
            {(status) => (
              <FormField name="isDefault" label={t('adminProducts.defaultSku')}>
                {(field) => (
                  <div className="h-control-md flex items-center">
                    <Switch
                      aria-label={t('adminProducts.defaultSku')}
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                      onBlur={field.handleBlur}
                      disabled={disabled || status !== 'active'}
                    />
                  </div>
                )}
              </FormField>
            )}
          </form.Subscribe>
        </FormGrid>
        <OptionGroup
          label={t('adminProductForm.pickProductImages')}
          multiple
          variant="swatch"
          disabled={disabled}
          value={images
            .filter(
              (image) =>
                image.storageId &&
                skuImages.some((selected) => selected.storageId === image.storageId),
            )
            .map((image) => image.key)}
          options={images
            .filter((image) => image.storageId)
            .map((image) => ({ value: image.key, label: image.alt, image: image.url }))}
          onValueChange={(keys) => {
            const selected = images.filter((image) => keys.includes(image.key));
            const next = [
              ...skuImages.filter(
                (image) =>
                  !images.some((entry) => entry.storageId === image.storageId) ||
                  selected.some((entry) => entry.storageId === image.storageId),
              ),
              ...selected.filter(
                (image) => !skuImages.some((entry) => entry.storageId === image.storageId),
              ),
            ];
            if (next.length > MAX_IMAGES) {
              setUploadError(t('adminProductForm.skuImageLimit'));
              return;
            }
            setUploadError('');
            setSkuImages(next);
          }}
        />
        <FormField name="images" label={t('adminProducts.variant.images')}>
          {() => (
            <UploadField
              variant="gallery"
              label={t('adminProducts.variant.images')}
              size="sm"
              classNames={{ label: 'sr-only' }}
              items={skuImages.map((image) => ({
                id: image.key,
                src: image.url,
                alt: image.alt,
                status: image.status,
                progress: image.progress,
                error: image.error,
              }))}
              disabled={disabled}
              accept="image/png,image/jpeg,image/webp"
              maxFiles={MAX_IMAGES}
              hint={t('adminProductForm.imageHint', { count: skuImages.length, max: MAX_IMAGES })}
              onValueChange={(files) => {
                if (disabled) return;
                if (files.length + skuImages.length > MAX_IMAGES) {
                  setUploadError(t('adminProductForm.skuImageLimit'));
                  return;
                }
                setUploadError('');
                upload.add(files);
              }}
              onReject={setUploadError}
              reorder={reorder}
              onItemsReorder={(ids) =>
                setSkuImages((previous) =>
                  ids.flatMap((id) => previous.filter((image) => image.key === id)),
                )
              }
              onItemRemove={(id) => {
                upload.remove(id);
                setSkuImages((previous) => previous.filter((image) => image.key !== id));
              }}
              onItemRetry={(id) => {
                const item = upload.items.find((item) => item.id === id);
                if (item) void upload.retry(item);
              }}
            />
          )}
        </FormField>
        {uploadError && <Alert tone="danger">{uploadError}</Alert>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            <Icon name="close" />
            {t('adminProductForm.cancel')}
          </Button>
          <Button type="submit" disabled={disabled || incomplete}>
            <Icon name="save" />
            {t(initial.sku ? 'adminProductForm.saveVariant' : 'adminProductForm.addVariantSubmit')}
          </Button>
        </div>
      </Form>
    </Dialog>
  );
}
