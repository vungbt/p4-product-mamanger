import { randomUUID } from 'node:crypto';
import { BaseError, NotFound, buildPaginationMeta, setAuditChanges } from '@p4/server-core';
import type { ListQuery } from '@p4/shared';
import { computeMonthlyInvoice, computeMoveInInvoice, finalizeInvoice, manualLines, type ComputedInvoice, type FixedServiceInput, type InvoiceLine, type UtilityInput } from '@stay/billing';
import { daysInPeriod, formatInvoiceCode, isInvoiceOverdue, isoDateInTimeZone, previousPeriod, type BillingPreview, type InvoiceManualInput, type StayAction, type StayInvoice, type StayUser } from '@stay/shared';
import { Op, QueryTypes, type Transaction, type WhereOptions } from 'sequelize';
import { canAccessRecord, accessibleBuildingIds } from '@/middlewares/ability.middleware.js';
import { BuildingModel, BuildingServicePriceModel, ContractModel, InvoiceModel, InvoiceLineModel, InvoiceSequenceModel, MeterModel, MeterReadingModel, RoomModel, ServiceDefinitionModel, sequelize } from '@/sequelize/models/index.js';
import type { InvoiceAttributes } from '@/sequelize/models/invoice.model.js';
import { auditedTransaction, recordAudit } from '@/shared/audit.js';
import { runIdempotent } from '@/shared/persistence.js';
import { resolveBuildingPrice } from '../buildings/building-prices.service.js';
import { contractFactsAt, contractOccupantsAt, contractServicesAt, contractVehiclesAt, contractRoomClosingsForPeriod } from '../contracts/contracts.resolvers.js';
import { periodBounds, periodMeter } from '../readings/readings.service.js';
import { billingDefaults } from '../settings/settings.service.js';

const fail = (code: string): never => { throw new BaseError(code, 409, code); };
const day = (period: string, value: number) => `${period}-${String(Math.min(value, daysInPeriod(period))).padStart(2, '0')}`;

async function building(user: StayUser, id: string, action: StayAction, tx: Transaction) {
  if (!canAccessRecord(user, action, 'Invoice', { buildingId: id })) throw new NotFound();
  const row = await BuildingModel.findByPk(id, { transaction: tx });
  if (!row) throw new NotFound();
  if (action !== 'read' && row.archivedAt) fail('building_archived');
  return row;
}

async function find(user: StayUser, id: string, action: StayAction, tx: Transaction) {
  const row = await InvoiceModel.findByPk(id, { transaction: tx });
  if (!row || !canAccessRecord(user, action, 'Invoice', { buildingId: row.buildingId, contractId: row.contractId })) throw new NotFound();
  return row;
}

async function dto(row: InvoiceModel, tx?: Transaction): Promise<StayInvoice> {
  const [room, lines] = await Promise.all([
    RoomModel.findByPk(row.roomId, { transaction: tx }),
    InvoiceLineModel.findAll({ where: { invoiceId: row.id }, order: [['position', 'ASC']], transaction: tx }),
  ]);
  return { id: row.id, buildingId: row.buildingId, contractId: row.contractId, roomId: row.roomId,
    roomCode: room?.code ?? '', kind: row.kind, period: row.period, code: row.code, status: row.status,
    issuedOn: row.issuedOn, dueOn: row.dueOn, subtotal: row.subtotal, rounding: row.rounding,
    roundingUnit: row.roundingUnit, total: row.total, paidTotal: row.paidTotal, remaining: row.total - row.paidTotal,
    overdue: isInvoiceOverdue(row.status, row.dueOn, isoDateInTimeZone(new Date())), voidReason: row.voidReason,
    version: row.version, lines: lines.map(l => ({ id: l.id, type: l.type, serviceId: l.serviceId,
      description: l.description, period: l.period, quantity: l.quantity, unit: l.unit, unitPrice: l.unitPrice,
      ratioNum: l.ratioNum, ratioDen: l.ratioDen, amount: l.amount, meta: l.meta })) };
}

