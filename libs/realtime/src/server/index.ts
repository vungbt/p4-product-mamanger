import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import * as v from 'valibot';
import {
  type ClientEvents,
  type InterServerEvents,
  type RealtimeEvent,
  realtimeAuthSchema,
  type ServerEvents,
  type SocketData,
} from '../shared/index.js';
export interface RealtimeBackend {
  authenticate(token: string): Promise<{ id: string } | null>;
  replay(userId: string, offset: string): Promise<{ events: RealtimeEvent[]; resync: boolean }>;
  readNotification(userId: string, id: string): Promise<void>;
  subscribe?(userId: string, listener: () => void): () => void;
}
export function createRealtimeServer(
  httpServer: HttpServer,
  backend: RealtimeBackend,
  origins: string[],
) {
  const io = new Server<ClientEvents, ServerEvents, InterServerEvents, SocketData>(httpServer, {
    serveClient: false,
    allowRequest: (request, callback) =>
      callback(null, !request.headers.origin || origins.includes(request.headers.origin)),
    cors: { origin: origins, credentials: true },
    maxHttpBufferSize: 16384,
  });
  io.use((socket, next) => {
    void (async () => {
      const parsed = v.safeParse(realtimeAuthSchema, socket.handshake.auth);
      if (!parsed.success) throw new Error('authentication_required');
      const user = await backend.authenticate(parsed.output.token);
      if (!user) throw new Error('invalid_session');
      socket.data = { userId: user.id, token: parsed.output.token, offset: parsed.output.offset };
      next();
    })().catch(() => next(new Error('authentication_required')));
  });
  const connections = new Map<string, number>();
  io.on('connection', (socket) => {
    const count = connections.get(socket.data.userId) ?? 0;
    if (count >= 5) {
      socket.disconnect(true);
      return;
    }
    connections.set(socket.data.userId, count + 1);
    let reading = false;
    let lastAck = 0;
    const refresh = async () => {
      if (reading || !socket.connected) return;
      reading = true;
      try {
        const user = await backend.authenticate(socket.data.token);
        if (!user || user.id !== socket.data.userId) {
          socket.emit('session:expired');
          socket.disconnect(true);
          return;
        }
        const result = await backend.replay(user.id, socket.data.offset);
        for (const event of result.events) {
          socket.emit('event', event);
          socket.data.offset = event.id;
        }
        if (result.resync) socket.emit('resync');
      } catch {
        socket.emit('resync');
      } finally {
        reading = false;
      }
    };
    const unsubscribe = backend.subscribe?.(socket.data.userId, () => void refresh());
    void refresh();
    const timer = setInterval(() => void refresh(), 2000);
    timer.unref();
    socket.on('notification:read', (payload, ack) => {
      if (Date.now() - lastAck < 250) {
        ack({ ok: false });
        return;
      }
      lastAck = Date.now();
      if (typeof payload?.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(payload.id)) {
        ack({ ok: false });
        return;
      }
      void backend
        .authenticate(socket.data.token)
        .then(async (user) => {
          if (!user || user.id !== socket.data.userId) throw new Error('expired');
          await backend.readNotification(user.id, payload.id);
          ack({ ok: true });
        })
        .catch(() => ack({ ok: false }));
    });
    socket.on('disconnect', () => {
      connections.set(
        socket.data.userId,
        Math.max(0, (connections.get(socket.data.userId) ?? 1) - 1),
      );
      if (!connections.get(socket.data.userId)) connections.delete(socket.data.userId);
      clearInterval(timer);
      unsubscribe?.();
    });
  });
  return io;
}
