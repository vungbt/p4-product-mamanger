import {
  Alert,
  AlertDialog,
  Button,
  DatePicker,
  EmptyState,
  Form,
  FormActions,
  FormField,
  FormGrid,
  FormLayout,
  FormSection,
  IconButton,
  NumberInput,
  Select,
  Skeleton,
  Stepper,
  Textarea,
  useAppForm,
} from '@itclabs/react-ui';
import {
  useBuilding,
  useContract,
  useSettleContract,
  useSettlementPreview,
  useStaySdk,
} from '@stay/sdk/react';
import {
  ApiSdkError,
  type ContractSettlementInput,
  type ContractSettlementPreview,
  type ContractSettlementResult,
  createUploadApi,
  getErrorMessage,
} from '@stay/sdk/shared';
import {
  type InvoiceShareLink,
  type ManualPaymentMethod,
  MOVE_OUT_FEE_REASON,
  type StayContract,
} from '@stay/shared';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as v from 'valibot';
import { displayDate, formatVnd, todayIsoDate } from '@/libraries/format';
import { apiFormErrors, clearServerErrorOnChange, serverError } from '@/libraries/forms/api-errors';
import { DATE_FIELD } from '@/libraries/forms/date-field';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { useFormDirty, useFormValue } from '@/libraries/forms/use-form-value';
import { displayPeriod, lineFormula, useLineDescription } from '@/modules/invoices/invoice-ui';
import { ShareInvoiceDialog } from '@/modules/invoices/share/share-dialog';
import {
  MANUAL_PAYMENT_METHOD_OPTIONS,
  PAYMENT_METHOD_LABELS,
} from '@/modules/payments/payment-ui';
import { CONTRACT_LABELS, LoadError } from './contract-ui';

const STEPS = [
  { id: 'readings', label: 'Ngày trả & chỉ số' },
  { id: 'surcharges', label: 'Phụ thu' },
  { id: 'summary', label: 'Tổng hợp' },
] as const;
const MAX_SURCHARGES = 20;
const STEP_FIELDS = ['moveOutDate', 'finalElectric', 'finalWater'] as const;
const PHOTO_FIELDS = ['electricPhotoFileId', 'waterPhotoFileId'] as const;

type Surcharge = { amount: number | null; reason: string };
/** Fields checked before leaving a step (the surcharge rows are addressed by index). */
type StepField =
  | (typeof STEP_FIELDS)[number]
  | `surcharges[${number}].amount`
  | `surcharges[${number}].reason`;
type MeterKind = 'electricity' | 'water';

const amountSchema = v.pipe(
  v.number('Nhập số tiền.'),
  v.integer('Nhập số nguyên đồng.'),
  v.minValue(1, 'Số tiền phải lớn hơn 0.'),
  v.maxValue(1_000_000_000, 'Số tiền tối đa 1.000.000.000 ₫.'),
);
const reasonSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, 'Nhập lý do.'),
  v.maxLength(500, 'Lý do tối đa 500 ký tự.'),
);
const issues = (schema: v.GenericSchema) => ({
  onChange: ({ value }: { value: unknown }) => {
    const result = v.safeParse(schema, value);

    return result.success ? undefined : result.issues[0]?.message;
  },
});

/** Metered services registered today: their final reading is required. */
function meteredKinds(contract: StayContract): MeterKind[] {
  const today = todayIsoDate();

  return contract.services
    .filter((s) => s.fromDate <= today && (!s.toDate || s.toDate > today))
    .flatMap((s): MeterKind[] => (s.kind === 'electricity' || s.kind === 'water' ? [s.kind] : []));
}

/** `409 contract_has_draft_invoices`: the drafts listed in `extensions.invoices`. */
function draftInvoices(error: unknown): { invoiceId: string; period: string }[] {
  if (!(error instanceof ApiSdkError) || error.code !== 'contract_has_draft_invoices') return [];
  const extensions =
    error.data && typeof error.data === 'object' ? Reflect.get(error.data, 'extensions') : null;
  const list: unknown =
    extensions && typeof extensions === 'object' ? Reflect.get(extensions, 'invoices') : null;

  return Array.isArray(list)
    ? list.flatMap((item: unknown) => {
        const invoiceId = item && typeof item === 'object' ? Reflect.get(item, 'invoiceId') : null;
        const period = item && typeof item === 'object' ? Reflect.get(item, 'period') : null;

        return typeof invoiceId === 'string' && typeof period === 'string'
          ? [{ invoiceId, period }]
          : [];
      })
    : [];
}

