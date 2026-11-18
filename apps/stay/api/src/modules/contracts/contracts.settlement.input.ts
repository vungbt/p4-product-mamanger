import { InputValidError } from '@p4/server-core';
import {
  type ContractNoticeInput,
  type ContractSettleInput,
  type ContractSettlementInput,
  type ContractVersionInput,
  isIsoDate,
  MANUAL_PAYMENT_METHODS,
  type SettlementSurchargeInput,
} from '@stay/shared';
import type { Request } from 'express';
import type { FormBody } from '@/shared/input.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_READING = 999_999_999;
const MAX_SURCHARGES = 20;

export function readNoticeInput(body: FormBody): ContractNoticeInput {
  const input = {
    version: body.integer('version', 1),
    expectedMoveOutDate: body.text('expectedMoveOutDate', 10),
    note: body.optionalText('note', 2000) || null,
  };

  body.check('expectedMoveOutDate', isIsoDate(input.expectedMoveOutDate), 'invalid_date');
  body.assertValid();
  return input;
}

export function readVersionInput(body: FormBody): ContractVersionInput {
  const input = { version: body.integer('version', 1) };

  body.assertValid();
  return input;
}

/** `undefined` when omitted: the settlement then adds the building's `moveOutFee` line. */
function readSurcharges(body: FormBody): SettlementSurchargeInput[] | undefined {
  if (body.isEmpty('surcharges')) return undefined;
  const raw = body.data.surcharges;

  if (!Array.isArray(raw) || raw.length > MAX_SURCHARGES) {
    body.invalid('surcharges');
    return [];
  }

  return raw.flatMap((item: unknown, index): SettlementSurchargeInput[] => {
    const amount: unknown =
      item && typeof item === 'object' ? Reflect.get(item, 'amount') : undefined;
    const reason: unknown =
      item && typeof item === 'object' ? Reflect.get(item, 'reason') : undefined;
    const text = typeof reason === 'string' ? reason.trim() : '';
    const validAmount =
      typeof amount === 'number' &&
      Number.isSafeInteger(amount) &&
      amount > 0 &&
      amount <= 1_000_000_000;

    body.check(`surcharges.${index}.amount`, validAmount, 'invalid_field');
    body.check(`surcharges.${index}.reason`, text.length > 0, 'required_field');
    body.check(`surcharges.${index}.reason`, text.length <= 500, 'too_long', { max: 500 });
    return validAmount && text && text.length <= 500 ? [{ amount, reason: text }] : [];
  });
}

/** Body of the settlement preview; `settle` adds `version` and `refundMethod`. */
export function readSettlementInput(body: FormBody): ContractSettlementInput {
  const reading = (field: 'finalElectric' | 'finalWater') =>
    body.isEmpty(field) ? null : body.integer(field, 0, MAX_READING);
  const photo = (field: 'electricPhotoFileId' | 'waterPhotoFileId') => {
    const id = body.optionalText(field, 36) || null;

    if (id) body.check(field, UUID.test(id));
    return id;
  };
  const input: ContractSettlementInput = {
    moveOutDate: body.text('moveOutDate', 10),
    finalElectric: reading('finalElectric'),
    finalWater: reading('finalWater'),
    electricPhotoFileId: photo('electricPhotoFileId'),
    waterPhotoFileId: photo('waterPhotoFileId'),
    surcharges: readSurcharges(body),
  };

  body.check('moveOutDate', isIsoDate(input.moveOutDate), 'invalid_date');
  return input;
}

export function readSettleInput(body: FormBody): ContractSettleInput {
  const input: ContractSettleInput = {
    ...readSettlementInput(body),
    version: body.integer('version', 1),
    refundMethod: body.isEmpty('refundMethod')
      ? 'cash'
      : body.enum('refundMethod', MANUAL_PAYMENT_METHODS),
  };

  body.assertValid();
  return input;
}

/** Validates a preview body (no version). */
export function readSettlementPreviewInput(body: FormBody): ContractSettlementInput {
  const input = readSettlementInput(body);

  body.assertValid();
  return input;
}

/** Settlement must not run twice: the client sends one key per confirmation. */
export function settleIdempotencyKey(req: Request): string {
  const key = req.get('Idempotency-Key');

  if (!key)
    throw new InputValidError('input_valid_error', {
      idempotencyKey: ['Idempotency-Key là bắt buộc.'],
    });
  return key;
}
