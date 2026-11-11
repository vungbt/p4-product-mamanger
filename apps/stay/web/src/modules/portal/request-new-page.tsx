import {
  Button,
  Form,
  FormField,
  FormSubmit,
  Input,
  Select,
  Textarea,
  useAppForm,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { usePortalCreateRequest } from '@stay/sdk/react';
import { ApiSdkError } from '@stay/sdk/shared';
import {
  isIsoDate,
  normalizePhone,
  normalizePlate,
  TENANT_PHONE_PATTERN,
  TENANT_REQUEST_TYPES,
  type TenantRequestPayload,
  type TenantRequestType,
  VEHICLE_TYPES,
  type VehicleType,
} from '@stay/shared';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as v from 'valibot';
import { todayIsoDate } from '@/libraries/format';
import { clearServerErrorOnChange, serverError } from '@/libraries/forms/api-errors';
import { FormError } from '@/libraries/forms/page-states';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { useFormDirty } from '@/libraries/forms/use-form-value';
import { portalPaths } from './portal-ui';
import { REQUEST_TYPE_LABELS, VEHICLE_TYPE_LABELS } from './request-labels';

type Values = {
  date: string;
  fullName: string;
  phone: string;
  plate: string;
  vehicleType: VehicleType;
  text: string;
};

type Field = keyof Values;

const required = (message: string) =>
  v.pipe(v.string(), v.trim(), v.minLength(1, message), v.maxLength(2000, 'Tối đa 2000 ký tự.'));
const date = (message: string) =>
  v.pipe(
    v.string(),
    v.check((value: string) => isIsoDate(value), message),
  );

/** Fields, labels and checks of each request type (screens.md T-09). */
const TYPE_FORMS: Record<
  TenantRequestType,
  {
    fields: Field[];
    labels: Partial<Record<Field, string>>;
    schema: Record<string, v.GenericSchema>;
  }
> = {
  move_out: {
    fields: ['date', 'text'],
    labels: { date: 'Ngày dự kiến trả phòng', text: 'Lý do' },
    schema: {
      date: v.pipe(
        date('Chọn ngày dự kiến trả phòng.'),
        v.check((value: string) => value >= todayIsoDate(), 'Ngày dự kiến không trước hôm nay.'),
      ),
      text: v.pipe(v.string(), v.maxLength(2000, 'Tối đa 2000 ký tự.')),
    },
  },
  add_occupant: {
    fields: ['fullName', 'phone', 'date'],
    labels: { fullName: 'Họ tên người ở mới', phone: 'Số điện thoại', date: 'Ở từ ngày' },
    schema: {
      fullName: required('Nhập họ tên.'),
      phone: v.pipe(
        v.string(),
        v.check((value: string) => {
          const phone = normalizePhone(value);

          return phone !== null && TENANT_PHONE_PATTERN.test(phone);
        }, 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.'),
      ),
      date: date('Chọn ngày bắt đầu ở.'),
    },
  },
  remove_occupant: {
    fields: ['fullName', 'date'],
    labels: { fullName: 'Họ tên người rời đi', date: 'Rời đi từ ngày' },
    schema: { fullName: required('Nhập họ tên.'), date: date('Chọn ngày rời đi.') },
  },
  add_vehicle: {
    fields: ['plate', 'vehicleType', 'date'],
    labels: { plate: 'Biển số', vehicleType: 'Loại xe', date: 'Gửi xe từ ngày' },
    schema: {
      plate: v.pipe(
        v.string(),
        v.check((value: string) => normalizePlate(value) !== null, 'Biển số không hợp lệ.'),
      ),
      vehicleType: v.picklist(VEHICLE_TYPES, 'Chọn loại xe.'),
      date: date('Chọn ngày bắt đầu.'),
    },
  },
  remove_vehicle: {
    fields: ['plate', 'date'],
    labels: { plate: 'Biển số', date: 'Thôi gửi từ ngày' },
    schema: {
      plate: v.pipe(
        v.string(),
        v.check((value: string) => normalizePlate(value) !== null, 'Biển số không hợp lệ.'),
      ),
      date: date('Chọn ngày.'),
    },
  },
  other: {
    fields: ['text'],
    labels: { text: 'Nội dung' },
    schema: { text: required('Nhập nội dung yêu cầu.') },
  },
};

/** API payload field → form field. */
const PAYLOAD_FIELDS: Record<string, Field> = {
  expectedMoveOutDate: 'date',
  fromDate: 'date',
  toDate: 'date',
  reason: 'text',
  message: 'text',
  fullName: 'fullName',
  phone: 'phone',
  plate: 'plate',
  vehicleType: 'vehicleType',
};

function payloadOf(type: TenantRequestType, values: Values): TenantRequestPayload {
  switch (type) {
    case 'move_out':
      return { expectedMoveOutDate: values.date, reason: values.text.trim() || null };
    case 'add_occupant':
      return {
        fullName: values.fullName.trim(),
        phone: normalizePhone(values.phone) ?? values.phone,
        fromDate: values.date,
      };
    case 'remove_occupant':
      return { fullName: values.fullName.trim(), toDate: values.date };
    case 'add_vehicle':
      return { plate: values.plate.trim(), vehicleType: values.vehicleType, fromDate: values.date };
    case 'remove_vehicle':
      return { plate: values.plate.trim(), toDate: values.date };
    case 'other':
      return { message: values.text.trim() };
  }
}

function RequestForm({ type }: { type: TenantRequestType }) {
  const create = usePortalCreateRequest();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const config = TYPE_FORMS[type];

  const form = useAppForm({
    defaultValues: {
      date: todayIsoDate(),
      fullName: '',
      phone: '',
      plate: '',
      vehicleType: 'motorbike',
      text: '',
    } as Values,
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await create.mutateAsync({ type, payload: payloadOf(type, value) });
        allowNavigation();
        toast.success('Đã gửi yêu cầu. Chủ trọ sẽ xem và trả lời.');
        navigate(portalPaths.requests);
      } catch (cause) {
        if (cause instanceof ApiSdkError) {
          let matched = false;

          for (const [key, messages] of Object.entries(cause.fieldErrors)) {
            const field = PAYLOAD_FIELDS[key.replace(/^payload\./, '')];

            if (field && config.fields.includes(field) && messages[0]) {
              form.setFieldMeta(field, serverError(messages[0]));
              matched = true;
            }
          }
          if (matched) return;
        }
        setError(
          cause instanceof ApiSdkError && cause.message
            ? cause.message
            : 'Không gửi được. Vui lòng thử lại.',
        );
      }
    },
  });

  const dirty = useFormDirty(form);
  const { allowNavigation } = useUnsavedChanges(dirty);
  const label = (field: Field) => config.labels[field] ?? field;

  return (
    <Form
      noValidate
      form={form}
      schema={config.schema}
      className="grid min-w-0 gap-4"
      aria-label={REQUEST_TYPE_LABELS[type]}
    >
      <FormError message={error} />
      {config.fields.includes('fullName') ? (
        <FormField name="fullName" label={label('fullName')} required>
          <Input maxLength={120} autoComplete="off" />
        </FormField>
      ) : null}
      {config.fields.includes('phone') ? (
        <FormField name="phone" label={label('phone')} required>
          <Input type="tel" inputMode="tel" maxLength={20} autoComplete="off" />
        </FormField>
      ) : null}
      {config.fields.includes('plate') ? (
        <FormField name="plate" label={label('plate')} required>
          <Input maxLength={20} autoComplete="off" placeholder="59X1-234.56" />
        </FormField>
      ) : null}
      {config.fields.includes('vehicleType') ? (
        <FormField name="vehicleType" label={label('vehicleType')} required>
          <Select
            options={VEHICLE_TYPES.map((value) => ({
              value,
              label: VEHICLE_TYPE_LABELS[value],
            }))}
          />
        </FormField>
      ) : null}
      {config.fields.includes('date') ? (
        <FormField name="date" label={label('date')} required>
          <Input type="date" min={type === 'move_out' ? todayIsoDate() : undefined} />
        </FormField>
      ) : null}
      {config.fields.includes('text') ? (
        <FormField name="text" label={label('text')} required={type === 'other'}>
          <Textarea maxLength={2000} rows={3} />
        </FormField>
      ) : null}
      <p className="text-ui-sm text-muted">
        Đây là đề nghị: hợp đồng chỉ thay đổi khi chủ trọ duyệt. Mỗi phòng gửi tối đa 10 yêu cầu mỗi
        ngày.
      </p>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={() => navigate(portalPaths.requests)}>
          Huỷ
        </Button>
        <FormSubmit form={form}>
          {(submitting) => (
            <Button type="submit" loading={submitting}>
              Gửi yêu cầu
            </Button>
          )}
        </FormSubmit>
      </div>
    </Form>
  );
}

/** T-09 `/p/requests/new`: the type decides the fields (báo trả phòng, người ở, xe, khác). */
export default function PortalRequestNewPage() {
  const [type, setType] = useState<TenantRequestType>('move_out');

  return (
    <>
      <h1 className="text-heading font-bold">Gửi yêu cầu cho chủ trọ</h1>
      <div className="grid min-w-0 gap-4 rounded-panel border border-line bg-surface p-4">
        <div className="grid gap-1">
          <span className="font-medium" aria-hidden>
            Loại yêu cầu *
          </span>
          <Select
            aria-label="Loại yêu cầu *"
            value={type}
            onValueChange={(value) => {
              const next = TENANT_REQUEST_TYPES.find((item) => item === value);

              if (next) setType(next);
            }}
            options={TENANT_REQUEST_TYPES.map((value) => ({
              value,
              label: REQUEST_TYPE_LABELS[value],
            }))}
          />
        </div>
        {/* Each type has its own fields and checks: a new form when the type changes. */}
        <RequestForm key={type} type={type} />
      </div>
    </>
  );
}
