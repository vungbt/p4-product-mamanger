import { EmptyState, Select, Tag, useDataTable } from '@itclabs/react-ui';
import { usePortalDocuments } from '@stay/sdk/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FilterBar } from '@/libraries/filter-bar';
import { ListTable } from '@/libraries/list-table';
import { DocumentStatusTag, documentDate, portalDocumentPaths } from './documents-ui';
import { PortalQuery } from './portal-ui';

/** T-13 `/p/documents`: documents of the contract, the ones waiting for my signature first. */
export default function PortalDocumentsPage() {
  const { t } = useTranslation('portalDocuments');
  const documents = usePortalDocuments();
  const [filter, setFilter] = useState('all');

  const rows = (documents.data ?? []).filter((row) => filter !== 'awaiting' || row.awaitingMe);
  const table = useDataTable({
    caption: t('list.title'),
    rows,
    columns: [
      {
        id: 'title',
        header: t('detail.code'),
        cell: ({ row }) => (
          <Link
            className="font-semibold text-accent"
            to={portalDocumentPaths.detail(row.original.id)}
          >
            {row.original.title} · {row.original.code}
          </Link>
        ),
      },
      { id: 'kind', header: t('verify.kind'), cell: ({ row }) => t(`kind.${row.original.kind}`) },
      {
        id: 'status',
        header: t('verify.status'),
        cell: ({ row }) =>
          row.original.awaitingMe ? (
            <Tag tone="brand">{t('list.awaiting')}</Tag>
          ) : (
            <DocumentStatusTag status={row.original.status} />
          ),
      },
    ],
    rowId: (row) => row.id,
    loading: documents.isPending,
    emptyText: t('list.empty'),
  });

  return (
    <>
      <h1 className="text-heading font-bold">{t('list.title')}</h1>
      <FilterBar>
        <Select
          label={t('verify.status')}
          value={filter}
          onValueChange={(value) => setFilter(value ?? 'all')}
          options={[
            { value: 'all', label: t('list.title') },
            { value: 'awaiting', label: t('list.awaiting') },
          ]}
        />
      </FilterBar>
      <PortalQuery query={documents}>
        {() => (
          <ListTable
            controller={table}
            refreshing={documents.isFetching && !documents.isPending}
            cards={(rows) =>
              rows.length === 0 ? (
                <EmptyState title={t('list.empty')} />
              ) : (
                <ul className="grid gap-3" aria-label={t('list.title')}>
                  {rows.map((document) => (
                    <li key={document.id}>
                      <Link
                        to={portalDocumentPaths.detail(document.id)}
                        aria-label={t('list.open', { code: document.code })}
                        className="grid min-w-0 gap-2 rounded-panel border border-line bg-surface p-4 hover:border-accent"
                        data-testid="portal-document-row"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold break-words">{document.title}</span>
                          {document.awaitingMe ? (
                            <Tag tone="brand" size="sm">
                              {t('list.awaiting')}
                            </Tag>
                          ) : (
                            <DocumentStatusTag status={document.status} />
                          )}
                        </div>
                        <span className="text-ui-sm text-muted">
                          {t(`kind.${document.kind}`)} · {document.code}
                        </span>
                        <span className="text-ui-sm text-muted">
                          {document.completedAt
                            ? t('list.completedOn', { date: documentDate(document.completedAt) })
                            : document.sentAt
                              ? t('list.sentOn', { date: documentDate(document.sentAt) })
                              : null}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )
            }
          />
        )}
      </PortalQuery>
    </>
  );
}
