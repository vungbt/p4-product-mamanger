import type { CommerceSettings, ShippingMethod, ShippingQuote, ShopSettings } from '@p4/shared';
import type { Transaction } from 'sequelize';
import { FileModel, ShippingMethodModel, ShopSettingsModel } from '@/sequelize/models/index.js';
import { recordAudit } from '@/shared/commerce/persistence.js';
import { assertVersion } from '@/shared/commerce/transitions.js';
import { BaseError } from '@/utils/errors/base-error.js';
import { NotFound } from '@/utils/errors/index.js';
import { selectFields } from '@/utils/select-fields.js';

export async function settings(transaction?: Transaction) {
  const row = await ShopSettingsModel.findByPk('shop', { transaction });
  if (!row) throw new BaseError('shop_settings_missing', 503, 'shop_settings_missing');
  return row;
}

export function shopDto(row: ShopSettingsModel): ShopSettings {
  return selectFields(row, [
    'name',
    'supportEmail',
    'supportPhone',
    'logoFileId',
    'defaultLocale',
    'currency',
    'timezone',
    'version',
  ]);
}

export function commerceDto(row: ShopSettingsModel): CommerceSettings {
  return selectFields(row, [
    'quoteTtlSeconds',
    'reservationTtlSeconds',
    'returnWindowDays',
    'version',
  ]);
}

export function shippingDto(row: ShippingMethodModel): ShippingMethod {
  return selectFields(row, [
    'id',
    'name',
    'cities',
    'active',
    'codEnabled',
    'fee',
    'freeAbove',
    'estimatedDays',
    'version',
  ]);
}

export async function patchSettings(
  actorId: string,
  expectedVersion: number,
  input: Partial<ShopSettings & CommerceSettings>,
  transaction: Transaction,
) {
  const row = await ShopSettingsModel.findByPk('shop', {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!row) throw new NotFound();
  assertVersion(row.version, expectedVersion);
  if (input.logoFileId) {
    const file = await FileModel.findByPk(input.logoFileId, { transaction });
    if (!file || file.metadata?.ownerId !== actorId || file.metadata?.private)
      throw new NotFound('file_not_found');
  }
  await row.update({ ...input, version: row.version + 1 }, { transaction });
  await recordAudit(
    {
      actorId,
      action: 'settings.updated',
      resourceType: 'settings',
      resourceId: 'shop',
      changes: { ...input },
    },
    transaction,
  );
  return row;
}

export function shippingFee(
  method: Pick<ShippingMethod, 'cities' | 'fee' | 'freeAbove' | 'active'>,
  city: string,
  subtotal: number,
) {
  if (
    !method.active ||
    (!method.cities.includes('*') && !method.cities.includes(city.trim().toLowerCase()))
  )
    throw new BaseError('shipping_zone_unsupported', 409, 'shipping_zone_unsupported');
  return method.freeAbove !== null && subtotal >= method.freeAbove ? 0 : method.fee;
}

export async function quoteShipping(
  city: string,
  subtotal: number,
  methodId?: string,
  transaction?: Transaction,
): Promise<ShippingQuote[]> {
  const methods = await ShippingMethodModel.findAll({
    where: methodId ? { id: methodId, active: true } : { active: true },
    transaction,
    order: [
      ['fee', 'ASC'],
      ['id', 'ASC'],
    ],
  });
  const supported = methods.filter(
    (method) => method.cities.includes('*') || method.cities.includes(city.trim().toLowerCase()),
  );
  if (!supported.length)
    throw new BaseError('shipping_zone_unsupported', 409, 'shipping_zone_unsupported');
  const config = await settings(transaction);
  return supported.map((method) => ({
    methodId: method.id,
    methodName: method.name,
    methodVersion: method.version,
    fee: shippingFee(method, city, subtotal),
    codEnabled: method.codEnabled,
    estimatedDays: method.estimatedDays,
    currency: config.currency,
  }));
}
