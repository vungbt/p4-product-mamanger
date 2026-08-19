import type { Role, User } from '@p4/shared';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { AUTH_STORAGE_KEY } from './fake-auth';

export type AuthSession = {
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
  login: (email: string, password: string, portal: AuthPortal) => Promise<void>;
  /** Storefront only — credential = Google ID token */
  loginWithGoogle: (credential: string, portal?: AuthPortal) => Promise<void>;
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

function assertPortalRole(user: User, portal: AuthPortal) {
  if (portal === 'admin' && user.role !== 'admin') {
    throw new Error('auth.unauthorized');
  }
  if (portal === 'storefront' && user.role !== 'user') {
    throw new Error('auth.unauthorized');
  }
}

export type AuthProviderProps = {
  children: ReactNode;
  storageKey?: string;
  /** POST /api/auth/login — bắt buộc cho password login */
  onLogin: (email: string, password: string) => Promise<AuthSession>;
  /** POST /api/auth/google — storefront */
  onGoogleLogin?: (credential: string) => Promise<AuthSession>;
};

export function AuthProvider({
  children,
  storageKey = AUTH_STORAGE_KEY,
  onLogin,
  onGoogleLogin,
}: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(() => readSession(storageKey));

  const persistSession = useCallback(
    (nextSession: AuthSession) => {
      localStorage.setItem(storageKey, JSON.stringify(nextSession));
      setSession(nextSession);
    },
    [storageKey],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(storageKey);
    setSession(null);
  }, [storageKey]);

  const login = useCallback(
    async (email: string, password: string, portal: AuthPortal) => {
      const nextSession = await onLogin(email.trim(), password);
      assertPortalRole(nextSession.user, portal);
      persistSession(nextSession);
    },
    [onLogin, persistSession],
  );

  const loginWithGoogle = useCallback(
    async (credential: string, portal: AuthPortal = 'storefront') => {
      if (portal !== 'storefront') {
        throw new Error('auth.googleAdminNotAllowed');
      }
      if (!credential.trim()) {
        throw new Error('auth.googleFailed');
      }
      if (!onGoogleLogin) {
        throw new Error('auth.googleFailed');
      }

      const nextSession = await onGoogleLogin(credential);
      assertPortalRole(nextSession.user, 'storefront');
      persistSession(nextSession);
    },
    [onGoogleLogin, persistSession],
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
      loginWithGoogle,
      logout,
    };
  }, [session, login, loginWithGoogle, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** Alias tương thích scaffold cũ */
export const useAuthContext = useAuth;
