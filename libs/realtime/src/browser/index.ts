import { io, type Socket } from 'socket.io-client';
import type { ClientEvents, RealtimeEvent, ServerEvents } from '../shared/index.js';

export type { RealtimeEvent } from '../shared/index.js';
export function createRealtimeClient({
  url,
  getToken,
  onEvent,
  onResync,
  onSessionExpired,
}: {
  url?: string;
  getToken: () => string | null;
  onEvent: (event: RealtimeEvent) => void;
  onResync: () => void;
  onSessionExpired?: () => void;
}) {
  let offset = '0';
  let lastToken: string | null = null;
  const socket: Socket<ServerEvents, ClientEvents> = io(url, {
    autoConnect: false,
    auth: (done) => {
      const token = getToken();
      if (token !== lastToken) {
        offset = '0';
        lastToken = token;
      }
      done({ token, offset });
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });
  socket.on('event', (event) => {
    if (!/^\d+$/.test(event.id)) return;
    if (BigInt(event.id) <= BigInt(offset)) return;
    onEvent(event);
    offset = event.id;
  });
  socket.on('resync', onResync);
  socket.on('session:expired', () => {
    socket.disconnect();
    onSessionExpired?.();
  });
  return {
    socket,
    connect: () => {
      if (getToken()) socket.connect();
    },
    disconnect: () => socket.disconnect(),
    reset: () => {
      offset = '0';
      socket.disconnect();
      if (getToken()) socket.connect();
    },
  };
}
