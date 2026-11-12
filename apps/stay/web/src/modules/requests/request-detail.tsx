import {
  Button,
  DatePicker,
  Form,
  FormActions,
  FormField,
  FormGrid,
  FormLayout,
  FormSection,
  FormSubmit,
  Input,
  NumberInput,
  Select,
  Textarea,
  useAppForm,
} from '@itclabs/react-ui';
import { MediaGallery } from '@itclabs/react-ui/media-gallery';
import { toast } from '@itclabs/react-ui/toast';
import {
  useAcceptRequest,
  useConfirmPaymentClaim,
  useContract,
  useRejectPaymentClaim,
  useRejectRequest,
  useReplyRequest,
} from '@stay/sdk/react';
import { getErrorMessage } from '@stay/sdk/shared';
import { type InboxItem, isIsoDate } from '@stay/shared';
import { type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import * as v from 'valibot';
import { displayDate, formatVnd, todayIsoDate } from '@/libraries/format';
import { apiFormErrors, clearServerErrorOnChange, serverError } from '@/libraries/forms/api-errors';
import { DATE_FIELD } from '@/libraries/forms/date-field';
import { FormError } from '@/libraries/forms/page-states';
import { Overlay } from '../invoices/invoice-dialogs';
import { displayPeriod } from '../invoices/invoice-ui';
import {
  CATEGORY_LABELS,
  displayDateTime,
  InboxStatusTag,
  itemTypeLabel,
  payloadRows,
  SEVERITY_LABELS,
} from './request-ui';

type Mode = 'reply' | 'reject' | 'accept' | 'claim' | null;

const text = (label: string, max = 2000) =>
  v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, `Nhập ${label}.`),
    v.maxLength(max, `Tối đa ${max} ký tự.`),
  );

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-0.5 sm:grid-cols-[10rem_1fr] sm:gap-3">
      <dt className="text-ui-sm text-muted">{label}</dt>
      <dd className="min-w-0 whitespace-pre-wrap break-words">{children}</dd>
    </div>
  );
}

function Photo({ url, alt }: { url: string | null; alt: string }) {
  if (!url) return <p className="text-ui-sm text-muted">Không xem được ảnh.</p>;

  return (
    <MediaGallery
      items={[{ id: url, src: url, alt }]}
      thumbnails="none"
      fit="contain"
      className="max-w-sm"
    />
  );
}

/** Everything the tenant sent, read-only. */
function ItemContent({ item }: { item: InboxItem }) {
  return (
    <dl className="grid min-w-0 gap-2">
      <Row label="Trạng thái">
        <InboxStatusTag status={item.status} />
      </Row>
      <Row label="Phòng">{item.roomCode ?? '—'}</Row>
      {item.contractId ? (
        <Row label="Hợp đồng">
          <Link className="text-accent" to={`/contracts/${item.contractId}`}>
            {item.contractCode ?? 'Xem hợp đồng'}
          </Link>
        </Row>
      ) : null}
      <Row label="Người gửi">{item.tenantName ?? '—'}</Row>
      <Row label="Thời gian">{displayDateTime(item.createdAt)}</Row>
      {item.maintenance ? (
        <>
          <Row label="Tiêu đề">{item.maintenance.title}</Row>
          <Row label="Hạng mục">
            {CATEGORY_LABELS[item.maintenance.category]} ·{' '}
            {SEVERITY_LABELS[item.maintenance.severity]}
          </Row>
          {item.maintenance.description ? (
            <Row label="Mô tả">{item.maintenance.description}</Row>
          ) : null}
          {item.maintenance.photos.length ? (
            <Row label="Ảnh">
              <span className="grid gap-2 sm:grid-cols-2">
                {item.maintenance.photos.map((photo, index) => (
                  <Photo
                    key={photo.fileId}
                    url={photo.url}
                    alt={`Ảnh báo hỏng ${index + 1}: ${item.maintenance?.title ?? ''}`}
                  />
                ))}
              </span>
            </Row>
          ) : null}
        </>
      ) : null}
      {item.request
        ? payloadRows(item.request.payload).map(([label, value]) => (
            <Row key={label} label={label}>
              {value}
            </Row>
          ))
        : null}
      {item.claim ? (
        <>
          <Row label="Số tiền báo">
            <strong>{formatVnd(item.claim.amount)}</strong>
          </Row>
          <Row label="Ngày chuyển">{displayDate(item.claim.paidOn)}</Row>
          <Row label="Hoá đơn">
            <Link className="text-accent" to={`/invoices/${item.claim.invoiceId}`}>
              {item.claim.invoiceCode ?? 'Hoá đơn'} · Kỳ {displayPeriod(item.claim.invoicePeriod)}
            </Link>{' '}
            · còn {formatVnd(item.claim.invoiceRemaining)}
          </Row>
          {item.claim.reference ? <Row label="Mã giao dịch">{item.claim.reference}</Row> : null}
          {item.claim.note ? <Row label="Ghi chú">{item.claim.note}</Row> : null}
          <Row label="Biên lai">
            {item.claim.receipt ? (
              <Photo url={item.claim.receipt.url} alt="Ảnh biên lai" />
            ) : (
              'Không có ảnh'
            )}
          </Row>
        </>
      ) : null}
      {item.reply ? (
        <Row label={item.status === 'rejected' ? 'Lý do từ chối' : 'Trả lời'}>{item.reply}</Row>
      ) : null}
      {item.handledByName ? (
        <Row label="Người xử lý">
          {item.handledByName}
          {item.handledAt ? ` · ${displayDateTime(item.handledAt)}` : ''}
        </Row>
      ) : null}
    </dl>
  );
}

