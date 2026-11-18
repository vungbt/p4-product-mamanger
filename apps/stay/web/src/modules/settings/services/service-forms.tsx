import {
  Alert,
  Button,
  Form,
  FormField,
  FormSubmit,
  Input,
  NumberInput,
  Select,
  Switch,
  Textarea,
  useAppForm,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useCreateService, useUpdateService } from '@stay/sdk/react';
import {
  SERVICE_DESCRIPTION_MAX,
  SERVICE_KINDS,
  type ServiceKind,
  type StayService,
} from '@stay/shared';
import type { TFunction } from 'i18next';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';
import {
  apiFormErrors,
  clearServerErrorOnChange,
  isVersionConflict,
  serverError,
} from '@/libraries/forms/api-errors';
import { ConflictAlert, FormError } from '@/libraries/forms/page-states';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { useFormDirty, useFormValue } from '@/libraries/forms/use-form-value';

export const MAX_PRICE = 1_000_000_000;

function serviceSchema(t: TFunction<'settings'>) {
  return {
    name: v.pipe(
      v.string(),
      v.trim(),
      v.minLength(1, t('validation.required')),
      v.maxLength(120, t('validation.maxLength', { max: 120 })),
    ),
    unit: v.pipe(
      v.string(),
      v.trim(),
      v.minLength(1, t('validation.required')),
      v.maxLength(20, t('validation.maxLength', { max: 20 })),
    ),
    description: v.pipe(
      v.string(),
      v.maxLength(
        SERVICE_DESCRIPTION_MAX,
        t('validation.maxLength', { max: SERVICE_DESCRIPTION_MAX }),
      ),
    ),
    defaultPrice: v.pipe(
      v.number(t('validation.required')),
      v.integer(t('validation.integer')),
      v.minValue(0, t('validation.priceRange')),
      v.maxValue(MAX_PRICE, t('validation.priceRange')),
    ),
  };
}

/** Optional description textarea with a character counter (`n/500`). */
function DescriptionField({ length }: { length: number }) {
  const { t } = useTranslation('settings');

  return (
    <FormField name="description" label={t('services.descriptionLabel')} className="mb-0">
      <Textarea
        rows={2}
        maxLength={SERVICE_DESCRIPTION_MAX}
        placeholder={t('services.descriptionPlaceholder')}
        hint={t('services.descriptionHint', { count: length, max: SERVICE_DESCRIPTION_MAX })}
      />
    </FormField>
  );
}

/** "Giá trị mới áp dụng cho hoá đơn lập từ nay…" (screens.md O-02). */
export function PriceChangeWarning() {
  const { t } = useTranslation('settings');

  return (
    <Alert tone="warning" data-testid="price-change-warning">
      {t('services.priceWarning')}
    </Alert>
  );
}

type EditValues = {
  name: string;
  description: string;
  unit: string;
  defaultPrice: number | null;
};

const EDIT_FIELDS = [
  'name',
  'description',
  'unit',
  'defaultPrice',
] as const satisfies (keyof EditValues)[];

/** Edits a service's name, unit and default price (inline row on desktop, sheet on mobile). */
export function ServiceEditForm({
  service,
  onDone,
  onReload,
}: {
  service: StayService;
  onDone: () => void;
  onReload: () => void;
}) {
  const { t } = useTranslation('settings');
  const update = useUpdateService();
  const [formError, setFormError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);

  const schema = useMemo(() => serviceSchema(t), [t]);

  const form = useAppForm({
    defaultValues: {
      name: service.name,
      description: service.description ?? '',
      unit: service.unit,
      defaultPrice: service.defaultPrice,
    } as EditValues,
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      setFormError(null);
      setConflict(false);

      try {
        await update.mutateAsync({
          id: service.id,
          body: {
            name: value.name.trim(),
            description: value.description.trim() || null,
            unit: value.unit.trim(),
            defaultPrice: value.defaultPrice ?? 0,
            sortOrder: service.sortOrder,
            active: service.active,
            version: service.version,
          },
        });
        form.reset();
        toast.success(t('services.saved', { name: value.name.trim() }));
        onDone();
      } catch (error) {
        if (isVersionConflict(error)) {
          setConflict(true);
          return;
        }

        const errors = apiFormErrors(error, EDIT_FIELDS, t('saveFailed'));

        for (const field of EDIT_FIELDS) {
          const message = errors.fields[field];

          if (message) form.setFieldMeta(field, serverError(message));
        }
        setFormError(errors.message);
      }
    },
  });

  const dirty = useFormDirty(form);
  const price = useFormValue(form, (state) => state.values.defaultPrice);
  const editDescription = useFormValue(form, (state) => state.values.description);
  const { prompt } = useUnsavedChanges(dirty);

  return (
    <Form
      form={form}
      schema={schema}
      className="grid gap-4"
      aria-label={t('services.editTitle', { name: service.name })}
      data-testid="service-edit-form"
    >
      {prompt}
      {conflict ? <ConflictAlert onReload={onReload} /> : null}
      <FormError message={formError} />

      <div className="grid gap-4 md:grid-cols-3">
        <FormField name="name" label={t('services.name')} required className="mb-0">
          <Input maxLength={120} autoFocus />
        </FormField>
        <FormField name="unit" label={t('services.unit')} required className="mb-0">
          <Input maxLength={20} />
        </FormField>
        <FormField name="defaultPrice" label={t('services.defaultPrice')} required className="mb-0">
          <NumberInput min={0} max={MAX_PRICE} step={1} endAddon="₫" inputMode="numeric" />
        </FormField>
      </div>
      <DescriptionField length={editDescription.length} />

      {price !== service.defaultPrice ? <PriceChangeWarning /> : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            form.reset();
            onDone();
          }}
        >
          {t('cancel')}
        </Button>
        <FormSubmit form={form}>
          {(isSubmitting) => (
            <Button type="submit" loading={isSubmitting}>
              {isSubmitting ? t('saving') : t('save')}
            </Button>
          )}
        </FormSubmit>
      </div>
    </Form>
  );
}

