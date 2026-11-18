import { Alert, Button, Form, FormField, Input, useAppForm } from '@itclabs/react-ui';
import { useStaySdk } from '@stay/sdk/react';
import { ApiSdkError, getErrorMessage, unwrap } from '@stay/sdk/shared';
import type { DocumentFileCheck, DocumentVerification } from '@stay/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import * as v from 'valibot';
import { useGenericDocumentMeta } from '@/libraries/document-meta';
import { FormActions, FormGrid, FormLayout, FormSection } from '@/libraries/forms/layout';
import { FormError } from '@/libraries/forms/page-states';
import { DocumentStatusTag } from '@/modules/portal/documents-ui';

/** P-01 exposes status and integrity only; the public endpoint returns no personal content. */
export default function VerifyDocumentPage() {
  const { code = '' } = useParams();
  const { t } = useTranslation('portalDocuments');
  const sdk = useStaySdk();
  const [result, setResult] = useState<DocumentVerification | null>(null);
  const [check, setCheck] = useState<DocumentFileCheck | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);

  useGenericDocumentMeta(t('verify.title'));

  const form = useAppForm({
    defaultValues: { code },
    onSubmit: async ({ value }) => {
      setError(null);
      setResult(null);
      setCheck(null);
      try {
        setResult(
          unwrap(
            await sdk.GET('/api/public/documents/verify/{code}', {
              params: { path: { code: value.code.trim() } },
            }),
          ).data,
        );
      } catch (cause) {
        setError(
          cause instanceof ApiSdkError && cause.status === 404
            ? t('verify.notFound')
            : getErrorMessage(cause, t('verify.error')),
        );
      }
    },
  });

  return (
    <main className="min-h-dvh bg-canvas p-4 sm:p-8">
      <div className="mx-auto grid max-w-3xl gap-5">
        <h1 className="text-heading font-bold">{t('verify.title')}</h1>
        <p>{t('verify.intro')}</p>
        <Form
          form={form}
          schema={{ code: v.pipe(v.string(), v.trim(), v.minLength(1, t('sign.required'))) }}
        >
          <FormLayout>
            <FormSection title={t('verify.title')}>
              <FormGrid>
                <FormField name="code" label={t('verify.code')} required>
                  <Input autoComplete="off" />
                </FormField>
              </FormGrid>
              <FormActions>
                <Button type="submit">{t('verify.check')}</Button>
              </FormActions>
            </FormSection>
          </FormLayout>
        </Form>
        <FormError message={error} />
        {result && (
          <>
            <FormSection title={result.code}>
              <DocumentStatusTag status={result.status} />
              <p>
                {t('verify.building')}: {result.buildingName}
              </p>
              <p>
                {t('verify.kind')}: {t(`kind.${result.kind}`)}
              </p>
              <p>
                {t('verify.signedCount', { signed: result.signedCount, total: result.signerCount })}
              </p>
              {result.pdfSha256 && <p className="break-all">SHA-256: {result.pdfSha256}</p>}
            </FormSection>
            {result.pdfSha256 ? (
              <FormSection title={t('verify.fileTitle')}>
                <p>{t('verify.fileHint')}</p>
                <Input
                  type="file"
                  label={t('verify.file')}
                  accept="application/pdf"
                  onChange={(event) => {
                    setFile(event.target.files?.[0] ?? null);
                    setCheck(null);
                  }}
                />
                <FormActions>
                  <Button
                    disabled={!file}
                    loading={comparing}
                    onClick={async () => {
                      if (!file) return;
                      if (file.size > 10_485_760) {
                        setError(t('verify.error'));
                        return;
                      }
                      setComparing(true);
                      setError(null);
                      setCheck(null);
                      try {
                        const body = new FormData();

                        body.append('file', file);
                        setCheck(
                          unwrap(
                            await sdk.POST('/api/public/documents/verify/{code}', {
                              params: { path: { code: result.code } },
                              body: { file: '' },
                              bodySerializer: () => body,
                            }),
                          ).data,
                        );
                      } catch (cause) {
                        setError(getErrorMessage(cause, t('verify.error')));
                      } finally {
                        setComparing(false);
                      }
                    }}
                  >
                    {t('verify.compare')}
                  </Button>
                </FormActions>
                {check && (
                  <Alert tone={check.matches ? 'success' : 'danger'}>
                    {t(check.matches ? 'verify.match' : 'verify.mismatch')}
                  </Alert>
                )}
              </FormSection>
            ) : (
              <p>{t('verify.noPdf')}</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
