import {
  AlertDialog,
  Button,
  DatePicker,
  Dialog,
  Drawer,
  Form,
  FormField,
  Input,
  NumberInput,
  Select,
  useAppForm,
} from '@itclabs/react-ui';
import {
  useChangeContract,
  useContract,
  useContractChangePreview,
  useRooms,
  useServices,
  useTenant,
  useTenants,
} from '@stay/sdk/react';
import {
  type ContractChangeInput,
  type ContractChangeKind,
  getErrorMessage,
} from '@stay/sdk/shared';
import type { StayContract } from '@stay/shared';
import { useEffect, useState } from 'react';
import * as v from 'valibot';
import { todayIsoDate } from '@/libraries/format';
import {
  apiFormErrors,
  clearServerErrorOnChange,
  isVersionConflict,
  serverError,
} from '@/libraries/forms/api-errors';
import { DATE_FIELD } from '@/libraries/forms/date-field';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { useFormDirty, useFormValue } from '@/libraries/forms/use-form-value';
import { useMediaQuery } from '@/libraries/use-media-query';

export const CHANGE_LABELS: Record<ContractChangeKind, string> = {
  renew: 'Gia hạn',
  'rent-change': 'Đổi giá thuê',
  occupants: 'Thêm người ở',
  leave: 'Người ở rời đi',
  vehicles: 'Thêm/bớt xe',
  services: 'Bật/tắt dịch vụ',
  'room-change': 'Đổi phòng',
};

const FIELDS = [
  'effectiveDate',
  'endDate',
  'rent',
  'tenantId',
  'fullName',
  'phone',
  'occupantId',
  'newPrimaryTenantId',
  'vehicleId',
  'serviceId',
  'roomId',
  'closingElectric',
  'closingWater',
  'initialElectric',
  'initialWater',
] as const;

