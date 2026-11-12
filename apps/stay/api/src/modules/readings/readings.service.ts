import {
  BaseError,
  InputValidError,
  NotFound,
  selectFields,
  setAuditChanges,
} from '@p4/server-core';
import { type MeterSegment, meterConsumption } from '@stay/billing';
import {
  type BillingSettings,
  isInReadingWindow,
  type MeterReadingInput,
  type MeterReplacementInput,
  type ReadingGrid,
  type ReadingMeter,
  readingDateOf,
  readingWindow,
  type StayMeterReading,
  type StayUser,
} from '@stay/shared';
import { Op, QueryTypes, type Transaction } from 'sequelize';
import { canAccessRecord } from '@/middlewares/ability.middleware.js';
import { accessibleWhere } from '@/middlewares/accessible-where.js';
import {
  BuildingModel,
  ContractModel,
  FileModel,
  MeterModel,
  MeterReadingModel,
  RoomModel,
  sequelize,
} from '@/sequelize/models/index.js';
import { auditedTransaction } from '@/shared/audit.js';
import { assertVersion } from '@/shared/input.js';
import { runIdempotent } from '@/shared/persistence.js';
import { buildingBilling } from '../settings/settings.service.js';
import { attachableFile, signedFileUrl } from '../uploads/uploads.service.js';

const fields = [
  'id',
  'meterId',
  'period',
  'reading',
  'readOn',
  'photoFileId',
  'status',
  'version',
] as const;

export function periodBounds(period: string) {
  const year = Number(period.slice(0, 4));
  const month = Number(period.slice(5, 7));
  return {
    start: `${period}-01`,
    end: new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10),
  };
}

async function readingDto(
  row: MeterReadingModel,
  transaction: Transaction,
): Promise<StayMeterReading> {
  const file = row.photoFileId ? await FileModel.findByPk(row.photoFileId, { transaction }) : null;
  return { ...selectFields(row, fields), photo: file ? signedFileUrl(file) : null };
}

export async function readingBuilding(
  user: StayUser,
  buildingId: string,
  write: boolean,
  transaction: Transaction,
) {
  if (!canAccessRecord(user, write ? 'update' : 'read', 'MeterReading', { buildingId }))
    throw new NotFound();
  const building = await BuildingModel.findOne({
    where: {
      [Op.and]: [
        { id: buildingId },
        accessibleWhere(user, write ? 'update' : 'read', 'MeterReading', { buildingId: 'id' }),
      ],
    },
    transaction,
  });
  if (!building) throw new NotFound();
  if (write && building.archivedAt)
    throw new BaseError('building_archived', 409, 'building_archived');
  return building;
}

async function context(user: StayUser, meterId: string, transaction: Transaction) {
  const meter = await MeterModel.findByPk(meterId, { transaction });
  if (!meter) throw new NotFound();
  const room = await RoomModel.findByPk(meter.roomId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!room) throw new NotFound();
  await readingBuilding(user, room.buildingId, true, transaction);
  if (room.archivedAt) throw new BaseError('room_archived', 409, 'room_archived');
  await meter.reload({ transaction });
  const contract = await ContractModel.findOne({
    where: { roomId: room.id, status: { [Op.in]: ['active', 'ending'] } },
    transaction,
  });
  if (!contract) throw new BaseError('room_has_no_contract', 409, 'room_has_no_contract');
  return { meter, room, contract };
}

/** Contract facts the meter chain depends on; invoices pass the room/baseline at a date. */
export type MeterContract = Pick<
  ContractModel,
  'roomId' | 'startDate' | 'initialElectric' | 'initialWater'
>;

