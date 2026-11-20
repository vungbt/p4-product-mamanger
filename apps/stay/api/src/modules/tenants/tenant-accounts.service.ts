import { randomInt, randomUUID } from 'node:crypto';
import { BaseError } from '@p4/server-core';
import type { StayUser } from '@stay/shared';
import { compare, hash } from 'bcryptjs';
import { QueryTypes } from 'sequelize';
import { emailEnabled } from '@/configs/env.js';
import { sequelize, UserModel } from '@/sequelize/models/index.js';
import { auditedTransaction, setAuditChanges } from '@/shared/audit.js';
import { webOrigin } from '../invoices/invoices.share.js';
import { renderEmailLayout } from '../notifications/email-layout.js';
import { smtpTransport } from '../notifications/notifications.transports.js';
import { findAccessibleTenant } from './tenants.service.js';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

/** Returned only by issue; never saved in an event, audit row or browser storage. */
export interface TenantCredentials {
  login: string;
  password: string;
  appUrl: string;
}

export async function issueTenantCredentials(
  user: StayUser,
  id: string,
): Promise<TenantCredentials> {
  return auditedTransaction(async (transaction) => {
    const tenant = await findAccessibleTenant(user, id, 'issue', transaction);

    if (tenant.archivedAt) throw new BaseError('tenant_archived', 409, 'tenant_archived');
    let userId = tenant.userId;

    if (!userId) {
      userId = randomUUID();
      await UserModel.create(
        {
          id: userId,
          email: tenant.email?.toLowerCase() || `tenant-${tenant.id}@accounts.stay.invalid`,
          displayName: tenant.fullName,
          emailVerified: false,
          avatarUrl: null,
          role: 'tenant',
          accountStatus: 'active',
          mustChangePassword: true,
        },
        { transaction },
      );
      await tenant.update({ userId }, { transaction });
    }

    const account = await UserModel.findOne({
      where: { id: userId, role: 'tenant' },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!account) throw new BaseError('credentials_unavailable', 409, 'credentials_unavailable');

    const password = Array.from({ length: 14 }, () => ALPHABET[randomInt(ALPHABET.length)]).join(
      '',
    );

    await sequelize.query(
      `INSERT INTO auth_accounts(id,account_id,provider_id,user_id,password)
      VALUES(:id,:userId,'credential',:userId,:password)
      ON CONFLICT(provider_id,account_id) DO UPDATE SET password = EXCLUDED.password, updated_at = now()`,
      {
        replacements: { id: randomUUID(), userId, password: await hash(password, 12) },
        transaction,
      },
    );
    await UserModel.update(
      { mustChangePassword: true },
      { where: { id: userId, role: 'tenant' }, transaction },
    );
    await sequelize.query('DELETE FROM auth_sessions WHERE user_id = :userId', {
      replacements: { userId },
      transaction,
    });
    setAuditChanges({ tenantId: id, userId, buildingId: tenant.buildingId });
    return {
      login: tenant.phone,
      password,
      appUrl: `${webOrigin(undefined)}/login`,
    };
  });
}

/** Staff supplies the one-time value still held by the dialog; validate against the current
 * hash before sending. SMTP runs after the audited transaction, never before commit. */
export async function emailTenantCredentials(user: StayUser, id: string, password: string) {
  return auditedTransaction(async (transaction) => {
    const tenant = await findAccessibleTenant(user, id, 'issue', transaction);
    const account = tenant.userId ? await UserModel.findByPk(tenant.userId, { transaction }) : null;
    const rows = await sequelize.query<{ password: string }>(
      "SELECT password FROM auth_accounts WHERE user_id = :id AND provider_id = 'credential'",
      {
        replacements: { id: tenant.userId },
        transaction,
        type: QueryTypes.SELECT,
      },
    );
    const stored = rows[0];

    if (
      !tenant.email ||
      account?.role !== 'tenant' ||
      !account.mustChangePassword ||
      !stored ||
      typeof stored.password !== 'string' ||
      !(await compare(password, stored.password))
    )
      throw new BaseError('credentials_unavailable', 409, 'credentials_unavailable');
    if (!emailEnabled()) throw new BaseError('mail_unavailable', 503, 'mail_unavailable');
    setAuditChanges({ tenantId: id, buildingId: tenant.buildingId, delivery: 'requested' });
    const subject = '[Stay] Tài khoản người thuê';
    const message = renderEmailLayout({
      subject,
      tone: 'account',
      title: 'Tài khoản Stay của bạn',
      body: `Đăng nhập bằng số điện thoại ${tenant.phone}.\nMật khẩu tạm thời: ${password}\nVui lòng đổi mật khẩu ngay lần đăng nhập đầu tiên.`,
      action: { label: 'Đăng nhập', url: `${webOrigin(undefined)}/login` },
      footer: 'Chủ trọ đã cấp tài khoản này cho bạn.',
    });
    const email = tenant.email;

    transaction.afterCommit(async () => {
      await smtpTransport.send({ id: randomUUID(), to: email, subject, ...message });
    });
    return { sent: true };
  });
}
