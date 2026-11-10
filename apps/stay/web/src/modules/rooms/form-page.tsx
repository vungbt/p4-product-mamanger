import {
  Alert,
  Button,
  EmptyState,
  Form,
  FormField,
  FormSubmit,
  Input,
  NumberInput,
  Skeleton,
  Textarea,
  useAppForm,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useCreateRoom, useRoom, useUpdateRoom } from '@stay/sdk/react';
import { ApiSdkError, getErrorMessage } from '@stay/sdk/shared';
import {
  METER_READING_MAX,
  ROOM_AREA_MAX,
  ROOM_CODE_MAX_LENGTH,
  ROOM_CODE_PATTERN,
  ROOM_FLOOR_MAX,
  ROOM_FLOOR_MIN,
  ROOM_MAX_OCCUPANTS_LIMIT,
  ROOM_PRICE_MAX,
} from '@stay/shared';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import * as v from 'valibot';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { ROUTES, roomPath } from '@/routing/route-configs';
import { ServiceChecklist } from './components/service-checklist';
import { serverErrors, useLeaveConfirmation } from './form-errors';
import type { RoomDetail } from './room-status';
import { useRoomBuilding } from './use-room-building';

type RoomFormValues = {
  code: string;
  floor: number | null;
  areaM2: number | null;
  listPrice: number | null;
  maxOccupants: number | null;
  serviceIds: string[];
  note: string;
  initialElectric: number | null;
  initialWater: number | null;
  electricSerial: string;
  waterSerial: string;
};

const FIELDS = [
  'code',
  'floor',
  'areaM2',
  'listPrice',
  'maxOccupants',
  'serviceIds',
  'note',
  'initialElectric',
  'initialWater',
  'electricSerial',
  'waterSerial',
] as const satisfies readonly (keyof RoomFormValues)[];

const NEW_ROOM: RoomFormValues = {
  code: '',
  floor: 1,
  areaM2: null,
  listPrice: null,
  maxOccupants: 2,
  serviceIds: [],
  note: '',
  initialElectric: 0,
  initialWater: 0,
  electricSerial: '',
  waterSerial: '',
};

function valuesOf(room: RoomDetail): RoomFormValues {
  return {
    ...NEW_ROOM,
    code: room.code,
    floor: room.floor,
    areaM2: room.areaM2,
    listPrice: room.listPrice,
    maxOccupants: room.maxOccupants,
    serviceIds: room.defaultServiceIds,
    note: room.note ?? '',
  };
}

type RoomFormProps = {
  /** The room to edit; omitted to create one in `buildingId`. */
  room?: RoomDetail;
  buildingId: string;
  /** After a 409, loads the latest room (the form then restarts from it). */
  onReload?: () => void;
};

