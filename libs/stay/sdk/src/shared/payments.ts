import type { StaySdk } from './client.js';
import { unwrap } from './errors.js';
import type { components, paths } from './generated.js';

export type PaymentListQuery = NonNullable<paths['/api/payments']['get']['parameters']['query']>;
export type PaymentCreateInput = components['schemas']['PaymentInput'];
export type PaymentReverseRequest = components['schemas']['PaymentReverseInput'];

export interface PaymentCreateCommand {
  invoiceId: string;
  body: PaymentCreateInput;
  /** Required: one fresh key per "Thu tiền" dialog, reused when the same submit is retried. */
  idempotencyKey: string;
}

export function createPaymentApi(sdk: StaySdk) {
  return {
    list: async (query?: PaymentListQuery, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/payments', { params: { query }, signal })),
    create: async ({ invoiceId, body, idempotencyKey }: PaymentCreateCommand) =>
      unwrap(
        await sdk.POST('/api/invoices/{id}/payments', {
          params: { path: { id: invoiceId }, header: { 'Idempotency-Key': idempotencyKey } },
          body,
        }),
      ).data,
    reverse: async ({ id, body }: { id: string; body: PaymentReverseRequest }) =>
      unwrap(await sdk.POST('/api/payments/{id}/reverse', { params: { path: { id } }, body })).data,
  };
}
