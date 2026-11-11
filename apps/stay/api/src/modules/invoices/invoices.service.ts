import { randomUUID } from 'node:crypto';
import {
  BaseError,
  buildPaginationMeta,
  NotFound,
  searchPattern,
  selectFields,
  setAuditChanges,
} from '@p4/server-core';
import type { ListQuery, PaginationMeta } from '@p4/shared';
import {
  type InvoiceLine,
  invoiceCodePeriod,
  invoicePaymentStatus,
  invoiceSchedule,
  invoiceTotals,
  isBillingError,
  manualLines,
} from '@stay/billing';
import {
  type BillingDraftResult,
  type BillingPreview,
  type BillingPreviewRow,
  firstDayOfPeriod,
  formatInvoiceCode,
  type InvoiceIssueResult,
  type InvoiceKind,
  type InvoiceLineInput,
  type InvoiceStatus,
  type InvoiceVoidInput,
  isInvoiceOverdue,
  isoDateInTimeZone,
  lastDayOfPeriod,
  type Period,
  previousPeriod,
  type StayAction,
  type StayInvoice,
  type StayInvoiceLine,
  type StayInvoiceSummary,
  type StayUser,
} from '@stay/shared';
import { Op, type Transaction, type WhereOptions } from 'sequelize';
import { canAccessRecord, hasAccess } from '@/middlewares/ability.middleware.js';
import {
  BuildingModel,
  ContractModel,
  InvoiceLineModel,
  InvoiceMeterReadingModel,
  InvoiceModel,
  InvoiceSequenceModel,
  MeterModel,
  MeterReadingModel,
  RoomModel,
  sequelize,
} from '@/sequelize/models/index.js';
import type { InvoiceAttributes } from '@/sequelize/models/invoice.model.js';
import { auditedTransaction, recordAudit } from '@/shared/audit.js';
import { assertVersion } from '@/shared/input.js';
import { runIdempotent } from '@/shared/persistence.js';
import type { ModelOrder } from '@/types/database.js';
import { invoicePayments } from '../payments/payments.dto.js';
import {
  type BillingContext,
  billingContext,
  type ComputedDraft,
  computeMonthlyDraft,
  computeMoveInDraft,
  exclusionOf,
} from './invoices.billing.js';

export type InvoiceSortField = 'createdAt' | 'period' | 'code' | 'total' | 'dueOn' | 'issuedOn';

export interface InvoiceListQuery extends ListQuery<InvoiceSortField> {
  buildingId?: string;
  contractId?: string;
  roomId?: string;
  period?: string;
  kind?: InvoiceKind;
  status?: InvoiceStatus;
  overdue?: boolean;
}

/** Statuses of an issued, non-void invoice (paid states are set by ST-15 payments). */
export const ISSUED_STATUSES: InvoiceStatus[] = ['issued', 'partially_paid', 'paid'];

export function conflict(code: string, extensions?: Record<string, string | number>): never {
  throw new BaseError(code, 409, code, extensions);
}

const today = () => isoDateInTimeZone(new Date());

/* -------------------------------------------------------------------------- */
/* Access and DTOs                                                             */
/* -------------------------------------------------------------------------- */

export async function findBuilding(
  user: StayUser,
  buildingId: string,
  action: StayAction,
  transaction: Transaction,
  lock = false,
) {
  if (!canAccessRecord(user, action, 'Invoice', { buildingId })) throw new NotFound();
  const building = await BuildingModel.findByPk(buildingId, {
    transaction,
    ...(lock ? { lock: transaction.LOCK.UPDATE } : {}),
  });

  if (!building) throw new NotFound();
  if (action !== 'read' && building.archivedAt) conflict('building_archived');
  return building;
}

/** Inaccessible invoices (and drafts for tenants) are 404, never 403. */
export async function findInvoice(
  user: StayUser,
  id: string,
  action: StayAction,
  transaction?: Transaction,
) {
  const row = await InvoiceModel.findByPk(id, { transaction });

  if (
    !row ||
    !canAccessRecord(user, action, 'Invoice', {
      buildingId: row.buildingId,
      contractId: row.contractId,
    }) ||
    (row.status === 'draft' &&
      !canAccessRecord(user, 'read', 'Invoice', { buildingId: row.buildingId }))
  )
    throw new NotFound();
  return row;
}

