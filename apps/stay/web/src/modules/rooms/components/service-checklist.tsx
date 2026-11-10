import { Checkbox, Skeleton } from '@itclabs/react-ui';
import { useServices } from '@stay/sdk/react';
import { useTranslation } from 'react-i18next';

type ServiceChecklistProps = {
  value: readonly string[];
  onChange: (ids: string[]) => void;
  error?: string;
};

/** Default services of a room (checkboxes): active services, plus inactive ones already chosen. */
export function ServiceChecklist({ value, onChange, error }: ServiceChecklistProps) {
  const { t } = useTranslation();
  const services = useServices();

  const options = (services.data ?? []).filter(
    (service) => service.active || value.includes(service.id),
  );

  const toggle = (id: string, checked: boolean) => {
    onChange(checked ? [...value, id] : value.filter((item) => item !== id));
  };

  return (
    <fieldset className="grid gap-2" data-testid="room-services">
      <legend className="mb-1 text-ui-sm font-medium text-ink">{t('rooms.fields.services')}</legend>
      <p className="text-ui-sm text-muted">{t('rooms.form.servicesHint')}</p>
      {services.isPending ? (
        <Skeleton className="h-16" />
      ) : services.isError ? (
        <p className="text-ui-sm text-danger-700">{t('rooms.form.servicesFailed')}</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((service) => (
            <Checkbox
              key={service.id}
              checked={value.includes(service.id)}
              onCheckedChange={(checked) => toggle(service.id, checked === true)}
              label={`${service.name} (${service.unit})`}
            />
          ))}
        </div>
      )}
      {error ? (
        <p role="alert" className="text-ui-sm text-danger-700">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
