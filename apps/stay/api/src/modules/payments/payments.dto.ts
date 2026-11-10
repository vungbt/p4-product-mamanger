import { selectFields } from '@p4/server-core';
import type { StayPayment } from '@stay/shared';
import { Op, type Transaction } from 'sequelize';
import { InvoiceModel, PaymentModel, RoomModel, UserModel } from '@/sequelize/models/index.js';

/** Payment DTOs with their invoice code, room code and who recorded/reversed them. */
export async function paymentDtos(
  rows: PaymentModel[],
  transaction?: Transaction,
): Promise<StayPayment[]> {
  if (!rows.length) return [];
  const invoices = await InvoiceModel.findAll({
    where: { id: { [Op.in]: [...new Set(rows.map((row) => row.invoiceId))] } },
    attributes: ['id', 'code', 'contractId', 'roomId'],
    transaction,
  });
  const userIds = rows.flatMap((row) => [row.actorId, row.reversedBy]).filter((id) => id !== null);
  const [rooms, users] = await Promise.all([
    RoomModel.findAll({
      where: { id: { [Op.in]: [...new Set(invoices.map((invoice) => invoice.roomId))] } },
      attributes: ['id', 'code'],
      transaction,
    }),
    UserModel.findAll({
      where: { id: { [Op.in]: [...new Set(userIds)] } },
      attributes: ['id', 'displayName'],
      transaction,
    }),
  ]);
  const invoiceById = new Map(invoices.map((invoice) => [invoice.id, invoice]));
  const roomCodes = new Map(rooms.map((room) => [room.id, room.code]));
  const names = new Map(users.map((user) => [user.id, user.displayName]));

  return rows.map((row) => {
    const invoice = invoiceById.get(row.invoiceId);

    return {
      ...selectFields(row, [
        'id',
        'invoiceId',
        'buildingId',
        'amount',
        'method',
        'paidOn',
        'reference',
        'note',
        'reverseReason',
      ]),
      invoiceCode: invoice?.code ?? null,
      contractId: invoice?.contractId ?? '',
      roomId: invoice?.roomId ?? '',
      roomCode: (invoice && roomCodes.get(invoice.roomId)) ?? '',
      status: row.reversedAt ? 'reversed' : 'recorded',
      reversedAt: row.reversedAt?.toISOString() ?? null,
      reversedByName: (row.reversedBy && names.get(row.reversedBy)) ?? null,
      actorName: (row.actorId && names.get(row.actorId)) ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  });
}

/** Payment history of one invoice, newest first (reversed ones included). */
export async function invoicePayments(
  invoiceId: string,
  transaction?: Transaction,
): Promise<StayPayment[]> {
  const rows = await PaymentModel.findAll({
    where: { invoiceId },
    order: [
      ['paidOn', 'DESC'],
      ['createdAt', 'DESC'],
      ['id', 'DESC'],
    ],
    transaction,
  });

  return paymentDtos(rows, transaction);
}