type CreateValues = {
  name: string;
  description: string;
  kind: string;
  unit: string;
  defaultPrice: number | null;
  active: boolean;
};

const CREATE_FIELDS = [
  'name',
  'description',
  'kind',
  'unit',
  'defaultPrice',
  'active',
] as const satisfies (keyof CreateValues)[];

function isServiceKind(value: string): value is ServiceKind {
  return SERVICE_KINDS.some((kind) => kind === value);
}

/** Adds a service to the catalogue (dialog of O-02). */
export function ServiceCreateForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation('settings');
  const create = useCreateService();
  const [formError, setFormError] = useState<string | null>(null);

  const kindOptions = useMemo(
    () => SERVICE_KINDS.map((kind) => ({ value: kind, label: t(`services.kinds.${kind}`) })),
    [t],
  );
  const schema = useMemo(
    () => ({
      ...serviceSchema(t),
      kind: v.pipe(v.string(), v.minLength(1, t('validation.required'))),
    }),
    [t],
  );

  const defaultUnit = (kind: string) =>
    isServiceKind(kind) ? t(`services.defaultUnits.${kind}`) : '';

  const form = useAppForm({
    defaultValues: {
      name: '',
      description: '',
      kind: '',
      unit: '',
      defaultPrice: null,
      active: true,
    } as CreateValues,
    listeners: {
      onChange: (props) => {
        clearServerErrorOnChange.onChange(props);

        // Suggest the unit of the chosen kind until the owner types one.
        if (props.fieldApi.name !== 'kind') return;

        const unit = props.formApi.getFieldValue('unit');
        const previousUnits = SERVICE_KINDS.map(defaultUnit);

        if (!unit || previousUnits.includes(unit))
          props.formApi.setFieldValue('unit', defaultUnit(String(props.fieldApi.state.value)));
      },
    },
    onSubmit: async ({ value }) => {
      setFormError(null);

      if (!isServiceKind(value.kind)) return;

      try {
        const created = await create.mutateAsync({
          name: value.name.trim(),
          description: value.description.trim() || null,
          kind: value.kind,
          unit: value.unit.trim(),
          defaultPrice: value.defaultPrice ?? 0,
          active: value.active,
        });

        form.reset();
        toast.success(t('services.created', { name: created.name }));
        onDone();
      } catch (error) {
        const errors = apiFormErrors(error, CREATE_FIELDS, t('saveFailed'));

        for (const field of CREATE_FIELDS) {
          const message = errors.fields[field];

          // A kind conflict (one active electricity/water service) concerns other services, so
          // it stays as a form message: a field error clears on blur and shifts the actions.
          if (message && field !== 'kind') form.setFieldMeta(field, serverError(message));
        }
        setFormError(errors.fields.kind ?? errors.message);
      }
    },
  });

  const dirty = useFormDirty(form);
  const createDescription = useFormValue(form, (state) => state.values.description);
  const { prompt } = useUnsavedChanges(dirty);

  return (
    <Form form={form} schema={schema} className="grid gap-4" data-testid="service-create-form">
      {prompt}
      <FormError message={formError} />

      <FormField name="name" label={t('services.name')} required className="mb-0">
        <Input maxLength={120} autoFocus />
      </FormField>
      <FormField name="kind" label={t('services.kind')} required className="mb-0">
        <Select options={kindOptions} placeholder={t('services.kindPlaceholder')} />
      </FormField>
      <DescriptionField length={createDescription.length} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField name="unit" label={t('services.unit')} required className="mb-0">
          <Input maxLength={20} />
        </FormField>
        <FormField name="defaultPrice" label={t('services.defaultPrice')} required className="mb-0">
          <NumberInput min={0} max={MAX_PRICE} step={1} endAddon="₫" inputMode="numeric" />
        </FormField>
      </div>
      <FormField name="active" className="mb-0">
        <Switch label={t('services.activeLabel')} />
      </FormField>
      <p className="text-ui-sm text-muted">{t('services.meteredRule')}</p>

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            form.reset();
            onDone();
          }}
        >
          {t('cancel')}
        </Button>
        <FormSubmit form={form}>
          {(isSubmitting) => (
            <Button type="submit" loading={isSubmitting}>
              {isSubmitting ? t('saving') : t('services.add')}
            </Button>
          )}
        </FormSubmit>
      </div>
    </Form>
  );
}
