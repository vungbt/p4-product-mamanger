import {
  Alert,
  Button,
  Form,
  FormField,
  FormSubmit,
  Icon,
  Input,
  NumberInput,
  Select,
  type SelectOption,
  Textarea,
  useAppForm,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import {
  useBuilding,
  useCreateBuilding,
  useStaySettings,
  useUpdateBuilding,
} from '@stay/sdk/react';
import {
  BUILDING_CODE_PATTERN,
  billingCycleErrors,
  isReadingDayMonth,
  MOVE_OUT_FEE_MAX,
  ROUNDING_UNITS,
  type StayBuildingDetail,
  type StaySettings,
  suggestBuildingCode,
} from '@stay/shared';
import type { TFunction } from 'i18next';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import * as v from 'valibot';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { billingPreview, formatVnd } from '@/libraries/format';
import {
  apiFormErrors,
  clearServerErrorOnChange,
  isNotFound,
  isVersionConflict,
  serverError,
} from '@/libraries/forms/api-errors';
import { ConflictAlert, FormError, LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { useFormDirty, useFormValue } from '@/libraries/forms/use-form-value';
import { ScreenHeader } from '@/libraries/screen-header';
import NotFoundPage from '@/modules/errors/not-found-page';
import {
  billingDayLabel,
  billingDayOptions,
  graceDaysLabel,
  graceDaysOptions,
  readingDayMonthOptions,
} from '@/modules/settings/billing/options';
import { buildingPricesPath, ROUTES } from '@/routing/route-configs';
import { BANK_OPTIONS } from '../banks';
import { AutomationSettings } from './automation-settings';
import { VietQrPreview } from './vietqr-preview';

/** Select value meaning "use the system setting" (`null` in the API). */
const SYSTEM = 'system';

type BuildingValues = {
  code: string;
  name: string;
  address: string;
  readingDay: string;
  readingDayMonth: string;
  issueDay: string;
  dueDay: string;
  graceDays: string;
  roundingUnit: string;
  refundUnusedRent: string;
  /** `null` = follow the system setting. */
  moveOutFee: number | null;
  bankBin: string;
  bankAccount: string;
  bankAccountName: string;
  rulesText: string;
  contactPhone: string;
};

const FIELDS = [
  'code',
  'name',
  'address',
  'readingDay',
  'readingDayMonth',
  'issueDay',
  'dueDay',
  'graceDays',
  'roundingUnit',
  'refundUnusedRent',
  'moveOutFee',
  'bankBin',
  'bankAccount',
  'bankAccountName',
  'rulesText',
  'contactPhone',
] as const satisfies (keyof BuildingValues)[];

const BANK_FIELDS = ['bankBin', 'bankAccount', 'bankAccountName'] as const;

const EMPTY_VALUES: BuildingValues = {
  code: '',
  name: '',
  address: '',
  readingDay: SYSTEM,
  readingDayMonth: SYSTEM,
  issueDay: SYSTEM,
  dueDay: SYSTEM,
  graceDays: SYSTEM,
  roundingUnit: SYSTEM,
  refundUnusedRent: SYSTEM,
  moveOutFee: null,
  bankBin: '',
  bankAccount: '',
  bankAccountName: '',
  rulesText: '',
  contactPhone: '',
};

function toValues(building: StayBuildingDetail): BuildingValues {
  const choice = (value: number | null) => (value === null ? SYSTEM : String(value));

  return {
    code: building.code,
    name: building.name,
    address: building.address ?? '',
    readingDay: choice(building.readingDay),
    readingDayMonth: building.readingDayMonth ?? SYSTEM,
    issueDay: choice(building.issueDay),
    dueDay: choice(building.dueDay),
    graceDays: choice(building.graceDays),
    roundingUnit: choice(building.roundingUnit),
    refundUnusedRent:
      building.refundUnusedRent === null ? SYSTEM : building.refundUnusedRent ? 'yes' : 'no',
    moveOutFee: building.moveOutFee,
    bankBin: building.bankBin ?? '',
    bankAccount: building.bankAccount ?? '',
    bankAccountName: building.bankAccountName ?? '',
    rulesText: building.rulesText ?? '',
    contactPhone: building.contactPhone ?? '',
  };
}

/** Account holder as banks print it: upper case, no diacritics (spaces kept while typing). */
function accountNameText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[đĐ]/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/ {2,}/g, ' ');
}

const codeText = (value: unknown) =>
  String(value ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);

const daysOrSystem = (value: string) => (value === SYSTEM ? null : Number(value));
const monthOrSystem = (value: string) => (isReadingDayMonth(value) ? value : null);
const compact = (value: string) => value.replace(/[\s.-]/g, '');

