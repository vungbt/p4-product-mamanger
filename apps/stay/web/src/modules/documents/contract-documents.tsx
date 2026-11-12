import {
  Button,
  DataTable,
  Form,
  FormActions,
  FormField,
  FormGrid,
  FormLayout,
  FormSection,
  Icon,
  Select,
  useAppForm,
} from '@itclabs/react-ui';
import {
  useContractDocuments,
  useContractTemplates,
  useCreateContractDocument,
} from '@stay/sdk/react';
import { getErrorMessage } from '@stay/sdk/shared';
import type { StayContract } from '@stay/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import * as v from 'valibot';
import { useCanOn } from '@/libraries/ability';
import { FilterBar } from '@/libraries/filter-bar';
import { FormError } from '@/libraries/forms/page-states';
import { Refreshing } from '@/libraries/list-table';
import { DocumentStatusTag, documentDate } from '@/modules/portal/documents-ui';

export const documentPath = (contractId: string, id: string) =>
  `/contracts/${contractId}/documents/${id}`;

export function ContractDocuments({ contract }: { contract: StayContract }) {
  const { t } = useTranslation('documents');
  const query = useContractDocuments(contract.id);
  const templates = useContractTemplates({ buildingId: contract.buildingId, kind: 'contract' });
  const create = useCreateContractDocument();
  const navigate = useNavigate();
  const canUpdate = useCanOn('update', 'Contract', { buildingId: contract.buildingId });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { templateId: '' },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        const result = await create.mutateAsync({ contractId: contract.id, body: value });

        navigate(documentPath(contract.id, result.id));
      } catch (cause) {
        setError(getErrorMessage(cause, t('failed')));
      }
    },
  });

  return (
    <div className="grid min-w-0 gap-4">
      <FilterBar
        actions={
          canUpdate && !['ended', 'cancelled'].includes(contract.status) ? (
            <Button onClick={() => setCreating(!creating)}>
              <Icon name="plus" className="size-4" aria-hidden />
              {t('newDocument')}
            </Button>
          ) : null
        }
      />
      {creating && (
        <Form
          form={form}
          schema={{ templateId: v.pipe(v.string(), v.minLength(1, t('required'))) }}
        >
          <FormLayout>
            <FormSection variant="card" title={t('newDocument')}>
              <FormGrid>
                <FormField name="templateId" label={t('chooseTemplate')} required>
                  <Select
                    options={(templates.data ?? [])
                      .filter((row) => row.active)
                      .map((row) => ({
                        value: row.id,
                        label: `${row.name} · v${row.activeVersion}`,
                      }))}
                  />
                </FormField>
              </FormGrid>
              {templates.isError && (
                <FormError message={getErrorMessage(templates.error, t('failed'))} />
              )}
            </FormSection>
            <FormActions>
              <Button type="submit" loading={create.isPending}>
                {t('newDocument')}
              </Button>
            </FormActions>
          </FormLayout>
        </Form>
      )}
      <FormError message={error} />
      <Refreshing active={query.isFetching && !query.isPending}>
        <DataTable
          caption={t('documents')}
          rows={query.data ?? []}
          rowId={(row) => row.id}
          loading={query.isPending}
          error={query.isError ? getErrorMessage(query.error, t('failed')) : undefined}
          onRetry={() => void query.refetch()}
          columns={[
            {
              id: 'code',
              header: t('code'),
              cell: ({ row }) => (
                <Link
                  className="font-semibold text-accent"
                  to={documentPath(contract.id, row.original.id)}
                >
                  {row.original.code} · {row.original.title}
                </Link>
              ),
            },
            {
              id: 'status',
              header: t('status'),
              cell: ({ row }) => <DocumentStatusTag status={row.original.status} />,
            },
            {
              id: 'createdAt',
              header: t('updated'),
              cell: ({ row }) => documentDate(row.original.updatedAt),
            },
          ]}
        />
      </Refreshing>
    </div>
  );
}
