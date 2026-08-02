import type { LoginResponse, User } from '@p4/shared';
import bcrypt from 'bcryptjs';
import { env } from '@/configs/env.js';
import { errorKeys } from '@/constants/index.js';
import { RefreshTokenModel, UserModel } from '@/sequelize/models/index.js';
import { Unauthorized } from '@/utils/errors/index.js';
import { signAccessToken, verifyAccessToken } from '@/utils/jwt.js';
import { generateRefreshToken, hashToken, refreshExpiresAt } from '@/utils/refresh-token.js';

function toUser(row: UserModel): User {
  return { id: row.id, email: row.email, role: row.role };
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
  const row = await UserModel.findOne({ where: { email } });
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
  const row = await UserModel.findByPk(payload.sub);
  return row ? toUser(row) : undefined;
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

  const userRow = await UserModel.findByPk(row.userId);
  if (!userRow) {
    throw new Unauthorized(errorKeys.invalidRefreshToken);
  }

  row.revokedAt = new Date();
  await row.save();

  return issueTokenPair(toUser(userRow));
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

export function getMe(user: User) {
  return { user };
}