type FormProps = {
  item: InboxItem;
  onDone: (item: InboxItem, message: string) => void;
  onCancel: () => void;
};

function RequestActions({ onCancel, children }: { onCancel: () => void; children: ReactNode }) {
  return (
    <FormActions className="flex flex-wrap justify-end gap-2">
      <Button variant="secondary" onClick={onCancel}>
        Quay lại
      </Button>
      {children}
    </FormActions>
  );
}

function ReplyForm({ item, onDone, onCancel }: FormProps) {
  const reply = useReplyRequest();
  const [error, setError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { message: '' },
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        const next = await reply.mutateAsync({
          id: item.id,
          body: { message: value.message.trim() },
        });

        onDone(next, 'Đã gửi trả lời cho người thuê.');
      } catch (cause) {
        const errors = apiFormErrors(cause, ['message'] as const, 'Không gửi được trả lời.');

        if (errors.fields.message) form.setFieldMeta('message', serverError(errors.fields.message));
        setError(errors.message);
      }
    },
  });

  return (
    <Form
      noValidate
      form={form}
      schema={{ message: text('nội dung trả lời') }}
      className="grid min-w-0 gap-3"
      aria-label="Trả lời người thuê"
    >
      <FormLayout size="full">
        <FormSection>
          <FormGrid columns={1}>
            <FormError message={error} />
            <FormField name="message" label="Nội dung trả lời" required>
              <Textarea maxLength={2000} rows={3} />
            </FormField>
          </FormGrid>
        </FormSection>
        <RequestActions onCancel={onCancel}>
          <FormSubmit form={form}>
            {(submitting) => (
              <Button type="submit" loading={submitting}>
                Gửi trả lời
              </Button>
            )}
          </FormSubmit>
        </RequestActions>
      </FormLayout>
    </Form>
  );
}

