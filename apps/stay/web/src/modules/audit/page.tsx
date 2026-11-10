import { Alert, Button, Form, FormField, Input, Select, useAppForm } from '@itclabs/react-ui';
import { useAuditLog, useAuditLogs } from '@stay/sdk/react';
import type { AuditListQuery } from '@stay/sdk/shared';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import * as v from 'valibot';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';

const filterFields = ['actorId', 'action', 'resourceType', 'resourceId', 'from', 'to'] as const;
const sortFields = ['createdAt', 'action', 'resourceType'] as const;
const recordRoutes: Record<string, string> = {
  building: '/buildings',
  room: '/rooms',
  tenant: '/tenants',
  contract: '/contracts',
  invoice: '/invoices',
  payment: '/payments',
  expense: '/expenses',
  maintenance: '/requests',
};

function AuditDetail({ id }: { id: string }) {
  const { t } = useTranslation();
  const detail = useAuditLog(id);

  if (detail.isPending) return <p role="status">{t('app.loading')}</p>;
  if (detail.isError)
    return (
      <Alert tone="danger">
        {t('errors.loadFailed')}{' '}
        <Button onClick={() => void detail.refetch()}>{t('errors.retry')}</Button>
      </Alert>
    );
  return (
    <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-panel bg-canvas p-3 text-ui-sm">
      {JSON.stringify(detail.data.changes, null, 2)}
    </pre>
  );
}

function Search({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);
  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => onChange(draft), 300);

    return () => clearTimeout(timer);
  }, [draft, value, onChange]);

  return (
    <Input
      label={t('audit.search')}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      type="search"
    />
  );
}

function Filters({
  params,
  apply,
}: {
  params: URLSearchParams;
  apply: (values: Record<string, string>) => void;
}) {
  const { t } = useTranslation();
  const form = useAppForm({
    defaultValues: Object.fromEntries(
      filterFields.map((field) => [field, params.get(field) ?? '']),
    ),
    onSubmit: ({ value }) => apply(value),
  });
  const schema = Object.fromEntries(filterFields.map((field) => [field, v.string()]));

  return (
    <Form form={form} schema={schema} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {filterFields.map((field) => (
        <FormField key={field} name={field} label={t(`audit.${field}`)} className="mb-0">
          <Input type={field === 'from' || field === 'to' ? 'date' : 'text'} />
        </FormField>
      ))}
      <div className="flex items-end gap-2">
        <Button type="submit">{t('audit.apply')}</Button>
        <Button
          variant="ghost"
          onClick={() => apply(Object.fromEntries(filterFields.map((field) => [field, ''])))}
        >
          {t('audit.clear')}
        </Button>
      </div>
    </Form>
  );
}