async function summaries(
  rows: InvoiceModel[],
  transaction?: Transaction,
): Promise<StayInvoiceSummary[]> {
  const [rooms, contracts] = await Promise.all([
    RoomModel.findAll({
      where: { id: { [Op.in]: [...new Set(rows.map((row) => row.roomId))] } },
      attributes: ['id', 'code'],
      transaction,
    }),
    ContractModel.findAll({
      where: { id: { [Op.in]: [...new Set(rows.map((row) => row.contractId))] } },
      attributes: ['id', 'code'],
      transaction,
    }),
  ]);
  const roomCodes = new Map(rooms.map((room) => [room.id, room.code]));
  const contractCodes = new Map(contracts.map((contract) => [contract.id, contract.code]));
  const now = today();
  const instant = new Date();

  return rows.map((row) => {
    const remaining = row.total - row.paidTotal;
    const shareExpiresAt =
      row.shareTokenHash && row.shareExpiresAt && row.shareExpiresAt > instant
        ? row.shareExpiresAt.toISOString()
        : null;

    return {
      ...selectFields(row, [
        'id',
        'buildingId',
        'contractId',
        'roomId',
        'kind',
        'period',
        'code',
        'status',
        'issuedOn',
        'dueOn',
        'subtotal',
        'rounding',
        'total',
        'paidTotal',
        'version',
      ]),
      contractCode: contractCodes.get(row.contractId) ?? '',
      roomCode: roomCodes.get(row.roomId) ?? '',
      remaining,
      overdue: isInvoiceOverdue(row.status, row.dueOn, now) && remaining > 0,
      shareExpiresAt,
      createdAt: row.createdAt.toISOString(),
    };
  });
}

function lineDto(line: InvoiceLineModel): StayInvoiceLine {
  return selectFields(line, [
    'id',
    'type',
    'serviceId',
    'description',
    'period',
    'quantity',
    'unit',
    'unitPrice',
    'ratioNum',
    'ratioDen',
    'amount',
    'manual',
    'meta',
  ]);
}

async function invoiceDto(row: InvoiceModel, transaction?: Transaction): Promise<StayInvoice> {
  const [[summary], lines, payments] = await Promise.all([
    summaries([row], transaction),
    InvoiceLineModel.findAll({
      where: { invoiceId: row.id },
      order: [
        ['position', 'ASC'],
        ['createdAt', 'ASC'],
      ],
      transaction,
    }),
    invoicePayments(row.id, transaction),
  ]);

  if (!summary) throw new NotFound();
  return {
    ...summary,
    roundingUnit: row.roundingUnit,
    voidReason: row.voidReason,
    voidedAt: row.voidedAt?.toISOString() ?? null,
    lines: lines.map(lineDto),
    payments,
  };
}

/** Audit facts: identifiers, period, money and version only (no names, phones or reasons). */
async function auditInvoice(row: InvoiceModel, action: string, transaction: Transaction) {
  const changes = {
    buildingId: row.buildingId,
    contractId: row.contractId,
    invoiceId: row.id,
    kind: row.kind,
    period: row.period,
    status: row.status,
    code: row.code,
    total: row.total,
    version: row.version,
  };

  await recordAudit(
    { action: `invoice.${action}`, resourceType: 'invoice', resourceId: row.id, changes },
    transaction,
  );
  return changes;
}

/* -------------------------------------------------------------------------- */
/* Drafts                                                                      */
/* -------------------------------------------------------------------------- */

function lineValues(invoiceId: string, line: InvoiceLine, position: number, manual = false) {
  return {
    invoiceId,
    position,
    manual,
    ...selectFields(line, [
      'type',
      'serviceId',
      'description',
      'period',
      'quantity',
      'unit',
      'unitPrice',
      'ratioNum',
      'ratioDen',
      'amount',
      'meta',
    ]),
  };
}

/**
 * Creates or refreshes a draft from a computed invoice. Refresh replaces the computed lines and
 * keeps manual surcharges/discounts; the rounding line and totals are recomputed. Issued
 * invoices never reach this function.
 *
 * ST-17 extension point: persist a settlement draft with `kind: 'settlement'`.
 */
