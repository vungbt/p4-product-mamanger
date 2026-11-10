import {
  Button,
  Dialog,
  Drawer,
  Form,
  FormField,
  FormSubmit,
  NumberInput,
  Select,
  Textarea,
  useAppForm,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useAddInvoiceLine, useVoidInvoice } from '@stay/sdk/react';
import type { ManualInvoiceLineType, StayInvoice } from '@stay/shared';
import { type ReactNode, useState } from 'react';
import * as v from 'valibot';
import { formatVnd } from '@/libraries/format';
import {
  apiFormErrors,
  clearServerErrorOnChange,
  isVersionConflict,
  serverError,
} from '@/libraries/forms/api-errors';
import { ConflictAlert, FormError } from '@/libraries/forms/page-states';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { useFormDirty } from '@/libraries/forms/use-form-value';
import { useMediaQuery } from '@/libraries/use-media-query';
import { invoiceErrorMessage } from './invoice-ui';

/** Dialog on desktop, bottom sheet on phones (as the contract change dialogs). */
function Overlay({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const mobile = useMediaQuery('(max-width: 639px)');

  const onOpenChange = (open: boolean) => {
    if (!open) onClose();
  };
  const classNames = { content: 'max-h-[90dvh] overflow-y-auto', body: 'min-w-0' };

  return mobile ? (
    <Drawer
      open
      side="bottom"
      title={title}
      description={description}
      onOpenChange={onOpenChange}
      classNames={classNames}
    >
      {children}
    </Drawer>
  ) : (
    <Dialog
      open
      title={title}
      description={description}
      onOpenChange={onOpenChange}
      classNames={classNames}
      contentProps={{ onInteractOutside: (event: Event) => event.preventDefault() }}
    >
      {children}
    </Dialog>
  );
}

const LINE_FIELDS = ['type', 'amount', 'reason'] as const;
const lineSchema = {
  type: v.picklist(['surcharge', 'discount'], 'Chọn loại.'),
  amount: v.pipe(
    v.number('Nhập số tiền.'),
    v.integer('Nhập số nguyên đồng.'),
    v.minValue(1, 'Số tiền phải lớn hơn 0.'),
    v.maxValue(1_000_000_000, 'Số tiền tối đa 1.000.000.000 ₫.'),
  ),
  reason: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, 'Nhập lý do.'),
    v.maxLength(255, 'Lý do tối đa 255 ký tự.'),
  ),
};

/** "Phụ thu / giảm trừ" on a draft: positive amount, the API stores a discount negative. */
export function InvoiceLineDialog({
  invoice,
  onClose,
  onReload,
}: {
  invoice: StayInvoice;
  onClose: () => void;
  onReload: () => void;
}) {
  const add = useAddInvoiceLine();
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);

  const form = useAppForm({
    defaultValues: {
      type: 'surcharge' as ManualInvoiceLineType,
      amount: null as number | null,
      reason: '',
    },
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      setError(null);
      setConflict(false);
      try {
        await add.mutateAsync({
          id: invoice.id,
          body: {
            type: value.type,
            amount: value.amount ?? 0,
            reason: value.reason.trim(),
            version: invoice.version,
          },
        });
        form.reset();
        toast.success(value.type === 'discount' ? 'Đã thêm giảm trừ.' : 'Đã thêm phụ thu.');
        onClose();
      } catch (cause) {
        if (isVersionConflict(cause)) {
          setConflict(true);
          return;
        }
        const errors = apiFormErrors(cause, LINE_FIELDS, 'Không thể thêm dòng.');

        for (const field of LINE_FIELDS)
          if (errors.fields[field]) form.setFieldMeta(field, serverError(errors.fields[field]));
        setError(errors.message === null ? null : invoiceErrorMessage(cause, errors.message));
      }
    },
  });

  const dirty = useFormDirty(form);
  useUnsavedChanges(dirty);

  const close = () => {
    if (add.isPending) return;
    form.reset();
    onClose();
  };

  return (
    <Overlay
      title="Phụ thu / giảm trừ"
      description="Dòng thêm tay được giữ lại khi làm mới bản nháp."
      onClose={close}
    >
      <Form
        noValidate
        form={form}
        schema={lineSchema}
        className="grid min-w-0 gap-4"
        aria-label="Phụ thu / giảm trừ"
      >
        <FormError message={error} />
        {conflict ? (
          <ConflictAlert
            onReload={() => {
              setConflict(false);
              onReload();
            }}
          />
        ) : null}
        <FormField name="type" label="Loại" required>
          <Select
            options={[
              { value: 'surcharge', label: 'Phụ thu' },
              { value: 'discount', label: 'Giảm trừ' },
            ]}
          />
        </FormField>
        <FormField name="amount" label="Số tiền" required>
          <NumberInput min={1} max={1_000_000_000} step={1} inputMode="numeric" endAddon="₫" />
        </FormField>
        <FormField name="reason" label="Lý do" required>
          <Textarea maxLength={255} />
        </FormField>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" disabled={add.isPending} onClick={close}>
            Huỷ
          </Button>
          <FormSubmit form={form}>
            {(submitting) => (
              <Button type="submit" loading={submitting}>
                Thêm dòng
              </Button>
            )}
          </FormSubmit>
        </div>
      </Form>
    </Overlay>
  );
}

