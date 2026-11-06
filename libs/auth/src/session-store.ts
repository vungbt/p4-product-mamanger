import type { User } from '@p4/shared';
import { AUTH_STORAGE_KEY } from './fake-auth';

export type AuthSession = {
  token: string;
  user: User;
};

type SessionListener = (session: AuthSession | null) => void;

const listeners = new Set<SessionListener>();

const sessions = new Map<string, AuthSession>();

export function readAuthSession(storageKey = AUTH_STORAGE_KEY): AuthSession | null {
  return sessions.get(storageKey) ?? null;
}

function notify(session: AuthSession | null) {
  for (const listener of listeners) listener(session);
}

export function writeAuthSession(session: AuthSession, storageKey = AUTH_STORAGE_KEY) {
  sessions.set(storageKey, session);
  notify(session);
}

export function clearAuthSession(storageKey = AUTH_STORAGE_KEY) {
  sessions.delete(storageKey);
  if (typeof localStorage !== 'undefined') localStorage.removeItem(storageKey);
  notify(null);
}

export function broadcastAuthChange() {
  if (typeof BroadcastChannel === 'undefined') return;
  const channel = new BroadcastChannel('p4-auth');
  channel.postMessage('changed');
  channel.close();
}

export function subscribeAuthSession(listener: SessionListener, _storageKey = AUTH_STORAGE_KEY) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
