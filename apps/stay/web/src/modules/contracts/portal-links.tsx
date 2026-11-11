import { AlertDialog, Button, Input, Tag, type TagTone } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useCreatePortalLink, usePortalLinks, useRevokePortalLink } from '@stay/sdk/react';
import { getErrorMessage } from '@stay/sdk/shared';
import type {
  PortalLinkStatus,
  StayContract,
  TenantPortalLink,
  TenantPortalLinkCreated,
} from '@stay/shared';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { useCanOn } from '@/libraries/ability';
import { todayIsoDate } from '@/libraries/format';
import { FormError, LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { Overlay } from '@/modules/invoices/invoice-dialogs';
import { canWebShare, copyWithToast, shareLink } from '@/modules/invoices/share/share-tools';

const STATUS: Record<PortalLinkStatus, { label: string; tone: TagTone }> = {
  active: { label: 'Đang hoạt động', tone: 'success' },
  locked: { label: 'Tạm khoá', tone: 'warning' },
  revoked: { label: 'Đã thu hồi', tone: 'neutral' },
  expired: { label: 'Hết hiệu lực', tone: 'neutral' },
};

const dateTime = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
});

type Occupant = { tenantId: string; fullName: string; isPrimary: boolean };

/** Occupants still living there (one row per person), as the API decides link eligibility. */
function currentOccupants(contract: StayContract): Occupant[] {
  const today = todayIsoDate();
  const on =
    contract.status === 'ended'
      ? (contract.movedOutAt ?? contract.endDate ?? today)
      : contract.startDate > today
        ? contract.startDate
        : today;
  const seen = new Set<string>();

  return contract.occupants.flatMap((row) => {
    if (seen.has(row.tenantId) || (row.toDate !== null && row.toDate <= on)) return [];
    seen.add(row.tenantId);
    return [{ tenantId: row.tenantId, fullName: row.fullName, isPrimary: row.isPrimary }];
  });
}

/** Message sent with the link (Zalo/SMS). */
function portalMessage(created: TenantPortalLinkCreated, roomCode: string) {
  return `Chào ${created.link.tenantName}, đây là link xem hoá đơn, thanh toán và hợp đồng phòng ${roomCode}: ${created.url} . Khi mở lần đầu, nhập 4 số cuối số điện thoại của bạn.`;
}

/** The new link, shown once (only its hash is stored): copy, Web Share, message and QR. */
function CreatedLinkDialog({
  created,
  roomCode,
  onClose,
}: {
  created: TenantPortalLinkCreated;
  roomCode: string;
  onClose: () => void;
}) {
  const message = portalMessage(created, roomCode);

  return (
    <Overlay
      title="Link cổng người thuê"
      description={`Gửi cho ${created.link.tenantName}. Link chỉ hiện một lần: tạo link mới sẽ làm link này hết hiệu lực.`}
      onClose={onClose}
    >
      <div className="grid min-w-0 gap-4">
        <Input
          label="Link cổng người thuê"
          value={created.url}
          readOnly
          data-testid="portal-link-url"
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void copyWithToast(created.url, 'link')}>Sao chép link</Button>
          <Button variant="secondary" onClick={() => void copyWithToast(message, 'tin nhắn')}>
            Sao chép tin nhắn
          </Button>
          {canWebShare() ? (
            <Button
              variant="secondary"
              onClick={() => void shareLink('Cổng người thuê', message, created.url)}
            >
              Chia sẻ…
            </Button>
          ) : null}
        </div>
        <div
          role="img"
          aria-label="Mã QR của link cổng người thuê"
          className="justify-self-center rounded-control border border-line bg-surface p-2 text-ink"
          data-testid="portal-link-qr"
        >
          <QRCodeSVG
            value={created.url}
            size={176}
            level="M"
            marginSize={2}
            fgColor="currentColor"
            aria-hidden
          />
        </div>
        <p className="text-ui-sm text-muted">
          Người thuê mở link, nhập 4 số cuối số điện thoại của chính họ; thiết bị được ghi nhớ 90
          ngày. Sai 5 lần thì link tạm khoá 15 phút.
        </p>
        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Overlay>
  );
}

function LinkFacts({ link }: { link: TenantPortalLink | undefined }) {
  if (!link) return <p className="text-ui-sm text-muted">Chưa có link.</p>;
  const status = STATUS[link.status];

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-ui-sm text-muted">
      <Tag tone={status.tone} size="sm" data-status={link.status}>
        {status.label}
      </Tag>
      <span>
        {link.lastOpenedAt
          ? `Lần mở gần nhất ${dateTime.format(new Date(link.lastOpenedAt))}`
          : 'Chưa mở'}
      </span>
      {link.status === 'active' && link.activeSessions > 0 ? (
        <span>{link.activeSessions} thiết bị đang đăng nhập</span>
      ) : null}
      {link.status === 'locked' && link.lockedUntil ? (
        <span>Khoá đến {dateTime.format(new Date(link.lockedUntil))}</span>
      ) : null}
    </div>
  );
}

