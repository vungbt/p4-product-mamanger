import { createStayAuthClient } from '@stay/sdk/auth';
import { type components, createStaySdk, unwrap } from '@stay/sdk/shared';
import { currentLocale } from '@/i18n';

/**
 * Stay web session, mirroring `@p4/api-client` session handling:
 * Better Auth owns the session in an HttpOnly `stay.*` cookie; the web keeps only the
 * signed-in user in memory (never a token in storage) and re-syncs from the cookie.
 */
export type SessionUser = components['schemas']['StayUser'];

export type SessionSnapshot = {
  user: SessionUser | null;
  /** True after the server stopped accepting a session this tab had (expired or revoked). */
  expired: boolean;
};

export type LoginFailure = 'invalid' | 'rate_limited' | 'failed';

export class LoginError extends Error {
  constructor(
    readonly reason: LoginFailure,
    /** Seconds until sign-in is allowed again (429 `Retry-After`). */
    readonly retryAfterSeconds?: number,
  ) {
    super(reason);
    this.name = 'LoginError';
  }
}

/** Same-origin API path; Vite proxies `/api` to `@stay/api` in dev and preview. */
const API_PATH = '/api';
const CHANNEL = 'stay-auth';

let authClient: ReturnType<typeof createStayAuthClient> | undefined;
let sdkClient: ReturnType<typeof createStaySdk> | undefined;
let snapshot: SessionSnapshot = { user: null, expired: false };
const listeners = new Set<() => void>();

let refreshPromise: Promise<SessionUser | null> | null = null;
let logoutPromise: Promise<void> | null = null;
let authEpoch = 0;

function setSnapshot(next: SessionSnapshot) {
  snapshot = next;
  for (const listener of listeners) listener();
}

export function readSession(): SessionSnapshot {
  return snapshot;
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Tells other tabs to re-sync (sign-in or sign-out happened here). */
function broadcast() {
  if (typeof BroadcastChannel === 'undefined') return;
  const channel = new BroadcastChannel(CHANNEL);
  channel.postMessage('changed');
  channel.close();
}

export function subscribeOtherTabs(onChange: () => void) {
  if (typeof BroadcastChannel === 'undefined') return () => undefined;
  const channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = onChange;
  return () => channel.close();
}

export function getAuthClient() {
  authClient ??= createStayAuthClient(new URL(API_PATH, window.location.origin).href);
  return authClient;
}

/** Typed `@stay/api` client; cookies are sent, a 401 re-syncs the session. */
export function getStaySdk() {
  sdkClient ??= createStaySdk({
    baseUrl: window.location.origin,
    getHeaders: () => ({ 'Accept-Language': currentLocale() }),
    onUnauthorized: () => {
      if (snapshot.user) void refreshSession();
    },
  });
  return sdkClient;
}

/** Reads the cookie session and the Stay user; `null` when signed out or on failure. */
async function loadUser(): Promise<SessionUser | null> {
  const { data, error } = await getAuthClient().getSession();

  if (error || !data) return null;
  return unwrap(await getStaySdk().GET('/api/me', {})).data.user;
}

async function performRefresh(epoch: number): Promise<SessionUser | null> {
  if (logoutPromise) return null;

  const hadUser = Boolean(snapshot.user);
  let user: SessionUser | null = null;

  try {
    user = await loadUser();
  } catch {
    user = null;
  }

  if (epoch !== authEpoch) return null;
  setSnapshot({ user, expired: !user && (hadUser || snapshot.expired) });
  return user;
}

/** Restores the session from the cookie (startup, focus, interval, other tabs, 401). */
export function refreshSession(): Promise<SessionUser | null> {
  if (!refreshPromise) {
    const pending = performRefresh(authEpoch).finally(() => {
      if (refreshPromise === pending) refreshPromise = null;
    });
    refreshPromise = pending;
  }
  return refreshPromise;
}

function retryAfterSeconds(header: string | null) {
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
}

export async function signIn(email: string, password: string): Promise<SessionUser> {
  await logoutPromise;
  const epoch = ++authEpoch;
  refreshPromise = null;

  let retryAfter: string | null = null;
  let result: Awaited<ReturnType<ReturnType<typeof getAuthClient>['signIn']['email']>>;

  try {
    result = await getAuthClient().signIn.email(
      { email: email.trim(), password },
      {
        onError: ({ response }) => {
          retryAfter = response.headers.get('Retry-After');
        },
      },
    );
  } catch {
    throw new LoginError('failed');
  }

  if (result.error) {
    const status = result.error.status;

    if (status === 429) throw new LoginError('rate_limited', retryAfterSeconds(retryAfter));
    if (status === 400 || status === 401 || status === 403) throw new LoginError('invalid');
    throw new LoginError('failed');
  }

  let user: SessionUser | null = null;

  try {
    user = await loadUser();
  } catch {
    user = null;
  }

  if (!user || epoch !== authEpoch) throw new LoginError('failed');
  setSnapshot({ user, expired: false });
  broadcast();
  return user;
}

export function signOut(): Promise<void> {
  ++authEpoch;
  refreshPromise = null;
  setSnapshot({ user: null, expired: false });

  const pending =
    logoutPromise ??
    getAuthClient()
      .signOut()
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        logoutPromise = null;
        broadcast();
      });

  logoutPromise = pending;
  return pending;
}
