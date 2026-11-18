import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  readSession,
  refreshSession,
  type SessionUser,
  signIn,
  signOut,
  subscribeOtherTabs,
  subscribeSession,
} from './session';

/** Re-check the cookie session at most this often while the tab is visible. */
const REFRESH_INTERVAL_MS = 5 * 60_000;

type AuthContextValue = {
  user: SessionUser | null;
  /** True until the first cookie check after page load finishes. */
  isRestoring: boolean;
  /** The server dropped a session this tab had (shown on the login page). */
  expired: boolean;
  signIn: typeof signIn;
  signOut: typeof signOut;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(subscribeSession, readSession);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    let active = true;

    const sync = () => {
      void refreshSession().finally(() => {
        if (active) setIsRestoring(false);
      });
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') sync();
    };

    sync();

    const interval = window.setInterval(onVisible, REFRESH_INTERVAL_MS);
    const unsubscribeTabs = subscribeOtherTabs(sync);

    window.addEventListener('focus', sync);
    return () => {
      active = false;
      window.clearInterval(interval);
      unsubscribeTabs();
      window.removeEventListener('focus', sync);
    };
  }, []);

  const value: AuthContextValue = {
    user: session.user,
    isRestoring,
    expired: session.expired,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
