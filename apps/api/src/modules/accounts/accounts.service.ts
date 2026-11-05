import { randomBytes, randomUUID } from 'node:crypto';
import type {
  AccountTokenPurpose,
  ProfilePreferences,
  RegisterInput,
  UpdateProfileInput,
} from '@p4/shared';
import bcrypt from 'bcryptjs';
import type { Transaction } from 'sequelize';
import { getMe } from '@/modules/auth/auth.service.js';
import { createFromStorageId } from '@/modules/files/files.service.js';
import {
  AccountTokenModel,
  RefreshTokenModel,
  sequelize,
  UserModel,
} from '@/sequelize/models/index.js';
import { seal } from '@/shared/commerce/encryption.js';
import { enqueueEvent, jsonValue, recordAudit } from '@/shared/commerce/persistence.js';
import { assertVersion } from '@/shared/commerce/transitions.js';
import { BaseError } from '@/utils/errors/base-error.js';
import { BadRequest, Unauthorized } from '@/utils/errors/index.js';
import { hashToken } from '@/utils/refresh-token.js';

export async function issueAccountToken(
  user: UserModel,
  purpose: AccountTokenPurpose,
  transaction: Transaction,
  data: Record<string, string> = {},
  recipient = user.email,
) {
  const token = randomBytes(32).toString('base64url');
  const now = new Date();
  await AccountTokenModel.update(
    { consumedAt: now },
    { where: { userId: user.id, purpose, consumedAt: null }, transaction },
  );
  const record = await AccountTokenModel.create(
    {
      id: randomUUID(),
      userId: user.id,
      purpose,
      tokenHash: hashToken(token),
      data,
      expiresAt: new Date(Date.now() + (purpose === 'verify_email' ? 86_400_000 : 1_800_000)),
      consumedAt: null,
    },
    { transaction },
  );
  await enqueueEvent(
    {
      type: 'account.mail_requested',
      aggregateType: 'user',
      aggregateId: user.id,
      payload: {
        tokenId: record.id,
        userId: user.id,
        encrypted: seal(JSON.stringify({ to: recipient, token, purpose, ...data })),
      },
    },
    transaction,
  );
}

