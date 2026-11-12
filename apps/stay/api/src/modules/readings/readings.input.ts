import type { MeterReadingInput, MeterReplacementInput } from '@stay/shared';
import { isIsoDate, isPeriod, METER_READING_MAX } from '@stay/shared';
import type { FormBody } from '@/shared/input.js';
import { UUID_PATTERN } from '../expenses/expenses.input.js';

export function readReadingInput(body: FormBody): MeterReadingInput {
  const meterId = body.text('meterId', 36);
  const period = body.text('period', 7);
  const reading = body.integer('reading', 0, METER_READING_MAX);
  const readOn = body.text('readOn', 10);
  const photoFileId = body.optionalText('photoFileId', 36) || null;
  const version = body.integer('version', 0);
  const confirmHighConsumption = body.isEmpty('confirmHighConsumption')
    ? false
    : body.boolean('confirmHighConsumption');

  body.check('meterId', UUID_PATTERN.test(meterId));
  body.check('period', isPeriod(period));
  // The reading window depends on the building cycle; `saveReading` checks it.
  body.check('readOn', isIsoDate(readOn));
  if (photoFileId) body.check('photoFileId', UUID_PATTERN.test(photoFileId));
  body.assertValid();
  return { meterId, period, reading, readOn, photoFileId, version, confirmHighConsumption };
}

export function readReplacementInput(body: FormBody): MeterReplacementInput {
  const finalReading = body.integer('finalReading', 0, METER_READING_MAX);
  const initialReading = body.integer('initialReading', 0, METER_READING_MAX);
  const replacedOn = body.text('replacedOn', 10);
  const serial = body.optionalText('serial', 40) || null;
  const confirmHighConsumption = body.isEmpty('confirmHighConsumption')
    ? false
    : body.boolean('confirmHighConsumption');

  body.check('replacedOn', isIsoDate(replacedOn));
  body.assertValid();
  return { finalReading, initialReading, replacedOn, serial, confirmHighConsumption };
}
