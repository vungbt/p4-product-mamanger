import { createP4AuthClient } from '@p4/api-sdk/auth';
import { createApiSdk, unwrap } from '@p4/api-sdk/shared';
import { type AuthSession, clearAuthSession, readAuthSession, writeAuthSession } from '@p4/auth';

let apiBaseURL = '/api';
let authClient: ReturnType<typeof createP4AuthClient> | undefined;
let sdkClient: ReturnType<typeof createApiSdk> | undefined;

/** Call once from apps/web — baseURL example: `/api` or `https://host/api`. */
export function configureApiClient(options: { baseURL: string }) {
  apiBaseURL = options.baseURL.replace(/\/$/, '');
  authClient = undefined;
  sdkClient = undefined;
}

function absoluteApiUrl() {
  return new URL(
    apiBaseURL,
    typeof window === 'undefined' ? 'http://127.0.0.1:3001' : window.location.origin,
  ).href;
}

function currentLocale() {
  try {
    return localStorage.getItem('p4_locale') ?? 'vi';
  } catch {
    return 'vi';
  }
}

export function getAuthClient() {
  authClient ??= createP4AuthClient(absoluteApiUrl());
  return authClient;
}

/** Typed client generated from the API contract (`@p4/api-sdk`). */
export function getApiSdk() {
  sdkClient ??= createApiSdk({
    baseUrl: absoluteApiUrl().replace(/\/api\/?$/, ''),
    getToken: getAccessToken,
    getHeaders: () => ({ 'Accept-Language': currentLocale() }),
    // A rejected session (expired or revoked elsewhere) re-syncs the AuthProvider state.
    onUnauthorized: () => {
      if (readAuthSession()) void refreshAuthSession();
    },
  });
  return sdkClient;
}

export function getAccessToken(): string | null {
  return readAuthSession()?.token ?? null;
}

let refreshPromise: Promise<AuthSession | null> | null = null;
let authEpoch = 0;
let logoutPromise: Promise<void> | null = null;

async function performRefresh(epoch: number, persist = true): Promise<AuthSession | null> {
  if (logoutPromise) return null;
  try {
    const { data, error } = await getAuthClient().getSession();
    if (error || !data) {
      if (epoch === authEpoch && persist) clearAuthSession();
      return null;
    }
    const me = unwrap(await getApiSdk().GET('/api/auth/me'));
    const session: AuthSession = { token: data.session.token, user: me.data.user };
    if (epoch !== authEpoch) return null;
    if (persist) writeAuthSession(session);
    return session;
  } catch {
    if (epoch === authEpoch && persist) clearAuthSession();
    return null;
  }
}

export async function loginAuthSession(email: string, password: string): Promise<AuthSession> {
  await logoutPromise;
  const epoch = ++authEpoch;
  refreshPromise = null;
  clearAuthSession();
  const result = await getAuthClient().signIn.email({ email, password });
  if (result.error) throw new Error(result.error.message ?? 'auth.loginFailed');
  const session = await performRefresh(epoch, false);
  if (!session) throw new Error('auth.loginFailed');
  return session;
}

export async function loginGoogleAuthSession(credential: string): Promise<AuthSession> {
  await logoutPromise;
  const epoch = ++authEpoch;
  refreshPromise = null;
  clearAuthSession();
  const result = await getAuthClient().signIn.social({
    provider: 'google',
    idToken: { token: credential },
  });
  if (result.error) throw new Error(result.error.message ?? 'auth.googleFailed');
  const session = await performRefresh(epoch, false);
  if (!session) throw new Error('auth.googleFailed');
  return session;
}

export function refreshAuthSession(): Promise<AuthSession | null> {
  if (!refreshPromise) {
    const pending: Promise<AuthSession | null> = performRefresh(authEpoch).finally(() => {
      if (refreshPromise === pending) refreshPromise = null;
    });
    refreshPromise = pending;
  }
  return refreshPromise;
}

export function revokeAuthSession(_session?: AuthSession): Promise<void> {
  ++authEpoch;
  refreshPromise = null;
  clearAuthSession();
  const pending =
    logoutPromise ??
    getAuthClient()
      .signOut()
      .then(() => undefined)
      .finally(() => {
        logoutPromise = null;
      });
  logoutPromise = pending;
  return pending;
}