export function ContractChangeDialog({
  contract,
  kind,
  onClose,
}: {
  contract: StayContract;
  kind: ContractChangeKind;
  onClose: () => void;
}) {
  const change = useChangeContract();
  const detail = useContract(contract.id);
  const [roomSearch, setRoomSearch] = useState('');
  const [tenantSearch, setTenantSearch] = useState('');
  const rooms = useRooms(contract.buildingId, { pageSize: 100, q: roomSearch || undefined });
  const tenants = useTenants({
    buildingId: contract.buildingId,
    pageSize: 100,
    q: tenantSearch || undefined,
  });
  const services = useServices();
  const [error, setError] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [key] = useState(() => crypto.randomUUID());
  const mobile = useMediaQuery('(max-width: 639px)');
  const form = useAppForm({
    defaultValues: {
      effectiveDate: todayIsoDate(),
      endDate: '',
      rent: null as number | null,
      tenantId: '',
      fullName: '',
      phone: '',
      occupantId: '',
      newPrimaryTenantId: '',
      vehicleTenantId: contract.primaryTenantId ?? '',
      vehicleId: '',
      serviceId: '',
      enabled: 'true',
      roomId: '',
      closingElectric: null as number | null,
      closingWater: null as number | null,
      initialElectric: 0,
      initialWater: 0,
    },
    listeners: clearServerErrorOnChange,
    onSubmit: async () => {
      setError(null);
      try {
        await change.mutateAsync({ ...command, idempotencyKey: key });
        form.reset();
        onClose();
      } catch (cause) {
        setError(
          getErrorMessage(
            cause,
            'Không thể thay đổi hợp đồng. Kiểm tra ngày, số người, chỉ số và phiên bản; tải lại nếu có người khác vừa sửa.',
          ),
        );
      }
    },
  });
  const values = useFormValue(form, (s) => s.values);
  const dirty = useFormDirty(form);
  const { prompt } = useUnsavedChanges(dirty);
  const vehicleTenant = useTenant(values.vehicleTenantId);
  const body: ContractChangeInput = {
    version: contract.version,
    effectiveDate: values.effectiveDate,
  };

  if (kind === 'renew') body.endDate = values.endDate;
  if (
    kind === 'rent-change' ||
    kind === 'room-change' ||
    (kind === 'renew' && values.rent !== null)
  )
    body.rent = values.rent ?? undefined;
  if (kind === 'occupants') {
    if (values.tenantId) body.tenantId = values.tenantId;
    else {
      body.fullName = values.fullName;
      body.phone = values.phone;
    }
  }
  if (kind === 'leave' && values.newPrimaryTenantId)
    body.newPrimaryTenantId = values.newPrimaryTenantId;
  if (kind === 'vehicles') {
    body.vehicleId = values.vehicleId;
    body.enabled = values.enabled === 'true';
  }
  if (kind === 'services') {
    body.serviceId = values.serviceId;
    body.enabled = values.enabled === 'true';
  }
  if (kind === 'room-change') {
    body.roomId = values.roomId;
    body.closingElectric = values.closingElectric ?? undefined;
    body.closingWater = values.closingWater ?? undefined;
    body.initialElectric = values.initialElectric;
    body.initialWater = values.initialWater;
  }
  const command = { id: contract.id, kind, body, occupantId: values.occupantId };
  const preview = useContractChangePreview(command, dirty);
  const serverCause = preview.error ?? change.error;
  const conflict = isVersionConflict(serverCause);

  useEffect(() => {
    const errors = apiFormErrors(serverCause, FIELDS, 'Kiểm tra lại thông tin.');
    // Each change kind mounts only some fields; unmounted ones have no meta to update.
    for (const field of FIELDS)
      if (form.getFieldMeta(field)) form.setFieldMeta(field, serverError(errors.fields[field]));
  }, [serverCause, form]);

  const Overlay = mobile ? Drawer : Dialog;
  const close = () => {
    if (!change.isPending) {
      if (dirty) setConfirmClose(true);
      else onClose();
    }
  };
  const people = contract.occupants
    .filter(
      (o) => o.fromDate <= values.effectiveDate && (!o.toDate || o.toDate > values.effectiveDate),
    )
    .map((o) => ({ value: o.tenantId, label: o.fullName }));

  return (
    <Overlay
      open
      title={CHANGE_LABELS[kind]}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      classNames={{ content: 'max-h-[90dvh] overflow-y-auto', body: 'min-w-0' }}
      {...(mobile ? { side: 'bottom' as const } : {})}
    >
      <Form
        form={form}
        schema={{ effectiveDate: v.pipe(v.string(), v.minLength(10)) }}
        className="grid min-w-0 gap-4"
        aria-label={CHANGE_LABELS[kind]}
      >
        {prompt}
        <FormField name="effectiveDate" label="Ngày hiệu lực" required {...DATE_FIELD}>
          <DatePicker
            minDate={contract.startDate}
            {...(contract.endDate ? { maxDate: contract.endDate } : {})}
            clearable={false}
          />
        </FormField>
        {kind === 'renew' && (
          <FormField name="endDate" label="Ngày kết thúc mới" required {...DATE_FIELD}>
            <DatePicker clearable={false} />
          </FormField>
        )}
        {['renew', 'rent-change', 'room-change'].includes(kind) && (
          <FormField name="rent" label="Giá thuê mới" required={kind !== 'renew'}>
            <NumberInput min={0} max={1_000_000_000} endAddon="₫" />
          </FormField>
        )}
        {kind === 'occupants' && (
          <>
            <FormField name="tenantId" label="Người thuê có sẵn">
              <Select
                searchMode="server"
                onSearchChange={setTenantSearch}
                options={(tenants.data?.data ?? []).map((t) => ({
                  value: t.id,
                  label: t.fullName,
                }))}
                placeholder="Chọn hoặc tạo mới bên dưới"
                clearable
              />
            </FormField>
            {!values.tenantId && (
              <>
                <FormField name="fullName" label="Họ tên" required>
                  <Input maxLength={120} />
                </FormField>
                <FormField name="phone" label="Số điện thoại" required>
                  <Input inputMode="tel" maxLength={10} />
                </FormField>
              </>
            )}
          </>
        )}
        {kind === 'leave' && (
          <>
            <FormField name="occupantId" label="Người rời đi" required>
              <Select options={people} />
            </FormField>
            <FormField name="newPrimaryTenantId" label="Người đại diện mới">
              <Select options={people.filter((p) => p.value !== values.occupantId)} />
            </FormField>
          </>
        )}
        {kind === 'vehicles' && (
          <>
            <FormField name="vehicleTenantId" label="Người sở hữu xe">
              <Select options={people} />
            </FormField>
            <FormField name="vehicleId" label="Xe" required>
              <Select
                options={(vehicleTenant.data?.vehicles ?? []).map((c) => ({
                  value: c.id,
                  label: c.plate,
                }))}
              />
            </FormField>
          </>
        )}
        {kind === 'services' && (
          <FormField name="serviceId" label="Dịch vụ" required>
            <Select
              options={(services.data ?? [])
                .filter((s) => s.active)
                .map((s) => ({ value: s.id, label: s.name }))}
            />
          </FormField>
        )}
        {['vehicles', 'services'].includes(kind) && (
          <FormField name="enabled" label="Thao tác" required>
            <Select
              options={[
                { value: 'true', label: 'Thêm / bật' },
                { value: 'false', label: 'Bớt / tắt' },
              ]}
            />
          </FormField>
        )}
        {kind === 'room-change' && (
          <>
            <FormField name="roomId" label="Phòng mới" required>
              <Select
                searchMode="server"
                onSearchChange={setRoomSearch}
                options={(rooms.data?.data ?? [])
                  .filter((r) => r.id !== contract.roomId)
                  .map((r) => ({ value: r.id, label: r.code }))}
              />
            </FormField>
            <FormField name="closingElectric" label="Điện cuối phòng cũ" required>
              <NumberInput min={0} />
            </FormField>
            <FormField name="closingWater" label="Nước cuối phòng cũ" required>
              <NumberInput min={0} />
            </FormField>
            <FormField name="initialElectric" label="Điện đầu phòng mới" required>
              <NumberInput min={0} />
            </FormField>
            <FormField name="initialWater" label="Nước đầu phòng mới" required>
              <NumberInput min={0} />
            </FormField>
          </>
        )}
        <section
          aria-label="Ảnh hưởng tới hoá đơn"
          className="grid gap-2 rounded-control bg-canvas p-3"
        >
          <h3 className="font-semibold">Ảnh hưởng tới hoá đơn</h3>
          {preview.isFetching ? (
            <p>Đang kiểm tra…</p>
          ) : preview.data ? (
            <>
              <p>{preview.data.impact.description}</p>
              {preview.data.impact.warnings.map((w) => (
                <p key={w} role="alert">
                  {w}
                </p>
              ))}
            </>
          ) : (
            <p role={preview.error ? 'alert' : undefined}>
              {conflict
                ? 'Dữ liệu đã thay đổi, tải lại?'
                : preview.error
                  ? getErrorMessage(preview.error, 'Kiểm tra lại dữ liệu thay đổi.')
                  : 'Điền thông tin để xem ảnh hưởng.'}
            </p>
          )}
        </section>
        {conflict && (
          <Button
            variant="secondary"
            onClick={() => {
              change.reset();
              setError(null);
              void detail.refetch();
            }}
          >
            Tải lại dữ liệu hợp đồng
          </Button>
        )}
        {error && (
          <p role="alert" className="text-danger-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={close}>
            Huỷ
          </Button>
          <Button
            type="submit"
            loading={change.isPending}
            disabled={!preview.data || preview.isFetching || Boolean(preview.error)}
          >
            Lưu thay đổi
          </Button>
        </div>
      </Form>
      <AlertDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="Bỏ thay đổi chưa lưu?"
        description="Thông tin vừa nhập sẽ bị bỏ."
        confirmLabel="Bỏ thay đổi"
        cancelLabel="Tiếp tục nhập"
        onConfirm={() => {
          form.reset();
          onClose();
        }}
      />
    </Overlay>
  );
}