/** Meters of the window, the baseline/closing readings used and the closed-meter segments. */
async function meterWindow(
  contract: MeterContract,
  kind: 'electricity' | 'water',
  period: string,
  transaction: Transaction,
) {
  const { start, end } = periodBounds(period);
  if (contract.startDate > end) return null;
  const meters = await MeterModel.findAll({
    where: {
      roomId: contract.roomId,
      kind,
      installedOn: { [Op.lte]: end },
      [Op.or]: [
        { removedOn: null },
        { removedOn: { [Op.gte]: start > contract.startDate ? start : contract.startDate } },
      ],
    },
    order: [
      ['installedOn', 'ASC'],
      ['createdAt', 'ASC'],
    ],
    transaction,
  });
  const last = meters.at(-1);
  if (!last) return null;
  const segments: MeterSegment[] = [];
  const baselines: MeterReadingModel[] = [];
  let previous = 0;
  let current: MeterReadingModel | null = null;
  for (const meter of meters) {
    const prior = await MeterReadingModel.findOne({
      where: {
        meterId: meter.id,
        period: { [Op.lt]: period },
        readOn: { [Op.gte]: contract.startDate },
      },
      order: [['period', 'DESC']],
      transaction,
    });
    if (prior) baselines.push(prior);
    const baseline =
      prior?.reading ??
      (meter.installedOn <= contract.startDate
        ? kind === 'electricity'
          ? contract.initialElectric
          : contract.initialWater
        : meter.initialReading);
    if (meter.id === last.id) {
      previous = baseline;
      current = await MeterReadingModel.findOne({
        where: { meterId: meter.id, period },
        transaction,
      });
    } else if (meter.finalReading !== null) {
      segments.push({ meterId: meter.id, startReading: baseline, endReading: meter.finalReading });
    }
  }
  return { last, segments, previous, current, baselines };
}

/** The same segment computation serves grid, validation and ST-14 invoice snapshots. */
export async function periodMeter(
  contract: MeterContract,
  kind: 'electricity' | 'water',
  period: string,
  transaction: Transaction,
): Promise<ReadingMeter | null> {
  const window = await meterWindow(contract, kind, period, transaction);
  if (!window) return null;
  const { last, segments, previous, current } = window;
  const carriedConsumption = segments.length ? meterConsumption(segments).consumption : 0;
  const consumption = current
    ? meterConsumption([
        ...segments,
        { meterId: last.id, startReading: previous, endReading: current.reading },
      ]).consumption
    : null;
  return {
    meterId: last.id,
    kind,
    previous,
    carriedConsumption,
    current: current ? await readingDto(current, transaction) : null,
    consumption,
    average: null,
    warnings: consumption === 0 ? ['zero_consumption'] : [],
  };
}

/**
 * ST-14: billed segments of `period` (the consumption month) and the meter readings they use.
 * `null` when the contract has no day in `period` or the room has no meter of `kind`;
 * `segments` is `null` when the closing reading of `period` is missing.
 */
export async function periodMeterUsage(
  contract: MeterContract,
  kind: 'electricity' | 'water',
  period: string,
  transaction: Transaction,
): Promise<{ segments: MeterSegment[] | null; readings: MeterReadingModel[] } | 'no_meter' | null> {
  if (contract.startDate > periodBounds(period).end) return null;
  const window = await meterWindow(contract, kind, period, transaction);
  if (!window) return 'no_meter';
  const { last, segments, previous, current, baselines } = window;
  if (!current) return { segments: null, readings: baselines };
  return {
    segments: [
      ...segments,
      { meterId: last.id, startReading: previous, endReading: current.reading },
    ],
    readings: [...baselines, current],
  };
}

async function withAverage(
  contract: MeterContract,
  kind: 'electricity' | 'water',
  period: string,
  transaction: Transaction,
) {
  const result = await periodMeter(contract, kind, period, transaction);
  if (!result) return null;
  const year = Number(period.slice(0, 4));
  const month = Number(period.slice(5, 7));
  const values: number[] = [];
  for (let offset = 1; offset <= 3; offset++) {
    const priorPeriod = new Date(Date.UTC(year, month - 1 - offset, 1)).toISOString().slice(0, 7);
    const prior = await periodMeter(contract, kind, priorPeriod, transaction);
    if (prior?.consumption !== null && prior?.consumption !== undefined)
      values.push(prior.consumption);
  }
  result.average = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  if (
    result.consumption !== null &&
    result.average !== null &&
    result.consumption > 2 * result.average
  )
    result.warnings.push('high_consumption');
  return result;
}

