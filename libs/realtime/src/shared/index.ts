import type { ProcessSnapshot } from '@p4/processes/shared';
import type { Notification } from '@p4/shared';
import * as v from 'valibot';
export const realtimeAuthSchema = v.object({
  token: v.pipe(v.string(), v.minLength(1), v.maxLength(8192)),
  offset: v.optional(
    v.pipe(
      v.string(),
      v.regex(/^\d{1,19}$/),
      v.check((value) => /^\d{1,19}$/.test(value) && BigInt(value) <= 9223372036854775807n),
    ),
    '0',
  ),
});
export type RealtimeEvent = {
  id: string;
  createdAt: string;
  payload:
    | { type: 'process.updated'; process: ProcessSnapshot }
    | { type: 'notification.created'; notification: Notification }
    | { type: 'notification.read'; id: string | null };
};
export interface ServerEvents {
  event: (event: RealtimeEvent) => void;
  resync: () => void;
  'session:expired': () => void;
}
export interface ClientEvents {
  'notification:read': (payload: { id: string }, ack: (result: { ok: boolean }) => void) => void;
}
export interface InterServerEvents {
  ping: () => void;
}
export interface SocketData {
  userId: string;
  token: string;
  offset: string;
}
export const REALTIME_CHANNEL = 'p4_realtime';
