import { Button, EmptyState, Tag } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { usePortalCancelRequest, usePortalRequests } from '@stay/sdk/react';
import { getErrorMessage } from '@stay/sdk/shared';
import { isoDateInTimeZone, type PortalTenantRequest } from '@stay/shared';
import { useNavigate } from 'react-router-dom';
import { displayDate } from '@/libraries/format';
import { PortalQuery, portalPaths } from './portal-ui';
import {
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
  requestSummary,
  statusTone,
} from './request-labels';

const dateOf = (iso: string) => displayDate(isoDateInTimeZone(new Date(iso)));

function RequestCard({ item }: { item: PortalTenantRequest }) {
  const cancel = usePortalCancelRequest();

  const withdraw = async () => {
    try {
      await cancel.mutateAsync(item.id);
      toast.success('Đã huỷ yêu cầu.');
    } catch (cause) {
      toast.error(getErrorMessage(cause, 'Không huỷ được. Vui lòng thử lại.'));
    }
  };

  return (
    <li
      className="grid min-w-0 gap-2 rounded-panel border border-line bg-surface p-4"
      data-testid={`portal-request-${item.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-semibold">{REQUEST_TYPE_LABELS[item.type]}</p>
        <Tag tone={statusTone(item.status)} size="sm">
          {REQUEST_STATUS_LABELS[item.status]}
        </Tag>
      </div>
      <p className="break-words">{requestSummary(item.payload)}</p>
      <p className="text-ui-sm text-muted">Gửi ngày {dateOf(item.createdAt)}</p>
      {item.reply ? (
        <div className="rounded-control bg-canvas p-3">
          <p className="text-ui-sm font-semibold">
            {item.status === 'rejected' ? 'Lý do từ chối' : 'Chủ trọ trả lời'}
          </p>
          <p className="whitespace-pre-wrap break-words">{item.reply}</p>
        </div>
      ) : null}
      {item.status === 'new' ? (
        <Button
          variant="ghost"
          size="sm"
          className="justify-self-start"
          loading={cancel.isPending}
          onClick={() => void withdraw()}
        >
          Huỷ yêu cầu
        </Button>
      ) : null}
    </li>
  );
}

/** T-09 list `/p/requests`: own requests with status and the owner's reply. */
export default function PortalRequestsPage() {
  const list = usePortalRequests();
  const navigate = useNavigate();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-heading font-bold">Yêu cầu của tôi</h1>
        <Button onClick={() => navigate(portalPaths.requestNew)}>Gửi yêu cầu mới</Button>
      </div>
      <PortalQuery query={list}>
        {(items) =>
          items.length === 0 ? (
            <EmptyState
              title="Chưa có yêu cầu"
              description="Báo trả phòng, thêm/bớt người ở hoặc xe: gửi đề nghị để chủ trọ duyệt."
            />
          ) : (
            <ul className="grid gap-3" data-testid="portal-request-list">
              {items.map((item) => (
                <RequestCard key={item.id} item={item} />
              ))}
            </ul>
          )
        }
      </PortalQuery>
    </>
  );
}
