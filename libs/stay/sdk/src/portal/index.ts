import { createStaySdk, type StaySdk } from '../shared/client.js';
import { ApiSdkError, unwrap } from '../shared/errors.js';
import type { components, operations } from '../shared/generated.js';

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
export type PaymentClaimRequest = components['schemas']['PaymentClaimInput'];
export type PortalMaintenanceRequest = components['schemas']['PortalMaintenanceInput'];
export type TenantRequestRequest = components['schemas']['TenantRequestInput'];
export type PortalUploadPurpose = components['schemas']['PortalUploadInput']['purpose'];
export type PortalSignDocumentRequest =
  operations['post_api_portal_documents_id_sign']['requestBody']['content']['application/json'];

export interface PaymentClaimCommand {
  invoiceId: string;
  body: PaymentClaimRequest;
  /** One key per form; reused when the same submit is retried. */
  idempotencyKey: string;
}

export function createPortalSdk(options: PortalSdkOptions): StaySdk {
  return createStaySdk({ ...options, credentials: 'include' });
}

export function createPortalApi(
  sdk: StaySdk,
  options: { baseUrl?: string; fetch?: typeof globalThis.fetch } = {},
) {
  const send = options.fetch ?? globalThis.fetch;

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
    /** "Tôi đã chuyển khoản": a claim the owner confirms; never a payment by itself. */
    claimPayment: async ({ invoiceId, body, idempotencyKey }: PaymentClaimCommand) =>
      unwrap(
        await sdk.POST('/api/portal/invoices/{id}/payment-claims', {
          params: { path: { id: invoiceId }, header: { 'Idempotency-Key': idempotencyKey } },
          body,
        }),
      ).data,
    cancelClaim: async (id: string) =>
      unwrap(await sdk.POST('/api/portal/payment-claims/{id}/cancel', { params: { path: { id } } }))
        .data,
    maintenance: async (signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/portal/maintenance', { signal })).data,
    createMaintenance: async (body: PortalMaintenanceRequest) =>
      unwrap(await sdk.POST('/api/portal/maintenance', { body })).data,
    cancelMaintenance: async (id: string) =>
      unwrap(await sdk.POST('/api/portal/maintenance/{id}/cancel', { params: { path: { id } } }))
        .data,
    requests: async (signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/portal/requests', { signal })).data,
    createRequest: async (body: TenantRequestRequest) =>
      unwrap(await sdk.POST('/api/portal/requests', { body })).data,
    cancelRequest: async (id: string) =>
      unwrap(await sdk.POST('/api/portal/requests/{id}/cancel', { params: { path: { id } } })).data,
    /** T-13: documents of the contract, the ones waiting for my signature first. */
    documents: async (signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/portal/documents', { signal })).data,
    /** T-12: the body (signers only); the first open records `viewed`. */
    document: async (id: string, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/portal/documents/{id}', { params: { path: { id } }, signal }))
        .data,
    signDocument: async ({ id, body }: { id: string; body: PortalSignDocumentRequest }) =>
      unwrap(await sdk.POST('/api/portal/documents/{id}/sign', { params: { path: { id } }, body }))
        .data,
    rejectDocument: async ({ id, reason }: { id: string; reason: string }) =>
      unwrap(
        await sdk.POST('/api/portal/documents/{id}/reject', {
          params: { path: { id } },
          body: { reason },
        }),
      ).data,
    /**
     * Uploads one private image with a portal ticket (receipt or maintenance photo) and returns
     * the verified file id. The file goes straight to `uploadUrl` without cookies.
     */
    uploadImage: async ({
      purpose,
      file,
    }: {
      purpose: PortalUploadPurpose;
      file: Blob & { name?: string };
    }): Promise<string> => {
      const ticket = unwrap(await sdk.POST('/api/portal/uploads', { body: { purpose } })).data;
      const form = new FormData();

      form.append('file', file, file.name ?? 'image');
      const base = options.baseUrl ?? globalThis.location?.origin ?? 'http://localhost';
      const response = await send(new URL(ticket.uploadUrl, base), {
        method: 'POST',
        body: form,
        credentials: 'omit',
      });

      if (!response.ok)
        throw new ApiSdkError(response.status, await response.json().catch(() => null));
      const completed = unwrap(
        await sdk.POST('/api/portal/uploads/{id}/complete', {
          params: { path: { id: ticket.id } },
        }),
      ).data;

      if (!completed.fileId) throw new Error('The upload was not completed.');
      return completed.fileId;
    },
  };
}

export type PortalApi = ReturnType<typeof createPortalApi>;

/** Same-origin download URL of a completed document's PDF (portal cookie). */
export const portalDocumentPdfPath = (id: string) =>
  `/api/portal/documents/${encodeURIComponent(id)}/pdf`;

/** No valid portal session: expired, link revoked, contract ended over 30 days or occupant left. */
export function isPortalSessionError(error: unknown): boolean {
  return error instanceof ApiSdkError && error.status === 401;
}

/** Too many wrong digits (`portal_link_locked`) or too many attempts (`rate_limit_exceeded`). */
export function isPortalLocked(error: unknown): boolean {
  return error instanceof ApiSdkError && error.status === 429;
}
