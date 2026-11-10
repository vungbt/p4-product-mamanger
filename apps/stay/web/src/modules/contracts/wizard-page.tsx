import {
  Alert,
  AlertDialog,
  Button,
  Checkbox,
  Form,
  FormField,
  Input,
  NumberInput,
  Select,
  Skeleton,
  Textarea,
  useAppForm,
} from '@itclabs/react-ui';
import {
  useActivateContract,
  useBuildingPrices,
  useContract,
  useCreateContract,
  useCreateTenant,
  useMoveInPreview,
  useRoom,
  useRooms,
  useStaySdk,
  useTenant,
  useTenants,
  useUpdateContract,
} from '@stay/sdk/react';
import { ApiSdkError, createUploadApi, getErrorMessage } from '@stay/sdk/shared';
import {
  type ContractInput,
  isIsoDate,
  type StayContract,
  type StayRoomDetail,
} from '@stay/shared';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as v from 'valibot';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { displayDate, formatVnd, todayIsoDate } from '@/libraries/format';
import { apiFormErrors, serverError } from '@/libraries/forms/api-errors';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { useFormValue } from '@/libraries/forms/use-form-value';
import { LoadError } from './contract-ui';
import { MoveInPreview } from './preview';

const STEPS = [
  'Phòng & thời hạn',
  'Người ở',
  'Dịch vụ & xe',
  'Cọc & chỉ số',
  'Xem trước & kích hoạt',
];
const FIELDS = [
  'roomId',
  'startDate',
  'endDate',
  'rent',
  'depositAmount',
  'depositCollected',
  'depositMethod',
  'depositDate',
  'initialElectricPhotoFileId',
  'initialWaterPhotoFileId',
  'depositNote',
  'initialElectric',
  'initialWater',
  'note',
  'occupantIds',
  'primaryTenantId',
  'serviceIds',
  'vehicleIds',
] as const;

function QuickTenant({
  buildingId,
  onCreated,
}: {
  buildingId: string;
  onCreated: (id: string) => void;
}) {
  const create = useCreateTenant();
  const [error, setError] = useState<string | null>(null);
  const form = useAppForm({
    defaultValues: { fullName: '', phone: '' },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        const tenant = await create.mutateAsync({ buildingId, ...value });

        form.reset();
        onCreated(tenant.id);
      } catch (e) {
        const errors = apiFormErrors(e, ['fullName', 'phone'], 'Không thể tạo người thuê.');

        for (const field of ['fullName', 'phone'] as const)
          form.setFieldMeta(field, serverError(errors.fields[field]));
        setError(errors.message);
      }
    },
  });
  const dirty = useFormValue(form, (s) => !s.isDefaultValue);

  useUnsavedChanges(dirty);

  return (
    <Form
      form={form}
      aria-labelledby="quick-tenant-heading"
      schema={{
        fullName: v.pipe(v.string(), v.trim(), v.minLength(1, 'Nhập họ tên')),
        phone: v.pipe(v.string(), v.regex(/^0\d{9}$/, 'SĐT gồm 10 số, bắt đầu 0')),
      }}
      className="grid gap-3 rounded-panel border border-line bg-surface p-4"
    >
      <h2 id="quick-tenant-heading" className="font-semibold">
        Tạo nhanh người thuê
      </h2>
      {error && <Alert tone="danger">{error}</Alert>}
      <FormField name="fullName" label="Họ tên" required>
        <Input />
      </FormField>
      <FormField name="phone" label="Số điện thoại" required>
        <Input inputMode="tel" />
      </FormField>
      <Button type="submit" loading={create.isPending}>
        Thêm người thuê
      </Button>
    </Form>
  );
}

