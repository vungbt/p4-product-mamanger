import { InputValidError } from '@p4/server-core';
import {
  type DuplicateTenantRef,
  isoDateInTimeZone,
  normalizeIdNumber,
  normalizePhone,
  normalizePlate,
  parseVietnameseDate,
  type StayUser,
  TENANT_DOCUMENT_KINDS,
  TENANT_GENDERS,
  type TenantDocumentKind,
  type TenantGender,
  VEHICLE_TYPES,
  type VehicleType,
} from '@stay/shared';
import { Op, type Transaction } from 'sequelize';
import { canAccessRecord } from '@/middlewares/ability.middleware.js';
import { sequelize, TenantModel, UserModel } from '@/sequelize/models/index.js';
import type { FormBody } from '@/shared/input.js';

/** Editable profile fields of a tenant (form and import). */
export interface TenantFields {
  fullName: string;
  phone: string;
  email: string | null;
  idNumber: string | null;
  idIssuedAt: string | null;
  birthDate: string | null;
  gender: TenantGender | null;
  hometown: string | null;
  permanentAddress: string | null;
  occupation: string | null;
  note: string | null;
}

export const TENANT_TEXT_LIMITS = {
  fullName: 120,
  phone: 20,
  email: 255,
  idNumber: 20,
  idIssuedAt: 10,
  birthDate: 10,
  gender: 10,
  hometown: 255,
  permanentAddress: 255,
  occupation: 255,
  note: 2000,
} satisfies Record<keyof TenantFields, number>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** `Nam`/`Nữ`/`Khác` (any case or accents) or the API values. */
const GENDER_LABELS: Record<string, TenantGender> = {
  male: 'male',
  nam: 'male',
  female: 'female',
  nu: 'female',
  other: 'other',
  khac: 'other',
};

/** Lower case without Vietnamese accents (`Nữ` → `nu`, `Đ` → `d`). */
export function foldText(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();
}

/** Reports one invalid field with an `error:` translation key. */
export type FieldFail = (
  field: keyof TenantFields,
  key: string,
  options?: Record<string, unknown>,
) => void;

/**
 * Normalises raw text values of a tenant and reports every invalid field through `fail`.
 * `read` returns the trimmed text, `''`/`undefined` for empty. Only name and phone are required;
 * nothing is filled in for missing values.
 */
export function normalizeTenantFields(
  read: (field: keyof TenantFields) => string | undefined,
  fail: FieldFail,
): TenantFields {
  const text = (field: keyof TenantFields) => {
    const value = read(field)?.trim();

    if (value && value.length > TENANT_TEXT_LIMITS[field])
      fail(field, 'too_long', { max: TENANT_TEXT_LIMITS[field] });
    return value || null;
  };
  const today = isoDateInTimeZone(new Date());
  const date = (field: 'idIssuedAt' | 'birthDate') => {
    const value = text(field);

    if (!value) return null;

    const parsed = parseVietnameseDate(value);

    if (!parsed) fail(field, 'date_format');
    else if (parsed > today) fail(field, 'date_in_future');
    return parsed;
  };

  const fullName = text('fullName')?.replace(/\s+/g, ' ') ?? '';
  const rawPhone = text('phone');
  const phone = rawPhone ? normalizePhone(rawPhone) : null;
  const email = text('email');
  const rawIdNumber = text('idNumber');
  const idNumber = rawIdNumber ? normalizeIdNumber(rawIdNumber) : null;
  const rawGender = text('gender');
  const gender = rawGender ? (GENDER_LABELS[foldText(rawGender)] ?? null) : null;

  if (!fullName) fail('fullName', 'required_field');
  if (!rawPhone) fail('phone', 'required_field');
  else if (!phone) fail('phone', 'tenant_phone_format');
  if (email && !EMAIL_PATTERN.test(email)) fail('email', 'email_format');
  if (rawIdNumber && !idNumber) fail('idNumber', 'id_number_format');
  if (rawGender && !gender) fail('gender', 'gender_value');

  return {
    fullName,
    phone: phone ?? '',
    email: email?.toLowerCase() ?? null,
    idNumber,
    idIssuedAt: date('idIssuedAt'),
    birthDate: date('birthDate'),
    gender,
    hometown: text('hometown'),
    permanentAddress: text('permanentAddress'),
    occupation: text('occupation'),
    note: text('note'),
  };
}

