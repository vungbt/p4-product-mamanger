import { AlertDialog } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useArchiveBuilding } from '@stay/sdk/react';
import { ApiSdkError } from '@stay/sdk/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type BlockingRoom = { roomId: string; roomCode: string };

/** Rooms with an active contract from a 409 `building_has_active_contracts`. */
function blockingRooms(error: unknown): BlockingRoom[] | null {
  if (!(error instanceof ApiSdkError) || error.code !== 'building_has_active_contracts')
    return null;

  const data = error.data;
  const extensions =
    data && typeof data === 'object' && 'extensions' in data ? data.extensions : undefined;
  const rooms =
    extensions && typeof extensions === 'object' && 'rooms' in extensions
      ? extensions.rooms
      : undefined;

  if (!Array.isArray(rooms)) return [];
  return rooms.flatMap((room: unknown) =>
    room &&
    typeof room === 'object' &&
    'roomId' in room &&
    'roomCode' in room &&
    typeof room.roomId === 'string' &&
    typeof room.roomCode === 'string'
      ? [{ roomId: room.roomId, roomCode: room.roomCode }]
      : [],
  );
}

/**
 * O-04 "Lưu trữ": confirms, then archives. A building with active contracts answers 409 with the
 * blocking rooms, which the dialog lists instead of archiving.
 */
export function ArchiveBuildingDialog({
  building,
  onClose,
}: {
  building: { id: string; name: string } | null;
  onClose: () => void;
}) {
  const { t } = useTranslation('buildings');
  const archive = useArchiveBuilding();
  const [blocked, setBlocked] = useState<BlockingRoom[] | null>(null);

  const close = () => {
    setBlocked(null);
    archive.reset();
    onClose();
  };

  const confirm = async () => {
    if (!building) return;

    try {
      await archive.mutateAsync(building.id);
      toast.success(t('archive.done', { name: building.name }));
      close();
    } catch (error) {
      const rooms = blockingRooms(error);

      if (rooms) setBlocked(rooms);
      else toast.error(error instanceof Error ? error.message : t('archive.failed'));
    }
  };

  return (
    <AlertDialog
      open={Boolean(building)}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      title={t('archive.title', { name: building?.name ?? '' })}
      description={blocked ? t('archive.blocked') : t('archive.description')}
      confirmLabel={t('archive.confirm')}
      cancelLabel={blocked ? t('close') : t('cancel')}
      confirmVariant="danger"
      confirmLoading={archive.isPending}
      confirmDisabled={Boolean(blocked)}
      closeOnConfirm={false}
      onConfirm={() => void confirm()}
      data-testid="archive-building-dialog"
    >
      {blocked ? (
        <ul className="grid gap-1 text-ui-sm text-ink" data-testid="archive-blocking-rooms">
          {blocked.length > 0 ? (
            blocked.map((room) => (
              <li key={room.roomId}>{t('archive.room', { code: room.roomCode })}</li>
            ))
          ) : (
            <li>{t('archive.blockedUnknown')}</li>
          )}
        </ul>
      ) : null}
    </AlertDialog>
  );
}
