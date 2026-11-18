/**
 * `FormField` mappers for a kit `DatePicker` bound to a `YYYY-MM-DD` string field that is `''`
 * when empty: the picker reads `null` for "no date" (so its calendar opens on today) and a
 * cleared picker writes `''` back, keeping form values and API payloads unchanged.
 *
 * Usage: `<FormField name="paidOn" label="Ngày thu" {...DATE_FIELD}><DatePicker /></FormField>`.
 */
export const DATE_FIELD = {
  mapValue: (value: unknown) => value || null,
  mapOnChange: (value: unknown) => value ?? '',
};
