import {
  Alert,
  AlertDialog,
  Button,
  EmptyState,
  Form,
  FormActions,
  FormField,
  FormGrid,
  FormLayout,
  FormSection,
  FormSubmit,
  Icon,
  IconButton,
  Input,
  Select,
  useAppForm,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useAddVehicle, useRemoveVehicle, useUpdateVehicle } from '@stay/sdk/react';
import { type components, getErrorMessage, getFieldError } from '@stay/sdk/shared';
import { VEHICLE_TYPES, type VehicleType } from '@stay/shared';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

type Vehicle = components['schemas']['TenantVehicle'];

type VehicleValues = { plate: string; type: VehicleType; note: string };

function VehicleForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: VehicleValues;
  submitLabel: string;
  onSubmit: (values: VehicleValues) => Promise<void>;
  onCancel?: () => void;
}) {
  const { t } = useTranslation();
  const [error, setError] = useState<unknown>(null);

  const schema = useMemo(
    () => ({
      plate: v.pipe(v.string(), v.trim(), v.minLength(4, t('tenants.vehicles.plateRequired'))),
    }),
    [t],
  );

  const typeOptions = useMemo(
    () => VEHICLE_TYPES.map((value) => ({ value, label: t(`tenants.vehicleTypes.${value}`) })),
    [t],
  );

  const form = useAppForm({
    defaultValues: initial,
    onSubmit: async ({ value, formApi }) => {
      setError(null);

      try {
        await onSubmit(value);
        if (!onCancel) formApi.reset();
      } catch (caught) {
        setError(caught);
      }
    },
  });

  const plateError = getFieldError(error, 'plate');
  const generalError = error && !plateError ? getErrorMessage(error, t('errors.saveFailed')) : null;

  return (
    <Form form={form} schema={schema} className="grid gap-3" data-testid="vehicle-form">
      <FormLayout size="full">
        <FormSection>
          {generalError ? (
            <Alert tone="danger" role="alert">
              {generalError}
            </Alert>
          ) : null}
          <FormGrid columns={3}>
            <FormField name="plate" label={t('tenants.vehicles.plate')} required className="mb-0">
              <Input placeholder="59-X1 123.45" autoCapitalize="characters" error={plateError} />
            </FormField>
            <FormField name="type" label={t('tenants.vehicles.type')} className="mb-0">
              <Select options={typeOptions} />
            </FormField>
            <FormField name="note" label={t('tenants.fields.note')} className="mb-0">
              <Input />
            </FormField>
          </FormGrid>
        </FormSection>
        <FormActions>
          {onCancel ? (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          ) : null}
          <FormSubmit form={form}>
            {(isSubmitting) => (
              <Button type="submit" size="sm" loading={isSubmitting}>
                {submitLabel}
              </Button>
            )}
          </FormSubmit>
        </FormActions>
      </FormLayout>
    </Form>
  );
}

/** O-12 "Xe": list, add, edit and delete a tenant's vehicles. */
export function VehiclesSection({
  tenantId,
  vehicles,
  editable,
}: {
  tenantId: string;
  vehicles: Vehicle[];
  editable: boolean;
}) {
  const { t } = useTranslation();
  const addVehicle = useAddVehicle();
  const updateVehicle = useUpdateVehicle();
  const removeVehicle = useRemoveVehicle();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const body = (values: VehicleValues) => ({
    plate: values.plate.trim(),
    type: values.type,
    note: values.note.trim() || null,
  });

  const remove = async (vehicle: Vehicle) => {
    try {
      await removeVehicle.mutateAsync({ id: tenantId, vehicleId: vehicle.id });
      toast.success(t('tenants.vehicles.removed', { plate: vehicle.plate }));
    } catch (error) {
      toast.error(getErrorMessage(error, t('errors.saveFailed')));
    }
  };

  return (
    <section
      aria-labelledby="vehicles-title"
      className="grid gap-3 rounded-panel border border-line bg-surface p-4 sm:p-5"
      data-testid="tenant-vehicles"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="vehicles-title" className="text-section font-semibold text-ink">
          {t('tenants.vehicles.title')}
        </h2>
        {editable && !adding ? (
          <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
            <Icon name="plus" className="size-4" aria-hidden />
            {t('tenants.vehicles.add')}
          </Button>
        ) : null}
      </div>

      {vehicles.length === 0 && !adding ? (
        <EmptyState size="compact" appearance="plain" title={t('tenants.vehicles.empty')} />
      ) : null}

      <ul className="grid gap-2">
        {vehicles.map((vehicle) => (
          <li
            key={vehicle.id}
            className="rounded-control border border-line p-3"
            data-testid="vehicle-item"
          >
            {editingId === vehicle.id ? (
              <VehicleForm
                initial={{ plate: vehicle.plate, type: vehicle.type, note: vehicle.note ?? '' }}
                submitLabel={t('common.save')}
                onCancel={() => setEditingId(null)}
                onSubmit={async (values) => {
                  await updateVehicle.mutateAsync({
                    id: tenantId,
                    vehicleId: vehicle.id,
                    body: body(values),
                  });
                  setEditingId(null);
                }}
              />
            ) : (
              <div className="flex items-center gap-3">
                <div className="grid min-w-0 flex-1">
                  <span className="font-semibold text-ink">{vehicle.plate}</span>
                  <span className="text-ui-sm text-muted">
                    {t(`tenants.vehicleTypes.${vehicle.type}`)}
                    {vehicle.note ? ` · ${vehicle.note}` : ''}
                  </span>
                </div>
                {editable ? (
                  <div className="flex shrink-0 gap-1">
                    <IconButton
                      icon="edit"
                      variant="ghost"
                      label={t('tenants.vehicles.edit', { plate: vehicle.plate })}
                      onClick={() => setEditingId(vehicle.id)}
                    />
                    <AlertDialog
                      title={t('tenants.vehicles.removeTitle', { plate: vehicle.plate })}
                      description={t('tenants.vehicles.removeDescription')}
                      confirmLabel={t('common.delete')}
                      cancelLabel={t('common.cancel')}
                      confirmVariant="danger"
                      onConfirm={() => void remove(vehicle)}
                      trigger={
                        <IconButton
                          icon="delete"
                          variant="ghost"
                          label={t('tenants.vehicles.remove', { plate: vehicle.plate })}
                        />
                      }
                      triggerAsChild
                    />
                  </div>
                ) : null}
              </div>
            )}
          </li>
        ))}
      </ul>

      {adding ? (
        <VehicleForm
          initial={{ plate: '', type: 'motorbike', note: '' }}
          submitLabel={t('tenants.vehicles.save')}
          onCancel={() => setAdding(false)}
          onSubmit={async (values) => {
            const created = await addVehicle.mutateAsync({ id: tenantId, body: body(values) });

            toast.success(t('tenants.vehicles.added', { plate: created.plate }));
            setAdding(false);
          }}
        />
      ) : null}
    </section>
  );
}
