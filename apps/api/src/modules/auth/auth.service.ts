import type { LoginResponse, UpdatePasswordInput, UpdateProfileInput, User } from '@p4/shared';
import bcrypt from 'bcryptjs';
import { env } from '@/configs/env.js';
import { errorKeys } from '@/constants/index.js';
import { createFromStorageId, deleteFileIfUnreferenced } from '@/modules/files/files.service.js';
import { FileModel, RefreshTokenModel, UserModel } from '@/sequelize/models/index.js';
import { BadRequest, Unauthorized } from '@/utils/errors/index.js';
import { signAccessToken, verifyAccessToken } from '@/utils/jwt.js';
import { generateRefreshToken, hashToken, refreshExpiresAt } from '@/utils/refresh-token.js';
import { verifyGoogleIdToken } from './google-id-token.js';

type UserWithAvatar = UserModel & { avatar?: FileModel | null };

const avatarInclude = {
  model: FileModel,
  as: 'avatar' as const,
  attributes: ['id', 'url', 'storageId', 'provider'],
};

function toUser(row: UserWithAvatar): User {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    displayName: row.displayName,
    avatarId: row.avatarId,
    // File upload ưu tiên hơn URL Google/external
    avatarUrl: row.avatar?.url || row.avatarUrl || '',
    hasPassword: Boolean(row.passwordHash),
  };
}

async function loadUserById(id: string): Promise<User | undefined> {
  const row = (await UserModel.findByPk(id, { include: [avatarInclude] })) as UserWithAvatar | null;
  return row ? toUser(row) : undefined;
}

async function issueTokenPair(user: User): Promise<LoginResponse> {
  const token = signAccessToken(user);
  const refreshToken = generateRefreshToken();
  await RefreshTokenModel.create({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: refreshExpiresAt(env.jwt.refreshExpiresIn),
    revokedAt: null,
  });
  return { token, refreshToken, user };
}

export async function validateCredentials(email: string, password: string): Promise<User> {
  const row = (await UserModel.findOne({
    where: { email },
    include: [avatarInclude],
  })) as UserWithAvatar | null;
  if (!row?.passwordHash || !(await bcrypt.compare(password, row.passwordHash))) {
    throw new Unauthorized(errorKeys.invalidCredentials);
  }
  return toUser(row);
}

export function issueToken(user: User) {
  return signAccessToken(user);
}

export async function findUserByToken(token: string): Promise<User | undefined> {
  const payload = verifyAccessToken(token);
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
  if (row.role !== 'user') {
    throw new Unauthorized(errorKeys.googleTokenInvalid);
  }

  return issueTokenPair(toUser(row));
}

export async function refresh(refreshToken: string): Promise<LoginResponse> {
  const tokenHash = hashToken(refreshToken);
  const row = await RefreshTokenModel.findOne({ where: { tokenHash } });
  if (!row || row.revokedAt) {
    throw new Unauthorized(errorKeys.invalidRefreshToken);
  }
  if (row.expiresAt.getTime() <= Date.now()) {
    row.revokedAt = new Date();
    await row.save();
    throw new Unauthorized(errorKeys.refreshTokenExpired);
  }

  const user = await loadUserById(row.userId);
  if (!user) {
    throw new Unauthorized(errorKeys.invalidRefreshToken);
  }

  row.revokedAt = new Date();
  await row.save();

  return issueTokenPair(user);
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
    const file = await createFromStorageId(input.imageStorageId.trim());
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
  await row.save();

  await RefreshTokenModel.update({ revokedAt: new Date() }, { where: { userId, revokedAt: null } });

  const user = await loadUserById(userId);
  if (!user) throw new Unauthorized(errorKeys.invalidToken);
  return issueTokenPair(user);
}
