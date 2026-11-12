import {
  Alert,
  Button,
  Form,
  FormActions,
  FormField,
  FormGrid,
  FormLayout,
  FormSection,
  FormSubmit,
  Select,
  Switch,
  useAppForm,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useAutomationSettings, useUpdateAutomationSettings } from '@stay/sdk/react';
import { READING_REMINDER_DAYS_MAX, type StayAutomationSettings } from '@stay/shared';
import { useState } from 'react';
import * as v from 'valibot';
import { isVersionConflict } from '@/libraries/forms/api-errors';
import { LoadError, LoadingRows } from '@/libraries/forms/page-states';

const fields = [
  ['readingReminder', 'Nhắc chủ trọ ngày chốt số'],
  ['createDrafts', 'Tự tạo bản nháp ngày phát hành'],
  ['beforeDue', 'Nhắc người thuê trước hạn 1 ngày'],
  ['afterDue', 'Nhắc người thuê quá hạn 3 ngày'],
  ['tenantRemindersDisabled', 'Tắt toàn bộ nhắc người thuê'],
] as const;

const DAYS_BEFORE_OPTIONS = Array.from({ length: READING_REMINDER_DAYS_MAX + 1 }, (_, days) => ({
  value: String(days),
  label: days === 0 ? 'Không nhắc trước' : `Trước ${days} ngày`,
}));

type AutomationValues = Omit<StayAutomationSettings, 'readingReminderDaysBefore'> & {
  readingReminderDaysBefore: string;
};

function AutomationForm({ id, settings }: { id: string; settings: StayAutomationSettings }) {
  const update = useUpdateAutomationSettings(id);
  const [error, setError] = useState('');
  const defaultValues: AutomationValues = {
    ...settings,
    readingReminderDaysBefore: String(settings.readingReminderDaysBefore),
  };
  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      setError('');
      try {
        await update.mutateAsync({
          ...value,
          readingReminderDaysBefore: Number(value.readingReminderDaysBefore),
          version: settings.version,
        });
        toast.success('Đã lưu tự động hoá');
      } catch (cause) {
        setError(
          isVersionConflict(cause)
            ? 'Cấu hình đã thay đổi. Tải lại trang để cập nhật trước khi lưu.'
            : 'Không thể lưu tự động hoá. Vui lòng thử lại.',
        );
      }
    },
  });

  return (
    <Form
      form={form}
      schema={{
        readingReminder: v.boolean(),
        readingReminderBefore: v.boolean(),
        readingReminderDaysBefore: v.string(),
        createDrafts: v.boolean(),
        beforeDue: v.boolean(),
        afterDue: v.boolean(),
        tenantRemindersDisabled: v.boolean(),
      }}
      className="grid gap-4"
      data-testid="automation-settings"
    >
      <FormLayout size="full">
        <FormSection>
          <FormGrid columns={1}>
            <h2 className="text-section font-semibold">Tự động hoá kỳ thu</h2>
            <p className="text-ui-sm text-muted">
              Theo giờ Việt Nam. Chỉ tạo hoá đơn nháp, chủ trọ kiểm tra và phát hành. Email chưa
              được kết nối; thông báo vẫn có trong chuông.
            </p>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <FormField name="readingReminderBefore" className="mb-0">
                <Switch label="Nhắc chủ trọ trước ngày chốt số" />
              </FormField>
              <FormField
                name="readingReminderDaysBefore"
                label="Nhắc chốt số trước"
                className="mb-0"
              >
                <Select options={DAYS_BEFORE_OPTIONS} />
              </FormField>
            </div>
            <p className="-mt-2 text-ui-sm text-muted">
              Nhắc trước và nhắc đúng ngày chốt số chỉ gửi khi còn phòng chưa nhập đủ chỉ số. Khi
              toà có ngày ân hạn, nhắc quá hạn gửi vào ngày đầu tiên quá hạn thay vì sau hạn 3 ngày.
            </p>
            {fields.map(([name, label]) => (
              <FormField key={name} name={name}>
                <Switch label={label} />
              </FormField>
            ))}
            {error ? <Alert tone="danger">{error}</Alert> : null}
          </FormGrid>
        </FormSection>
        <FormActions>
          <FormSubmit form={form}>
            {(pending) => (
              <Button type="submit" loading={pending}>
                Lưu tự động hoá
              </Button>
            )}
          </FormSubmit>
        </FormActions>
      </FormLayout>
    </Form>
  );
}

export function AutomationSettings({ id }: { id: string }) {
  const query = useAutomationSettings(id);

  if (query.isPending) return <LoadingRows rows={3} />;
  if (query.isError) return <LoadError error={query.error} onRetry={() => void query.refetch()} />;

  return (
    <section className="min-w-0 rounded-panel border border-line bg-surface p-4 sm:p-5">
      <AutomationForm key={`${id}-${query.data.version}`} id={id} settings={query.data} />
    </section>
  );
}
