import { createStaySdk, type StaySdk } from '../shared/client.js';
import { ApiSdkError, unwrap } from '../shared/errors.js';
import type { components } from '../shared/generated.js';

/**
 * Tenant portal (ST-25) client, separate from the staff client: it authenticates only with the
 * HttpOnly portal session cookie (`stay_portal_session`, path `/api/portal`) and never sends a
 * staff bearer token. A 401 means "no valid portal session", never a staff sign-out.
 */
export interface PortalSdkOptions {
  /** API origin; same-origin `/api` in the web app. */
  baseUrl: string;
  getHeaders?: () => HeadersInit | Promise<HeadersInit>;
  fetch?: typeof globalThis.fetch;
}

export type PortalSessionInput = components['schemas']['PortalSessionInput'];

export function createPortalSdk(options: PortalSdkOptions): StaySdk {
  return createStaySdk({ ...options, credentials: 'include' });
}

export function createPortalApi(sdk: StaySdk) {
  return {
    /** Greeting of the entry page; 404 for any invalid link. */
    lookup: async (token: string) =>
      unwrap(await sdk.POST('/api/portal/links/lookup', { body: { token } })).data,
    /** Verifies the last 4 phone digits; the session is set as an HttpOnly cookie. */
    signIn: async (body: PortalSessionInput) =>
      unwrap(await sdk.POST('/api/portal/sessions', { body })).data,
    signOut: async () => unwrap(await sdk.DELETE('/api/portal/sessions', {})).data,
    me: async (signal?: AbortSignal) => unwrap(await sdk.GET('/api/portal/me', { signal })).data,
    invoices: async (signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/portal/invoices', { signal })).data,
    invoice: async (id: string, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/portal/invoices/{id}', { params: { path: { id } }, signal })).data,
    contract: async (signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/portal/contract', { signal })).data,
    usage: async (signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/portal/usage', { signal })).data,
    notices: async (signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/portal/notices', { signal })).data,
  };
}

export type PortalApi = ReturnType<typeof createPortalApi>;

/** No valid portal session: expired, link revoked, contract ended over 30 days or occupant left. */
export function isPortalSessionError(error: unknown): boolean {
  return error instanceof ApiSdkError && error.status === 401;
}

/** Too many wrong digits (`portal_link_locked`) or too many attempts (`rate_limit_exceeded`). */
export function isPortalLocked(error: unknown): boolean {
  return error instanceof ApiSdkError && error.status === 429;
}
