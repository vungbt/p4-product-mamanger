import {
  isIsoDate,
  isoDateInTimeZone,
  PAYMENT_METHODS,
  type PaymentInput,
  type PaymentReverseInput,
} from '@stay/shared';
import type { FormBody } from '@/shared/input.js';

export function readPaymentInput(body: FormBody): PaymentInput {
  const input = {
    amount: body.integer('amount', 1, Number.MAX_SAFE_INTEGER),
    method: body.enum('method', PAYMENT_METHODS),
    paidOn: body.text('paidOn', 10),
    reference: body.optionalText('reference', 120) || null,
    note: body.optionalText('note', 2000) || null,
  };

  if (body.check('paidOn', isIsoDate(input.paidOn), 'invalid_date'))
    body.check('paidOn', input.paidOn <= isoDateInTimeZone(new Date()), 'date_in_future');
  body.assertValid();
  return input;
}

export function readPaymentReverseInput(body: FormBody): PaymentReverseInput {
  const input = { reason: body.text('reason', 2000) };

  body.assertValid();
  return input;
}
