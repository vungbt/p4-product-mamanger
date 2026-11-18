import { BaseError, Forbidden, NotFound } from '@p4/server-core';
import type { AccountStatus, StaffRole, User } from '@p4/shared';
import { Op } from 'sequelize';
import { consumeAccountToken, issueAccountToken } from '@/modules/accounts/accounts.service.js';
import { RefreshTokenModel, sequelize, UserModel } from '@/sequelize/models/index.js';
import { auditedTransaction, recordAudit } from '@/shared/audit/audited-command.js';
import { assertVersion } from '@/shared/commerce/transitions.js';

export const STAFF_ROLES: readonly StaffRole[] = [
  'owner',
  'administrator',
  'catalog',
  'content',
  'support',
  'fulfillment',
];

export async function inviteStaff(actor: User, email: string, role: StaffRole) {
  if (role === 'owner' && actor.staffRole !== 'owner') throw new Forbidden();
  await auditedTransaction(async (transaction) => {
    const user = await UserModel.findOne({
      where: { email: email.toLowerCase(), accountStatus: 'active' },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!user) throw new NotFound('account_registration_required');
    if (user.role === 'admin')
      throw new BaseError('staff_already_exists', 409, 'staff_already_exists');
    await issueAccountToken(user, 'staff_invitation', transaction, {
      staffRole: role,
      invitedBy: actor.id,
    });
    await recordAudit(
      {
        actorId: actor.id,
        action: 'staff.invited',
        resourceType: 'user',
        resourceId: user.id,
        changes: { staffRole: role },
      },
      transaction,
    );
  });
  return { accepted: true };
}

export async function acceptInvitation(actor: User, token: string) {
  return consumeAccountToken('staff_invitation', token, async (user, record, transaction) => {
    if (actor.id !== user.id) throw new Forbidden();
    const data = record.data;
    const role =
      data && typeof data === 'object' && !Array.isArray(data)
        ? STAFF_ROLES.find((value) => value === data.staffRole)
        : undefined;
    if (!role || user.role === 'admin') throw new Forbidden();
    const inviterId =
      data && typeof data === 'object' && !Array.isArray(data) && typeof data.invitedBy === 'string'
        ? data.invitedBy
        : undefined;
    const inviter = inviterId ? await UserModel.findByPk(inviterId, { transaction }) : undefined;
    if (
      inviter?.accountStatus !== 'active' ||
      inviter.role !== 'admin' ||
      inviter.staffRole !== 'owner'
    )
      throw new Forbidden();
    await user.update(
      {
        role: 'admin',
        staffRole: role,
        authVersion: user.authVersion + 1,
        version: user.version + 1,
      },
      { transaction },
    );
    await RefreshTokenModel.update(
      { revokedAt: new Date() },
      { where: { userId: user.id, revokedAt: null }, transaction },
    );
    await recordAudit(
      {
        actorId: user.id,
        action: 'staff.invitation_accepted',
        resourceType: 'user',
        resourceId: user.id,
        changes: { staffRole: role },
      },
      transaction,
    );
    return { accepted: true, loginRequired: true };
  });
}

export async function changeAccount(
  actor: User,
  userId: string,
  input: {
    expectedVersion: number;
    staffRole?: StaffRole;
    accountStatus?: AccountStatus;
    reason: string;
  },
  staff: boolean,
) {
  return auditedTransaction(async (transaction) => {
    await sequelize.query("SELECT pg_advisory_xact_lock(hashtext('staff-owner-guard'))", {
      transaction,
    });
    const user = await UserModel.findByPk(userId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!user || (staff ? user.role !== 'admin' : user.role !== 'user')) throw new NotFound();
    assertVersion(user.version, input.expectedVersion);
    if (user.staffRole === 'owner' || input.staffRole === 'owner') {
      if (actor.staffRole !== 'owner') throw new Forbidden();
      if (
        (input.staffRole && input.staffRole !== 'owner') ||
        (input.accountStatus && input.accountStatus !== 'active')
      ) {
        const otherOwners = await UserModel.count({
          where: {
            role: 'admin',
            staffRole: 'owner',
            accountStatus: 'active',
            id: { [Op.ne]: user.id },
          },
          transaction,
        });
        if (!otherOwners) throw new BaseError('last_owner_required', 409, 'last_owner_required');
      }
    }
    const before = { staffRole: user.staffRole, accountStatus: user.accountStatus };
    await user.update(
      {
        staffRole: input.staffRole ?? user.staffRole,
        accountStatus: input.accountStatus ?? user.accountStatus,
        authVersion: user.authVersion + 1,
        version: user.version + 1,
      },
      { transaction },
    );
    await RefreshTokenModel.update(
      { revokedAt: new Date() },
      { where: { userId, revokedAt: null }, transaction },
    );
    await recordAudit(
      {
        actorId: actor.id,
        action: staff ? 'staff.updated' : 'customer.status_changed',
        resourceType: 'user',
        resourceId: user.id,
        changes: {
          before,
          after: { staffRole: user.staffRole, accountStatus: user.accountStatus },
        },
        reason: input.reason,
      },
      transaction,
    );
    return {
      id: user.id,
      staffRole: user.staffRole,
      accountStatus: user.accountStatus,
      version: user.version,
    };
  });
}
