import {
  Button,
  Checkbox,
  DatePicker,
  Dialog,
  Form,
  FormActions,
  FormField,
  FormGrid,
  FormLayout,
  FormSection,
  FormSubmit,
  Input,
  NumberInput,
  useAppForm,
} from '@itclabs/react-ui';
import { useReplaceMeter } from '@stay/sdk/react';
import { getErrorMessage } from '@stay/sdk/shared';
import { isIsoDate, METER_READING_MAX, type ReadingMeter } from '@stay/shared';
import { useRef, useState } from 'react';
import * as v from 'valibot';
import { todayIsoDate } from '@/libraries/format';
import { DATE_FIELD } from '@/libraries/forms/date-field';
import { FormError } from '@/libraries/forms/page-states';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { useFormDirty } from '@/libraries/forms/use-form-value';

const schema = {
  finalReading: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(METER_READING_MAX)),
  initialReading: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(METER_READING_MAX)),
  replacedOn: v.pipe(
    v.string(),
    v.check((value: string) => isIsoDate(value), 'Ngày không hợp lệ.'),
  ),
  serial: v.pipe(v.string(), v.maxLength(40)),
  confirmHighConsumption: v.boolean(),
};

export function ReplacementDialog({
  meter,
  onClose,
  onReplaced,
}: {
  meter: ReadingMeter;
  onClose: () => void;
  onReplaced: () => void;
}) {
  const mutation = useReplaceMeter();
  const [error, setError] = useState<string | null>(null);
  const attempt = useRef({ payload: '', key: crypto.randomUUID() });
  const form = useAppForm({
    defaultValues: {
      finalReading: meter.current?.reading ?? meter.previous,
      initialReading: 0,
      replacedOn: todayIsoDate(),
      serial: '',
      confirmHighConsumption: false,
    },
    onSubmit: async ({ value }) => {
      try {
        const payload = JSON.stringify(value);
        if (attempt.current.payload !== payload)
          attempt.current = { payload, key: crypto.randomUUID() };
        await mutation.mutateAsync({
          id: meter.meterId,
          body: value,
          idempotencyKey: attempt.current.key,
        });
        form.reset();
        onReplaced();
        onClose();
      } catch (cause) {
        setError(getErrorMessage(cause, 'Không thể thay đồng hồ.'));
      }
    },
  });
  useUnsavedChanges(useFormDirty(form));

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) onClose();
      }}
      title="Thay đồng hồ"
      description="Tiêu thụ kỳ này gồm hai đoạn: đồng hồ cũ và đồng hồ mới."
    >
      <Form form={form} schema={schema} className="grid gap-3">
        <FormLayout size="full">
          <FormSection>
            <FormGrid columns={1}>
              <FormError message={error} />
              <FormField name="finalReading" label="Số cuối đồng hồ cũ" required>
                <NumberInput
                  min={meter.current?.reading ?? meter.previous}
                  max={METER_READING_MAX}
                  inputMode="numeric"
                />
              </FormField>
              <FormField name="initialReading" label="Số đầu đồng hồ mới" required>
                <NumberInput min={0} max={METER_READING_MAX} inputMode="numeric" />
              </FormField>
              <FormField name="replacedOn" label="Ngày thay" required {...DATE_FIELD}>
                <DatePicker clearable={false} />
              </FormField>
              <FormField name="serial" label="Seri mới">
                <Input maxLength={40} />
              </FormField>
              <FormField name="confirmHighConsumption" binding="checked" label="Xác nhận cảnh báo">
                <Checkbox label="Xác nhận nếu tiêu thụ khi thay đồng hồ hơn 2 lần trung bình." />
              </FormField>
            </FormGrid>
          </FormSection>
          <FormActions>
            <FormSubmit form={form}>
              {(saving) => (
                <Button type="submit" loading={saving}>
                  Thay đồng hồ
                </Button>
              )}
            </FormSubmit>
          </FormActions>
        </FormLayout>
      </Form>
    </Dialog>
  );
}
