import { type DepositInput, isIsoDate } from '@stay/shared';
import type { FormBody } from '@/shared/input.js';

export function readDepositInput(body: FormBody): DepositInput {
  const type = body.enum('type', ['received', 'refunded', 'forfeited']);
  const amount = body.integer('amount', 1, Number.MAX_SAFE_INTEGER);
  const occurredOn = body.text('occurredOn', 10);
  const method = body.enum('method', ['cash', 'bank_transfer', 'other']);
  const reason = body.optionalText('reason', 2000) || null;

  body.check('occurredOn', isIsoDate(occurredOn));
  body.check('reason', type !== 'forfeited' || Boolean(reason), 'required_field');
  body.assertValid();
  return { type, amount, occurredOn, method, reason };
}