function buildingSchema(t: TFunction<'buildings'>) {
  const optionalText = (max: number) =>
    v.pipe(v.string(), v.maxLength(max, t('form.maxLength', { max })));

  return {
    code: v.pipe(
      v.string(),
      v.trim(),
      v.minLength(1, t('form.required')),
      v.regex(BUILDING_CODE_PATTERN, t('form.codeFormat')),
    ),
    name: v.pipe(
      v.string(),
      v.trim(),
      v.minLength(1, t('form.required')),
      v.maxLength(120, t('form.maxLength', { max: 120 })),
    ),
    address: optionalText(255),
    bankAccount: v.pipe(
      v.string(),
      v.check(
        (value) => !value.trim() || /^[0-9A-Za-z]{4,19}$/.test(value.replace(/\s+/g, '')),
        t('form.accountFormat'),
      ),
    ),
    bankAccountName: v.pipe(
      v.string(),
      v.maxLength(50, t('form.maxLength', { max: 50 })),
      v.regex(/^[A-Z0-9 ]*$/, t('form.accountNameFormat')),
    ),
    rulesText: optionalText(5000),
    contactPhone: v.pipe(
      v.string(),
      v.check(
        (value) => !value.trim() || /^0\d{9,10}$/.test(compact(value)),
        t('form.phoneFormat'),
      ),
    ),
  };
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 rounded-panel border border-line bg-surface p-4 shadow-panel sm:p-6">
      <div className="grid gap-1">
        <h2 className="text-section font-semibold text-ink">{title}</h2>
        {description ? <p className="text-ui-sm text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function BuildingForm({
  building,
  settings,
  onReload,
}: {
  building: StayBuildingDetail | null;
  settings: StaySettings | undefined;
  onReload: () => void;
}) {
  const { t } = useTranslation('buildings');
  const { t: ts } = useTranslation('settings');
  const navigate = useNavigate();
  const create = useCreateBuilding();
  const update = useUpdateBuilding();
  const [formError, setFormError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  // Last code filled from the name; a different code means the user typed their own.
  const suggestedCode = useRef('');

  const archived = Boolean(building?.archivedAt);
  const schema = useMemo(() => buildingSchema(t), [t]);

  const systemOption = (label: string | null): SelectOption => ({
    value: SYSTEM,
    label: label ? t('form.systemValue', { value: label }) : t('form.system'),
  });
  const dayOptions = (day: number | undefined) => [
    systemOption(day === undefined ? null : billingDayLabel(ts, day)),
    ...billingDayOptions(ts),
  ];
  const monthOptions = [
    systemOption(settings ? ts(`billing.readingDayMonths.${settings.readingDayMonth}`) : null),
    ...readingDayMonthOptions(ts),
  ];
  const graceOptions = [
    systemOption(settings ? graceDaysLabel(ts, settings.graceDays) : null),
    ...graceDaysOptions(ts),
  ];
  const roundingOptions = [
    systemOption(settings ? formatVnd(settings.roundingUnit) : null),
    ...ROUNDING_UNITS.map((unit) => ({ value: String(unit), label: formatVnd(unit) })),
  ];
  const refundOptions = [
    systemOption(
      settings ? t(settings.refundUnusedRent ? 'form.refundYes' : 'form.refundNo') : null,
    ),
    { value: 'yes', label: t('form.refundYes') },
    { value: 'no', label: t('form.refundNo') },
  ];

  const form = useAppForm({
    defaultValues: building ? toValues(building) : EMPTY_VALUES,
    listeners: {
      onChange: (event) => {
        clearServerErrorOnChange.onChange(event);

        // A new building takes its code from the name until the user edits the code.
        if (building || event.fieldApi.name !== 'name') return;

        const code = event.formApi.getFieldValue('code');

        if (code !== suggestedCode.current) return;
        suggestedCode.current = suggestBuildingCode(String(event.fieldApi.state.value ?? ''));
        event.formApi.setFieldValue('code', suggestedCode.current);
      },
    },
    onSubmit: async ({ value }) => {
      setFormError(null);
      setConflict(false);

      const body = {
        code: value.code.trim(),
        name: value.name.trim(),
        address: value.address.trim() || null,
        readingDay: daysOrSystem(value.readingDay),
        readingDayMonth: monthOrSystem(value.readingDayMonth),
        issueDay: daysOrSystem(value.issueDay),
        dueDay: daysOrSystem(value.dueDay),
        graceDays: daysOrSystem(value.graceDays),
        roundingUnit: ROUNDING_UNITS.find((unit) => String(unit) === value.roundingUnit) ?? null,
        refundUnusedRent:
          value.refundUnusedRent === SYSTEM ? null : value.refundUnusedRent === 'yes',
        moveOutFee: value.moveOutFee,
        bankBin: value.bankBin || null,
        bankAccount: value.bankAccount.replace(/\s+/g, '') || null,
        bankAccountName: value.bankAccountName.trim() || null,
        rulesText: value.rulesText.trim() || null,
        contactPhone: compact(value.contactPhone) || null,
      };

      // Bank details go together; the due day cannot precede the issue day (effective values).
      let invalid = false;

      if (BANK_FIELDS.some((field) => body[field]))
        for (const field of BANK_FIELDS)
          if (!body[field]) {
            form.setFieldMeta(field, serverError(t('form.bankIncomplete')));
            invalid = true;
          }

      // Cycle rules on the effective values, as the API checks them (`billingCycleErrors`).
      if (settings) {
        const errors = billingCycleErrors({
          readingDay: body.readingDay ?? settings.readingDay,
          readingDayMonth: body.readingDayMonth ?? settings.readingDayMonth,
          issueDay: body.issueDay ?? settings.issueDay,
          dueDay: body.dueDay ?? settings.dueDay,
          graceDays: body.graceDays ?? settings.graceDays,
        });

        if (errors.dueDay) {
          form.setFieldMeta('dueDay', serverError(ts('billing.dueBeforeIssue')));
          invalid = true;
        }
        if (errors.readingDay) {
          form.setFieldMeta('readingDay', serverError(ts('billing.readingAfterIssue')));
          invalid = true;
        }
      }
      if (invalid) return;

      try {
        if (building) {
          await update.mutateAsync({
            id: building.id,
            body: { ...body, version: building.version },
          });
          toast.success(t('form.saved', { name: body.name }));
        } else {
          const created = await create.mutateAsync(body);

          allowNavigation();
          toast.success(t('form.created', { name: created.name }));
          navigate(ROUTES.buildings);
        }
      } catch (error) {
        if (isVersionConflict(error)) {
          setConflict(true);
          return;
        }

        const errors = apiFormErrors(error, FIELDS, t('form.saveFailed'));

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
  const { prompt, allowNavigation } = useUnsavedChanges(dirty);

  const effective = settings
    ? {
        readingDay: daysOrSystem(values.readingDay) ?? settings.readingDay,
        readingDayMonth: monthOrSystem(values.readingDayMonth) ?? settings.readingDayMonth,
        issueDay: daysOrSystem(values.issueDay) ?? settings.issueDay,
        dueDay: daysOrSystem(values.dueDay) ?? settings.dueDay,
        graceDays: daysOrSystem(values.graceDays) ?? settings.graceDays,
      }
    : null;

  const cancel = () => {
    navigate(ROUTES.buildings);
  };

  return (
    <Form form={form} schema={schema} className="grid max-w-4xl gap-5" data-testid="building-form">
      {prompt}
      {archived ? <Alert tone="warning">{t('form.archivedNotice')}</Alert> : null}
      {conflict ? <ConflictAlert onReload={onReload} /> : null}
      <FormError message={formError} />

      <Section title={t('form.generalTitle')}>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            name="code"
            label={t('form.code')}
            required
            className="mb-0"
            mapOnChange={codeText}
          >
            <Input
              maxLength={6}
              autoCapitalize="characters"
              disabled={building?.codeLocked}
              hint={
                building?.codeLocked
                  ? t('form.codeLocked')
                  : t(building ? 'form.codeHint' : 'form.codeSuggestHint')
              }
            />
          </FormField>
          <FormField name="name" label={t('form.name')} required className="mb-0 md:col-span-2">
            <Input maxLength={120} />
          </FormField>
        </div>
        <FormField name="address" label={t('form.address')} className="mb-0">
          <Input maxLength={255} autoComplete="street-address" />
        </FormField>
      </Section>

      <Section title={t('form.billingTitle')} description={t('form.billingDescription')}>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField name="readingDayMonth" label={ts('billing.readingDayMonth')} className="mb-0">
            <Select options={monthOptions} hint={ts('billing.readingDayMonthHint')} />
          </FormField>
          <FormField name="readingDay" label={ts('billing.readingDay')} className="mb-0">
            <Select options={dayOptions(settings?.readingDay)} />
          </FormField>
          <FormField name="issueDay" label={ts('billing.issueDay')} className="mb-0">
            <Select options={dayOptions(settings?.issueDay)} />
          </FormField>
          <FormField name="dueDay" label={ts('billing.dueDay')} className="mb-0">
            <Select options={dayOptions(settings?.dueDay)} />
          </FormField>
          <FormField
            name="graceDays"
            label={ts('billing.graceDays')}
            className="mb-0 md:col-span-2"
          >
            <Select options={graceOptions} hint={ts('billing.graceDaysHint')} />
          </FormField>
          <FormField name="roundingUnit" label={ts('billing.roundingUnit')} className="mb-0">
            <Select options={roundingOptions} />
          </FormField>
          <FormField
            name="refundUnusedRent"
            label={ts('billing.refundUnusedRent')}
            className="mb-0 md:col-span-2"
          >
            <Select options={refundOptions} />
          </FormField>
          <FormField
            name="moveOutFee"
            label={ts('billing.moveOutFee')}
            className="mb-0 md:col-span-3"
          >
            <NumberInput
              min={0}
              max={MOVE_OUT_FEE_MAX}
              step={1000}
              endAddon="₫"
              placeholder={
                settings
                  ? t('form.systemValue', { value: formatVnd(settings.moveOutFee) })
                  : t('form.system')
              }
              hint={t('form.moveOutFeeHint')}
            />
          </FormField>
        </div>
        {effective ? (
          <Alert tone="info" data-testid="building-billing-preview">
            {ts('billing.preview', billingPreview(effective))}
          </Alert>
        ) : null}
      </Section>

      <Section title={t('form.bankTitle')} description={t('form.bankDescription')}>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="grid content-start gap-4 lg:col-span-2">
            <FormField
              name="bankBin"
              label={t('form.bank')}
              className="mb-0"
              mapValue={(value) => value || null}
              mapOnChange={(value) => value ?? ''}
            >
              <Select
                options={BANK_OPTIONS}
                searchable
                clearable
                placeholder={t('form.bankPlaceholder')}
                data-testid="bank-select"
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField name="bankAccount" label={t('form.bankAccount')} className="mb-0">
                <Input maxLength={24} inputMode="numeric" autoComplete="off" />
              </FormField>
              <FormField
                name="bankAccountName"
                label={t('form.bankAccountName')}
                className="mb-0"
                mapOnChange={accountNameText}
              >
                <Input maxLength={50} autoComplete="off" hint={t('form.bankAccountNameHint')} />
              </FormField>
            </div>
          </div>
          <VietQrPreview
            bin={values.bankBin}
            account={values.bankAccount}
            accountName={values.bankAccountName}
          />
        </div>
      </Section>

      <Section title={t('form.tenantTitle')} description={t('form.tenantDescription')}>
        <FormField name="contactPhone" label={t('form.contactPhone')} className="mb-0">
          <Input type="tel" inputMode="tel" maxLength={20} autoComplete="tel" />
        </FormField>
        <FormField name="rulesText" label={t('form.rulesText')} className="mb-0">
          <Textarea rows={5} maxLength={5000} />
        </FormField>
      </Section>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={cancel}>
          {t('cancel')}
        </Button>
        {archived ? null : (
          <FormSubmit form={form}>
            {(isSubmitting) => (
              <Button type="submit" loading={isSubmitting}>
                {isSubmitting ? t('saving') : building ? t('save') : t('form.create')}
              </Button>
            )}
          </FormSubmit>
        )}
      </div>
    </Form>
  );
}

/** O-05 Form toà: `/buildings/new` and `/buildings/:id/edit`. */
export default function BuildingFormPage() {
  const { t } = useTranslation('buildings');
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const { reportMissingBuilding } = useActiveBuilding();
  const settings = useStaySettings();
  const query = useBuilding(id);
  const [reloads, setReloads] = useState(0);

  const missing = Boolean(id) && isNotFound(query.error);

  useEffect(() => {
    if (missing) reportMissingBuilding(id);
  }, [missing, id, reportMissingBuilding]);

  if (missing) return <NotFoundPage />;

  const building = id ? query.data : null;

  const reload = async () => {
    await query.refetch();
    setReloads((count) => count + 1);
  };

  return (
    <div className="grid gap-6">
      <ScreenHeader
        title={
          id
            ? building
              ? t('form.editTitle', { name: building.name })
              : t('form.editTitle', { name: '' })
            : t('form.newTitle')
        }
        description={id ? t('form.editDescription') : t('form.newDescription')}
        action={
          building ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => navigate(buildingPricesPath(building.id))}>
                <Icon name="receipt" className="size-4" aria-hidden />
                {t('form.prices')}
              </Button>
              <Button variant="secondary" onClick={() => navigate(ROUTES.newBuilding)}>
                <Icon name="plus" className="size-4" aria-hidden />
                {t('list.add')}
              </Button>
            </div>
          ) : null
        }
      />

      {id && query.isPending ? (
        <LoadingRows rows={4} />
      ) : id && query.isError && !query.data ? (
        <LoadError error={query.error} onRetry={() => void query.refetch()} />
      ) : building !== undefined ? (
        <BuildingForm
          key={building ? `${building.id}-${building.version}-${reloads}` : 'new'}
          building={building}
          settings={settings.data}
          onReload={() => void reload()}
        />
      ) : null}
      {building && !building.archivedAt ? <AutomationSettings id={building.id} /> : null}
    </div>
  );
}