function VehicleChoices({
  tenantId,
  selected,
  onChange,
}: {
  tenantId: string;
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const tenant = useTenant(tenantId);

  if (tenant.isError) return <LoadError error={tenant.error} retry={() => void tenant.refetch()} />;
  return (
    <>
      {tenant.data?.vehicles.map((vehicle) => (
        <Checkbox
          key={vehicle.id}
          checked={selected.includes(vehicle.id)}
          label={`${tenant.data.fullName} · ${vehicle.plate}`}
          onCheckedChange={(checked) =>
            onChange(
              checked === true
                ? [...selected, vehicle.id]
                : selected.filter((id) => id !== vehicle.id),
            )
          }
        />
      ))}
    </>
  );
}

function Wizard({
  buildingId,
  draft,
  roomId,
  initialRoom,
}: {
  buildingId: string;
  draft?: StayContract;
  roomId: string;
  initialRoom?: StayRoomDetail;
}) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [saved, setSaved] = useState(draft);
  const [step, setStep] = useState(Math.min(4, Math.max(0, Number(params.get('step')) || 0)));
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [tenantSearch, setTenantSearch] = useState('');
  const [roomSearch, setRoomSearch] = useState('');
  const sdk = useStaySdk();
  const uploader = useMemo(() => createUploadApi(sdk, { baseUrl: window.location.origin }), [sdk]);
  const [uploading, setUploading] = useState(false);
  const [createKey] = useState(() => crypto.randomUUID());
  const create = useCreateContract();
  const update = useUpdateContract();
  const activate = useActivateContract();
  const preview = useMoveInPreview(step === 4 ? (saved?.id ?? '') : '');
  const guard = useUnsavedChanges(dirty);
  const initial: ContractInput = draft ?? {
    roomId,
    startDate: todayIsoDate(),
    endDate: null,
    rent: initialRoom?.listPrice ?? 0,
    depositAmount: 0,
    depositCollected: false,
    depositMethod: 'cash',
    depositDate: null,
    initialElectricPhotoFileId: null,
    initialWaterPhotoFileId: null,
    depositNote: null,
    initialElectric: (() => {
      const m = initialRoom?.meters.find((m) => m.kind === 'electricity');
      return m?.latestReading ?? m?.initialReading ?? 0;
    })(),
    initialWater: (() => {
      const m = initialRoom?.meters.find((m) => m.kind === 'water');
      return m?.latestReading ?? m?.initialReading ?? 0;
    })(),
    note: null,
    occupantIds: [],
    primaryTenantId: null,
    serviceIds: initialRoom?.defaultServices.filter((s) => s.active).map((s) => s.id) ?? [],
    vehicleIds: [],
  };
  const form = useAppForm({
    defaultValues: initial,
    listeners: {
      onChange: ({ fieldApi }) => {
        setDirty(true);
        if (fieldApi.state.meta.errorMap.onServer) fieldApi.setMeta(serverError(undefined));
      },
    },
    onSubmit: async ({ value }) => {
      setError(null);
      setStale(false);
      try {
        const contract = saved
          ? await update.mutateAsync({ id: saved.id, body: { ...value, version: saved.version } })
          : await create.mutateAsync({ ...value, idempotencyKey: createKey });

        setSaved(contract);
        setDirty(false);
        // Preserve the draft id so reload resumes the same contract.
        guard.allowNavigation();
        setParams(
          (current) => {
            const next = new URLSearchParams(current);
            next.set('draftId', contract.id);
            next.set('step', String(Math.min(step + 1, 4)));
            return next;
          },
          { replace: true },
        );
        setStep((s) => Math.min(s + 1, 4));
      } catch (e) {
        const errors = apiFormErrors(e, FIELDS, 'Không thể lưu hợp đồng.');

        for (const field of FIELDS) form.setFieldMeta(field, serverError(errors.fields[field]));
        const conflict = e instanceof ApiSdkError && e.code === 'version_conflict';

        setStale(conflict);
        setError(
          conflict
            ? 'Dữ liệu đã thay đổi, tải lại?'
            : (errors.message ?? 'Kiểm tra các trường được đánh dấu.'),
        );
      }
    },
  });
  const value = useFormValue(form, (s) => s.values);
  const rooms = useRooms(buildingId, {
    status: 'vacant',
    pageSize: 100,
    q: roomSearch || undefined,
  });
  const room = useRoom(value.roomId);
  const tenants = useTenants({ buildingId, pageSize: 100, q: tenantSearch || undefined });
  const prices = useBuildingPrices(
    buildingId,
    isIsoDate(value.startDate) ? value.startDate : undefined,
  );

  const selectRoom = (id: string | null) => {
    const selected = rooms.data?.data.find((r) => r.id === id);

    form.setFieldValue('roomId', id ?? '');
    if (selected) {
      form.setFieldValue('rent', selected.listPrice);
      form.setFieldValue(
        'serviceIds',
        selected.defaultServiceIds.filter(
          (id) => !prices.data || prices.data.items.some((s) => s.serviceId === id && s.active),
        ),
      );
    }
    setDirty(true);
  };

  const applyMeters = () => {
    for (const meter of room.data?.meters ?? [])
      form.setFieldValue(
        meter.kind === 'electricity' ? 'initialElectric' : 'initialWater',
        meter.latestReading ?? meter.initialReading,
      );
    setDirty(true);
  };

  const addTenant = (id: string) => {
    form.setFieldValue('occupantIds', [...new Set([...value.occupantIds, id])]);
    if (!value.primaryTenantId) form.setFieldValue('primaryTenantId', id);
    setDirty(true);
  };

  const uploadPhoto = async (
    field: 'initialElectricPhotoFileId' | 'initialWaterPhotoFileId',
    file: File,
  ) => {
    setUploading(true);
    setDirty(true);
    try {
      const id = await uploader.uploadImage({ purpose: 'contract_meter', buildingId, file });

      form.setFieldValue(field, id);
    } catch (e) {
      setError(getErrorMessage(e, 'Không thể tải ảnh.'));
    } finally {
      setUploading(false);
    }
  };

  const activateSaved = async () => {
    if (!saved) return;
    try {
      const contract = await activate.mutateAsync(saved.id);

      guard.allowNavigation();
      navigate(`/contracts/${contract.id}`);
    } catch (e) {
      if (e instanceof ApiSdkError && Object.keys(e.fieldErrors).length) {
        for (const field of FIELDS)
          form.setFieldMeta(field, serverError(e.fieldErrors[field]?.[0]));
        setStep(e.fieldErrors.occupantIds || e.fieldErrors.primaryTenantId ? 1 : 3);
        setError(Object.values(e.fieldErrors).flat().join(' '));
      } else setError(getErrorMessage(e, 'Không thể kích hoạt.'));
    }
  };

  return (
    <div className="grid min-w-0 gap-5">
      <h1 className="text-heading font-bold">Tạo hợp đồng</h1>
      <ol className="flex flex-wrap gap-2" aria-label="Các bước">
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={step === i ? 'step' : undefined}
            className={step === i ? 'font-semibold text-accent' : 'text-muted'}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>
      <p className="text-ui-sm text-muted">
        {saved ? `${saved.code} · Đã lưu nháp` : 'Lưu bản nháp ở mỗi bước.'}
      </p>
      {error && (
        <Alert
          tone="danger"
          action={
            stale ? <Button onClick={() => window.location.reload()}>Tải lại</Button> : undefined
          }
        >
          {error}
        </Alert>
      )}
      <Form
        form={form}
        schema={{
          roomId: v.pipe(v.string(), v.minLength(1, 'Chọn phòng')),
          startDate: v.pipe(
            v.string(),
            v.check((date: string) => isIsoDate(date), 'Ngày không hợp lệ'),
          ),
          rent: v.pipe(v.number(), v.minValue(0, 'Giá thuê không âm')),
        }}
        className="grid gap-4 rounded-panel border border-line bg-surface p-4 sm:p-5"
      >
        <h2 className="text-section font-semibold">
          Bước {step + 1}: {STEPS[step]}
        </h2>
        {step === 0 && (
          <>
            <FormField name="roomId" label="Phòng" required>
              {(field) => (
                <Select
                  label="Phòng"
                  value={value.roomId}
                  options={[
                    ...(rooms.data?.data ?? []).map((r) => ({ value: r.id, label: r.code })),
                    ...(room.data && !rooms.data?.data.some((r) => r.id === room.data.id)
                      ? [{ value: room.data.id, label: room.data.code }]
                      : []),
                  ]}
                  selectedOptions={
                    room.data ? [{ value: room.data.id, label: room.data.code }] : []
                  }
                  searchMode="server"
                  onSearchChange={setRoomSearch}
                  loading={rooms.isPending}
                  optionsError={rooms.isError ? 'Không thể tải phòng' : undefined}
                  onRetryOptions={() => void rooms.refetch()}
                  onValueChange={(id) => {
                    selectRoom(id);
                    field.handleBlur();
                  }}
                />
              )}
            </FormField>
            <FormField name="startDate" label="Ngày nhận phòng" required>
              <Input type="date" />
            </FormField>
            <Select
              label="Thời hạn"
              options={[
                { value: '6', label: '6 tháng' },
                { value: '12', label: '12 tháng' },
                { value: 'custom', label: 'Tuỳ chọn ngày kết thúc' },
              ]}
              onValueChange={(months) => {
                if (months === '6' || months === '12') {
                  const date = new Date(`${value.startDate}T00:00:00Z`);
                  if (!Number.isNaN(date.getTime())) {
                    date.setUTCMonth(date.getUTCMonth() + Number(months));
                    date.setUTCDate(date.getUTCDate() - 1);
                    form.setFieldValue('endDate', date.toISOString().slice(0, 10));
                    setDirty(true);
                  }
                }
              }}
            />
            <FormField name="endDate" label="Ngày kết thúc">
              <Input type="date" min={value.startDate} />
            </FormField>
            <FormField name="rent" label="Giá thuê chốt" required>
              <NumberInput min={0} controls={false} endAddon="₫" />
            </FormField>
            <FormField name="note" label="Ghi chú điều khoản">
              <Textarea rows={3} maxLength={2000} />
            </FormField>
          </>
        )}
        {step === 1 && (
          <>
            <FormField name="occupantIds">
              {(field) => (
                <Select
                  label="Người ở trong phòng"
                  multiple
                  value={value.occupantIds}
                  options={(tenants.data?.data ?? []).map((t) => ({
                    value: t.id,
                    label: `${t.fullName} · ${t.phone}`,
                  }))}
                  selectedOptions={(saved?.occupants ?? []).map((o) => ({
                    value: o.tenantId,
                    label: o.fullName,
                  }))}
                  searchMode="server"
                  onSearchChange={setTenantSearch}
                  loading={tenants.isPending}
                  onValueChange={(ids) => {
                    field.handleChange(ids);
                    if (!value.primaryTenantId || !ids.includes(value.primaryTenantId))
                      form.setFieldValue('primaryTenantId', ids[0] ?? null);
                    form.setFieldValue('vehicleIds', []);
                  }}
                />
              )}
            </FormField>
            <FormField name="primaryTenantId" label="Người đại diện" required>
              <Select
                options={value.occupantIds.map((id) => ({
                  value: id,
                  label:
                    tenants.data?.data.find((t) => t.id === id)?.fullName ??
                    saved?.occupants.find((o) => o.tenantId === id)?.fullName ??
                    id,
                }))}
              />
            </FormField>
            {value.occupantIds.length > (room.data?.maxOccupants ?? 20) && (
              <Alert tone="warning">
                Số người vượt giới hạn {room.data?.maxOccupants} người của phòng.
              </Alert>
            )}
          </>
        )}
        {step === 2 && (
          <>
            {prices.isError ? (
              <LoadError error={prices.error} retry={() => void prices.refetch()} />
            ) : (
              <FormField name="serviceIds" label="Dịch vụ">
                {(field) => (
                  <div className="grid gap-3">
                    {prices.data?.items
                      .filter((s) => s.active)
                      .map((s) => (
                        <Checkbox
                          key={s.serviceId}
                          label={`${s.name} · ${formatVnd(s.price)}/${s.unit}`}
                          checked={value.serviceIds.includes(s.serviceId)}
                          onCheckedChange={(checked) =>
                            field.handleChange(
                              checked === true
                                ? [...value.serviceIds, s.serviceId]
                                : value.serviceIds.filter((id) => id !== s.serviceId),
                            )
                          }
                        />
                      ))}
                  </div>
                )}
              </FormField>
            )}
            <FormField name="vehicleIds" label="Xe tính phí">
              {(field) => (
                <div className="grid gap-3">
                  {value.occupantIds.map((id) => (
                    <VehicleChoices
                      key={id}
                      tenantId={id}
                      selected={value.vehicleIds}
                      onChange={field.handleChange}
                    />
                  ))}
                  {!value.occupantIds.length && <p>Chọn người ở trước khi chọn xe.</p>}
                </div>
              )}
            </FormField>
          </>
        )}
        {step === 3 && (
          <>
            <FormField name="depositAmount" label="Tiền cọc">
              <NumberInput min={0} controls={false} endAddon="₫" />
            </FormField>
            <FormField name="depositCollected">
              {(field) => (
                <Checkbox
                  label="Đã thu cọc"
                  checked={value.depositCollected}
                  onCheckedChange={(checked) => field.handleChange(checked === true)}
                />
              )}
            </FormField>
            {value.depositCollected && (
              <>
                <FormField name="depositMethod" label="Phương thức thu">
                  <Select
                    options={[
                      { value: 'cash', label: 'Tiền mặt' },
                      { value: 'bank_transfer', label: 'Chuyển khoản' },
                      { value: 'other', label: 'Khác' },
                    ]}
                  />
                </FormField>
                <FormField name="depositDate" label="Ngày thu cọc" required>
                  <Input type="date" />
                </FormField>
                <FormField name="depositNote" label="Ghi chú thu cọc">
                  <Textarea rows={2} />
                </FormField>
              </>
            )}
            <Button variant="secondary" onClick={applyMeters}>
              Lấy chỉ số gần nhất
            </Button>
            <p className="text-ui-sm text-muted">
              {room.data?.meters
                .map(
                  (m) =>
                    `${m.kind === 'electricity' ? 'Điện' : 'Nước'}: tối thiểu ${m.latestReading ?? m.initialReading}`,
                )
                .join(' · ')}
            </p>
            <FormField name="initialElectric" label="Số điện nhận phòng" required>
              <NumberInput min={0} controls={false} />
            </FormField>
            <FormField name="initialWater" label="Số nước nhận phòng" required>
              <NumberInput min={0} controls={false} />
            </FormField>
          </>
        )}
        {step === 3 &&
          (['initialElectricPhotoFileId', 'initialWaterPhotoFileId'] as const).map((field) => (
            <FormField
              key={field}
              name={field}
              label={
                field === 'initialElectricPhotoFileId'
                  ? 'Ảnh đồng hồ điện (tuỳ chọn)'
                  : 'Ảnh đồng hồ nước (tuỳ chọn)'
              }
            >
              {() => (
                <div className="grid gap-2">
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploading}
                    aria-label={
                      field === 'initialElectricPhotoFileId'
                        ? 'Ảnh đồng hồ điện (tuỳ chọn)'
                        : 'Ảnh đồng hồ nước (tuỳ chọn)'
                    }
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadPhoto(field, file);
                    }}
                  />
                  {value[field] && <p className="text-ui-sm text-muted">Đã tải ảnh</p>}
                </div>
              )}
            </FormField>
          ))}
        {step === 4 && saved && (
          <>
            <p>
              Phòng {saved.roomCode} · {displayDate(saved.startDate)} –{' '}
              {saved.endDate ? displayDate(saved.endDate) : 'Không xác định'}
            </p>
            <p>
              Giá thuê {formatVnd(saved.rent)} · Cọc {formatVnd(saved.depositAmount)} (
              {saved.depositCollected ? 'đã thu' : 'chưa thu'})
            </p>
            <p>
              {saved.occupants
                .map((o) => `${o.fullName}${o.isPrimary ? ' (đại diện)' : ''}`)
                .join(', ')}
            </p>
            <MoveInPreview id={saved.id} />
          </>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
              Quay lại
            </Button>
          )}
          {step < 4 ? (
            <Button
              type="submit"
              disabled={uploading}
              loading={create.isPending || update.isPending}
            >
              Lưu nháp & tiếp tục
            </Button>
          ) : (
            <Button
              disabled={
                dirty || !saved || preview.isPending || preview.isError || preview.isFetching
              }
              loading={activate.isPending}
              onClick={() => setConfirm(true)}
            >
              Kích hoạt
            </Button>
          )}
          <Button variant="ghost" onClick={() => navigate('/contracts')}>
            Về danh sách
          </Button>
        </div>
      </Form>
      {step === 1 && <QuickTenant buildingId={buildingId} onCreated={addTenant} />}
      <AlertDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Kích hoạt hợp đồng?"
        description={`Giá thuê ${formatVnd(saved?.rent ?? 0)}. ${saved?.depositCollected ? `Ghi nhận đã thu cọc ${formatVnd(saved.depositAmount)}.` : 'Cọc chưa thu.'}`}
        confirmLabel="Xác nhận kích hoạt"
        cancelLabel="Quay lại"
        onConfirm={activateSaved}
      />
    </div>
  );
}

export default function ContractWizardPage() {
  const { buildingId } = useActiveBuilding();
  const [params] = useSearchParams();
  const draftId = params.get('draftId') ?? '';
  const query = useContract(draftId);
  const selected = useRoom(params.get('roomId') ?? '');

  if (
    !buildingId ||
    (draftId && query.isPending) ||
    (!draftId && params.get('roomId') && selected.isPending)
  )
    return <Skeleton className="h-64" />;
  if (draftId && query.isError)
    return <LoadError error={query.error} retry={() => void query.refetch()} />;
  if (query.data && query.data.buildingId !== buildingId)
    return <Alert>Hợp đồng thuộc toà khác. Chọn lại toà của hợp đồng để tiếp tục.</Alert>;
  if (query.data && query.data.status !== 'draft')
    return <Alert>Hợp đồng này không còn là bản nháp.</Alert>;
  if (!draftId && selected.data && selected.data.status !== 'vacant')
    return <Alert>Chọn một phòng trống để tạo hợp đồng.</Alert>;
  return (
    <Wizard
      key={`${buildingId}-${draftId || 'new'}`}
      buildingId={buildingId}
      draft={query.data}
      roomId={params.get('roomId') ?? ''}
      initialRoom={selected.data}
    />
  );
}
