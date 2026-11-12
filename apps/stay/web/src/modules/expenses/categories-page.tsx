import {
  Button,
  Form,
  FormField,
  FormSubmit,
  Icon,
  IconButton,
  Input,
  Switch,
  useAppForm,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import {
  useCreateExpenseCategory,
  useExpenseCategories,
  useUpdateExpenseCategory,
} from '@stay/sdk/react';
import type { StayExpenseCategory } from '@stay/shared';
import { useState } from 'react';
import * as v from 'valibot';
import { FilterBar } from '@/libraries/filter-bar';
import {
  apiFormErrors,
  clearServerErrorOnChange,
  isVersionConflict,
  serverError,
} from '@/libraries/forms/api-errors';
import { ConflictAlert, FormError, LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { useFormDirty } from '@/libraries/forms/use-form-value';
import { ScreenHeader } from '@/libraries/screen-header';

function CategoryForm({
  category,
  onDone,
  onReload,
}: {
  category?: StayExpenseCategory;
  onDone: () => void;
  onReload: () => void;
}) {
  const create = useCreateExpenseCategory();
  const update = useUpdateExpenseCategory();
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);

  const form = useAppForm({
    defaultValues: { name: category?.name ?? '', active: category?.active ?? true },
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      setError(null);
      setConflict(false);
      try {
        if (category)
          await update.mutateAsync({
            id: category.id,
            body: { ...value, version: category.version },
          });
        else await create.mutateAsync(value);
        form.reset();
        toast.success('Đã lưu danh mục.');
        onDone();
      } catch (cause) {
        if (isVersionConflict(cause)) {
          setConflict(true);
          return;
        }
        const errors = apiFormErrors(cause, ['name', 'active'], 'Không thể lưu danh mục.');

        for (const field of ['name', 'active'] as const)
          if (errors.fields[field]) form.setFieldMeta(field, serverError(errors.fields[field]));
        setError(errors.message);
      }
    },
  });

  const dirty = useFormDirty(form);
  const { prompt } = useUnsavedChanges(dirty);

  return (
    <Form
      form={form}
      schema={{
        name: v.pipe(v.string(), v.trim(), v.minLength(1, 'Nhập tên danh mục.'), v.maxLength(120)),
        active: v.boolean(),
      }}
      className="grid gap-4 rounded-panel border border-line bg-surface p-4"
      aria-label="Danh mục chi phí"
    >
      {prompt}
      <FormError message={error} />
      {conflict ? <ConflictAlert onReload={onReload} /> : null}
      <FormField name="name" label="Tên danh mục" required>
        <Input maxLength={120} />
      </FormField>
      <FormField name="active">
        <Switch label="Đang hoạt động" />
      </FormField>
      <p className="text-muted">Tắt danh mục để ngừng sử dụng; chi phí cũ vẫn được giữ.</p>
      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            form.reset();
            onDone();
          }}
        >
          Huỷ
        </Button>
        <FormSubmit form={form}>
          {(submitting) => (
            <Button type="submit" loading={submitting}>
              Lưu danh mục
            </Button>
          )}
        </FormSubmit>
      </div>
    </Form>
  );
}

export default function ExpenseCategoriesPage() {
  const categories = useExpenseCategories();
  const [editing, setEditing] = useState<StayExpenseCategory | 'new' | null>(null);

  return (
    <div className="grid gap-5">
      <ScreenHeader title="Danh mục chi phí" />
      <FilterBar
        actions={
          <Button onClick={() => setEditing('new')}>
            <Icon name="plus" className="size-4" aria-hidden />
            Thêm danh mục
          </Button>
        }
      />
      {editing ? (
        <CategoryForm
          key={editing === 'new' ? 'new' : editing.id}
          category={editing === 'new' ? undefined : editing}
          onDone={() => setEditing(null)}
          onReload={() => {
            setEditing(null);
            void categories.refetch();
          }}
        />
      ) : null}
      {categories.isLoading ? (
        <LoadingRows />
      ) : categories.isError ? (
        <LoadError error={categories.error} onRetry={() => void categories.refetch()} />
      ) : (
        <ul className="grid gap-3">
          {categories.data?.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between gap-3 rounded-panel border border-line bg-surface p-4"
            >
              <div>
                <strong>{category.name}</strong>
                <p className="text-muted">{category.active ? 'Đang hoạt động' : 'Đã tắt'}</p>
              </div>
              <IconButton
                icon="edit"
                label={`Sửa ${category.name}`}
                variant="ghost"
                onClick={() => setEditing(category)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
