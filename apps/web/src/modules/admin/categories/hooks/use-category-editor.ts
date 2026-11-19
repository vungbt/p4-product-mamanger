import { clearErrors, setErrors, slugify, useAppForm, useLinkedField } from '@itclabs/react-ui';
import { ApiSdkError, getErrorMessage } from '@p4/api-sdk/shared';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';
import type { CategoryEditorProps } from '@/modules/admin/categories/components/category-editor';

export default function useCategoryEditor({
  initial,
  pending,
  onClose,
  onSave,
}: CategoryEditorProps) {
  const { t } = useTranslation();

  const [error, setError] = useState('');

  const schema = useMemo(
    () => ({
      name: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, t('categories.nameRequired')),
        v.maxLength(255, t('categories.tooLong')),
      ),
      slug: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, t('categories.slugRequired')),
        v.maxLength(255, t('categories.tooLong')),
        v.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t('categories.slugInvalid')),
      ),
      description: v.string(),
    }),
    [t],
  );

  const form = useAppForm({
    defaultValues: {
      name: initial.name,
      slug: initial.slug,
      description: initial.description ?? '',
    },
    onSubmit: async ({ value }) => {
      if (pending) return;
      setError('');
      clearErrors(form);

      try {
        await onSave({
          name: value.name.trim(),
          slug: value.slug.trim(),
          description: value.description.trim(),
        });
      } catch (cause) {
        const unmatched =
          cause instanceof ApiSdkError ? setErrors(form, cause.fieldErrors).unmatched : [];

        if (
          !(cause instanceof ApiSdkError) ||
          !Object.keys(cause.fieldErrors).length ||
          unmatched.length
        ) {
          const message = getErrorMessage(cause, t('categories.saveFailed'));
          setError(unmatched.length ? `${message} (${unmatched.join(', ')})` : message);
        }
      }
    },
  });

  const { relink } = useLinkedField(form, {
    source: 'name',
    target: 'slug',
    transform: (value) => slugify(value, { maxLength: 255 }),
    initiallyLinked: !initial.id && !initial.slug,
  });

  const changeOpen = (open: boolean) => {
    if (!open && !pending) onClose();
  };

  return {
    form,
    schema,
    error,
    changeOpen,
    generateSlug: relink,
  };
}
