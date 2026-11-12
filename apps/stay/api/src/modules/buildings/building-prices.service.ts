import { BaseError, selectFields, setAuditChanges } from '@p4/server-core';
import { type ResolvedPrice, resolvePrice } from '@stay/billing';
import type {
  BuildingPriceList,
  BuildingPriceOverride,
  BuildingServicePrice,
  IsoDate,
  StayUser,
} from '@stay/shared';
import type { BuildingServicePriceAttributes } from '@/sequelize/models/building-service-price.model.js';
import { BuildingServicePriceModel, ServiceDefinitionModel } from '@/sequelize/models/index.js';
import type { ServiceDefinitionAttributes } from '@/sequelize/models/service-definition.model.js';
import { auditedTransaction } from '@/shared/audit.js';
import type { ModelOrder } from '@/types/database.js';
import { findAccessibleBuilding } from './buildings.service.js';
import { priceHistoryInvoiced } from './buildings.usage.js';

export interface PriceOverrideInput {
  serviceId: string;
  /** `null` returns to the service default price from `effectiveFrom`. */
  price: number | null;
  effectiveFrom: IsoDate;
}

type OverrideRow = Pick<BuildingServicePriceAttributes, 'effectiveFrom' | 'price'>;

function overrideDto(row: BuildingServicePriceModel): BuildingPriceOverride {
  return {
    ...selectFields(row, ['id', 'serviceId', 'price', 'effectiveFrom']),
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Price of a service in a building on `on` (rules.md): the override with the latest
 * `effectiveFrom` ≤ `on`, else the default. An override with `price: null` returns to the
 * default from its date. Invoices (ST-14) resolve their snapshot prices with this function.
 */
export function resolveBuildingPrice(
  defaultPrice: number,
  overrides: readonly OverrideRow[],
  on: IsoDate,
): ResolvedPrice {
  const resolved = resolvePrice({
    defaultPrice,
    overrides: overrides.map((row) => ({
      effectiveFrom: row.effectiveFrom,
      price: row.price ?? defaultPrice,
    })),
    on,
  });
  const decisive = overrides.find((row) => row.effectiveFrom === resolved.effectiveFrom);

  return decisive && decisive.price === null
    ? { price: defaultPrice, source: 'default', effectiveFrom: decisive.effectiveFrom }
    : resolved;
}

/** Every service with its default and building price on `date`, plus the override history. */
export async function getBuildingPrices(
  user: StayUser,
  buildingId: string,
  date: IsoDate,
): Promise<BuildingPriceList> {
  const building = await findAccessibleBuilding(user, buildingId, 'read');
  const serviceOrder: ModelOrder<ServiceDefinitionAttributes> = [
    ['sortOrder', 'ASC'],
    ['name', 'ASC'],
    ['id', 'ASC'],
  ];
  const overrideOrder: ModelOrder<BuildingServicePriceAttributes> = [
    ['effectiveFrom', 'DESC'],
    ['id', 'ASC'],
  ];
  const [services, overrides] = await Promise.all([
    ServiceDefinitionModel.findAll({ order: serviceOrder }),
    BuildingServicePriceModel.findAll({ where: { buildingId: building.id }, order: overrideOrder }),
  ]);
  const items = services.map((service): BuildingServicePrice => {
    const history = overrides.filter((row) => row.serviceId === service.id);
    const resolved = resolveBuildingPrice(service.defaultPrice, history, date);

    return {
      ...selectFields(service, [
        'code',
        'name',
        'description',
        'kind',
        'unit',
        'active',
        'defaultPrice',
      ]),
      serviceId: service.id,
      ...resolved,
      history: history.map(overrideDto),
    };
  });

  return { buildingId: building.id, date, items };
}

/**
 * Sets the building price of a service from `effectiveFrom`. An override already on that date is
 * replaced unless an issued invoice used it (`priceHistoryInvoiced`, 409).
 */
export async function setBuildingPrice(
  user: StayUser,
  buildingId: string,
  input: PriceOverrideInput,
): Promise<BuildingPriceOverride> {
  return auditedTransaction(async (transaction) => {
    const building = await findAccessibleBuilding(user, buildingId, 'manage', transaction);

    if (building.archivedAt) throw new BaseError('building_archived', 409, 'building_archived');
    if (await priceHistoryInvoiced(building.id, input.serviceId, input.effectiveFrom, transaction))
      throw new BaseError('price_history_locked', 409, 'price_history_locked', {
        effectiveFrom: input.effectiveFrom,
      });

    const existing = await BuildingServicePriceModel.findOne({
      where: {
        buildingId: building.id,
        serviceId: input.serviceId,
        effectiveFrom: input.effectiveFrom,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const before = existing ? overrideDto(existing) : null;
    const row = existing
      ? await existing.update({ price: input.price }, { transaction })
      : await BuildingServicePriceModel.create(
          { buildingId: building.id, ...input },
          { transaction },
        );
    const after = overrideDto(row);

    setAuditChanges({
      buildingId: building.id,
      before: before && { ...before },
      after: { ...after },
    });
    return after;
  });
}