function RejectForm({ item, onDone, onCancel }: FormProps) {
  const rejectRequest = useRejectRequest();
  const rejectClaim = useRejectPaymentClaim();
  const [error, setError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { reason: '' },
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      setError(null);
      const command = { id: item.id, body: { reason: value.reason.trim() } };

      try {
        const next =
          item.kind === 'payment_claim'
            ? await rejectClaim.mutateAsync(command)
            : await rejectRequest.mutateAsync(command);

        onDone(next, 'Đã từ chối; người thuê sẽ thấy lý do.');
      } catch (cause) {
        const errors = apiFormErrors(cause, ['reason'] as const, 'Không từ chối được.');

        if (errors.fields.reason) form.setFieldMeta('reason', serverError(errors.fields.reason));
        setError(errors.message);
      }
    },
  });

  return (
    <Form
      noValidate
      form={form}
      schema={{ reason: text('lý do') }}
      className="grid min-w-0 gap-3"
      aria-label="Từ chối"
    >
      <FormLayout size="full">
        <FormSection>
          <FormGrid columns={1}>
            <FormError message={error} />
            <FormField name="reason" label="Lý do" required>
              <Textarea maxLength={2000} rows={3} />
            </FormField>
          </FormGrid>
        </FormSection>
        <RequestActions onCancel={onCancel}>
          <FormSubmit form={form}>
            {(submitting) => (
              <Button type="submit" variant="danger" loading={submitting}>
                Xác nhận từ chối
              </Button>
            )}
          </FormSubmit>
        </RequestActions>
      </FormLayout>
    </Form>
  );
}

const ACCEPT_FIELDS = [
  'effectiveDate',
  'tenantId',
  'newPrimaryTenantId',
  'vehicleId',
  'reply',
] as const;

/** Accepting a tenant request runs the contract change (occupants, vehicles, notice). */
function AcceptForm({ item, onDone, onCancel }: FormProps) {
  const accept = useAcceptRequest();
  const contract = useContract(item.contractId ?? '');
  const [error, setError] = useState<string | null>(null);
  const type = item.request?.type;

  const occupants = (contract.data?.occupants ?? []).filter((row) => !row.toDate);
  const vehicles = (contract.data?.vehicles ?? []).filter((row) => !row.toDate);

  const form = useAppForm({
    defaultValues: {
      effectiveDate: '',
      tenantId: '',
      newPrimaryTenantId: '',
      vehicleId: '',
      reply: '',
    },
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        const next = await accept.mutateAsync({
          id: item.id,
          body: {
            reply: value.reply.trim() || null,
            effectiveDate: value.effectiveDate || null,
            tenantId: value.tenantId || null,
            newPrimaryTenantId: value.newPrimaryTenantId || null,
            vehicleId: value.vehicleId || null,
          },
        });

        onDone(next, 'Đã duyệt yêu cầu.');
      } catch (cause) {
        const errors = apiFormErrors(cause, ACCEPT_FIELDS, 'Không duyệt được yêu cầu.');

        for (const field of ACCEPT_FIELDS)
          if (errors.fields[field]) form.setFieldMeta(field, serverError(errors.fields[field]));
        setError(errors.message ?? getErrorMessage(cause, 'Không duyệt được yêu cầu.'));
      }
    },
  });

  const schema = {
    effectiveDate: v.pipe(
      v.string(),
      v.check((value: string) => !value || isIsoDate(value), 'Ngày không hợp lệ.'),
    ),
    tenantId: v.string(),
    newPrimaryTenantId: v.string(),
    vehicleId: v.string(),
    reply: v.pipe(v.string(), v.maxLength(2000, 'Tối đa 2000 ký tự.')),
  };

  return (
    <Form
      noValidate
      form={form}
      schema={schema}
      className="grid min-w-0 gap-3"
      aria-label="Duyệt yêu cầu"
    >
      <FormLayout size="full">
        <FormSection>
          <FormGrid columns={1}>
            <FormError message={error} />
            {type && type !== 'other' ? (
              <p className="text-ui-sm text-muted">
                Duyệt sẽ thay đổi hợp đồng như thao tác trong chi tiết hợp đồng, theo ngày trong yêu
                cầu (hoặc ngày hiệu lực bên dưới).
              </p>
            ) : null}
            {type === 'remove_occupant' ? (
              <>
                <FormField name="tenantId" label="Người ở rời đi">
                  <Select
                    placeholder="Theo tên trong yêu cầu"
                    options={occupants.map((row) => ({ value: row.tenantId, label: row.fullName }))}
                  />
                </FormField>
                <FormField
                  name="newPrimaryTenantId"
                  label="Người đại diện mới (khi đại diện rời đi)"
                >
                  <Select
                    placeholder="Không đổi"
                    options={occupants.map((row) => ({ value: row.tenantId, label: row.fullName }))}
                  />
                </FormField>
              </>
            ) : null}
            {type === 'remove_vehicle' ? (
              <FormField name="vehicleId" label="Xe cần bớt">
                <Select
                  placeholder="Theo biển số trong yêu cầu"
                  options={vehicles.map((row) => ({ value: row.vehicleId, label: row.plate }))}
                />
              </FormField>
            ) : null}
            {type && type !== 'other' ? (
              <FormField
                name="effectiveDate"
                label="Ngày hiệu lực (để trống = theo yêu cầu)"
                {...DATE_FIELD}
              >
                <DatePicker />
              </FormField>
            ) : null}
            <FormField name="reply" label="Trả lời người thuê">
              <Textarea maxLength={2000} rows={2} />
            </FormField>
          </FormGrid>
        </FormSection>
        <RequestActions onCancel={onCancel}>
          <FormSubmit form={form}>
            {(submitting) => (
              <Button type="submit" loading={submitting}>
                Xác nhận duyệt
              </Button>
            )}
          </FormSubmit>
        </RequestActions>
      </FormLayout>
    </Form>
  );
}