export async function saveInvoiceDraft(
  contract: ContractModel,
  draft: ComputedDraft,
  existing: InvoiceModel | null,
  transaction: Transaction,
): Promise<InvoiceModel> {
  if (existing && existing.status !== 'draft') conflict('invoice_not_draft');
  const computed = draft.invoice.lines.filter((line) => line.type !== 'rounding');
  const manual = existing
    ? await InvoiceLineModel.findAll({
        where: { invoiceId: existing.id, manual: true },
        order: [['position', 'ASC']],
        transaction,
      })
    : [];
  const totals = invoiceTotals([...computed, ...manual], draft.invoice.roundingUnit);
  const values = {
    roomId: draft.roomId,
    dueOn: draft.schedule.dueOn,
    subtotal: totals.subtotal,
    rounding: totals.rounding,
    total: totals.total,
    roundingUnit: draft.invoice.roundingUnit,
  };
  let row: InvoiceModel;

  if (existing) {
    existing.set(values);
    existing.changed('updatedAt', true);
    row = await existing.save({ transaction });
    await InvoiceLineModel.destroy({ where: { invoiceId: row.id, manual: false }, transaction });
  } else {
    row = await InvoiceModel.create(
      {
        buildingId: contract.buildingId,
        contractId: contract.id,
        kind: draft.invoice.kind,
        period: draft.invoice.period,
        ...values,
      },
      { transaction },
    );
  }
  await InvoiceLineModel.bulkCreate(
    computed.map((line, index) => lineValues(row.id, line, index)),
    { transaction },
  );
  for (const [index, line] of manual.entries())
    await line.update({ position: computed.length + index }, { transaction });
  if (totals.roundingLine)
    await InvoiceLineModel.create(
      lineValues(row.id, totals.roundingLine, computed.length + manual.length),
      { transaction },
    );
  await InvoiceMeterReadingModel.destroy({ where: { invoiceId: row.id }, transaction });
  await InvoiceMeterReadingModel.bulkCreate(
    [...new Map(draft.readings.map((reading) => [reading.id, reading])).values()].map(
      (reading) => ({ invoiceId: row.id, readingId: reading.id, readingValue: reading.reading }),
    ),
    { transaction },
  );
  await auditInvoice(row, existing ? 'draft_refreshed' : 'draft_created', transaction);
  return row;
}

/** Contracts with at least one day in `period` that can be billed monthly. */
function periodContracts(
  buildingId: string,
  period: Period,
  transaction: Transaction,
  lock = false,
) {
  return ContractModel.findAll({
    where: {
      buildingId,
      status: { [Op.in]: ['active', 'ending'] },
      startDate: { [Op.lte]: lastDayOfPeriod(period) },
      [Op.or]: [{ endDate: null }, { endDate: { [Op.gte]: firstDayOfPeriod(period) } }],
    },
    order: [['id', 'ASC']],
    transaction,
    ...(lock ? { lock: transaction.LOCK.UPDATE } : {}),
  });
}

interface Evaluation {
  row: Omit<BillingPreviewRow, 'roomCode' | 'contractCode'>;
  draft: ComputedDraft | null;
  existing: InvoiceModel | null;
}

/** Eligibility and expected total of one contract for period M. */
async function evaluate(
  context: BillingContext,
  contract: ContractModel,
  period: Period,
  transaction: Transaction,
  lock = false,
): Promise<Evaluation> {
  const invoices = await InvoiceModel.findAll({
    where: {
      contractId: contract.id,
      period,
      kind: { [Op.in]: ['monthly', 'move_in'] },
      status: { [Op.ne]: 'void' },
    },
    order: [['id', 'ASC']],
    transaction,
    ...(lock ? { lock: transaction.LOCK.UPDATE } : {}),
  });
  const moveIn = invoices.find((invoice) => invoice.kind === 'move_in');
  const existing = invoices.find((invoice) => invoice.kind === 'monthly') ?? null;
  const base = { contractId: contract.id, roomId: contract.roomId };
  /** `billed`: the period's invoice total is shown; a stale draft of excluded data is not. */
  const excluded = (
    reason: BillingPreviewRow['reason'],
    invoice: InvoiceModel | null | undefined,
    detail: BillingPreviewRow['reasonDetail'] = null,
    billed = false,
  ): Evaluation => ({
    row: {
      ...base,
      roomId: invoice?.roomId ?? base.roomId,
      eligible: false,
      reason,
      reasonDetail: detail,
      invoiceId: invoice?.id ?? null,
      invoiceStatus: invoice?.status ?? null,
      subtotal: billed && invoice ? invoice.subtotal : null,
      total: billed && invoice ? invoice.total : null,
    },
    draft: null,
    existing,
  });

  if (moveIn) return excluded('move_in_invoice', moveIn, null, true);
  if (existing && existing.status !== 'draft')
    return excluded('already_issued', existing, null, true);
  let draft: ComputedDraft;

  try {
    draft = await computeMonthlyDraft(context, contract, period, transaction);
  } catch (error) {
    const exclusion = exclusionOf(error);

    return excluded(exclusion.reason, existing, exclusion.detail);
  }
  const manual = existing
    ? await InvoiceLineModel.findAll({
        where: { invoiceId: existing.id, manual: true },
        attributes: ['type', 'amount'],
        transaction,
      })
    : [];
  const totals = invoiceTotals(
    [...draft.invoice.lines, ...manual.map((line) => ({ type: line.type, amount: line.amount }))],
    draft.invoice.roundingUnit,
  );

  return {
    row: {
      ...base,
      roomId: draft.roomId,
      eligible: true,
      reason: null,
      reasonDetail: null,
      invoiceId: existing?.id ?? null,
      invoiceStatus: existing?.status ?? null,
      subtotal: totals.subtotal,
      total: totals.total,
    },
    draft,
    existing,
  };
}

