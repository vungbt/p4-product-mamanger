import { randomUUID } from 'node:crypto';
import type { SupportMessage, SupportTicket, User } from '@p4/shared';
import type { Transaction } from 'sequelize';
import { permissionsFor } from '@/middlewares/permission.middleware.js';
import {
  FileModel,
  OrderModel,
  SupportMessageModel,
  SupportTicketModel,
} from '@/sequelize/models/index.js';
import { auditedTransaction } from '@/shared/audit/audited-command.js';
import { recordAudit } from '@/shared/audit/record.js';
import { enqueueEvent } from '@/shared/commerce/persistence.js';
import { assertVersion } from '@/shared/commerce/transitions.js';
import { BaseError } from '@/utils/errors/base-error.js';
import { Forbidden, NotFound } from '@/utils/errors/index.js';
import { selectFields } from '@/utils/select-fields.js';
export function ticketDto(row: SupportTicketModel): SupportTicket {
  return {
    ...selectFields(row, [
      'id',
      'orderId',
      'subject',
      'category',
      'status',
      'assigneeId',
      'version',
    ]),
    createdAt: row.createdAt.toISOString(),
  };
}
export function messageDto(row: SupportMessageModel): SupportMessage {
  return {
    ...selectFields(row, ['id', 'body', 'internal', 'attachmentIds']),
    createdAt: row.createdAt.toISOString(),
  };
}
export async function ownedTicket(user: User, id: string, transaction?: Transaction, lock = false) {
  const row = await SupportTicketModel.findByPk(id, {
    transaction,
    ...(transaction && lock ? { lock: transaction.LOCK.UPDATE } : {}),
  });
  if (!row) throw new NotFound();
  if (row.userId !== user.id && !permissionsFor(user).includes('support:read'))
    throw new Forbidden();
  return row;
}
async function validateAttachments(userId: string, ids: string[], transaction: Transaction) {
  for (const id of ids) {
    if (!/^[a-f0-9-]{36}$/i.test(id)) throw new BaseError('invalid_attachment');
    const file = await FileModel.findByPk(id, { transaction });
    if (
      !file ||
      file.metadata?.ownerId !== userId ||
      file.metadata?.purpose !== 'support' ||
      file.metadata?.private !== true
    )
      throw new Forbidden();
  }
}
export async function createTicket(
  user: User,
  input: {
    subject: string;
    category: string;
    body: string;
    orderId: string | null;
    attachmentIds: string[];
  },
) {
  return auditedTransaction(async (transaction) => {
    if (input.orderId) {
      const order = await OrderModel.findOne({
        where: { id: input.orderId, userId: user.id },
        transaction,
      });
      if (!order) throw new NotFound();
    }
    await validateAttachments(user.id, input.attachmentIds, transaction);
    const row = await SupportTicketModel.create(
      {
        id: randomUUID(),
        userId: user.id,
        orderId: input.orderId,
        subject: input.subject,
        category: input.category,
        status: 'open',
        assigneeId: null,
        version: 1,
      },
      { transaction },
    );
    await SupportMessageModel.create(
      {
        id: randomUUID(),
        ticketId: row.id,
        authorId: user.id,
        body: input.body,
        internal: false,
        attachmentIds: input.attachmentIds,
      },
      { transaction },
    );
    await recordAudit(
      {
        actorId: user.id,
        action: 'support.created',
        resourceType: 'support_ticket',
        resourceId: row.id,
      },
      transaction,
    );
    return ticketDto(row);
  });
}
export async function addMessage(
  user: User,
  id: string,
  expectedVersion: number,
  input: { body: string; internal: boolean; attachmentIds: string[] },
) {
  return auditedTransaction(async (transaction) => {
    const row = await ownedTicket(user, id, transaction, true);
    assertVersion(row.version, expectedVersion);
    if (row.status === 'closed') throw new BaseError('ticket_closed', 409, 'ticket_closed');
    if (input.internal && !permissionsFor(user).includes('support:manage')) throw new Forbidden();
    if (row.userId !== user.id && !permissionsFor(user).includes('support:manage'))
      throw new Forbidden();
    await validateAttachments(user.id, input.attachmentIds, transaction);
    const message = await SupportMessageModel.create(
      { id: randomUUID(), ticketId: id, authorId: user.id, ...input },
      { transaction },
    );
    await row.update({ version: row.version + 1 }, { transaction });
    if (!input.internal)
      await enqueueEvent(
        {
          type: 'support.message',
          aggregateType: 'support_ticket',
          aggregateId: id,
          payload: { ticketId: id, userId: row.userId },
        },
        transaction,
      );
    await recordAudit(
      {
        actorId: user.id,
        action: 'support.message_added',
        resourceType: 'support_ticket',
        resourceId: id,
      },
      transaction,
    );
    return messageDto(message);
  });
}