/** "Xác nhận đã nhận tiền": records the payment (ST-15) for the claimed invoice. */
function ClaimForm({ item, onDone, onCancel }: FormProps) {
  const confirm = useConfirmPaymentClaim();
  const [error, setError] = useState<string | null>(null);
  const claim = item.claim;
  const remaining = claim?.invoiceRemaining ?? 0;

  const form = useAppForm({
    defaultValues: {
      amount: (claim ? Math.min(claim.amount, remaining || claim.amount) : null) as number | null,
      paidOn: claim?.paidOn ?? todayIsoDate(),
      reference: claim?.reference ?? '',
    },
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      setError(null);
      const amount = value.amount ?? 0;

      if (amount > remaining) {
        form.setFieldMeta(
          'amount',
          serverError(`Số tiền không được vượt số còn lại ${formatVnd(remaining)}.`),
        );
        return;
      }
      try {
        const next = await confirm.mutateAsync({
          id: item.id,
          body: { amount, paidOn: value.paidOn, reference: value.reference.trim() || null },
        });

        onDone(next, `Đã ghi khoản thu ${formatVnd(amount)}.`);
      } catch (cause) {
        const fields = ['amount', 'paidOn', 'reference'] as const;
        const errors = apiFormErrors(cause, fields, 'Không xác nhận được.');

        for (const field of fields)
          if (errors.fields[field]) form.setFieldMeta(field, serverError(errors.fields[field]));
        setError(errors.message);
      }
    },
  });

  const schema = {
    amount: v.pipe(
      v.number('Nhập số tiền.'),
      v.integer('Nhập số nguyên đồng.'),
      v.minValue(1, 'Số tiền phải lớn hơn 0.'),
    ),
    paidOn: v.pipe(
      v.string(),
      v.check((value: string) => isIsoDate(value), 'Chọn ngày nhận tiền.'),
      v.check((value: string) => value <= todayIsoDate(), 'Ngày không được sau hôm nay.'),
    ),
    reference: v.pipe(v.string(), v.maxLength(120, 'Tối đa 120 ký tự.')),
  };

  if (!claim) return null;

  return (
    <Form
      noValidate
      form={form}
      schema={schema}
      className="grid min-w-0 gap-3"
      aria-label="Xác nhận chuyển khoản"
    >
      <FormLayout size="full">
        <FormSection>
          <FormGrid columns={1}>
            <FormError message={error} />
            <p data-testid="claim-confirm-summary">
              Ghi khoản thu chuyển khoản cho hoá đơn <strong>{claim.invoiceCode ?? ''}</strong> (còn{' '}
              {formatVnd(remaining)}). Người thuê báo đã chuyển{' '}
              <strong>{formatVnd(claim.amount)}</strong>.
            </p>
            <FormField name="amount" label="Số tiền nhận được" required>
              <NumberInput
                min={1}
                max={remaining || undefined}
                step={1}
                inputMode="numeric"
                endAddon="₫"
              />
            </FormField>
            <FormField name="paidOn" label="Ngày nhận tiền" required {...DATE_FIELD}>
              <DatePicker maxDate={todayIsoDate()} clearable={false} />
            </FormField>
            <FormField name="reference" label="Mã giao dịch">
              <Input maxLength={120} autoComplete="off" />
            </FormField>
          </FormGrid>
        </FormSection>
        <RequestActions onCancel={onCancel}>
          <FormSubmit form={form}>
            {(submitting) => (
              <Button type="submit" loading={submitting}>
                Xác nhận
              </Button>
            )}
          </FormSubmit>
        </RequestActions>
      </FormLayout>
    </Form>
  );
}

