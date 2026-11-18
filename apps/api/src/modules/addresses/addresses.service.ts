import { buildPaginationMeta, NotFound, searchPattern } from '@p4/server-core';
import type {
  Address,
  AddressListQuery,
  ApiPaginatedSuccess,
  ApiSuccess,
  ShippingAddressInput,
  User,
} from '@p4/shared';
import { Op, type WhereOptions } from 'sequelize';
import { errorKeys } from '@/constants/index.js';
import type { AddressAttributes } from '@/sequelize/models/address.model.js';
import { AddressModel, sequelize } from '@/sequelize/models/index.js';
import { auditedTransaction, recordAudit } from '@/shared/audit/audited-command.js';
import type { ModelOrder, StringField } from '@/types/database.js';
import { selectFields } from '@/utils/select-fields.js';

const addressFields = [
  'id',
  'userId',
  'fullName',
  'phone',
  'line1',
  'city',
  'isDefault',
] satisfies (keyof Address)[];

const searchFields: StringField<AddressAttributes>[] = ['fullName', 'phone', 'line1', 'city'];

export async function listAddresses(
  userId: string,
  query?: AddressListQuery,
): Promise<ApiSuccess<Address[]> | ApiPaginatedSuccess<Address>> {
  const where: WhereOptions<AddressAttributes> = {
    userId,
    ...(query?.city ? { city: { [Op.iLike]: searchPattern(query.city) } } : {}),
    ...(query?.isDefault !== undefined ? { isDefault: query.isDefault } : {}),
    ...(query?.q
      ? {
          [Op.or]: searchFields.map((field) => ({
            [field]: { [Op.iLike]: searchPattern(query.q ?? '') },
          })),
        }
      : {}),
  };
  const order: ModelOrder<AddressAttributes> = query?.sortBy
    ? [
        [query.sortBy, query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
        ['id', 'ASC'],
      ]
    : [
        ['isDefault', 'DESC'],
        ['createdAt', 'DESC'],
        ['id', 'ASC'],
      ];

  if (!query)
    return {
      data: (await AddressModel.findAll({ where, order })).map((row) =>
        selectFields(row, addressFields),
      ),
    };

  const { rows, count } = await AddressModel.findAndCountAll({
    where,
    order,
    limit: query.pageSize,
    offset: (query.page - 1) * query.pageSize,
  });
  return {
    data: rows.map((row) => selectFields(row, addressFields)),
    meta: buildPaginationMeta(query.page, query.pageSize, count),
  };
}

async function lockAddressOwner(userId: string, transaction: import('sequelize').Transaction) {
  await sequelize.query('SELECT pg_advisory_xact_lock(hashtext(:key))', {
    replacements: { key: `address-default:${userId}` },
    transaction,
  });
}

export async function createAddress(
  user: User,
  input: ShippingAddressInput & { isDefault?: boolean },
): Promise<Address> {
  return auditedTransaction(async (transaction) => {
    await lockAddressOwner(user.id, transaction);
    if (input.isDefault)
      await AddressModel.update({ isDefault: false }, { where: { userId: user.id }, transaction });
    const row = await AddressModel.create(
      {
        userId: user.id,
        ...selectFields(input, ['fullName', 'phone', 'line1', 'city']),
        isDefault: Boolean(input.isDefault),
      },
      { transaction },
    );
    await recordAudit(
      { actorId: user.id, action: 'address.created', resourceType: 'address', resourceId: row.id },
      transaction,
    );
    return selectFields(row, addressFields);
  });
}

export async function updateAddress(
  userId: string,
  id: string,
  input: Partial<ShippingAddressInput> & { isDefault?: boolean },
): Promise<Address> {
  return auditedTransaction(async (transaction) => {
    await lockAddressOwner(userId, transaction);
    const row = await AddressModel.findOne({
      where: { id, userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!row) throw new NotFound(errorKeys.addressNotFound);
    if (input.isDefault)
      await AddressModel.update({ isDefault: false }, { where: { userId }, transaction });
    await row.update(
      {
        fullName: input.fullName ?? row.fullName,
        phone: input.phone ?? row.phone,
        line1: input.line1 ?? row.line1,
        city: input.city ?? row.city,
        isDefault: input.isDefault ?? row.isDefault,
      },
      { transaction },
    );
    await recordAudit(
      { actorId: userId, action: 'address.updated', resourceType: 'address', resourceId: id },
      transaction,
    );
    return selectFields(row, addressFields);
  });
}

export async function deleteAddress(userId: string, id: string): Promise<Address> {
  return auditedTransaction(async (transaction) => {
    await lockAddressOwner(userId, transaction);
    const row = await AddressModel.findOne({
      where: { id, userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!row) throw new NotFound(errorKeys.addressNotFound);
    const data = selectFields(row, addressFields);
    await row.destroy({ transaction });
    await recordAudit(
      { actorId: userId, action: 'address.deleted', resourceType: 'address', resourceId: id },
      transaction,
    );
    return data;
  });
}

export async function getAddressForUser(userId: string, id: string): Promise<Address> {
  const row = await AddressModel.findOne({ where: { id, userId } });
  if (!row) throw new NotFound(errorKeys.addressNotFound);
  return selectFields(row, addressFields);
}
