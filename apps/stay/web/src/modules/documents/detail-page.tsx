import {
  Alert,
  Button,
  Checkbox,
  DatePicker,
  Form,
  FormActions,
  FormField,
  FormGrid,
  FormLayout,
  FormSection,
  FormSubmit,
  Icon,
  Input,
  InputPassword,
  Skeleton,
  Timeline,
  useAppForm,
} from '@itclabs/react-ui';
import {
  useCancelContractDocument,
  useContract,
  useContractDocument,
  useLandlordProfile,
  useMarkDocumentPaper,
  useOwnerSignDocument,
  useSendContractDocument,
  useStaySdk,
  useSupersedeDocument,
  useUpdateContractDocument,
} from '@stay/sdk/react';
import { createDocumentApi, getErrorMessage } from '@stay/sdk/shared';
import { type ContractDocumentDetail, DOCUMENT_FINAL_STATUSES } from '@stay/shared';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as v from 'valibot';
import { useCanOn } from '@/libraries/ability';
import { DocumentBody } from '@/libraries/document-body';
import { DATE_FIELD } from '@/libraries/forms/date-field';
import { FormError, LoadError } from '@/libraries/forms/page-states';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { PortalLinksPanel } from '@/modules/contracts/portal-links';
import { DocumentStatusTag, documentDateTime } from '@/modules/portal/documents-ui';
import { documentPath } from './contract-documents';
import { DocumentEditor } from './editor';

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function DocumentPortalLinks({ contractId }: { contractId: string }) {
  const contract = useContract(contractId);

  if (contract.isPending) return <Skeleton className="h-24" />;
  if (!contract.data)
    return <LoadError error={contract.error} onRetry={() => void contract.refetch()} />;
  return <PortalLinksPanel contract={contract.data} />;
}

function OwnerSignaturePreview() {
  const { t } = useTranslation('documents');
  const profile = useLandlordProfile();

  if (profile.isPending) return <Skeleton className="h-24" />;
  if (!profile.data)
    return <LoadError error={profile.error} onRetry={() => void profile.refetch()} />;
  return (
    <div className="grid gap-2">
      <p>{profile.data.fullName}</p>
      {profile.data.signatureImage ? (
        <img
          src={profile.data.signatureImage}
          alt={t('signature')}
          className="h-24 max-w-full object-contain"
        />
      ) : (
        <Link className="text-accent underline" to="/settings/landlord">
          {t('landlord')}
        </Link>
      )}
    </div>
  );
}

function ActionForm({
  title,
  field,
  type,
  onSubmit,
  children,
  variant = 'primary',
}: {
  variant?: 'primary' | 'danger';
  title: string;
  field?: string;
  type?: string;
  onSubmit: (value: string) => Promise<void>;
  children?: ReactNode;
}) {
  const { t } = useTranslation('documents');
  const [error, setError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { value: '' },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await onSubmit(value.value);
        form.reset();
      } catch (cause) {
        setError(getErrorMessage(cause, t('failed')));
      }
    },
  });

  return (
    <Form
      form={form}
      schema={field ? { value: v.pipe(v.string(), v.trim(), v.minLength(1, t('required'))) } : {}}
    >
      <FormLayout>
        <FormSection variant="card" title={title}>
          <FormError message={error} />
          {field && (
            <FormGrid>
              <FormField
                name="value"
                label={field}
                required
                {...(type === 'date' ? DATE_FIELD : {})}
              >
                {type === 'password' ? (
                  <InputPassword autoComplete="current-password" />
                ) : type === 'date' ? (
                  <DatePicker clearable={false} />
                ) : (
                  <Input type={type ?? 'text'} />
                )}
              </FormField>
            </FormGrid>
          )}
          {children}
        </FormSection>
        <FormActions>
          <FormSubmit form={form}>
            {(loading) => (
              <Button type="submit" loading={loading} variant={variant}>
                {title}
              </Button>
            )}
          </FormSubmit>
        </FormActions>
      </FormLayout>
    </Form>
  );
}

