import {
  Alert,
  AlertDialog,
  Button,
  DatePicker,
  Form,
  FormField,
  FormSubmit,
  Input,
  Select,
  Textarea,
  useAppForm,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import {
  useAttachTenantDocument,
  useCreateTenant,
  useStaySdk,
  useTenant,
  useUpdateTenant,
} from '@stay/sdk/react';
import {
  ApiSdkError,
  type components,
  createUploadApi,
  getDuplicateTenant,
  getErrorMessage,
} from '@stay/sdk/shared';
import {
  type CccdQrData,
  normalizeIdNumber,
  normalizePhone,
  STAY_UPLOAD_MIME_TYPES,
  TENANT_GENDERS,
} from '@stay/shared';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as v from 'valibot';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { CccdScanButton, cccdFilledFields } from '@/libraries/cccd/cccd-scan';
import { DATE_FIELD } from '@/libraries/forms/date-field';
import { PageSpinner } from '@/routing/route-guards';

type TenantDetail = components['schemas']['StayTenantDetail'];

type DocumentSide = 'id_front' | 'id_back';

type TenantValues = {
  fullName: string;
  phone: string;
  email: string;
  idNumber: string;
  idIssuedAt: string;
  birthDate: string;
  gender: string;
  hometown: string;
  permanentAddress: string;
  occupation: string;
  note: string;
};

type UploadState = { status: 'uploading' | 'done' | 'error'; fileId?: string; name: string };

function initialValues(tenant?: TenantDetail): TenantValues {
  return {
    fullName: tenant?.fullName ?? '',
    phone: tenant?.phone ?? '',
    email: tenant?.email ?? '',
    // The stored CCCD is only known masked: an empty field keeps it.
    idNumber: '',
    idIssuedAt: tenant?.idIssuedAt ?? '',
    birthDate: tenant?.birthDate ?? '',
    gender: tenant?.gender ?? '',
    hometown: tenant?.hometown ?? '',
    permanentAddress: tenant?.permanentAddress ?? '',
    occupation: tenant?.occupation ?? '',
    note: tenant?.note ?? '',
  };
}

const orNull = (value: string) => value.trim() || null;

function genderValue(value: string) {
  return TENANT_GENDERS.find((gender) => gender === value) ?? null;
}

/** Picks a CCCD side and uploads it right away (private upload ticket). */
function DocumentPicker({
  side,
  label,
  state,
  onPick,
}: {
  side: DocumentSide;
  label: string;
  state: UploadState | undefined;
  onPick: (side: DocumentSide, file: File) => void;
}) {
  const { t } = useTranslation();

  const inputId = `document-${side}`;

  return (
    <div className="grid gap-1.5">
      <label htmlFor={inputId} className="text-ui-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={inputId}
        type="file"
        accept={STAY_UPLOAD_MIME_TYPES.join(',')}
        className="text-ui-sm text-muted file:mr-3 file:rounded-control file:border file:border-line file:bg-surface file:px-3 file:py-2 file:text-ink"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) onPick(side, file);
        }}
        data-testid={`document-input-${side}`}
      />
      {state ? (
        <p
          className={
            state.status === 'error' ? 'text-ui-sm text-danger-700' : 'text-ui-sm text-muted'
          }
          role={state.status === 'error' ? 'alert' : 'status'}
        >
          {t(`tenants.form.upload.${state.status}`, { name: state.name })}
        </p>
      ) : null}
    </div>
  );
}

