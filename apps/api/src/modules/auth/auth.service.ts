import type { LoginResponse, UpdatePasswordInput, UpdateProfileInput, User } from '@p4/shared';
import bcrypt from 'bcryptjs';
import { Op, type Transaction } from 'sequelize';
import { env } from '@/configs/env.js';
import { errorKeys } from '@/constants/index.js';
import { createFromStorageId, deleteFileIfUnreferenced } from '@/modules/files/files.service.js';
import { sequelize } from '@/sequelize/index.js';
import { FileModel, RefreshTokenModel, UserModel } from '@/sequelize/models/index.js';
import { BadRequest, Unauthorized } from '@/utils/errors/index.js';
import { signAccessToken, verifyAccessToken } from '@/utils/jwt.js';
import { generateRefreshToken, hashToken, refreshExpiresAt } from '@/utils/refresh-token.js';
import { selectFields } from '@/utils/select-fields.js';
import { verifyGoogleIdToken } from './google-id-token.js';

type UserWithAvatar = UserModel & { avatar?: FileModel | null };

const avatarInclude = {
  model: FileModel,
  as: 'avatar' as const,
  attributes: ['id', 'url', 'storageId', 'provider'],
};

const userFields = [
  'id',
  'email',
  'role',
  'displayName',
  'avatarId',
  'phone',
  'locale',
  'timezone',
  'accountStatus',
  'staffRole',
  'version',
] satisfies (keyof User)[];

function toUser(row: UserWithAvatar): User {
  return {
    ...selectFields(row, userFields),
    // File upload ưu tiên hơn URL Google/external
    avatarUrl: row.avatar?.url || row.avatarUrl || '',
    hasPassword: Boolean(row.passwordHash),
    emailVerified: Boolean(row.emailVerifiedAt),
  };
}

async function loadUserById(id: string): Promise<User | undefined> {
  const row = (await UserModel.findByPk(id, { include: [avatarInclude] })) as UserWithAvatar | null;
  return row?.accountStatus === 'active' ? toUser(row) : undefined;
}

async function issueTokenPair(user: User, transaction?: Transaction): Promise<LoginResponse> {
  const account = await UserModel.findByPk(user.id, { transaction });
  if (account?.accountStatus !== 'active') throw new Unauthorized();
  const refreshToken = generateRefreshToken();
  const session = await RefreshTokenModel.create(
    {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiresAt(env.jwt.refreshExpiresIn),
      revokedAt: null,
    },
    { transaction },
  );
  const token = signAccessToken(user, account.authVersion, session.id);
  return { token, refreshToken, user };
}

export async function validateCredentials(email: string, password: string): Promise<User> {
  const row = (await UserModel.findOne({
    where: { email },
    include: [avatarInclude],
  })) as UserWithAvatar | null;
  if (
    !row?.passwordHash ||
    row.accountStatus !== 'active' ||
    !(await bcrypt.compare(password, row.passwordHash))
  ) {
    throw new Unauthorized(errorKeys.invalidCredentials);
  }
  return toUser(row);
}

export function issueToken(user: User) {
  return signAccessToken(user);
}

export async function findUserByToken(token: string): Promise<User | undefined> {
  const payload = verifyAccessToken(token);
  const account = await UserModel.findByPk(payload.sub);
  if (account?.accountStatus !== 'active' || account.authVersion !== payload.ver)
    throw new Unauthorized();
  if (payload.sid) {
    const session = await RefreshTokenModel.findOne({
      where: {
        id: payload.sid,
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { [Op.gt]: new Date() },
      },
    });
    if (!session) throw new Unauthorized();
  }
  return loadUserById(payload.sub);
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const user = await validateCredentials(email, password);
  return issueTokenPair(user);
}

