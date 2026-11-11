import { EmptyState } from '@itclabs/react-ui';
import { useLocation } from 'react-router-dom';
import { portalPaths } from './portal-ui';

/** T-08 báo hỏng / T-09 gửi yêu cầu arrive with ST-25 part B. */
export default function PortalComingSoonPage() {
  const { pathname } = useLocation();
  const title = pathname.startsWith(portalPaths.maintenance) ? 'Báo hỏng' : 'Gửi yêu cầu';

  return (
    <>
      <h1 className="text-heading font-bold">{title}</h1>
      <EmptyState
        title="Sắp có"
        description="Tính năng này sẽ sớm có trên cổng người thuê. Trong lúc chờ, hãy liên hệ chủ trọ qua điện thoại hoặc Zalo."
      />
    </>
  );
}
