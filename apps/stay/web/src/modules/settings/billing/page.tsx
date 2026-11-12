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
  useAppForm,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useStaySettings, useUpdateStaySettings } from '@stay/sdk/react';
import {
  billingCycleErrors,
  isReadingDayMonth,
  MOVE_OUT_FEE_MAX,
  type ReadingDayMonth,
  ROUNDING_UNITS,
  type StaySettings,
} from '@stay/shared';
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
import { ScreenHeader } from '@/libraries/screen-header';
import {
  billingDayOptions,
  graceDaysOptions,
  readingDayMonthOptions,
  roundingUnitOptions,
} from './options';

type BillingValues = {
  readingDay: string;
  readingDayMonth: string;
  issueDay: string;
  dueDay: string;
  graceDays: string;
  roundingUnit: string;
  refundUnusedRent: boolean;
  moveOutFee: number | null;
  transferContentTemplate: string;
};

const FIELDS = [
  'readingDay',
  'readingDayMonth',
  'issueDay',
  'dueDay',
  'graceDays',
  'roundingUnit',
  'refundUnusedRent',
  'moveOutFee',
  'transferContentTemplate',
] as const satisfies (keyof BillingValues)[];

const readingDayMonthOf = (value: string): ReadingDayMonth =>
  isReadingDayMonth(value) ? value : 'same';

function toValues(settings: StaySettings): BillingValues {
  return {
    readingDay: String(settings.readingDay),
    readingDayMonth: settings.readingDayMonth,
    issueDay: String(settings.issueDay),
    dueDay: String(settings.dueDay),
    graceDays: String(settings.graceDays),
    roundingUnit: String(settings.roundingUnit),
    refundUnusedRent: settings.refundUnusedRent,
    moveOutFee: settings.moveOutFee,
    transferContentTemplate: settings.transferContentTemplate,
  };
}

function BillingForm({ settings, onReload }: { settings: StaySettings; onReload: () => void }) {
  const { t } = useTranslation('settings');
  const update = useUpdateStaySettings();
  const [formError, setFormError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);

  const dayOptions = useMemo(() => billingDayOptions(t), [t]);
  const monthOptions = useMemo(() => readingDayMonthOptions(t), [t]);
  const graceOptions = useMemo(() => graceDaysOptions(t), [t]);
  const roundingOptions = useMemo(() => roundingUnitOptions(), []);
  const schema = useMemo(() => {
    const required = v.pipe(v.string(), v.minLength(1, t('validation.required')));

    return {
      readingDay: required,
      readingDayMonth: required,
      issueDay: required,
      dueDay: required,
      graceDays: required,
      roundingUnit: required,
      moveOutFee: v.pipe(
        v.number(t('validation.required')),
        v.integer(t('billing.moveOutFeeRange')),
        v.minValue(0, t('billing.moveOutFeeRange')),
        v.maxValue(MOVE_OUT_FEE_MAX, t('billing.moveOutFeeRange')),
      ),
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
        readingDayMonth: readingDayMonthOf(value.readingDayMonth),
        issueDay: Number(value.issueDay),
        dueDay: Number(value.dueDay),
        graceDays: Number(value.graceDays),
        roundingUnit: ROUNDING_UNITS.find((unit) => String(unit) === value.roundingUnit) ?? 1000,
        refundUnusedRent: value.refundUnusedRent,
        moveOutFee: value.moveOutFee ?? 0,
        transferContentTemplate: value.transferContentTemplate.trim(),
        version: settings.version,
      };

      // Same cross-field rules as the API (`billingCycleErrors`).
      const errors = billingCycleErrors(body);

      if (errors.dueDay) form.setFieldMeta('dueDay', serverError(t('billing.dueBeforeIssue')));
      if (errors.readingDay)
        form.setFieldMeta('readingDay', serverError(t('billing.readingAfterIssue')));
      if (errors.dueDay || errors.readingDay) return;

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
    readingDayMonth: readingDayMonthOf(values.readingDayMonth),
    issueDay: Number(values.issueDay),
    dueDay: Number(values.dueDay),
    graceDays: Number(values.graceDays),
  });

  return (
    <Form form={form} schema={schema} className="grid max-w-4xl gap-5" data-testid="billing-form">
      {prompt}
      {conflict ? <ConflictAlert onReload={onReload} /> : null}
      <FormError message={formError} />

      <section className="grid gap-4 rounded-panel border border-line bg-surface p-4 shadow-panel sm:p-6">
        <h2 className="text-section font-semibold text-ink">{t('billing.cycleTitle')}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            name="readingDayMonth"
            label={t('billing.readingDayMonth')}
            required
            className="mb-0"
          >
            <Select options={monthOptions} hint={t('billing.readingDayMonthHint')} />
          </FormField>
          <FormField name="readingDay" label={t('billing.readingDay')} required className="mb-0">
            <Select options={dayOptions} />
          </FormField>
          <FormField name="issueDay" label={t('billing.issueDay')} required className="mb-0">
            <Select options={dayOptions} />
          </FormField>
          <FormField name="dueDay" label={t('billing.dueDay')} required className="mb-0">
            <Select options={dayOptions} />
          </FormField>
          <FormField
            name="graceDays"
            label={t('billing.graceDays')}
            required
            className="mb-0 md:col-span-2"
          >
            <Select options={graceOptions} hint={t('billing.graceDaysHint')} />
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
        <FormField name="moveOutFee" label={t('billing.moveOutFee')} required className="mb-0">
          <NumberInput
            min={0}
            max={MOVE_OUT_FEE_MAX}
            step={1000}
            endAddon="₫"
            hint={t('billing.moveOutFeeHint')}
          />
        </FormField>
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
      <ScreenHeader title={t('billing.title')} description={t('billing.description')} />

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
