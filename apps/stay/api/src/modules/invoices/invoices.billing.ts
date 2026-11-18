/**
 * Loads dated billing inputs (rent, registrations, prices, meter segments) for `@stay/billing`.
 * Every amount is computed by the library; this module only reads data.
 */
import {
  type ComputedInvoice,
  computeMonthlyInvoice,
  computeMoveInInvoice,
  type FixedServiceInput,
  type InvoiceSchedule,
  invoiceSchedule,
  isBillingError,
  type MeterSegment,
  type UtilityInput,
} from '@stay/billing';
import {
  type BillingExclusionReason,
  type BillingPreviewRow,
  isFixedServiceKind,
  isoDateInTimeZone,
  lastDayOfPeriod,
  type MeterKind,
  type Period,
  periodOfIsoDate,
  previousPeriod,
} from '@stay/shared';
import { Op, type Transaction } from 'sequelize';
import {
  type BuildingModel,
  BuildingServicePriceModel,
  type ContractModel,
  MeterModel,
  MeterReadingModel,
  ServiceDefinitionModel,
} from '@/sequelize/models/index.js';
import { resolveBuildingPrice } from '../buildings/building-prices.service.js';
import {
  contractFactsAt,
  contractOccupantsAt,
  contractRoomClosingsForPeriod,
  contractRoomEntryDate,
  contractServicesAt,
  contractVehiclesAt,
} from '../contracts/contracts.resolvers.js';
import { periodMeterUsage } from '../readings/readings.service.js';
import { billingDefaults } from '../settings/settings.service.js';

/** A contract that gets no draft for the period, with the reason shown in the preview. */
export class BillingExclusion extends Error {
  readonly reason: BillingExclusionReason;
  readonly detail: BillingPreviewRow['reasonDetail'];

  constructor(reason: BillingExclusionReason, detail: BillingPreviewRow['reasonDetail'] = null) {
    super(reason);
    this.reason = reason;
    this.detail = detail;
  }
}

/** Building settings and price tables shared by every contract of one billing run. */
export interface BillingContext {
  building: BuildingModel;
  issueDay: number;
  dueDay: number;
  roundingUnit: number;
  definitions: ServiceDefinitionModel[];
  prices: BuildingServicePriceModel[];
}

export interface ComputedDraft {
  invoice: ComputedInvoice;
  /** Room of the contract on the issue date. */
  roomId: string;
  /** Meter readings used (baselines and closings); locked when the invoice is issued. */
  readings: MeterReadingModel[];
  schedule: InvoiceSchedule;
}

export async function billingContext(
  building: BuildingModel,
  transaction: Transaction,
): Promise<BillingContext> {
  const defaults = await billingDefaults();
  const [definitions, prices] = await Promise.all([
    ServiceDefinitionModel.findAll({
      order: [
        ['sortOrder', 'ASC'],
        ['createdAt', 'ASC'],
      ],
      transaction,
    }),
    BuildingServicePriceModel.findAll({ where: { buildingId: building.id }, transaction }),
  ]);

  return {
    building,
    issueDay: building.issueDay ?? defaults.issueDay,
    dueDay: building.dueDay ?? defaults.dueDay,
    roundingUnit: building.roundingUnit ?? defaults.roundingUnit,
    definitions,
    prices,
  };
}

/** Price of `service` on `date` (building override or default). */
export function priceOn(context: BillingContext, service: ServiceDefinitionModel, date: string) {
  return resolveBuildingPrice(
    service.defaultPrice,
    context.prices.filter((row) => row.serviceId === service.id),
    date,
  ).price;
}

/** Rent, registered occupants/vehicles and fixed services of the contract on `date`. */
export async function fixedInputs(
  context: BillingContext,
  contract: ContractModel,
  date: string,
  transaction: Transaction,
) {
  const [facts, occupants, vehicles, registrations] = await Promise.all([
    contractFactsAt(contract.id, date, transaction),
    contractOccupantsAt(contract.id, date, transaction),
    contractVehiclesAt(contract.id, date, transaction),
    contractServicesAt(contract.id, date, transaction),
  ]);
  const registered = new Set(registrations.map((row) => row.serviceId));
  const services: FixedServiceInput[] = [];

  for (const service of context.definitions) {
    if (!registered.has(service.id) || !isFixedServiceKind(service.kind)) continue;
    services.push({
      serviceId: service.id,
      code: service.code,
      name: service.name,
      description: service.description,
      kind: service.kind,
      unit: service.unit,
      unitPrice: priceOn(context, service, date),
    });
  }

  return {
    term: { startDate: contract.startDate, endDate: contract.endDate, rent: facts.rent },
    roomId: facts.roomId,
    occupantCount: occupants.length,
    vehicleCount: vehicles.length,
    services,
  };
}