export async function consumeAccountToken<T>(
  purpose: AccountTokenPurpose,
  token: string,
  work: (user: UserModel, record: AccountTokenModel, transaction: Transaction) => Promise<T>,
) {
  return sequelize.transaction(async (transaction) => {
    const record = await AccountTokenModel.findOne({
      where: { purpose, tokenHash: hashToken(token) },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!record || record.consumedAt || record.expiresAt.getTime() <= Date.now())
      throw new BadRequest('invalid_account_token');
    const user = await UserModel.findByPk(record.userId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (user?.accountStatus !== 'active') throw new Unauthorized();
    const result = await work(user, record, transaction);
    await record.update({ consumedAt: new Date() }, { transaction });
    return result;
  });
}

export async function register(input: RegisterInput) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  await sequelize.transaction(async (transaction) => {
    const user = await UserModel.create(
      {
        email: input.email.toLowerCase(),
        displayName: input.displayName,
        passwordHash,
        role: 'user',
      },
      { transaction },
    );
    await issueAccountToken(user, 'verify_email', transaction);
    await recordAudit(
      { actorId: user.id, action: 'account.registered', resourceType: 'user', resourceId: user.id },
      transaction,
    );
  });
  return { accepted: true };
}

export async function requestAccountEmail(
  email: string,
  purpose: 'verify_email' | 'password_reset',
) {
  await sequelize.transaction(async (transaction) => {
    const user = await UserModel.findOne({
      where: { email: email.toLowerCase(), accountStatus: 'active' },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!user || (purpose === 'verify_email' && user.emailVerifiedAt)) return;
    await issueAccountToken(user, purpose, transaction);
  });
  return { accepted: true };
}

export async function verifyEmail(token: string) {
  return consumeAccountToken('verify_email', token, async (user, _record, transaction) => {
    await user.update({ emailVerifiedAt: new Date(), version: user.version + 1 }, { transaction });
    await recordAudit(
      {
        actorId: user.id,
        action: 'account.email_verified',
        resourceType: 'user',
        resourceId: user.id,
      },
      transaction,
    );
    return { verified: true };
  });
}

export async function resetPassword(token: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  return consumeAccountToken('password_reset', token, async (user, _record, transaction) => {
    await user.update(
      { passwordHash, authVersion: user.authVersion + 1, version: user.version + 1 },
      { transaction },
    );
    await RefreshTokenModel.update(
      { revokedAt: new Date() },
      { where: { userId: user.id, revokedAt: null }, transaction },
    );
    await recordAudit(
      {
        actorId: user.id,
        action: 'account.password_reset',
        resourceType: 'user',
        resourceId: user.id,
      },
      transaction,
    );
    return { changed: true };
  });
}

export async function patchProfile(
  userId: string,
  input: UpdateProfileInput & { expectedVersion: number },
) {
  const file = input.imageStorageId
    ? await createFromStorageId(input.imageStorageId, 'avatar')
    : undefined;
  await sequelize.transaction(async (transaction) => {
    const user = await UserModel.findByPk(userId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!user) throw new Unauthorized();
    assertVersion(user.version, input.expectedVersion);
    const before = jsonValue({
      displayName: user.displayName,
      phone: user.phone,
      avatarId: user.avatarId,
    });
    await user.update(
      {
        displayName: input.displayName ?? user.displayName,
        phone: input.phone === undefined ? user.phone : input.phone,
        avatarId: file?.id ?? user.avatarId,
        version: user.version + 1,
      },
      { transaction },
    );
    await recordAudit(
      {
        actorId: userId,
        action: 'profile.updated',
        resourceType: 'user',
        resourceId: userId,
        changes: {
          before,
          after: jsonValue({
            displayName: user.displayName,
            phone: user.phone,
            avatarId: user.avatarId,
          }),
        },
      },
      transaction,
    );
  });
  return getMe(userId);
}

export async function patchPreferences(
  userId: string,
  input: ProfilePreferences & { expectedVersion: number },
) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: input.timezone });
  } catch {
    throw new BadRequest('invalid_timezone');
  }
  await sequelize.transaction(async (transaction) => {
    const user = await UserModel.findByPk(userId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!user) throw new Unauthorized();
    assertVersion(user.version, input.expectedVersion);
    await user.update(
      { locale: input.locale, timezone: input.timezone, version: user.version + 1 },
      { transaction },
    );
    await recordAudit(
      {
        actorId: userId,
        action: 'preferences.updated',
        resourceType: 'user',
        resourceId: userId,
        changes: jsonValue(input),
      },
      transaction,
    );
  });
  return getMe(userId);
}

export async function requestEmailChange(userId: string, email: string, currentPassword: string) {
  await sequelize.transaction(async (transaction) => {
    const user = await UserModel.findByPk(userId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!user?.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash)))
      throw new BadRequest('current_password_invalid');
    const existing = await UserModel.findOne({
      where: { email: email.toLowerCase() },
      transaction,
    });
    if (existing)
      throw new BaseError('duplicate_value', 400, 'input_valid_error', {
        email: ['Email is already in use.'],
      });
    await issueAccountToken(
      user,
      'email_change',
      transaction,
      { newEmail: email.toLowerCase() },
      email.toLowerCase(),
    );
  });
  return { accepted: true };
}

export async function confirmEmailChange(token: string) {
  return consumeAccountToken('email_change', token, async (user, record, transaction) => {
    const data = record.data;
    if (
      !data ||
      typeof data !== 'object' ||
      Array.isArray(data) ||
      typeof data.newEmail !== 'string'
    )
      throw new BadRequest('invalid_account_token');
    await user.update(
      {
        email: data.newEmail,
        emailVerifiedAt: new Date(),
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
        action: 'account.email_changed',
        resourceType: 'user',
        resourceId: user.id,
      },
      transaction,
    );
    return { changed: true };
  });
}
