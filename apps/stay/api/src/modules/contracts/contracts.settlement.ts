/**
 * ST-17: move-out notice and settlement (rules.md "Trả phòng và thanh lý").
 * Every amount comes from `@stay/billing` (`computeSettlement`, `allocateSettlementDeposit`);
 * the preview and the settle command share `settlementPlan`, so their numbers are identical.
 */
import { BaseError, InputValidError, NotFound, setAuditChanges } from '@p4/server-core';
import {
  allocateSettlementDeposit,
  computeSettlement,
  type DepositAllocation,
  invoiceSchedule,
  isBillingError,
  type ManualLineInput,
  type MeterSegment,
  meterConsumption,
  type PrepaidLineInput,
  type SettlementResult,
  type UtilityInput,
} from '@stay/billing';
import {
  addDays,
  type ContractNoticeInput,
  type ContractSettleInput,
  type ContractSettlementInput,
  type ContractSettlementPreview,
  type ContractSettlementResult,
  type ContractVersionInput,
  isoDateInTimeZone,
  type MeterKind,
  periodOfIsoDate,
  type SettlementDraftInvoice,
  type SettlementReading,
  type StayAction,
  type StayContract,
  type StayUser,
} from '@stay/shared';
import { Op, type Transaction } from 'sequelize';
import { canAccessRecord } from '@/middlewares/ability.middleware.js';
import {
  BuildingModel,
  ContractEventModel,
  ContractModel,
  ContractOccupantModel,
  ContractServiceModel,
  ContractVehicleModel,
  DepositEntryModel,
  InvoiceLineModel,
  InvoiceModel,
  MeterModel,
  MeterReadingModel,
  RoomModel,
} from '@/sequelize/models/index.js';
import { auditedTransaction, recordAudit } from '@/shared/audit.js';
import { assertVersion } from '@/shared/input.js';
import { runIdempotent } from '@/shared/persistence.js';
import {
  applyDepositForSettlement,
  createDeposit,
  depositBalance,
} from '../deposits/deposits.service.js';
import {
  type BillingContext,
  billingContext,
  fixedInputs,
  priceOn,
} from '../invoices/invoices.billing.js';
import {
  applyInvoicePaidTotal,
  getInvoice,
  issueInvoices,
  saveInvoiceDraft,
} from '../invoices/invoices.service.js';
import { insertPayment } from '../payments/payments.service.js';
import { billingDefaults } from '../settings/settings.service.js';
import { attachableFile } from '../uploads/uploads.service.js';
import {
  contractFactsAt,
  contractRoomEntryDate,
  contractServicesAt,
} from './contracts.resolvers.js';
import { contractDto } from './contracts.service.js';

const today = () => isoDateInTimeZone(new Date());

function invalid(field: string, message: string): never {
  throw new InputValidError('input_valid_error', { [field]: [message] });
}

function conflict(code: string, extensions?: Record<string, unknown>): never {
  throw new BaseError(code, 409, code, extensions);
}

/** Inaccessible contracts are 404; `lock` serializes every settlement/notice writer. */
async function findContract(
  user: StayUser,
  id: string,
  action: StayAction,
  transaction: Transaction,
  lock: boolean,
) {
  const row = await ContractModel.findByPk(id, {
    transaction,
    ...(lock ? { lock: transaction.LOCK.UPDATE } : {}),
  });

  if (
    !row ||
    !canAccessRecord(user, action, 'Contract', { buildingId: row.buildingId, contractId: row.id })
  )
    throw new NotFound('contract_not_found');
  return row;
}

/* -------------------------------------------------------------------------- */
/* Notice                                                                      */
/* -------------------------------------------------------------------------- */

