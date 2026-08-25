import type { Role, User } from '@p4/shared';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AUTH_STORAGE_KEY } from './fake-auth';
import {
  type AuthSession,
  clearAuthSession,
  getTokenExpiresAt,
  readAuthSession,
  subscribeAuthSession,
  writeAuthSession,
} from './session-store';

const REFRESH_EARLY_MS = 60_000;

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
  /** POST /api/auth/login — required for password login */
  onLogin: (email: string, password: string) => Promise<AuthSession>;
  /** POST /api/auth/google — storefront */
  onGoogleLogin?: (credential: string) => Promise<AuthSession>;
  /** Refresh session, shared with the API interceptor. */
  onRefresh?: () => Promise<AuthSession | null>;
  /** Revoke the refresh token server-side; the local session is cleared immediately. */
  onLogout?: (session: AuthSession) => Promise<void>;
};

export function AuthProvider({
  children,
  storageKey = AUTH_STORAGE_KEY,
  onLogin,
  onGoogleLogin,
  onRefresh,
  onLogout,
}: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(() => readAuthSession(storageKey));

  useEffect(() => subscribeAuthSession(setSession, storageKey), [storageKey]);

  const persistSession = useCallback(
    (nextSession: AuthSession) => {
      writeAuthSession(nextSession, storageKey);
    },
    [storageKey],
  );

  const logout = useCallback(() => {
    const current = readAuthSession(storageKey);
    clearAuthSession(storageKey);
    if (current && onLogout) void onLogout(current).catch(() => undefined);
  }, [onLogout, storageKey]);

  useEffect(() => {
    if (!session?.refreshToken || !onRefresh) return;

    const expiresAt = getTokenExpiresAt(session.token);
    if (!expiresAt) return;

    const refreshIfNeeded = () => {
      if (document.visibilityState !== 'visible') return;
      if (expiresAt - Date.now() <= REFRESH_EARLY_MS) void onRefresh();
    };
    const delay = Math.max(0, expiresAt - Date.now() - REFRESH_EARLY_MS);
    const timer = window.setTimeout(refreshIfNeeded, delay);

    const handleFocus = () => refreshIfNeeded();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refreshIfNeeded();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    refreshIfNeeded();

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [onRefresh, session?.refreshToken, session?.token]);

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

/** Alias kept for compatibility with the old scaffold */
export const useAuthContext = useAuth;