/** O-24 Thanh lý hợp đồng (owner): readings → surcharges → server summary → confirm. */
export default function ContractSettlePage() {
  const { id = '' } = useParams();
  const query = useContract(id);
  const building = useBuilding(query.data?.buildingId ?? '');
  const [result, setResult] = useState<ContractSettlementResult | null>(null);

  if (result) return <SettlementDone result={result} />;
  if (query.isPending) return <Skeleton className="h-64" />;
  if (!query.data)
    return query.error instanceof ApiSdkError && query.error.status === 404 ? (
      <EmptyState title="Không tìm thấy hợp đồng" />
    ) : (
      <LoadError error={query.error} retry={() => void query.refetch()} />
    );

  const contract = query.data;

  if (contract.status !== 'active' && contract.status !== 'ending')
    return (
      <div className="grid min-w-0 gap-4">
        <h1 className="text-heading font-bold">Thanh lý {contract.code}</h1>
        <Alert tone="info" data-testid="settle-unavailable">
          Hợp đồng {CONTRACT_LABELS[contract.status].toLowerCase()}, không thể thanh lý.
          {contract.settlementInvoiceId ? (
            <>
              {' '}
              <Link
                className="font-semibold text-accent"
                to={`/invoices/${contract.settlementInvoiceId}`}
              >
                Xem hoá đơn thanh lý
              </Link>
            </>
          ) : null}
        </Alert>
        <Link className="font-semibold text-accent" to={`/contracts/${contract.id}`}>
          Về hợp đồng
        </Link>
      </div>
    );

  // The building's move-out depreciation fee is prefilled as the first surcharge.
  if (building.isPending) return <Skeleton className="h-64" />;
  if (!building.data)
    return <LoadError error={building.error} retry={() => void building.refetch()} />;

  return (
    <SettlementForm
      contract={contract}
      moveOutFee={building.data.billing.moveOutFee}
      onDone={setResult}
    />
  );
}