async function noticeEvent(
  user: StayUser,
  row: ContractModel,
  type: 'notice' | 'notice_cancelled',
  payload: Record<string, string | number | null>,
  transaction: Transaction,
) {
  await ContractEventModel.create(
    { contractId: row.id, type, actorId: user.id, payload: { ...payload, version: row.version } },
    { transaction },
  );
  // No free text (the note stays in the contract event only).
  const facts = {
    buildingId: row.buildingId,
    contractId: row.id,
    status: row.status,
    noticeDate: row.noticeDate,
    version: row.version,
  };

  await recordAudit(
    { action: `contract.${type}`, resourceType: 'contract', resourceId: row.id, changes: facts },
    transaction,
  );
  setAuditChanges(facts);
}

/** Move-out notice: active → ending with the expected date (or a new date while ending). */
export async function giveNotice(
  user: StayUser,
  id: string,
  input: ContractNoticeInput,
): Promise<StayContract> {
  return auditedTransaction(async (transaction) => {
    const row = await findContract(user, id, 'update', transaction, true);

    assertVersion(row.version, input.version);
    if (row.status !== 'active' && row.status !== 'ending') conflict('contract_not_active');
    const date = input.expectedMoveOutDate;

    if (date < today()) invalid('expectedMoveOutDate', 'Ngày dự kiến không được trước hôm nay.');
    if (date < row.startDate)
      invalid('expectedMoveOutDate', 'Ngày dự kiến không được trước ngày bắt đầu hợp đồng.');
    if (row.endDate && date > row.endDate)
      invalid('expectedMoveOutDate', 'Ngày dự kiến không được sau ngày kết thúc hợp đồng.');
    row.set({ status: 'ending', noticeDate: date });
    row.changed('updatedAt', true);
    await row.save({ transaction });
    await noticeEvent(
      user,
      row,
      'notice',
      { expectedMoveOutDate: date, noticeGivenOn: today(), note: input.note ?? null },
      transaction,
    );
    return contractDto(row, transaction);
  });
}

/** Withdraws the notice: ending → active (renewing does the same). */
export async function cancelNotice(
  user: StayUser,
  id: string,
  input: ContractVersionInput,
): Promise<StayContract> {
  return auditedTransaction(async (transaction) => {
    const row = await findContract(user, id, 'update', transaction, true);

    assertVersion(row.version, input.version);
    if (row.status !== 'ending') conflict('contract_not_ending');
    const previous = row.noticeDate;

    row.set({ status: 'active', noticeDate: null });
    row.changed('updatedAt', true);
    await row.save({ transaction });
    await noticeEvent(
      user,
      row,
      'notice_cancelled',
      { expectedMoveOutDate: previous },
      transaction,
    );
    return contractDto(row, transaction);
  });
}

/* -------------------------------------------------------------------------- */
/* Settlement plan (shared by preview and settle)                              */
/* -------------------------------------------------------------------------- */

interface Utility {
  input: UtilityInput;
  summary: SettlementReading;
}

interface SettlementPlan {
  contract: ContractModel;
  roomId: string;
  moveOutDate: string;
  settlement: SettlementResult;
  allocation: DepositAllocation;
  /** Earlier invoices with something left, oldest first (same order as the allocation). */
  outstanding: InvoiceModel[];
  /** Readings the final utilities start from (and drafts they replace); locked on issue. */
  readings: MeterReadingModel[];
  preview: ContractSettlementPreview;
}

const finalField = (kind: MeterKind) => (kind === 'electricity' ? 'finalElectric' : 'finalWater');

/**
 * Utilities from the last billed reading to the final reading. The start is the latest
 * `locked` reading (used by an issued invoice) since the contract entered its room, else the
 * move-in/room-change reading; draft readings in between are covered by the final reading.
 * A meter replaced after that adds its closed segment (same rule as ST-13/ST-14).
 */