function TenantForm({ tenant, onReload }: { tenant?: TenantDetail; onReload: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sdk = useStaySdk();
  const { buildingId } = useActiveBuilding();
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const attachDocument = useAttachTenantDocument();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [duplicateId, setDuplicateId] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [uploads, setUploads] = useState<Partial<Record<DocumentSide, UploadState>>>({});
  const [saved, setSaved] = useState(false);
  const [isDirty, setDirty] = useState(false);
  const [scanned, setScanned] = useState<string[] | null>(null);

  const uploader = useMemo(() => createUploadApi(sdk, { baseUrl: window.location.origin }), [sdk]);

  const schema = useMemo(
    () => ({
      fullName: v.pipe(v.string(), v.trim(), v.minLength(1, t('tenants.form.fullNameRequired'))),
      phone: v.pipe(
        v.string(),
        v.check((value) => normalizePhone(value) !== null, t('tenants.form.phoneInvalid')),
      ),
      email: v.pipe(
        v.string(),
        v.check(
          (value) => !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
          t('tenants.form.emailInvalid'),
        ),
      ),
      idNumber: v.pipe(
        v.string(),
        v.check(
          (value) => !value.trim() || normalizeIdNumber(value) !== null,
          t('tenants.form.idNumberInvalid'),
        ),
      ),
    }),
    [t],
  );

  const genderOptions = useMemo(
    () => TENANT_GENDERS.map((value) => ({ value, label: t(`tenants.genders.${value}`) })),
    [t],
  );

  const attachUploads = async (tenantId: string) => {
    for (const side of ['id_front', 'id_back'] as const) {
      const fileId = uploads[side]?.fileId;

      if (fileId) await attachDocument.mutateAsync({ id: tenantId, body: { kind: side, fileId } });
    }
  };

  const form = useAppForm({
    defaultValues: initialValues(tenant),
    listeners: { onChange: () => setDirty(true) },
    onSubmit: async ({ value }) => {
      setServerErrors({});
      setFormError(null);
      setDuplicateId(null);
      setConflict(false);

      const fields = {
        fullName: value.fullName.trim(),
        phone: normalizePhone(value.phone) ?? value.phone.trim(),
        email: orNull(value.email),
        idIssuedAt: orNull(value.idIssuedAt),
        birthDate: orNull(value.birthDate),
        gender: genderValue(value.gender),
        hometown: orNull(value.hometown),
        permanentAddress: orNull(value.permanentAddress),
        occupation: orNull(value.occupation),
        note: orNull(value.note),
      };
      const idNumber = value.idNumber.trim() ? normalizeIdNumber(value.idNumber) : null;

      try {
        const result = tenant
          ? await updateTenant.mutateAsync({
              id: tenant.id,
              body: { ...fields, version: tenant.version, ...(idNumber ? { idNumber } : {}) },
            })
          : await createTenant.mutateAsync({ buildingId: buildingId ?? '', ...fields, idNumber });

        await attachUploads(result.id);
        setSaved(true);
        toast.success(t(tenant ? 'tenants.form.updated' : 'tenants.form.created'));
        navigate(`/tenants/${result.id}`, { replace: !tenant });
      } catch (error) {
        if (error instanceof ApiSdkError && error.code === 'version_conflict') {
          setConflict(true);
          return;
        }

        const duplicate = getDuplicateTenant(error);
        const fieldErrors = error instanceof ApiSdkError ? error.fieldErrors : {};
        const mapped = Object.fromEntries(
          Object.entries(fieldErrors).flatMap(([field, messages]) =>
            messages[0] ? [[field, messages[0]]] : [],
          ),
        );

        setDuplicateId(duplicate?.tenantId ?? null);
        setServerErrors(mapped);
        if (!Object.keys(mapped).length)
          setFormError(getErrorMessage(error, t('errors.saveFailed')));
        else setFormError(t('tenants.form.fixErrors'));
      }
    },
  });

  const pendingChanges = (isDirty || Object.keys(uploads).length > 0) && !saved;

  // Leaving with unsaved changes (reload, close tab) asks first.
  useEffect(() => {
    if (!pendingChanges) return;

    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [pendingChanges]);

  const pick = async (side: DocumentSide, file: File) => {
    setUploads((current) => ({ ...current, [side]: { status: 'uploading', name: file.name } }));

    try {
      const fileId = await uploader.uploadImage({
        purpose: 'tenant_document',
        buildingId: tenant?.buildingId ?? buildingId ?? '',
        file,
      });

      setUploads((current) => ({
        ...current,
        [side]: { status: 'done', fileId, name: file.name },
      }));
    } catch {
      setUploads((current) => ({ ...current, [side]: { status: 'error', name: file.name } }));
    }
  };

  const clearError = (field: string) => () =>
    setServerErrors((current) => {
      if (!current[field]) return current;

      const { [field]: _removed, ...rest } = current;

      return rest;
    });

  const error = (field: string): ReactNode => serverErrors[field];

  // Prefill from the CCCD QR: only the values the card has; the owner reviews, then saves.
  const applyScan = (data: CccdQrData) => {
    const prefill: [keyof TenantValues, string | null][] = [
      ['fullName', data.fullName],
      ['idNumber', data.idNumber],
      ['birthDate', data.birthDate],
      ['gender', data.gender],
      ['permanentAddress', data.permanentAddress],
      ['idIssuedAt', data.issuedAt],
    ];

    for (const [field, value] of prefill)
      if (value) {
        form.setFieldValue(field, value);
        clearError(field)();
      }
    setDirty(true);
    setScanned(cccdFilledFields(data));
  };

  const idNumberError: ReactNode = serverErrors.idNumber ? (
    <span>
      {serverErrors.idNumber}{' '}
      {duplicateId ? (
        <Link to={`/tenants/${duplicateId}`} className="font-semibold underline">
          {t('tenants.form.viewExisting')}
        </Link>
      ) : null}
    </span>
  ) : undefined;

  const cancelTarget = tenant ? `/tenants/${tenant.id}` : '/tenants';
  const uploading = Object.values(uploads).some((upload) => upload?.status === 'uploading');

  return (
    <Form form={form} schema={schema} className="grid max-w-4xl gap-5" data-testid="tenant-form">
      {conflict ? (
        <Alert
          tone="warning"
          role="alert"
          title={t('tenants.form.conflict')}
          action={
            <Button variant="secondary" size="sm" onClick={onReload}>
              {t('tenants.form.reload')}
            </Button>
          }
        />
      ) : formError ? (
        <Alert tone="danger" role="alert" data-testid="tenant-form-error">
          {formError}
        </Alert>
      ) : null}

      <section className="grid gap-4 rounded-panel border border-line bg-surface p-4 sm:grid-cols-2 sm:p-5">
        <div className="grid gap-3 sm:col-span-2">
          <div>
            <CccdScanButton onScanned={applyScan} />
          </div>
          {scanned ? (
            <Alert tone="success" role="status" data-testid="cccd-scan-filled">
              {scanned.length
                ? t('tenants.scan.filled', {
                    fields: scanned.map((field) => t(`tenants.fields.${field}`)).join(', '),
                  })
                : t('tenants.scan.filledNone')}
            </Alert>
          ) : null}
        </div>
        <FormField name="fullName" label={t('tenants.fields.fullName')} required className="mb-0">
          <Input autoComplete="off" error={error('fullName')} onChange={clearError('fullName')} />
        </FormField>
        <FormField name="phone" label={t('tenants.fields.phone')} required className="mb-0">
          <Input
            type="tel"
            inputMode="tel"
            placeholder="0901234567"
            error={error('phone')}
            onChange={clearError('phone')}
          />
        </FormField>
      </section>

      <section className="grid gap-4 rounded-panel border border-line bg-surface p-4 sm:grid-cols-2 sm:p-5">
        <h2 className="text-section font-semibold text-ink sm:col-span-2">
          {t('tenants.form.optional')}
        </h2>
        <FormField name="email" label={t('tenants.fields.email')} className="mb-0">
          <Input
            type="email"
            inputMode="email"
            error={error('email')}
            onChange={clearError('email')}
          />
        </FormField>
        <FormField name="idNumber" label={t('tenants.fields.idNumber')} className="mb-0">
          <Input
            inputMode="numeric"
            placeholder={tenant?.idNumberMasked ?? '001234567890'}
            hint={tenant?.idNumberMasked ? t('tenants.form.idNumberKeep') : undefined}
            error={idNumberError}
            onChange={clearError('idNumber')}
          />
        </FormField>
        <FormField
          name="idIssuedAt"
          label={t('tenants.fields.idIssuedAt')}
          className="mb-0"
          {...DATE_FIELD}
        >
          <DatePicker error={error('idIssuedAt')} onValueChange={clearError('idIssuedAt')} />
        </FormField>
        <FormField
          name="birthDate"
          label={t('tenants.fields.birthDate')}
          className="mb-0"
          {...DATE_FIELD}
        >
          <DatePicker error={error('birthDate')} onValueChange={clearError('birthDate')} />
        </FormField>
        <FormField name="gender" label={t('tenants.fields.gender')} className="mb-0">
          <Select options={genderOptions} clearable placeholder={t('tenants.form.choose')} />
        </FormField>
        <FormField name="occupation" label={t('tenants.fields.occupation')} className="mb-0">
          <Input error={error('occupation')} onChange={clearError('occupation')} />
        </FormField>
        <FormField name="hometown" label={t('tenants.fields.hometown')} className="mb-0">
          <Input error={error('hometown')} onChange={clearError('hometown')} />
        </FormField>
        <FormField
          name="permanentAddress"
          label={t('tenants.fields.permanentAddress')}
          className="mb-0"
        >
          <Input error={error('permanentAddress')} onChange={clearError('permanentAddress')} />
        </FormField>
        <FormField name="note" label={t('tenants.fields.note')} className="mb-0 sm:col-span-2">
          <Textarea rows={3} error={error('note')} onChange={clearError('note')} />
        </FormField>
      </section>

      <section className="grid gap-4 rounded-panel border border-line bg-surface p-4 sm:grid-cols-2 sm:p-5">
        <h2 className="text-section font-semibold text-ink sm:col-span-2">
          {t('tenants.documents.title')}
        </h2>
        <DocumentPicker
          side="id_front"
          label={t('tenants.documents.front')}
          state={uploads.id_front}
          onPick={(side, file) => void pick(side, file)}
        />
        <DocumentPicker
          side="id_back"
          label={t('tenants.documents.back')}
          state={uploads.id_back}
          onPick={(side, file) => void pick(side, file)}
        />
      </section>

      <div className="flex flex-wrap gap-2">
        <FormSubmit form={form}>
          {(isSubmitting) => (
            <Button type="submit" loading={isSubmitting} disabled={uploading}>
              {isSubmitting ? t('common.saving') : t('common.save')}
            </Button>
          )}
        </FormSubmit>
        {pendingChanges ? (
          <AlertDialog
            title={t('tenants.form.leaveTitle')}
            description={t('tenants.form.leaveDescription')}
            confirmLabel={t('tenants.form.leave')}
            cancelLabel={t('tenants.form.stay')}
            confirmVariant="danger"
            onConfirm={() => navigate(cancelTarget)}
            trigger={
              <Button type="button" variant="ghost">
                {t('common.cancel')}
              </Button>
            }
            triggerAsChild
          />
        ) : (
          <Button type="button" variant="ghost" onClick={() => navigate(cancelTarget)}>
            {t('common.cancel')}
          </Button>
        )}
      </div>
    </Form>
  );
}

/** O-13: `/tenants/new` (name + phone is enough) and `/tenants/:id/edit`. */
export default function TenantFormPage() {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const tenant = useTenant(id);

  const editing = Boolean(id);

  if (editing && tenant.isPending) return <PageSpinner />;

  if (editing && !tenant.data)
    return (
      <Alert
        tone="danger"
        title={t('errors.loadFailed')}
        action={
          <Button variant="secondary" size="sm" onClick={() => void tenant.refetch()}>
            {t('errors.retry')}
          </Button>
        }
      >
        {getErrorMessage(tenant.error, t('errors.loadFailed'))}
      </Alert>
    );

  return (
    <div className="grid gap-5">
      <h1 className="text-heading font-bold text-ink">
        {editing ? t('tenants.form.editTitle') : t('tenants.form.newTitle')}
      </h1>
      <TenantForm
        key={tenant.data ? `${tenant.data.id}:${tenant.data.version}` : 'new'}
        tenant={tenant.data}
        onReload={() => void tenant.refetch()}
      />
    </div>
  );
}
