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
import { AddressModel } from '@/sequelize/models/index.js';
import { searchPattern } from '@/shared/list-filters.js';
import type { ModelOrder, StringField } from '@/types/database.js';
import { NotFound } from '@/utils/errors/index.js';
import { buildPaginationMeta } from '@/utils/pagination.js';
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

export async function createAddress(
  user: User,
  input: ShippingAddressInput & { isDefault?: boolean },
): Promise<Address> {
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
  return selectFields(row, addressFields);
}

export async function updateAddress(
  userId: string,
  id: string,
  input: Partial<ShippingAddressInput> & { isDefault?: boolean },
): Promise<Address> {
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
  return selectFields(row, addressFields);
}

export async function deleteAddress(userId: string, id: string): Promise<Address> {
  const row = await AddressModel.findOne({ where: { id, userId } });
  if (!row) throw new NotFound(errorKeys.addressNotFound);
  const data = selectFields(row, addressFields);
  await row.destroy();
  return data;
}

export async function getAddressForUser(userId: string, id: string): Promise<Address> {
  const row = await AddressModel.findOne({ where: { id, userId } });
  if (!row) throw new NotFound(errorKeys.addressNotFound);
  return selectFields(row, addressFields);
}
