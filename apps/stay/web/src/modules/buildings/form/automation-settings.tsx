import { Alert, Button, Form, FormField, FormSubmit, Switch, useAppForm } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useAutomationSettings, useUpdateAutomationSettings } from '@stay/sdk/react';
import type { StayAutomationSettings } from '@stay/shared';
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

function AutomationForm({ id, settings }: { id: string; settings: StayAutomationSettings }) {
  const update = useUpdateAutomationSettings(id);
  const [error, setError] = useState('');
  const form = useAppForm({
    defaultValues: settings,
    onSubmit: async ({ value }) => {
      setError('');
      try {
        await update.mutateAsync({ ...value, version: settings.version });
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
        createDrafts: v.boolean(),
        beforeDue: v.boolean(),
        afterDue: v.boolean(),
        tenantRemindersDisabled: v.boolean(),
      }}
      className="grid gap-4"
      data-testid="automation-settings"
    >
      <h2 className="text-section font-semibold">Tự động hoá kỳ thu</h2>
      <p className="text-ui-sm text-muted">
        Theo giờ Việt Nam. Chỉ tạo hoá đơn nháp, chủ trọ kiểm tra và phát hành. Email chưa được kết
        nối; thông báo vẫn có trong chuông.
      </p>
      {fields.map(([name, label]) => (
        <FormField key={name} name={name}>
          <Switch label={label} />
        </FormField>
      ))}
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <FormSubmit form={form}>
        {(pending) => (
          <Button type="submit" loading={pending}>
            Lưu tự động hoá
          </Button>
        )}
      </FormSubmit>
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
