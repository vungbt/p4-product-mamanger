import {
  Alert,
  Button,
  Form,
  FormField,
  FormSubmit,
  Input,
  PageHeader,
  Select,
  Switch,
  useAppForm,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useStaySettings, useUpdateStaySettings } from '@stay/sdk/react';
import { ROUNDING_UNITS, type StaySettings } from '@stay/shared';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';
import { billingPreview } from '@/libraries/format';
import {
  apiFormErrors,
  clearServerErrorOnChange,
  isVersionConflict,
  serverError,
} from '@/libraries/forms/api-errors';
import { ConflictAlert, FormError, LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { useFormDirty, useFormValue } from '@/libraries/forms/use-form-value';
import { billingDayOptions, roundingUnitOptions } from './options';

type BillingValues = {
  readingDay: string;
  issueDay: string;
  dueDay: string;
  roundingUnit: string;
  refundUnusedRent: boolean;
  transferContentTemplate: string;
};

const FIELDS = [
  'readingDay',
  'issueDay',
  'dueDay',
  'roundingUnit',
  'refundUnusedRent',
  'transferContentTemplate',
] as const satisfies (keyof BillingValues)[];

function toValues(settings: StaySettings): BillingValues {
  return {
    readingDay: String(settings.readingDay),
    issueDay: String(settings.issueDay),
    dueDay: String(settings.dueDay),
    roundingUnit: String(settings.roundingUnit),
    refundUnusedRent: settings.refundUnusedRent,
    transferContentTemplate: settings.transferContentTemplate,
  };
}

function BillingForm({ settings, onReload }: { settings: StaySettings; onReload: () => void }) {
  const { t } = useTranslation('settings');
  const update = useUpdateStaySettings();
  const [formError, setFormError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);

  const dayOptions = useMemo(() => billingDayOptions(t), [t]);
  const roundingOptions = useMemo(() => roundingUnitOptions(), []);
  const schema = useMemo(() => {
    const required = v.pipe(v.string(), v.minLength(1, t('validation.required')));

    return {
      readingDay: required,
      issueDay: required,
      dueDay: required,
      roundingUnit: required,
      transferContentTemplate: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, t('validation.required')),
        v.maxLength(50, t('validation.maxLength', { max: 50 })),
      ),
    };
  }, [t]);

  const form = useAppForm({
    defaultValues: toValues(settings),
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      setFormError(null);
      setConflict(false);

      const body = {
        readingDay: Number(value.readingDay),
        issueDay: Number(value.issueDay),
        dueDay: Number(value.dueDay),
        roundingUnit: ROUNDING_UNITS.find((unit) => String(unit) === value.roundingUnit) ?? 1000,
        refundUnusedRent: value.refundUnusedRent,
        transferContentTemplate: value.transferContentTemplate.trim(),
        version: settings.version,
      };

      if (body.dueDay < body.issueDay) {
        form.setFieldMeta('dueDay', serverError(t('billing.dueBeforeIssue')));
        return;
      }

      try {
        await update.mutateAsync(body);
        toast.success(t('billing.saved'));
      } catch (error) {
        if (isVersionConflict(error)) {
          setConflict(true);
          return;
        }

        const errors = apiFormErrors(error, FIELDS, t('saveFailed'));

        for (const field of FIELDS) {
          const message = errors.fields[field];

          if (message) form.setFieldMeta(field, serverError(message));
        }
        setFormError(errors.message);
      }
    },
  });

  const dirty = useFormDirty(form);
  const values = useFormValue(form, (state) => state.values);
  const { prompt } = useUnsavedChanges(dirty);

  const preview = billingPreview({
    readingDay: Number(values.readingDay),
    issueDay: Number(values.issueDay),
    dueDay: Number(values.dueDay),
  });

  return (
    <Form form={form} schema={schema} className="grid gap-5" data-testid="billing-form">
      {prompt}
      {conflict ? <ConflictAlert onReload={onReload} /> : null}
      <FormError message={formError} />

      <section className="grid gap-4 rounded-panel border border-line bg-surface p-4 shadow-panel sm:p-6">
        <h2 className="text-section font-semibold text-ink">{t('billing.cycleTitle')}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField name="readingDay" label={t('billing.readingDay')} required className="mb-0">
            <Select options={dayOptions} />
          </FormField>
          <FormField name="issueDay" label={t('billing.issueDay')} required className="mb-0">
            <Select options={dayOptions} />
          </FormField>
          <FormField name="dueDay" label={t('billing.dueDay')} required className="mb-0">
            <Select options={dayOptions} />
          </FormField>
        </div>

        <Alert tone="info" data-testid="billing-preview">
          {t('billing.preview', preview)}
        </Alert>
      </section>

      <section className="grid gap-4 rounded-panel border border-line bg-surface p-4 shadow-panel sm:p-6">
        <h2 className="text-section font-semibold text-ink">{t('billing.moneyTitle')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            name="roundingUnit"
            label={t('billing.roundingUnit')}
            required
            className="mb-0"
          >
            <Select options={roundingOptions} hint={t('billing.roundingHint')} />
          </FormField>
          <FormField
            name="transferContentTemplate"
            label={t('billing.transferTemplate')}
            required
            className="mb-0"
          >
            <Input maxLength={50} hint={t('billing.transferTemplateHint')} />
          </FormField>
        </div>
        <FormField name="refundUnusedRent" className="mb-0">
          <Switch label={t('billing.refundUnusedRent')} />
        </FormField>
        <p className="-mt-2 text-ui-sm text-muted">{t('billing.refundHint')}</p>
      </section>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" disabled={!dirty} onClick={() => form.reset()}>
          {t('discard')}
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

/** O-03 Cài đặt: kỳ thu — system billing defaults that buildings inherit. */
export default function BillingSettingsPage() {
  const { t } = useTranslation('settings');
  const query = useStaySettings();
  const [reloads, setReloads] = useState(0);

  const reload = async () => {
    await query.refetch();
    setReloads((count) => count + 1);
  };

  return (
    <div className="grid gap-6">
      <PageHeader title={t('billing.title')} description={t('billing.description')} />

      {query.isPending ? (
        <LoadingRows rows={3} />
      ) : query.isError && !query.data ? (
        <LoadError error={query.error} onRetry={() => void query.refetch()} />
      ) : query.data ? (
        <BillingForm
          key={`${query.data.version}-${reloads}`}
          settings={query.data}
          onReload={() => void reload()}
        />
      ) : null}
    </div>
  );
}
