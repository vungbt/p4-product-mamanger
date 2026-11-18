import { type ContractInput, isIsoDate } from '@stay/shared';
import type { FormBody } from '@/shared/input.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function readContractInput(body: FormBody): ContractInput {
  const roomId = body.text('roomId', 36);
  const startDate = body.text('startDate', 10);
  const endDate = body.optionalText('endDate', 10) || null;
  const depositDate = body.optionalText('depositDate', 10) || null;
  const primaryTenantId = body.optionalText('primaryTenantId', 36) || null;
  const ids = (field: string) => {
    if (body.isEmpty(field)) return [];
    const raw = body.data[field];
    const values = body.strings(field, 50, 36);

    body.check(
      field,
      Array.isArray(raw) &&
        values.length === raw.length &&
        values.every((id) => UUID.test(id)) &&
        new Set(values).size === values.length,
    );
    return values;
  };
  const input: ContractInput = {
    roomId,
    startDate,
    endDate,
    rent: body.integer('rent', 0, 1_000_000_000),
    depositAmount: body.isEmpty('depositAmount')
      ? 0
      : body.integer('depositAmount', 0, 1_000_000_000),
    depositCollected: body.isEmpty('depositCollected') ? false : body.boolean('depositCollected'),
    depositMethod: body.isEmpty('depositMethod')
      ? 'cash'
      : body.enum('depositMethod', ['cash', 'bank_transfer', 'other']),
    depositDate,
    depositNote: body.optionalText('depositNote', 2000) || null,
    initialElectricPhotoFileId: body.optionalText('initialElectricPhotoFileId', 36) || null,
    initialWaterPhotoFileId: body.optionalText('initialWaterPhotoFileId', 36) || null,
    initialElectric: body.isEmpty('initialElectric')
      ? 0
      : body.integer('initialElectric', 0, 999_999_999),
    initialWater: body.isEmpty('initialWater') ? 0 : body.integer('initialWater', 0, 999_999_999),
    note: body.optionalText('note', 2000) || null,
    occupantIds: ids('occupantIds'),
    primaryTenantId,
    serviceIds: ids('serviceIds'),
    vehicleIds: ids('vehicleIds'),
  };

  body.check('roomId', UUID.test(roomId));
  body.check('startDate', isIsoDate(startDate));
  if (endDate) body.check('endDate', isIsoDate(endDate) && endDate >= startDate);
  if (depositDate) body.check('depositDate', isIsoDate(depositDate));
  if (input.depositCollected) body.check('depositDate', depositDate !== null);
  if (primaryTenantId)
    body.check(
      'primaryTenantId',
      UUID.test(primaryTenantId) && input.occupantIds.includes(primaryTenantId),
    );
  for (const field of ['initialElectricPhotoFileId', 'initialWaterPhotoFileId'] as const)
    if (input[field]) body.check(field, UUID.test(input[field]));
  body.assertValid();
  return input;
}
