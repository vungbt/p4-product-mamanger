import {
  Alert,
  Button,
  type ColumnDef,
  DataTable,
  EmptyState,
  Input,
  Pagination,
  Select,
} from '@itclabs/react-ui';
import { useTenants } from '@stay/sdk/react';
import type { components } from '@stay/sdk/shared';
import { getErrorMessage } from '@stay/sdk/shared';
import { TENANT_STATUS_FILTERS, type TenantStatusFilter } from '@stay/shared';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCanOpen } from '@/libraries/ability';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { latestSearchParams } from '@/libraries/search-params';
import { PageSpinner } from '@/routing/route-guards';
import { ContactLinks, formatPhone, TenantStatusTag } from './tenant-ui';

type Tenant = components['schemas']['StayTenant'];

const PAGE_SIZE = 20;

function parseStatus(value: string | null): TenantStatusFilter {
  return TENANT_STATUS_FILTERS.find((status) => status === value) ?? 'all';
}

/** O-11: tenants of the active building; search, status filter and page live in the URL. */
export default function TenantListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { buildingId, isLoading: buildingLoading } = useActiveBuilding();
  const [params, setParams] = useSearchParams();
  const canCreate = useCanOpen({ action: 'create', subject: 'Tenant' });
  const canImport = useCanOpen({ action: 'manage', subject: 'Tenant' });

  const q = params.get('q') ?? '';
  const status = parseStatus(params.get('status'));
  const page = Math.max(1, Number(params.get('page')) || 1);
  const [search, setSearch] = useState(q);

  const tenants = useTenants({
    buildingId: buildingId ?? undefined,
    q: q || undefined,
    status,
    page,
    pageSize: PAGE_SIZE,
  });

  const rows = tenants.data?.data ?? [];
  const meta = tenants.data?.meta;

  const update = (changes: Record<string, string | null>) => {
    setParams(
      () => {
        const next = latestSearchParams();

        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace: true },
    );
  };

  // Debounced search (300 ms) that also resets the page.
  useEffect(() => {
    const timer = setTimeout(() => {
      const value = search.trim();

      if (value !== q)
        setParams(
          () => {
            const next = latestSearchParams();

            if (value) next.set('q', value);
            else next.delete('q');
            next.delete('page');
            return next;
          },
          { replace: true },
        );
    }, 300);

    return () => clearTimeout(timer);
  }, [search, q, setParams]);

  const statusOptions = useMemo(
    () =>
      TENANT_STATUS_FILTERS.map((value) => ({
        value,
        label: t(`tenants.filter.${value}`),
      })),
    [t],
  );

  const columns = useMemo<ColumnDef<Tenant, unknown>[]>(
    () => [
      {
        id: 'fullName',
        header: t('tenants.fields.fullName'),
        cell: ({ row }) => (
          <Link to={`/tenants/${row.original.id}`} className="font-semibold text-accent">
            {row.original.fullName}
          </Link>
        ),
      },
      {
        id: 'phone',
        header: t('tenants.fields.phone'),
        cell: ({ row }) => (
          <a href={`tel:${row.original.phone}`} className="text-ink">
            {formatPhone(row.original.phone)}
          </a>
        ),
      },
      {
        id: 'room',
        header: t('tenants.fields.room'),
        cell: ({ row }) => row.original.currentRoom?.code ?? '—',
      },
      {
        id: 'status',
        header: t('tenants.fields.status'),
        cell: ({ row }) => (
          <TenantStatusTag
            status={row.original.status}
            archived={Boolean(row.original.archivedAt)}
          />
        ),
      },
      {
        id: 'residence',
        header: t('tenants.fields.residenceDeclared'),
        cell: ({ row }) =>
          row.original.residenceDeclared === null
            ? '—'
            : t(row.original.residenceDeclared ? 'tenants.yes' : 'tenants.no'),
      },
    ],
    [t],
  );

  if (buildingLoading) return <PageSpinner />;

  const filtered = Boolean(q) || status !== 'all';

  const empty = (
    <EmptyState
      icon="users"
      size="compact"
      variant={filtered ? 'no-results' : 'empty'}
      title={filtered ? t('tenants.list.noResults') : t('tenants.list.empty')}
      description={filtered ? undefined : t('tenants.list.emptyDescription')}
      action={
        !filtered && canCreate ? (
          <Button onClick={() => navigate('/tenants/new')}>{t('tenants.add')}</Button>
        ) : undefined
      }
    />
  );

  return (
    <div className="grid gap-5" data-testid="tenant-list-page">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-heading font-bold text-ink">{t('nav.tenants')}</h1>
        <div className="flex flex-wrap gap-2">
          {canImport ? (
            <Button variant="secondary" onClick={() => navigate('/tenants/import')}>
              {t('tenants.importAction')}
            </Button>
          ) : null}
          {canCreate ? (
            <Button onClick={() => navigate('/tenants/new')}>{t('tenants.add')}</Button>
          ) : null}
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-[1fr_14rem]">
        <Input
          type="search"
          icon="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('tenants.list.searchPlaceholder')}
          aria-label={t('tenants.list.search')}
        />
        <Select
          aria-label={t('tenants.fields.status')}
          options={statusOptions}
          value={status}
          onValueChange={(value) =>
            update({ status: value && value !== 'all' ? value : null, page: null })
          }
          data-testid="tenant-status-filter"
        />
      </div>

      {tenants.isError && !tenants.data ? (
        <Alert
          tone="danger"
          title={t('errors.loadFailed')}
          action={
            <Button variant="secondary" size="sm" onClick={() => void tenants.refetch()}>
              {t('errors.retry')}
            </Button>
          }
        >
          {getErrorMessage(tenants.error, t('errors.loadFailed'))}
        </Alert>
      ) : (
        <>
          <div className="hidden md:block">
            <DataTable
              caption={t('nav.tenants')}
              mode="server"
              rows={rows}
              rowCount={meta?.total ?? 0}
              columns={columns}
              rowId={(row) => row.id}
              loading={tenants.isPending}
              emptyState={empty}
              paginationPlacement="none"
              state={{ sorting: [], pagination: { pageIndex: page - 1, pageSize: PAGE_SIZE } }}
              onStateChange={(next) =>
                update({
                  page:
                    next.pagination.pageIndex > 0 ? String(next.pagination.pageIndex + 1) : null,
                })
              }
              data-testid="tenant-table"
            />
          </div>

          <ul className="grid gap-3 md:hidden" data-testid="tenant-cards">
            {tenants.isPending ? (
              <li>
                <PageSpinner />
              </li>
            ) : rows.length === 0 ? (
              <li>{empty}</li>
            ) : (
              rows.map((tenant) => (
                <li
                  key={tenant.id}
                  className="flex items-center gap-3 rounded-panel border border-line bg-surface p-4"
                >
                  <div className="grid min-w-0 flex-1 gap-1">
                    <Link
                      to={`/tenants/${tenant.id}`}
                      className="truncate font-semibold text-accent"
                    >
                      {tenant.fullName}
                    </Link>
                    <span className="text-ui-sm text-muted">
                      {formatPhone(tenant.phone)} · {t('tenants.fields.room')}:{' '}
                      {tenant.currentRoom?.code ?? '—'}
                    </span>
                    <span>
                      <TenantStatusTag
                        status={tenant.status}
                        archived={Boolean(tenant.archivedAt)}
                      />
                    </span>
                  </div>
                  <ContactLinks phone={tenant.phone} name={tenant.fullName} />
                </li>
              ))
            )}
          </ul>

          {meta && meta.totalPages > 1 ? (
            <Pagination
              pageIndex={page - 1}
              pageCount={meta.totalPages}
              onPageChange={(index) => update({ page: index > 0 ? String(index + 1) : null })}
              aria-label={t('tenants.list.pagination')}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
