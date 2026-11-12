import { Button, EmptyState, Tag } from '@itclabs/react-ui';
import { MediaGallery } from '@itclabs/react-ui/media-gallery';
import { toast } from '@itclabs/react-ui/toast';
import { usePortalCancelMaintenance, usePortalMaintenance } from '@stay/sdk/react';
import { getErrorMessage } from '@stay/sdk/shared';
import { isoDateInTimeZone, type PortalMaintenance } from '@stay/shared';
import { useNavigate } from 'react-router-dom';
import { displayDate } from '@/libraries/format';
import { PortalQuery, portalPaths } from './portal-ui';
import {
  MAINTENANCE_CATEGORY_LABELS,
  MAINTENANCE_SEVERITY_LABELS,
  MAINTENANCE_STATUS_LABELS,
  statusTone,
} from './request-labels';

const dateOf = (iso: string) => displayDate(isoDateInTimeZone(new Date(iso)));

function MaintenanceCard({ item }: { item: PortalMaintenance }) {
  const cancel = usePortalCancelMaintenance();

  const withdraw = async () => {
    try {
      await cancel.mutateAsync(item.id);
      toast.success('Đã huỷ báo hỏng.');
    } catch (cause) {
      toast.error(getErrorMessage(cause, 'Không huỷ được. Vui lòng thử lại.'));
    }
  };

  return (
    <li
      className="grid min-w-0 gap-2 rounded-panel border border-line bg-surface p-4"
      data-testid={`portal-maintenance-${item.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 font-semibold break-words">{item.title}</p>
        <Tag tone={statusTone(item.status)} size="sm">
          {MAINTENANCE_STATUS_LABELS[item.status]}
        </Tag>
      </div>
      <p className="text-ui-sm text-muted">
        {MAINTENANCE_CATEGORY_LABELS[item.category]} · {MAINTENANCE_SEVERITY_LABELS[item.severity]}{' '}
        · {dateOf(item.createdAt)}
      </p>
      {item.description ? (
        <p className="whitespace-pre-wrap break-words">{item.description}</p>
      ) : null}
      {item.photos.length > 0 ? (
        <MediaGallery
          items={item.photos.flatMap((photo, index) =>
            photo.url
              ? [{ id: photo.fileId, src: photo.url, alt: `Ảnh ${index + 1} của báo hỏng` }]
              : [],
          )}
          fit="contain"
          className="max-w-sm"
        />
      ) : null}
      {item.reply ? (
        <div className="rounded-control bg-canvas p-3" data-testid="portal-maintenance-reply">
          <p className="text-ui-sm font-semibold">Chủ trọ trả lời</p>
          <p className="whitespace-pre-wrap break-words">{item.reply}</p>
        </div>
      ) : null}
      {item.status === 'new' && item.isOwn ? (
        <Button
          variant="ghost"
          size="sm"
          className="justify-self-start"
          loading={cancel.isPending}
          onClick={() => void withdraw()}
        >
          Huỷ báo hỏng
        </Button>
      ) : null}
    </li>
  );
}

/** T-08 `/p/maintenance`: reports of the room with status and the owner's reply. */
export default function PortalMaintenancePage() {
  const list = usePortalMaintenance();
  const navigate = useNavigate();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-heading font-bold">Báo hỏng</h1>
        <Button onClick={() => navigate(portalPaths.maintenanceNew)}>Báo hỏng mới</Button>
      </div>
      <PortalQuery query={list}>
        {(items) =>
          items.length === 0 ? (
            <EmptyState
              title="Chưa có báo hỏng"
              description="Thiết bị, điện nước trong phòng có vấn đề? Báo cho chủ trọ tại đây."
            />
          ) : (
            <ul className="grid gap-3" data-testid="portal-maintenance-list">
              {items.map((item) => (
                <MaintenanceCard key={item.id} item={item} />
              ))}
            </ul>
          )
        }
      </PortalQuery>
    </>
  );
}