/**
 * "Cổng người thuê" on O-17: one portal link per current occupant — create/regenerate (shown
 * once with copy, Web Share and QR), status, last opened and revoke with confirmation.
 */
export function PortalLinksPanel({ contract }: { contract: StayContract }) {
  const query = usePortalLinks(contract.id);
  const create = useCreatePortalLink();
  const revoke = useRevokePortalLink();
  const canManage = useCanOn('update', 'Contract', { buildingId: contract.buildingId });
  const [created, setCreated] = useState<TenantPortalLinkCreated | null>(null);
  const [confirmNew, setConfirmNew] = useState<Occupant | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<TenantPortalLink | null>(null);
  const [error, setError] = useState<string | null>(null);

  const occupants = currentOccupants(contract);
  const open = ['active', 'ending'].includes(contract.status);
  const latest = (tenantId: string) => query.data?.find((link) => link.tenantId === tenantId);

  const createFor = async (occupant: Occupant) => {
    setError(null);
    try {
      setCreated(
        await create.mutateAsync({ contractId: contract.id, tenantId: occupant.tenantId }),
      );
    } catch (cause) {
      setError(getErrorMessage(cause, 'Không tạo được link cổng người thuê.'));
    }
  };

  const revokeLink = async (link: TenantPortalLink) => {
    setError(null);
    try {
      await revoke.mutateAsync(link.id);
      toast.success('Đã thu hồi link; mọi thiết bị đã vào đều bị đăng xuất.');
    } catch (cause) {
      setError(getErrorMessage(cause, 'Không thu hồi được link.'));
    }
    setConfirmRevoke(null);
  };

  return (
    <div className="grid min-w-0 gap-4" data-testid="portal-links">
      <div className="grid gap-1">
        <h2 className="text-section font-semibold">Cổng người thuê</h2>
        <p className="text-ui-sm text-muted">
          Mỗi người ở có một link riêng để xem hoá đơn, thanh toán VietQR và hợp đồng, không cần tài
          khoản. Link hết hiệu lực 30 ngày sau khi hợp đồng kết thúc.
        </p>
      </div>
      <FormError message={error} />
      {query.isPending ? (
        <LoadingRows rows={2} />
      ) : query.isError && !query.data ? (
        <LoadError error={query.error} onRetry={() => void query.refetch()} />
      ) : occupants.length === 0 ? (
        <p className="text-muted">Hợp đồng không còn người ở.</p>
      ) : (
        <ul className="grid gap-3">
          {occupants.map((occupant) => {
            const link = latest(occupant.tenantId);
            const active = link && ['active', 'locked'].includes(link.status);

            return (
              <li
                key={occupant.tenantId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-line p-3"
                data-testid="portal-link-row"
              >
                <div className="grid min-w-0 gap-1">
                  <p className="font-semibold break-words">
                    {occupant.fullName}
                    {occupant.isPrimary ? ' · Đại diện' : ''}
                  </p>
                  <LinkFacts link={link} />
                </div>
                {canManage && open ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={active ? 'secondary' : 'primary'}
                      loading={create.isPending && create.variables?.tenantId === occupant.tenantId}
                      aria-label={`${active ? 'Tạo link mới' : 'Tạo link'} cho ${occupant.fullName}`}
                      onClick={() => (active ? setConfirmNew(occupant) : void createFor(occupant))}
                    >
                      {active ? 'Tạo link mới' : 'Tạo link'}
                    </Button>
                    {active ? (
                      <Button
                        size="sm"
                        variant="danger"
                        aria-label={`Thu hồi link của ${occupant.fullName}`}
                        onClick={() => setConfirmRevoke(link)}
                      >
                        Thu hồi
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      {created ? (
        <CreatedLinkDialog
          created={created}
          roomCode={contract.roomCode}
          onClose={() => setCreated(null)}
        />
      ) : null}
      <AlertDialog
        open={confirmNew !== null}
        onOpenChange={(value) => {
          if (!value) setConfirmNew(null);
        }}
        title="Tạo link mới?"
        description="Link cũ sẽ không mở được nữa và các thiết bị đã vào bằng link cũ bị đăng xuất."
        confirmLabel="Tạo link mới"
        cancelLabel="Quay lại"
        onConfirm={() => {
          const occupant = confirmNew;

          setConfirmNew(null);
          if (occupant) void createFor(occupant);
        }}
      />
      <AlertDialog
        open={confirmRevoke !== null}
        onOpenChange={(value) => {
          if (!value && !revoke.isPending) setConfirmRevoke(null);
        }}
        title="Thu hồi link cổng?"
        description="Người thuê không mở được cổng bằng link này nữa; mọi thiết bị đã vào bị đăng xuất. Bạn có thể tạo link mới sau."
        confirmLabel="Thu hồi"
        cancelLabel="Quay lại"
        confirmVariant="danger"
        closeOnConfirm={false}
        confirmLoading={revoke.isPending}
        onConfirm={() => {
          if (confirmRevoke) void revokeLink(confirmRevoke);
        }}
      />
    </div>
  );
}