async function audit(user: StayUser, row: InvoiceModel, action: string, tx: Transaction) {
  const changes = { buildingId: row.buildingId, contractId: row.contractId, invoiceId: row.id, status: row.status, version: row.version };
  setAuditChanges(changes);
  await recordAudit({ actorId: user.id, action: `invoice.${action}`, resourceType: 'invoice', resourceId: row.id, changes }, tx);
}

/** Only loads dated inputs; every monetary calculation is owned by @stay/billing. */
async function compute(contract: ContractModel, period: string, moveIn: boolean, tx: Transaction) {
  const b = await BuildingModel.findByPk(contract.buildingId, { transaction: tx, rejectOnEmpty: true });
  const defaults = await billingDefaults();
  const issueDate = moveIn ? contract.startDate : day(period, b.issueDay ?? defaults.issueDay);
  const [facts, occupants, vehicles, registrations, prices, definitions] = await Promise.all([
    contractFactsAt(contract.id, issueDate, tx), contractOccupantsAt(contract.id, issueDate, tx),
    contractVehiclesAt(contract.id, issueDate, tx), contractServicesAt(contract.id, issueDate, tx),
    BuildingServicePriceModel.findAll({ where: { buildingId: b.id }, transaction: tx }),
    ServiceDefinitionModel.findAll({ transaction: tx }),
  ]);
  const services: FixedServiceInput[] = [];
  const utilities: UtilityInput[] = [];
  const readingIds = new Set<string>();
  const rate = (s: ServiceDefinitionModel) => resolveBuildingPrice(s.defaultPrice, prices.filter(p => p.serviceId === s.id), issueDate).price;
  const oldSegments = moveIn ? [] : await contractRoomClosingsForPeriod(contract.id, period, tx);
  for (const s of definitions) {
    if (!registrations.some(r => r.serviceId === s.id)) continue;
    if (s.kind !== 'electricity' && s.kind !== 'water') {
      services.push({ serviceId: s.id, code: s.code, name: s.name, kind: s.kind, unit: s.unit, unitPrice: rate(s) });
      continue;
    }
    if (moveIn || contract.startDate.slice(0, 7) >= period) continue;
    // A room move stores a closing segment independently of the destination's monthly closing.
    for (const closing of oldSegments) {
      const oldRoomId = String(closing.oldRoomId);
      const oldFacts = await contractFactsAt(contract.id, String(closing.effectiveDate).slice(0, 8) + '01', tx);
      const meter = await MeterModel.findOne({ where: { roomId: oldRoomId, kind: s.kind }, order: [['installedOn', 'DESC']], transaction: tx });
      const prior = meter ? await MeterReadingModel.findOne({ where: { meterId: meter.id, period: { [Op.lt]: previousPeriod(period) } }, order: [['period', 'DESC']], transaction: tx }) : null;
      if (prior) readingIds.add(prior.id);
      const initial = s.kind === 'electricity' ? Number(closing.oldInitialElectric ?? oldFacts.initialElectric) : Number(closing.oldInitialWater ?? oldFacts.initialWater);
      utilities.push({ kind: s.kind, serviceId: s.id, name: s.name, unit: s.unit, unitPrice: rate(s), segments: [{ meterId: meter?.id, startReading: prior?.reading ?? initial, endReading: Number(s.kind === 'electricity' ? closing.closingElectric : closing.closingWater) }] });
    }
    const consumptionPeriod = previousPeriod(period);
    const atEnd = await contractFactsAt(contract.id, periodBounds(consumptionPeriod).end, tx);
    // Use a detached model so dated room/baseline resolution cannot mutate the live contract.
    const dated = ContractModel.build({ ...contract.get(), ...atEnd });
    const grid = await periodMeter(dated, s.kind, consumptionPeriod, tx);
    if (!grid?.current || !grid.segments?.length) throw new BaseError(`Thiếu chỉ số ${s.name} kỳ ${consumptionPeriod}`, 422, 'missing_reading');
    utilities.push({ kind: s.kind, serviceId: s.id, name: s.name, unit: s.unit, unitPrice: rate(s), segments: grid.segments });
    const readings = await MeterReadingModel.findAll({ where: { meterId: { [Op.in]: grid.segments.map(x => x.meterId) }, period: { [Op.lte]: consumptionPeriod } }, transaction: tx });
    for (const r of readings) readingIds.add(r.id);
  }
  const input = { contract: { startDate: contract.startDate, endDate: contract.endDate, rent: facts.rent }, occupantCount: occupants.length, vehicleCount: vehicles.length, services, roundingUnit: b.roundingUnit ?? defaults.roundingUnit };
  const result = moveIn ? computeMoveInInvoice(input) : computeMonthlyInvoice({ ...input, period, utilities });
  let utilityIndex = 0;
  for (const line of result.lines) {
    if (line.type !== 'electricity' && line.type !== 'water') continue;
    const utility = utilities[utilityIndex++];
    const closing = oldSegments.find(c => utility?.segments.some(s => s.meterId) && Number(line.meta.endReading) === Number(line.type === 'electricity' ? c.closingElectric : c.closingWater));
    if (closing) { line.meta.sourceEventId = closing.eventId; line.meta.roomId = String(closing.oldRoomId); }
  }
  return { result, readingIds: [...readingIds], roomId: facts.roomId, dueOn: day(period, b.dueDay ?? defaults.dueDay) };
}

