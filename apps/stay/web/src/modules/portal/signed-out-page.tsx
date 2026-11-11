import { EmptyState } from '@itclabs/react-ui';
import { useGenericDocumentMeta } from '@/libraries/document-meta';
import { PORTAL_TITLE } from './portal-ui';

/** After "Đăng xuất": the device must open the link and enter the digits again. */
export default function PortalSignedOutPage() {
  useGenericDocumentMeta(PORTAL_TITLE);

  return (
    <main className="min-h-dvh bg-canvas px-4 py-10">
      <div className="mx-auto max-w-xl" data-testid="portal-signed-out">
        <EmptyState
          headingLevel={1}
          title="Bạn đã đăng xuất"
          description="Mở lại link chủ trọ đã gửi và nhập 4 số cuối số điện thoại để vào cổng."
        />
      </div>
    </main>
  );
}
