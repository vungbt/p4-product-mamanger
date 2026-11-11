import { Button, IconButton, Popover } from '@itclabs/react-ui';
import { useMarkNotificationRead, useNotifications } from '@stay/sdk/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';

export default function NotificationsBell() {
  const query = useNotifications();
  const { selectBuilding } = useActiveBuilding();
  const markRead = useMarkNotificationRead();
  const [open, setOpen] = useState(false);

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
          <h2 className="font-semibold">Thông báo · {query.data?.unreadCount ?? 0} chưa đọc</h2>
          {query.isError ? (
            <p role="alert">
              Không thể tải thông báo.{' '}
              <Button variant="ghost" onClick={() => void query.refetch()}>
                Thử lại
              </Button>
            </p>
          ) : null}
          {query.isPending ? <p>Đang tải…</p> : null}
          {query.data?.items.length === 0 ? <p className="text-muted">Chưa có thông báo</p> : null}
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