async function finalUtility(
  context: BillingContext,
  kind: MeterKind,
  service: BillingContext['definitions'][number],
  facts: Awaited<ReturnType<typeof contractFactsAt>>,
  entryDate: string,
  moveOutDate: string,
  finalReading: number | null | undefined,
  transaction: Transaction,
): Promise<{ utility: Utility; readings: MeterReadingModel[] }> {
  const field = finalField(kind);
  const meters = (
    await MeterModel.findAll({
      where: { roomId: facts.roomId, kind },
      order: [
        ['installedOn', 'ASC'],
        ['createdAt', 'ASC'],
      ],
      transaction,
    })
  ).filter(
    (meter) =>
      meter.installedOn <= moveOutDate && (!meter.removedOn || meter.removedOn >= entryDate),
  );
  const current = meters.at(-1);

  if (!current || (current.removedOn && current.removedOn <= moveOutDate))
    throw new BaseError('missing_meter', 422, 'billing_missing_meter', { reason: 'missing_meter' });
  if (finalReading === null || finalReading === undefined)
    invalid(field, 'Nhập chỉ số cuối lúc trả phòng.');
  const readings = await MeterReadingModel.findAll({
    where: {
      meterId: { [Op.in]: meters.map((meter) => meter.id) },
      readOn: { [Op.gte]: entryDate },
    },
    order: [
      ['period', 'ASC'],
      ['readOn', 'ASC'],
    ],
    transaction,
  });

  if (readings.some((reading) => reading.readOn > moveOutDate))
    throw new BaseError('reading_after_move_out', 409, 'reading_after_move_out', {
      moveOutDate: ['Đã có chỉ số ghi sau ngày trả phòng.'],
    });
  const baseline = readings.filter((reading) => reading.status === 'locked').at(-1) ?? null;
  const baselineIndex = baseline ? meters.findIndex((meter) => meter.id === baseline.meterId) : 0;
  const initial = kind === 'electricity' ? facts.initialElectric : facts.initialWater;
  const segments: MeterSegment[] = meters.slice(Math.max(0, baselineIndex)).map((meter) => ({
    meterId: meter.id,
    startReading:
      baseline?.meterId === meter.id
        ? baseline.reading
        : meter.installedOn <= entryDate
          ? initial
          : meter.initialReading,
    endReading: meter.id === current.id ? finalReading : meter.finalReading,
  }));
  const last = segments.at(-1);

  if (last && typeof last.startReading === 'number' && finalReading < last.startReading)
    invalid(field, `Chỉ số cuối phải ≥ ${last.startReading}.`);
  let consumption: number;

  try {
    consumption = meterConsumption(segments).consumption;
  } catch {
    invalid(field, 'Chỉ số cuối không hợp lệ.');
  }
  const used = readings.filter(
    (reading) =>
      reading === baseline ||
      (reading.status === 'draft' && (!baseline || reading.period > baseline.period)),
  );

  return {
    utility: {
      input: {
        kind,
        serviceId: service.id,
        code: service.code,
        name: service.name,
        unit: service.unit,
        unitPrice: priceOn(context, service, moveOutDate),
        segments,
      },
      summary: {
        kind,
        startReading: Number(segments[0]?.startReading ?? finalReading),
        endReading: finalReading,
        consumption,
      },
    },
    readings: used,
  };
}

/** Rent/service lines of issued invoices covering the move-out month or later (refund input). */
async function prepaidLines(
  invoices: InvoiceModel[],
  fromPeriod: string,
  transaction: Transaction,
) {
  const sources = invoices.filter((invoice) => invoice.period >= fromPeriod);
  const lines = await InvoiceLineModel.findAll({
    where: {
      invoiceId: { [Op.in]: sources.map((invoice) => invoice.id) },
      type: { [Op.in]: ['rent', 'service'] },
    },
    order: [
      ['invoiceId', 'ASC'],
      ['position', 'ASC'],
    ],
    transaction,
  });

  return lines.flatMap((line): PrepaidLineInput[] => {
    const { coveredFrom, coveredTo, serviceCode } = line.meta;

    if (
      (line.type !== 'rent' && line.type !== 'service') ||
      !line.period ||
      !coveredFrom ||
      !coveredTo ||
      line.unitPrice === null
    )
      return [];
    const name = line.description.params.name;

    return [
      {
        type: line.type,
        serviceId: line.serviceId,
        ...(serviceCode ? { code: serviceCode } : {}),
        ...(typeof name === 'string' ? { name } : {}),
        period: line.period,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        coveredFrom,
        coveredTo,
        sourceInvoiceId: line.invoiceId,
      },
    ];
  });
}