const voidSchema = {
  reason: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, 'Nhập lý do void.'),
    v.maxLength(2000, 'Lý do tối đa 2000 ký tự.'),
  ),
};

/** Void a draft or an unpaid issued invoice: required reason, readings unlock (owner only). */
export function VoidInvoiceDialog({
  invoice,
  onClose,
  onReload,
}: {
  invoice: StayInvoice;
  onClose: () => void;
  onReload: () => void;
}) {
  const voidInvoice = useVoidInvoice();
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);

  const form = useAppForm({
    defaultValues: { reason: '' },
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      setError(null);
      setConflict(false);
      try {
        await voidInvoice.mutateAsync({
          id: invoice.id,
          body: { reason: value.reason.trim(), version: invoice.version },
        });
        form.reset();
        toast.success('Đã void hoá đơn.');
        onClose();
      } catch (cause) {
        if (isVersionConflict(cause)) {
          setConflict(true);
          return;
        }
        const errors = apiFormErrors(cause, ['reason'] as const, 'Không thể void hoá đơn.');

        if (errors.fields.reason) form.setFieldMeta('reason', serverError(errors.fields.reason));
        setError(errors.message === null ? null : invoiceErrorMessage(cause, errors.message));
      }
    },
  });

  const dirty = useFormDirty(form);
  useUnsavedChanges(dirty);

  const close = () => {
    if (voidInvoice.isPending) return;
    form.reset();
    onClose();
  };

  return (
    <Overlay
      title="Void hoá đơn"
      description={`Huỷ hoá đơn ${invoice.code ?? 'nháp'} (${formatVnd(invoice.total)}). Chỉ số điện nước đã dùng sẽ được mở khoá để sửa và lập lại.`}
      onClose={close}
    >
      <Form
        noValidate
        form={form}
        schema={voidSchema}
        className="grid min-w-0 gap-4"
        aria-label="Void hoá đơn"
      >
        <FormError message={error} />
        {conflict ? (
          <ConflictAlert
            onReload={() => {
              setConflict(false);
              onReload();
            }}
          />
        ) : null}
        <FormField name="reason" label="Lý do void" required>
          <Textarea maxLength={2000} />
        </FormField>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" disabled={voidInvoice.isPending} onClick={close}>
            Huỷ
          </Button>
          <FormSubmit form={form}>
            {(submitting) => (
              <Button type="submit" variant="danger" loading={submitting}>
                Void hoá đơn
              </Button>
            )}
          </FormSubmit>
        </div>
      </Form>
    </Overlay>
  );
}
