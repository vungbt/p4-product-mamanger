import {
  Button,
  DatePicker,
  Form,
  FormField,
  FormSubmit,
  Input,
  NumberInput,
  Select,
  Textarea,
  useAppForm,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useCreateExpense, useStaySdk, useUpdateExpense } from '@stay/sdk/react';
import { createUploadApi } from '@stay/sdk/shared';
import {
  isIsoDate,
  STAY_UPLOAD_MAX_BYTES,
  STAY_UPLOAD_MIME_TYPES,
  type StayExpense,
  type StayExpenseCategory,
} from '@stay/shared';
import { useMemo, useState } from 'react';
import * as v from 'valibot';
import { todayIsoDate } from '@/libraries/format';
import {
  apiFormErrors,
  clearServerErrorOnChange,
  isVersionConflict,
  serverError,
} from '@/libraries/forms/api-errors';
import { DATE_FIELD } from '@/libraries/forms/date-field';
import { ConflictAlert, FormError } from '@/libraries/forms/page-states';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { useFormDirty } from '@/libraries/forms/use-form-value';

const FIELDS = ['amount', 'categoryId', 'spentOn', 'roomId', 'note', 'receiptFileId'] as const;
const schema = {
  amount: v.pipe(
    v.number('Nhập số tiền.'),
    v.integer('Số tiền phải là số nguyên.'),
    v.minValue(1, 'Số tiền phải lớn hơn 0.'),
    v.maxValue(Number.MAX_SAFE_INTEGER),
  ),
  categoryId: v.pipe(v.string(), v.minLength(1, 'Chọn danh mục.')),
  spentOn: v.pipe(
    v.string(),
    v.check((value: string) => isIsoDate(value), 'Ngày chi không hợp lệ.'),
  ),
  roomId: v.string(),
  note: v.pipe(v.string(), v.maxLength(2000)),
  receiptFileId: v.string(),
};

export function ExpenseForm({
  buildingId,
  categories,
  rooms,
  expense,
  onDone,
  onReload,
}: {
  buildingId: string;
  categories: StayExpenseCategory[];
  rooms: { id: string; code: string }[];
  expense?: StayExpense;
  onDone: () => void;
  onReload: () => void;
}) {
  const create = useCreateExpense();
  const update = useUpdateExpense();
  const sdk = useStaySdk();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const uploader = useMemo(() => createUploadApi(sdk, { baseUrl: window.location.origin }), [sdk]);

  const form = useAppForm({
    defaultValues: {
      amount: expense?.amount ?? (null as number | null),
      categoryId: expense?.categoryId ?? '',
      spentOn: expense?.spentOn ?? todayIsoDate(),
      roomId: expense?.roomId ?? '',
      note: expense?.note ?? '',
      receiptFileId: expense?.receiptFileId ?? '',
    },
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      setError(null);
      setConflict(false);
      try {
        let receiptFileId = value.receiptFileId || null;

        if (file) {
          if (
            !STAY_UPLOAD_MIME_TYPES.some((type) => type === file.type) ||
            file.size > STAY_UPLOAD_MAX_BYTES
          ) {
            form.setFieldMeta(
              'receiptFileId',
              serverError('Chọn ảnh JPG, PNG hoặc WEBP tối đa 10 MB.'),
            );
            return;
          }
          receiptFileId = await uploader.uploadImage({
            purpose: 'expense_receipt',
            buildingId,
            file,
          });
          form.setFieldValue('receiptFileId', receiptFileId);
          setFile(null);
        }
        const body = {
          buildingId,
          amount: value.amount ?? 0,
          categoryId: value.categoryId,
          spentOn: value.spentOn,
          roomId: value.roomId || null,
          note: value.note || null,
          receiptFileId,
        };

        if (expense)
          await update.mutateAsync({ id: expense.id, body: { ...body, version: expense.version } });
        else await create.mutateAsync(body);
        form.reset();
        toast.success('Đã lưu chi phí.');
        onDone();
      } catch (cause) {
        if (isVersionConflict(cause)) {
          setConflict(true);
          return;
        }
        const errors = apiFormErrors(cause, FIELDS, 'Không thể lưu chi phí.');

        for (const field of FIELDS)
          if (errors.fields[field]) form.setFieldMeta(field, serverError(errors.fields[field]));
        setError(errors.message);
      }
    },
  });

  const dirty = useFormDirty(form);
  const { prompt } = useUnsavedChanges(dirty || Boolean(file));

  return (
    <Form
      form={form}
      schema={schema}
      className="grid gap-4 rounded-panel border border-line bg-surface p-4"
      aria-label={expense ? 'Sửa chi phí' : 'Thêm chi phí'}
    >
      {prompt}
      <h2 className="font-semibold">{expense ? 'Sửa chi phí' : 'Thêm chi phí'}</h2>
      <FormError message={error} />
      {conflict ? <ConflictAlert onReload={onReload} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField name="amount" label="Số tiền" required>
          <NumberInput
            min={1}
            max={Number.MAX_SAFE_INTEGER}
            step={1}
            endAddon="₫"
            inputMode="numeric"
          />
        </FormField>
        <FormField name="categoryId" label="Danh mục" required>
          <Select
            options={categories
              .filter((category) => category.active || category.id === expense?.categoryId)
              .map((category) => ({ value: category.id, label: category.name }))}
          />
        </FormField>
        <FormField name="spentOn" label="Ngày chi" required {...DATE_FIELD}>
          <DatePicker clearable={false} />
        </FormField>
        <FormField name="roomId" label="Phòng" mapOnChange={(value) => value ?? ''}>
          <Select
            clearable
            options={[
              { value: '', label: 'Cả toà' },
              ...rooms.map((room) => ({ value: room.id, label: room.code })),
            ]}
          />
        </FormField>
      </div>
      <FormField name="note" label="Ghi chú">
        <Textarea maxLength={2000} />
      </FormField>
      <FormField name="receiptFileId" label="Ảnh hoá đơn">
        {() => (
          <Input
            aria-label="Ảnh hoá đơn"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        )}
      </FormField>
      {expense?.receipt ? (
        <a
          className="text-accent underline"
          href={expense.receipt.url}
          target="_blank"
          rel="noreferrer"
        >
          Xem ảnh hoá đơn hiện tại
        </a>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            form.reset();
            setFile(null);
            onDone();
          }}
        >
          Huỷ
        </Button>
        <FormSubmit form={form}>
          {(submitting) => (
            <Button type="submit" loading={submitting}>
              Lưu chi phí
            </Button>
          )}
        </FormSubmit>
      </div>
    </Form>
  );
}
