import {
  Alert,
  Button,
  DatePicker,
  Dialog,
  Form,
  FormActions,
  FormField,
  FormGrid,
  FormLayout,
  FormSection,
  FormSubmit,
  Textarea,
  useAppForm,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useSetRoomMaintenance } from '@stay/sdk/react';
import { isoDateInTimeZone } from '@stay/shared';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';
import { serverErrors } from '../form-errors';
import type { Room } from '../room-status';

type MaintenanceValues = { reason: string; until: string | null };

const EMPTY_VALUES: MaintenanceValues = { reason: '', until: null };

type MaintenanceDialogProps = {
  /** The room to switch; `null` closes the dialog. */
  room: Pick<Room, 'id' | 'code' | 'maintenance' | 'version'> | null;
  onClose: () => void;
  /** Reloads the room after a 409 (someone else changed it). */
  onReload: () => void;
};

/**
 * "Bật/tắt bảo trì phòng" (screens.md): switching on asks for a reason and an optional expected
 * end; switching off only confirms. Refused by the API while a contract holds the room.
 */
export function MaintenanceDialog({ room, onClose, onReload }: MaintenanceDialogProps) {
  const { t } = useTranslation();
  const mutation = useSetRoomMaintenance();
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  const turningOn = room ? !room.maintenance : false;
  const today = isoDateInTimeZone(new Date());

  const schema = useMemo(
    () => ({
      reason: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, t('rooms.maintenance.reasonRequired')),
        v.maxLength(255, t('rooms.form.tooLong', { max: 255 })),
      ),
      until: v.nullable(v.string()),
    }),
    [t],
  );

  const close = () => {
    setError(null);
    setStale(false);
    form.reset();
    onClose();
  };

  const submit = async (reason: string, until: string | null) => {
    if (!room) return;
    setError(null);
    setStale(false);

    try {
      await mutation.mutateAsync({
        id: room.id,
        body: turningOn
          ? {
              maintenance: true,
              reason: reason.trim(),
              ...(until ? { until } : {}),
              version: room.version,
            }
          : { maintenance: false, version: room.version },
      });
      toast.success(
        turningOn
          ? t('rooms.maintenance.onDone', { code: room.code })
          : t('rooms.maintenance.offDone', { code: room.code }),
      );
      close();
    } catch (cause) {
      const result = serverErrors(cause, [], t('rooms.maintenance.failed'));

      setStale(result.stale);
      setError(result.stale ? t('rooms.form.stale') : result.general);
    }
  };

  const form = useAppForm({
    defaultValues: EMPTY_VALUES,
    onSubmit: ({ value }) => submit(value.reason, value.until),
  });

  const errorAlert = error ? (
    <Alert
      tone="danger"
      role="alert"
      action={
        stale ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              onReload();
              close();
            }}
          >
            {t('rooms.form.reload')}
          </Button>
        ) : undefined
      }
    >
      {error}
    </Alert>
  ) : null;

  return (
    <Dialog
      open={Boolean(room)}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      title={
        turningOn
          ? t('rooms.maintenance.onTitle', { code: room?.code ?? '' })
          : t('rooms.maintenance.offTitle', { code: room?.code ?? '' })
      }
      description={
        turningOn ? t('rooms.maintenance.onDescription') : t('rooms.maintenance.offDescription')
      }
      data-testid="maintenance-dialog"
    >
      {turningOn ? (
        <Form form={form} schema={schema} className="grid gap-4" noValidate>
          <FormLayout size="full">
            <FormSection>
              <FormGrid columns={1}>
                {errorAlert}
                <FormField
                  name="reason"
                  label={t('rooms.maintenance.reason')}
                  required
                  className="mb-0"
                >
                  <Textarea rows={3} placeholder={t('rooms.maintenance.reasonPlaceholder')} />
                </FormField>
                <FormField name="until" label={t('rooms.maintenance.until')} className="mb-0">
                  <DatePicker
                    minDate={today}
                    clearable
                    placeholder={t('rooms.maintenance.untilEmpty')}
                  />
                </FormField>
              </FormGrid>
            </FormSection>
            <FormActions>
              <Button variant="secondary" onClick={close}>
                {t('rooms.form.cancel')}
              </Button>
              <FormSubmit form={form}>
                {(isSubmitting) => (
                  <Button type="submit" loading={isSubmitting}>
                    {t('rooms.maintenance.confirmOn')}
                  </Button>
                )}
              </FormSubmit>
            </FormActions>
          </FormLayout>
        </Form>
      ) : (
        <div className="grid gap-4">
          {errorAlert}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={close}>
              {t('rooms.form.cancel')}
            </Button>
            <Button loading={mutation.isPending} onClick={() => void submit('', null)}>
              {t('rooms.maintenance.confirmOff')}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
