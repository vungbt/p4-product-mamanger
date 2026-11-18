import { NotFound } from '@p4/server-core';
import {
  abbreviatePersonName,
  isInvoiceOverdue,
  type MeterKind,
  type PortalContract,
  type PortalInvoice,
  type PortalInvoiceSummary,
  type PortalMe,
  type PortalNotice,
  type PortalNotices,
  type PortalUsage,
  type PortalUsagePeriod,
  type PortalUsageReading,
} from '@stay/shared';
import { Op } from 'sequelize';
import { canAccessRecord } from '@/middlewares/ability.middleware.js';
import {
  AnnouncementModel,
  BuildingModel,
  BuildingServicePriceModel,
  ContractModel,
  DepositEntryModel,
  InvoiceLineModel,
  InvoiceModel,
  PaymentModel,
  RoomModel,
  ServiceDefinitionModel,
  TenantModel,
  VehicleModel,
} from '@/sequelize/models/index.js';
import type { PortalPrincipal } from '@/types/express.js';
import { resolveBuildingPrice } from '../buildings/building-prices.service.js';
import {
  contractFactsAt,
  contractOccupantsAt,
  contractServicesAt,
  contractVehiclesAt,
} from '../contracts/contracts.resolvers.js';
import { depositBalance } from '../deposits/deposits.service.js';
import { ISSUED_STATUSES } from '../invoices/invoices.service.js';
import { isTenantVisible, publicInvoiceView } from '../invoices/invoices.share.js';
import { portalInvoiceClaims, portalOpenRequests } from '../requests/requests.portal.js';
import { billingDefaults, graceDaysByBuilding } from '../settings/settings.service.js';
import { portalReferenceDate, todayVn } from './portal.access.js';

/** Most announcements returned (newest first after the pinned ones). */
const MAX_NOTICES = 50;
/** Consumption months on the usage page (T-07). */
const USAGE_PERIODS = 12;

/**
 * The contract of the portal session, checked with the CASL `tenant` ability (`{ contractId }`).
 * Every portal read starts here: nothing outside this contract is ever queried by id alone.
 */
async function portalContract(portal: PortalPrincipal) {
  const contract = await ContractModel.findByPk(portal.contractId);

  if (
    !contract ||
    !canAccessRecord(portal.ability, 'read', 'Contract', {
      buildingId: contract.buildingId,
      contractId: contract.id,
    })
  )
    throw new NotFound();
  const date = portalReferenceDate(contract);
  const facts = await contractFactsAt(contract.id, date);
  const [building, room] = await Promise.all([
    BuildingModel.findByPk(contract.buildingId),
    RoomModel.findByPk(facts.roomId, { attributes: ['id', 'code'] }),
  ]);

  if (!building) throw new NotFound();
  return { contract, building, room, facts, date };
}

function invoiceSummary(
  row: InvoiceModel & { code: string },
  graceDays: number,
): PortalInvoiceSummary {
  const remaining = row.total - row.paidTotal;

  return {
    id: row.id,
    kind: row.kind,
    period: row.period,
    code: row.code,
    status: row.status,
    issuedOn: row.issuedOn,
    dueOn: row.dueOn,
    total: row.total,
    paidTotal: row.paidTotal,
    remaining,
    overdue: isInvoiceOverdue(row.status, row.dueOn, todayVn(), graceDays) && remaining > 0,
  };
}

