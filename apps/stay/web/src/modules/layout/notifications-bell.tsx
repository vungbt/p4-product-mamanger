import { Button, EmptyState, IconButton, Popover } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import {
  NOTIFICATION_STREAMS,
  notificationKeys,
  useMarkNotificationRead,
  useNotificationSettings,
  useNotifications,
  usePushSubscription,
} from '@stay/sdk/react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { useAutoPush } from '@/libraries/notifications/use-auto-push';
import {
  POLL_CONNECTED_MS,
  POLL_FALLBACK_MS,
  useNotificationStream,
} from '@/libraries/notifications/use-notification-stream';
import { ROUTES } from '@/routing/route-configs';

/**
 * Header bell: live via Server-Sent Events (polling every 30 s when the stream is down). After
 * sign-in it asks once for browser notification permission (see `useAutoPush`).
 */
export default function NotificationsBell() {
  const client = useQueryClient();
  const live = useNotificationStream(NOTIFICATION_STREAMS.staff, {
    onReady: () => void client.invalidateQueries({ queryKey: notificationKeys.list() }),
    onEvent: (event) => {
      void client.invalidateQueries({ queryKey: notificationKeys.list() });
      toast.info(event.title, { description: event.body });
    },
  });
  const query = useNotifications({ refetchInterval: live ? POLL_CONNECTED_MS : POLL_FALLBACK_MS });
  const settings = useNotificationSettings();
  const push = usePushSubscription();
  const { selectBuilding } = useActiveBuilding();
  const markRead = useMarkNotificationRead();
  const [open, setOpen] = useState(false);

  useAutoPush('staff', settings.data, (subscription) => push.subscribe.mutateAsync(subscription));

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      label="Thông báo"
      triggerAsChild
      trigger={
        <IconButton
          badge={query.data?.unreadCount || undefined}
          icon="bell"
          variant="ghost"
          label={`Thông báo (${query.data?.unreadCount ?? 0} chưa đọc)`}
        />
      }
      contentProps={{ align: 'end', sideOffset: 8 }}
      className="w-80 max-w-full"
      content={
        <div className="grid min-w-0 gap-3" data-testid="notifications-dropdown">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Thông báo · {query.data?.unreadCount ?? 0} chưa đọc</h2>
            <Link
              to={ROUTES.notificationSettings}
              onClick={() => setOpen(false)}
              className="text-ui-sm text-accent"
            >
              Cài đặt
            </Link>
          </div>
          {query.isError ? (
            <p role="alert">
              Không thể tải thông báo.{' '}
              <Button variant="ghost" onClick={() => void query.refetch()}>
                Thử lại
              </Button>
            </p>
          ) : null}
          {query.isPending ? <p>Đang tải…</p> : null}
          {query.data?.items.length === 0 ? (
            <EmptyState size="compact" appearance="plain" title={<>Chưa có thông báo</>} />
          ) : null}
          <ul className="grid max-h-80 min-w-0 gap-3 overflow-y-auto">
            {query.data?.items.map((item) => (
              <li key={item.id} className="grid min-w-0 gap-1 border-b border-line pb-3">
                <Link
                  to={item.path}
                  onClick={() => {
                    selectBuilding(item.buildingId);
                    setOpen(false);
                  }}
                  className="break-words font-semibold text-accent"
                >
                  {item.readAt ? '' : '● '}
                  {item.title}
                </Link>
                <p className="break-words whitespace-pre-line text-ui-sm">{item.body}</p>
                <time className="text-ui-sm text-muted">
                  {new Date(item.createdAt).toLocaleString('vi-VN')}
                </time>
                {!item.readAt ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={markRead.isPending}
                    onClick={() => markRead.mutate(item.id)}
                  >
                    Đánh dấu đã đọc
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
          {markRead.isError ? (
            <p role="alert">Không thể đánh dấu đã đọc. Vui lòng thử lại.</p>
          ) : null}
        </div>
      }
    />
  );
}
