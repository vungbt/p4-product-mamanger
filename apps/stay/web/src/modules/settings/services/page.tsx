import {
  AlertDialog,
  Button,
  cn,
  Dialog,
  Drawer,
  EmptyState,
  Icon,
  IconButton,
  Switch,
  Tag,
} from '@itclabs/react-ui';
import { Sortable, SortableHandle, SortableItem } from '@itclabs/react-ui/dnd';
import { toast } from '@itclabs/react-ui/toast';
import { useServices, useUpdateService } from '@stay/sdk/react';
import { ApiSdkError } from '@stay/sdk/shared';
import type { StayService } from '@stay/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FilterBar } from '@/libraries/filter-bar';
import { formatVnd } from '@/libraries/format';
import { isVersionConflict } from '@/libraries/forms/api-errors';
import { LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { ScreenHeader } from '@/libraries/screen-header';
import { useIsDesktop } from '@/libraries/use-media-query';
import { ServiceCreateForm, ServiceEditForm } from './service-forms';

/** Column widths shared by the header and the rows (desktop). */
const COLUMNS = {
  kind: 'lg:w-40',
  unit: 'lg:w-20',
  price: 'shrink-0 lg:w-36 lg:text-right',
  // Mobile: on its own line under the name; desktop: a column before the actions.
  status: 'order-last basis-full pl-11 lg:order-none lg:basis-auto lg:w-36 lg:pl-0',
  actions: 'shrink-0 lg:w-12',
};

type ServiceChange = Pick<StayService, 'active' | 'sortOrder'>;

/** O-02 Cài đặt: dịch vụ & đơn giá — the system service catalogue and default prices. */
export default function ServicesPage() {
  const { t } = useTranslation('settings');
  const query = useServices();
  const update = useUpdateService();
  const isDesktop = useIsDesktop();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState<StayService | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [order, setOrder] = useState<string[] | null>(null);

  const services = query.data ?? [];
  const byId = new Map(services.map((service) => [service.id, service]));
  const ordered = order ? order.flatMap((id) => byId.get(id) ?? []) : services;
  const editing = editingId ? (byId.get(editingId) ?? null) : null;

  const reportError = (error: unknown) => {
    if (isVersionConflict(error)) {
      toast.warning(t('forms:conflict.title'));
      void query.refetch();
      return;
    }

    const message =
      error instanceof ApiSdkError
        ? (Object.values(error.fieldErrors)[0]?.[0] ?? error.message)
        : t('saveFailed');

    toast.error(message);
  };

  const save = (service: StayService, change: ServiceChange) =>
    update.mutateAsync({
      id: service.id,
      body: {
        name: service.name,
        description: service.description,
        unit: service.unit,
        defaultPrice: service.defaultPrice,
        sortOrder: change.sortOrder,
        active: change.active,
        version: service.version,
      },
    });

  const setActive = async (service: StayService, active: boolean) => {
    setPendingId(service.id);

    try {
      await save(service, { active, sortOrder: service.sortOrder });
      toast.success(
        t(active ? 'services.activated' : 'services.deactivated', { name: service.name }),
      );
    } catch (error) {
      reportError(error);
    } finally {
      setPendingId(null);
    }
  };

  const reorder = async (ids: string[]) => {
    setOrder(ids);

    try {
      for (const [index, id] of ids.entries()) {
        const service = byId.get(id);
        const sortOrder = (index + 1) * 10;

        if (service && service.sortOrder !== sortOrder)
          await save(service, { active: service.active, sortOrder });
      }
      toast.success(t('services.reordered'));
    } catch (error) {
      reportError(error);
    } finally {
      await query.refetch();
      setOrder(null);
    }
  };

  const reload = () => {
    setEditingId(null);
    void query.refetch();
  };

  const header = (
    <ScreenHeader title={t('services.title')} description={t('services.description')} />
  );

  if (query.isPending)
    return (
      <div className="grid gap-6">
        {header}
        <LoadingRows rows={6} />
      </div>
    );

  if (query.isError && !query.data)
    return (
      <div className="grid gap-6">
        {header}
        <LoadError error={query.error} onRetry={() => void query.refetch()} />
      </div>
    );

  return (
    <div className="grid gap-6">
      {header}

      <FilterBar
        actions={
          <Button onClick={() => setCreating(true)}>
            <Icon name="plus" className="size-4" aria-hidden />
            {t('services.add')}
          </Button>
        }
      />

      <Dialog
        open={creating}
        onOpenChange={setCreating}
        title={t('services.addTitle')}
        description={t('services.priceWarning')}
        data-testid="service-create-dialog"
      >
        {creating ? <ServiceCreateForm onDone={() => setCreating(false)} /> : null}
      </Dialog>

      {services.length === 0 ? (
        <EmptyState
          icon="receipt"
          title={t('services.emptyTitle')}
          description={t('services.emptyDescription')}
          action={<Button onClick={() => setCreating(true)}>{t('services.add')}</Button>}
        />
      ) : (
        <section
          aria-label={t('services.title')}
          className="overflow-hidden rounded-panel border border-line bg-surface shadow-panel"
          data-testid="services-table"
        >
          <div aria-hidden="true" className="hidden border-b border-line bg-table-header lg:block">
            <div className="flex items-center gap-3 px-4 py-2.5 text-eyebrow font-semibold uppercase text-muted">
              <span className="w-8">
                <span className="sr-only">{t('services.order')}</span>
              </span>
              <span className="min-w-0 flex-1">{t('services.name')}</span>
              <span className={COLUMNS.kind}>{t('services.kind')}</span>
              <span className={COLUMNS.unit}>{t('services.unit')}</span>
              <span className={COLUMNS.price}>{t('services.defaultPrice')}</span>
              <span className={COLUMNS.status}>{t('services.status')}</span>
              <span className={COLUMNS.actions}>
                <span className="sr-only">{t('actions')}</span>
              </span>
            </div>
          </div>

          <Sortable
            aria-label={t('services.title')}
            value={ordered.map(({ id }) => id)}
            onValueChange={(ids) => void reorder(ids)}
            disabled={order !== null}
            lockAxis="y"
            gap={0}
          >
            {ordered.map((service) => {
              const isEditing = editing?.id === service.id && isDesktop;

              return (
                <SortableItem
                  key={service.id}
                  id={service.id}
                  label={service.name}
                  className="border-b border-line bg-surface last:border-b-0"
                  data-testid={`service-row-${service.code}`}
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
                    <span className="flex w-8 shrink-0 justify-center">
                      <SortableHandle label={t('services.dragHandle', { name: service.name })} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block break-words font-semibold text-ink lg:truncate">
                        {service.name}
                      </span>
                      {service.description ? (
                        <span
                          className="block break-words text-ui-sm text-muted"
                          data-testid="service-description"
                        >
                          {service.description}
                        </span>
                      ) : null}
                      <span className="block text-ui-sm text-muted lg:hidden">
                        {t(`services.kinds.${service.kind}`)} · {service.unit}
                      </span>
                    </span>
                    <span className={cn('hidden text-ui-sm text-ink lg:block', COLUMNS.kind)}>
                      {t(`services.kinds.${service.kind}`)}
                    </span>
                    <span className={cn('hidden text-ui-sm text-ink lg:block', COLUMNS.unit)}>
                      {service.unit}
                    </span>
                    <span
                      className={cn('font-semibold tabular-nums text-ink', COLUMNS.price)}
                      data-testid="service-price"
                    >
                      {formatVnd(service.defaultPrice)}
                    </span>
                    <span className={cn('flex items-center gap-2', COLUMNS.status)}>
                      <Switch
                        checked={service.active}
                        disabled={pendingId === service.id}
                        onCheckedChange={(checked) => {
                          if (checked) void setActive(service, true);
                          else setDeactivating(service);
                        }}
                        aria-label={t('services.toggle', { name: service.name })}
                      />
                      <Tag size="sm" tone={service.active ? 'success' : 'neutral'}>
                        {service.active ? t('services.active') : t('services.inactive')}
                      </Tag>
                    </span>
                    <span className={cn('flex justify-end', COLUMNS.actions)}>
                      <IconButton
                        icon="edit"
                        variant="ghost"
                        size="sm"
                        label={t('services.edit', { name: service.name })}
                        aria-expanded={isEditing}
                        onClick={() => setEditingId(isEditing ? null : service.id)}
                      />
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="border-t border-line bg-canvas px-4 py-4">
                      <ServiceEditForm
                        key={service.version}
                        service={service}
                        onDone={() => setEditingId(null)}
                        onReload={reload}
                      />
                    </div>
                  ) : null}
                </SortableItem>
              );
            })}
          </Sortable>
        </section>
      )}

      <p className="text-ui-sm text-muted">{t('services.orderHint')}</p>

      <Drawer
        side="bottom"
        open={Boolean(editing) && !isDesktop}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
        title={editing ? t('services.editTitle', { name: editing.name }) : t('services.title')}
        data-testid="service-edit-sheet"
      >
        {editing && !isDesktop ? (
          <ServiceEditForm
            key={editing.version}
            service={editing}
            onDone={() => setEditingId(null)}
            onReload={reload}
          />
        ) : null}
      </Drawer>

      <AlertDialog
        open={Boolean(deactivating)}
        onOpenChange={(open) => {
          if (!open) setDeactivating(null);
        }}
        title={t('services.deactivateTitle', { name: deactivating?.name ?? '' })}
        description={t('services.deactivateDescription')}
        confirmLabel={t('services.deactivate')}
        cancelLabel={t('cancel')}
        confirmVariant="danger"
        onConfirm={() => {
          if (deactivating) void setActive(deactivating, false);
        }}
        data-testid="service-deactivate-dialog"
      />
    </div>
  );
}