function billingFailure(error: unknown): never {
  if (!isBillingError(error)) throw error;
  const kind = error.details.kind;

  if (error.code === 'NEGATIVE_CONSUMPTION' && (kind === 'electricity' || kind === 'water'))
    invalid(finalField(kind), 'Chỉ số cuối nhỏ hơn chỉ số trước.');
  if (error.code === 'MOVE_OUT_BEFORE_START')
    invalid('moveOutDate', 'Ngày trả phòng trước ngày bắt đầu hợp đồng.');
  throw new BaseError('invalid_settlement', 422, 'invalid_settlement', {
    reason: error.code,
    detail: error.message,
  });
}

const sumOf = (lines: { amount: number }[]) => lines.reduce((sum, line) => sum + line.amount, 0);

async function settlementPlan(
  contract: ContractModel,
  input: ContractSettlementInput,
  transaction: Transaction,
  lock: boolean,
): Promise<SettlementPlan> {
  const moveOutDate = input.moveOutDate;

  if (contract.status !== 'active' && contract.status !== 'ending') conflict('contract_not_active');
  if (moveOutDate > today()) invalid('moveOutDate', 'Ngày trả phòng không được sau hôm nay.');
  if (moveOutDate < contract.startDate)
    invalid('moveOutDate', 'Ngày trả phòng trước ngày bắt đầu hợp đồng.');
  const moves = await ContractEventModel.findAll({
    where: { contractId: contract.id, type: 'room-change' },
    transaction,
  });

  if (moves.some((event) => String(event.payload.effectiveDate) > moveOutDate))
    conflict('contract_has_future_room_change');
  const facts = await contractFactsAt(contract.id, moveOutDate, transaction);
  const room = await RoomModel.findByPk(facts.roomId, {
    transaction,
    rejectOnEmpty: true,
    ...(lock ? { lock: transaction.LOCK.UPDATE } : {}),
  });
  const building = await BuildingModel.findByPk(contract.buildingId, {
    transaction,
    rejectOnEmpty: true,
  });
  const context = await billingContext(building, transaction);
  const invoices = await InvoiceModel.findAll({
    where: { contractId: contract.id, status: { [Op.ne]: 'void' } },
    // Oldest first: the deposit pays earlier periods before later ones.
    order: [
      ['period', 'ASC'],
      ['issuedOn', 'ASC'],
      ['createdAt', 'ASC'],
      ['id', 'ASC'],
    ],
    transaction,
    ...(lock ? { lock: transaction.LOCK.UPDATE } : {}),
  });
  const drafts: SettlementDraftInvoice[] = invoices
    .filter((invoice) => invoice.status === 'draft')
    .map((invoice) => ({ invoiceId: invoice.id, kind: invoice.kind, period: invoice.period }));

  if (drafts.length) conflict('contract_has_draft_invoices', { invoices: drafts });
  const entryDate = await contractRoomEntryDate(contract.id, moveOutDate, transaction);
  const registered = new Set(
    (await contractServicesAt(contract.id, moveOutDate, transaction)).map((row) => row.serviceId),
  );
  const utilities: Utility[] = [];
  const readings: MeterReadingModel[] = [];

  for (const service of context.definitions) {
    const kind = service.kind;

    if (!registered.has(service.id) || (kind !== 'electricity' && kind !== 'water')) continue;
    const result = await finalUtility(
      context,
      kind,
      service,
      facts,
      entryDate,
      moveOutDate,
      kind === 'electricity' ? input.finalElectric : input.finalWater,
      transaction,
    );

    utilities.push(result.utility);
    readings.push(...result.readings);
  }
  const issued = invoices.filter((invoice) =>
    ['issued', 'partially_paid', 'paid'].includes(invoice.status),
  );
  const periodic = issued.filter(
    (invoice) => invoice.kind === 'monthly' || invoice.kind === 'move_in',
  );
  const outstanding = issued.filter((invoice) => invoice.total > invoice.paidTotal);
  const deposits = await DepositEntryModel.findAll({
    where: { contractId: contract.id },
    transaction,
  });
  const depositHeld = depositBalance(deposits).held;
  const fixed = await fixedInputs(context, contract, moveOutDate, transaction);
  const refundUnusedRent = building.refundUnusedRent ?? (await billingDefaults()).refundUnusedRent;
  const surcharges: ManualLineInput[] = (input.surcharges ?? []).map((item) => ({
    type: 'surcharge',
    amount: item.amount,
    reason: item.reason,
  }));
  let settlement: SettlementResult;
  let allocation: DepositAllocation;

  try {
    settlement = computeSettlement({
      contract: { startDate: contract.startDate },
      moveOutDate,
      invoicedPeriods: [...new Set(periodic.map((invoice) => invoice.period))],
      charges: {
        rent: fixed.term.rent,
        occupantCount: fixed.occupantCount,
        vehicleCount: fixed.vehicleCount,
        services: fixed.services,
      },
      utilities: utilities.map((utility) => utility.input),
      refundUnusedRent,
      prepaidLines: await prepaidLines(periodic, periodOfIsoDate(moveOutDate), transaction),
      surcharges,
      outstandingInvoices: outstanding.map((invoice) => ({
        invoiceId: invoice.id,
        code: invoice.code,
        period: invoice.period,
        total: invoice.total,
        paidTotal: invoice.paidTotal,
      })),
      depositHeld,
      roundingUnit: context.roundingUnit,
    });
    allocation = allocateSettlementDeposit({
      depositHeld,
      settlementTotal: settlement.total,
      outstandingInvoices: settlement.outstandingInvoices,
    });
  } catch (error) {
    billingFailure(error);
  }
  const applied = new Map(
    allocation.allocations.flatMap((line) =>
      line.invoiceId ? [[line.invoiceId, line.amount]] : [],
    ),
  );
  const lines = settlement.lines.map((line) => ({ ...line }));
  const preview: ContractSettlementPreview = {
    contractId: contract.id,
    buildingId: contract.buildingId,
    roomId: room.id,
    roomCode: room.code,
    moveOutDate,
    period: settlement.period,
    refundUnusedRent,
    readings: utilities.map((utility) => utility.summary),
    lines,
    subtotal: settlement.subtotal,
    rounding: settlement.rounding,
    total: settlement.total,
    unbilledTotal: sumOf(lines.filter((line) => line.type === 'rent' || line.type === 'service')),
    utilitiesTotal: sumOf(
      lines.filter((line) => line.type === 'electricity' || line.type === 'water'),
    ),
    refundTotal: sumOf(lines.filter((line) => line.type === 'refund')),
    surchargeTotal: sumOf(lines.filter((line) => line.type === 'surcharge')),
    outstandingInvoices: outstanding.map((invoice) => ({
      invoiceId: invoice.id,
      code: invoice.code,
      kind: invoice.kind,
      period: invoice.period,
      total: invoice.total,
      paidTotal: invoice.paidTotal,
      remaining: invoice.total - invoice.paidTotal,
      depositApplied: applied.get(invoice.id) ?? 0,
    })),
    outstandingTotal: settlement.outstandingTotal,
    amountDue: settlement.amountDue,
    depositHeld,
    depositApplied: allocation.depositApplied,
    settlementDepositApplied: allocation.settlementDepositApplied,
    depositRefunded: allocation.depositRefunded,
    remainingDue: allocation.remainingDue,
    ownerRefunds: allocation.ownerRefunds,
    tenantPays: allocation.tenantPays,
  };

  return {
    contract,
    roomId: room.id,
    moveOutDate,
    settlement,
    allocation,
    outstanding,
    readings,
    preview,
  };
}