/**
 * The tenant already holding `idNumber` (any building, archived included), else `null`.
 * `tenantId` is withheld when `user` may not read that tenant's building.
 */
export async function idNumberOwner(
  user: StayUser,
  idNumber: string,
  excludeId?: string,
  transaction?: Transaction,
): Promise<DuplicateTenantRef | null> {
  const owner = await TenantModel.findOne({
    attributes: ['id', 'buildingId'],
    where: { idNumber, ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}) },
    transaction,
  });

  if (!owner) return null;
  return {
    field: 'idNumber',
    tenantId: canAccessRecord(user, 'read', 'Tenant', { buildingId: owner.buildingId })
      ? owner.id
      : null,
  };
}

/**
 * Body of `POST /api/tenants` and `PUT /api/tenants/:id`. Every field error is reported at once;
 * a CCCD already in use adds `extensions.duplicateTenant` (link to that profile when visible).
 * On update, leaving `idNumber` out keeps the stored CCCD (forms only see it masked).
 */
export async function readTenantInput(
  body: FormBody,
  user: StayUser,
  existing?: { id: string; idNumber: string | null; userId?: string | null },
): Promise<TenantFields> {
  const keepIdNumber = existing !== undefined && body.data.idNumber === undefined;
  const fields = normalizeTenantFields(
    (field) => (field === 'idNumber' && keepIdNumber ? undefined : body.optionalText(field, 5000)),
    (field, key, options) => body.invalid(field, key, options),
  );

  if (keepIdNumber) fields.idNumber = existing.idNumber;
  if (body.data.gender !== undefined && body.data.gender !== null && !body.errors.gender)
    body.check(
      'gender',
      TENANT_GENDERS.some((gender) => gender === body.data.gender),
    );

  const duplicate =
    fields.idNumber && !body.errors.idNumber
      ? await idNumberOwner(user, fields.idNumber, existing?.id)
      : null;

  if (duplicate) body.invalid('idNumber', 'id_number_taken');
  if (fields.email && !body.errors.email) {
    const taken = await UserModel.findOne({
      where: {
        [Op.and]: [
          sequelize.where(sequelize.fn('lower', sequelize.col('email')), fields.email),
          ...(existing?.userId ? [{ id: { [Op.ne]: existing.userId } }] : []),
        ],
      },
    });

    if (taken) body.invalid('email', 'unique_value', { attribute: 'Email' });
  }
  if (Object.keys(body.errors).length)
    throw new InputValidError('input_valid_error', {
      ...body.errors,
      ...(duplicate ? { duplicateTenant: duplicate } : {}),
    });
  return fields;
}

export interface VehicleInput {
  plate: string;
  type: VehicleType;
  note: string | null;
}

/** Body of `POST`/`PUT /api/tenants/:id/vehicles[/:vehicleId]`. */
export function readVehicleInput(body: FormBody): VehicleInput {
  const raw = body.text('plate', 20);
  const plate = raw ? normalizePlate(raw) : null;

  if (raw && !body.errors.plate) body.check('plate', plate !== null, 'plate_format');

  const input = {
    plate: plate ?? '',
    type: body.enum('type', VEHICLE_TYPES),
    note: body.optionalText('note', 255) || null,
  };

  body.assertValid();
  return input;
}

/** Body of `POST /api/tenants/:id/documents`. */
export function readDocumentInput(body: FormBody): { kind: TenantDocumentKind; fileId: string } {
  const input = { kind: body.enum('kind', TENANT_DOCUMENT_KINDS), fileId: body.text('fileId', 36) };

  if (!body.errors.fileId)
    body.check(
      'fileId',
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.fileId),
    );
  body.assertValid();
  return input;
}
