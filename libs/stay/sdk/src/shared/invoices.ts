import type { StaySdk } from './client.js';
import { unwrap } from './errors.js';
import type { components, paths } from './generated.js';

export type InvoiceListQuery = NonNullable<paths['/api/invoices']['get']['parameters']['query']>;
export type InvoiceLineCreateInput = components['schemas']['InvoiceLineInput'];
export type InvoiceIssueRequest = components['schemas']['InvoiceIssueInput'];
export type InvoiceVoidRequest = components['schemas']['InvoiceVoidInput'];

export interface BillingDraftsCommand {
  buildingId: string;
  period: string;
  /** Required; reuse the same key when retrying the same run. */
  idempotencyKey: string;
}

export interface PeriodSharesCommand {
  buildingId: string;
  period: string;
  /** Required; reuse the same key when retrying the same click (returns the same links). */
  idempotencyKey: string;
}

export function createInvoiceApi(sdk: StaySdk) {
  return {
    list: async (query?: InvoiceListQuery, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/invoices', { params: { query }, signal })),
    detail: async (id: string, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/invoices/{id}', { params: { path: { id } }, signal })).data,
    preview: async (buildingId: string, period: string, signal?: AbortSignal) =>
      unwrap(
        await sdk.GET('/api/buildings/{buildingId}/billing/{period}/preview', {
          params: { path: { buildingId, period } },
          signal,
        }),
      ).data,
    createDrafts: async ({ buildingId, period, idempotencyKey }: BillingDraftsCommand) =>
      unwrap(
        await sdk.POST('/api/buildings/{buildingId}/billing/{period}/drafts', {
          params: {
            path: { buildingId, period },
            header: { 'Idempotency-Key': idempotencyKey },
          },
        }),
      ).data,
    addLine: async ({ id, body }: { id: string; body: InvoiceLineCreateInput }) =>
      unwrap(await sdk.POST('/api/invoices/{id}/lines', { params: { path: { id } }, body })).data,
    deleteLine: async ({ id, lineId }: { id: string; lineId: string }) =>
      unwrap(
        await sdk.DELETE('/api/invoices/{id}/lines/{lineId}', {
          params: { path: { id, lineId } },
        }),
      ).data,
    issue: async (body: InvoiceIssueRequest) =>
      unwrap(await sdk.POST('/api/invoices/issue', { body })).data,
    void: async ({ id, body }: { id: string; body: InvoiceVoidRequest }) =>
      unwrap(await sdk.POST('/api/invoices/{id}/void', { params: { path: { id } }, body })).data,
    share: async (id: string) =>
      unwrap(await sdk.POST('/api/invoices/{id}/share', { params: { path: { id } } })).data,
    revokeShare: async (id: string) =>
      unwrap(await sdk.DELETE('/api/invoices/{id}/share', { params: { path: { id } } })).data,
    sharePeriod: async ({ buildingId, period, idempotencyKey }: PeriodSharesCommand) =>
      unwrap(
        await sdk.POST('/api/buildings/{buildingId}/billing/{period}/shares', {
          params: {
            path: { buildingId, period },
            header: { 'Idempotency-Key': idempotencyKey },
          },
        }),
      ).data,
    /** ST-16 public invoice: no session needed, cookies are never sent. */
    publicInvoice: async (token: string, signal?: AbortSignal) =>
      unwrap(
        await sdk.GET('/api/public/invoices/{token}', {
          params: { path: { token } },
          credentials: 'omit',
          signal,
        }),
      ).data,
    createMoveIn: async (contractId: string) =>
      unwrap(
        await sdk.POST('/api/contracts/{id}/move-in-invoice', {
          params: { path: { id: contractId } },
        }),
      ).data,
  };
}
