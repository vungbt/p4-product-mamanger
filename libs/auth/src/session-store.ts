import type { User } from '@p4/shared';

/** Key of the default in-memory session. Sessions are never persisted to storage. */
export const AUTH_SESSION_KEY = 'p4_auth';

export type AuthSession = {
  token: string;
  user: User;
};

type SessionListener = (session: AuthSession | null) => void;

const listeners = new Set<SessionListener>();

const sessions = new Map<string, AuthSession>();

export function readAuthSession(sessionKey = AUTH_SESSION_KEY): AuthSession | null {
  return sessions.get(sessionKey) ?? null;
}

function notify(session: AuthSession | null) {
  for (const listener of listeners) listener(session);
}

export function writeAuthSession(session: AuthSession, sessionKey = AUTH_SESSION_KEY) {
  sessions.set(sessionKey, session);
  notify(session);
}

export function clearAuthSession(sessionKey = AUTH_SESSION_KEY) {
  sessions.delete(sessionKey);
  // Remove tokens that releases before Better Auth stored under this key.
  if (typeof localStorage !== 'undefined') localStorage.removeItem(sessionKey);
  notify(null);
}

export function broadcastAuthChange() {
  if (typeof BroadcastChannel === 'undefined') return;
  const channel = new BroadcastChannel('p4-auth');
  channel.postMessage('changed');
  channel.close();
}

export function subscribeAuthSession(listener: SessionListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
