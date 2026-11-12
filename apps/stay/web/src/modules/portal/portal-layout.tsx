import { cn, Icon, IconButton, type IconName } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import {
  NOTIFICATION_STREAMS,
  notificationKeys,
  PortalSdkProvider,
  portalKeys,
  usePortalMe,
  usePortalNotificationSettings,
  usePortalNotifications,
  usePortalPushSubscription,
} from '@stay/sdk/react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useGenericDocumentMeta } from '@/libraries/document-meta';
import { useAutoPush } from '@/libraries/notifications/use-auto-push';
import {
  POLL_CONNECTED_MS,
  POLL_FALLBACK_MS,
  useNotificationStream,
} from '@/libraries/notifications/use-notification-stream';
import { getPortalSdk } from './portal-sdk';
import { PORTAL_TITLE, PortalQuery, portalPaths, rememberContact } from './portal-ui';

const NAV: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: portalPaths.home, label: 'Trang chủ', icon: 'home', end: true },
  { to: portalPaths.invoices, label: 'Hoá đơn', icon: 'receipt' },
  { to: portalPaths.maintenance, label: 'Báo hỏng', icon: 'wrench' },
  { to: portalPaths.contract, label: 'Hợp đồng', icon: 'clipboardText' },
  { to: portalPaths.more, label: 'Thêm', icon: 'more' },
];

/** Portal navigation (screens.md): Trang chủ · Hoá đơn · Báo hỏng · Hợp đồng · Thêm. */
function PortalNav() {
  return (
    <nav
      aria-label="Điều hướng cổng người thuê"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-safe shadow-floating"
      data-testid="portal-nav"
    >
      <div className="mx-auto flex max-w-xl items-stretch gap-1 px-2 py-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-control px-1 text-eyebrow font-medium',
                isActive ? 'text-accent' : 'text-muted hover:text-ink',
              )
            }
          >
            <Icon name={item.icon} className="size-6" aria-hidden />
            <span className="max-w-full truncate">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

/**
 * Header bell of the portal: live via SSE (polling while the stream is down); asks once for
 * browser notification permission after the tenant signs in.
 */
function PortalBell() {
  const client = useQueryClient();
  const navigate = useNavigate();
  const live = useNotificationStream(NOTIFICATION_STREAMS.portal, {
    onReady: () => void client.invalidateQueries({ queryKey: notificationKeys.portalList() }),
    onEvent: (event) => {
      // Payments and request answers change the invoice/request screens too.
      void client.invalidateQueries({ queryKey: portalKeys.all });
      toast.info(event.title, { description: event.body });
    },
  });
  const list = usePortalNotifications({
    refetchInterval: live ? POLL_CONNECTED_MS : POLL_FALLBACK_MS,
  });
  const settings = usePortalNotificationSettings();
  const push = usePortalPushSubscription();
  const unread = list.data?.unreadCount ?? 0;

  useAutoPush('portal', settings.data, (subscription) => push.subscribe.mutateAsync(subscription));

  return (
    <IconButton
      icon="bell"
      variant="ghost"
      badge={unread || undefined}
      label={`Thông báo (${unread} chưa đọc)`}
      onClick={() => navigate(portalPaths.notifications)}
      data-testid="portal-bell"
    />
  );
}

function PortalShell() {
  const me = usePortalMe();

  useEffect(() => {
    if (me.data) rememberContact(me.data.contactPhone);
  }, [me.data]);

  return (
    <PortalQuery query={me}>
      {(data) => (
        <div className="min-h-dvh bg-canvas">
          <header className="border-b border-line bg-surface">
            <div className="mx-auto flex w-full max-w-xl min-w-0 items-center gap-2 px-4 py-3">
              <div className="grid min-w-0 flex-1 gap-0.5">
                <p className="font-semibold break-words" data-testid="portal-building">
                  {data.buildingName}
                </p>
                <p className="text-ui-sm text-muted">Phòng {data.roomCode}</p>
              </div>
              <PortalBell />
            </div>
          </header>
          <main className="mx-auto grid w-full max-w-xl min-w-0 gap-4 px-4 pt-4 pb-28">
            <Outlet />
          </main>
          <PortalNav />
        </div>
      )}
    </PortalQuery>
  );
}

/**
 * Tenant portal shell (`/p/*`, ST-25): outside the staff shell and sign-in, mobile-first, no
 * management menu; generic title and `noindex`. Without a valid portal session → T-11.
 */
export default function PortalLayout() {
  useGenericDocumentMeta(PORTAL_TITLE);

  return (
    <PortalSdkProvider sdk={getPortalSdk()}>
      <PortalShell />
    </PortalSdkProvider>
  );
}