function DocumentDetail({ data }: { data: ContractDocumentDetail }) {
  const { t, i18n } = useTranslation('documents');
  const api = createDocumentApi(useStaySdk());
  const update = useUpdateContractDocument();
  const send = useSendContractDocument();
  const sign = useOwnerSignDocument();
  const cancel = useCancelContractDocument();
  const paper = useMarkDocumentPaper();
  const supersede = useSupersedeDocument();
  const navigate = useNavigate();
  const canUpdate = useCanOn('update', 'Contract', { buildingId: data.buildingId });
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState<string | null>(null);
  const [linksOpen, setLinksOpen] = useState(false);
  const [coSigners, setCoSigners] = useState<string[]>([]);
  const paperForm = useAppForm({ defaultValues: { uploadFiles: [] as File[] } });

  const [paperFile, setPaperFile] = useState<File | null>(null);
  const [action, setAction] = useState<'send' | 'sign' | 'paper' | 'cancel' | null>(null);
  const { prompt } = useUnsavedChanges(body !== null && body !== data.bodyHtml);

  const final = DOCUMENT_FINAL_STATUSES.some((status) => status === data.status);
  const editable = canUpdate && data.status === 'draft';
  const canSend =
    canUpdate && ['draft', 'owner_signed', 'sent', 'viewed', 'expired'].includes(data.status);
  const canSign =
    canUpdate && data.canOwnerSign && ['draft', 'signed_by_tenant'].includes(data.status);
  const busy =
    update.isPending ||
    send.isPending ||
    sign.isPending ||
    cancel.isPending ||
    paper.isPending ||
    supersede.isPending;

  const perform = async (operation: () => Promise<unknown>) => {
    setError(null);
    try {
      await operation();
      setAction(null);
    } catch (cause) {
      setError(getErrorMessage(cause, t('failed')));
    }
  };

  return (
    <div className="grid min-w-0 gap-5">
      {prompt}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-heading font-bold">{data.code}</h1>
          <p>
            {data.title} · {data.templateName} v{data.templateVersion}
          </p>
          <DocumentStatusTag status={data.status} />
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              void perform(async () => downloadBlob(await api.pdf(data.id), `${data.code}.pdf`))
            }
          >
            <Icon name="download" className="size-4" aria-hidden />
            {t('download')}
          </Button>
          {data.hasPaperScan && (
            <Button
              variant="secondary"
              onClick={() =>
                void perform(async () => downloadBlob(await api.scan(data.id), `${data.code}-scan`))
              }
            >
              {t('scan')}
            </Button>
          )}
          {canUpdate && !final && (
            <Button variant="secondary" disabled={busy} onClick={() => setAction('paper')}>
              <Icon name="upload" className="size-4" aria-hidden />
              {t('paper')}
            </Button>
          )}
          {canUpdate && !final && (
            <Button variant="danger" disabled={busy} onClick={() => setAction('cancel')}>
              {t('cancel')}
            </Button>
          )}
          {canUpdate && ['completed', 'completed_paper'].includes(data.status) && (
            <Button
              disabled={busy}
              onClick={() =>
                void perform(async () => {
                  const replacement = await supersede.mutateAsync(data.id);

                  navigate(documentPath(data.contractId, replacement.id));
                })
              }
            >
              {t('replace')}
            </Button>
          )}
          {canSign && (
            <Button
              disabled={busy || body !== null || data.missing.length > 0}
              onClick={() => setAction('sign')}
            >
              {t('ownerSign')}
            </Button>
          )}
          {canSend && (
            <Button
              disabled={busy || data.missing.length > 0 || body !== null}
              onClick={() => setAction('send')}
            >
              <Icon name="send" className="size-4" aria-hidden />
              {t(data.sentAt ? 'resend' : 'send')}
            </Button>
          )}
        </div>
      </header>
      <FormError message={error} />
      <Alert tone="info">{t('legal')}</Alert>
      {data.missing.length > 0 && (
        <Alert tone="warning" title={t('missing')}>
          <ul>
            {data.missing.map((key) => (
              <li key={key}>{key}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <Link className="text-accent underline" to="/settings/landlord">
              {t('landlord')}
            </Link>
            <Link className="text-accent underline" to={`/contracts/${data.contractId}`}>
              {t('contract')}
            </Link>
            {data.occupants.map((occupant) => (
              <Link
                key={occupant.tenantId}
                className="text-accent underline"
                to={`/tenants/${occupant.tenantId}/edit`}
              >
                {t('fixTenant')}: {occupant.name}
              </Link>
            ))}
          </div>
        </Alert>
      )}
      {editable && <p className="text-ui-sm text-muted">{t('orderHint')}</p>}
      {data.editedManually && <p>{t('edited')}</p>}
      {editable ? (
        <>
          <DocumentEditor value={body ?? data.bodyHtml} onChange={setBody} />
          <FormActions>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() =>
                void perform(async () => {
                  await update.mutateAsync({
                    id: data.id,
                    body: { regenerate: true, version: data.version },
                  });
                  setBody(null);
                })
              }
            >
              {t('refresh')}
            </Button>
            <Button
              loading={update.isPending}
              disabled={body === null}
              onClick={() =>
                void perform(async () => {
                  await update.mutateAsync({
                    id: data.id,
                    body: { bodyHtml: body ?? data.bodyHtml, version: data.version },
                  });
                  setBody(null);
                })
              }
            >
              {t('save')}
            </Button>
          </FormActions>
        </>
      ) : (
        <DocumentBody
          html={data.bodyHtml}
          className="mx-auto w-full max-w-3xl rounded-panel border border-line bg-surface p-5 sm:p-8"
        />
      )}
      {action === 'send' && (
        <ActionForm
          title={t('send')}
          onSubmit={async () => {
            await send.mutateAsync({
              id: data.id,
              body: { version: data.version, coSignerTenantIds: coSigners },
            });
            setAction(null);
          }}
        >
          <p>{t('coSigners')}</p>
          {data.occupants.map((occupant) => (
            <Checkbox
              key={occupant.tenantId}
              label={occupant.name}
              checked={occupant.primary || coSigners.includes(occupant.tenantId)}
              disabled={occupant.primary}
              onCheckedChange={(checked) =>
                setCoSigners((previous) =>
                  checked === true
                    ? [...previous, occupant.tenantId]
                    : previous.filter((id) => id !== occupant.tenantId),
                )
              }
            />
          ))}
        </ActionForm>
      )}
      {action === 'sign' && (
        <ActionForm
          title={t('ownerSign')}
          field={t('password')}
          type="password"
          onSubmit={async (password) => {
            await sign.mutateAsync({ id: data.id, body: { password, version: data.version } });
            setAction(null);
          }}
        >
          <OwnerSignaturePreview />
        </ActionForm>
      )}
      {action === 'cancel' && (
        <ActionForm
          title={t('cancel')}
          variant="danger"
          field={t('reason')}
          onSubmit={async (reason) => {
            await cancel.mutateAsync({ id: data.id, body: { reason, version: data.version } });
            setAction(null);
          }}
        />
      )}
      {action === 'paper' && (
        <ActionForm
          title={t('paper')}
          field={t('signedOn')}
          type="date"
          onSubmit={async (signedOn) => {
            if (!paperFile) throw new Error(t('required'));
            if (paperFile.size > 10_485_760) throw new Error(t('fileTooLarge'));
            await paper.mutateAsync({
              id: data.id,
              body: { version: data.version, signedOn, file: paperFile },
            });
            setAction(null);
          }}
        >
          <paperForm.AppField
            name="uploadFiles"
            listeners={{
              onChange: ({ value: files }) => {
                void ((files) => setPaperFile(files[0] ?? null))(files);
              },
            }}
          >
            {(field) => (
              <field.UploadField
                label={t('paperFile')}
                accept="application/pdf,image/png,image/jpeg"
                maxBytes={10485760}
              />
            )}
          </paperForm.AppField>
        </ActionForm>
      )}
      {action && (
        <FormActions>
          <Button variant="secondary" onClick={() => setAction(null)}>
            {t('cancelAction')}
          </Button>
        </FormActions>
      )}
      <FormSection variant="card" title={t('signers')}>
        {canUpdate && (
          <>
            <FormActions>
              <Button
                variant="secondary"
                aria-expanded={linksOpen}
                onClick={() => setLinksOpen(!linksOpen)}
              >
                <Icon name="link" className="size-4" aria-hidden />
                {t('portalLinks')}
              </Button>
            </FormActions>
            {linksOpen && <DocumentPortalLinks contractId={data.contractId} />}
          </>
        )}
        <ul className="grid gap-2">
          {data.signers.map((signer) => (
            <li key={signer.id}>
              {signer.name} · {t(`portalDocuments:detail.signerRole.${signer.role}`)} ·{' '}
              {t(`portalDocuments:detail.signerStatus.${signer.status}`)}
              {signer.signedAt && ` · ${documentDateTime(signer.signedAt, i18n.language)}`}
              {signer.rejectReason && <p>{signer.rejectReason}</p>}
            </li>
          ))}
        </ul>
      </FormSection>
      <FormSection variant="card" title={t('timeline')}>
        <Timeline
          showStatus={false}
          items={data.events.map((event) => ({
            id: event.id,
            state: 'completed',
            title: (
              <>
                {t(`events.${event.type}`)} · {event.actorName} ·{' '}
                {documentDateTime(event.createdAt, i18n.language)}
                <p className="break-words text-ui-sm text-muted">{event.userAgent}</p>
              </>
            ),
          }))}
        />
        {data.pdfSha256 && <p className="break-all text-ui-sm">SHA-256: {data.pdfSha256}</p>}
      </FormSection>
      <Link
        className="text-accent"
        to={`/contracts/${data.contractId}?tab=${encodeURIComponent('Văn bản')}`}
      >
        {t('back')}
      </Link>
    </div>
  );
}

export default function DocumentDetailPage() {
  const { documentId = '' } = useParams();
  const query = useContractDocument(documentId);

  if (query.isPending) return <Skeleton className="h-64" />;
  if (!query.data) return <LoadError error={query.error} onRetry={() => void query.refetch()} />;
  return <DocumentDetail key={documentId} data={query.data} />;
}
