import { BaseError, setAuditChanges } from '@p4/server-core';
import type {
  ContractChangeInput,
  ContractChangeKind,
  ContractChangePreview,
  StayUser,
} from '@stay/shared';
import { Op, type Transaction } from 'sequelize';
import {
  BuildingModel,
  ContractEventModel,
  ContractModel,
  ContractOccupantModel,
  ContractServiceModel,
  ContractVehicleModel,
  MeterModel,
  RoomModel,
  ServiceDefinitionModel,
  TenantModel,
  VehicleModel,
} from '@/sequelize/models/index.js';
import { auditedTransaction, recordAudit } from '@/shared/audit.js';
import { assertVersion } from '@/shared/input.js';
import { runIdempotent } from '@/shared/persistence.js';
import { latestMeterReadings } from '../rooms/rooms.usage.js';
import { billingDefaults } from '../settings/settings.service.js';
import {
  contractFactsAt,
  contractOccupantsAt,
  contractServicesAt,
  contractVehiclesAt,
  periodIsInvoiced,
} from './contracts.resolvers.js';
import { contractDto, findContract, getContract } from './contracts.service.js';

function invalid(field: string, message: string): never {
  throw new BaseError(message, 422, 'invalid_contract_change', { [field]: [message] });
}

export async function changePreview(
  id: string,
  kind: ContractChangeKind,
  input: ContractChangeInput,
  transaction?: Transaction,
): Promise<ContractChangePreview> {
  const period = input.effectiveDate.slice(0, 7);
  const contract = await ContractModel.findByPk(id, { rejectOnEmpty: true, transaction });
  const building = await BuildingModel.findByPk(contract.buildingId, {
    rejectOnEmpty: true,
    transaction,
  });
  const issueDay = building.issueDay ?? (await billingDefaults()).issueDay;
  const issueDate = new Date(`${period}-01T00:00:00Z`);
  const lastDay = new Date(issueDate.getUTCFullYear(), issueDate.getUTCMonth() + 1, 0).getDate();
  const firstIssuePeriod =
    Number(input.effectiveDate.slice(8, 10)) <= Math.min(issueDay, lastDay)
      ? period
      : (() => {
          issueDate.setUTCMonth(issueDate.getUTCMonth() + 1);
          return issueDate.toISOString().slice(0, 7);
        })();
  const changedFields = {
    renew: ['endDate', ...(input.rent !== undefined ? ['rent'] : [])],
    'rent-change': ['rent'],
    occupants: ['occupantCount'],
    leave: ['occupantCount', 'primaryTenant'],
    vehicles: ['vehicleCount'],
    services: ['services'],
    'room-change': ['room', 'rent', 'utilityReadings'],
  }[kind];
  const amount =
    input.rent === undefined ? '' : `${new Intl.NumberFormat('vi-VN').format(input.rent)} ₫`;
  const changeDescription = {
    renew: `Gia hạn đến ${input.endDate}.${amount ? ` Giá thuê mới ${amount}.` : ''}`,
    'rent-change': `Giá thuê mới ${amount}.`,
    occupants: 'Thêm một người ở để tính dịch vụ theo người.',
    leave: 'Giảm một người ở để tính dịch vụ theo người.',
    vehicles: input.enabled ? 'Thêm một xe tính phí.' : 'Bớt một xe tính phí.',
    services: input.enabled ? 'Bật dịch vụ đã chọn.' : 'Tắt dịch vụ đã chọn.',
    'room-change': `Đổi phòng và giá thuê mới ${amount}.`,
  }[kind];
  const periodLabel = (value: string) => `${value.slice(5, 7)}/${value.slice(0, 4)}`;
  const next = new Date(`${period}-01T00:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return {
    effectiveDate: input.effectiveDate,
    period,
    firstIssuePeriod,
    changedFields,
    utilityPeriod: kind === 'room-change' ? next.toISOString().slice(0, 7) : null,
    description:
      kind === 'room-change'
        ? `Từ kỳ ${periodLabel(firstIssuePeriod)}: ${changeDescription} Tiền phòng và dịch vụ lấy tại ngày phát hành. Điện nước phòng cũ ghi riêng vào kỳ ${periodLabel(next.toISOString().slice(0, 7))}. Chênh lệch tiền phòng tháng đổi cần phụ thu/giảm trừ tay.`
        : `Từ kỳ ${periodLabel(firstIssuePeriod)}: ${changeDescription} Số người, xe, dịch vụ và giá thuê lấy tại ngày phát hành; thay đổi sau ngày phát hành áp dụng kỳ tiếp theo. Không chia nhỏ giá thuê giữa tháng.`,
    warnings: (await periodIsInvoiced(id, period))
      ? [
          'Kỳ đã phát hành: không sửa hoá đơn cũ. Chưa thanh toán: void rồi lập lại; đã thanh toán: thêm dòng điều chỉnh kỳ sau.',
        ]
      : [],
  };
}

export async function changeContract(
  user: StayUser,
  id: string,
  kind: ContractChangeKind,
  input: ContractChangeInput,
  key?: string,
  occupantId?: string,
) {
  const execute = async (transaction: Transaction) => {
    const row = await findContract(user, id, 'update', transaction);
    assertVersion(row.version, input.version);
    if (!['active', 'ending'].includes(row.status))
      throw new BaseError('contract_not_active', 409, 'contract_not_active');
    const date = input.effectiveDate;
    if (date < row.startDate || (row.endDate && date > row.endDate))
      invalid('effectiveDate', 'Ngày hiệu lực phải trong thời hạn hợp đồng.');
    const facts = await contractFactsAt(id, date, transaction);
    const room = await RoomModel.findByPk(facts.roomId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
      rejectOnEmpty: true,
    });
    const occupants = await contractOccupantsAt(id, date, transaction);
    const payload: Record<string, string | number | boolean | null> = { effectiveDate: date };
    const preview = await changePreview(id, kind, input, transaction);
    // Validate and execute in the same locked transaction. Preview runs identical validation,
    // skips business mutations (including inline tenant creation) and change events.
    // The route audit policy still traces the preview request without personal data.
    if (kind === 'renew') {
      if (!input.endDate || input.endDate <= (row.endDate ?? row.startDate))
        invalid('endDate', 'Ngày kết thúc mới phải sau ngày kết thúc cũ.');
      payload.endDate = input.endDate;
      // Renewing also withdraws a move-out notice (ending → active).
      if (!input.preview) row.set({ endDate: input.endDate, status: 'active', noticeDate: null });
    }
    if (kind === 'occupants') {
      const tenant = input.tenantId
        ? await TenantModel.findOne({
            where: { id: input.tenantId, buildingId: row.buildingId, archivedAt: null },
            transaction,
          })
        : null;
      if (input.tenantId && !tenant) invalid('tenantId', 'Người thuê không hợp lệ trong toà.');
      if (occupants.some((o) => o.tenantId === input.tenantId))
        invalid('tenantId', 'Người thuê đã ở trong hợp đồng.');
      // Validate all future boundary counts too, so backdated inserts cannot overfill later.
      const links = await ContractOccupantModel.findAll({ where: { contractId: id }, transaction });
      if (
        input.tenantId &&
        links.some((o) => o.tenantId === input.tenantId && (!o.toDate || o.toDate > date))
      )
        invalid('tenantId', 'Khoảng thời gian người ở bị trùng.');
      const roomChanges = await ContractEventModel.findAll({
        where: { contractId: id, type: 'room-change' },
        transaction,
      });
      const boundaries = [
        ...new Set([
          date,
          ...links.filter((o) => o.fromDate >= date).map((o) => o.fromDate),
          ...roomChanges.map((e) => String(e.payload.effectiveDate)).filter((d) => d >= date),
        ]),
      ];
      for (const boundary of boundaries) {
        const at = await contractFactsAt(id, boundary, transaction);
        const capacity = await RoomModel.findByPk(at.roomId, { transaction, rejectOnEmpty: true });
        if (
          links.filter((o) => o.fromDate <= boundary && (!o.toDate || o.toDate > boundary))
            .length >= capacity.maxOccupants
        )
          invalid('tenantId', 'Số người ở vượt giới hạn của phòng.');
      }
      if (!input.preview) {
        const added =
          tenant ??
          (await TenantModel.create(
            {
              buildingId: row.buildingId,
              fullName: input.fullName ?? '',
              phone: input.phone ?? '',
            },
            { transaction },
          ));
        await ContractOccupantModel.create(
          { contractId: id, tenantId: added.id, isPrimary: false, fromDate: date },
          { transaction },
        );
        payload.tenantId = added.id;
      }
    }
    if (kind === 'leave') {
      const departing = occupants.find((o) => o.tenantId === occupantId);
      if (!departing) invalid('occupantId', 'Người ở không có hiệu lực tại ngày này.');
      if (occupants.length <= 1) invalid('occupantId', 'Không thể xoá người ở cuối cùng.');
      const replacement = occupants.find(
        (o) => o.tenantId === input.newPrimaryTenantId && o.id !== departing.id,
      );
      if (departing.isPrimary && (!replacement || replacement.toDate))
        invalid('newPrimaryTenantId', 'Chọn người đại diện mới.');
      const future = await ContractOccupantModel.findAll({
        where: { contractId: id },
        transaction,
      });
      const emptyLater = future.some((o) => {
        const boundary = o.toDate;
        return (
          boundary &&
          boundary > date &&
          future.filter(
            (l) =>
              l.id !== departing.id && l.fromDate <= boundary && (!l.toDate || l.toDate > boundary),
          ).length === 0
        );
      });
      if (emptyLater) invalid('occupantId', 'Không thể để hợp đồng không có người ở.');
      if (!input.preview) {
        await departing.update({ toDate: date }, { transaction });
        if (departing.isPrimary && replacement) {
          // Split the primary interval to retain historical role on both sides.
          if (replacement.fromDate === date)
            await replacement.update({ isPrimary: true }, { transaction });
          else {
            await replacement.update({ toDate: date }, { transaction });
            await ContractOccupantModel.create(
              { contractId: id, tenantId: replacement.tenantId, fromDate: date, isPrimary: true },
              { transaction },
            );
          }
        }
      }
      payload.tenantId = departing.tenantId;
      payload.newPrimaryTenantId = input.newPrimaryTenantId ?? null;
    }
    if (kind === 'vehicles') {
      const vehicle = await VehicleModel.findByPk(input.vehicleId, { transaction });
      if (!vehicle || (input.enabled && !occupants.some((o) => o.tenantId === vehicle.tenantId)))
        invalid('vehicleId', 'Xe phải thuộc người ở có hiệu lực.');
      const links = await contractVehiclesAt(id, date, transaction);
      const existing = links.find((l) => l.vehicleId === input.vehicleId);
      if (Boolean(existing) === input.enabled)
        invalid('vehicleId', 'Trạng thái xe không thay đổi.');
      if (input.enabled) {
        const future = await ContractVehicleModel.findAll({
          where: { contractId: id, vehicleId: vehicle.id },
          transaction,
        });
        if (future.some((l) => l.fromDate > date))
          invalid('vehicleId', 'Đã có đăng ký xe trong tương lai.');
      }
      if (!input.preview) {
        if (existing) await existing.update({ toDate: date }, { transaction });
        else
          await ContractVehicleModel.create(
            { contractId: id, vehicleId: vehicle.id, fromDate: date },
            { transaction },
          );
      }
      payload.vehicleId = vehicle.id;
      payload.enabled = input.enabled ?? false;
    }
    if (kind === 'services') {
      const definition = await ServiceDefinitionModel.findOne({
        where: { id: input.serviceId, active: true },
        transaction,
      });
      if (!definition) invalid('serviceId', 'Chỉ dùng dịch vụ đang hoạt động.');
      const links = await contractServicesAt(id, date, transaction);
      const existing = links.find((l) => l.serviceId === input.serviceId);
      if (Boolean(existing) === input.enabled)
        invalid('serviceId', 'Trạng thái dịch vụ không thay đổi.');
      if (input.enabled) {
        const future = await ContractServiceModel.findAll({
          where: { contractId: id, serviceId: definition.id },
          transaction,
        });
        if (future.some((l) => l.fromDate > date))
          invalid('serviceId', 'Đã có đăng ký dịch vụ trong tương lai.');
      }
      if (!input.preview) {
        if (existing) await existing.update({ toDate: date }, { transaction });
        else
          await ContractServiceModel.create(
            { contractId: id, serviceId: definition.id, fromDate: date },
            { transaction },
          );
      }
      payload.serviceId = definition.id;
      payload.enabled = input.enabled ?? false;
    }
    if (kind === 'room-change') {
      const moves = await ContractEventModel.findAll({
        where: { contractId: id, type: 'room-change' },
        transaction,
      });
      if (moves.some((e) => String(e.payload.effectiveDate) >= date))
        invalid('effectiveDate', 'Đổi phòng phải sau lần đổi phòng đã đăng ký gần nhất.');
      const target = await RoomModel.findByPk(input.roomId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!target || target.buildingId !== row.buildingId)
        invalid('roomId', 'Chọn phòng trong cùng toà.');
      if (target.id === room.id || target.maintenance || target.archivedAt)
        throw new BaseError('room_unavailable', 409, 'room_unavailable');
      // Future moves reserve their target immediately; no double booking between commands.
      const other = await ContractModel.findAll({
        where: {
          buildingId: row.buildingId,
          status: { [Op.in]: ['active', 'ending'] },
          id: { [Op.ne]: id },
        },
        transaction,
      });
      const scheduled = await ContractEventModel.findAll({
        where: { contractId: { [Op.in]: other.map((c) => c.id) }, type: 'room-change' },
        transaction,
      });
      if (
        scheduled.some(
          (e) => e.payload.roomId === target.id && String(e.payload.effectiveDate) >= date,
        )
      )
        throw new BaseError('room_has_contract', 409, 'room_has_contract');
      for (const c of other) {
        const at = await contractFactsAt(c.id, date, transaction);
        if (c.roomId === target.id || at.roomId === target.id)
          throw new BaseError('room_has_contract', 409, 'room_has_contract');
      }
      const allOccupants = await ContractOccupantModel.findAll({
        where: { contractId: id },
        transaction,
      });
      if (
        [date, ...allOccupants.filter((o) => o.fromDate > date).map((o) => o.fromDate)].some(
          (d) =>
            allOccupants.filter((o) => o.fromDate <= d && (!o.toDate || o.toDate > d)).length >
            target.maxOccupants,
        )
      )
        invalid('roomId', 'Phòng mới không đủ chỗ.');
      const meters = await MeterModel.findAll({
        where: { roomId: room.id, removedOn: null },
        transaction,
      });
      const latest = await latestMeterReadings(
        meters.map((m) => m.id),
        transaction,
      );
      for (const kind of ['electricity', 'water'] as const) {
        const field = kind === 'electricity' ? 'closingElectric' : 'closingWater';
        const baseline = kind === 'electricity' ? facts.initialElectric : facts.initialWater;
        const meter = meters.find((m) => m.kind === kind);
        const min = Math.max(
          baseline,
          meter?.initialReading ?? 0,
          meter ? (latest.get(meter.id)?.reading ?? 0) : 0,
        );
        if ((input[field] ?? -1) < min) invalid(field, `Chỉ số phải ≥ ${min}.`);
      }
      const targetMeters = await MeterModel.findAll({
        where: { roomId: target.id, removedOn: null },
        transaction,
      });
      const targetReadings = await latestMeterReadings(
        targetMeters.map((m) => m.id),
        transaction,
      );
      for (const meter of targetMeters) {
        const field = meter.kind === 'electricity' ? 'initialElectric' : 'initialWater';
        const min = Math.max(meter.initialReading, targetReadings.get(meter.id)?.reading ?? 0);
        if ((input[field] ?? -1) < min) invalid(field, `Chỉ số phải ≥ ${min}.`);
      }
      payload.oldRoomId = room.id;
      payload.roomId = target.id;
      payload.closingElectric = input.closingElectric ?? 0;
      payload.closingWater = input.closingWater ?? 0;
      payload.oldInitialElectric = facts.initialElectric;
      payload.oldInitialWater = facts.initialWater;
      payload.initialElectric = input.initialElectric ?? 0;
      payload.initialWater = input.initialWater ?? 0;
      payload.utilityPeriod = preview.utilityPeriod;
      if (!input.preview)
        row.set({
          roomId: target.id,
          initialElectric: input.initialElectric,
          initialWater: input.initialWater,
        });
    }
    if (input.rent !== undefined) {
      payload.oldRent = facts.rent;
      payload.rent = input.rent;
    }
    if (input.preview) return { impact: preview, contract: null };
    // Force the optimistic version to advance even for link-only commands.
    row.changed('updatedAt', true);
    if (input.rent !== undefined) row.set('rent', input.rent);
    await row.save({ transaction });
    payload.version = row.version;
    await ContractEventModel.create(
      { contractId: id, type: kind, actorId: user.id, payload },
      { transaction },
    );
    const audit = {
      buildingId: row.buildingId,
      contractId: id,
      effectiveDate: date,
      version: row.version,
    };
    await recordAudit(
      { action: `contract.${kind}`, resourceType: 'contract', resourceId: id, changes: audit },
      transaction,
    );
    setAuditChanges(audit);
    return { impact: preview, contract: await contractDto(row, transaction) };
  };
  if (key && !input.preview) {
    await runIdempotent(
      {
        scope: `contract.${kind}.${id}`,
        actorId: user.id,
        key,
        payload: { ...input, occupantId: occupantId ?? null },
      },
      async (tx) => {
        await execute(tx);
        return id;
      },
    );
    return { impact: await changePreview(id, kind, input), contract: await getContract(user, id) };
  }
  return auditedTransaction(execute);
}
