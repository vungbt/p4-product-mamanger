import {
  Alert,
  Button,
  Form,
  FormActions,
  FormField,
  FormGrid,
  FormLayout,
  FormSection,
  Icon,
  Input,
  NumberInput,
  Textarea,
} from '@itclabs/react-ui';
import { Editor } from '@itclabs/react-ui/editor';
import type { ProductDetail } from '@p4/api-sdk/shared';
import type { ProductVariant } from '@p4/shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '@/libraries/confirm';
import { CategorySelect, SizeGuideSelect } from '@/libraries/selects';
import { DetailPage } from '@/modules/admin/layout/detail-page';
import {
  type ProductFormValues,
  useProductForm,
} from '@/modules/admin/products/hooks/use-product-form';
import { ProductGallery } from './product-gallery';
import { SeoPreview } from './seo-preview';
import { VariantsSection } from './variants-section';

const seoFields = ['seoTitle', 'seoDescription', 'name', 'slug', 'description'] as const;

export function ProductEditor({
  initial,
  reload,
  initialVariants,
  reloadVariants,
}: {
  initial?: ProductDetail;
  initialVariants: ProductVariant[];
  reloadVariants: () => Promise<ProductVariant[]>;
  reload: () => Promise<ProductDetail | undefined>;
}) {
  const { t } = useTranslation();

  const confirm = useConfirm();

  const state = useProductForm(initial, reload, initialVariants, reloadVariants);

  const selectSeoValues = useMemo(() => {
    let previous: Pick<ProductFormValues, (typeof seoFields)[number]> | undefined;

    return ({ values }: { values: ProductFormValues }) => {
      if (previous && seoFields.every((field) => previous?.[field] === values[field])) {
        return previous;
      }

      const { seoTitle, seoDescription, name, slug, description } = values;
      previous = { seoTitle, seoDescription, name, slug, description };
      return previous;
    };
  }, []);

  const { form, schema, saving, deleting } = state;
  const disabled = saving || deleting;

  return (
    <DetailPage
      title={t(initial ? 'adminProductForm.edit' : 'adminProductForm.create')}
      back={{
        label: t(
          state.returnToList ? 'adminProductForm.backToList' : 'adminProductForm.backToProduct',
        ),
        onClick: () => state.leave(),
      }}
    >
      {!initial && <p className="text-ui-sm text-muted">{t('adminProductForm.draftHint')}</p>}
      <Form
        form={form}
        schema={schema}
        aria-label={t(initial ? 'adminProductForm.edit' : 'adminProductForm.create')}
      >
        <FormLayout size="full">
          {state.error && (
            <Alert tone="danger" role="alert">
              {state.error}
            </Alert>
          )}
          {state.conflict && (
            <Alert
              tone="warning"
              action={
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={disabled}
                  onClick={() =>
                    void confirm({
                      title: t('adminProductForm.reload'),
                      description: t('adminProductForm.reloadConfirm'),
                      confirmLabel: t('adminProductForm.reload'),
                      confirmIcon: 'refresh',
                      onConfirm: state.reloadSnapshot,
                    })
                  }
                >
                  <Icon name="refresh" />
                  {t('adminProductForm.reload')}
                </Button>
              }
            >
              {t('adminProductForm.conflict')}
            </Alert>
          )}

          <FormSection variant="card" title={t('adminProductForm.generalSection')}>
            <FormGrid columns={2}>
              <FormField name="name" label={t('adminProductForm.name')} required>
                <Input maxLength={255} disabled={disabled} />
              </FormField>
              <FormField name="slug" label={t('adminProductForm.slug')} required>
                <Input maxLength={160} disabled={disabled} />
              </FormField>
              <FormField
                name="categoryId"
                label={t('adminProductForm.categoryId')}
                binding="value"
                mapValue={(value) => value || null}
                mapOnChange={(value) => value ?? ''}
              >
                <CategorySelect disabled={disabled} clearable={!initial} />
              </FormField>
              <FormField
                name="sizeGuideId"
                label={t('adminProductForm.sizeGuideId')}
                binding="value"
                mapValue={(value) => value || null}
                mapOnChange={(value) => value ?? ''}
              >
                <SizeGuideSelect disabled={disabled} clearable={!initial} />
              </FormField>
            </FormGrid>
          </FormSection>

          <FormSection variant="card" title={t('adminProductForm.priceSection')}>
            <FormGrid columns={3}>
              <FormField name="price" label={t('adminProductForm.price')} required>
                <NumberInput
                  min={0}
                  max={2147483647}
                  controls={false}
                  endAddon="đ"
                  disabled={disabled}
                />
              </FormField>
              <FormField name="brand" label={t('adminProductForm.brand')}>
                <Input maxLength={255} disabled={disabled} />
              </FormField>
              <FormField name="material" label={t('adminProductForm.material')}>
                <Input maxLength={255} disabled={disabled} />
              </FormField>
              {!initial && !state.rows.length && (
                <FormField name="stock" label={t('adminProductForm.stock')} required>
                  <NumberInput min={0} max={2147483647} disabled={disabled} />
                </FormField>
              )}
            </FormGrid>
          </FormSection>

          <form.Subscribe selector={(state) => state.values}>
            {(values) => (
              <VariantsSection
                images={state.images}
                rows={state.rows}
                baseline={state.variantBaseline}
                onChange={state.setRows}
                errors={state.rowErrors}
                disabled={disabled}
                slug={values.slug}
                price={values.price ?? 0}
                sizeGuideId={values.sizeGuideId}
              />
            )}
          </form.Subscribe>

          <FormSection variant="card" title={t('adminProductForm.descriptionSection')}>
            <FormGrid columns={1}>
              <FormField
                name="description"
                label={t('adminProductForm.description')}
                binding="value"
              >
                <Editor disabled={disabled} />
              </FormField>
              <FormField name="careInstructions" label={t('adminProductForm.careInstructions')}>
                <Textarea rows={3} maxLength={10000} disabled={disabled} />
              </FormField>
            </FormGrid>
          </FormSection>

          <FormSection
            variant="card"
            title={t('adminProductForm.gallery')}
            description={t('adminProductForm.galleryHint')}
          >
            <ProductGallery
              images={state.images}
              upload={state.upload}
              disabled={disabled}
              onRemove={state.removeImage}
              onItemsReorder={state.onItemsReorder}
            />
          </FormSection>

          <FormSection variant="card" title={t('adminProductForm.seoSection')}>
            <form.Subscribe selector={selectSeoValues}>
              {(values) => (
                <FormGrid columns={1} classNames={{ grid: 'lg:grid-cols-2 lg:items-stretch' }}>
                  <FormGrid columns={1}>
                    <FormField name="seoTitle" label={t('adminProductForm.seoTitle')}>
                      <Input
                        maxLength={255}
                        hint={t('adminProductForm.seoTitleHint', { count: values.seoTitle.length })}
                        disabled={disabled}
                      />
                    </FormField>
                    <FormField name="seoDescription" label={t('adminProductForm.seoDescription')}>
                      <Textarea
                        rows={3}
                        hint={t('adminProductForm.seoDescriptionHint', {
                          count: values.seoDescription.length,
                        })}
                        maxLength={255}
                        disabled={disabled}
                      />
                    </FormField>
                  </FormGrid>
                  <SeoPreview {...values} />
                </FormGrid>
              )}
            </form.Subscribe>
          </FormSection>

          <FormActions
            sticky
            // P4 pages sit on the canvas with card sections, so the sticky bar is a card too.
            className="bottom-4 rounded-panel border px-4 shadow-panel"
            start={
              initial && (
                <Button
                  type="button"
                  variant="danger"
                  disabled={disabled || state.upload.busy}
                  onClick={() =>
                    void confirm({
                      title: t('adminProductForm.delete'),
                      description: t('adminProductForm.deleteConfirm', { name: initial.name }),
                      tone: 'danger',
                      confirmLabel: t('adminProductForm.delete'),
                      onConfirm: state.deleteConfirmed,
                    })
                  }
                >
                  <Icon name="delete" />
                  {t('adminProductForm.delete')}
                </Button>
              )
            }
          >
            <Button
              type="button"
              variant="secondary"
              disabled={disabled}
              onClick={() => state.leave()}
            >
              <Icon name="close" />
              {t('adminProductForm.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              disabled={deleting || state.uploadsIncomplete}
            >
              <Icon name="save" />
              {t(initial ? 'adminProductForm.save' : 'adminProductForm.createDraft')}
            </Button>
          </FormActions>
        </FormLayout>
      </Form>
    </DetailPage>
  );
}