/**
 * CTEs `grid` (rooms of the closing grid of consumption month `:readingPeriod`) and `closed`
 * (`complete` when both current meters have a reading of that period). Parameters:
 * `:buildingId`, `:holdingStatuses`, `:readingPeriod`, `:readingStart`, `:readingEnd`.
 * Shared by the overview to-do and the reading-day reminders (ST-19, ST-26).
 */
export const READING_PROGRESS_CTE = `grid AS (
  SELECT DISTINCT ON (c.room_id) c.room_id, c.start_date
  FROM contracts c
  WHERE c.building_id = :buildingId
    AND c.status IN (:holdingStatuses)
    AND c.start_date <= CAST(:readingEnd AS date)
  ORDER BY c.room_id, c.start_date
),
closed AS (
  SELECT g.room_id,
    (
      SELECT COUNT(*)
      FROM (
        SELECT DISTINCT ON (m.kind) m.id
        FROM meters m
        WHERE m.room_id = g.room_id
          AND m.installed_on <= CAST(:readingEnd AS date)
          AND (m.removed_on IS NULL
            OR m.removed_on >= GREATEST(CAST(:readingStart AS date), g.start_date))
        ORDER BY m.kind, m.installed_on DESC, m.created_at DESC
      ) last
      JOIN meter_readings mr ON mr.meter_id = last.id AND mr.period = :readingPeriod
    ) = 2 AS complete
  FROM grid g
)`;

