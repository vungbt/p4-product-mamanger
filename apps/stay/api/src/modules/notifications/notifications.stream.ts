/**
 * Server-Sent Events of new notifications. One Postgres connection per API process LISTENs on
 * `stay_notifications` (woken by `pg_notify` at commit, also for rows the worker creates) and
 * fans the ids out to the open streams whose scope matches. Streams last at most 10 minutes; the
 * browser's EventSource reconnects, which re-checks the session and the building scope.
 */
import { logger } from '@p4/server-core';
import type { NotificationStreamEvent } from '@stay/shared';
import type { Request, RequestHandler, Response } from 'express';
import pg from 'pg';
import { QueryTypes } from 'sequelize';
import { env } from '@/configs/env.js';
import { sequelize } from '@/sequelize/models/index.js';
import { NOTIFICATION_CHANNEL, type StreamSignal } from './notifications.publish.js';

const HEARTBEAT_MS = 25_000;
const MAX_STREAM_MS = 10 * 60_000;

type Listener = (signal: StreamSignal) => void;

const listeners = new Set<Listener>();
/** Open responses, ended on shutdown so `server.close()` can finish. */
const streams = new Set<Response>();
let connection: pg.Client | null = null;
let connecting: Promise<void> | null = null;
let reconnect: ReturnType<typeof setTimeout> | undefined;

function isSignal(value: unknown): value is StreamSignal {
  if (!value || typeof value !== 'object') return false;
  const signal: Partial<Record<keyof StreamSignal, unknown>> = value;

  return (
    typeof signal.id === 'string' &&
    (signal.audience === 'staff' || signal.audience === 'tenant') &&
    typeof signal.buildingId === 'string'
  );
}

function scheduleReconnect() {
  connection = null;
  if (reconnect || !listeners.size) return;
  reconnect = setTimeout(() => {
    reconnect = undefined;
    void listen();
  }, 2000);
  reconnect.unref();
}

/** Opens the LISTEN connection once (lazily, on the first stream); retries every 2 s. */
function listen(): Promise<void> {
  if (connection) return Promise.resolve();
  connecting ??= (async () => {
    const client = new pg.Client({
      host: env.database.host,
      port: env.database.port,
      user: env.database.username,
      password: env.database.password,
      database: env.database.name,
      connectionTimeoutMillis: 5000,
    });

    client.on('error', () => {
      void client.end().catch(() => {});
      scheduleReconnect();
    });
    client.on('end', scheduleReconnect);
    client.on('notification', (message) => {
      if (message.channel !== NOTIFICATION_CHANNEL || !message.payload) return;
      let signal: unknown;

      try {
        signal = JSON.parse(message.payload);
      } catch {
        return;
      }
      if (isSignal(signal)) for (const listener of listeners) listener(signal);
    });
    try {
      await client.connect();
      await client.query(`LISTEN ${NOTIFICATION_CHANNEL}`);
      connection = client;
    } catch {
      logger.error('[stay-api] Notification listener unavailable');
      void client.end().catch(() => {});
      scheduleReconnect();
    }
  })().finally(() => {
    connecting = null;
  });
  return connecting;
}

/** Ends the open streams and stops listening (API shutdown). */
export async function closeNotificationListener() {
  for (const stream of streams) stream.end();
  streams.clear();
  listeners.clear();
  clearTimeout(reconnect);
  const client = connection;

  connection = null;
  await client?.end().catch(() => {});
}

/** One query per notification even with many open streams. */
const pending = new Map<string, Promise<NotificationStreamEvent | null>>();

function loadEvent(id: string): Promise<NotificationStreamEvent | null> {
  let load = pending.get(id);

  if (!load) {
    load = sequelize
      .query<NotificationStreamEvent>(
        `SELECT id,kind,title,body,path,
        to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt"
        FROM notifications WHERE id=:id`,
        { replacements: { id }, type: QueryTypes.SELECT },
      )
      .then((rows) => rows[0] ?? null)
      .catch(() => null);
    pending.set(id, load);
    setTimeout(() => pending.delete(id), 5000).unref();
  }
  return load;
}

/**
 * Opens an SSE response. `matches` decides, per signal, whether this stream may see the
 * notification (computed from the session at connect time).
 */
export function openStream(
  req: Request,
  res: Response,
  matches: (signal: StreamSignal) => boolean,
) {
  res.status(200);
  res.set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    // `no-transform`: compression() skips the stream, proxies do not buffer it.
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write('retry: 5000\n\nevent: ready\ndata: {}\n\n');

  const listener: Listener = (signal) => {
    if (!matches(signal)) return;
    void loadEvent(signal.id).then((event) => {
      if (event && !res.writableEnded)
        res.write(`id: ${event.id}\nevent: notification\ndata: ${JSON.stringify(event)}\n\n`);
    });
  };
  const heartbeat = setInterval(() => res.write(': ping\n\n'), HEARTBEAT_MS);
  const lifetime = setTimeout(() => res.end(), MAX_STREAM_MS);
  const close = () => {
    clearInterval(heartbeat);
    clearTimeout(lifetime);
    listeners.delete(listener);
    streams.delete(res);
  };

  heartbeat.unref();
  lifetime.unref();
  listeners.add(listener);
  streams.add(res);
  req.on('close', close);
  res.on('close', close);
  void listen();
}

/** Express handler wrapper: errors before the stream opens go to the error middleware. */
export function streamHandler(
  scope: (req: Request) => (signal: StreamSignal) => boolean,
): RequestHandler {
  return (req, res, next) => {
    try {
      openStream(req, res, scope(req));
    } catch (error) {
      next(error);
    }
  };
}
