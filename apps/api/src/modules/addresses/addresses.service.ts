import type { Address, ShippingAddressInput, User } from '@p4/shared';
import { errorKeys } from '@/constants/index.js';
import { AddressModel } from '@/sequelize/models/index.js';
import { NotFound } from '@/utils/errors/index.js';

function toAddress(row: AddressModel): Address {
  return {
    id: row.id,
    userId: row.userId,
    fullName: row.fullName,
    phone: row.phone,
    line1: row.line1,
    city: row.city,
    isDefault: row.isDefault,
  };
}

export async function listAddresses(userId: string) {
  const rows = await AddressModel.findAll({
    where: { userId },
    order: [
      ['isDefault', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });
  return rows.map(toAddress);
}

export async function createAddress(
  user: User,
  input: ShippingAddressInput & { isDefault?: boolean },
) {
  if (input.isDefault) {
    await AddressModel.update({ isDefault: false }, { where: { userId: user.id } });
  }
  const row = await AddressModel.create({
    userId: user.id,
    fullName: input.fullName,
    phone: input.phone,
    line1: input.line1,
    city: input.city,
    isDefault: Boolean(input.isDefault),
  });
  return toAddress(row);
}

export async function updateAddress(
  userId: string,
  id: string,
  input: Partial<ShippingAddressInput> & { isDefault?: boolean },
) {
  const row = await AddressModel.findOne({ where: { id, userId } });
  if (!row) throw new NotFound(errorKeys.addressNotFound);
  if (input.isDefault) {
    await AddressModel.update({ isDefault: false }, { where: { userId } });
  }
  await row.update({
    fullName: input.fullName ?? row.fullName,
    phone: input.phone ?? row.phone,
    line1: input.line1 ?? row.line1,
    city: input.city ?? row.city,
    isDefault: input.isDefault != null ? Boolean(input.isDefault) : row.isDefault,
  });
  return toAddress(row);
}

export async function deleteAddress(userId: string, id: string) {
  const row = await AddressModel.findOne({ where: { id, userId } });
  if (!row) throw new NotFound(errorKeys.addressNotFound);
  const data = toAddress(row);
  await row.destroy();
  return data;
}

export async function getAddressForUser(userId: string, id: string) {
  const row = await AddressModel.findOne({ where: { id, userId } });
  if (!row) throw new NotFound(errorKeys.addressNotFound);
  return toAddress(row);
}
