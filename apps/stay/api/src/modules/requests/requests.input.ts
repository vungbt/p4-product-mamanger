import { InputValidError } from '@p4/server-core';
import {
  type AnnouncementInput,
  type InboxAcceptInput,
  type InboxRejectInput,
  type InboxReplyInput,
  isIsoDate,
  isoDateInTimeZone,
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_MAX_PHOTOS,
  MAINTENANCE_SEVERITIES,
  normalizePhone,
  normalizePlate,
  type PaymentClaimConfirmInput,
  type PaymentClaimInput,
  type PortalMaintenanceInput,
  TENANT_PHONE_PATTERN,
  TENANT_REQUEST_TYPES,
  type TenantRequestInput,
  type TenantRequestPayload,
  VEHICLE_TYPES,
} from '@stay/shared';
import type { Request } from 'express';
import { type FormBody, formBody } from '@/shared/input.js';

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_TEXT = 2000;

const today = () => isoDateInTimeZone(new Date());

function optionalUuid(body: FormBody, field: string): string | null {
  const value = body.optionalText(field, 36) || null;

  if (value) body.check(field, UUID_PATTERN.test(value));
  return value;
}

function date(body: FormBody, field: string): string {
  const value = body.text(field, 10);

  if (value) body.check(field, isIsoDate(value), 'invalid_date');
  return value;
}

/** Portal "Tôi đã chuyển khoản". The remaining amount is checked by the service. */
export function readPaymentClaimInput(body: FormBody): PaymentClaimInput {
  const input: PaymentClaimInput = {
    amount: body.integer('amount', 1, Number.MAX_SAFE_INTEGER),
    paidOn: date(body, 'paidOn'),
    receiptFileId: optionalUuid(body, 'receiptFileId'),
    reference: body.optionalText('reference', 120) || null,
    note: body.optionalText('note', 500) || null,
  };

  if (!body.errors.paidOn) body.check('paidOn', input.paidOn <= today(), 'date_in_future');
  body.assertValid();
  return input;
}

/** Portal "Báo hỏng" (T-08). */
export function readMaintenanceInput(body: FormBody): PortalMaintenanceInput {
  const input: PortalMaintenanceInput = {
    title: body.text('title', 200),
    description: body.optionalText('description', MAX_TEXT) ?? '',
    category: body.enum('category', MAINTENANCE_CATEGORIES),
    severity: body.isEmpty('severity') ? 'normal' : body.enum('severity', MAINTENANCE_SEVERITIES),
    photoFileIds: body.isEmpty('photoFileIds')
      ? []
      : body.strings('photoFileIds', MAINTENANCE_MAX_PHOTOS, 36),
  };
  const photos = input.photoFileIds ?? [];

  body.check(
    'photoFileIds',
    photos.every((id) => UUID_PATTERN.test(id)),
  );
  body.check('photoFileIds', new Set(photos).size === photos.length);
  body.assertValid();
  return input;
}

/** Validates `payload` for its `type`; field errors come back as `payload.<field>`. */
function readPayload(
  req: Request,
  body: FormBody,
  type: TenantRequestInput['type'],
): TenantRequestPayload {
  const raw: unknown = body.data.payload;

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    body.invalid('payload', raw === undefined || raw === null ? 'required_field' : 'invalid_field');
    return { message: '' };
  }
  const sub = formBody(req, raw);
  const payload = ((): TenantRequestPayload => {
    switch (type) {
      case 'move_out':
        return {
          expectedMoveOutDate: date(sub, 'expectedMoveOutDate'),
          reason: sub.optionalText('reason', MAX_TEXT) || null,
        };
      case 'add_occupant': {
        const phone = sub.text('phone', 20);
        const normalized = phone ? normalizePhone(phone) : null;

        if (phone)
          sub.check(
            'phone',
            normalized !== null && TENANT_PHONE_PATTERN.test(normalized),
            'tenant_phone_format',
          );
        return {
          fullName: sub.text('fullName', 120),
          phone: normalized ?? phone,
          fromDate: date(sub, 'fromDate'),
        };
      }
      case 'remove_occupant':
        return { fullName: sub.text('fullName', 120), toDate: date(sub, 'toDate') };
      case 'add_vehicle':
      case 'remove_vehicle': {
        const raw = sub.text('plate', 20);
        const plate = raw ? normalizePlate(raw) : null;

        if (raw) sub.check('plate', plate !== null, 'plate_format');
        return type === 'add_vehicle'
          ? {
              plate: plate ?? raw,
              vehicleType: sub.enum('vehicleType', VEHICLE_TYPES),
              fromDate: date(sub, 'fromDate'),
            }
          : { plate: plate ?? raw, toDate: date(sub, 'toDate') };
      }
      case 'other':
        return { message: sub.text('message', MAX_TEXT) };
    }
  })();

  for (const [field, messages] of Object.entries(sub.errors))
    body.errors[`payload.${field}`] ??= messages;
  return payload;
}