/** `POST /contracts/:id/settlement-preview`: no write, the same numbers as settle. */
export async function settlementPreview(
  user: StayUser,
  id: string,
  input: ContractSettlementInput,
): Promise<ContractSettlementPreview> {
  return auditedTransaction(async (transaction) => {
    const contract = await findContract(user, id, 'read', transaction, false);

    return (await settlementPlan(contract, input, transaction, false)).preview;
  });
}

/* -------------------------------------------------------------------------- */
/* Settle                                                                      */
/* -------------------------------------------------------------------------- */

interface DatedRow {
  fromDate: string;
  toDate: string | null;
  update(values: { toDate: string }, options: { transaction: Transaction }): Promise<unknown>;
}

/** Closes open registrations: present on D, gone from D + 1 (`toDate` is exclusive). */
async function endRegistrations(contractId: string, moveOutDate: string, transaction: Transaction) {
  const leaveOn = addDays(moveOutDate, 1);
  const where = { contractId };
  const rows: DatedRow[] = [
    ...(await ContractOccupantModel.findAll({ where, transaction })),
    ...(await ContractServiceModel.findAll({ where, transaction })),
    ...(await ContractVehicleModel.findAll({ where, transaction })),
  ];

  for (const row of rows)
    if (!row.toDate || row.toDate > leaveOn)
      // A registration starting later never becomes active (from = to).
      await row.update(
        { toDate: row.fromDate > leaveOn ? row.fromDate : leaveOn },
        { transaction },
      );
}

