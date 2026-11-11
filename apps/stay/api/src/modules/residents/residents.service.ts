import {
  buildPaginationMeta,
  InputValidError,
  NotFound,
  searchPattern,
  setAuditChanges,
} from '@p4/server-core';
import type { ListQuery, PaginationMeta } from '@p4/shared';
import {
  isIsoDate,
  isoDateInTimeZone,
  type ResidentRegistrationInput,
  type StayResident,
  type StayUser,
} from '@stay/shared';
import ExcelJS from 'exceljs';
import { QueryTypes, Transaction } from 'sequelize';
import { canAccessRecord } from '@/middlewares/ability.middleware.js';
import { BuildingModel, sequelize } from '@/sequelize/models/index.js';
import { auditedTransaction, recordAudit } from '@/shared/audit.js';

export interface ResidentListQuery extends ListQuery<'fullName'> {
  date: string;
  status: 'all' | 'unregistered';
}

export function residentDate(value: unknown, field = 'date'): string {
  if (!isIsoDate(value))
    throw new InputValidError('input_valid_error', {
      [field]: ['Ngày phải có dạng YYYY-MM-DD và là ngày hợp lệ.'],
    });
  return value;
}

async function accessibleBuilding(user: StayUser, buildingId: string, transaction: Transaction) {
  if (!canAccessRecord(user, 'read', 'Tenant', { buildingId })) throw new NotFound();
  if (!(await BuildingModel.findByPk(buildingId, { transaction }))) throw new NotFound();
}

// from_date inclusive, to_date exclusive; room changes do not duplicate occupant stays.
const RESIDENTS_SQL = `
SELECT DISTINCT ON (t.id)
  co.id AS "occupantId", t.id AS "tenantId", c.id AS "contractId",
  t.full_name AS "fullName", to_char(t.birth_date, 'YYYY-MM-DD') AS "birthDate",
  t.id_number AS "idNumber", t.hometown, t.permanent_address AS "permanentAddress",
  r.id AS "roomId", r.code AS "roomCode",
  to_char(co.from_date, 'YYYY-MM-DD') AS "arrivalDate",
  to_char(co.registered_on, 'YYYY-MM-DD') AS "registeredOn"
FROM contract_occupants co
JOIN contracts c ON c.id = co.contract_id
JOIN tenants t ON t.id = co.tenant_id
JOIN rooms r ON r.id = stay_contract_room_at(c.id, CAST(:date AS date))
WHERE c.building_id = :buildingId AND c.status IN ('active', 'ending')
  AND c.start_date <= CAST(:date AS date)
  AND (c.end_date IS NULL OR c.end_date >= CAST(:date AS date))
  AND co.from_date <= CAST(:date AS date)
  AND (co.to_date IS NULL OR co.to_date > CAST(:date AS date))
ORDER BY t.id, co.from_date DESC, co.id`;

export async function listResidents(
  user: StayUser,
  buildingId: string,
  query: ResidentListQuery,
): Promise<{ data: StayResident[]; meta: PaginationMeta }> {
  const date = residentDate(query.date);

  return sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
    async (transaction) => {
      await accessibleBuilding(user, buildingId, transaction);
      const replacements = {
        buildingId,
        date,
        pattern: query.q ? searchPattern(query.q) : null,
        status: query.status,
        limit: query.pageSize,
        offset: (query.page - 1) * query.pageSize,
      };
      const filtered = `WITH residents AS (${RESIDENTS_SQL}) SELECT * FROM residents WHERE (:status = 'all' OR "registeredOn" IS NULL) AND (CAST(:pattern AS text) IS NULL OR "fullName" ILIKE :pattern OR "roomCode" ILIKE :pattern)`;
      const [count] = await sequelize.query<{ total: number }>(
        `SELECT COUNT(*)::int AS total FROM (${filtered}) filtered`,
        { replacements, transaction, type: QueryTypes.SELECT },
      );
      const data = await sequelize.query<StayResident>(
        `${filtered} ORDER BY "fullName" ${query.sortOrder === 'desc' ? 'DESC' : 'ASC'}, "tenantId" LIMIT :limit OFFSET :offset`,
        { replacements, transaction, type: QueryTypes.SELECT },
      );

      return { data, meta: buildPaginationMeta(query.page, query.pageSize, count?.total ?? 0) };
    },
  );
}

