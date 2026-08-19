import type { User } from '@p4/shared';
import { AUTH_STORAGE_KEY } from './fake-auth';

export type AuthSession = {
  token: string;
  refreshToken?: string;
  user: User;
};

type SessionListener = (session: AuthSession | null) => void;

const listeners = new Set<SessionListener>();

export function readAuthSession(storageKey = AUTH_STORAGE_KEY): AuthSession | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

function notify(session: AuthSession | null) {
  for (const listener of listeners) listener(session);
}

export function writeAuthSession(session: AuthSession, storageKey = AUTH_STORAGE_KEY) {
  localStorage.setItem(storageKey, JSON.stringify(session));
  notify(session);
}

export function clearAuthSession(storageKey = AUTH_STORAGE_KEY) {
  localStorage.removeItem(storageKey);
  notify(null);
}

export function subscribeAuthSession(listener: SessionListener, storageKey = AUTH_STORAGE_KEY) {
  listeners.add(listener);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === storageKey) listener(readAuthSession(storageKey));
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', handleStorage);
  };
}

export function getTokenExpiresAt(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded = JSON.parse(atob(normalized)) as { exp?: unknown };
    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}
