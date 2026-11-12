import {
  Alert,
  Button,
  Form,
  FormActions,
  FormField,
  FormGrid,
  FormLayout,
  FormSection,
  Icon,
  Input,
  Select,
  Skeleton,
  useAppForm,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import {
  useContracts,
  useContractTemplate,
  useContractTemplateVersion,
  useImportDocx,
  usePreviewContractTemplate,
  useSaveContractTemplateVersion,
  useTemplateVariables,
  useUpdateContractTemplate,
} from '@stay/sdk/react';
import { getErrorMessage } from '@stay/sdk/shared';
import { type ContractTemplateDetail, unknownTemplateVariables } from '@stay/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import * as v from 'valibot';
import { DocumentBody } from '@/libraries/document-body';
import { FormError, LoadError } from '@/libraries/forms/page-states';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { useFormDirty } from '@/libraries/forms/use-form-value';
import { ScreenHeader } from '@/libraries/screen-header';
import { useIsDesktop } from '@/libraries/use-media-query';
import { DocumentEditor } from './editor';

function TemplateForm({ template }: { template: ContractTemplateDetail }) {
  const { t } = useTranslation('documents');
  const variables = useTemplateVariables();
  const contracts = useContracts({ buildingId: template.buildingId ?? undefined, pageSize: 100 });
  const save = useSaveContractTemplateVersion();
  const rename = useUpdateContractTemplate();
  const preview = usePreviewContractTemplate();
  const importWord = useImportDocx();
  const desktop = useIsDesktop();
  const [body, setBody] = useState(template.bodyHtml);
  const [savedBody, setSavedBody] = useState(template.bodyHtml);
  const [current, setCurrent] = useState(template);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [contractId, setContractId] = useState('');
  const [versionId, setVersionId] = useState<string | null>(null);
  const [insert, setInsert] = useState<{ text: string; sequence: number }>();
  const old = useContractTemplateVersion(versionId);

  const importForm = useAppForm({ defaultValues: { uploadFiles: [] as File[] } });

  const form = useAppForm({
    defaultValues: {
      name: template.name,
      note: '',
    },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        let latest = current;

        if (value.name !== current.name)
          latest = await rename.mutateAsync({
            id: current.id,
            body: { name: value.name, active: current.active, version: current.version },
          });
        setCurrent(latest);
        const result = await save.mutateAsync({
          id: current.id,
          body: { bodyHtml: body, note: value.note || undefined, version: latest.version },
        });

        setCurrent(result);
        setBody(result.bodyHtml);
        setSavedBody(result.bodyHtml);
        form.reset({ name: result.name, note: '' });
        toast.success(t('saved'));
      } catch (cause) {
        setError(getErrorMessage(cause, t('failed')));
      }
    },
  });
  const dirty = useFormDirty(form);
  const { prompt } = useUnsavedChanges(dirty || body !== savedBody);
  const unknown = unknownTemplateVariables(body);

  return (
    <Form
      form={form}
      schema={{ name: v.pipe(v.string(), v.trim(), v.minLength(1, t('required'))) }}
    >
      <FormLayout>
        {prompt}
        <FormError message={error} />
        {!desktop && <Alert tone="info">{t('mobile')}</Alert>}
        <FormSection variant="card" title={t('template')}>
          <FormGrid>
            <FormField name="name" label={t('name')} required>
              <Input disabled={!desktop} maxLength={160} />
            </FormField>
            <FormField name="note" label={t('note')}>
              <Input disabled={!desktop} maxLength={500} />
            </FormField>
          </FormGrid>
          {desktop && (
            <importForm.AppField
              name="uploadFiles"
              listeners={{
                onChange: ({ value: files }) => {
                  void (async (files) => {
                    const file = files[0];

                    if (!file) return;
                    if (file.size > 5_242_880) {
                      setError(t('fileTooLarge'));
                      return;
                    }
                    try {
                      const result = await importWord.mutateAsync(file);

                      setBody(result.bodyHtml);
                      setNotice(
                        [t('importHint', { count: result.blanks }), ...result.warnings].join(' '),
                      );
                    } catch (cause) {
                      setError(getErrorMessage(cause, t('failed')));
                    }
                  })(files);
                },
              }}
            >
              {(field) => (
                <field.UploadField
                  label={t('import')}
                  accept=".docx"
                  disabled={importWord.isPending}
                  maxBytes={5242880}
                />
              )}
            </importForm.AppField>
          )}
          {notice && <Alert tone="warning">{notice}</Alert>}
          {unknown.length > 0 && (
            <Alert tone="danger">
              {t('unknown')}: {unknown.join(', ')}
            </Alert>
          )}
          <FormGrid columns={3}>
            <div className="min-w-0 lg:col-span-2">
              <DocumentEditor value={body} onChange={setBody} insert={insert} readOnly={!desktop} />
            </div>
            {desktop && (
              <aside className="grid max-h-96 gap-2 overflow-y-auto" aria-label={t('variables')}>
                {variables.data?.map((variable) => (
                  <Button
                    key={variable.key}
                    variant="ghost"
                    className="h-auto justify-start whitespace-normal text-left"
                    onClick={() =>
                      setInsert({
                        text: `{{${variable.key}}}`,
                        sequence: (insert?.sequence ?? 0) + 1,
                      })
                    }
                  >
                    <span>
                      <strong>
                        {variable.group} · {variable.label}
                      </strong>
                      <br />
                      <span className="text-ui-sm text-muted">
                        {variable.description} · {variable.example}
                      </span>
                      <br />
                      <code>{`{{${variable.key}}}`}</code>
                    </span>
                  </Button>
                ))}
                {variables.isError && (
                  <LoadError error={variables.error} onRetry={() => void variables.refetch()} />
                )}
              </aside>
            )}
          </FormGrid>
        </FormSection>
        <FormSection variant="card" title={t('preview')}>
          <Select
            label={t('contract')}
            value={contractId}
            onValueChange={(value) => setContractId(value ?? '')}
            options={[
              { value: '', label: t('sample') },
              ...(contracts.data?.data ?? []).map((row) => ({
                value: row.id,
                label: `${row.code} · ${row.roomCode}`,
              })),
            ]}
          />
          <FormActions>
            <Button
              variant="secondary"
              loading={preview.isPending}
              onClick={async () => {
                try {
                  await preview.mutateAsync({
                    id: current.id,
                    body: { bodyHtml: body, contractId: contractId || undefined },
                  });
                } catch (cause) {
                  setError(getErrorMessage(cause, t('failed')));
                }
              }}
            >
              <Icon name="view" className="size-4" aria-hidden />
              {t('preview')}
            </Button>
          </FormActions>
          {preview.data && (
            <>
              <Alert tone={preview.data.missing.length ? 'warning' : 'info'}>
                {t('missing')}: {preview.data.missing.join(', ') || '—'}
              </Alert>
              <DocumentBody
                html={preview.data.html}
                className="mx-auto w-full max-w-3xl border border-line bg-surface p-5 sm:p-8"
              />
            </>
          )}
        </FormSection>
        <FormSection variant="card" title={t('history')}>
          <Select
            label={t('readVersion')}
            value={versionId ?? ''}
            onValueChange={(value) => setVersionId(value || null)}
            options={current.versions.map((version) => ({
              value: version.id,
              label: `v${version.version} · ${version.note ?? version.createdAt}`,
            }))}
          />
          {old.data && (
            <>
              <DocumentBody html={old.data.bodyHtml} />
              {desktop && (
                <Button
                  variant="secondary"
                  loading={save.isPending}
                  onClick={async () => {
                    setError(null);
                    try {
                      const restored = await save.mutateAsync({
                        id: current.id,
                        body: {
                          bodyHtml: old.data.bodyHtml,
                          note: t('restore'),
                          version: current.version,
                        },
                      });

                      setCurrent(restored);
                      setBody(restored.bodyHtml);
                      setSavedBody(restored.bodyHtml);
                      setVersionId(null);
                      form.reset({ name: restored.name, note: '' });
                      toast.success(t('saved'));
                    } catch (cause) {
                      setError(getErrorMessage(cause, t('failed')));
                    }
                  }}
                >
                  {t('restore')}
                </Button>
              )}
            </>
          )}
        </FormSection>
        {desktop && (
          <FormActions>
            <Button
              type="submit"
              loading={save.isPending || rename.isPending}
              disabled={unknown.length > 0}
            >
              {t('save')}
            </Button>
          </FormActions>
        )}
      </FormLayout>
    </Form>
  );
}

export default function TemplatePage() {
  const { id = '' } = useParams();
  const { t } = useTranslation('documents');
  const query = useContractTemplate(id);

  return (
    <div className="grid gap-5">
      <ScreenHeader title={t('template')} />
      {query.isPending ? (
        <Skeleton className="h-64" />
      ) : query.data ? (
        <TemplateForm key={id} template={query.data} />
      ) : (
        <LoadError error={query.error} onRetry={() => void query.refetch()} />
      )}
    </div>
  );
}
