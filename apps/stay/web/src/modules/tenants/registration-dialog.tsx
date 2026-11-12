import {
  Button,
  DatePicker,
  Form,
  FormActions,
  FormField,
  FormGrid,
  FormLayout,
  FormSection,
  FormSubmit,
  Textarea,
  useAppForm,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useRegisterResident } from '@stay/sdk/react';
import type { StayResident } from '@stay/shared';
import { useState } from 'react';
import * as v from 'valibot';
import { todayIsoDate } from '@/libraries/format';
import { apiFormErrors, clearServerErrorOnChange, serverError } from '@/libraries/forms/api-errors';
import { DATE_FIELD } from '@/libraries/forms/date-field';
import { FormError } from '@/libraries/forms/page-states';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { useFormDirty } from '@/libraries/forms/use-form-value';
import { Overlay } from '@/modules/invoices/invoice-dialogs';

export function RegistrationDialog({
  resident,
  onClose,
}: {
  resident: StayResident;
  onClose: () => void;
}) {
  const registration = useRegisterResident();
  const [error, setError] = useState<string | null>(null);
  const today = todayIsoDate();

  const form = useAppForm({
    defaultValues: { registeredOn: resident.registeredOn ?? today, note: '' },
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await registration.mutateAsync({ id: resident.occupantId, body: value });
        form.reset();
        toast.success('Đã đánh dấu khai báo tạm trú.');
        onClose();
      } catch (cause) {
        const errors = apiFormErrors(cause, ['registeredOn', 'note'], 'Không thể lưu khai báo.');

        for (const field of ['registeredOn', 'note'] as const)
          if (errors.fields[field]) form.setFieldMeta(field, serverError(errors.fields[field]));
        setError(errors.message);
      }
    },
  });

  useUnsavedChanges(useFormDirty(form));

  const close = () => {
    if (registration.isPending) return;
    form.reset();
    onClose();
  };

  return (
    <Overlay
      title="Đánh dấu đã khai báo"
      description={`${resident.fullName} · Phòng ${resident.roomCode}`}
      onClose={close}
    >
      <Form
        form={form}
        schema={{
          registeredOn: v.pipe(
            v.string(),
            v.isoDate('Chọn ngày hợp lệ.'),
            v.check(
              (value) => value >= resident.arrivalDate && value <= today,
              'Ngày khai báo phải từ ngày đến tới hôm nay.',
            ),
          ),
          note: v.pipe(v.string(), v.maxLength(2000)),
        }}
        className="grid min-w-0 gap-4"
        aria-label="Khai báo tạm trú"
      >
        <FormLayout size="full">
          <FormSection>
            <FormGrid columns={1}>
              <FormError message={error} />
              <FormField name="registeredOn" label="Ngày khai báo" required {...DATE_FIELD}>
                <DatePicker minDate={resident.arrivalDate} maxDate={today} clearable={false} />
              </FormField>
              <FormField name="note" label="Ghi chú">
                <Textarea maxLength={2000} />
              </FormField>
            </FormGrid>
          </FormSection>
          <FormActions>
            <Button variant="secondary" disabled={registration.isPending} onClick={close}>
              Huỷ
            </Button>
            <FormSubmit form={form}>
              {(submitting) => (
                <Button type="submit" loading={submitting}>
                  Lưu khai báo
                </Button>
              )}
            </FormSubmit>
          </FormActions>
        </FormLayout>
      </Form>
    </Overlay>
  );
}
