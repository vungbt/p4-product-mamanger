import type { InboxItem } from '@stay/shared';
import { displayDateTime, InboxStatusTag, itemSummary, itemTypeLabel } from './request-ui';

/** Inbox rows as cards (mobile-first, also used in the contract "Yêu cầu" tab). */
export function RequestList({
  items,
  onOpen,
  showRoom = true,
}: {
  items: readonly InboxItem[];
  onOpen: (item: InboxItem) => void;
  showRoom?: boolean;
}) {
  return (
    <ul className="grid min-w-0 gap-2">
      {items.map((item) => (
        <li key={`${item.kind}-${item.id}`}>
          <button
            type="button"
            className="grid w-full min-w-0 gap-1 rounded-panel border border-line bg-surface p-3 text-left hover:bg-hover focus-visible:outline-2 focus-visible:outline-accent"
            data-testid={`request-row-${item.id}`}
            onClick={() => onOpen(item)}
          >
            <span className="flex min-w-0 flex-wrap items-center justify-between gap-2">
              <span className="min-w-0 font-semibold break-words">
                {itemTypeLabel(item)}
                {showRoom && item.roomCode ? ` · Phòng ${item.roomCode}` : ''}
              </span>
              <InboxStatusTag status={item.status} />
            </span>
            <span className="min-w-0 break-words">{itemSummary(item)}</span>
            <span className="text-ui-sm text-muted break-words">
              {item.tenantName ?? '—'} · {displayDateTime(item.createdAt)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