async function settleOnce(
  user: StayUser,
  id: string,
  input: ContractSettleInput,
  transaction: Transaction,
) {
  const contract = await findContract(user, id, 'settle', transaction, true);

  assertVersion(contract.version, input.version);
  const plan = await settlementPlan(contract, input, transaction, true);
  const { preview, allocation } = plan;
  const on = today();

  for (const field of ['electricPhotoFileId', 'waterPhotoFileId'] as const) {
    const fileId = input[field];

    if (
      fileId &&
      !(await attachableFile(user, fileId, 'contract_meter', contract.buildingId, transaction))
    )
      invalid(field, 'Ảnh không hợp lệ hoặc không thuộc toà này.');
  }
  const schedule = invoiceSchedule({
    kind: 'settlement',
    period: plan.settlement.period,
    issueDay: 1,
    dueDay: 1,
    today: on,
    eventDate: plan.moveOutDate,
  });
  const draft = await saveInvoiceDraft(
    contract,
    { invoice: plan.settlement, roomId: plan.roomId, readings: plan.readings, schedule },
    null,
    transaction,
  );

  await issueInvoices(user, [draft.id]);
  // Nothing to collect (refunds ≥ charges): the invoice is settled as soon as it is issued.
  if (plan.settlement.total <= 0)
    await applyInvoicePaidTotal(await draft.reload({ transaction }), 0, transaction);
  // Older invoices first, then the settlement invoice (`allocateSettlementDeposit`).
  for (const line of allocation.allocations) {
    if (line.amount <= 0) continue;
    const invoiceId = line.invoiceId ?? draft.id;

    await insertPayment(
      user,
      invoiceId,
      { amount: line.amount, method: 'deposit', paidOn: on, reference: null, note: null },
      transaction,
    );
    await applyDepositForSettlement(
      user,
      contract.id,
      { amount: line.amount, occurredOn: on, method: 'other', reason: null, invoiceId },
      transaction,
    );
  }
  if (allocation.depositRefunded > 0)
    await createDeposit(user, contract.id, {
      type: 'refunded',
      amount: allocation.depositRefunded,
      occurredOn: on,
      method: input.refundMethod ?? 'cash',
      reason: null,
    });
  await endRegistrations(contract.id, plan.moveOutDate, transaction);
  contract.set({ status: 'ended', movedOutAt: plan.moveOutDate });
  contract.changed('updatedAt', true);
  await contract.save({ transaction });
  const facts = {
    buildingId: contract.buildingId,
    contractId: contract.id,
    roomId: plan.roomId,
    invoiceId: draft.id,
    moveOutDate: plan.moveOutDate,
    total: preview.total,
    depositApplied: preview.depositApplied,
    depositRefunded: preview.depositRefunded,
    remainingDue: preview.remainingDue,
    ownerRefunds: preview.ownerRefunds,
    tenantPays: preview.tenantPays,
    version: contract.version,
  };

  await ContractEventModel.create(
    {
      contractId: contract.id,
      type: 'ended',
      actorId: user.id,
      payload: {
        ...facts,
        effectiveDate: plan.moveOutDate,
        finalElectric: input.finalElectric ?? null,
        finalWater: input.finalWater ?? null,
        electricPhotoFileId: input.electricPhotoFileId ?? null,
        waterPhotoFileId: input.waterPhotoFileId ?? null,
      },
    },
    { transaction },
  );
  await recordAudit(
    {
      action: 'contract.settled',
      resourceType: 'contract',
      resourceId: contract.id,
      changes: facts,
    },
    transaction,
  );
  return facts;
}

