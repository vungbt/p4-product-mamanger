import type { LoginResponse, UpdateProfileInput, User } from '@p4/shared';
import bcrypt from 'bcryptjs';
import { env } from '@/configs/env.js';
import { errorKeys } from '@/constants/index.js';
import { FileModel, RefreshTokenModel, UserModel } from '@/sequelize/models/index.js';
import { createFromStorageId, deleteFileIfUnreferenced } from '@/services/files/files.service.js';
import { Unauthorized } from '@/utils/errors/index.js';
import { signAccessToken, verifyAccessToken } from '@/utils/jwt.js';
import { generateRefreshToken, hashToken, refreshExpiresAt } from '@/utils/refresh-token.js';

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
    avatarId: row.avatarId,
    avatarUrl: row.avatar?.url ?? '',
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
  if (!row || !(await bcrypt.compare(password, row.passwordHash))) {
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
