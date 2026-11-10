import { InputValidError } from '@p4/server-core';
import {
  type InvoiceIssueInput,
  type InvoiceLineInput,
  type InvoiceVoidInput,
  isPeriod,
  MANUAL_INVOICE_LINE_TYPES,
  type Period,
} from '@stay/shared';
import type { Request } from 'express';
import type { FormBody } from '@/shared/input.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** At most one building's rooms per issue request. */
const MAX_ISSUE_IDS = 400;

export function routePeriod(req: Request): Period {
  const period = req.params.period;

  if (!isPeriod(period))
    throw new InputValidError('input_valid_error', { period: ['Kỳ phải có dạng YYYY-MM.'] });
  return period;
}

/** Required for bulk draft creation: replays with the same key never create duplicates. */
export function requiredIdempotencyKey(req: Request): string {
  const key = req.get('Idempotency-Key');

  if (!key)
    throw new InputValidError('input_valid_error', {
      idempotencyKey: ['Idempotency-Key là bắt buộc.'],
    });
  return key;
}

function optionalVersion(body: FormBody): number | undefined {
  return body.isEmpty('version') ? undefined : body.integer('version', 1);
}

export function readInvoiceLineInput(body: FormBody): InvoiceLineInput {
  const input = {
    type: body.enum('type', MANUAL_INVOICE_LINE_TYPES),
    amount: body.integer('amount', 1, 1_000_000_000),
    reason: body.text('reason', 255),
    version: optionalVersion(body),
  };

  body.assertValid();
  return input;
}

export function readInvoiceIssueInput(body: FormBody): InvoiceIssueInput {
  const raw = body.data.ids;
  const ids = body.strings('ids', MAX_ISSUE_IDS, 36);

  body.check(
    'ids',
    Array.isArray(raw) &&
      raw.length > 0 &&
      ids.length === raw.length &&
      ids.every((id) => UUID.test(id)),
  );
  body.assertValid();
  return { ids };
}

export function readInvoiceVoidInput(body: FormBody): InvoiceVoidInput {
  const input = { reason: body.text('reason', 2000), version: optionalVersion(body) };

  body.assertValid();
  return input;
}