const numberOf = (value: unknown) => (typeof value === 'number' ? value : 0);

/**
 * `POST /contracts/:id/settle`, one transaction: lock the contract, room and invoices; refuse
 * drafts (409 with the list); create and issue the settlement invoice (readings it used are
 * locked); record the deposit as `deposit` payments on the invoices it pays and `applied`
 * entries; refund the rest; end registrations; contract → ended (room vacant). The same
 * `Idempotency-Key` and body replays the stored result.
 */
export async function settleContract(
  user: StayUser,
  id: string,
  input: ContractSettleInput,
  key: string,
): Promise<ContractSettlementResult> {
  return auditedTransaction(async (transaction) => {
    await findContract(user, id, 'settle', transaction, false);
    const { result, replayed } = await runIdempotent(
      {
        scope: `contract.settle.${id}`,
        actorId: user.id,
        key,
        payload: {
          version: input.version,
          moveOutDate: input.moveOutDate,
          finalElectric: input.finalElectric ?? null,
          finalWater: input.finalWater ?? null,
          electricPhotoFileId: input.electricPhotoFileId ?? null,
          waterPhotoFileId: input.waterPhotoFileId ?? null,
          refundMethod: input.refundMethod ?? 'cash',
          surcharges: (input.surcharges ?? []).map((item) => ({
            amount: item.amount,
            reason: item.reason,
          })),
        },
      },
      (tx) => settleOnce(user, id, input, tx),
    );
    const stored =
      typeof result === 'object' && result !== null && !Array.isArray(result) ? result : {};
    const invoiceId = typeof stored.invoiceId === 'string' ? stored.invoiceId : null;
    const contract = await ContractModel.findByPk(id, { transaction, rejectOnEmpty: true });

    if (!invoiceId) throw new Error('Invalid stored settlement');
    const summary = {
      depositApplied: numberOf(stored.depositApplied),
      depositRefunded: numberOf(stored.depositRefunded),
      remainingDue: numberOf(stored.remainingDue),
      ownerRefunds: numberOf(stored.ownerRefunds),
      tenantPays: numberOf(stored.tenantPays),
    };

    setAuditChanges({ ...stored, replayed });
    return {
      contract: await contractDto(contract, transaction),
      invoice: await getInvoice(user, invoiceId, transaction),
      ...summary,
      replayed,
    };
  });
}