async function saveLines(row: InvoiceModel, result: ComputedInvoice, tx: Transaction) {
  await InvoiceLineModel.destroy({ where: { invoiceId: row.id }, transaction: tx });
  await InvoiceLineModel.bulkCreate(result.lines.map((l, position) => ({ ...l, invoiceId: row.id, position })), { transaction: tx });
  await row.update({ subtotal: result.subtotal, rounding: result.rounding, total: result.total }, { transaction: tx });
}

async function persist(user: StayUser, contract: ContractModel, period: string, moveIn: boolean, tx: Transaction) {
  const kind = moveIn ? 'move_in' : 'monthly';
  let row = await InvoiceModel.findOne({ where: { contractId: contract.id, ...(moveIn ? {} : { period }), kind, status: { [Op.ne]: 'void' } }, transaction: tx });
  if (row && (row.status !== 'draft' || moveIn)) return row;
  const loaded = await compute(contract, period, moveIn, tx);
  if (!row) row = await InvoiceModel.create({ buildingId: contract.buildingId, contractId: contract.id, roomId: loaded.roomId, kind, period: loaded.result.period, dueOn: loaded.dueOn, subtotal: loaded.result.subtotal, rounding: loaded.result.rounding, total: loaded.result.total, roundingUnit: loaded.result.roundingUnit }, { transaction: tx });
  else {
    const existing = await InvoiceLineModel.findAll({ where: { invoiceId: row.id, type: { [Op.in]: ['surcharge', 'discount'] } }, transaction: tx });
    loaded.result = finalizeInvoice(kind, period, [...loaded.result.lines.filter(l => l.type !== 'rounding'), ...existing.map(l => ({ type: l.type, serviceId: l.serviceId, description: l.description, period: l.period, quantity: l.quantity, unit: l.unit, unitPrice: l.unitPrice, ratioNum: l.ratioNum, ratioDen: l.ratioDen, amount: l.amount, meta: l.meta }))], loaded.result.roundingUnit);
    await row.update({ roomId: loaded.roomId, dueOn: loaded.dueOn, roundingUnit: loaded.result.roundingUnit }, { transaction: tx });
  }
  await saveLines(row, loaded.result, tx);
  await sequelize.query('DELETE FROM invoice_meter_readings WHERE invoice_id=:id', { replacements: { id: row.id }, transaction: tx });
  for (const id of loaded.readingIds) await sequelize.query('INSERT INTO invoice_meter_readings(invoice_id,reading_id,reading_value) SELECT :invoiceId,id,reading FROM meter_readings WHERE id=:id', { replacements: { invoiceId: row.id, id }, transaction: tx });
  await audit(user, row, 'draft', tx);
  return row;
}