/** Rooms of the closing grid of consumption month `period` and how many still lack readings. */
export async function readingProgress(
  buildingId: string,
  period: string,
  transaction?: Transaction,
): Promise<{ rooms: number; missing: number }> {
  const { start, end } = periodBounds(period);
  const [row] = await sequelize.query<{ rooms: number; missing: number }>(
    `WITH ${READING_PROGRESS_CTE}
    SELECT CAST(COUNT(*) AS int) AS rooms, CAST(COUNT(*) FILTER (WHERE NOT complete) AS int) AS missing
    FROM closed`,
    {
      replacements: {
        buildingId,
        holdingStatuses: ['active', 'ending'],
        readingPeriod: period,
        readingStart: start,
        readingEnd: end,
      },
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  return { rooms: row?.rooms ?? 0, missing: row?.missing ?? 0 };
}

const displayDate = (date: string) =>
  `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;

/** `readOn` must fall in the reading window of `period` (rules.md "Lịch thu"). */
function assertReadingWindow(period: string, readOn: string, billing: BillingSettings) {
  const window = readingWindow(period, billing);

  if (!isInReadingWindow(readOn, window))
    throw new InputValidError('input_valid_error', {
      readOn: [
        `Ngày đọc của kỳ ${period.slice(5)}/${period.slice(0, 4)} phải từ ${displayDate(window.from)} đến ${displayDate(window.to)}.`,
      ],
    });
}

export async function readingGrid(
  user: StayUser,
  buildingId: string,
  period: string,
): Promise<ReadingGrid> {
  return auditedTransaction(async (transaction) => {
    const building = await readingBuilding(user, buildingId, false, transaction);
    const billing = await buildingBilling(building, transaction);
    const window = readingWindow(period, billing);
    const contracts = await ContractModel.findAll({
      where: { buildingId, status: { [Op.in]: ['active', 'ending'] } },
      transaction,
    });
    const rooms = await RoomModel.findAll({
      where: { id: contracts.map((c) => c.roomId) },
      order: [
        ['floor', 'ASC'],
        ['code', 'ASC'],
      ],
      transaction,
    });
    const result: ReadingGrid = {
      buildingId,
      period,
      readingDayMonth: billing.readingDayMonth,
      readingOn: readingDateOf(period, billing),
      readOnFrom: window.from,
      readOnTo: window.to,
      rooms: [],
    };
    for (const room of rooms) {
      const contract = contracts.find((c) => c.roomId === room.id);
      if (!contract || contract.startDate > periodBounds(period).end) continue;
      const meters: ReadingMeter[] = [];
      for (const kind of ['electricity', 'water'] as const) {
        const meter = await withAverage(contract, kind, period, transaction);
        if (meter) meters.push(meter);
      }
      result.rooms.push({
        roomId: room.id,
        code: room.code,
        floor: room.floor,
        contractId: contract.id,
        meters,
      });
    }
    return result;
  });
}

export async function saveReading(
  user: StayUser,
  input: MeterReadingInput,
  transaction: Transaction,
  buildingId?: string,
  id?: string,
): Promise<StayMeterReading> {
  const { meter, room, contract } = await context(user, input.meterId, transaction);
  if (buildingId && room.buildingId !== buildingId) throw new NotFound();
  const row = await MeterReadingModel.findOne({
    where: { meterId: meter.id, period: input.period },
    transaction,
  });
  if (id && row?.id !== id) throw new NotFound();
  if (row?.status === 'locked') throw new BaseError('Chỉ số đã khoá.', 409, 'reading_locked');
  assertVersion(row?.version ?? 0, input.version);
  const building = await BuildingModel.findByPk(room.buildingId, { transaction });
  if (!building) throw new NotFound();
  assertReadingWindow(input.period, input.readOn, await buildingBilling(building, transaction));
  if (
    input.readOn < meter.installedOn ||
    input.readOn < contract.startDate ||
    (meter.removedOn && input.readOn >= meter.removedOn)
  )
    throw new InputValidError('input_valid_error', {
      readOn: ['Ngày đọc ngoài thời gian sử dụng đồng hồ.'],
    });
  const data = await withAverage(contract, meter.kind, input.period, transaction);
  if (!data || data.meterId !== meter.id)
    throw new BaseError('Đồng hồ đã được thay trong kỳ.', 409, 'meter_replaced');
  let consumption: number;
  try {
    consumption =
      meterConsumption([{ startReading: data.previous, endReading: input.reading }]).consumption +
      data.carriedConsumption;
  } catch {
    throw new InputValidError('input_valid_error', {
      reading: ['Số mới phải lớn hơn hoặc bằng số cũ.'],
    });
  }
  const next = await MeterReadingModel.findOne({
    where: { meterId: meter.id, period: { [Op.gt]: input.period } },
    order: [['period', 'ASC']],
    transaction,
  });
  if (
    (next && input.reading > next.reading) ||
    (meter.finalReading !== null && input.reading > meter.finalReading)
  )
    throw new InputValidError('input_valid_error', { reading: ['Chỉ số vượt số đã ghi sau đó.'] });
  // Lock protection crosses physical meter replacements of the same utility.
  const relatedMeters = await MeterModel.findAll({
    where: { roomId: room.id, kind: meter.kind },
    attributes: ['id'],
    transaction,
  });
  if (
    await MeterReadingModel.findOne({
      where: {
        meterId: { [Op.in]: relatedMeters.map((item) => item.id) },
        period: { [Op.gt]: input.period },
        status: 'locked',
      },
      transaction,
    })
  )
    throw new BaseError('Kỳ sau đã khoá; cần điều chỉnh qua hoá đơn.', 409, 'reading_locked');
  if (data.average !== null && consumption > 2 * data.average && !input.confirmHighConsumption)
    throw new BaseError(
      'Tiêu thụ hơn 2 lần trung bình; cần xác nhận.',
      400,
      'high_consumption_confirmation_required',
      { consumption, average: data.average },
    );
  if (
    input.photoFileId &&
    input.photoFileId !== row?.photoFileId &&
    !(await attachableFile(user, input.photoFileId, 'contract_meter', room.buildingId, transaction))
  )
    throw new InputValidError('input_valid_error', { photoFileId: ['Ảnh đồng hồ không hợp lệ.'] });
  const values = {
    meterId: input.meterId,
    period: input.period,
    reading: input.reading,
    readOn: input.readOn,
    photoFileId: input.photoFileId ?? null,
  };
  const saved = row
    ? await row.update(values, { transaction })
    : await MeterReadingModel.create(values, { transaction });
  setAuditChanges({
    meterId: meter.id,
    buildingId: room.buildingId,
    period: input.period,
    reading: input.reading,
    version: saved.version,
    confirmed: input.confirmHighConsumption ?? false,
  });
  return readingDto(saved, transaction);
}

export async function replaceMeter(
  user: StayUser,
  id: string,
  input: MeterReplacementInput,
  key?: string,
): Promise<{ id: string }> {
  if (key) {
    return auditedTransaction(async (transaction) => {
      await context(user, id, transaction);
      const { result } = await runIdempotent(
        { scope: 'meter.replace', actorId: user.id, key, payload: { id, ...input } },
        async () => (await replaceMeter(user, id, input)).id,
      );
      if (typeof result !== 'string') throw new Error('Invalid stored meter id');
      return { id: result };
    });
  }
  return auditedTransaction(async (transaction) => {
    const { meter, room, contract } = await context(user, id, transaction);
    if (meter.removedOn) throw new BaseError('Đồng hồ đã được thay.', 409, 'meter_replaced');
    const latest = await MeterReadingModel.findOne({
      where: { meterId: id },
      order: [['period', 'DESC']],
      transaction,
    });
    const period = input.replacedOn.slice(0, 7);
    if (
      input.replacedOn < meter.installedOn ||
      input.replacedOn < contract.startDate ||
      (latest &&
        input.replacedOn < latest.readOn &&
        !(latest.period === period && latest.status === 'draft'))
    )
      throw new InputValidError('input_valid_error', {
        replacedOn: ['Ngày thay phải sau lần đọc gần nhất.'],
      });
    const data = await withAverage(contract, meter.kind, period, transaction);
    const baseline = latest?.reading ?? data?.previous ?? meter.initialReading;
    try {
      meterConsumption([{ startReading: baseline, endReading: input.finalReading }]);
    } catch {
      throw new InputValidError('input_valid_error', {
        finalReading: ['Số cuối phải lớn hơn hoặc bằng số cũ.'],
      });
    }
    if (latest?.period === period && latest.status === 'locked')
      throw new BaseError('Chỉ số đã khoá.', 409, 'reading_locked');
    if (
      data &&
      data.average !== null &&
      input.finalReading - data.previous + data.carriedConsumption > 2 * data.average &&
      !input.confirmHighConsumption
    )
      throw new BaseError(
        'Tiêu thụ hơn 2 lần trung bình; cần xác nhận.',
        400,
        'high_consumption_confirmation_required',
      );
    if (latest?.period === period)
      await latest.update(
        { reading: input.finalReading, readOn: input.replacedOn },
        { transaction },
      );
    await meter.update(
      { finalReading: input.finalReading, removedOn: input.replacedOn },
      { transaction },
    );
    const replacement = await MeterModel.create(
      {
        roomId: room.id,
        kind: meter.kind,
        installedOn: input.replacedOn,
        initialReading: input.initialReading,
        serial: input.serial ?? null,
      },
      { transaction },
    );
    setAuditChanges({
      buildingId: room.buildingId,
      oldMeterId: id,
      newMeterId: replacement.id,
      ...input,
    });
    return { id: replacement.id };
  });
}