export async function registerResident(
  user: StayUser,
  occupantId: string,
  input: ResidentRegistrationInput | null,
): Promise<{ occupantId: string; registeredOn: string | null }> {
  const registeredOn = input ? residentDate(input.registeredOn, 'registeredOn') : null;

  if (registeredOn && registeredOn > isoDateInTimeZone(new Date()))
    throw new InputValidError('input_valid_error', {
      registeredOn: ['Ngày khai báo không được sau hôm nay.'],
    });
  return auditedTransaction(async (transaction) => {
    const [stay] = await sequelize.query<{ buildingId: string; fromDate: string }>(
      `SELECT c.building_id AS "buildingId", to_char(co.from_date, 'YYYY-MM-DD') AS "fromDate" FROM contract_occupants co JOIN contracts c ON c.id=co.contract_id WHERE co.id=:occupantId FOR UPDATE OF co`,
      { replacements: { occupantId }, transaction, type: QueryTypes.SELECT },
    );

    if (!stay || !canAccessRecord(user, 'manage', 'Tenant', { buildingId: stay.buildingId }))
      throw new NotFound();
    if (registeredOn && registeredOn < stay.fromDate)
      throw new InputValidError('input_valid_error', {
        registeredOn: ['Ngày khai báo phải từ ngày đến.'],
      });
    await sequelize.query(
      `UPDATE contract_occupants SET registered_on=:registeredOn, registration_note=:note, registered_by=:actorId, updated_at=now() WHERE id=:occupantId`,
      {
        replacements: {
          occupantId,
          registeredOn,
          note: input?.note ?? null,
          actorId: input ? user.id : null,
        },
        transaction,
      },
    );
    setAuditChanges({ occupantId, buildingId: stay.buildingId, registered: input !== null });
    return { occupantId, registeredOn };
  });
}

export const RESIDENT_HEADERS = [
  'STT',
  'Họ tên',
  'Ngày sinh',
  'Số CCCD',
  'Quê quán/Địa chỉ thường trú',
  'Phòng',
  'Ngày đến',
  'Đã khai báo',
];

export async function exportResidents(
  user: StayUser,
  buildingId: string,
  requestedDate: unknown,
): Promise<Buffer> {
  const date = residentDate(requestedDate);

  return auditedTransaction(async (transaction) => {
    await accessibleBuilding(user, buildingId, transaction);
    const rows = await sequelize.query<StayResident>(
      `SELECT * FROM (${RESIDENTS_SQL}) residents ORDER BY "fullName", "tenantId"`,
      { replacements: { date, buildingId }, transaction, type: QueryTypes.SELECT },
    );
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Tạm trú');

    sheet.addRow(RESIDENT_HEADERS);
    const displayDate = (value: string | null) =>
      value ? value.split('-').reverse().join('/') : '';

    rows.forEach((row, index) => {
      sheet.addRow([
        index + 1,
        row.fullName,
        displayDate(row.birthDate),
        row.idNumber ?? '',
        [row.hometown, row.permanentAddress].filter(Boolean).join(' / '),
        row.roomCode,
        displayDate(row.arrivalDate),
        row.registeredOn ? displayDate(row.registeredOn) : 'Chưa khai báo',
      ]);
    });
    sheet.getRow(1).font = { bold: true };
    sheet.columns.forEach((column, index) => {
      column.width = [7, 28, 16, 20, 50, 16, 16, 20][index];
    });
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    const file = Buffer.from(await workbook.xlsx.writeBuffer());

    await recordAudit(
      {
        action: 'residents.export',
        resourceType: 'resident_export',
        resourceId: buildingId,
        changes: { buildingId, count: rows.length, date },
      },
      transaction,
    );
    return file;
  });
}
