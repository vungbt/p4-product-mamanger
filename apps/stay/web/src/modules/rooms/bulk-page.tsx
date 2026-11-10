import {
  Alert,
  Button,
  type ColumnDef,
  DataTable,
  Form,
  FormField,
  FormSubmit,
  Input,
  NumberInput,
  Tag,
  useAppForm,
  useFormatters,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useBulkCreateRooms, usePreviewBulkRooms } from '@stay/sdk/react';
import type { components } from '@stay/sdk/shared';
import {
  DEFAULT_ROOM_CODE_TEMPLATE,
  ROOM_AREA_MAX,
  ROOM_BULK_PER_FLOOR_MAX,
  ROOM_FLOOR_MAX,
  ROOM_FLOOR_MIN,
  ROOM_MAX_OCCUPANTS_LIMIT,
  ROOM_PRICE_MAX,
} from '@stay/shared';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import * as v from 'valibot';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { ROUTES } from '@/routing/route-configs';
import { ServiceChecklist } from './components/service-checklist';
import { serverErrors, useLeaveConfirmation } from './form-errors';

type PreviewItem = components['schemas']['RoomBulkPreviewItem'];

type BulkValues = {
  floorFrom: number | null;
  floorTo: number | null;
  roomsPerFloor: number | null;
  template: string;
  listPrice: number | null;
  maxOccupants: number | null;
  areaM2: number | null;
  serviceIds: string[];
};

const FIELDS = [
  'floorFrom',
  'floorTo',
  'roomsPerFloor',
  'template',
  'listPrice',
  'maxOccupants',
  'areaM2',
  'serviceIds',
] as const satisfies readonly (keyof BulkValues)[];

const DEFAULT_VALUES: BulkValues = {
  floorFrom: 1,
  floorTo: 3,
  roomsPerFloor: 4,
  template: DEFAULT_ROOM_CODE_TEMPLATE,
  listPrice: null,
  maxOccupants: 2,
  areaM2: null,
  serviceIds: [],
};

/** The batch being previewed: the request it came from, its codes and the edited prices. */
type Batch = {
  /** Sent as `Idempotency-Key`: retries of this batch never create rooms twice. */
  key: string;
  values: BulkValues;
  items: PreviewItem[];
  prices: Record<string, number>;
};

