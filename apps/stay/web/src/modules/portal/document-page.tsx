import {
  Alert,
  Button,
  Checkbox,
  Form,
  FormField,
  Icon,
  Input,
  useAppForm,
} from '@itclabs/react-ui';
import { portalDocumentPdfPath } from '@stay/sdk/portal';
import { usePortalDocument, usePortalRejectDocument, usePortalSignDocument } from '@stay/sdk/react';
import { getErrorMessage } from '@stay/sdk/shared';
import type { PortalDocument } from '@stay/shared';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import * as v from 'valibot';
import { DocumentBody } from '@/libraries/document-body';
import { FormActions, FormGrid, FormLayout, FormSection } from '@/libraries/forms/layout';
import { FormError } from '@/libraries/forms/page-states';
import { useFormValue } from '@/libraries/forms/use-form-value';
import { SignaturePad } from '@/libraries/signature-pad';
import { DocumentStatusTag, documentDateTime, portalDocumentPaths } from './documents-ui';
import { PortalQuery } from './portal-ui';

function SigningDocument({ data }: { data: PortalDocument }) {
  const { t, i18n } = useTranslation('portalDocuments');
  const sign = usePortalSignDocument();
  const reject = usePortalRejectDocument();
  const [read, setRead] = useState(false);
  const [percent, setPercent] = useState(0);
  const [agree, setAgree] = useState(false);
  const [method, setMethod] = useState<'typed' | 'drawn'>('drawn');
  const [signature, setSignature] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const content = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = content.current;

    if (!element) return;
    const update = () => {
      const remaining = element.scrollHeight - element.clientHeight;
      const progress =
        remaining <= 0 ? 100 : Math.min(100, Math.round((element.scrollTop / remaining) * 100));

      setPercent(progress);
      if (element.scrollTop + element.clientHeight >= element.scrollHeight - 4) setRead(true);
    };
    const observer = new ResizeObserver(update);

    observer.observe(element);
    element.addEventListener('scroll', update);
    update();
    return () => {
      observer.disconnect();
      element.removeEventListener('scroll', update);
    };
  }, []);

  const form = useAppForm({
    defaultValues: { fullName: '', phoneLast4: '' },
    onSubmit: async ({ value }) => {
      setError(null);
      if (!read || !agree) {
        setError(t('sign.readFirst'));
        return;
      }
      if (method === 'drawn' && !signature) {
        setError(t('sign.drawRequired'));
        return;
      }
      try {
        await sign.mutateAsync({
          id: data.id,
          body: {
            ...value,
            agree,
            method,
            signatureImage: method === 'drawn' ? (signature ?? undefined) : undefined,
          },
        });
        form.reset();
        setSignature(null);
        setAgree(false);
      } catch (cause) {
        setError(getErrorMessage(cause, t('sign.errors.generic')));
      }
    },
  });
  const rejection = useAppForm({
    defaultValues: { reason: '' },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await reject.mutateAsync({ id: data.id, reason: value.reason });
        setRejecting(false);
      } catch (cause) {
        setError(getErrorMessage(cause, t('reject.error')));
      }
    },
  });

  const typedName = useFormValue(form, (state) => state.values.fullName);

  const locked = Boolean(data.lockedUntil && new Date(data.lockedUntil).getTime() > Date.now());
  const expired = Boolean(data.expiresAt && new Date(data.expiresAt).getTime() <= Date.now());

  return (
    <div className="grid min-w-0 gap-4">
      <Link to={portalDocumentPaths.list} className="text-accent">
        {t('detail.back')}
      </Link>
      <h1 className="text-heading font-bold">{data.title}</h1>
      <p>{data.code}</p>
      <DocumentStatusTag status={data.status} />
      <Alert tone="info">{t('detail.legal')}</Alert>
      {data.bodyHtml ? (
        <>
          <p role="status">
            {t('detail.progress', { percent })} · {t('detail.readHint')}
          </p>
          <section
            ref={content}
            // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users must be able to scroll the document reader.
            tabIndex={0}
            aria-label={t('detail.bodyLabel')}
            className="max-h-96 overflow-y-auto rounded-panel border border-line bg-surface p-4"
            data-testid="document-reader"
          >
            <DocumentBody html={data.bodyHtml} />
          </section>
        </>
      ) : (
        <p>{t('detail.notSigner')}</p>
      )}
      {data.expiresAt && (
        <p>{t('detail.expires', { date: documentDateTime(data.expiresAt, i18n.language) })}</p>
      )}
      <FormError message={error} />
      {data.awaitingMe && !expired ? (
        <>
          {locked && (
            <Alert tone="warning">
              {t('sign.errors.locked', {
                minutes: Math.max(
                  1,
                  Math.ceil((new Date(data.lockedUntil ?? '').getTime() - Date.now()) / 60000),
                ),
              })}
            </Alert>
          )}
          <Form
            form={form}
            schema={{
              fullName: v.pipe(v.string(), v.trim(), v.minLength(1, t('sign.required'))),
              phoneLast4: v.pipe(v.string(), v.regex(/^\d{4}$/, t('sign.digits'))),
            }}
          >
            <FormLayout>
              <FormSection title={t('sign.title')}>
                <FormGrid>
                  <FormField name="fullName" label={t('sign.fullName')} required>
                    <Input autoComplete="name" hint={t('sign.fullNameHint')} />
                  </FormField>
                  <FormField name="phoneLast4" label={t('sign.phoneLast4')} required>
                    <Input inputMode="numeric" maxLength={4} autoComplete="off" />
                  </FormField>
                </FormGrid>
                <Checkbox
                  label={t('sign.agree')}
                  checked={agree}
                  onCheckedChange={(checked) => setAgree(checked === true)}
                  disabled={!read}
                />
                <Button
                  variant="secondary"
                  onClick={() => setMethod(method === 'typed' ? 'drawn' : 'typed')}
                >
                  {t(method === 'typed' ? 'sign.useDrawn' : 'sign.useTyped')}
                </Button>
                {method === 'drawn' ? (
                  <SignaturePad
                    label={t('sign.signature')}
                    hint={t('sign.signatureHint')}
                    value={signature}
                    onChange={setSignature}
                  />
                ) : (
                  <p className="text-section italic">
                    {t('sign.typedPreview', { name: typedName })}
                  </p>
                )}
                <FormActions>
                  <Button
                    type="submit"
                    loading={sign.isPending}
                    disabled={!read || !agree || locked || (method === 'drawn' && !signature)}
                  >
                    {t('sign.submit')}
                  </Button>
                </FormActions>
              </FormSection>
            </FormLayout>
          </Form>
          <Button variant="danger" onClick={() => setRejecting(!rejecting)}>
            {t('reject.open')}
          </Button>
          {rejecting && (
            <Form
              form={rejection}
              schema={{ reason: v.pipe(v.string(), v.trim(), v.minLength(1, t('sign.required'))) }}
            >
              <FormLayout>
                <FormSection title={t('reject.title')}>
                  <FormGrid>
                    <FormField name="reason" label={t('reject.reason')} required>
                      <Input maxLength={1000} />
                    </FormField>
                  </FormGrid>
                  <FormActions>
                    <Button type="submit" loading={reject.isPending}>
                      {t('reject.submit')}
                    </Button>
                  </FormActions>
                </FormSection>
              </FormLayout>
            </Form>
          )}
        </>
      ) : (
        <p>
          {t(
            expired && data.awaitingMe
              ? 'detail.expired'
              : data.myStatus === 'signed' && !data.hasPdf
                ? 'detail.signedWaiting'
                : data.hasPdf
                  ? 'detail.completed'
                  : data.myStatus === 'rejected'
                    ? 'detail.rejected'
                    : 'detail.closed',
          )}
        </p>
      )}
      {data.hasPdf && (
        <a
          href={portalDocumentPdfPath(data.id)}
          download
          className="flex min-h-10 items-center gap-2 font-semibold text-accent"
        >
          <Icon name="download" className="size-4" aria-hidden />
          {t('detail.download')}
        </a>
      )}
      <FormSection title={t('detail.signers')}>
        <ul className="grid gap-2">
          {data.signers.map((signer, index) => (
            <li key={`${signer.role}-${index}`}>
              {signer.name} · {t(`detail.signerRole.${signer.role}`)} ·{' '}
              {t(`detail.signerStatus.${signer.status}`)}
              {signer.signedAt && ` · ${documentDateTime(signer.signedAt, i18n.language)}`}
            </li>
          ))}
        </ul>
      </FormSection>
    </div>
  );
}

export default function PortalDocumentPage() {
  const { id = '' } = useParams();
  const query = usePortalDocument(id);

  return (
    <PortalQuery query={query}>{(data) => <SigningDocument key={id} data={data} />}</PortalQuery>
  );
}
