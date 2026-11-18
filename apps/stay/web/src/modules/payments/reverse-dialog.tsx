import { Button, Form, FormField, FormSubmit, Textarea, useAppForm } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useReversePayment } from '@stay/sdk/react';
import type { StayPayment } from '@stay/shared';
import { useState } from 'react';
import * as v from 'valibot';
import { displayDate, formatVnd } from '@/libraries/format';
import { apiFormErrors, clearServerErrorOnChange, serverError } from '@/libraries/forms/api-errors';
import { FormError } from '@/libraries/forms/page-states';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { useFormDirty } from '@/libraries/forms/use-form-value';
import { Overlay } from '../invoices/invoice-dialogs';
import { PAYMENT_METHOD_LABELS, paymentErrorMessage } from './payment-ui';

const schema = {
  reason: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, 'Nhập lý do huỷ.'),
    v.maxLength(2000, 'Lý do tối đa 2000 ký tự.'),
  ),
};

/** "Huỷ bút toán thu" (O-22, O-23): required reason; the invoice status is recomputed. */
export function ReversePaymentDialog({
  payment,
  onClose,
}: {
  payment: StayPayment;
  onClose: () => void;
}) {
  const reverse = useReversePayment();
  const [error, setError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { reason: '' },
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await reverse.mutateAsync({ id: payment.id, body: { reason: value.reason.trim() } });
        form.reset();
        toast.success(`Đã huỷ khoản thu ${formatVnd(payment.amount)}.`);
        onClose();
      } catch (cause) {
        const errors = apiFormErrors(cause, ['reason'] as const, 'Không thể huỷ bút toán.');

        if (errors.fields.reason) form.setFieldMeta('reason', serverError(errors.fields.reason));
        setError(errors.message === null ? null : paymentErrorMessage(cause, errors.message));
      }
    },
  });

  const dirty = useFormDirty(form);

  useUnsavedChanges(dirty);

  const close = () => {
    if (reverse.isPending) return;
    form.reset();
    onClose();
  };

  return (
    <Overlay
      title="Huỷ bút toán thu"
      description={`Huỷ khoản thu ${formatVnd(payment.amount)} (${PAYMENT_METHOD_LABELS[payment.method]}, ngày ${displayDate(payment.paidOn)}) của hoá đơn ${payment.invoiceCode ?? ''}. Trạng thái hoá đơn sẽ được tính lại; bút toán vẫn được giữ trong sổ thu.`}
      onClose={close}
    >
      <Form
        noValidate
        form={form}
        schema={schema}
        className="grid min-w-0 gap-4"
        aria-label="Huỷ bút toán thu"
      >
        <FormError message={error} />
        <FormField name="reason" label="Lý do huỷ" required>
          <Textarea maxLength={2000} />
        </FormField>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" disabled={reverse.isPending} onClick={close}>
            Quay lại
          </Button>
          <FormSubmit form={form}>
            {(submitting) => (
              <Button type="submit" variant="danger" loading={submitting}>
                Huỷ bút toán
              </Button>
            )}
          </FormSubmit>
        </div>
      </Form>
    </Overlay>
  );
}
