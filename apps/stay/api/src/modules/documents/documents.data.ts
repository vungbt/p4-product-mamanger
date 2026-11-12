import { NotFound } from '@p4/server-core';
import {
  BILLING_DAY_END_OF_MONTH,
  type BillingDay,
  escapeHtml,
  fillTemplate,
  findVietQrBank,
  isoDateInTimeZone,
  missingDocumentFields,
  parseIsoDate,
  readVndInWords,
  type ServiceKind,
  TEMPLATE_VARIABLES,
  type TemplatePreview,
  unknownTemplateVariables,
  type VehicleType,
} from '@stay/shared';
import { Op, type Transaction } from 'sequelize';
import type { DocumentSnapshot } from '@/sequelize/models/contract-document.model.js';
import {
  BuildingModel,
  BuildingServicePriceModel,
  ContractModel,
  LandlordProfileModel,
  RoomModel,
  ServiceDefinitionModel,
  TenantModel,
  VehicleModel,
} from '@/sequelize/models/index.js';
import { resolveBuildingPrice } from '../buildings/building-prices.service.js';
import {
  contractFactsAt,
  contractOccupantsAt,
  contractServicesAt,
  contractVehiclesAt,
} from '../contracts/contracts.resolvers.js';
import { portalReferenceDate } from '../portal/portal.access.js';
import { buildingBilling } from '../settings/settings.service.js';

const VARIABLES = new Map(TEMPLATE_VARIABLES.map((item) => [item.key, item]));

const KIND_LABELS: Record<ServiceKind, string> = {
  electricity: 'Theo chỉ số điện',
  water: 'Theo chỉ số nước',
  per_room: 'Theo phòng/tháng',
  per_person: 'Theo người/tháng',
  per_vehicle: 'Theo xe/tháng',
};

const VEHICLE_LABELS: Record<VehicleType, string> = {
  motorbike: 'Xe máy',
  electric_bike: 'Xe điện',
  bicycle: 'Xe đạp',
  car: 'Ô tô',
  other: 'Xe khác',
};

export const vnDate = (date: string | null | undefined) => {
  if (!date) return '';
  const { year, month, day } = parseIsoDate(date);

  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
};

export const vnd = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount);

const longDate = (date: string) => {
  const { year, month, day } = parseIsoDate(date);

  return `ngày ${day} tháng ${month} năm ${year}`;
};

const monthlyDay = (day: BillingDay) =>
  day === BILLING_DAY_END_OF_MONTH ? 'ngày cuối tháng' : `ngày ${day} hằng tháng`;

/** Whole months from `start` to the day after `end` (12 for 01/12/2026 → 30/11/2027). */
function termMonths(start: string, end: string | null): string {
  if (!end) return '';
  const a = parseIsoDate(start);
  const b = parseIsoDate(end);
  const next = new Date(Date.UTC(b.year, b.month - 1, b.day));

  next.setUTCDate(next.getUTCDate() + 1);
  let months = (next.getUTCFullYear() - a.year) * 12 + (next.getUTCMonth() + 1 - a.month);

  if (next.getUTCDate() < a.day) months -= 1;
  return months > 0 ? String(months) : '';
}

function table(headers: string[], rows: string[][]): string {
  const head = headers.map((cell) => `<th>${escapeHtml(cell)}</th>`).join('');
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('');

  return `<table><tbody><tr>${head}</tr>${body}</tbody></table>`;
}

/**
 * Raw values (plain text, or HTML for `table`/`html` variables) of the template variables for a
 * contract, read at its reference date (today for running contracts). Stored as the document's
 * snapshot: later changes of the contract never change the document.
 */
