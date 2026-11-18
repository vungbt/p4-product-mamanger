import { Button, type ColumnDef, DataTable, Icon, IconButton, Input } from '@itclabs/react-ui';
import {
  useContractTemplates,
  useCreateContractTemplate,
  useUpdateContractTemplate,
} from '@stay/sdk/react';
import { getErrorMessage } from '@stay/sdk/shared';
import type { ContractTemplateSummary } from '@stay/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { FilterBar } from '@/libraries/filter-bar';
import { FormError } from '@/libraries/forms/page-states';
import { Refreshing } from '@/libraries/list-table';
import { ScreenHeader } from '@/libraries/screen-header';
import { documentDate } from '@/modules/portal/documents-ui';

export const templatePath = (id: string) => `/settings/contract-templates/${id}`;

export default function TemplatesPage() {
  const { t } = useTranslation('documents');
  const { buildingId } = useActiveBuilding();
  const query = useContractTemplates({ buildingId: buildingId ?? undefined, kind: 'contract' });
  const create = useCreateContractTemplate();
  const update = useUpdateContractTemplate();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const add = async (source: 'default' | 'blank' | 'copy', row?: ContractTemplateSummary) => {
    setError(null);
    try {
      const result = await create.mutateAsync({
        source,
        kind: 'contract',
        buildingId: buildingId ?? undefined,
        name: source === 'blank' ? t('blank') : row ? `${row.name} (${t('copy')})` : undefined,
        copyFromId: row?.id,
      });

      navigate(templatePath(result.id));
    } catch (cause) {
      setError(getErrorMessage(cause, t('failed')));
    }
  };

  const columns: ColumnDef<ContractTemplateSummary, unknown>[] = [
    {
      id: 'name',
      header: t('name'),
      cell: ({ row: { original: row } }) => (
        <Link to={templatePath(row.id)} className="font-semibold text-accent">
          {row.name}
        </Link>
      ),
    },
    {
      id: 'building',
      header: t('building'),
      cell: ({ row }) => row.original.buildingName ?? t('shared'),
    },
    { accessorKey: 'activeVersion', header: t('version') },
    {
      id: 'updated',
      header: t('updated'),
      cell: ({ row }) => documentDate(row.original.updatedAt),
    },
    { accessorKey: 'documentCount', header: t('used') },
    {
      id: 'active',
      header: t('status'),
      cell: ({ row }) => t(row.original.active ? 'active' : 'inactive'),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row: { original: row } }) => (
        <div className="flex gap-1">
          <IconButton
            icon="edit"
            label={`${t('template')} ${row.name}`}
            onClick={() => navigate(templatePath(row.id))}
          />
          <IconButton
            icon="copy"
            label={`${t('copy')} ${row.name}`}
            disabled={create.isPending}
            onClick={() => void add('copy', row)}
          />
          <IconButton
            icon="archive"
            label={`${t(row.active ? 'disable' : 'enable')} ${row.name}`}
            disabled={update.isPending}
            onClick={async () => {
              try {
                await update.mutateAsync({
                  id: row.id,
                  body: { name: row.name, active: !row.active, version: row.version },
                });
              } catch (cause) {
                setError(getErrorMessage(cause, t('failed')));
              }
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="grid min-w-0 gap-5">
      <ScreenHeader title={t('templates')} />
      <FilterBar
        actions={
          <>
            <Button
              variant="secondary"
              disabled={create.isPending}
              onClick={() => void add('blank')}
            >
              <Icon name="plus" className="size-4" aria-hidden />
              {t('blank')}
            </Button>
            <Button loading={create.isPending} onClick={() => void add('default')}>
              <Icon name="plus" className="size-4" aria-hidden />
              {t('default')}
            </Button>
          </>
        }
      >
        <Input
          label={t('search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </FilterBar>
      <FormError message={error} />
      <Refreshing active={query.isFetching && !query.isPending}>
        <DataTable
          caption={t('templates')}
          rows={(query.data ?? []).filter((row) =>
            row.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
          )}
          columns={columns}
          rowId={(row) => row.id}
          loading={query.isPending}
          error={query.isError ? getErrorMessage(query.error, t('failed')) : undefined}
          onRetry={() => void query.refetch()}
        />
      </Refreshing>
    </div>
  );
}