/** Issued (also partially paid/paid) invoices of the contract, newest first. */
async function contractInvoices(contractId: string) {
  const rows = await InvoiceModel.findAll({
    where: { contractId, status: { [Op.in]: ISSUED_STATUSES } },
    order: [
      ['issuedOn', 'DESC'],
      ['period', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });

  const graceDays = await graceDaysByBuilding(rows.map((row) => row.buildingId));

  return rows
    .filter(isTenantVisible)
    .map((row) => invoiceSummary(row, graceDays.get(row.buildingId) ?? 0));
}

function noticeDto(row: AnnouncementModel): PortalNotice {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    pinned: row.pinned,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
  };
}

/** Unexpired announcements of the building for the whole building or this room. */
async function roomNotices(buildingId: string, roomId: string | undefined, pinnedOnly = false) {
  const rows = await AnnouncementModel.findAll({
    where: {
      buildingId,
      ...(pinnedOnly ? { pinned: true } : {}),
      [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }],
    },
    order: [
      ['pinned', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    limit: MAX_NOTICES * 2,
  });

  return rows
    .filter((row) => !row.roomIds || (roomId !== undefined && row.roomIds.includes(roomId)))
    .slice(0, MAX_NOTICES)
    .map(noticeDto);
}

/** `GET /api/portal/me` (T-03), with the open maintenance/request/claim counts (part B). */
export async function portalMe(portal: PortalPrincipal): Promise<PortalMe> {
  const { contract, building, room } = await portalContract(portal);
  const [tenant, invoices, pinnedNotices, openRequests] = await Promise.all([
    TenantModel.findByPk(portal.tenantId, { attributes: ['id', 'fullName'] }),
    contractInvoices(contract.id),
    roomNotices(building.id, room?.id, true),
    portalOpenRequests(portal),
  ]);
  const currentInvoice = invoices[0] ?? null;
  const unpaid = invoices.filter((invoice) => invoice.remaining > 0);
  const totalDebt = unpaid.reduce((sum, invoice) => sum + invoice.remaining, 0);

  return {
    tenantName: tenant?.fullName ?? '',
    contractCode: contract.code,
    contractStatus: contract.status,
    roomCode: room?.code ?? '',
    buildingName: building.name,
    buildingAddress: building.address,
    contactPhone: building.contactPhone,
    currentInvoice,
    totalDebt,
    previousDebt: totalDebt - (currentInvoice?.remaining ?? 0),
    unpaidInvoiceCount: unpaid.length,
    pinnedNotices,
    openRequests,
    sessionExpiresAt: portal.sessionExpiresAt.toISOString(),
  };
}

/** `GET /api/portal/invoices` (T-04): issued invoices of the contract, newest first. */
export async function portalInvoices(portal: PortalPrincipal): Promise<PortalInvoiceSummary[]> {
  const { contract } = await portalContract(portal);

  return contractInvoices(contract.id);
}

/**
 * `GET /api/portal/invoices/:id` (T-05): the public invoice view (lines, totals, payee, VietQR for
 * the remaining amount) and recorded payments. Another contract's invoice, a draft or a void
 * invoice → 404.
 */
export async function portalInvoice(portal: PortalPrincipal, id: string): Promise<PortalInvoice> {
  const { contract } = await portalContract(portal);
  const row = await InvoiceModel.findOne({ where: { id, contractId: contract.id } });

  if (
    !isTenantVisible(row) ||
    !canAccessRecord(portal.ability, 'read', 'Invoice', {
      buildingId: row.buildingId,
      contractId: row.contractId,
    })
  )
    throw new NotFound();
  const [view, payments, claims] = await Promise.all([
    publicInvoiceView(row),
    PaymentModel.findAll({
      where: { invoiceId: row.id, reversedAt: null },
      order: [
        ['paidOn', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    }),
    portalInvoiceClaims(portal, row.id),
  ]);

  return {
    ...view,
    id: row.id,
    claims,
    payments: payments.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      method: payment.method,
      paidOn: payment.paidOn,
    })),
  };
}

/** "59X1-234.56" → "59X•••56": other occupants' plates are not shown in full. */
function maskPlate(plate: string): string {
  return plate.length > 5 ? `${plate.slice(0, 3)}•••${plate.slice(-2)}` : '•••';
}

/** `GET /api/portal/contract` (T-06, read-only). */
export async function portalContractView(portal: PortalPrincipal): Promise<PortalContract> {
  const { contract, building, room, facts, date } = await portalContract(portal);
  const [occupants, registrations, services, deposits, defaults, prices] = await Promise.all([
    contractOccupantsAt(contract.id, date),
    contractVehiclesAt(contract.id, date),
    contractServicesAt(contract.id, date),
    DepositEntryModel.findAll({
      where: { contractId: contract.id },
      attributes: ['id', 'type', 'amount'],
    }),
    billingDefaults(),
    BuildingServicePriceModel.findAll({ where: { buildingId: building.id } }),
  ]);
  const [tenants, vehicles, definitions] = await Promise.all([
    TenantModel.findAll({
      where: { id: { [Op.in]: occupants.map((row) => row.tenantId) } },
      attributes: ['id', 'fullName'],
    }),
    VehicleModel.findAll({
      where: { id: { [Op.in]: registrations.map((row) => row.vehicleId) } },
      attributes: ['id', 'tenantId', 'plate', 'type'],
    }),
    ServiceDefinitionModel.findAll({
      where: { id: { [Op.in]: services.map((row) => row.serviceId) } },
      order: [
        ['sortOrder', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    }),
  ]);
  const names = new Map(tenants.map((tenant) => [tenant.id, tenant.fullName]));

  return {
    code: contract.code,
    status: contract.status,
    roomCode: room?.code ?? '',
    buildingName: building.name,
    startDate: contract.startDate,
    endDate: contract.endDate,
    noticeDate: contract.noticeDate,
    movedOutAt: contract.movedOutAt,
    rent: facts.rent,
    depositHeld: depositBalance(deposits).held,
    issueDay: building.issueDay ?? defaults.issueDay,
    dueDay: building.dueDay ?? defaults.dueDay,
    services: definitions.map((service) => ({
      name: service.name,
      description: service.description,
      kind: service.kind,
      unit: service.unit,
      price: resolveBuildingPrice(
        service.defaultPrice,
        prices.filter((row) => row.serviceId === service.id),
        date,
      ).price,
    })),
    // Other occupants: abbreviated names only (no phone, ID number or full name).
    occupants: occupants.map((row) => {
      const isSelf = row.tenantId === portal.tenantId;
      const name = names.get(row.tenantId) ?? '';

      return {
        name: isSelf ? name : (abbreviatePersonName(name) ?? ''),
        isPrimary: row.isPrimary,
        isSelf,
      };
    }),
    vehicles: vehicles.map((vehicle) => {
      const isOwn = vehicle.tenantId === portal.tenantId;

      return {
        plate: isOwn ? vehicle.plate : maskPlate(vehicle.plate),
        type: vehicle.type,
        isOwn,
      };
    }),
  };
}

/**
 * `GET /api/portal/usage` (T-07): electricity/water of the last 12 consumption months, from the
 * snapshot lines of issued invoices (readings, consumption, unit price, amount as billed).
 */
export async function portalUsage(portal: PortalPrincipal): Promise<PortalUsage> {
  const { contract } = await portalContract(portal);
  const invoices = await InvoiceModel.findAll({
    where: { contractId: contract.id, status: { [Op.in]: ISSUED_STATUSES } },
    attributes: ['id'],
  });
  const lines = invoices.length
    ? await InvoiceLineModel.findAll({
        where: {
          invoiceId: { [Op.in]: invoices.map((row) => row.id) },
          type: { [Op.in]: ['electricity', 'water'] },
          period: { [Op.ne]: null },
        },
        order: [
          ['period', 'ASC'],
          ['position', 'ASC'],
          ['createdAt', 'ASC'],
        ],
      })
    : [];
  const byPeriod = new Map<string, Partial<Record<MeterKind, PortalUsageReading>>>();

  for (const line of lines) {
    if (!line.period || (line.type !== 'electricity' && line.type !== 'water')) continue;
    const kind: MeterKind = line.type;
    const entry = byPeriod.get(line.period) ?? {};
    const previous = entry[kind];

    entry[kind] = previous
      ? {
          ...previous,
          // A room move bills two segments: keep the first start and the last end reading.
          endReading: line.meta?.endReading ?? previous.endReading,
          consumption: previous.consumption + line.quantity,
          unitPrice: previous.unitPrice === line.unitPrice ? previous.unitPrice : null,
          amount: previous.amount + line.amount,
        }
      : {
          kind,
          startReading: line.meta?.startReading ?? null,
          endReading: line.meta?.endReading ?? null,
          consumption: line.quantity,
          unit: line.unit,
          unitPrice: line.unitPrice,
          amount: line.amount,
        };
    byPeriod.set(line.period, entry);
  }
  const periods: PortalUsagePeriod[] = [...byPeriod.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-USAGE_PERIODS)
    .map(([period, entry]) => ({
      period,
      electricity: entry.electricity ?? null,
      water: entry.water ?? null,
    }));

  return { periods };
}

/** `GET /api/portal/notices` (T-10): announcements, house rules and the contact phone. */
export async function portalNotices(portal: PortalPrincipal): Promise<PortalNotices> {
  const { building, room } = await portalContract(portal);

  return {
    announcements: await roomNotices(building.id, room?.id),
    buildingName: building.name,
    rulesText: building.rulesText,
    contactPhone: building.contactPhone,
  };
}