/** Activation calls in its existing transaction after validating the contract. */
export async function createMoveInForActivation(user: StayUser, contract: ContractModel, tx: Transaction) {
  return persist(user, contract, contract.startDate.slice(0, 7), true, tx);
}

export async function createMoveInDraft(user: StayUser, id: string): Promise<StayInvoice> {
  return auditedTransaction(async tx => {
    const c = await ContractModel.findByPk(id, { transaction: tx, lock: tx.LOCK.UPDATE });
    if (!c || !canAccessRecord(user, 'create', 'Invoice', { buildingId: c.buildingId, contractId: c.id })) throw new NotFound();
    if (!['active', 'ending'].includes(c.status)) fail('contract_not_active');
    const monthly = await InvoiceModel.count({ where: { contractId: id, period: c.startDate.slice(0, 7), kind: 'monthly', status: { [Op.ne]: 'void' } }, transaction: tx });
    if (monthly) fail('period_already_invoiced');
    return dto(await createMoveInForActivation(user, c, tx), tx);
  });
}

async function preview(user: StayUser, buildingId: string, period: string, tx: Transaction): Promise<BillingPreview> {
  await building(user, buildingId, 'read', tx);
  const contracts = await ContractModel.findAll({ where: { buildingId, status: { [Op.in]: ['active', 'ending'] }, startDate: { [Op.lte]: periodBounds(period).end }, [Op.or]: [{ endDate: null }, { endDate: { [Op.gte]: `${period}-01` } }] }, order: [['id', 'ASC']], transaction: tx });
  const rows: BillingPreview['rows'] = [];
  for (const c of contracts) {
    const facts = await contractFactsAt(c.id, `${period}-01`, tx);
    const room = await RoomModel.findByPk(facts.roomId, { transaction: tx });
    const existing = await InvoiceModel.findOne({ where: { contractId: c.id, period, kind: { [Op.in]: ['monthly', 'move_in'] }, status: { [Op.ne]: 'void' } }, transaction: tx });
    let reason: string | null = existing && (existing.kind === 'move_in' || existing.status !== 'draft') ? 'Kỳ đã có hoá đơn' : null;
    let total: number | null = null;
    if (!reason) {
      try { total = (await compute(c, period, false, tx)).result.total; }
      catch (error) { if (!(error instanceof BaseError)) throw error; reason = error.message; }
    }
    rows.push({ contractId: c.id, roomId: facts.roomId, roomCode: room?.code ?? '', eligible: !reason, reason, total, invoiceId: existing?.id ?? null });
  }
  setAuditChanges({ buildingId, period });
  return { buildingId, period, rows, expectedTotal: rows.reduce((sum, r) => sum + (r.total ?? 0), 0) };
}

export const billingPreview = (user: StayUser, buildingId: string, period: string): Promise<BillingPreview> => auditedTransaction(tx => preview(user, buildingId, period, tx));

export async function createDrafts(user: StayUser, buildingId: string, period: string, key: string): Promise<BillingPreview> {
  await auditedTransaction(tx => building(user, buildingId, 'create', tx));
  await runIdempotent({ scope: `billing.${buildingId}.${period}`, actorId: user.id, key, payload: { buildingId, period } }, async tx => {
    await BuildingModel.findByPk(buildingId, { transaction: tx, lock: tx.LOCK.UPDATE });
    const p = await preview(user, buildingId, period, tx);
    for (const r of p.rows) {
      if (!r.eligible) continue;
      const c = await ContractModel.findByPk(r.contractId, { transaction: tx, lock: tx.LOCK.UPDATE, rejectOnEmpty: true });
      const invoice = await persist(user, c, period, false, tx);
      r.invoiceId = invoice.id;
    }
    return null;
  });
  return billingPreview(user, buildingId, period);
}

export function getInvoice(user: StayUser, id: string): Promise<StayInvoice> {
  return auditedTransaction(async tx => dto(await find(user, id, 'read', tx), tx));
}

