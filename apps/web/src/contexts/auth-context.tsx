import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { AUTH_STORAGE_KEY, FAKE_AUTH } from '@/constants/constants';
import type { Role, User } from '@/types/types';

type AuthSession = {
  token: string;
  user: User;
};

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  role: Role | null;
  isAdmin: boolean;
  isUser: boolean;
  login: (username: string, password: string, portal: 'admin' | 'storefront') => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

// TODO: thay fake login bằng gọi POST /api/auth/login
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => readSession());

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setSession(null);
  }, []);

  const login = useCallback(
    async (username: string, password: string, portal: 'admin' | 'storefront') => {
      const account = portal === 'admin' ? FAKE_AUTH.admin : FAKE_AUTH.user;

      if (username !== account.username || password !== account.password) {
        throw new Error('Sai tài khoản hoặc mật khẩu');
      }

      const nextSession: AuthSession = {
        token: `fake_${account.user.id}`,
        user: account.user,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
    },
    [],
  );

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;
    const role = user?.role ?? null;

    return {
      user,
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

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
