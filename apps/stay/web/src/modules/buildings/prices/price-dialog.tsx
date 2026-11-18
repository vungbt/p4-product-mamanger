import {
  Alert,
  Button,
  DatePicker,
  Dialog,
  Form,
  FormField,
  FormSubmit,
  NumberInput,
  useAppForm,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useSetBuildingPrice } from '@stay/sdk/react';
import { type BuildingServicePrice, isIsoDate } from '@stay/shared';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';
import { displayDate, formatVnd, todayIsoDate } from '@/libraries/format';
import { apiFormErrors, clearServerErrorOnChange, serverError } from '@/libraries/forms/api-errors';
import { FormError } from '@/libraries/forms/page-states';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { useFormDirty, useFormValue } from '@/libraries/forms/use-form-value';
import { MAX_PRICE } from '@/modules/settings/services/service-forms';

export type PriceAction = { mode: 'set' | 'reset'; item: BuildingServicePrice };

type PriceValues = { price: number | null; effectiveFrom: string | null };

const FIELDS = ['price', 'effectiveFrom'] as const satisfies (keyof PriceValues)[];

function PriceForm({
  buildingId,
  action: { mode, item },
  onDone,
}: {
  buildingId: string;
  action: PriceAction;
  onDone: () => void;
}) {
  const { t } = useTranslation('buildings');
  const setPrice = useSetBuildingPrice();
  const [formError, setFormError] = useState<string | null>(null);

  const today = todayIsoDate();
  const schema = useMemo(
    () => ({
      effectiveFrom: v.pipe(
        v.nullable(v.string()),
        v.check((value) => isIsoDate(value), t('prices.dateRequired')),
      ),
      ...(mode === 'set'
        ? {
            price: v.pipe(
              v.number(t('form.required')),
              v.integer(t('prices.priceInteger')),
              v.minValue(0, t('prices.priceRange')),
              v.maxValue(MAX_PRICE, t('prices.priceRange')),
            ),
          }
        : {}),
    }),
    [mode, t],
  );

  const form = useAppForm({
    defaultValues: {
      price: item.source === 'override' ? item.price : null,
      effectiveFrom: today,
    } as PriceValues,
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      setFormError(null);

      if (!value.effectiveFrom) return;

      try {
        await setPrice.mutateAsync({
          id: buildingId,
          body: {
            serviceId: item.serviceId,
            price: mode === 'set' ? (value.price ?? 0) : null,
            effectiveFrom: value.effectiveFrom,
          },
        });
        form.reset();
        toast.success(
          mode === 'set'
            ? t('prices.saved', { name: item.name, date: displayDate(value.effectiveFrom) })
            : t('prices.resetDone', { name: item.name, date: displayDate(value.effectiveFrom) }),
        );
        onDone();
      } catch (error) {
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
  const date = useFormValue(form, (state) => state.values.effectiveFrom);
  const { prompt } = useUnsavedChanges(dirty);

  return (
    <Form form={form} schema={schema} className="grid gap-4" data-testid="price-form">
      {prompt}
      <FormError message={formError} />

      <p className="text-ui-sm text-muted">
        {t('prices.defaultIs', { price: formatVnd(item.defaultPrice), unit: item.unit })}
      </p>

      {mode === 'set' ? (
        <FormField name="price" label={t('prices.buildingPrice')} required className="mb-0">
          <NumberInput
            min={0}
            max={MAX_PRICE}
            step={1}
            endAddon="₫"
            inputMode="numeric"
            autoFocus
          />
        </FormField>
      ) : null}
      <FormField name="effectiveFrom" label={t('prices.effectiveFrom')} required className="mb-0">
        <DatePicker clearable={false} />
      </FormField>

      {date && date < today ? <Alert tone="warning">{t('prices.pastDate')}</Alert> : null}
      <Alert tone="info">{t('prices.rule')}</Alert>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>
          {t('cancel')}
        </Button>
        <FormSubmit form={form}>
          {(isSubmitting) => (
            <Button
              type="submit"
              variant={mode === 'set' ? 'primary' : 'danger'}
              loading={isSubmitting}
            >
              {isSubmitting
                ? t('saving')
                : mode === 'set'
                  ? t('prices.setSubmit')
                  : t('prices.resetSubmit')}
            </Button>
          )}
        </FormSubmit>
      </div>
    </Form>
  );
}

/** "Đặt giá riêng từ một ngày" / "Bỏ giá riêng (về mặc định từ một ngày)" (O-06). */
export function PriceDialog({
  buildingId,
  action,
  onClose,
}: {
  buildingId: string;
  action: PriceAction | null;
  onClose: () => void;
}) {
  const { t } = useTranslation('buildings');

  return (
    <Dialog
      open={Boolean(action)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        action
          ? t(action.mode === 'set' ? 'prices.setTitle' : 'prices.resetTitle', {
              name: action.item.name,
            })
          : t('prices.title')
      }
      data-testid="price-dialog"
    >
      {action ? <PriceForm buildingId={buildingId} action={action} onDone={onClose} /> : null}
    </Dialog>
  );
}
