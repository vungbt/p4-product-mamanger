import { Button, EmptyState } from '@itclabs/react-ui';
import {
  useMarkPortalNotificationRead,
  usePortalNotificationSettings,
  usePortalNotifications,
  usePortalPushSubscription,
  useUpdatePortalNotificationSettings,
} from '@stay/sdk/react';
import { TENANT_NOTIFICATION_GROUPS } from '@stay/shared';
import { Link } from 'react-router-dom';
import { NotificationSettingsPanel } from '@/libraries/notifications/notification-settings-panel';
import { PortalQuery, PortalSection } from './portal-ui';

/** `/p/notifications`: the tenant's notifications (live) and how they are delivered. */
export default function PortalNotificationsPage() {
  const list = usePortalNotifications();
  const settings = usePortalNotificationSettings();
  const update = useUpdatePortalNotificationSettings();
  const push = usePortalPushSubscription();
  const markRead = useMarkPortalNotificationRead();

  return (
    <>
      <h1 className="text-heading font-bold">Thông báo</h1>
      <PortalQuery query={list}>
        {(data) => (
          <PortalSection
            title={`Mới nhất · ${data.unreadCount} chưa đọc`}
            testId="portal-notifications"
          >
            {data.items.length === 0 ? (
              <EmptyState title="Chưa có thông báo" />
            ) : (
              <ul className="grid gap-4">
                {data.items.map((item) => (
                  <li key={item.id} className="grid min-w-0 gap-1 border-b border-line pb-3">
                    <Link
                      to={item.path}
                      onClick={() => {
                        if (!item.readAt) markRead.mutate(item.id);
                      }}
                      className="font-semibold break-words text-accent"
                    >
                      {item.readAt ? '' : '● '}
                      {item.title}
                    </Link>
                    <p className="whitespace-pre-line break-words text-ui-sm">{item.body}</p>
                    <time className="text-ui-sm text-muted" dateTime={item.createdAt}>
                      {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </time>
                    {!item.readAt ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-self-start"
                        disabled={markRead.isPending}
                        onClick={() => markRead.mutate(item.id)}
                      >
                        Đánh dấu đã đọc
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </PortalSection>
        )}
      </PortalQuery>
      <PortalQuery query={settings}>
        {(data) => (
          <PortalSection title="Cách nhận thông báo" testId="portal-notification-settings">
            <NotificationSettingsPanel
              scope="portal"
              settings={data}
              groups={TENANT_NOTIFICATION_GROUPS}
              nested
              saving={update.isPending}
              onSave={(preferences) => update.mutateAsync(preferences)}
              onSubscribe={(subscription) => push.subscribe.mutateAsync(subscription)}
              onUnsubscribe={(endpoint) => push.unsubscribe.mutateAsync(endpoint)}
            />
          </PortalSection>
        )}
      </PortalQuery>
    </>
  );
}
