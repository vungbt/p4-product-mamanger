import type { Role, User } from '@p4/shared';

export const AUTH_STORAGE_KEY = 'p4_auth';

/** Fake auth to demo the structure — replace with the real API */
export const FAKE_AUTH = {
  admin: {
    username: 'admin',
    password: 'admin',
    user: {
      id: '1',
      email: 'admin@demo.com',
      role: 'admin' as Role,
    } satisfies User,
  },
  user: {
    username: 'user',
    password: 'user',
    user: {
      id: '2',
      email: 'user@demo.com',
      role: 'user' as Role,
    } satisfies User,
  },
} as const;

export type FakeAuthAccounts = typeof FAKE_AUTH;
