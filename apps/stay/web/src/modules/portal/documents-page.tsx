import { EmptyState, Tag } from '@itclabs/react-ui';
import { usePortalDocuments } from '@stay/sdk/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DocumentStatusTag, documentDate, portalDocumentPaths } from './documents-ui';
import { PortalQuery } from './portal-ui';

/** T-13 `/p/documents`: documents of the contract, the ones waiting for my signature first. */
export default function PortalDocumentsPage() {
  const { t } = useTranslation('portalDocuments');
  const documents = usePortalDocuments();

  return (
    <>
      <h1 className="text-heading font-bold">{t('list.title')}</h1>
      <PortalQuery query={documents}>
        {(rows) =>
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
      </PortalQuery>
    </>
  );
}
