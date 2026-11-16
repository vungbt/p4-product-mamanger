import { Alert, Button, Dialog, Form, FormField, Icon, Input, Textarea } from '@itclabs/react-ui';
import type { ProductInput } from '@p4/api-sdk/shared';
import { useTranslation } from 'react-i18next';
import useProductEditor from '../hooks/use-products-editor';

export type ProductEditorProps = {
  initial: ProductInput & { id?: string };
  pending: boolean;
  onClose: () => void;
  onSave: (value: ProductInput) => Promise<void>;
};

export default function ProductEditor({ initial, pending, onClose, onSave }: ProductEditorProps) {
  const { t } = useTranslation();

  const {
    form,
    schema,
    error,
    changeOpen,
    changeName,
    changeSlug,
    generateSlug,
    changeDescription,
    changeImage,
  } = useProductEditor({
    initial,
    pending,
    onClose,
    onSave,
  });

  return (
    <Dialog
      open
      onOpenChange={changeOpen}
      title={t(initial.id ? 'products.edit' : 'products.add')}
      description={t('products.editorHint')}
    >
      <Form form={form} schema={schema} className="grid gap-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <FormField name="name" label={t('products.productName')} required className="">
          <Input
            maxLength={255}
            disabled={pending}
            onChange={(event) => changeName(event.target.value)}
          />
        </FormField>
        <div className="grid gap-4">
          <FormField name="slug" className="mb-0">
            {(field) => (
              <div className="flex items-end gap-2">
                <Input
                  label={t('products.slug')}
                  required
                  rootClassName=""
                  placeholder=""
                  maxLength={255}
                  disabled={pending}
                  value={field.state.value}
                  aria-invalid={field.state.meta.errors.length > 0}
                  onChange={(event) => {
                    changeSlug();
                    field.handleChange(event.target.value);
                  }}
                />
                <Button
                  type="button"
                  variant={'secondary'}
                  className=""
                  disabled={pending}
                  onClick={generateSlug}
                >
                  <Icon name="refresh" />
                  {t('products.generateSlug')}
                </Button>
              </div>
            )}
          </FormField>
          <p className="text-ui-sm text-muted">{t('products.slugHint')}</p>
          <FormField name="image" label={t('products.showcaseImage')} className="">
            <Input
              type="url"
              disabled={pending}
              onChange={(event) => changeImage(event.target.value)}
            />
          </FormField>
          <FormField name="price" label={t('products.price')} required className="">
            <Input type="number" min={0} disabled={pending} placeholder="0" />
          </FormField>
          <FormField name="stock" label={t('products.stock')} className="">
            <Input type="number" min={0} disabled={pending} placeholder="0" />
          </FormField>
          <FormField name="description" label={t('products.description')} className="">
            <Textarea rows={3} disabled={pending} onChange={changeDescription} />
          </FormField>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant={'secondary'} disabled={pending} onClick={onClose}>
            {t('products.cancel')}
          </Button>
          <Button type="submit" loading={pending}>
            {t('products.save')}
          </Button>
        </div>
      </Form>
    </Dialog>
  );
}
