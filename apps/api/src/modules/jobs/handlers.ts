import { publishScheduledContent } from '../content/content.service.js';
import { finishExchanges } from '../exchanges/exchanges.service.js';
import { deleteStoredFile } from '../files/files.service.js';
import {
  accountEmail,
  authEmail,
  inventoryNotification,
  orderNotification,
  refundNotification,
  supportNotification,
} from '../notifications/notifications.service.js';
import { provisionCheckout } from '../payments/payment-attempts.service.js';
import { runProcess } from '../processes/process-worker.service.js';
import { processRefund } from '../refunds/refund-processing.service.js';
import { generateExport } from '../reports/reports.service.js';
import type { EventHandler, EventHandlers } from './jobs.service.js';

const handlers = new Map<string, EventHandler>([
  ['process.requested', runProcess],
  ['report.export_requested', generateExport],
  ['exchange.replacement_created', async () => {}],
  ['support.message', supportNotification],
  ['account.mail_requested', accountEmail],
  ['auth.mail_requested', authEmail],
  ['file.delete_requested', deleteStoredFile],
  ['inventory.changed', inventoryNotification],
  ['payment.checkout_requested', provisionCheckout],
  ['refund.requested', processRefund],
  ['refund.succeeded', refundNotification],
  ['refund.failed', refundNotification],
]);
for (const type of [
  'order.placed',
  'order.confirmed',
  'order.processing',
  'order.completed',
  'order.expired',
  'order.payment_received',
  'order.cancellation_requested',
  'order.cancellation_approved',
  'order.cancellation_rejected',
  'order.return_requested',
  'order.return_approved',
  'order.return_rejected',
  'order.return_in_transit',
  'order.return_received',
  'order.return_inspected',
  'order.return_completed',
  'order.shipment_created',
  'order.shipment_packed',
  'order.shipment_ready_for_pickup',
  'order.shipment_in_transit',
  'order.shipment_out_for_delivery',
  'order.shipment_delivered',
  'order.shipment_delivery_failed',
  'order.shipment_returned',
  'order.shipment_lost',
  'order.shipment_cancelled',
])
  handlers.set(type, orderNotification);
// These events currently have no external subscriber; their durable audit remains in the outbox.
for (const type of [
  'product.publication_changed',
  'content.published',
  'content.scheduled',
  'content.archived',
])
  handlers.set(type, async () => {});
export const eventHandlers: EventHandlers = handlers;
export async function scheduledContentSweep() {
  await publishScheduledContent();
  await finishExchanges();
}
