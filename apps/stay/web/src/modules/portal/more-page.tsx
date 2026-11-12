import { Button, Icon, type IconName } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { usePortalMe, usePortalSignOut } from '@stay/sdk/react';
import { Link, useNavigate } from 'react-router-dom';
import { ContactLinks, PortalSection, portalPaths } from './portal-ui';

const LINKS: { to: string; label: string; icon: IconName }[] = [
  { to: portalPaths.notifications, label: 'Thông báo của tôi', icon: 'bell' },
  { to: portalPaths.usage, label: 'Điện nước', icon: 'bolt' },
  { to: portalPaths.requests, label: 'Yêu cầu gửi chủ trọ', icon: 'messages' },
  { to: portalPaths.notices, label: 'Thông báo và nội quy', icon: 'megaphone' },
];

/** "Thêm": thông báo, điện nước, yêu cầu, thông báo & nội quy, liên hệ, đăng xuất. */
export default function PortalMorePage() {
  const me = usePortalMe();
  const signOut = usePortalSignOut();
  const navigate = useNavigate();

  const leave = async () => {
    try {
      await signOut.mutateAsync();
    } catch {
      toast.error('Không đăng xuất được. Vui lòng thử lại.');
      return;
    }
    navigate(portalPaths.signedOut, { replace: true });
  };

  return (
    <>
      <h1 className="text-heading font-bold">Thêm</h1>
      <nav aria-label="Mục khác">
        <ul className="grid gap-2">
          {LINKS.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="flex min-h-12 items-center gap-3 rounded-panel border border-line bg-surface px-4 font-medium"
              >
                <Icon name={item.icon} className="size-5 text-muted" aria-hidden />
                <span className="min-w-0 flex-1">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <PortalSection title="Liên hệ chủ trọ">
        <ContactLinks phone={me.data?.contactPhone ?? null} />
      </PortalSection>
      <Button variant="secondary" loading={signOut.isPending} onClick={() => void leave()}>
        Đăng xuất khỏi thiết bị này
      </Button>
    </>
  );
}
