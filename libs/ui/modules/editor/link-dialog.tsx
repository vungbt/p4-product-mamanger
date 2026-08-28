import { useEffect, useMemo } from 'react';
import { Button } from '../../components/button';
import { Input } from '../../components/input';
import { Form, useAppForm, v } from '../form/form';
import { FormField } from '../form/form-field';
import { ModalBase } from '../modal';
import type { EditorLabels } from './labels';

type LinkDialogProps = {
  isOpen: boolean;
  initialUrl?: string;
  labels: EditorLabels;
  onClose: () => void;
  onSubmit: (url: string) => void;
  onRemove?: () => void;
};

export function LinkDialog({
  isOpen,
  initialUrl,
  labels,
  onClose,
  onSubmit,
  onRemove,
}: LinkDialogProps) {
  const schema = useMemo(
    () => ({
      url: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, labels.linkUrlRequired),
        v.url(labels.linkUrlInvalid),
      ),
    }),
    [labels.linkUrlRequired, labels.linkUrlInvalid],
  );

  const form = useAppForm({
    defaultValues: { url: initialUrl ?? '' },
    onSubmit: ({ value }) => onSubmit(value.url),
  });

  useEffect(() => {
    if (isOpen) form.reset({ url: initialUrl ?? '' });
  }, [isOpen, initialUrl, form.reset]);

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} className="w-full max-w-md">
      <Form form={form} schema={schema} className="flex flex-col gap-4 p-5">
        <p className="text-ui-h3 text-neutral-text-primary">{labels.linkDialogTitle}</p>

        <FormField name="url" label={labels.linkDialogUrlLabel} required className="mb-0">
          <Input autoFocus placeholder={labels.linkDialogUrlPlaceholder} />
        </FormField>

        <div className="flex items-center justify-end gap-2">
          {initialUrl && onRemove && (
            <Button type="button" variant="ghost" color="error" size="small" onClick={onRemove}>
              {labels.linkDialogRemove}
            </Button>
          )}
          <Button type="button" variant="outline" color="neutral" size="small" onClick={onClose}>
            {labels.linkDialogCancel}
          </Button>
          <Button type="submit" size="small">
            {labels.linkDialogSubmit}
          </Button>
        </div>
      </Form>
    </ModalBase>
  );
}
