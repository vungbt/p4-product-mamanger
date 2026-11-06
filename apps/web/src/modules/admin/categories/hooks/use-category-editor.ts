import { useAppForm } from '@itclabs/react-ui';
import { getErrorMessage } from '@p4/api-sdk/shared';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';
import type { CategoryEditorProps } from '../components/category-editor';

function slugFromName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 255)
    .replace(/-+$/g, '');
}

export default function useCategoryEditor({
  initial,
  pending,
  onClose,
  onSave,
}: CategoryEditorProps) {
  const { t } = useTranslation();

  const [error, setError] = useState('');

  const manualSlug = useRef(Boolean(initial.id || initial.slug));

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
      clearFieldErrors();

      try {
        await onSave({
          name: value.name.trim(),
          slug: value.slug.trim(),
          description: value.description.trim(),
        });
      } catch (cause) {
        const payload = cause && typeof cause === 'object' && 'data' in cause ? cause.data : cause;
        const extensions =
          payload && typeof payload === 'object' && 'extensions' in payload
            ? payload.extensions
            : undefined;
        let hasFieldErrors = false;
        let hasOtherErrors = false;

        if (extensions && typeof extensions === 'object') {
          for (const [field, messages] of Object.entries(extensions)) {
            if (!['name', 'slug', 'description'].includes(field)) {
              hasOtherErrors = true;
              continue;
            }
            const message = (Array.isArray(messages) ? messages : [messages])
              .filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
              .join(' ');

            if (!message) {
              hasOtherErrors = true;
              continue;
            }

            form.setFieldMeta(field as 'name' | 'slug' | 'description', (previous) => ({
              ...previous,
              isTouched: true,
              errorMap: { ...previous.errorMap, onServer: message },
            }));
            hasFieldErrors = true;
          }
        }

        if (!hasFieldErrors || hasOtherErrors) {
          setError(getErrorMessage(cause, t('categories.saveFailed')));
        }
      }
    },
  });

  const clearFieldError = (field: 'name' | 'slug' | 'description') => {
    form.setFieldMeta(field, (previous) => ({
      ...previous,
      errorMap: { ...previous.errorMap, onServer: undefined },
    }));
  };

  const clearFieldErrors = () => {
    for (const field of ['name', 'slug', 'description'] as const) clearFieldError(field);
  };

  const changeDescription = () => clearFieldError('description');

  const changeName = (name: string) => {
    clearFieldError('name');

    if (!manualSlug.current) {
      clearFieldError('slug');
      form.setFieldValue('slug', slugFromName(name));
    }
  };

  const changeSlug = () => {
    clearFieldError('slug');
    manualSlug.current = true;
  };

  const generateSlug = () => {
    clearFieldError('slug');
    form.setFieldValue('slug', slugFromName(form.state.values.name));
    manualSlug.current = false;
  };

  const changeOpen = (open: boolean) => {
    if (!open && !pending) onClose();
  };

  return {
    form,
    schema,
    error,
    changeOpen,
    changeName,
    changeSlug,
    generateSlug,
    changeDescription,
  };
}
