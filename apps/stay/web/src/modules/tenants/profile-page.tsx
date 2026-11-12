import { Alert, AlertDialog, Button, EmptyState, Icon, Tag } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useArchiveTenant, useRevealTenantIdNumber, useTenant } from '@stay/sdk/react';
import { ApiSdkError, type components, getErrorMessage } from '@stay/sdk/shared';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCanOn } from '@/libraries/ability';
import { PageSpinner } from '@/routing/route-guards';
import { ContactLinks, formatDate, formatPhone, TenantStatusTag } from './tenant-ui';
import { VehiclesSection } from './vehicles-section';

type TenantDetail = components['schemas']['StayTenantDetail'];

function Panel({ title, id, children }: { title: string; id: string; children: ReactNode }) {
  return (
    <section
      aria-labelledby={id}
      className="grid gap-3 rounded-panel border border-line bg-surface p-4 sm:p-5"
    >
      <h2 id={id} className="text-section font-semibold text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

function InfoList({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="grid min-w-0 gap-0.5">
          <dt className="text-ui-sm text-muted">{label}</dt>
          <dd className="break-words text-ink">{value || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

/** CCCD masked in the middle; "Hiện" asks the API (audited) and keeps it in this component only. */
function IdNumberBlock({ tenant }: { tenant: TenantDetail }) {
  const { t } = useTranslation();
  const reveal = useRevealTenantIdNumber();
  const [full, setFull] = useState<string | null>(null);

  const front = tenant.documents.find((document) => document.kind === 'id_front');
  const back = tenant.documents.find((document) => document.kind === 'id_back');

  const show = async () => {
    try {
      const result = await reveal.mutateAsync(tenant.id);

      setFull(result.idNumber);
    } catch (error) {
      toast.error(getErrorMessage(error, t('errors.loadFailed')));
    }
  };

  const image = (document: typeof front, label: string) => (
    <figure className="grid gap-1">
      {document?.url ? (
        <img
          src={document.url}
          alt={label}
          className="aspect-[3/2] w-full rounded-control border border-line object-cover"
        />
      ) : (
        <div className="flex aspect-[3/2] w-full items-center justify-center rounded-control border border-dashed border-line text-ui-sm text-muted">
          {t('tenants.documents.none')}
        </div>
      )}
      <figcaption className="text-ui-sm text-muted">{label}</figcaption>
    </figure>
  );

  return (
    <Panel id="id-number-title" title={t('tenants.documents.title')}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-ink" data-testid="tenant-id-number">
          {tenant.idNumberMasked ? (full ?? tenant.idNumberMasked) : t('tenants.documents.noId')}
        </span>
        {tenant.idNumberMasked ? (
          full ? (
            <Button variant="ghost" size="sm" onClick={() => setFull(null)}>
              {t('tenants.documents.hide')}
            </Button>
          ) : (
            <Button variant="secondary" size="sm" loading={reveal.isPending} onClick={show}>
              {t('tenants.documents.show')}
            </Button>
          )
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {image(front, t('tenants.documents.front'))}
        {image(back, t('tenants.documents.back'))}
      </div>
    </Panel>
  );
}

/** O-12: personal info, CCCD, vehicles, contracts and portal access of one tenant. */
export default function TenantProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const tenant = useTenant(id);
  const archive = useArchiveTenant();

  const data = tenant.data;
  const canUpdate = useCanOn('update', 'Tenant', { buildingId: data?.buildingId });
  const canArchive = useCanOn('delete', 'Tenant', { buildingId: data?.buildingId });

  if (tenant.isPending) return <PageSpinner />;

  if (!data) {
    if (tenant.error instanceof ApiSdkError && tenant.error.status === 404)
      return (
        <EmptyState
          variant="not-found"
          headingLevel={1}
          title={t('tenants.profile.notFound')}
          action={<Button onClick={() => navigate('/tenants')}>{t('tenants.backToList')}</Button>}
        />
      );

    return (
      <Alert
        tone="danger"
        title={t('errors.loadFailed')}
        action={
          <Button variant="secondary" size="sm" onClick={() => void tenant.refetch()}>
            {t('errors.retry')}
          </Button>
        }
      >
        {getErrorMessage(tenant.error, t('errors.loadFailed'))}
      </Alert>
    );
  }

  const active = !data.archivedAt;

  const archiveTenant = async () => {
    try {
      await archive.mutateAsync(data.id);
      toast.success(t('tenants.profile.archived'));
    } catch (error) {
      toast.error(getErrorMessage(error, t('errors.saveFailed')));
    }
  };

  return (
    <div className="grid gap-5" data-testid="tenant-profile">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <h1 className="text-heading font-bold text-ink">{data.fullName}</h1>
          <div className="flex flex-wrap items-center gap-2 text-ui-sm text-muted">
            <TenantStatusTag status={data.status} archived={!active} />
            <span>{formatPhone(data.phone)}</span>
            {data.currentRoom ? (
              <Tag size="sm" tone="brand">
                {t('tenants.fields.room')} {data.currentRoom.code}
              </Tag>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ContactLinks phone={data.phone} name={data.fullName} />
          {active && canArchive ? (
            <AlertDialog
              title={t('tenants.profile.archiveTitle', { name: data.fullName })}
              description={t('tenants.profile.archiveDescription')}
              confirmLabel={t('tenants.profile.archive')}
              cancelLabel={t('common.cancel')}
              confirmVariant="danger"
              confirmLoading={archive.isPending}
              onConfirm={() => void archiveTenant()}
              trigger={
                <Button variant="ghost">
                  <Icon name="archive" className="size-4" aria-hidden />
                  {t('tenants.profile.archive')}
                </Button>
              }
              triggerAsChild
            />
          ) : null}
          {active && canUpdate ? (
            <Button variant="secondary" onClick={() => navigate(`/tenants/${data.id}/edit`)}>
              <Icon name="edit" className="size-4" aria-hidden />
              {t('common.edit')}
            </Button>
          ) : null}
        </div>
      </header>

      <Panel id="personal-title" title={t('tenants.profile.personal')}>
        <InfoList
          items={[
            [t('tenants.fields.email'), data.email],
            [t('tenants.fields.birthDate'), data.birthDate ? formatDate(data.birthDate) : null],
            [t('tenants.fields.gender'), data.gender ? t(`tenants.genders.${data.gender}`) : null],
            [t('tenants.fields.idIssuedAt'), data.idIssuedAt ? formatDate(data.idIssuedAt) : null],
            [t('tenants.fields.hometown'), data.hometown],
            [t('tenants.fields.permanentAddress'), data.permanentAddress],
            [t('tenants.fields.occupation'), data.occupation],
            [t('tenants.fields.note'), data.note],
          ]}
        />
      </Panel>

      <IdNumberBlock tenant={data} />

      <VehiclesSection tenantId={data.id} vehicles={data.vehicles} editable={active && canUpdate} />

      <Panel id="contracts-title" title={t('tenants.profile.contracts')}>
        {data.contracts.length === 0 ? (
          <p className="text-ui-sm text-muted">{t('tenants.profile.noContracts')}</p>
        ) : (
          <ul className="grid gap-2">
            {data.contracts.map((contract) => (
              <li key={contract.id} className="text-ink">
                <Link className="text-accent" to={`/contracts/${contract.id}`}>
                  {contract.code}
                </Link>{' '}
                · {contract.room.code} · {formatDate(contract.fromDate)} –{' '}
                {formatDate(contract.toDate)}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel id="portal-title" title={t('tenants.profile.portal')}>
        <p className="text-ui-sm text-muted">
          {data.portalLastOpenedAt
            ? t('tenants.profile.portalOpened', {
                date: formatDate(data.portalLastOpenedAt),
              })
            : t('tenants.profile.portalNone')}
        </p>
      </Panel>

      <Link to="/tenants" className="text-ui-sm font-semibold text-accent">
        {t('tenants.backToList')}
      </Link>
    </div>
  );
}
