import {
  Alert,
  AlertDialog,
  Button,
  EmptyState,
  Icon,
  PageHeader,
  Skeleton,
  Tag,
  useFormatters,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useArchiveRoom, useRoom } from '@stay/sdk/react';
import { ApiSdkError, getErrorMessage } from '@stay/sdk/shared';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCanAccess, useCanOn } from '@/libraries/ability';
import { ROUTES, roomEditPath } from '@/routing/route-configs';
import { RoomPaymentDialog } from '../payments/payment-dialog';
import { MaintenanceDialog } from './components/maintenance-dialog';
import { RoomStatusBadge } from './room-status';
import { useRoomBuilding } from './use-room-building';

function Section({
  title,
  children,
  testId,
}: {
  title: string;
  children: ReactNode;
  testId?: string;
}) {
  const id = `section-${testId ?? title}`;

  return (
    <section
      aria-labelledby={id}
      className="rounded-panel border border-line bg-surface p-4 shadow-panel sm:p-5"
      data-testid={testId}
    >
      <h2 id={id} className="text-section font-semibold text-ink">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Facts({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="grid gap-0.5">
          <dt className="text-ui-sm text-muted">{item.label}</dt>
          <dd className="text-control text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-control text-muted">{children}</p>;
}

/** O-08 Chi tiết phòng. Contract, occupants and invoices fill in with ST-10/ST-14. */
export default function RoomDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const query = useRoom(id);
  const archive = useArchiveRoom();
  const canManage = useCanAccess('manage', 'Room');
  const canSettle = useCanAccess('settle', 'Contract');
  const { formatCurrency, formatDate, formatNumber } = useFormatters();
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [collectOpen, setCollectOpen] = useState(false);

  const room = query.data;
  const canPay = useCanOn('create', 'Payment', { buildingId: room?.buildingId });

  useRoomBuilding(room?.buildingId);

  const money = (value: number) => formatCurrency(value, 'VND');
  const date = (value: string | null) => (value ? formatDate(value, 'dd/MM/yyyy') : '—');

  const confirmArchive = async () => {
    if (!room) return;

    try {
      await archive.mutateAsync(room.id);
      toast.success(t('rooms.detail.archived', { code: room.code }));
      navigate(ROUTES.rooms);
    } catch (error) {
      toast.error(getErrorMessage(error, t('rooms.detail.archiveFailed')));
    }
  };

  if (query.isPending)
    return (
      <div className="grid gap-4" role="status" aria-busy="true">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );

  if (query.isError || !room) {
    const missing = query.error instanceof ApiSdkError && query.error.status === 404;

    return missing ? (
      <EmptyState
        variant="not-found"
        headingLevel={1}
        title={t('rooms.detail.notFound')}
        description={t('rooms.detail.notFoundDescription')}
        action={
          <Button onClick={() => navigate(ROUTES.rooms)}>{t('rooms.detail.backToMap')}</Button>
        }
        data-testid="room-not-found"
      />
    ) : (
      <Alert
        tone="danger"
        title={t('errors.loadFailed')}
        action={
          <Button variant="secondary" size="sm" onClick={() => void query.refetch()}>
            {t('errors.retry')}
          </Button>
        }
      >
        {getErrorMessage(query.error, t('errors.loadFailed'))}
      </Alert>
    );
  }

  const locked = Boolean(room.contract);
  const archived = Boolean(room.archivedAt);

  return (
    <div className="grid gap-5">
      <PageHeader
        title={t('rooms.detail.title', { code: room.code })}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <RoomStatusBadge status={room.status} />
            <span>
              {room.buildingName} · {t('rooms.map.floor', { floor: room.floor })}
            </span>
            {archived ? <Tag size="sm">{t('rooms.detail.archivedTag')}</Tag> : null}
          </span>
        }
        action={
          (canManage && !archived) || (canPay && room.debt > 0) ? (
            // Secondary actions first, the primary action (collect, else edit) last.
            <div className="flex flex-wrap gap-2">
              {canManage && !archived ? (
                <>
                  <Button variant="ghost" disabled={locked} onClick={() => setArchiveOpen(true)}>
                    <Icon name="archive" className="size-4" aria-hidden />
                    {t('rooms.actions.archive')}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={locked}
                    onClick={() => setMaintenanceOpen(true)}
                  >
                    <Icon name="wrench" className="size-4" aria-hidden />
                    {room.maintenance
                      ? t('rooms.actions.maintenanceOff')
                      : t('rooms.actions.maintenanceOn')}
                  </Button>
                  <Button
                    variant={room.debt > 0 && canPay ? 'secondary' : 'primary'}
                    onClick={() => navigate(roomEditPath(room.id))}
                  >
                    <Icon name="edit" className="size-4" aria-hidden />
                    {t('rooms.actions.edit')}
                  </Button>
                </>
              ) : null}
              {canPay && room.debt > 0 ? (
                <Button onClick={() => setCollectOpen(true)}>
                  <Icon name="moneyReceive" className="size-4" aria-hidden />
                  {t('rooms.actions.collect')}
                </Button>
              ) : null}
            </div>
          ) : null
        }
      />

      {canManage && locked ? <Alert tone="info">{t('rooms.detail.lockedByContract')}</Alert> : null}

      {room.maintenance ? (
        <Alert
          tone="warning"
          title={t('rooms.detail.underMaintenance')}
          data-testid="room-maintenance"
        >
          {room.maintenanceReason}
          {room.maintenanceUntil
            ? ` · ${t('rooms.detail.maintenanceUntil', { date: date(room.maintenanceUntil) })}`
            : null}
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title={t('rooms.detail.info')} testId="room-info">
          <Facts
            items={[
              { label: t('rooms.fields.floor'), value: room.floor },
              {
                label: t('rooms.fields.areaM2'),
                value: room.areaM2 === null ? '—' : `${formatNumber(room.areaM2)} m²`,
              },
              { label: t('rooms.fields.listPrice'), value: money(room.listPrice) },
              { label: t('rooms.fields.maxOccupants'), value: room.maxOccupants },
              {
                label: t('rooms.fields.services'),
                value: room.defaultServices.length
                  ? room.defaultServices.map((service) => service.name).join(', ')
                  : '—',
              },
              { label: t('rooms.fields.note'), value: room.note ?? '—' },
            ]}
          />
        </Section>

        <Section title={t('rooms.detail.contract')} testId="room-contract">
          {room.contract ? (
            <div className="grid gap-3">
              <Facts
                items={[
                  {
                    label: t('rooms.detail.contractCode'),
                    value: (
                      <Link className="text-accent" to={`/contracts/${room.contract.id}`}>
                        {room.contract.code}
                      </Link>
                    ),
                  },
                  {
                    label: t('rooms.detail.primaryTenant'),
                    value: room.contract.primaryTenantName ?? '—',
                  },
                  { label: t('rooms.detail.startDate'), value: date(room.contract.startDate) },
                  { label: t('rooms.detail.rent'), value: money(room.contract.rent) },
                  { label: t('rooms.detail.depositHeld'), value: money(room.contract.depositHeld) },
                ]}
              />
              {canSettle && room.status === 'occupied' ? (
                <Link
                  className="font-semibold text-accent"
                  to={`/contracts/${room.contract.id}/settle`}
                >
                  Thanh lý hợp đồng
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-2">
              <Empty>{t('rooms.detail.noContract')}</Empty>
              {room.status === 'vacant' && (
                <Link className="font-semibold text-accent" to={`/contracts/new?roomId=${room.id}`}>
                  Tạo hợp đồng
                </Link>
              )}
            </div>
          )}
        </Section>

        <Section title={t('rooms.detail.occupants')} testId="room-occupants">
          {room.occupants.length ? (
            <ul className="grid gap-2">
              {room.occupants.map((occupant) => (
                <li key={occupant.tenantId} className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-ink">{occupant.fullName}</span>
                  {occupant.isPrimary ? (
                    <Tag size="sm" tone="brand">
                      {t('rooms.detail.primary')}
                    </Tag>
                  ) : null}
                  <span className="text-ui-sm text-muted">{occupant.phone}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>{t('rooms.detail.noOccupants')}</Empty>
          )}
        </Section>

        <Section title={t('rooms.detail.meters')} testId="room-meters">
          <ul className="grid gap-3">
            {room.meters.map((meter) => (
              <li key={meter.id} className="grid gap-1" data-testid={`meter-${meter.kind}`}>
                <span className="font-medium text-ink">
                  {t(`rooms.meters.${meter.kind}`)}
                  {meter.serial ? (
                    <span className="font-normal text-muted"> · {meter.serial}</span>
                  ) : null}
                </span>
                <span className="text-ui-sm text-muted">
                  {meter.latestReading === null
                    ? t('rooms.meters.initialOnly', {
                        reading: formatNumber(meter.initialReading),
                        date: date(meter.installedOn),
                      })
                    : t('rooms.meters.latest', {
                        reading: formatNumber(meter.latestReading),
                        period: meter.latestPeriod,
                      })}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t('rooms.detail.invoices')} testId="room-invoices">
          {room.invoices.length ? (
            <ul className="grid gap-2">
              {room.invoices.map((invoice) => (
                <li key={invoice.id} className="flex flex-wrap justify-between gap-2">
                  <Link className="text-accent" to={`/invoices/${invoice.id}`}>
                    {invoice.code ?? invoice.period}
                  </Link>
                  <span className="text-ink">{money(invoice.total)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>{t('rooms.detail.noInvoices')}</Empty>
          )}
        </Section>
      </div>

      {collectOpen ? (
        <RoomPaymentDialog
          roomId={room.id}
          roomCode={room.code}
          onClose={() => setCollectOpen(false)}
        />
      ) : null}
      <MaintenanceDialog
        room={maintenanceOpen ? room : null}
        onClose={() => setMaintenanceOpen(false)}
        onReload={() => void query.refetch()}
      />
      <AlertDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={t('rooms.detail.archiveTitle', { code: room.code })}
        description={t('rooms.detail.archiveDescription')}
        confirmLabel={t('rooms.actions.archive')}
        cancelLabel={t('rooms.form.cancel')}
        confirmVariant="danger"
        confirmLoading={archive.isPending}
        onConfirm={() => void confirmArchive()}
      />
    </div>
  );
}
