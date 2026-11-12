import { randomUUID } from 'node:crypto';
import { Op } from 'sequelize';
import { auth } from '@/configs/better-auth.js';
import { DomainEventModel, sequelize, UserModel } from '@/sequelize/models/index.js';
import { webOrigin } from '../invoices/invoices.share.js';

/** Claim with a row lock; dispatch only after the claim commits. Failed mail remains retryable. */
export async function deliverMemberInvitation(now: Date): Promise<boolean> {
  const event = await sequelize.transaction(async (transaction) => {
    const row = await DomainEventModel.findOne({
      where: {
        type: 'stay.member.invitation',
        [Op.or]: [
          { status: 'pending', availableAt: { [Op.lte]: now } },
          { status: 'processing', leaseUntil: { [Op.lte]: now } },
        ],
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
      skipLocked: true,
    });

    if (!row) return null;
    if (row.attempts >= 5) {
      await row.update(
        { status: 'dead_letter', leaseUntil: null, leaseToken: null },
        { transaction },
      );
      return null;
    }
    await row.update(
      {
        status: 'processing',
        leaseToken: randomUUID(),
        leaseUntil: new Date(now.getTime() + 90_000),
        attempts: row.attempts + 1,
      },
      { transaction },
    );
    return row;
  });

  if (!event) return false;
  try {
    const user = await UserModel.findOne({
      where: { id: event.aggregateId, role: 'manager', accountStatus: 'active' },
    });

    if (user)
      await auth.api.requestPasswordReset({
        body: {
          email: user.email,
          redirectTo: `${webOrigin(undefined)}/reset-password`,
        },
      });
    await DomainEventModel.update(
      {
        status: 'delivered',
        deliveredAt: now,
        leaseUntil: null,
        leaseToken: null,
        lastErrorCode: null,
      },
      { where: { id: event.id, leaseToken: event.leaseToken } },
    );
  } catch {
    await DomainEventModel.update(
      {
        status: event.attempts >= 5 ? 'dead_letter' : 'pending',
        leaseUntil: null,
        availableAt: new Date(now.getTime() + 60_000),
        leaseToken: null,
        lastErrorCode: 'invitation_delivery_failed',
      },
      { where: { id: event.id, leaseToken: event.leaseToken } },
    );
  }
  return true;
}
