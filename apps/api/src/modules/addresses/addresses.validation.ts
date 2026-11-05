import type { AddressListQuery } from '@p4/shared';
import type { NextFunction, Request, Response } from 'express';
import { queryText, validateListQuery } from '@/shared/list-query.js';
import validate from '@/shared/validation.js';

export const validateAddressBody = (req: Request, res: Response, next: NextFunction) =>
  validate({
    rules: {
      fullName: 'required|string',
      phone: 'required|string',
      line1: 'required|string',
      city: 'required|string',
      isDefault: 'boolean',
    },
  })(req, res, next);

export const validateUpdateAddressBody = (req: Request, res: Response, next: NextFunction) =>
  validate({
    rules: {
      fullName: 'string',
      phone: 'string',
      line1: 'string',
      city: 'string',
      isDefault: 'boolean',
    },
  })(req, res, next);

const sortFields: NonNullable<AddressListQuery['sortBy']>[] = [
  'fullName',
  'city',
  'isDefault',
  'createdAt',
];

export const validateAddressesListQuery = validateListQuery({
  sortFields,
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  legacy: true,
  rules: () => ({
    city: 'sometimes|required|string|max:255',
    isDefault: 'sometimes|required|in:true,false',
  }),
  normalize: (query, base): AddressListQuery => ({
    ...base,
    city: queryText(query, 'city'),
    isDefault:
      queryText(query, 'isDefault') === undefined
        ? undefined
        : queryText(query, 'isDefault') === 'true',
  }),
});