export interface InvoiceListQuery extends ListQuery<'createdAt' | 'period' | 'code' | 'total' | 'dueOn'> {
  buildingId?: string; period?: string; roomId?: string; contractId?: string; kind?: InvoiceAttributes['kind']; status?: InvoiceAttributes['status']; overdue?: boolean;
}

export async function listInvoices(user: StayUser, query: InvoiceListQuery) {
  if (query.buildingId && !canAccessRecord(user, 'read', 'Invoice', { buildingId: query.buildingId })) throw new NotFound();
  const conditions: WhereOptions<InvoiceAttributes>[] = [];
  const ids = accessibleBuildingIds(user, 'read');
  if (user.role === 'tenant') conditions.push({ contractId: { [Op.in]: user.contractIds } });
  else if (ids !== 'all') conditions.push({ buildingId: { [Op.in]: ids } });
  for (const field of ['buildingId', 'period', 'roomId', 'contractId', 'kind', 'status'] as const) if (query[field]) conditions.push({ [field]: query[field] });
  if (query.q) conditions.push({ code: { [Op.iLike]: `%${query.q.replace(/[%_\\]/g, '\\$&')}%` } });
  if (query.overdue) conditions.push({ status: { [Op.in]: ['issued', 'partially_paid'] }, dueOn: { [Op.lt]: isoDateInTimeZone(new Date()) } });
  const { rows, count } = await InvoiceModel.findAndCountAll({ where: { [Op.and]: conditions }, order: [[query.sortBy ?? 'createdAt', query.sortOrder === 'asc' ? 'ASC' : 'DESC'], ['id', 'ASC']], limit: query.pageSize, offset: (query.page - 1) * query.pageSize });
  return { data: await Promise.all(rows.map(r => dto(r))), meta: buildPaginationMeta(query.page, query.pageSize, count) };
}

export async function changeManualLine(user: StayUser, id: string, input?: InvoiceManualInput, lineId?: string): Promise<StayInvoice> {
  return auditedTransaction(async tx => {
    const row = await find(user, id, input ? 'update' : 'delete', tx);
    await row.reload({ transaction: tx, lock: tx.LOCK.UPDATE });
    if (row.status !== 'draft') fail('invoice_not_draft');
    const lines = await InvoiceLineModel.findAll({ where: { invoiceId: id }, order: [['position', 'ASC']], transaction: tx });
    if (lineId && !lines.some(l => l.id === lineId && ['surcharge', 'discount'].includes(l.type))) fail('line_not_manual');
    const kept: InvoiceLine[] = lines.filter(l => l.type !== 'rounding' && l.id !== lineId).map(l => ({ type: l.type, serviceId: l.serviceId, description: l.description, period: l.period, quantity: l.quantity, unit: l.unit, unitPrice: l.unitPrice, ratioNum: l.ratioNum, ratioDen: l.ratioDen, amount: l.amount, meta: l.meta }));
    if (input) {
      const added = manualLines([{ type: input.type, amount: input.amount, reason: input.reason }], 'manualLines');
      for (const l of added) l.description.params.description = input.description;
      kept.push(...added);
    }
    await saveLines(row, finalizeInvoice(row.kind, row.period, kept, row.roundingUnit), tx);
    await audit(user, row, input ? 'line_added' : 'line_deleted', tx);
    return dto(row, tx);
  });
}

async function lockRooms(rows: InvoiceModel[], tx: Transaction) {
  const links = await sequelize.query<{ roomId: string }>('SELECT DISTINCT m.room_id AS "roomId" FROM invoice_meter_readings l JOIN meter_readings r ON r.id=l.reading_id JOIN meters m ON m.id=r.meter_id WHERE l.invoice_id IN (:ids)', { replacements: { ids: rows.map(r => r.id) }, type: QueryTypes.SELECT, transaction: tx });
  const ids = [...new Set([...rows.map(r => r.roomId), ...links.map(l => l.roomId)])].sort();
  await RoomModel.findAll({ where: { id: ids }, order: [['id', 'ASC']], lock: tx.LOCK.UPDATE, transaction: tx });
}