/** Portal "Gửi yêu cầu" (T-09): `{ type, payload }`, the payload checked per type. */
export function readTenantRequestInput(req: Request): TenantRequestInput {
  const body = formBody(req);
  const type = body.enum('type', TENANT_REQUEST_TYPES);
  const payload = body.errors.type ? { message: '' } : readPayload(req, body, type);

  body.assertValid();
  return { type, payload };
}

/** Staff accept: optional reply and overrides of the request payload. */
export function readAcceptInput(body: FormBody): InboxAcceptInput {
  const input: InboxAcceptInput = {
    reply: body.optionalText('reply', MAX_TEXT) || null,
    done: body.isEmpty('done') ? false : body.boolean('done'),
    effectiveDate: null,
    tenantId: optionalUuid(body, 'tenantId'),
    newPrimaryTenantId: optionalUuid(body, 'newPrimaryTenantId'),
    vehicleId: optionalUuid(body, 'vehicleId'),
  };

  if (!body.isEmpty('effectiveDate')) input.effectiveDate = date(body, 'effectiveDate');
  body.assertValid();
  return input;
}

/** Reject (request, maintenance or claim): the reason is required. */
export function readRejectInput(body: FormBody): InboxRejectInput {
  const input = { reason: body.text('reason', MAX_TEXT) };

  body.assertValid();
  return input;
}

export function readReplyInput(body: FormBody): InboxReplyInput {
  const input = { message: body.text('message', MAX_TEXT) };

  body.assertValid();
  return input;
}

/** Confirming a claim may correct the amount, date or reference. */
export function readClaimConfirmInput(body: FormBody): PaymentClaimConfirmInput {
  const input: PaymentClaimConfirmInput = {
    amount: body.isEmpty('amount') ? null : body.integer('amount', 1, Number.MAX_SAFE_INTEGER),
    paidOn: null,
    reference: body.optionalText('reference', 120) || null,
  };

  if (!body.isEmpty('paidOn')) {
    input.paidOn = date(body, 'paidOn');
    if (!body.errors.paidOn) body.check('paidOn', input.paidOn <= today(), 'date_in_future');
  }
  body.assertValid();
  return input;
}

/** O-32 form. `expiresOn` is the last day shown; it cannot be in the past. */
export function readAnnouncementInput(body: FormBody): AnnouncementInput {
  const input: AnnouncementInput = {
    buildingId: body.text('buildingId', 36),
    title: body.text('title', 200),
    body: body.text('body', 5000),
    roomIds: null,
    pinned: body.isEmpty('pinned') ? false : body.boolean('pinned'),
    expiresOn: null,
  };

  if (input.buildingId) body.check('buildingId', UUID_PATTERN.test(input.buildingId));
  if (!body.isEmpty('roomIds')) {
    const ids = body.strings('roomIds', 500, 36);

    body.check(
      'roomIds',
      ids.every((id) => UUID_PATTERN.test(id)),
    );
    input.roomIds = ids.length ? [...new Set(ids)] : null;
  }
  if (!body.isEmpty('expiresOn')) {
    input.expiresOn = date(body, 'expiresOn');
    if (!body.errors.expiresOn)
      body.check('expiresOn', input.expiresOn >= today(), 'date_not_past');
  }
  body.assertValid();
  return input;
}

/** Optional `Idempotency-Key` header (8–128 visible characters). */
export function optionalIdempotencyKey(req: Request): string | null {
  const key = req.get('Idempotency-Key')?.trim();

  if (!key) return null;
  if (!/^[\x21-\x7e]{8,128}$/.test(key))
    throw new InputValidError('input_valid_error', {
      idempotencyKey: ['Idempotency-Key gồm 8–128 ký tự.'],
    });
  return key;
}