/** Segment of the room the contract left mid-month: last billed reading → closing reading. */
async function oldRoomSegment(
  closing: Awaited<ReturnType<typeof contractRoomClosingsForPeriod>>[number],
  kind: MeterKind,
  utilityPeriod: Period,
  transaction: Transaction,
): Promise<{ segment: MeterSegment; readings: MeterReadingModel[] }> {
  const meter = await MeterModel.findOne({
    where: {
      roomId: closing.oldRoomId,
      kind,
      installedOn: { [Op.lte]: closing.effectiveDate },
      [Op.or]: [{ removedOn: null }, { removedOn: { [Op.gte]: closing.effectiveDate } }],
    },
    order: [
      ['installedOn', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    transaction,
  });

  if (!meter) throw new BillingExclusion('missing_meter', { kind, period: utilityPeriod });
  const prior = await MeterReadingModel.findOne({
    where: {
      meterId: meter.id,
      period: { [Op.lt]: utilityPeriod },
      readOn: { [Op.gte]: closing.oldEntryDate },
    },
    order: [['period', 'DESC']],
    transaction,
  });
  const initial = kind === 'electricity' ? closing.oldInitialElectric : closing.oldInitialWater;

  return {
    segment: {
      meterId: meter.id,
      startReading:
        prior?.reading ??
        (meter.installedOn <= closing.oldEntryDate ? initial : meter.initialReading),
      endReading: kind === 'electricity' ? closing.closingElectric : closing.closingWater,
    },
    readings: prior ? [prior] : [],
  };
}

/** Electricity/water consumed in `utilityPeriod` (M−1), plus old-room segments of a move. */
async function utilityInputs(
  context: BillingContext,
  contract: ContractModel,
  period: Period,
  issueDate: string,
  transaction: Transaction,
) {
  const utilityPeriod = previousPeriod(period);
  const end = lastDayOfPeriod(utilityPeriod);
  const utilities: UtilityInput[] = [];
  const readings: MeterReadingModel[] = [];

  if (contract.startDate > end) return { utilities, readings };
  const [registrations, closings, facts, entryDate] = await Promise.all([
    contractServicesAt(contract.id, end, transaction),
    contractRoomClosingsForPeriod(contract.id, period, transaction),
    contractFactsAt(contract.id, end, transaction),
    contractRoomEntryDate(contract.id, end, transaction),
  ]);
  const registered = new Set(registrations.map((row) => row.serviceId));
  const meterContract = {
    roomId: facts.roomId,
    startDate: entryDate,
    initialElectric: facts.initialElectric,
    initialWater: facts.initialWater,
  };

  for (const service of context.definitions) {
    const kind = service.kind;

    if (!registered.has(service.id) || (kind !== 'electricity' && kind !== 'water')) continue;
    const snapshot = {
      kind,
      serviceId: service.id,
      code: service.code,
      name: service.name,
      description: service.description,
      unit: service.unit,
      unitPrice: priceOn(context, service, issueDate),
    };

    for (const closing of closings) {
      const old = await oldRoomSegment(closing, kind, utilityPeriod, transaction);

      utilities.push({
        ...snapshot,
        segments: [old.segment],
        roomId: closing.oldRoomId,
        sourceEventId: closing.eventId,
      });
      readings.push(...old.readings);
    }
    const usage = await periodMeterUsage(meterContract, kind, utilityPeriod, transaction);

    if (usage === null) continue;
    if (usage === 'no_meter')
      throw new BillingExclusion('missing_meter', { kind, period: utilityPeriod });
    if (!usage.segments)
      throw new BillingExclusion('missing_reading', { kind, period: utilityPeriod });
    utilities.push({ ...snapshot, segments: usage.segments });
    readings.push(...usage.readings);
  }

  return { utilities, readings };
}

/** Maps a billing failure to a preview exclusion; anything else is rethrown. */
export function exclusionOf(error: unknown): BillingExclusion {
  if (error instanceof BillingExclusion) return error;
  if (!isBillingError(error)) throw error;
  const kind = error.details.kind;
  const meterKind: MeterKind | null = kind === 'electricity' || kind === 'water' ? kind : null;
  const detail: BillingPreviewRow['reasonDetail'] = {
    ...(meterKind ? { kind: meterKind } : {}),
    message: error.message,
  };

  if (error.code === 'MISSING_READING') return new BillingExclusion('missing_reading', detail);
  if (error.code === 'NEGATIVE_CONSUMPTION')
    return new BillingExclusion('negative_consumption', detail);
  if (error.code === 'NO_OCCUPANCY_IN_PERIOD') return new BillingExclusion('no_occupancy', detail);
  return new BillingExclusion('invalid_data', detail);
}

/** Monthly invoice of period M: inputs at the issue date, utilities of M−1. */
export async function computeMonthlyDraft(
  context: BillingContext,
  contract: ContractModel,
  period: Period,
  transaction: Transaction,
): Promise<ComputedDraft> {
  const schedule = invoiceSchedule({
    kind: 'monthly',
    period,
    issueDay: context.issueDay,
    dueDay: context.dueDay,
    today: isoDateInTimeZone(new Date()),
  });
  const fixed = await fixedInputs(context, contract, schedule.issuedOn, transaction);
  const { utilities, readings } = await utilityInputs(
    context,
    contract,
    period,
    schedule.issuedOn,
    transaction,
  );
  const invoice = computeMonthlyInvoice({
    period,
    contract: fixed.term,
    occupantCount: fixed.occupantCount,
    vehicleCount: fixed.vehicleCount,
    services: fixed.services,
    utilities,
    roundingUnit: context.roundingUnit,
  });

  return { invoice, roomId: fixed.roomId, readings, schedule };
}

/**
 * Move-in invoice: rent and services from the start date to the end of that month, with the
 * prices, occupants and vehicles of the start date. No utilities and no deposit.
 */
export async function computeMoveInDraft(
  context: BillingContext,
  contract: ContractModel,
  transaction: Transaction,
): Promise<ComputedDraft> {
  const schedule = invoiceSchedule({
    kind: 'move_in',
    period: periodOfIsoDate(contract.startDate),
    issueDay: context.issueDay,
    dueDay: context.dueDay,
    today: isoDateInTimeZone(new Date()),
    eventDate: contract.startDate,
  });
  const fixed = await fixedInputs(context, contract, contract.startDate, transaction);
  const invoice = computeMoveInInvoice({
    contract: fixed.term,
    occupantCount: fixed.occupantCount,
    vehicleCount: fixed.vehicleCount,
    services: fixed.services,
    roundingUnit: context.roundingUnit,
  });

  return { invoice, roomId: fixed.roomId, readings: [], schedule };
}
