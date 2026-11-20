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
  Input,
  NumberInput,
  Textarea,
  useAppForm,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { usePortalClaimPayment, usePortalUploadImage } from '@stay/sdk/react';
import { ApiSdkError } from '@stay/sdk/shared';
import { isIsoDate, STAY_UPLOAD_MAX_BYTES, STAY_UPLOAD_MIME_TYPES } from '@stay/shared';
import { useState } from 'react';
import * as v from 'valibot';
import { formatVnd, todayIsoDate } from '@/libraries/format';
import { apiFormErrors, clearServerErrorOnChange, serverError } from '@/libraries/forms/api-errors';
import { DATE_FIELD } from '@/libraries/forms/date-field';
import { FormError } from '@/libraries/forms/page-states';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { useFormDirty } from '@/libraries/forms/use-form-value';

const FIELDS = ['amount', 'paidOn', 'reference', 'note', 'receiptFileId'] as const;

const schema = {
  amount: v.pipe(
    v.number('Nhập số tiền đã chuyển.'),
    v.integer('Nhập số nguyên đồng.'),
    v.minValue(1, 'Số tiền phải lớn hơn 0.'),
  ),
  paidOn: v.pipe(
    v.string(),
    v.check((value: string) => isIsoDate(value), 'Chọn ngày chuyển khoản.'),
    v.check((value: string) => value <= todayIsoDate(), 'Ngày chuyển không được sau hôm nay.'),
  ),
  reference: v.pipe(v.string(), v.maxLength(120, 'Mã giao dịch tối đa 120 ký tự.')),
  note: v.pipe(v.string(), v.maxLength(500, 'Ghi chú tối đa 500 ký tự.')),
};

/** An accepted image (JPG/PNG/WEBP ≤ 10 MB) or the message to show. */
export function imageProblem(file: File): string | null {
  return STAY_UPLOAD_MIME_TYPES.some((type) => type === file.type) &&
    file.size <= STAY_UPLOAD_MAX_BYTES
    ? null
    : 'Chọn ảnh JPG, PNG hoặc WEBP tối đa 10 MB.';
}

const overpay = (remaining: number) =>
  `Số tiền không được vượt số còn lại (${formatVnd(remaining)}).`;

/**
 * T-05 "Tôi đã chuyển khoản": amount (default the remaining amount), date, optional receipt
 * photo. It only notifies the owner; the ledger changes when they confirm.
 */
export function ClaimForm({
  invoiceId,
  remaining,
  onDone,
}: {
  invoiceId: string;
  remaining: number;
  onDone: () => void;
}) {
  const claim = usePortalClaimPayment();
  const upload = usePortalUploadImage();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  // One key per form: a double tap or a retried submit never sends two claims.
  const [key] = useState(() => crypto.randomUUID());
  const [receiptFileId, setReceiptFileId] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: {
      uploadFiles: [] as File[],
      amount: remaining as number | null,
      paidOn: todayIsoDate(),
      reference: '',
      note: '',
    },
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      const amount = value.amount ?? 0;

      setError(null);
      if (amount > remaining) {
        form.setFieldMeta('amount', serverError(overpay(remaining)));
        return;
      }
      try {
        let fileId = receiptFileId;

        if (file && !fileId) {
          const problem = imageProblem(file);

          if (problem) {
            setError(problem);
            return;
          }
          fileId = await upload.mutateAsync({ purpose: 'payment_receipt', file });
          setReceiptFileId(fileId);
        }
        await claim.mutateAsync({
          invoiceId,
          idempotencyKey: key,
          body: {
            amount,
            paidOn: value.paidOn,
            receiptFileId: fileId,
            reference: value.reference.trim() || null,
            note: value.note.trim() || null,
          },
        });
        form.reset();
        toast.success('Đã báo chuyển khoản. Chủ trọ sẽ xác nhận sớm.');
        onDone();
      } catch (cause) {
        if (cause instanceof ApiSdkError && cause.code === 'payment_exceeds_remaining') {
          form.setFieldMeta('amount', serverError('Số tiền vượt số còn lại của hoá đơn.'));
          return;
        }
        const errors = apiFormErrors(cause, FIELDS, 'Không gửi được. Vui lòng thử lại.');

        for (const field of FIELDS)
          if (field !== 'receiptFileId' && errors.fields[field])
            form.setFieldMeta(field, serverError(errors.fields[field]));
        setError(errors.fields.receiptFileId ?? errors.message);
      }
    },
  });

  const dirty = useFormDirty(form);
  const { prompt } = useUnsavedChanges(dirty || Boolean(file));

  return (
    <Form
      noValidate
      form={form}
      schema={schema}
      className="grid min-w-0 gap-4"
      aria-label="Tôi đã chuyển khoản"
      data-testid="portal-claim-form"
    >
      <FormLayout size="full">
        <FormSection>
          <FormGrid columns={1}>
            {prompt}
            <FormError message={error} />
            <FormField name="amount" label="Số tiền đã chuyển" required>
              <NumberInput min={1} max={remaining} step={1} inputMode="numeric" endAddon="₫" />
            </FormField>
            <FormField name="paidOn" label="Ngày chuyển" required {...DATE_FIELD}>
              <DatePicker maxDate={todayIsoDate()} clearable={false} />
            </FormField>
            <div className="grid gap-1">
              <form.AppField
                name="uploadFiles"
                listeners={{
                  onChange: ({ value: files }) => {
                    setFile(files[0] ?? null);
                    setReceiptFileId(null);
                  },
                }}
              >
                {(field) => (
                  <field.UploadField
                    id="portal-claim-receipt"
                    accept="image/jpeg,image/png,image/webp"
                    label="Ảnh biên lai"
                    maxBytes={10485760}
                  />
                )}
              </form.AppField>
              <p className="text-ui-sm text-muted">Tuỳ chọn: ảnh chụp màn hình giao dịch.</p>
            </div>
            <FormField name="reference" label="Mã giao dịch">
              <Input maxLength={120} autoComplete="off" />
            </FormField>
            <FormField name="note" label="Ghi chú">
              <Textarea maxLength={500} rows={2} />
            </FormField>
          </FormGrid>
        </FormSection>
        <FormActions>
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
                Gửi xác nhận
              </Button>
            )}
          </FormSubmit>
        </FormActions>
      </FormLayout>
    </Form>
  );
}