function SettlementForm({
  contract,
  moveOutFee,
  onDone,
}: {
  contract: StayContract;
  /** Building setting in force (0 = off): the prefilled depreciation surcharge. */
  moveOutFee: number;
  onDone: (result: ContractSettlementResult) => void;
}) {
  const sdk = useStaySdk();
  const uploader = useMemo(() => createUploadApi(sdk, { baseUrl: window.location.origin }), [sdk]);
  const settle = useSettleContract();
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [key] = useState(() => crypto.randomUUID());

  const today = todayIsoDate();
  const kinds = meteredKinds(contract);
  const notice = contract.noticeDate && contract.noticeDate <= today ? contract.noticeDate : null;
  const readingSchema = (kind: MeterKind) =>
    kinds.includes(kind)
      ? v.pipe(
          v.number('Nhập chỉ số cuối.'),
          v.integer('Chỉ số là số nguyên.'),
          v.minValue(0, 'Chỉ số không âm.'),
        )
      : v.nullable(v.number());
  const schema = {
    moveOutDate: v.pipe(
      v.string(),
      v.isoDate('Chọn ngày trả phòng.'),
      v.check((value) => value <= today, 'Ngày trả phòng không được sau hôm nay.'),
      v.check(
        (value) => value >= contract.startDate,
        `Ngày trả phòng từ ${displayDate(contract.startDate)} trở đi.`,
      ),
    ),
    finalElectric: readingSchema('electricity'),
    finalWater: readingSchema('water'),
  };

  const form = useAppForm({
    defaultValues: {
      electricUploads: [] as File[],
      waterUploads: [] as File[],
      moveOutDate: notice ?? today,
      finalElectric: null as number | null,
      finalWater: null as number | null,
      electricPhotoFileId: '',
      waterPhotoFileId: '',
      surcharges: (moveOutFee > 0
        ? [{ amount: moveOutFee, reason: MOVE_OUT_FEE_REASON }]
        : []) as Surcharge[],
      refundMethod: 'cash' as ManualPaymentMethod,
    },
    listeners: clearServerErrorOnChange,
  });
  const values = useFormValue(form, (state) => state.values);
  const dirty = useFormDirty(form);
  const { allowNavigation } = useUnsavedChanges(dirty);

  const body: ContractSettlementInput = {
    moveOutDate: values.moveOutDate,
    finalElectric: values.finalElectric,
    finalWater: values.finalWater,
    electricPhotoFileId: values.electricPhotoFileId || null,
    waterPhotoFileId: values.waterPhotoFileId || null,
    surcharges: values.surcharges.map((row) => ({
      amount: row.amount ?? 0,
      reason: row.reason.trim(),
    })),
  };
  const preview = useSettlementPreview(contract.id, body, step === 2);
  const drafts = draftInvoices(preview.error);

  // Field errors of the server computation go back to steps 1–2 (all steps stay mounted).
  useEffect(() => {
    if (!preview.error) return;
    const errors = apiFormErrors(preview.error, STEP_FIELDS, '');

    for (const field of STEP_FIELDS)
      if (errors.fields[field]) form.setFieldMeta(field, serverError(errors.fields[field]));
  }, [preview.error, form]);

  const validate = async (names: StepField[]) => {
    const results = await Promise.all(
      names.map((name) => {
        form.setFieldMeta(name, (meta) => ({ ...meta, isTouched: true }));
        return form.validateField(name, 'change');
      }),
    );

    return results.every((errors) => !errors.length);
  };
  const next = async () => {
    setError(null);
    const names: StepField[] =
      step === 0
        ? [...STEP_FIELDS]
        : values.surcharges.flatMap((_, i): StepField[] => [
            `surcharges[${i}].amount`,
            `surcharges[${i}].reason`,
          ]);

    if (await validate(names)) setStep((current) => Math.min(current + 1, 2));
  };

  const uploadPhoto = async (field: (typeof PHOTO_FIELDS)[number], file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fileId = await uploader.uploadImage({
        purpose: 'contract_meter',
        buildingId: contract.buildingId,
        file,
      });

      form.setFieldValue(field, fileId);
    } catch (cause) {
      setError(getErrorMessage(cause, 'Không thể tải ảnh.'));
    } finally {
      setUploading(false);
    }
  };

  const confirm = async () => {
    setError(null);
    try {
      const done = await settle.mutateAsync({
        id: contract.id,
        idempotencyKey: key,
        body: { ...body, version: contract.version, refundMethod: values.refundMethod },
      });

      allowNavigation();
      form.reset();
      onDone(done);
    } catch (cause) {
      setConfirming(false);
      setError(getErrorMessage(cause, 'Không thể thanh lý. Kiểm tra lại dữ liệu và thử lại.'));
    }
  };

  const summary = preview.data;

  return (
    <div className="grid min-w-0 max-w-4xl gap-5">
      <header className="grid gap-1">
        <h1 className="text-heading font-bold">Thanh lý hợp đồng</h1>
        <p className="text-muted">
          {contract.code} · Phòng {contract.roomCode} · {contract.primaryTenantName ?? '—'}
        </p>
      </header>
      <div className="min-w-0 relative overflow-x-auto">
        <Stepper
          aria-label="Các bước thanh lý"
          steps={STEPS}
          currentStep={STEPS[step]?.id ?? 'readings'}
          classNames={{ root: 'min-w-0' }}
        />
      </div>
      {error ? (
        <Alert tone="danger" role="alert" data-testid="settle-error">
          {error}
        </Alert>
      ) : null}
      <Form
        noValidate
        form={form}
        schema={schema}
        className="grid min-w-0 gap-4 rounded-panel border border-line bg-surface p-4 sm:p-5"
        aria-label="Thanh lý hợp đồng"
      >
        <FormLayout size="full">
          <FormSection
            title={<>1. {STEPS[0].label}</>}
            variant="card"
            hidden={step !== 0}
            aria-label={STEPS[0].label}
          >
            {contract.noticeDate ? (
              <p className="text-ui-sm text-muted">
                Ngày dự kiến đã báo: {displayDate(contract.noticeDate)}
              </p>
            ) : null}
            <FormField name="moveOutDate" label="Ngày trả phòng" required {...DATE_FIELD}>
              <DatePicker minDate={contract.startDate} maxDate={today} clearable={false} />
            </FormField>
            <FormGrid columns={2}>
              {kinds.includes('electricity') ? (
                <FormField name="finalElectric" label="Chỉ số điện cuối" required>
                  <NumberInput min={0} max={999_999_999} controls={false} endAddon="kWh" />
                </FormField>
              ) : null}
              {kinds.includes('water') ? (
                <FormField name="finalWater" label="Chỉ số nước cuối" required>
                  <NumberInput min={0} max={999_999_999} controls={false} endAddon="m³" />
                </FormField>
              ) : null}
            </FormGrid>
            <FormGrid columns={2}>
              {PHOTO_FIELDS.filter((field) =>
                kinds.includes(field === 'electricPhotoFileId' ? 'electricity' : 'water'),
              ).map((field) => {
                const label =
                  field === 'electricPhotoFileId'
                    ? 'Ảnh đồng hồ điện (tuỳ chọn)'
                    : 'Ảnh đồng hồ nước (tuỳ chọn)';

                return (
                  <div key={field} className="grid min-w-0 gap-2">
                    <form.AppField
                      name={field === 'electricPhotoFileId' ? 'electricUploads' : 'waterUploads'}
                      listeners={{
                        onChange: ({ value: files }) => {
                          const file = files[0];

                          if (file) void uploadPhoto(field, file);
                          else form.setFieldValue(field, '');
                        },
                      }}
                    >
                      {(field) => (
                        <field.UploadField
                          label={label}
                          accept="image/jpeg,image/png,image/webp"
                          disabled={uploading}
                          maxBytes={10485760}
                        />
                      )}
                    </form.AppField>
                    {values[field] ? <p className="text-ui-sm text-muted">Đã tải ảnh</p> : null}
                  </div>
                );
              })}
            </FormGrid>
          </FormSection>

          <FormSection
            title={<>2. Phụ thu thanh lý</>}
            variant="card"
            hidden={step !== 1}
            aria-label={STEPS[1].label}
          >
            <FormGrid columns={1}>
              <p className="text-ui-sm text-muted">
                Hư hỏng, dọn dẹp…: mỗi dòng có số tiền và lý do. Bỏ qua nếu không có.
              </p>
              {moveOutFee > 0 ? (
                <p className="text-ui-sm text-muted" data-testid="settle-move-out-fee">
                  Phí khấu hao cơ sở vật chất của toà ({formatVnd(moveOutFee)}) đã được thêm sẵn;
                  sửa số tiền hoặc xoá dòng nếu không thu.
                </p>
              ) : null}
              {values.surcharges.map((_, index) => (
                <fieldset
                  // Rows are addressed by position, like their field names.
                  key={index}
                  className="grid min-w-0 gap-3 rounded-control border border-line p-3"
                  aria-label={`Phụ thu ${index + 1}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <legend className="font-semibold">Phụ thu {index + 1}</legend>
                    <IconButton
                      icon="delete"
                      variant="ghost"
                      size="sm"
                      label={`Xoá phụ thu ${index + 1}`}
                      onClick={() => form.removeFieldValue('surcharges', index)}
                    />
                  </div>
                  <FormField
                    name={`surcharges[${index}].amount`}
                    label="Số tiền"
                    required
                    validators={issues(amountSchema)}
                  >
                    <NumberInput min={1} max={1_000_000_000} step={1} endAddon="₫" />
                  </FormField>
                  <FormField
                    name={`surcharges[${index}].reason`}
                    label="Lý do"
                    required
                    validators={issues(reasonSchema)}
                  >
                    <Textarea maxLength={500} rows={2} />
                  </FormField>
                </fieldset>
              ))}
              <div>
                <Button
                  variant="secondary"
                  disabled={values.surcharges.length >= MAX_SURCHARGES}
                  onClick={() => form.pushFieldValue('surcharges', { amount: null, reason: '' })}
                >
                  Thêm phụ thu
                </Button>
              </div>
            </FormGrid>
          </FormSection>

          <FormSection
            title={<>3. Tổng hợp</>}
            variant="card"
            hidden={step !== 2}
            aria-label={STEPS[2].label}
          >
            <FormGrid columns={1}>
              {preview.isFetching ? (
                <Skeleton className="h-48" />
              ) : summary ? (
                <>
                  <SettlementSummary summary={summary} />
                  {summary.depositRefunded > 0 ? (
                    <FormField name="refundMethod" label="Phương thức hoàn cọc" required>
                      <Select options={MANUAL_PAYMENT_METHOD_OPTIONS} />
                    </FormField>
                  ) : null}
                </>
              ) : drafts.length ? (
                <Alert tone="warning" role="alert" data-testid="settle-drafts">
                  Hợp đồng còn hoá đơn nháp. Phát hành hoặc void trước khi thanh lý:{' '}
                  {drafts.map((draft, index) => (
                    <span key={draft.invoiceId}>
                      {index ? ', ' : ''}
                      <Link
                        className="font-semibold text-accent"
                        to={`/invoices/${draft.invoiceId}`}
                      >
                        kỳ {displayPeriod(draft.period)}
                      </Link>
                    </span>
                  ))}
                </Alert>
              ) : preview.error ? (
                <Alert
                  tone="danger"
                  role="alert"
                  data-testid="settle-preview-error"
                  action={
                    <Button variant="secondary" size="sm" onClick={() => setStep(0)}>
                      Sửa bước 1
                    </Button>
                  }
                >
                  {getErrorMessage(preview.error, 'Không tính được thanh lý.')}
                </Alert>
              ) : null}
            </FormGrid>
          </FormSection>

          <FormActions separator>
            {step > 0 ? (
              <Button variant="secondary" onClick={() => setStep(step - 1)}>
                Quay lại
              </Button>
            ) : (
              <Link
                className="inline-flex items-center font-semibold text-accent"
                to={`/contracts/${contract.id}`}
              >
                Về hợp đồng
              </Link>
            )}
            {step < 2 ? (
              <Button disabled={uploading} onClick={() => void next()}>
                Tiếp tục
              </Button>
            ) : (
              <Button
                disabled={!summary || preview.isFetching}
                loading={settle.isPending}
                onClick={() => setConfirming(true)}
              >
                Xác nhận thanh lý
              </Button>
            )}
          </FormActions>
        </FormLayout>
      </Form>
      {summary ? (
        <AlertDialog
          open={confirming}
          onOpenChange={(open) => {
            if (!settle.isPending) setConfirming(open);
          }}
          title="Xác nhận thanh lý?"
          description={`${resultText(summary)}. Hoá đơn thanh lý ${formatVnd(summary.total)} được phát hành, cọc được cấn trừ${summary.depositRefunded > 0 ? ` và hoàn ${formatVnd(summary.depositRefunded)} (${PAYMENT_METHOD_LABELS[values.refundMethod]})` : ''}; hợp đồng kết thúc, phòng ${contract.roomCode} về trống. Không thể hoàn tác.`}
          confirmLabel="Thanh lý"
          cancelLabel="Quay lại"
          confirmVariant="danger"
          closeOnConfirm={false}
          confirmLoading={settle.isPending}
          onConfirm={() => void confirm()}
        />
      ) : null}
    </div>
  );
}

function resultText(summary: Pick<ContractSettlementPreview, 'ownerRefunds' | 'tenantPays'>) {
  if (summary.ownerRefunds > 0) return `Chủ trọ hoàn ${formatVnd(summary.ownerRefunds)}`;
  if (summary.tenantPays > 0) return `Người thuê trả thêm ${formatVnd(summary.tenantPays)}`;
  return 'Không bên nào phải trả thêm';
}

function Row({
  label,
  value,
  testId,
  strong = false,
}: {
  label: string;
  value: number;
  testId?: string;
  strong?: boolean;
}) {
  return (
    <div className={`flex min-w-0 justify-between gap-3 py-1 ${strong ? 'font-semibold' : ''}`}>
      <dt className="min-w-0">{label}</dt>
      <dd className="whitespace-nowrap text-right" data-testid={testId}>
        {formatVnd(value)}
      </dd>
    </div>
  );
}

/** The API computation, as is (screens.md O-24 step 3). */
function SettlementSummary({ summary }: { summary: ContractSettlementPreview }) {
  const describe = useLineDescription();

  return (
    <div className="grid min-w-0 gap-4" data-testid="settlement-summary">
      <p className="text-ui-sm text-muted">
        Trả phòng {displayDate(summary.moveOutDate)} · hoá đơn kỳ {displayPeriod(summary.period)}
        {summary.refundUnusedRent ? '' : ' · toà không hoàn tiền ngày chưa ở'}
      </p>
      {summary.lines.length ? (
        <ul className="grid min-w-0 divide-y divide-line" aria-label="Các dòng hoá đơn thanh lý">
          {summary.lines.map((line, index) => {
            const formula = lineFormula(line);

            return (
              <li
                // Lines are a computed snapshot without ids; their order is stable.
                key={index}
                className="flex min-w-0 justify-between gap-3 py-2"
              >
                <div className="grid min-w-0 gap-0.5">
                  <span className="break-words">{describe(line)}</span>
                  {formula ? (
                    <span className="break-words text-ui-sm text-muted">{formula}</span>
                  ) : null}
                </div>
                <span className="whitespace-nowrap">{formatVnd(line.amount)}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          size="compact"
          appearance="plain"
          title={<>Không có khoản nào trên hoá đơn thanh lý.</>}
        />
      )}
      <dl className="grid min-w-0 divide-y divide-line">
        <Row label="Điện nước cuối" value={summary.utilitiesTotal} testId="settle-utilities" />
        {summary.unbilledTotal ? (
          <Row label="Tiền phòng, dịch vụ chưa có hoá đơn" value={summary.unbilledTotal} />
        ) : null}
        {summary.refundUnusedRent ? (
          <Row label="Hoàn tiền ngày chưa ở" value={summary.refundTotal} testId="settle-refund" />
        ) : null}
        <Row label="Phụ thu" value={summary.surchargeTotal} testId="settle-surcharges" />
        {summary.rounding ? <Row label="Làm tròn" value={summary.rounding} /> : null}
        <Row label="Hoá đơn thanh lý" value={summary.total} testId="settle-total" strong />
      </dl>
      {summary.outstandingInvoices.length ? (
        <div className="grid min-w-0 gap-1">
          <h3 className="font-semibold">Nợ các kỳ trước</h3>
          <dl className="grid min-w-0 divide-y divide-line">
            {summary.outstandingInvoices.map((invoice) => (
              <Row
                key={invoice.invoiceId}
                label={`${invoice.code ?? ''} · kỳ ${displayPeriod(invoice.period)}`}
                value={invoice.remaining}
              />
            ))}
          </dl>
        </div>
      ) : null}
      <dl className="grid min-w-0 divide-y divide-line">
        <Row label="Nợ các kỳ trước" value={summary.outstandingTotal} testId="settle-outstanding" />
        <Row label="Tổng phải thu" value={summary.amountDue} testId="settle-amount-due" />
        <Row label="Cọc đang giữ" value={summary.depositHeld} testId="settle-deposit" />
      </dl>
      <Alert
        tone={summary.tenantPays > 0 ? 'warning' : 'success'}
        title={resultText(summary)}
        data-testid="settle-result"
      >
        Cọc cấn trừ {formatVnd(summary.depositApplied)} (ghi vào đúng hoá đơn được trả) · hoàn cọc{' '}
        {formatVnd(summary.depositRefunded)}
        {summary.remainingDue > 0 ? ` · còn nợ ${formatVnd(summary.remainingDue)}` : ''}.
      </Alert>
    </div>
  );
}

/** After settling: the invoice, its share link (ST-16) and where things went. */
function SettlementDone({ result }: { result: ContractSettlementResult }) {
  const [sharing, setSharing] = useState(false);
  const [link, setLink] = useState<InvoiceShareLink | null>(null);
  const { invoice, contract } = result;

  return (
    <div className="grid min-w-0 max-w-4xl gap-5" data-testid="settle-done">
      <h1 className="text-heading font-bold">Đã thanh lý {contract.code}</h1>
      <Alert tone="success" title={resultText(result)}>
        Hợp đồng đã kết thúc, phòng {contract.roomCode} về trống. Cọc cấn trừ{' '}
        {formatVnd(result.depositApplied)}, hoàn {formatVnd(result.depositRefunded)}
        {result.remainingDue > 0 ? `, còn phải thu ${formatVnd(result.remainingDue)}` : ''}.
      </Alert>
      <section className="grid min-w-0 gap-3 rounded-panel border border-line bg-surface p-4 sm:p-5">
        <h2 className="text-section font-semibold">Hoá đơn thanh lý {invoice.code}</h2>
        <p>
          Tổng {formatVnd(invoice.total)} · đã thu {formatVnd(invoice.paidTotal)} · còn lại{' '}
          {formatVnd(invoice.remaining)}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setSharing(true)}>Chia sẻ biên bản</Button>
          <Link
            className="inline-flex items-center px-2 font-semibold text-accent"
            to={`/invoices/${invoice.id}`}
          >
            Xem hoá đơn thanh lý
          </Link>
          <Link
            className="inline-flex items-center px-2 font-semibold text-accent"
            to={`/contracts/${contract.id}`}
          >
            Về hợp đồng
          </Link>
        </div>
      </section>
      {sharing ? (
        <ShareInvoiceDialog
          invoice={invoice}
          link={link}
          onLinkChange={setLink}
          onClose={() => setSharing(false)}
        />
      ) : null}
    </div>
  );
}
