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
import {
  AUTH_SESSION_KEY,
  type AuthSession,
  broadcastAuthChange,
  clearAuthSession,
  readAuthSession,
  subscribeAuthSession,
  writeAuthSession,
} from './session-store';

export type AuthPortal = 'admin' | 'storefront';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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
  /** Separates the in-memory session when several providers share a page. */
  sessionKey?: string;
  /** Better Auth email/password sign-in. */
  onLogin: (email: string, password: string) => Promise<AuthSession>;
  /** Better Auth Google ID-token sign-in — storefront. */
  onGoogleLogin?: (credential: string) => Promise<AuthSession>;
  /** Restore the current cookie session, shared with the API interceptor. */
  onRefresh?: () => Promise<AuthSession | null>;
  /** Sign out on the server; clear the in-memory session immediately. */
  onLogout?: (session?: AuthSession) => Promise<void>;
};

export function AuthProvider({
  children,
  sessionKey = AUTH_SESSION_KEY,
  onLogin,
  onGoogleLogin,
  onRefresh,
  onLogout,
}: AuthProviderProps) {
  const [isLoading, setIsLoading] = useState(Boolean(onRefresh));
  const [session, setSession] = useState<AuthSession | null>(() => readAuthSession(sessionKey));

  useEffect(() => {
    let active = true;
    clearAuthSession(sessionKey);
    const sync = () => {
      if (onRefresh)
        void onRefresh().finally(() => {
          if (active) setIsLoading(false);
        });
      else setIsLoading(false);
    };
    sync();
    const channel =
      typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('p4-auth');
    if (channel) channel.onmessage = sync;
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') sync();
    }, 5 * 60_000);
    window.addEventListener('focus', sync);
    return () => {
      active = false;
      window.clearInterval(interval);
      channel?.close();
      window.removeEventListener('focus', sync);
    };
  }, [onRefresh, sessionKey]);

  useEffect(() => subscribeAuthSession(setSession), []);

  const persistSession = useCallback(
    (nextSession: AuthSession) => {
      writeAuthSession(nextSession, sessionKey);
      broadcastAuthChange();
    },
    [sessionKey],
  );

  const logout = useCallback(() => {
    const current = readAuthSession(sessionKey);
    clearAuthSession(sessionKey);
    if (onLogout)
      void onLogout(current ?? undefined)
        .finally(broadcastAuthChange)
        .catch(() => undefined);
  }, [onLogout, sessionKey]);

  const login = useCallback(
    async (email: string, password: string, portal: AuthPortal) => {
      const nextSession = await onLogin(email.trim(), password);
      try {
        assertPortalRole(nextSession.user, portal);
      } catch (error) {
        clearAuthSession(sessionKey);
        await onLogout?.(nextSession);
        throw error;
      }
      persistSession(nextSession);
    },
    [onLogin, persistSession, onLogout, sessionKey],
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
      isLoading,
      role,
      isAdmin: role === 'admin',
      isUser: role === 'user',
      login,
      loginWithGoogle,
      logout,
    };
  }, [session, isLoading, login, loginWithGoogle, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** Alias kept for compatibility with the old scaffold */
export const useAuthContext = useAuth;