/** O-09 fields; meters only when creating (replacing a meter is ST-13). */
function RoomForm({ room, buildingId, onReload }: RoomFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const create = useCreateRoom();
  const update = useUpdateRoom();
  const [formError, setFormError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [dirty, setDirty] = useState(false);

  const isNew = !room;

  const schema = useMemo(() => {
    const required = t('rooms.form.required');
    const whole = (min: number, max: number) =>
      v.pipe(
        v.number(required),
        v.integer(t('rooms.form.integer')),
        v.minValue(min, t('rooms.form.range', { min, max })),
        v.maxValue(max, t('rooms.form.range', { min, max })),
      );

    return {
      code: v.pipe(
        v.string(),
        v.trim(),
        v.toUpperCase(),
        v.minLength(1, required),
        v.regex(ROOM_CODE_PATTERN, t('rooms.form.codeFormat')),
      ),
      floor: whole(ROOM_FLOOR_MIN, ROOM_FLOOR_MAX),
      areaM2: v.nullable(
        v.pipe(
          v.number(),
          v.gtValue(0, t('rooms.form.area', { max: ROOM_AREA_MAX })),
          v.maxValue(ROOM_AREA_MAX, t('rooms.form.area', { max: ROOM_AREA_MAX })),
        ),
      ),
      listPrice: whole(0, ROOM_PRICE_MAX),
      maxOccupants: whole(1, ROOM_MAX_OCCUPANTS_LIMIT),
      note: v.pipe(v.string(), v.maxLength(1000, t('rooms.form.tooLong', { max: 1000 }))),
      ...(isNew
        ? {
            initialElectric: whole(0, METER_READING_MAX),
            initialWater: whole(0, METER_READING_MAX),
            electricSerial: v.pipe(
              v.string(),
              v.maxLength(40, t('rooms.form.tooLong', { max: 40 })),
            ),
            waterSerial: v.pipe(v.string(), v.maxLength(40, t('rooms.form.tooLong', { max: 40 }))),
          }
        : {}),
    };
  }, [t, isNew]);

  const form = useAppForm({
    defaultValues: room ? valuesOf(room) : NEW_ROOM,
    listeners: {
      // A server error disappears once its field changes.
      onChange: ({ fieldApi }) => {
        setDirty(true);
        if (fieldApi.state.meta.errorMap.onServer)
          fieldApi.setMeta((meta) => ({
            ...meta,
            errorMap: { ...meta.errorMap, onServer: undefined },
          }));
      },
    },
    onSubmit: async ({ value }) => {
      setFormError(null);
      setStale(false);

      const fields = {
        code: value.code.trim().toUpperCase(),
        floor: value.floor ?? 0,
        areaM2: value.areaM2,
        listPrice: value.listPrice ?? 0,
        maxOccupants: value.maxOccupants ?? 1,
        serviceIds: value.serviceIds,
        note: value.note.trim() || undefined,
      };

      try {
        const saved = room
          ? await update.mutateAsync({ id: room.id, body: { ...fields, version: room.version } })
          : await create.mutateAsync({
              buildingId,
              body: {
                ...fields,
                initialElectric: value.initialElectric ?? 0,
                initialWater: value.initialWater ?? 0,
                electricSerial: value.electricSerial.trim() || undefined,
                waterSerial: value.waterSerial.trim() || undefined,
              },
            });

        setDirty(false);
        toast.success(t(room ? 'rooms.form.updated' : 'rooms.form.created', { code: saved.code }));
        navigate(roomPath(saved.id));
      } catch (error) {
        const result = serverErrors(error, FIELDS, t('rooms.form.saveFailed'));

        for (const [field, message] of Object.entries(result.fields))
          if (typeof message === 'string')
            form.setFieldMeta(FIELDS.find((item) => item === field) ?? 'code', (meta) => ({
              ...meta,
              isTouched: true,
              errorMap: { ...meta.errorMap, onServer: message },
            }));
        setStale(result.stale);
        setFormError(result.stale ? t('rooms.form.stale') : result.general);
      }
    },
  });

  useLeaveConfirmation(dirty, t('rooms.form.leaveConfirm'));

  const cancel = () => navigate(room ? roomPath(room.id) : ROUTES.rooms);

  return (
    <Form form={form} schema={schema} className="grid gap-5" noValidate data-testid="room-form">
      {formError ? (
        <Alert
          tone="danger"
          role="alert"
          data-testid="room-form-error"
          action={
            stale && onReload ? (
              <Button variant="secondary" size="sm" onClick={onReload}>
                {t('rooms.form.reload')}
              </Button>
            ) : undefined
          }
        >
          {formError}
        </Alert>
      ) : null}

      <section className="grid gap-4 rounded-panel border border-line bg-surface p-4 shadow-panel sm:grid-cols-2 sm:p-5">
        <FormField name="code" label={t('rooms.fields.code')} required className="mb-0">
          <Input
            maxLength={ROOM_CODE_MAX_LENGTH}
            autoCapitalize="characters"
            placeholder="101"
            hint={t('rooms.form.codeHint')}
          />
        </FormField>
        <FormField name="floor" label={t('rooms.fields.floor')} required className="mb-0">
          <NumberInput min={ROOM_FLOOR_MIN} max={ROOM_FLOOR_MAX} step={1} />
        </FormField>
        <FormField name="listPrice" label={t('rooms.fields.listPrice')} required className="mb-0">
          <NumberInput min={0} max={ROOM_PRICE_MAX} step={100_000} endAddon="₫" controls={false} />
        </FormField>
        <FormField
          name="maxOccupants"
          label={t('rooms.fields.maxOccupants')}
          required
          className="mb-0"
        >
          <NumberInput min={1} max={ROOM_MAX_OCCUPANTS_LIMIT} step={1} />
        </FormField>
        <FormField name="areaM2" label={t('rooms.fields.areaM2')} className="mb-0">
          <NumberInput min={0} max={ROOM_AREA_MAX} step="any" endAddon="m²" controls={false} />
        </FormField>
      </section>

      <section className="rounded-panel border border-line bg-surface p-4 shadow-panel sm:p-5">
        <FormField name="serviceIds" className="mb-0">
          {(field) => (
            <ServiceChecklist
              value={Array.isArray(field.state.value) ? field.state.value : []}
              onChange={(ids) => field.handleChange(ids)}
              error={
                typeof field.state.meta.errorMap.onServer === 'string'
                  ? field.state.meta.errorMap.onServer
                  : undefined
              }
            />
          )}
        </FormField>
      </section>

      {isNew ? (
        <section
          aria-labelledby="room-meters-title"
          className="grid gap-4 rounded-panel border border-line bg-surface p-4 shadow-panel sm:grid-cols-2 sm:p-5"
        >
          <div className="sm:col-span-2">
            <h2 id="room-meters-title" className="text-section font-semibold text-ink">
              {t('rooms.detail.meters')}
            </h2>
            <p className="text-ui-sm text-muted">{t('rooms.form.metersHint')}</p>
          </div>
          <FormField
            name="initialElectric"
            label={t('rooms.fields.initialElectric')}
            required
            className="mb-0"
          >
            <NumberInput min={0} max={METER_READING_MAX} step={1} endAddon="kWh" controls={false} />
          </FormField>
          <FormField
            name="electricSerial"
            label={t('rooms.fields.electricSerial')}
            className="mb-0"
          >
            <Input maxLength={40} />
          </FormField>
          <FormField
            name="initialWater"
            label={t('rooms.fields.initialWater')}
            required
            className="mb-0"
          >
            <NumberInput min={0} max={METER_READING_MAX} step={1} endAddon="m³" controls={false} />
          </FormField>
          <FormField name="waterSerial" label={t('rooms.fields.waterSerial')} className="mb-0">
            <Input maxLength={40} />
          </FormField>
        </section>
      ) : null}

      <section className="rounded-panel border border-line bg-surface p-4 shadow-panel sm:p-5">
        <FormField name="note" label={t('rooms.fields.note')} className="mb-0">
          <Textarea rows={3} maxLength={1000} />
        </FormField>
      </section>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={cancel}>
          {t('rooms.form.cancel')}
        </Button>
        <FormSubmit form={form}>
          {(isSubmitting) => (
            <Button type="submit" loading={isSubmitting}>
              {isSubmitting ? t('rooms.form.saving') : t('rooms.form.save')}
            </Button>
          )}
        </FormSubmit>
      </div>
    </Form>
  );
}

/** O-09 Form phòng: `/rooms/new` creates in the active building, `/rooms/:id/edit` edits. */
export default function RoomFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const { building, buildingId } = useActiveBuilding();
  const query = useRoom(id);

  const room = query.data;

  useRoomBuilding(room?.buildingId);

  if (!id) {
    if (!buildingId) return <Skeleton className="h-64" />;

    return (
      <div className="grid gap-5">
        <header>
          <h1 className="text-heading font-bold text-ink">{t('rooms.form.createTitle')}</h1>
          {building ? (
            <p className="mt-1 text-ui-sm text-muted">
              {t('rooms.form.createDescription', { building: building.name })}
            </p>
          ) : null}
        </header>
        <RoomForm buildingId={buildingId} />
      </div>
    );
  }

  if (query.isPending) return <Skeleton className="h-64" />;

  if (query.isError || !room) {
    const missing = query.error instanceof ApiSdkError && query.error.status === 404;

    return missing ? (
      <EmptyState
        variant="not-found"
        headingLevel={1}
        title={t('rooms.detail.notFound')}
        description={t('rooms.detail.notFoundDescription')}
        action={
          <Button onClick={() => navigate(ROUTES.rooms)}>{t('rooms.detail.backToMap')}</Button>
        }
      />
    ) : (
      <Alert
        tone="danger"
        title={t('errors.loadFailed')}
        action={
          <Button variant="secondary" size="sm" onClick={() => void query.refetch()}>
            {t('errors.retry')}
          </Button>
        }
      >
        {getErrorMessage(query.error, t('errors.loadFailed'))}
      </Alert>
    );
  }

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-heading font-bold text-ink">
          {t('rooms.form.editTitle', { code: room.code })}
        </h1>
        <p className="mt-1 text-ui-sm text-muted">{room.buildingName}</p>
      </header>
      {/* A reloaded room (new version) restarts the form from its values. */}
      <RoomForm
        key={room.version}
        room={room}
        buildingId={room.buildingId}
        onReload={() => void query.refetch()}
      />
    </div>
  );
}
