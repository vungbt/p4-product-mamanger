import {
  Button,
  Checkbox,
  Dialog,
  Form,
  FormField,
  FormSubmit,
  useAppForm,
} from '@itclabs/react-ui';
import { useStaySdk } from '@stay/sdk/react';
import {
  downloadReport,
  getErrorMessage,
  type ReportExport,
  type ReportRange,
} from '@stay/sdk/shared';
import { useState } from 'react';
import * as v from 'valibot';

const choices = [
  { value: 'invoices', label: 'Hoá đơn' },
  { value: 'payments', label: 'Sổ thu' },
  { value: 'expenses', label: 'Chi phí' },
  { value: 'receivables', label: 'Công nợ' },
] as const;
const schema = v.pipe(
  v.array(v.picklist(['invoices', 'payments', 'expenses', 'receivables'])),
  v.minLength(1, 'Chọn ít nhất một sổ.'),
);

export function ExportDialog({ range, onClose }: { range: ReportRange; onClose: () => void }) {
  const sdk = useStaySdk();
  const [error, setError] = useState<string | null>(null);
  const form = useAppForm({
    defaultValues: { sheets: choices.map((c) => c.value) as ReportExport['sheets'] },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await downloadReport(sdk, { ...range, sheets: value.sheets });
        onClose();
      } catch (cause) {
        setError(getErrorMessage(cause, 'Không thể xuất Excel. Vui lòng thử lại.'));
      }
    },
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Xuất Excel"
      description={`Từ ${range.from} đến ${range.to}. Công nợ là số còn nợ hiện tại của các hoá đơn trong kỳ.`}
    >
      <Form form={form} className="grid gap-4">
        <FormField name="sheets" validators={{ onChange: schema }}>
          {(field) => (
            <fieldset className="grid gap-3">
              <legend className="mb-3 font-semibold">Chọn sổ cần xuất</legend>
              {choices.map((choice) => (
                <Checkbox
                  key={choice.value}
                  label={choice.label}
                  checked={field.state.value.includes(choice.value)}
                  onCheckedChange={(checked) =>
                    field.handleChange(
                      checked === true
                        ? [...field.state.value, choice.value]
                        : field.state.value.filter(
                            (s: ReportExport['sheets'][number]) => s !== choice.value,
                          ),
                    )
                  }
                />
              ))}
            </fieldset>
          )}
        </FormField>
        {error ? (
          <p role="alert" className="text-danger">
            {error}
          </p>
        ) : null}
        <FormSubmit form={form}>
          {(submitting) => (
            <Button type="submit" loading={submitting}>
              Tải Excel
            </Button>
          )}
        </FormSubmit>
      </Form>
    </Dialog>
  );
}