export async function issueInvoices(user: StayUser, ids: string[]): Promise<StayInvoice[]> {
  return auditedTransaction(async tx => {
    const rows = await Promise.all([...new Set(ids)].sort().map(id => find(user, id, 'issue', tx)));
    await lockRooms(rows, tx);
    for (const row of rows) await row.reload({ transaction: tx, lock: tx.LOCK.UPDATE });
    for (const row of [...rows].sort((a,b) => a.buildingId.localeCompare(b.buildingId) || a.period.localeCompare(b.period))) {
      if (row.status !== 'draft') fail('invoice_not_draft');
      const b = await building(user, row.buildingId, 'issue', tx);
      const stale = await sequelize.query('SELECT 1 FROM invoice_meter_readings l JOIN meter_readings r ON r.id=l.reading_id WHERE l.invoice_id=:id AND l.reading_value<>r.reading LIMIT 1', { replacements: { id: row.id }, transaction: tx, type: QueryTypes.SELECT });
      if (stale.length) fail('invoice_readings_changed_refresh_required');
      const lines = await InvoiceLineModel.findAll({ where: { invoiceId: row.id }, transaction: tx });
      if (lines.reduce((sum,l) => sum + l.amount, 0) !== row.total) fail('invoice_total_mismatch');
      // ON CONFLICT waits for concurrent creators; SELECT FOR UPDATE serializes allocation.
      await sequelize.query('INSERT INTO invoice_sequences(id,building_id,period,last_number) VALUES(:id,:buildingId,:period,0) ON CONFLICT(building_id,period) DO NOTHING', { replacements: { id: randomUUID(), buildingId: row.buildingId, period: row.period }, transaction: tx });
      const seq = await InvoiceSequenceModel.findOne({ where: { buildingId: row.buildingId, period: row.period }, lock: tx.LOCK.UPDATE, transaction: tx, rejectOnEmpty: true });
      if (seq.lastNumber >= 999) fail('invoice_sequence_exhausted');
      await seq.update({ lastNumber: seq.lastNumber + 1 }, { transaction: tx });
      await row.update({ code: formatInvoiceCode(b.code, row.period, seq.lastNumber), status: 'issued', issuedOn: row.kind === 'move_in' ? isoDateInTimeZone(new Date()) : day(row.period, b.issueDay ?? (await billingDefaults()).issueDay) }, { transaction: tx });
      await sequelize.query("UPDATE meter_readings SET status='locked', version=version+1 WHERE id IN (SELECT reading_id FROM invoice_meter_readings WHERE invoice_id=:id) AND status<>'locked'", { replacements: { id: row.id }, transaction: tx });
      await audit(user, row, 'issued', tx);
    }
    return Promise.all(rows.map(r => dto(r, tx)));
  });
}

export async function voidInvoice(user: StayUser, id: string, reason: string): Promise<StayInvoice> {
  return auditedTransaction(async tx => {
    const row = await find(user, id, 'void', tx);
    await lockRooms([row], tx);
    await row.reload({ transaction: tx, lock: tx.LOCK.UPDATE });
    if (row.status !== 'issued' || row.paidTotal !== 0 || !reason.trim()) fail('invoice_cannot_void');
    await row.update({ status: 'void', voidReason: reason.trim() }, { transaction: tx });
    await sequelize.query("UPDATE meter_readings SET status='draft', version=version+1 WHERE id IN (SELECT reading_id FROM invoice_meter_readings WHERE invoice_id=:id) AND NOT EXISTS (SELECT 1 FROM invoice_meter_readings l JOIN invoices i ON i.id=l.invoice_id WHERE l.reading_id=meter_readings.id AND i.status IN ('issued','partially_paid','paid'))", { replacements: { id }, transaction: tx });
    await audit(user, row, 'voided', tx);
    return dto(row, tx);
  });
}