/** O-26 detail: what the tenant sent and the actions allowed for its kind and status. */
export function RequestDetailDialog({ item, onClose }: { item: InboxItem; onClose: () => void }) {
  const [current, setCurrent] = useState(item);
  const [mode, setMode] = useState<Mode>(null);
  const [error, setError] = useState<string | null>(null);
  const accept = useAcceptRequest();

  const done = (next: InboxItem, message: string) => {
    setCurrent(next);
    setMode(null);
    toast.success(message);
  };

  const quickAccept = async (finish: boolean) => {
    setError(null);
    try {
      const next = await accept.mutateAsync({ id: current.id, body: finish ? { done: true } : {} });

      done(next, finish ? 'Đã đánh dấu xong.' : 'Đã nhận xử lý.');
    } catch (cause) {
      setError(getErrorMessage(cause, 'Không cập nhật được báo hỏng.'));
    }
  };

  const status = current.status;
  const open = status === 'pending' || status === 'in_progress';
  const formProps = { item: current, onDone: done, onCancel: () => setMode(null) };

  return (
    <Overlay
      title={`${itemTypeLabel(current)}${current.roomCode ? ` · Phòng ${current.roomCode}` : ''}`}
      onClose={() => !accept.isPending && onClose()}
    >
      <div className="grid min-w-0 gap-4" data-testid="request-detail">
        <ItemContent item={current} />
        <FormError message={error} />
        {mode === 'reply' ? (
          <ReplyForm {...formProps} />
        ) : mode === 'reject' ? (
          <RejectForm {...formProps} />
        ) : mode === 'accept' ? (
          <AcceptForm {...formProps} />
        ) : mode === 'claim' ? (
          <ClaimForm {...formProps} />
        ) : (
          <div className="flex flex-wrap justify-end gap-2">
            {current.kind === 'maintenance' && status === 'pending' ? (
              <Button loading={accept.isPending} onClick={() => void quickAccept(false)}>
                Nhận xử lý
              </Button>
            ) : null}
            {current.kind === 'maintenance' && status === 'in_progress' ? (
              <Button loading={accept.isPending} onClick={() => void quickAccept(true)}>
                Đánh dấu xong
              </Button>
            ) : null}
            {current.kind === 'tenant_request' && status === 'pending' ? (
              <Button onClick={() => setMode('accept')}>Duyệt</Button>
            ) : null}
            {current.kind === 'payment_claim' && status === 'pending' ? (
              <Button onClick={() => setMode('claim')}>Xác nhận đã nhận tiền</Button>
            ) : null}
            {current.kind !== 'payment_claim' && status !== 'cancelled' ? (
              <Button variant="secondary" onClick={() => setMode('reply')}>
                Trả lời
              </Button>
            ) : null}
            {open && (current.kind === 'maintenance' || status === 'pending') ? (
              <Button variant="danger" onClick={() => setMode('reject')}>
                Từ chối
              </Button>
            ) : null}
            <Button variant="ghost" onClick={onClose}>
              Đóng
            </Button>
          </div>
        )}
      </div>
    </Overlay>
  );
}
