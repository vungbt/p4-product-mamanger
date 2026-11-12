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
  Select,
  Textarea,
  useAppForm,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useInvoices, useRecordPayment } from '@stay/sdk/react';
import { isIsoDate, type ManualPaymentMethod, type StayInvoiceSummary } from '@stay/shared';
import { useEffect, useRef, useState } from 'react';
import * as v from 'valibot';
import { displayDate, formatVnd, todayIsoDate } from '@/libraries/format';
import { apiFormErrors, clearServerErrorOnChange, serverError } from '@/libraries/forms/api-errors';
import { DATE_FIELD } from '@/libraries/forms/date-field';
import { FormError, LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { useFormDirty, useFormValue } from '@/libraries/forms/use-form-value';
import { Overlay } from '../invoices/invoice-dialogs';
import { displayPeriod } from '../invoices/invoice-ui';
import {
  exceededRemaining,
  isCollectable,
  MANUAL_PAYMENT_METHOD_OPTIONS,
  overpayMessage,
  paymentErrorMessage,
} from './payment-ui';

const TITLE = 'Thu tiền';
const DESCRIPTION = 'Khoản thu đã ghi không sửa, không xoá; ghi sai thì huỷ bút toán.';
const FIELDS = ['amount', 'method', 'paidOn', 'reference', 'note'] as const;

const schema = {
  invoiceId: v.pipe(v.string(), v.minLength(1, 'Chọn hoá đơn.')),
  amount: v.pipe(
    v.number('Nhập số tiền.'),
    v.integer('Nhập số nguyên đồng.'),
    v.minValue(1, 'Số tiền phải lớn hơn 0.'),
  ),
  method: v.picklist(['cash', 'bank_transfer', 'other'], 'Chọn phương thức.'),
  paidOn: v.pipe(
    v.string(),
    v.check((value: string) => isIsoDate(value), 'Chọn ngày thu.'),
    v.check((value: string) => value <= todayIsoDate(), 'Ngày thu không được sau hôm nay.'),
  ),
  reference: v.pipe(v.string(), v.maxLength(120, 'Mã giao dịch tối đa 120 ký tự.')),
  note: v.pipe(v.string(), v.maxLength(2000, 'Ghi chú tối đa 2000 ký tự.')),
};

/** What the form needs of an invoice (a list summary or a Công nợ invoice with its room). */
export type PayableInvoice = Pick<
  StayInvoiceSummary,
  'id' | 'code' | 'roomCode' | 'period' | 'dueOn' | 'remaining'
>;

const invoiceLabel = (invoice: PayableInvoice) =>
  `${invoice.code ?? 'Nháp'} · Kỳ ${displayPeriod(invoice.period)} · còn ${formatVnd(invoice.remaining)}`;

/** "Thu tiền" for one invoice (O-22 detail, O-21 list row). */
export function PaymentDialog({
  invoice,
  onClose,
}: {
  invoice: StayInvoiceSummary;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <Overlay title={TITLE} description={DESCRIPTION} onClose={() => !busy && onClose()}>
      <PaymentForm invoices={[invoice]} onBusyChange={setBusy} onClose={onClose} />
    </Overlay>
  );
}

/**
 * "Thu tiền" from Công nợ: the contract's unpaid invoices (oldest due first, as the receivables
 * row lists them), `invoiceId` preselected (default: the oldest).
 */
export function InvoicesPaymentDialog({
  title,
  invoices,
  invoiceId,
  onClose,
}: {
  title: string;
  invoices: PayableInvoice[];
  invoiceId?: string;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <Overlay title={title} description={DESCRIPTION} onClose={() => !busy && onClose()}>
      <PaymentForm
        invoices={invoices}
        initialInvoiceId={invoiceId}
        onBusyChange={setBusy}
        onClose={onClose}
      />
    </Overlay>
  );
}

/** "Thu tiền" from the room map or room detail: the room's outstanding invoices, oldest due first. */
export function RoomPaymentDialog({
  roomId,
  roomCode,
  onClose,
}: {
  roomId: string;
  roomCode: string;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const query = useInvoices({ roomId, pageSize: 100, sortBy: 'dueOn', sortOrder: 'asc' });

  const invoices = (query.data?.data ?? []).filter(isCollectable);

  return (
    <Overlay
      title={`${TITLE} phòng ${roomCode}`}
      description={DESCRIPTION}
      onClose={() => !busy && onClose()}
    >
      {query.isPending ? (
        <LoadingRows rows={3} />
      ) : query.isError ? (
        <LoadError error={query.error} onRetry={() => void query.refetch()} />
      ) : invoices.length ? (
        <PaymentForm invoices={invoices} onBusyChange={setBusy} onClose={onClose} />
      ) : (
        <div className="grid gap-3">
          <p>Phòng không còn hoá đơn cần thu.</p>
          <Button variant="secondary" className="justify-self-end" onClick={onClose}>
            Đóng
          </Button>
        </div>
      )}
    </Overlay>
  );
}

function PaymentForm({
  invoices,
  initialInvoiceId,
  onBusyChange,
  onClose,
}: {
  invoices: PayableInvoice[];
  initialInvoiceId?: string;
  onBusyChange: (busy: boolean) => void;
  onClose: () => void;
}) {
  const record = useRecordPayment();
  const [error, setError] = useState<string | null>(null);
  // One key per dialog: a double tap or a retry of the same submit never records twice.
  const [key] = useState(() => crypto.randomUUID());

  const first = invoices.find((invoice) => invoice.id === initialInvoiceId) ?? invoices[0];

  const form = useAppForm({
    defaultValues: {
      invoiceId: first?.id ?? '',
      amount: (first?.remaining ?? null) as number | null,
      method: 'cash' as ManualPaymentMethod,
      paidOn: todayIsoDate(),
      reference: '',
      note: '',
    },
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      const invoice = invoices.find((row) => row.id === value.invoiceId) ?? first;
      const amount = value.amount ?? 0;

      setError(null);
      if (!invoice) return;
      if (amount > invoice.remaining) {
        form.setFieldMeta('amount', serverError(overpayMessage(invoice.remaining)));
        return;
      }
      onBusyChange(true);
      try {
        await record.mutateAsync({
          invoiceId: invoice.id,
          idempotencyKey: key,
          body: {
            amount,
            method: value.method,
            paidOn: value.paidOn,
            reference: value.reference.trim() || null,
            note: value.note.trim() || null,
          },
        });
        form.reset();
        toast.success(`Đã thu ${formatVnd(amount)} cho hoá đơn ${invoice.code ?? ''}.`);
        onClose();
      } catch (cause) {
        const remaining = exceededRemaining(cause);

        if (remaining !== null) {
          form.setFieldMeta('amount', serverError(overpayMessage(remaining)));
          return;
        }
        const errors = apiFormErrors(cause, FIELDS, 'Không thể ghi khoản thu.');

        for (const field of FIELDS)
          if (errors.fields[field]) form.setFieldMeta(field, serverError(errors.fields[field]));
        setError(errors.message === null ? null : paymentErrorMessage(cause, errors.message));
      } finally {
        onBusyChange(false);
      }
    },
  });

  const dirty = useFormDirty(form);
  const invoiceId = useFormValue(form, (state) => state.values.invoiceId);
  const previous = useRef(invoiceId);

  useUnsavedChanges(dirty);

  const selected = invoices.find((row) => row.id === invoiceId) ?? first;

  // Another invoice: its remaining amount becomes the default again.
  useEffect(() => {
    if (previous.current === invoiceId) return;
    previous.current = invoiceId;
    if (selected) form.setFieldValue('amount', selected.remaining);
  }, [form, invoiceId, selected]);

  const close = () => {
    if (record.isPending) return;
    form.reset();
    onClose();
  };

  const payInFull = () => {
    if (!selected || record.isPending) return;
    form.setFieldMeta('amount', serverError(undefined));
    form.setFieldValue('amount', selected.remaining);
    void form.handleSubmit();
  };

  if (!selected) return null;

  return (
    <Form noValidate form={form} schema={schema} className="grid min-w-0 gap-4" aria-label={TITLE}>
      <FormLayout size="full">
        <FormSection>
          <FormGrid columns={1}>
            <FormError message={error} />
            {invoices.length > 1 ? (
              <FormField name="invoiceId" label="Hoá đơn" required>
                <Select
                  options={invoices.map((invoice) => ({
                    value: invoice.id,
                    label: invoiceLabel(invoice),
                  }))}
                />
              </FormField>
            ) : null}
            <dl
              className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-control border border-line bg-canvas p-3 text-ui-sm"
              data-testid="payment-invoice"
            >
              <dt className="text-muted">Hoá đơn</dt>
              <dd className="text-right font-semibold break-all">{selected.code ?? 'Nháp'}</dd>
              <dt className="text-muted">Phòng · kỳ</dt>
              <dd className="text-right">
                {selected.roomCode} · {displayPeriod(selected.period)}
              </dd>
              <dt className="text-muted">Hạn</dt>
              <dd className="text-right">{displayDate(selected.dueOn)}</dd>
              <dt className="text-muted">Còn lại</dt>
              <dd className="text-right font-bold" data-testid="payment-remaining">
                {formatVnd(selected.remaining)}
              </dd>
            </dl>
            <FormField name="amount" label="Số tiền" required>
              <NumberInput
                min={1}
                max={Number.MAX_SAFE_INTEGER}
                step={1}
                inputMode="numeric"
                endAddon="₫"
              />
            </FormField>
            <FormField name="method" label="Phương thức" required>
              <Select options={MANUAL_PAYMENT_METHOD_OPTIONS} />
            </FormField>
            <FormField name="paidOn" label="Ngày thu" required {...DATE_FIELD}>
              <DatePicker maxDate={todayIsoDate()} clearable={false} />
            </FormField>
            <FormField name="reference" label="Mã giao dịch">
              <Input maxLength={120} autoComplete="off" />
            </FormField>
            <FormField name="note" label="Ghi chú">
              <Textarea maxLength={2000} rows={2} />
            </FormField>
            <FormActions>
              <Button variant="secondary" disabled={record.isPending} onClick={close}>
                Huỷ
              </Button>
              <Button
                variant="secondary"
                disabled={record.isPending}
                onClick={payInFull}
                aria-describedby="payment-full-hint"
              >
                Thu đủ
              </Button>
              <FormSubmit form={form}>
                {(submitting) => (
                  <Button type="submit" loading={submitting}>
                    Ghi khoản thu
                  </Button>
                )}
              </FormSubmit>
            </FormActions>
            <p id="payment-full-hint" className="text-ui-sm text-muted">
              "Thu đủ" ghi ngay số còn lại {formatVnd(selected.remaining)}.
            </p>
          </FormGrid>
        </FormSection>
      </FormLayout>
    </Form>
  );
}