async function previewRows(
  evaluations: { contract: ContractModel; row: Evaluation['row'] }[],
  transaction: Transaction,
): Promise<BillingPreviewRow[]> {
  const rooms = await RoomModel.findAll({
    where: { id: { [Op.in]: [...new Set(evaluations.map(({ row }) => row.roomId))] } },
    attributes: ['id', 'code'],
    transaction,
  });
  const codes = new Map(rooms.map((room) => [room.id, room.code]));

  return evaluations
    .map(({ contract, row }) => ({
      ...row,
      contractCode: contract.code,
      roomCode: codes.get(row.roomId) ?? '',
    }))
    .sort(
      (a, b) =>
        a.roomCode.localeCompare(b.roomCode, 'vi', { numeric: true }) ||
        a.contractCode.localeCompare(b.contractCode),
    );
}

async function preview(
  user: StayUser,
  buildingId: string,
  period: Period,
  transaction: Transaction,
): Promise<BillingPreview> {
  const building = await findBuilding(user, buildingId, 'read', transaction);
  const context = await billingContext(building, transaction);
  const evaluations = [];

  for (const contract of await periodContracts(buildingId, period, transaction))
    evaluations.push({
      contract,
      row: (await evaluate(context, contract, period, transaction)).row,
    });
  const rows = await previewRows(evaluations, transaction);
  const eligible = rows.filter((row) => row.eligible);
  const schedule = invoiceSchedule({
    kind: 'monthly',
    period,
    issueDay: context.issueDay,
    dueDay: context.dueDay,
    today: today(),
  });

  return {
    buildingId,
    period,
    utilityPeriod: previousPeriod(period),
    issueDate: schedule.issuedOn,
    dueDate: schedule.dueOn,
    rows,
    eligibleCount: eligible.length,
    excludedCount: rows.length - eligible.length,
    expectedTotal: eligible.reduce((sum, row) => sum + (row.total ?? 0), 0),
  };
}

/** Eligible contracts, excluded ones with their reason and the expected totals of period M. */
export function billingPreview(
  user: StayUser,
  buildingId: string,
  period: Period,
): Promise<BillingPreview> {
  return auditedTransaction((transaction) => {
    setAuditChanges({ buildingId, period });
    return preview(user, buildingId, period, transaction);
  });
}

/**
 * Creates or refreshes the monthly drafts of every eligible contract. The building row
 * serializes runs; the same `Idempotency-Key` and body replays without writing again.
 */
