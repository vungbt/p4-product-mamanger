import type { IncomingHttpHeaders } from 'node:http';
import { BadRequest, Unauthorized } from '@p4/server-core';
import type { LoginResponse, UpdatePasswordInput, UpdateProfileInput, User } from '@p4/shared';
import bcrypt from 'bcryptjs';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '@/configs/better-auth.js';
import { errorKeys } from '@/constants/index.js';
import { createFromStorageId, deleteFileIfUnreferenced } from '@/modules/files/files.service.js';
import { AuthSessionModel, FileModel, UserModel } from '@/sequelize/models/index.js';
import { auditedTransaction } from '@/shared/audit/audited-command.js';
import { selectFields } from '@/utils/select-fields.js';

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

export async function sessionFromHeaders(headers: IncomingHttpHeaders | Headers, refresh = false) {
  return auth.api.getSession({
    headers: headers instanceof Headers ? headers : fromNodeHeaders(headers),
    query: { disableRefresh: !refresh },
  });
}

export async function findUserByToken(token: string): Promise<User | undefined> {
  const session = await sessionFromHeaders(new Headers({ authorization: `Bearer ${token}` }));
  return session ? loadUserById(session.user.id) : undefined;
}

// Compatibility endpoints use the same Better Auth sessions as the native client.
// There is no JWT or second refresh-token engine.
export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    const result = await auth.api.signInEmail({ body: { email, password } });
    const user = await loadUserById(result.user.id);
    if (!user) throw new Unauthorized();
    return { token: result.token, refreshToken: result.token, user };
  } catch {
    throw new Unauthorized(errorKeys.invalidCredentials);
  }
}

export async function loginWithGoogle(credential: string): Promise<LoginResponse> {
  const result = await auth.api.signInSocial({
    body: { provider: 'google', idToken: { token: credential } },
  });
  if (!('token' in result) || !result.token || !result.user)
    throw new Unauthorized(errorKeys.googleTokenInvalid);
  const user = await loadUserById(result.user.id);
  if (user?.role !== 'user') {
    await auth.api.signOut({ headers: new Headers({ authorization: `Bearer ${result.token}` }) });
    throw new Unauthorized(errorKeys.googleTokenInvalid);
  }
  return { token: result.token, refreshToken: result.token, user };
}

export async function refresh(token: string): Promise<LoginResponse> {
  const session = await sessionFromHeaders(new Headers({ authorization: `Bearer ${token}` }), true);
  const user = session ? await loadUserById(session.user.id) : undefined;
  if (!session || !user) throw new Unauthorized(errorKeys.invalidRefreshToken);
  return { token: session.session.token, refreshToken: session.session.token, user };
}

export async function logout(options: { refreshToken?: string; token?: string }) {
  const token = options.token ?? options.refreshToken;
  if (token) await auth.api.signOut({ headers: new Headers({ authorization: `Bearer ${token}` }) });
  return { ok: true as const };
}

export async function getMe(userId: string) {
  const user = await loadUserById(userId);
  if (!user) throw new Unauthorized(errorKeys.invalidToken);
  return { user };
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  return auditedTransaction(async () => {
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
  });
}

export async function updatePassword(
  userId: string,
  input: UpdatePasswordInput,
): Promise<{ changed: true }> {
  return auditedTransaction(async (transaction) => {
    const row = await UserModel.findByPk(userId, { transaction, lock: transaction.LOCK.UPDATE });
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

    await AuthSessionModel.destroy({ where: { userId } });

    return { changed: true };
  });
}
