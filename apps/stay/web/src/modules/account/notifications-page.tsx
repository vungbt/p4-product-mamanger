import {
  useNotificationSettings,
  usePushSubscription,
  useUpdateNotificationSettings,
} from '@stay/sdk/react';
import { STAFF_NOTIFICATION_GROUPS } from '@stay/shared';
import { LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { NotificationSettingsPanel } from '@/libraries/notifications/notification-settings-panel';
import { ScreenHeader } from '@/libraries/screen-header';

/** Tài khoản → Thông báo: email/browser channels and event groups of the signed-in staff member. */
export default function NotificationSettingsPage() {
  const settings = useNotificationSettings();
  const update = useUpdateNotificationSettings();
  const push = usePushSubscription();

  return (
    <div className="grid max-w-2xl gap-6">
      <ScreenHeader
        title="Cài đặt thông báo"
        description="Nhận email và thông báo trình duyệt khi người thuê báo chuyển khoản, báo hỏng hoặc đến ngày cần làm."
      />
      <section className="rounded-panel border border-line bg-surface p-4 shadow-panel sm:p-6">
        {settings.isPending ? <LoadingRows rows={6} /> : null}
        {settings.isError ? (
          <LoadError error={settings.error} onRetry={() => void settings.refetch()} />
        ) : null}
        {settings.data ? (
          <NotificationSettingsPanel
            scope="staff"
            settings={settings.data}
            groups={STAFF_NOTIFICATION_GROUPS}
            saving={update.isPending}
            onSave={(preferences) => update.mutateAsync(preferences)}
            onSubscribe={(subscription) => push.subscribe.mutateAsync(subscription)}
            onUnsubscribe={(endpoint) => push.unsubscribe.mutateAsync(endpoint)}
          />
        ) : null}
      </section>
    </div>
  );
}
