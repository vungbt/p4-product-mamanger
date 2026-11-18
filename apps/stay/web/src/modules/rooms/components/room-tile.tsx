import {
  cn,
  DropdownMenu,
  type DropdownMenuEntry,
  Icon,
  IconButton,
  Tag,
  useFormatters,
} from '@itclabs/react-ui';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useCanAccess } from '@/libraries/ability';
import { roomEditPath, roomPath } from '@/routing/route-configs';
import { ROOM_STATUS_STYLES, type Room, RoomStatusBadge } from '../room-status';

type QuickActionOptions = {
  room: Room;
  canManage: boolean;
  t: TFunction;
  open: (path: string) => void;
  onMaintenance: (room: Room) => void;
  /** Set when the user may record payments: "Thu tiền" for a room with debt (ST-15). */
  onCollect?: (room: Room) => void;
  /** The user may settle contracts (owner): "Thanh lý" for an occupied room (ST-17). */
  canSettle?: boolean;
};

/**
 * Quick actions of a room (screens.md O-07). Only actions that work today are listed: ST-10 adds
 * "Tạo hợp đồng" (vacant), ST-13 "Chốt số" and ST-15 "Thu tiền" (debt) here.
 */
export function roomQuickActions({
  room,
  canManage,
  t,
  open,
  onMaintenance,
  onCollect,
  canSettle = false,
}: QuickActionOptions): DropdownMenuEntry[] {
  const entries: DropdownMenuEntry[] = [
    { id: 'view', label: t('rooms.actions.view'), onSelect: () => open(roomPath(room.id)) },
  ];

  if (room.status === 'vacant')
    entries.push({
      id: 'contract',
      label: 'Tạo hợp đồng',
      onSelect: () => open(`/contracts/new?roomId=${room.id}`),
    });
  if (room.debt > 0 && onCollect)
    entries.push({
      id: 'collect',
      label: t('rooms.actions.collect'),
      onSelect: () => onCollect(room),
    });
  if (canSettle && room.status === 'occupied' && room.contract)
    entries.push({
      id: 'settle',
      label: 'Thanh lý',
      onSelect: () => open(`/contracts/${room.contract?.id}/settle`),
    });

  if (!canManage) return entries;

  entries.push({
    id: 'edit',
    label: t('rooms.actions.edit'),
    onSelect: () => open(roomEditPath(room.id)),
  });
  // Maintenance only switches without a contract (rules.md).
  if (!room.contract)
    entries.push({
      id: 'maintenance',
      label: room.maintenance
        ? t('rooms.actions.maintenanceOff')
        : t('rooms.actions.maintenanceOn'),
      onSelect: () => onMaintenance(room),
    });
  return entries;
}

type RoomTileProps = {
  room: Room;
  canManage: boolean;
  onMaintenance: (room: Room) => void;
  onCollect?: (room: Room) => void;
};

/** One room of the map: a compact row on mobile, a card in the floor grid from `sm` up. */
export function RoomTile({ room, canManage, onMaintenance, onCollect }: RoomTileProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatCurrency } = useFormatters();
  const canSettle = useCanAccess('settle', 'Contract');

  const style = ROOM_STATUS_STYLES[room.status];
  const tenant =
    room.contract?.primaryTenantName ??
    (room.status === 'maintenance' ? room.maintenanceReason : null);
  const occupants = room.contract
    ? t('rooms.map.occupants', { count: room.occupantCount, max: room.maxOccupants })
    : t('rooms.map.maxOccupants', { max: room.maxOccupants });
  const actions = roomQuickActions({
    room,
    canManage,
    t,
    open: navigate,
    onMaintenance,
    onCollect,
    canSettle,
  });

  return (
    <li
      className={cn(
        'relative flex min-w-0 overflow-hidden rounded-control border border-line transition-shadow hover:shadow-panel',
        style.surface,
      )}
      data-testid="room-tile"
      data-room-code={room.code}
      data-status={room.status}
    >
      <span aria-hidden className={cn('w-1 shrink-0', style.accent)} />
      <div className="flex min-w-0 flex-1 items-center gap-3 py-2 pl-3 sm:flex-col sm:items-stretch sm:gap-1 sm:py-3">
        <div className="flex min-w-0 items-center gap-2 sm:justify-between">
          <Link
            to={roomPath(room.id)}
            className="text-section font-bold text-ink after:absolute after:inset-0"
            aria-label={t('rooms.map.openRoom', { code: room.code })}
          >
            {room.code}
          </Link>
        </div>
        <div className="grid min-w-0 flex-1 gap-0.5">
          <RoomStatusBadge status={room.status} />
          {room.hasOpenMaintenance ? (
            <span
              className="inline-flex items-center gap-1 text-ui-sm text-warning"
              data-testid="room-open-maintenance"
            >
              <Icon name="wrench" className="size-4" aria-hidden />
              {t('maintenance:openJob')}
            </span>
          ) : null}
          <span className="truncate text-ui-sm text-ink" data-testid="room-tenant">
            {tenant ?? <span className="text-muted">{t('rooms.map.noTenant')}</span>}
          </span>
          <span className="hidden text-ui-sm text-muted sm:block">{occupants}</span>
        </div>
        {room.debt > 0 ? (
          <Tag tone="danger" size="sm" className="w-fit">
            {t('rooms.map.debt', { amount: formatCurrency(room.debt, 'VND') })}
          </Tag>
        ) : null}
      </div>
      <div className="relative z-10 flex items-start p-1">
        <DropdownMenu
          trigger={
            <IconButton
              icon="moreVertical"
              variant="ghost"
              size="sm"
              label={t('rooms.actions.menu', { code: room.code })}
            />
          }
          triggerAsChild
          items={actions}
          data-testid="room-actions"
        />
      </div>
    </li>
  );
}