function newKey() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** O-10 Tạo nhanh nhiều phòng: floors × rooms from a code template, previewed before creating. */
export default function RoomBulkPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { building, buildingId } = useActiveBuilding();
  const preview = usePreviewBulkRooms();
  const create = useBulkCreateRooms();
  const { formatCurrency } = useFormatters();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

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
      floorFrom: whole(ROOM_FLOOR_MIN, ROOM_FLOOR_MAX),
      floorTo: whole(ROOM_FLOOR_MIN, ROOM_FLOOR_MAX),
      roomsPerFloor: whole(1, ROOM_BULK_PER_FLOOR_MAX),
      template: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, required),
        v.includes('{number}', t('rooms.bulk.templateNumber')),
      ),
      listPrice: whole(0, ROOM_PRICE_MAX),
      maxOccupants: whole(1, ROOM_MAX_OCCUPANTS_LIMIT),
      areaM2: v.nullable(
        v.pipe(
          v.number(),
          v.gtValue(0, t('rooms.form.area', { max: ROOM_AREA_MAX })),
          v.maxValue(ROOM_AREA_MAX, t('rooms.form.area', { max: ROOM_AREA_MAX })),
        ),
      ),
    };
  }, [t]);

  const form = useAppForm({
    defaultValues: DEFAULT_VALUES,
    listeners: {
      onChange: ({ fieldApi }) => {
        // Editing the inputs discards the preview: the table must match what will be created.
        setBatch(null);
        setDirty(true);
        if (fieldApi.state.meta.errorMap.onServer)
          fieldApi.setMeta((meta) => ({
            ...meta,
            errorMap: { ...meta.errorMap, onServer: undefined },
          }));
      },
    },
    onSubmit: async ({ value }) => {
      if (!buildingId) return;
      setFormError(null);
      setCreateError(null);

      try {
        const result = await preview.mutateAsync({
          buildingId,
          body: {
            floorFrom: value.floorFrom ?? 0,
            floorTo: value.floorTo ?? 0,
            roomsPerFloor: value.roomsPerFloor ?? 1,
            template: value.template.trim(),
          },
        });
        const price = value.listPrice ?? 0;

        setBatch({
          key: newKey(),
          values: value,
          items: result.items,
          prices: Object.fromEntries(result.items.map((item) => [item.code, price])),
        });
      } catch (error) {
        const result = serverErrors(error, FIELDS, t('rooms.bulk.previewFailed'));

        for (const [field, message] of Object.entries(result.fields))
          if (typeof message === 'string')
            form.setFieldMeta(FIELDS.find((item) => item === field) ?? 'template', (meta) => ({
              ...meta,
              isTouched: true,
              errorMap: { ...meta.errorMap, onServer: message },
            }));
        setBatch(null);
        setFormError(result.general);
      }
    },
  });

  const current = batch;
  const toCreate = current?.items.filter((item) => !item.exists) ?? [];

  useLeaveConfirmation(dirty, t('rooms.form.leaveConfirm'));

  const setPrice = (code: string, price: number | null) => {
    if (!current) return;
    setBatch({ ...current, prices: { ...current.prices, [code]: price ?? 0 } });
  };

  const submitBatch = async () => {
    if (!current || !buildingId) return;
    setCreateError(null);

    const listPrice = current.values.listPrice ?? 0;

    try {
      const result = await create.mutateAsync({
        buildingId,
        idempotencyKey: current.key,
        body: {
          floorFrom: current.values.floorFrom ?? 0,
          floorTo: current.values.floorTo ?? 0,
          roomsPerFloor: current.values.roomsPerFloor ?? 1,
          template: current.values.template.trim(),
          listPrice,
          maxOccupants: current.values.maxOccupants ?? 1,
          areaM2: current.values.areaM2,
          serviceIds: current.values.serviceIds,
          prices: toCreate
            .filter((item) => current.prices[item.code] !== listPrice)
            .map((item) => ({
              code: item.code,
              listPrice: current.prices[item.code] ?? listPrice,
            })),
        },
      });

      toast.success(
        t('rooms.bulk.created', { count: result.created.length, skipped: result.skipped.length }),
      );
      setDirty(false);
      navigate(ROUTES.rooms);
    } catch (error) {
      setCreateError(serverErrors(error, [], t('rooms.bulk.createFailed')).general);
    }
  };

  const columns: ColumnDef<PreviewItem, unknown>[] = [
    { id: 'code', header: t('rooms.fields.code'), cell: ({ row }) => row.original.code },
    { id: 'floor', header: t('rooms.fields.floor'), cell: ({ row }) => row.original.floor },
    {
      id: 'price',
      header: t('rooms.fields.listPrice'),
      cell: ({ row }) =>
        row.original.exists || !current ? (
          <span className="text-muted">—</span>
        ) : (
          <NumberInput
            aria-label={t('rooms.bulk.priceOf', { code: row.original.code })}
            value={current.prices[row.original.code] ?? 0}
            onValueChange={(price) => setPrice(row.original.code, price)}
            min={0}
            max={ROOM_PRICE_MAX}
            step={100_000}
            controls={false}
            size="sm"
            className="w-36"
            data-testid={`bulk-price-${row.original.code}`}
          />
        ),
    },
    {
      id: 'status',
      header: t('rooms.bulk.result'),
      cell: ({ row }) =>
        row.original.exists ? (
          <Tag size="sm">{t('rooms.bulk.skip')}</Tag>
        ) : (
          <Tag size="sm" tone="success">
            {t('rooms.bulk.willCreate')}
          </Tag>
        ),
    },
  ];

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-heading font-bold text-ink">{t('rooms.bulk.title')}</h1>
        {building ? (
          <p className="mt-1 text-ui-sm text-muted">
            {t('rooms.bulk.description', { building: building.name })}
          </p>
        ) : null}
      </header>

      <Form form={form} schema={schema} className="grid gap-5" noValidate data-testid="bulk-form">
        {formError ? (
          <Alert tone="danger" role="alert">
            {formError}
          </Alert>
        ) : null}

        <section className="grid gap-4 rounded-panel border border-line bg-surface p-4 shadow-panel sm:grid-cols-3 sm:p-5">
          <FormField name="floorFrom" label={t('rooms.bulk.floorFrom')} required className="mb-0">
            <NumberInput min={ROOM_FLOOR_MIN} max={ROOM_FLOOR_MAX} step={1} />
          </FormField>
          <FormField name="floorTo" label={t('rooms.bulk.floorTo')} required className="mb-0">
            <NumberInput min={ROOM_FLOOR_MIN} max={ROOM_FLOOR_MAX} step={1} />
          </FormField>
          <FormField
            name="roomsPerFloor"
            label={t('rooms.bulk.roomsPerFloor')}
            required
            className="mb-0"
          >
            <NumberInput min={1} max={ROOM_BULK_PER_FLOOR_MAX} step={1} />
          </FormField>
          <FormField
            name="template"
            label={t('rooms.bulk.template')}
            required
            className="mb-0 sm:col-span-3"
          >
            <Input hint={t('rooms.bulk.templateHint')} maxLength={40} />
          </FormField>
          <FormField name="listPrice" label={t('rooms.bulk.listPrice')} required className="mb-0">
            <NumberInput
              min={0}
              max={ROOM_PRICE_MAX}
              step={100_000}
              endAddon="₫"
              controls={false}
            />
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
              />
            )}
          </FormField>
        </section>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate(ROUTES.rooms)}>
            {t('rooms.form.cancel')}
          </Button>
          <FormSubmit form={form}>
            {(isSubmitting) => (
              <Button type="submit" variant="secondary" loading={isSubmitting}>
                {t('rooms.bulk.preview')}
              </Button>
            )}
          </FormSubmit>
        </div>
      </Form>

      {current ? (
        <section
          aria-labelledby="bulk-preview-title"
          className="grid gap-3"
          data-testid="bulk-preview"
        >
          <div>
            <h2 id="bulk-preview-title" className="text-section font-semibold text-ink">
              {t('rooms.bulk.previewTitle')}
            </h2>
            <p className="text-ui-sm text-muted" data-testid="bulk-summary">
              {t('rooms.bulk.summary', {
                create: toCreate.length,
                skip: current.items.length - toCreate.length,
              })}
            </p>
          </div>
          {createError ? (
            <Alert tone="danger" role="alert">
              {createError}
            </Alert>
          ) : null}
          <DataTable
            caption={t('rooms.bulk.previewTitle')}
            rows={current.items}
            columns={columns}
            rowId={(row) => row.code}
            pagination={false}
            stickyHeader
            maxHeight="28rem"
          />
          <div className="flex flex-wrap items-center justify-end gap-3">
            <span className="text-ui-sm text-muted">
              {t('rooms.bulk.total', {
                amount: formatCurrency(
                  toCreate.reduce((sum, item) => sum + (current.prices[item.code] ?? 0), 0),
                  'VND',
                ),
              })}
            </span>
            <Button
              onClick={() => void submitBatch()}
              loading={create.isPending}
              disabled={!toCreate.length}
              data-testid="bulk-create"
            >
              {t('rooms.bulk.create', { count: toCreate.length })}
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
