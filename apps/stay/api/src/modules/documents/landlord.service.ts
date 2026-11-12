import {
  ID_NUMBER_PATTERN,
  isIsoDate,
  type LandlordProfile,
  normalizeIdNumber,
  normalizePhone,
  SIGNATURE_IMAGE_MAX_BYTES,
  type StayUser,
} from '@stay/shared';
import type { Transaction } from 'sequelize';
import { LandlordProfileModel } from '@/sequelize/models/index.js';
import type { SignatureFormat } from '@/sequelize/models/landlord-profile.model.js';
import { setAuditChanges } from '@/shared/audit.js';
import { assertVersion, type FormBody } from '@/shared/input.js';
import { sniffImageFormat } from '../uploads/uploads.storage.js';

export interface SignatureImage {
  bytes: Buffer;
  format: SignatureFormat;
}

/** A PNG/JPEG signature from a `data:` URL (canvas export or picked file); `null` if invalid. */
export function parseSignatureImage(value: string): SignatureImage | null {
  const match = /^data:image\/(png|jpeg|jpg);base64,([A-Za-z0-9+/=]+)$/.exec(value);

  if (!match?.[2]) return null;
  const bytes = Buffer.from(match[2], 'base64');
  const format = sniffImageFormat(bytes);

  if (!bytes.length || bytes.length > SIGNATURE_IMAGE_MAX_BYTES) return null;
  return format === 'png' || format === 'jpg' ? { bytes, format } : null;
}

export const signatureDataUrl = (bytes: Buffer | null, format: SignatureFormat | null) =>
  bytes && format
    ? `data:image/${format === 'jpg' ? 'jpeg' : 'png'};base64,${bytes.toString('base64')}`
    : null;

function profileDto(row: LandlordProfileModel | null, fallbackName: string): LandlordProfile {
  return {
    fullName: row?.fullName ?? fallbackName,
    birthDate: row?.birthDate ?? null,
    idNumber: row?.idNumber ?? null,
    idIssuedAt: row?.idIssuedAt ?? null,
    idIssuedBy: row?.idIssuedBy ?? null,
    permanentAddress: row?.permanentAddress ?? null,
    phone: row?.phone ?? null,
    signatureImage: row ? signatureDataUrl(row.signatureImage, row.signatureFormat) : null,
    signatureUpdatedAt: row?.signatureUpdatedAt?.toISOString() ?? null,
    version: row?.version ?? 0,
  };
}

/** `GET /api/settings/landlord` (O-35): the signed-in owner's profile, empty before saving. */
export async function getLandlordProfile(user: StayUser): Promise<LandlordProfile> {
  const row = await LandlordProfileModel.findOne({ where: { userId: user.id } });

  return profileDto(row, user.displayName);
}

export interface LandlordInput {
  fullName: string;
  birthDate: string | null;
  idNumber: string | null;
  idIssuedAt: string | null;
  idIssuedBy: string | null;
  permanentAddress: string | null;
  phone: string | null;
  /** `undefined` keeps the saved signature, `null` removes it. */
  signature: SignatureImage | null | undefined;
  version: number;
}

export function readLandlordInput(body: FormBody): LandlordInput {
  const optionalDate = (field: string) => {
    const value = body.optionalText(field, 10);

    if (!value) return null;
    body.check(field, isIsoDate(value), 'invalid_date');
    return value;
  };
  const idRaw = body.optionalText('idNumber', 20);
  const idNumber = idRaw ? normalizeIdNumber(idRaw) : null;
  const phoneRaw = body.optionalText('phone', 20);
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  const rawSignature = body.data.signatureImage;
  let signature: SignatureImage | null | undefined;

  if (idRaw) body.check('idNumber', Boolean(idNumber && ID_NUMBER_PATTERN.test(idNumber)));
  if (phoneRaw) body.check('phone', Boolean(phone));
  if (rawSignature === null) signature = null;
  else if (typeof rawSignature === 'string') {
    signature = parseSignatureImage(rawSignature);
    body.check('signatureImage', Boolean(signature), 'signature_invalid');
  } else if (rawSignature !== undefined) body.invalid('signatureImage');

  const input: LandlordInput = {
    fullName: body.text('fullName', 120),
    birthDate: optionalDate('birthDate'),
    idNumber,
    idIssuedAt: optionalDate('idIssuedAt'),
    idIssuedBy: body.optionalText('idIssuedBy', 120) || null,
    permanentAddress: body.optionalText('permanentAddress', 255) || null,
    phone,
    signature,
    version: body.integer('version', 0),
  };

  body.assertValid();
  return input;
}

/**
 * `PUT /api/settings/landlord`: creates (version 0) or updates the profile. Audit facts list the
 * changed field names only: never the CCCD, address or signature.
 */
export async function updateLandlordProfile(
  user: StayUser,
  input: LandlordInput,
  transaction?: Transaction,
): Promise<LandlordProfile> {
  const row = await LandlordProfileModel.findOne({
    where: { userId: user.id },
    transaction,
    ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
  });

  assertVersion(row?.version ?? 0, input.version);
  const { signature, version: _version, ...fields } = input;
  const signatureFields =
    signature === undefined
      ? {}
      : {
          signatureImage: signature?.bytes ?? null,
          signatureFormat: signature?.format ?? null,
          signatureUpdatedAt: new Date(),
        };
  const saved = row
    ? await row.update({ ...fields, ...signatureFields }, { transaction })
    : await LandlordProfileModel.create(
        { userId: user.id, ...fields, ...signatureFields },
        { transaction },
      );

  setAuditChanges({
    userId: user.id,
    fields: Object.keys(fields),
    signatureChanged: signature !== undefined,
  });
  return profileDto(saved, user.displayName);
}
