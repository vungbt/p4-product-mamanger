import type { Role, User } from '@p4/shared';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { AUTH_STORAGE_KEY, FAKE_AUTH, type FakeAuthAccounts } from './fake-auth';

type AuthSession = {
  token: string;
  refreshToken?: string;
  user: User;
};

export type AuthPortal = 'admin' | 'storefront';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  role: Role | null;
  isAdmin: boolean;
  isUser: boolean;
  login: (username: string, password: string, portal: AuthPortal) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(storageKey: string): AuthSession | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export type AuthProviderProps = {
  children: ReactNode;
  storageKey?: string;
  accounts?: FakeAuthAccounts;
};

// TODO: thay fake login bằng gọi POST /api/auth/login
export function AuthProvider({
  children,
  storageKey = AUTH_STORAGE_KEY,
  accounts = FAKE_AUTH,
}: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(() => readSession(storageKey));

  const logout = useCallback(() => {
    localStorage.removeItem(storageKey);
    setSession(null);
  }, [storageKey]);

  const login = useCallback(
    async (username: string, password: string, portal: AuthPortal) => {
      const account = portal === 'admin' ? accounts.admin : accounts.user;

      if (username !== account.username || password !== account.password) {
        throw new Error('auth.invalidCredentials');
      }

      const nextSession: AuthSession = {
        token: `fake_${account.user.id}`,
        refreshToken: `fake_refresh_${account.user.id}`,
        user: account.user,
      };

      localStorage.setItem(storageKey, JSON.stringify(nextSession));
      setSession(nextSession);
    },
    [accounts, storageKey],
  );

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;
    const role = user?.role ?? null;

    return {
      user,
      token: session?.token ?? null,
      isAuthenticated: Boolean(user),
      role,
      isAdmin: role === 'admin',
      isUser: role === 'user',
      login,
      logout,
    };
  }, [session, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** Alias tương thích scaffold cũ */
export const useAuthContext = useAuth;
