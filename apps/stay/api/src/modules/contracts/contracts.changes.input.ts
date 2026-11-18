import { type ContractChangeInput, type ContractChangeKind, isIsoDate } from '@stay/shared';
import type { FormBody } from '@/shared/input.js';

export function readChangeInput(body: FormBody, kind: ContractChangeKind): ContractChangeInput {
  const input: ContractChangeInput = {
    version: body.integer('version', 1),
    effectiveDate: body.text('effectiveDate', 10),
  };
  body.check('effectiveDate', isIsoDate(input.effectiveDate));
  if (!body.isEmpty('preview')) input.preview = body.boolean('preview');
  for (const field of [
    'tenantId',
    'newPrimaryTenantId',
    'vehicleId',
    'serviceId',
    'roomId',
  ] as const) {
    if (!body.isEmpty(field)) {
      input[field] = body.text(field, 36);
      body.check(
        field,
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input[field]),
      );
    }
  }
  if (kind === 'renew') {
    input.endDate = body.text('endDate', 10);
    body.check('endDate', isIsoDate(input.endDate));
  }
  if (
    kind === 'rent-change' ||
    kind === 'room-change' ||
    (kind === 'renew' && !body.isEmpty('rent'))
  )
    input.rent = body.integer('rent', 0, 1_000_000_000);
  if (kind === 'occupants' && !input.tenantId) {
    input.fullName = body.text('fullName', 120);
    input.phone = body.text('phone', 10);
    body.check('phone', /^0\d{9}$/.test(input.phone));
  }
  if (kind === 'vehicles' || kind === 'services') {
    input.enabled = body.boolean('enabled');
    body.check(
      kind === 'vehicles' ? 'vehicleId' : 'serviceId',
      Boolean(kind === 'vehicles' ? input.vehicleId : input.serviceId),
    );
  }
  if (kind === 'room-change') {
    body.check('roomId', Boolean(input.roomId));
    for (const field of [
      'closingElectric',
      'closingWater',
      'initialElectric',
      'initialWater',
    ] as const)
      input[field] = body.integer(field, 0, 999_999_999);
  }
  body.assertValid();
  return input;
}
