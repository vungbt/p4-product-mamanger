import { Alert, Button, Dialog, Form, FormField, Icon, Input, Textarea } from '@itclabs/react-ui';
import { RefreshIcon } from '@itclabs/react-ui/icons/outline';
import type { CategoryInput } from '@p4/shared';
import { useTranslation } from 'react-i18next';
import useCategoryEditor from '../hooks/use-category-editor';

export type CategoryEditorProps = {
  initial: CategoryInput & { id?: string };
  pending: boolean;
  onClose: () => void;
  onSave: (value: CategoryInput) => Promise<void>;
};

export default function CategoryEditor({ initial, pending, onClose, onSave }: CategoryEditorProps) {
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
  } = useCategoryEditor({
    initial,
    pending,
    onClose,
    onSave,
  });

  return (
    <Dialog
      open
      onOpenChange={changeOpen}
      title={t(initial.id ? 'categories.edit' : 'categories.add')}
      description={t('categories.editorHint')}
    >
      <Form form={form} schema={schema} className="grid gap-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <FormField name="name" label={t('categories.categoryName')} required className="mb-0">
          <Input
            maxLength={255}
            disabled={pending}
            onChange={(event) => changeName(event.target.value)}
          />
        </FormField>
        <div className="grid gap-1.5">
          <FormField name="slug" className="mb-0">
            {(field) => (
              <div className="flex items-end gap-2">
                <Input
                  label={t('categories.slug')}
                  required
                  rootClassName="min-w-0 flex-1"
                  placeholder="vi-du-danh-muc"
                  maxLength={255}
                  disabled={pending}
                  value={field.state.value}
                  aria-invalid={field.state.meta.errors.length > 0}
                  onChange={(event) => {
                    changeSlug();
                    field.handleChange(event.target.value);
                  }}
                  onBlur={field.handleBlur}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0"
                  disabled={pending}
                  onClick={generateSlug}
                >
                  <Icon glyph={RefreshIcon} />
                  {t('categories.generateSlug')}
                </Button>
              </div>
            )}
          </FormField>
          <p className="text-ui-sm text-muted">{t('categories.slugHint')}</p>
        </div>
        <FormField name="description" label={t('categories.description')} className="mb-0">
          <Textarea rows={3} disabled={pending} onChange={changeDescription} />
        </FormField>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" disabled={pending} onClick={onClose}>
            {t('categories.cancel')}
          </Button>
          <Button type="submit" loading={pending}>
            {t('categories.save')}
          </Button>
        </div>
      </Form>
    </Dialog>
  );
}