export default function AuditPage() {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const { buildingId, buildings, selectBuilding } = useActiveBuilding();
  const previousBuilding = useRef<string | null>(null);
  const page = Math.max(1, Number(params.get('page')) || 1);
  const sortBy = sortFields.find((field) => field === params.get('sortBy')) ?? 'createdAt';
  const query: AuditListQuery = {
    page,
    pageSize: 20,
    q: params.get('q') || undefined,
    sortBy,
    sortOrder: params.get('sortOrder') === 'asc' ? 'asc' : 'desc',
    ...Object.fromEntries(filterFields.map((field) => [field, params.get(field) || undefined])),
    buildingId: buildingId ?? undefined,
  };
  const logs = useAuditLogs(query);
  const selected = params.get('entry');

  const update = (values: Record<string, string>, resetPage = true) => {
    setParams((current) => {
      const next = new URLSearchParams(current);

      for (const [key, value] of Object.entries(values)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      if (resetPage) {
        next.delete('page');
        next.delete('entry');
      }
      return next;
    });
  };

  useEffect(() => {
    if (!buildingId) return;
    if (previousBuilding.current === null) {
      const requested = params.get('buildingId');

      if (requested && buildings.some(({ id }) => id === requested) && requested !== buildingId) {
        previousBuilding.current = requested;
        selectBuilding(requested);
        return;
      }
      previousBuilding.current = buildingId;
      if (requested === buildingId) return;
      setParams(
        (current) => {
          const next = new URLSearchParams(current);

          next.set('buildingId', buildingId);
          return next;
        },
        { replace: true },
      );
      return;
    }
    if (previousBuilding.current === buildingId) {
      const requested = params.get('buildingId');

      if (requested && requested !== buildingId && buildings.some(({ id }) => id === requested)) {
        previousBuilding.current = requested;
        selectBuilding(requested);
      }
      return;
    }
    previousBuilding.current = buildingId;
    setParams(
      (current) => {
        const next = new URLSearchParams(current);

        next.set('buildingId', buildingId);
        next.delete('page');
        next.delete('entry');
        return next;
      },
      { replace: true },
    );
  }, [buildingId, buildings, params, selectBuilding, setParams]);

  return (
    <section className="mx-auto w-full max-w-6xl space-y-5 p-4 lg:p-6">
      <h1 className="text-heading font-bold text-ink">{t('nav.audit')}</h1>
      <div className="space-y-4 rounded-panel border border-line bg-surface p-4">
        <Search value={params.get('q') ?? ''} onChange={(q) => update({ q })} />
        <Filters
          key={filterFields.map((field) => params.get(field)).join('|')}
          params={params}
          apply={update}
        />
        <div className="flex flex-wrap gap-3">
          <Select
            label={t('audit.sortBy')}
            value={sortBy}
            options={sortFields.map((field) => ({ value: field, label: t(`audit.${field}`) }))}
            onValueChange={(value) => {
              if (value) update({ sortBy: value });
            }}
            rootClassName="w-full sm:w-56"
            searchable={false}
          />
          <Button
            variant="secondary"
            onClick={() => update({ sortOrder: query.sortOrder === 'asc' ? 'desc' : 'asc' })}
          >
            {t(query.sortOrder === 'asc' ? 'audit.oldest' : 'audit.newest')}
          </Button>
        </div>
      </div>
      {logs.isPending ? (
        <p role="status">{t('app.loading')}</p>
      ) : logs.isError ? (
        <Alert tone="danger" role="alert">
          {t('errors.loadFailed')}{' '}
          <Button onClick={() => void logs.refetch()}>{t('errors.retry')}</Button>
        </Alert>
      ) : (
        <>
          {logs.data.data.length === 0 ? (
            <p role="status" className="p-6 text-center text-muted">
              {t('audit.empty')}
            </p>
          ) : (
            <ol className="space-y-4 border-l border-line pl-4" aria-label={t('nav.audit')}>
              {logs.data.data.map((entry) => {
                const route = recordRoutes[entry.resourceType];
                const date = new Date(entry.createdAt);

                return (
                  <li
                    key={entry.id}
                    className="min-w-0 rounded-panel border border-line bg-surface p-4"
                  >
                    <time dateTime={entry.createdAt} className="text-ui-sm text-muted">
                      {new Intl.DateTimeFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Asia/Ho_Chi_Minh',
                      }).format(date)}
                    </time>
                    <p className="mt-2 break-words text-ink">
                      <span className="font-semibold">
                        {entry.actorName ?? entry.actorId ?? t('audit.system')}
                      </span>{' '}
                      · {entry.action} · {entry.resourceType}
                    </p>
                    <p className="mt-1 break-all">
                      {route ? (
                        <Link
                          className="text-accent underline"
                          to={`${route}/${encodeURIComponent(entry.resourceId)}`}
                        >
                          {entry.resourceId}
                        </Link>
                      ) : (
                        entry.resourceId
                      )}
                    </p>
                    <p className="mt-1 text-ui-sm text-muted">{t(`audit.${entry.outcome}`)}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-expanded={selected === entry.id}
                      onClick={() =>
                        update({ entry: selected === entry.id ? '' : entry.id }, false)
                      }
                    >
                      {t(selected === entry.id ? 'audit.close' : 'audit.details')}
                    </Button>
                    {selected === entry.id && <AuditDetail id={entry.id} />}
                  </li>
                );
              })}
            </ol>
          )}
          <nav
            aria-label={t('audit.pagination')}
            className="flex flex-wrap items-center justify-between gap-2"
          >
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => update({ page: String(page - 1), entry: '' }, false)}
            >
              {t('audit.previous')}
            </Button>
            <span className="text-ui-sm">
              {t('audit.page', { page, total: logs.data.meta.totalPages })}
            </span>
            <Button
              variant="secondary"
              disabled={page >= logs.data.meta.totalPages}
              onClick={() => update({ page: String(page + 1), entry: '' }, false)}
            >
              {t('audit.next')}
            </Button>
          </nav>
        </>
      )}
    </section>
  );
}