export async function loginWithGoogle(credential: string): Promise<LoginResponse> {
  const identity = await verifyGoogleIdToken(credential);

  let row = (await UserModel.findOne({
    where: { googleId: identity.googleId },
    include: [avatarInclude],
  })) as UserWithAvatar | null;

  if (!row) {
    row = (await UserModel.findOne({
      where: { email: identity.email },
      include: [avatarInclude],
    })) as UserWithAvatar | null;

    if (row) {
      await row.update({
        googleId: identity.googleId,
        displayName: identity.name || row.displayName,
        avatarUrl: identity.picture || row.avatarUrl,
      });
      await row.reload({ include: [avatarInclude] });
    } else {
      row = (await UserModel.create({
        email: identity.email,
        googleId: identity.googleId,
        displayName: identity.name || null,
        avatarUrl: identity.picture || null,
        passwordHash: null,
        role: 'user',
      })) as UserWithAvatar;
      await row.reload({ include: [avatarInclude] });
    }
  } else {
    // Đồng bộ tên/ảnh Google khi login lại
    await row.update({
      displayName: identity.name || row.displayName,
      avatarUrl: identity.picture || row.avatarUrl,
    });
    await row.reload({ include: [avatarInclude] });
  }

  // Google login chỉ dành cho storefront user
  if (row.role !== 'user' || row.accountStatus !== 'active') {
    throw new Unauthorized(errorKeys.googleTokenInvalid);
  }

  return issueTokenPair(toUser(row));
}

export async function refresh(refreshToken: string): Promise<LoginResponse> {
  return sequelize.transaction(async (transaction) => {
    const row = await RefreshTokenModel.findOne({
      where: { tokenHash: hashToken(refreshToken) },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!row || row.revokedAt || row.expiresAt.getTime() <= Date.now())
      throw new Unauthorized(errorKeys.invalidRefreshToken);
    const user = await loadUserById(row.userId);
    if (!user) throw new Unauthorized(errorKeys.invalidRefreshToken);
    await row.update({ revokedAt: new Date() }, { transaction });
    return issueTokenPair(user, transaction);
  });
}

export async function logout(options: { refreshToken?: string; userId?: string }) {
  const { refreshToken, userId } = options;
  const now = new Date();

  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await RefreshTokenModel.update({ revokedAt: now }, { where: { tokenHash, revokedAt: null } });
  }

  if (userId) {
    await RefreshTokenModel.update({ revokedAt: now }, { where: { userId, revokedAt: null } });
  }

  return { ok: true as const };
}

export async function getMe(userId: string) {
  const user = await loadUserById(userId);
  if (!user) throw new Unauthorized(errorKeys.invalidToken);
  return { user };
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const row = await UserModel.findByPk(userId);
  if (!row) throw new Unauthorized(errorKeys.invalidToken);

  if (input.imageStorageId?.trim()) {
    const previousAvatarId = row.avatarId;
    const file = await createFromStorageId(input.imageStorageId.trim(), 'avatar');
    await row.update({ avatarId: file.id });
    if (previousAvatarId && previousAvatarId !== file.id) {
      await deleteFileIfUnreferenced(previousAvatarId);
    }
  }

  const user = await loadUserById(userId);
  if (!user) throw new Unauthorized(errorKeys.invalidToken);
  return { user };
}

export async function updatePassword(
  userId: string,
  input: UpdatePasswordInput,
): Promise<LoginResponse> {
  const row = await UserModel.findByPk(userId);
  if (!row) throw new Unauthorized(errorKeys.invalidToken);

  if (
    row.passwordHash &&
    (!input.currentPassword || !(await bcrypt.compare(input.currentPassword, row.passwordHash)))
  ) {
    throw new BadRequest(errorKeys.currentPasswordInvalid);
  }

  row.passwordHash = await bcrypt.hash(input.newPassword, 10);
  row.authVersion += 1;
  await row.save();

  await RefreshTokenModel.update({ revokedAt: new Date() }, { where: { userId, revokedAt: null } });

  const user = await loadUserById(userId);
  if (!user) throw new Unauthorized(errorKeys.invalidToken);
  return issueTokenPair(user);
}
