import {
  Button,
  DatePicker,
  Dialog,
  Form,
  FormActions,
  FormField,
  FormGrid,
  FormLayout,
  FormSection,
  FormSubmit,
  NumberInput,
  Select,
  Textarea,
  useAppForm,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useCreateDeposit } from '@stay/sdk/react';
import { ApiSdkError } from '@stay/sdk/shared';
import { type DepositInput, isIsoDate } from '@stay/shared';
import { useState } from 'react';
import * as v from 'valibot';
import { todayIsoDate } from '@/libraries/format';
import { apiFormErrors, clearServerErrorOnChange, serverError } from '@/libraries/forms/api-errors';
import { DATE_FIELD } from '@/libraries/forms/date-field';
import { FormError } from '@/libraries/forms/page-states';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { useFormDirty, useFormValue } from '@/libraries/forms/use-form-value';

export const DEPOSIT_ACTIONS = [
  { value: 'received', label: 'Thu thêm cọc', icon: 'plus' },
  { value: 'refunded', label: 'Hoàn cọc', icon: 'rotateLeft' },
  { value: 'forfeited', label: 'Mất cọc', icon: 'delete' },
] as const;

const FIELDS = ['type', 'amount', 'occurredOn', 'method', 'reason'] as const;
const schema = {
  type: v.picklist(['received', 'refunded', 'forfeited']),
  amount: v.pipe(
    v.number('Nhập số tiền.'),
    v.integer('Nhập số nguyên đồng.'),
    v.minValue(1, 'Số tiền phải lớn hơn 0.'),
    v.maxValue(Number.MAX_SAFE_INTEGER),
  ),
  occurredOn: v.pipe(
    v.string(),
    v.check((value: string) => isIsoDate(value), 'Ngày không hợp lệ.'),
  ),
  method: v.picklist(['cash', 'bank_transfer', 'other']),
  reason: v.pipe(v.string(), v.maxLength(2000)),
};

export function DepositEntryDialog({
  contractId,
  type,
  onClose,
}: {
  contractId: string;
  type: DepositInput['type'];
  onClose: () => void;
}) {
  const create = useCreateDeposit();
  const [error, setError] = useState<string | null>(null);
  const [key] = useState(() => crypto.randomUUID());
  const form = useAppForm({
    defaultValues: {
      type,
      amount: null as number | null,
      occurredOn: todayIsoDate(),
      method: 'bank_transfer' as DepositInput['method'],
      reason: '',
    },
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      setError(null);
      if (value.type === 'forfeited' && !value.reason.trim()) {
        form.setFieldMeta('reason', serverError('Nhập lý do mất cọc.'));
        return;
      }
      try {
        await create.mutateAsync({
          id: contractId,
          idempotencyKey: key,
          body: { ...value, amount: value.amount ?? 0, reason: value.reason.trim() || null },
        });
        form.reset();
        toast.success('Đã ghi bút toán cọc.');
        onClose();
      } catch (cause) {
        if (cause instanceof ApiSdkError && cause.status === 422) {
          setError('Số dư cọc không đủ hoặc số tiền vượt giới hạn. Vui lòng kiểm tra lại sổ cọc.');
          return;
        }
        const errors = apiFormErrors(cause, FIELDS, 'Không thể ghi bút toán cọc.');

        for (const field of FIELDS)
          if (errors.fields[field]) form.setFieldMeta(field, serverError(errors.fields[field]));
        setError(errors.message);
      }
    },
  });
  const dirty = useFormDirty(form);
  const selectedType = useFormValue(form, (state) => state.values.type);
  const { prompt } = useUnsavedChanges(dirty);

  const close = () => {
    if (create.isPending) return;
    form.reset();
    onClose();
  };

  return (
    <Dialog
      open
      title="Bút toán cọc"
      description="Bút toán đã ghi không thể sửa hoặc xoá. Sửa sai bằng bút toán mới."
      onOpenChange={(open) => {
        if (!open) close();
      }}
      contentProps={{ onInteractOutside: (event) => event.preventDefault() }}
    >
      <Form noValidate form={form} schema={schema} className="grid gap-4" aria-label="Bút toán cọc">
        <FormLayout size="full">
          <FormSection>
            <FormGrid columns={1}>
              {prompt}
              <FormError message={error} />
              <FormField name="type" label="Loại" required>
                <Select options={[...DEPOSIT_ACTIONS]} />
              </FormField>
              <FormField name="amount" label="Số tiền" required>
                <NumberInput
                  min={1}
                  max={Number.MAX_SAFE_INTEGER}
                  step={1}
                  inputMode="numeric"
                  endAddon="₫"
                />
              </FormField>
              <FormField name="occurredOn" label="Ngày" required {...DATE_FIELD}>
                <DatePicker clearable={false} />
              </FormField>
              <FormField name="method" label="Phương thức" required>
                <Select
                  options={[
                    { value: 'cash', label: 'Tiền mặt' },
                    { value: 'bank_transfer', label: 'Chuyển khoản' },
                    { value: 'other', label: 'Khác' },
                  ]}
                />
              </FormField>
              <FormField name="reason" label="Lý do" required={selectedType === 'forfeited'}>
                <Textarea maxLength={2000} />
              </FormField>
            </FormGrid>
          </FormSection>
          <FormActions>
            <Button variant="secondary" disabled={create.isPending} onClick={close}>
              Huỷ
            </Button>
            <FormSubmit form={form}>
              {(submitting) => (
                <Button type="submit" loading={submitting}>
                  Ghi bút toán
                </Button>
              )}
            </FormSubmit>
          </FormActions>
        </FormLayout>
      </Form>
    </Dialog>
  );
}