export async function contractSnapshot(
  contractId: string,
  landlordUserId: string,
  documentCode: string,
  transaction?: Transaction,
): Promise<DocumentSnapshot> {
  const contract = await ContractModel.findByPk(contractId, { transaction });

  if (!contract) throw new NotFound('contract_not_found');
  const date = portalReferenceDate(contract);
  const facts = await contractFactsAt(contract.id, date, transaction);
  const [building, room, landlord, occupants, contractServices, contractVehicles] =
    await Promise.all([
      BuildingModel.findByPk(contract.buildingId, { transaction }),
      RoomModel.findByPk(facts.roomId, { transaction }),
      LandlordProfileModel.findOne({ where: { userId: landlordUserId }, transaction }),
      contractOccupantsAt(contract.id, date, transaction),
      contractServicesAt(contract.id, date, transaction),
      contractVehiclesAt(contract.id, date, transaction),
    ]);

  if (!building || !room) throw new NotFound('contract_not_found');
  const tenantIds = occupants.map((row) => row.tenantId);
  const [tenants, services, overrides, vehicles, billing] = await Promise.all([
    TenantModel.findAll({ where: { id: { [Op.in]: tenantIds } }, transaction }),
    ServiceDefinitionModel.findAll({
      where: { id: { [Op.in]: contractServices.map((row) => row.serviceId) } },
      order: [
        ['sortOrder', 'ASC'],
        ['name', 'ASC'],
      ],
      transaction,
    }),
    BuildingServicePriceModel.findAll({ where: { buildingId: building.id }, transaction }),
    VehicleModel.findAll({
      where: { id: { [Op.in]: contractVehicles.map((row) => row.vehicleId) } },
      order: [['plate', 'ASC']],
      transaction,
    }),
    buildingBilling(building, transaction),
  ]);
  const primaryId = occupants.find((row) => row.isPrimary)?.tenantId;
  const primary = tenants.find((row) => row.id === primaryId);
  const others = occupants
    .filter((row) => row.tenantId !== primaryId)
    .flatMap((row) => tenants.filter((tenant) => tenant.id === row.tenantId));
  const bank = findVietQrBank(building.bankBin);
  const rulesHtml = (building.rulesText ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('');

  return {
    'van_ban.ma': documentCode,
    'van_ban.ngay_lap': longDate(isoDateInTimeZone(new Date())),
    'van_ban.noi_lap': building.address ?? '',
    'ben_cho_thue.ho_ten': landlord?.fullName ?? '',
    'ben_cho_thue.ngay_sinh': vnDate(landlord?.birthDate),
    'ben_cho_thue.cccd': landlord?.idNumber ?? '',
    'ben_cho_thue.ngay_cap_cccd': vnDate(landlord?.idIssuedAt),
    'ben_cho_thue.thuong_tru': landlord?.permanentAddress ?? '',
    'ben_cho_thue.sdt': landlord?.phone ?? '',
    'ben_thue.ho_ten': primary?.fullName ?? '',
    'ben_thue.ngay_sinh': vnDate(primary?.birthDate),
    'ben_thue.cccd': primary?.idNumber ?? '',
    'ben_thue.ngay_cap_cccd': vnDate(primary?.idIssuedAt),
    'ben_thue.thuong_tru': primary?.permanentAddress ?? '',
    'ben_thue.sdt': primary?.phone ?? '',
    'ben_thue.nghe_nghiep': primary?.occupation ?? '',
    'nguoi_o.danh_sach': others.length
      ? table(
          ['Họ tên', 'Ngày sinh', 'CCCD', 'Quan hệ'],
          others.map((tenant) => [
            tenant.fullName,
            vnDate(tenant.birthDate),
            tenant.idNumber ?? '',
            'Người ở cùng',
          ]),
        )
      : '',
    'toa.ten': building.name,
    'toa.dia_chi': building.address ?? '',
    'phong.ma': room.code,
    'phong.tang': String(room.floor),
    'phong.dien_tich': room.areaM2 === null ? '' : String(room.areaM2).replace('.', ','),
    'phong.so_nguoi_toi_da': String(room.maxOccupants),
    'hop_dong.ngay_bat_dau': vnDate(contract.startDate),
    'hop_dong.ngay_ket_thuc': vnDate(contract.endDate),
    'hop_dong.thoi_han_thang': termMonths(contract.startDate, contract.endDate),
    'hop_dong.gia_thue': vnd(facts.rent),
    'hop_dong.gia_thue_bang_chu': readVndInWords(facts.rent),
    'hop_dong.tien_coc': vnd(contract.depositAmount),
    'hop_dong.tien_coc_bang_chu': readVndInWords(contract.depositAmount),
    'dich_vu.bang': services.length
      ? table(
          ['Dịch vụ', 'Cách tính', 'Đơn giá'],
          services.map((service) => {
            const history = overrides.filter((row) => row.serviceId === service.id);
            const { price } = resolveBuildingPrice(
              service.defaultPrice,
              history,
              contract.startDate > date ? contract.startDate : date,
            );

            return [service.name, KIND_LABELS[service.kind], `${vnd(price)} đ/${service.unit}`];
          }),
        )
      : '',
    'xe.danh_sach': vehicles.map((row) => `${VEHICLE_LABELS[row.type]} ${row.plate}`).join(', '),
    'ky_thu.ngay_phat_hanh': monthlyDay(billing.issueDay),
    'ky_thu.han_thanh_toan': monthlyDay(billing.dueDay),
    'ky_thu.cach_tinh': 'tiền phòng tháng M + dịch vụ tháng M + điện nước tháng M−1',
    'thanh_toan.ngan_hang': bank?.shortName ?? '',
    'thanh_toan.so_tai_khoan': building.bankAccount ?? '',
    'thanh_toan.chu_tai_khoan': building.bankAccountName ?? '',
    noi_quy: rulesHtml,
  };
}

/** Sample data of the template preview (O-37) when no contract is chosen. */
export function sampleSnapshot(): DocumentSnapshot {
  return Object.fromEntries(
    TEMPLATE_VARIABLES.map((item) => [
      item.key,
      item.key === 'nguoi_o.danh_sach'
        ? table(
            ['Họ tên', 'Ngày sinh', 'CCCD', 'Quan hệ'],
            [['Lê Văn Bình', '05/06/1999', '079199000789', 'Người ở cùng']],
          )
        : item.key === 'dich_vu.bang'
          ? table(
              ['Dịch vụ', 'Cách tính', 'Đơn giá'],
              [
                ['Điện', KIND_LABELS.electricity, '3.500 đ/kWh'],
                ['Nước', KIND_LABELS.water, '18.000 đ/m³'],
                ['Internet', KIND_LABELS.per_room, '100.000 đ/tháng'],
              ],
            )
          : item.key === 'noi_quy'
            ? '<p>Giữ trật tự sau 22 giờ.</p><p>Không nấu ăn trong phòng ngủ.</p>'
            : item.example,
    ]),
  );
}

/**
 * Fills `templateHtml` with a snapshot. Text values are escaped; tables and rules replace the whole
 * paragraph holding them. A required variable without data becomes a red
 * `<span data-missing="key">` (sending is blocked until the owner fixes the data or the text);
 * an optional one becomes a dotted blank to fill by hand.
 */
export function renderTemplate(templateHtml: string, snapshot: DocumentSnapshot): string {
  const values: Record<string, string> = {};

  for (const [key, item] of VARIABLES) {
    const raw = snapshot[key] ?? '';

    if (!raw.trim())
      values[key] = item.required
        ? `<span data-missing="${key}">[Thiếu: ${escapeHtml(item.label)}]</span>`
        : item.format === 'text'
          ? '……………'
          : '<p>……………</p>';
    else values[key] = item.format === 'text' ? escapeHtml(raw) : raw;
  }

  const blocks = templateHtml.replace(
    /<p[^>]*>\s*\{\{\s*([a-z_]+(?:\.[a-z_]+)*)\s*\}\}\s*<\/p>/g,
    (whole, key: string) => {
      const item = VARIABLES.get(key);

      return item && item.format !== 'text' ? (values[key] ?? whole) : whole;
    },
  );

  return fillTemplate(blocks, values);
}

export function previewOf(html: string): TemplatePreview {
  return { html, missing: missingDocumentFields(html), unknown: unknownTemplateVariables(html) };
}