export async function createDrafts(
  user: StayUser,
  buildingId: string,
  period: Period,
  key: string,
): Promise<BillingDraftResult> {
  return auditedTransaction(async (transaction) => {
    await findBuilding(user, buildingId, 'create', transaction);
    const { result, replayed } = await runIdempotent(
      {
        scope: `invoice.drafts.${buildingId}.${period}`,
        actorId: user.id,
        key,
        payload: { buildingId, period },
      },
      async (tx) => {
        const building = await findBuilding(user, buildingId, 'create', tx, true);
        const context = await billingContext(building, tx);
        let created = 0;
        let refreshed = 0;

        for (const contract of await periodContracts(buildingId, period, tx, true)) {
          const { draft, existing } = await evaluate(context, contract, period, tx, true);

          if (!draft) continue;
          await saveInvoiceDraft(contract, draft, existing, tx);
          if (existing) refreshed += 1;
          else created += 1;
        }
        return { created, refreshed };
      },
    );
    const counts =
      typeof result === 'object' && result !== null && !Array.isArray(result) ? result : {};
    const created = typeof counts.created === 'number' ? counts.created : 0;
    const refreshed = typeof counts.refreshed === 'number' ? counts.refreshed : 0;

    setAuditChanges({ buildingId, period, created, refreshed, replayed });
    return {
      ...(await preview(user, buildingId, period, transaction)),
      created,
      refreshed,
      replayed,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Move-in invoices                                                            */
/* -------------------------------------------------------------------------- */

function billingFailure(error: unknown): never {
  const exclusion = exclusionOf(error);

  throw new BaseError(exclusion.reason, 422, `billing_${exclusion.reason}`, {
    reason: exclusion.reason,
  });
}

/**
 * Draft move-in invoice from `computeMoveInInvoice` (start-date prices, occupants, vehicles).
 * Called by contract activation inside its transaction; returns the existing non-void one.
 */
export async function createMoveInForActivation(
  contract: ContractModel,
  transaction: Transaction,
): Promise<InvoiceModel> {
  const existing = await InvoiceModel.findOne({
    where: { contractId: contract.id, kind: 'move_in', status: { [Op.ne]: 'void' } },
    transaction,
  });

  if (existing) return existing;
  const building = await BuildingModel.findByPk(contract.buildingId, {
    transaction,
    rejectOnEmpty: true,
  });
  let draft: ComputedDraft;

  try {
    draft = await computeMoveInDraft(
      await billingContext(building, transaction),
      contract,
      transaction,
    );
  } catch (error) {
    billingFailure(error);
  }
  return saveInvoiceDraft(contract, draft, null, transaction);
}

/** Move-in draft for an active contract activated before ST-14 (or whose move-in was voided). */
export async function createMoveInInvoice(
  user: StayUser,
  contractId: string,
): Promise<StayInvoice> {
  return auditedTransaction(async (transaction) => {
    const contract = await ContractModel.findByPk(contractId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (
      !contract ||
      !canAccessRecord(user, 'create', 'Invoice', {
        buildingId: contract.buildingId,
        contractId: contract.id,
      })
    )
      throw new NotFound();
    if (contract.status !== 'active' && contract.status !== 'ending')
      conflict('contract_not_active');
    await findBuilding(user, contract.buildingId, 'create', transaction);
    const invoices = await InvoiceModel.findAll({
      where: { contractId, kind: { [Op.in]: ['move_in', 'monthly'] }, status: { [Op.ne]: 'void' } },
      transaction,
    });
    const moveIn = invoices.find((invoice) => invoice.kind === 'move_in');
    const monthly = invoices.find(
      (invoice) => invoice.kind === 'monthly' && invoice.period === contract.startDate.slice(0, 7),
    );

    if (moveIn) conflict('move_in_invoice_exists', { invoiceId: moveIn.id });
    if (monthly) conflict('period_already_invoiced', { invoiceId: monthly.id });
    return invoiceDto(await createMoveInForActivation(contract, transaction), transaction);
  });
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                       */
/* -------------------------------------------------------------------------- */

/** Rows `user` may read: assigned buildings (all statuses) or own contracts (issued only). */
function readableScope(user: StayUser): WhereOptions<InvoiceAttributes> | null {
  if (hasAccess(user, 'read', 'Invoice')) return null;
  const buildingIds = user.buildingIds.filter((buildingId) =>
    canAccessRecord(user, 'read', 'Invoice', { buildingId }),
  );
  const contractIds = user.contractIds.filter((contractId) =>
    canAccessRecord(user, 'read', 'Invoice', { contractId }),
  );

  return {
    [Op.or]: [
      { buildingId: { [Op.in]: buildingIds } },
      { contractId: { [Op.in]: contractIds }, status: { [Op.ne]: 'draft' } },
    ],
  };
}

export async function listInvoices(
  user: StayUser,
  query: InvoiceListQuery,
): Promise<{ data: StayInvoiceSummary[]; meta: PaginationMeta }> {
  if (
    query.buildingId &&
    !canAccessRecord(user, 'read', 'Invoice', { buildingId: query.buildingId })
  )
    throw new NotFound();
  const scope = readableScope(user);
  const now = today();
  const conditions: WhereOptions<InvoiceAttributes>[] = scope ? [scope] : [];

  if (query.buildingId) conditions.push({ buildingId: query.buildingId });
  if (query.contractId) conditions.push({ contractId: query.contractId });
  if (query.roomId) conditions.push({ roomId: query.roomId });
  if (query.period) conditions.push({ period: query.period });
  if (query.kind) conditions.push({ kind: query.kind });
  if (query.status) conditions.push({ status: query.status });
  if (query.q) {
    const rooms = await RoomModel.findAll({
      where: { code: { [Op.iLike]: searchPattern(query.q) } },
      attributes: ['id'],
    });

    conditions.push({
      [Op.or]: [
        { code: { [Op.iLike]: searchPattern(query.q) } },
        { roomId: { [Op.in]: rooms.map((room) => room.id) } },
      ],
    });
  }
  const overdue: WhereOptions<InvoiceAttributes> = {
    status: { [Op.in]: ['issued', 'partially_paid'] },
    dueOn: { [Op.lt]: now },
    total: { [Op.gt]: sequelize.col('paid_total') },
  };

  if (query.overdue === true) conditions.push(overdue);
  if (query.overdue === false) conditions.push({ [Op.not]: overdue });
  const order: ModelOrder<InvoiceAttributes> = [
    [query.sortBy ?? 'createdAt', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
    ['id', 'ASC'],
  ];
  const { rows, count } = await InvoiceModel.findAndCountAll({
    where: { [Op.and]: conditions },
    order,
    limit: query.pageSize,
    offset: (query.page - 1) * query.pageSize,
  });

  return {
    data: await summaries(rows),
    meta: buildPaginationMeta(query.page, query.pageSize, count),
  };
}

export async function getInvoice(
  user: StayUser,
  id: string,
  transaction?: Transaction,
): Promise<StayInvoice> {
  const row = await findInvoice(user, id, 'read', transaction);

  return invoiceDto(row, transaction);
}

/* -------------------------------------------------------------------------- */
/* Manual lines                                                                */
/* -------------------------------------------------------------------------- */

async function lockedDraft(user: StayUser, id: string, transaction: Transaction, version?: number) {
  const row = await findInvoice(user, id, 'update', transaction);

  await row.reload({ transaction, lock: transaction.LOCK.UPDATE });
  if (version !== undefined) assertVersion(row.version, version);
  if (row.status !== 'draft') conflict('invoice_not_draft');
  return row;
}

/** Replaces the rounding line and totals after a manual line was added or removed. */
async function retotal(row: InvoiceModel, transaction: Transaction) {
  await InvoiceLineModel.destroy({ where: { invoiceId: row.id, type: 'rounding' }, transaction });
  const lines = await InvoiceLineModel.findAll({
    where: { invoiceId: row.id },
    order: [['position', 'ASC']],
    transaction,
  });
  const totals = invoiceTotals(lines, row.roundingUnit);

  if (totals.roundingLine)
    await InvoiceLineModel.create(
      lineValues(row.id, totals.roundingLine, (lines.at(-1)?.position ?? -1) + 1),
      { transaction },
    );
  row.set({ subtotal: totals.subtotal, rounding: totals.rounding, total: totals.total });
  row.changed('updatedAt', true);
  await row.save({ transaction });
}

/** Surcharge or discount on a draft, with its reason; kept when the draft is refreshed. */
export async function addInvoiceLine(
  user: StayUser,
  id: string,
  input: InvoiceLineInput,
): Promise<StayInvoice> {
  return auditedTransaction(async (transaction) => {
    const row = await lockedDraft(user, id, transaction, input.version);
    let line: InvoiceLine | undefined;

    try {
      [line] = manualLines(
        [{ type: input.type, amount: input.amount, reason: input.reason }],
        'line',
      );
    } catch (error) {
      if (isBillingError(error)) throw new BaseError(error.message, 422, 'invalid_invoice_line');
      throw error;
    }
    if (!line) throw new BaseError('invalid_invoice_line', 422, 'invalid_invoice_line');
    const last = await InvoiceLineModel.max<number, InvoiceLineModel>('position', {
      where: { invoiceId: row.id },
      transaction,
    });

    await InvoiceLineModel.create(lineValues(row.id, line, (last ?? -1) + 1, true), {
      transaction,
    });
    await retotal(row, transaction);
    setAuditChanges({ ...(await auditInvoice(row, 'line_added', transaction)), type: input.type });
    return invoiceDto(row, transaction);
  });
}

/** Removes a manual line of a draft; computed snapshot lines cannot be removed (409). */
export async function deleteInvoiceLine(
  user: StayUser,
  id: string,
  lineId: string,
): Promise<StayInvoice> {
  return auditedTransaction(async (transaction) => {
    const row = await lockedDraft(user, id, transaction);
    const line = await InvoiceLineModel.findOne({
      where: { id: lineId, invoiceId: row.id },
      transaction,
    });

    if (!line) throw new NotFound();
    if (!line.manual) conflict('invoice_line_not_manual');
    await line.destroy({ transaction });
    await retotal(row, transaction);
    setAuditChanges({ ...(await auditInvoice(row, 'line_deleted', transaction)), type: line.type });
    return invoiceDto(row, transaction);
  });
}

/* -------------------------------------------------------------------------- */
/* Issue and void                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Locks the rooms of the invoices and of their meter readings, in id order. Reading saves and
 * meter replacements lock the same room rows first, so issue/void serialize with them.
 */
async function lockRooms(invoices: InvoiceModel[], transaction: Transaction) {
  const links = await InvoiceMeterReadingModel.findAll({
    where: { invoiceId: { [Op.in]: invoices.map((row) => row.id) } },
    transaction,
  });
  const readings = await MeterReadingModel.findAll({
    where: { id: { [Op.in]: links.map((link) => link.readingId) } },
    attributes: ['id', 'meterId'],
    transaction,
  });
  const meters = await MeterModel.findAll({
    where: { id: { [Op.in]: readings.map((reading) => reading.meterId) } },
    attributes: ['id', 'roomId'],
    transaction,
  });
  const roomIds = [
    ...new Set([...invoices.map((row) => row.roomId), ...meters.map((meter) => meter.roomId)]),
  ].sort();
  const rooms = await RoomModel.findAll({
    where: { id: { [Op.in]: roomIds } },
    order: [['id', 'ASC']],
    lock: transaction.LOCK.UPDATE,
    transaction,
  });

  return { rooms };
}

async function nextCode(
  buildingId: string,
  buildingCode: string,
  period: Period,
  transaction: Transaction,
) {
  // ON CONFLICT waits for a concurrent creator; FOR UPDATE then serializes the numbers.
  await sequelize.query(
    `INSERT INTO invoice_sequences (id, building_id, period, last_number, created_at, updated_at)
     VALUES (:id, :buildingId, :period, 0, now(), now())
     ON CONFLICT (building_id, period) DO NOTHING`,
    { replacements: { id: randomUUID(), buildingId, period }, transaction },
  );
  const sequence = await InvoiceSequenceModel.findOne({
    where: { buildingId, period },
    lock: transaction.LOCK.UPDATE,
    transaction,
    rejectOnEmpty: true,
  });

  if (sequence.lastNumber >= 999) conflict('invoice_sequence_exhausted', { period });
  await sequence.update({ lastNumber: sequence.lastNumber + 1 }, { transaction });
  return formatInvoiceCode(buildingCode, period, sequence.lastNumber);
}

/**
 * Issues drafts in one transaction: assigns `{building}-{YYYYMM}-{nnn}` codes from
 * `invoice_sequences` (row lock), sets issue/due dates from building/system settings and locks
 * the meter readings used. A draft whose readings changed since it was computed must be
 * refreshed first (409 `invoice_readings_changed`).
 */
export async function issueInvoices(user: StayUser, ids: string[]): Promise<InvoiceIssueResult> {
  return auditedTransaction(async (transaction) => {
    const unique = [...new Set(ids)].sort();
    const found = await InvoiceModel.findAll({
      where: { id: { [Op.in]: unique } },
      transaction,
    });

    if (
      found.length !== unique.length ||
      found.some(
        (row) =>
          !canAccessRecord(user, 'issue', 'Invoice', {
            buildingId: row.buildingId,
            contractId: row.contractId,
          }),
      )
    )
      throw new NotFound();
    const { rooms } = await lockRooms(found, transaction);
    const rows = await InvoiceModel.findAll({
      where: { id: { [Op.in]: unique } },
      order: [['id', 'ASC']],
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
    // Read after the row locks: a concurrent draft refresh may have replaced the links.
    const links = await InvoiceMeterReadingModel.findAll({
      where: { invoiceId: { [Op.in]: unique } },
      transaction,
    });
    const readings = await MeterReadingModel.findAll({
      where: { id: { [Op.in]: links.map((link) => link.readingId) } },
      transaction,
    });
    const values = new Map(readings.map((reading) => [reading.id, reading.reading]));

    for (const row of rows) {
      if (row.status !== 'draft') conflict('invoice_not_draft', { invoiceId: row.id });
      if (
        links.some(
          (link) => link.invoiceId === row.id && values.get(link.readingId) !== link.readingValue,
        )
      )
        conflict('invoice_readings_changed', { invoiceId: row.id });
      const sum = await InvoiceLineModel.sum('amount', {
        where: { invoiceId: row.id },
        transaction,
      });

      if (Number(sum ?? 0) !== row.total) conflict('invoice_total_mismatch', { invoiceId: row.id });
    }
    const buildings = new Map<string, { building: BuildingModel; context: BillingContext }>();

    for (const buildingId of new Set(rows.map((row) => row.buildingId))) {
      const building = await findBuilding(user, buildingId, 'issue', transaction);

      buildings.set(buildingId, { building, context: await billingContext(building, transaction) });
    }
    const contracts = await ContractModel.findAll({
      where: { id: { [Op.in]: rows.map((row) => row.contractId) } },
      attributes: ['id', 'startDate'],
      transaction,
    });
    const roomCodes = new Map(rooms.map((room) => [room.id, room.code]));
    const now = today();
    const planned = rows.map((row) => {
      const target = buildings.get(row.buildingId);

      if (!target) throw new NotFound();
      const schedule = invoiceSchedule({
        kind: row.kind,
        period: row.period,
        issueDay: target.context.issueDay,
        dueDay: target.context.dueDay,
        today: now,
        eventDate: contracts.find((contract) => contract.id === row.contractId)?.startDate,
      });

      return {
        row,
        building: target.building,
        schedule,
        codePeriod: invoiceCodePeriod(row.kind, row.period, schedule.issuedOn),
      };
    });

    // Sequence rows are locked in (building, period) order; numbers follow room codes.
    planned.sort(
      (a, b) =>
        a.row.buildingId.localeCompare(b.row.buildingId) ||
        a.codePeriod.localeCompare(b.codePeriod) ||
        (roomCodes.get(a.row.roomId) ?? '').localeCompare(roomCodes.get(b.row.roomId) ?? '', 'vi', {
          numeric: true,
        }) ||
        a.row.id.localeCompare(b.row.id),
    );
    for (const { row, building, schedule, codePeriod } of planned) {
      const code = await nextCode(building.id, building.code, codePeriod, transaction);

      await row.update(
        { status: 'issued', code, issuedOn: schedule.issuedOn, dueOn: schedule.dueOn },
        { transaction },
      );
      await auditInvoice(row, 'issued', transaction);
    }
    for (const reading of readings)
      if (reading.status !== 'locked') await reading.update({ status: 'locked' }, { transaction });
    const data = await summaries(rows, transaction);
    const total = data.reduce((sum, row) => sum + row.total, 0);

    setAuditChanges({
      invoiceIds: unique,
      buildingIds: [...buildings.keys()],
      count: data.length,
      total,
    });
    return { invoices: data, count: data.length, total };
  });
}

/**
 * Voids a draft or an issued invoice without payments (reason required). Readings no other
 * issued invoice uses are unlocked, and the period can be drafted again.
 */
export async function voidInvoice(
  user: StayUser,
  id: string,
  input: InvoiceVoidInput,
): Promise<StayInvoice> {
  return auditedTransaction(async (transaction) => {
    const found = await findInvoice(user, id, 'void', transaction);
    await lockRooms([found], transaction);
    const row = await found.reload({ transaction, lock: transaction.LOCK.UPDATE });
    const links = await InvoiceMeterReadingModel.findAll({
      where: { invoiceId: row.id },
      transaction,
    });

    if (input.version !== undefined) assertVersion(row.version, input.version);
    if (row.status === 'void') conflict('invoice_already_void');
    // The contract is ended and the deposit applied against it (ST-17): never re-opened.
    if (row.kind === 'settlement') conflict('settlement_invoice_not_voidable');
    if (row.paidTotal !== 0 || (row.status !== 'draft' && row.status !== 'issued'))
      conflict('invoice_has_payments');
    await row.update(
      { status: 'void', voidReason: input.reason, voidedAt: new Date() },
      { transaction },
    );
    const readingIds = links.map((link) => link.readingId);
    const others = await InvoiceMeterReadingModel.findAll({
      where: { readingId: { [Op.in]: readingIds }, invoiceId: { [Op.ne]: row.id } },
      transaction,
    });
    const stillIssued = await InvoiceModel.findAll({
      where: {
        id: { [Op.in]: others.map((link) => link.invoiceId) },
        status: { [Op.in]: ISSUED_STATUSES },
      },
      attributes: ['id'],
      transaction,
    });
    const keep = new Set(
      others
        .filter((link) => stillIssued.some((invoice) => invoice.id === link.invoiceId))
        .map((link) => link.readingId),
    );
    const readings = await MeterReadingModel.findAll({
      where: { id: { [Op.in]: readingIds.filter((readingId) => !keep.has(readingId)) } },
      transaction,
    });

    for (const reading of readings)
      if (reading.status === 'locked') await reading.update({ status: 'draft' }, { transaction });
    setAuditChanges({
      ...(await auditInvoice(row, 'voided', transaction)),
      unlockedReadings: readings.length,
    });
    return invoiceDto(row, transaction);
  });
}

/* -------------------------------------------------------------------------- */
/* Extension points                                                            */
/* -------------------------------------------------------------------------- */

/**
 * ST-15: call inside the payment transaction after locking the invoice row with the new sum of
 * non-reversed payments. Status is always recomputed from `paidTotal` (never set by hand).
 */
export async function applyInvoicePaidTotal(
  row: InvoiceModel,
  paidTotal: number,
  transaction: Transaction,
): Promise<InvoiceModel> {
  if (!ISSUED_STATUSES.includes(row.status)) conflict('invoice_not_issued');
  let status: InvoiceStatus;

  try {
    status = invoicePaymentStatus(row.total, paidTotal);
  } catch (error) {
    if (isBillingError(error)) throw new BaseError(error.message, 422, 'invalid_paid_total');
    throw error;
  }
  return row.update({ paidTotal, status }, { transaction });
}
