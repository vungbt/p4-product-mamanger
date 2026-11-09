import { EventEmitter } from 'node:events';
import type { Server as HttpServer } from 'node:http';
import { createRealtimeServer } from '@p4/realtime/server';
import { REALTIME_CHANNEL, type RealtimeEvent } from '@p4/realtime/shared';
import { NotFound } from '@p4/server-core';
import pg from 'pg';
import { Op, type Transaction } from 'sequelize';
import { env } from '@/configs/env.js';
import { NotificationModel, RealtimeEventModel, sequelize } from '@/sequelize/models/index.js';
import { auditedTransaction } from '@/shared/audit/audited-command.js';
import { findUserByToken } from '../auth/auth.service.js';

export async function publishRealtime(
  userId: string,
  payload: RealtimeEvent['payload'],
  dedupeKey: string,
  transaction: Transaction,
) {
  // Serialize each user's inserts through commit so sequence cursors cannot skip a later-committing lower ID.
  await sequelize.query('SELECT pg_advisory_xact_lock(hashtext(:key))', {
    replacements: { key: `realtime:${userId}` },
    transaction,
  });
  const [row] = await RealtimeEventModel.findOrCreate({
    where: { dedupeKey },
    defaults: { userId, payload, dedupeKey },
    transaction,
  });
  await sequelize.query('SELECT pg_notify(:channel,:userId)', {
    replacements: { channel: REALTIME_CHANNEL, userId },
    transaction,
  });
  return row;
}
export async function replayRealtime(userId: string, offset: string) {
  const rows = await RealtimeEventModel.findAll({
    where: { userId, id: { [Op.gt]: offset } },
    order: [['id', 'ASC']],
    limit: 101,
  });
  return {
    events: rows.slice(0, 100).map(
      (row): RealtimeEvent => ({
        id: row.id,
        payload: row.payload,
        createdAt: row.createdAt.toISOString(),
      }),
    ),
    resync: rows.length > 100,
  };
}
export async function markNotificationRead(userId: string, id: string) {
  await auditedTransaction(async (transaction) => {
    const row = await NotificationModel.findOne({
      where: { id, userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!row) throw new NotFound();
    if (row.readAt) return;
    await row.update({ readAt: new Date() }, { transaction });
    await publishRealtime(
      userId,
      { type: 'notification.read', id },
      `notification-read:${id}`,
      transaction,
    );
  });
}
export async function attachRealtime(server: HttpServer) {
  const bus = new EventEmitter();
  bus.setMaxListeners(0);
  let client: pg.Client | null = null;
  let stopped = false;
  let reconnect: ReturnType<typeof setTimeout> | undefined;
  const connect = async () => {
    if (stopped) return;
    const connection = new pg.Client({
      host: env.database.host,
      port: env.database.port,
      user: env.database.username,
      password: env.database.password,
      database: env.database.name,
      connectionTimeoutMillis: 5000,
    });
    client = connection;
    const retry = () => {
      if (stopped || reconnect) return;
      reconnect = setTimeout(() => {
        reconnect = undefined;
        void connect();
      }, 2000);
      reconnect.unref();
    };
    connection.on('error', () => {
      void connection.end().catch(() => {});
      retry();
    });
    connection.on('end', retry);
    connection.on('notification', (message) => {
      if (
        message.channel === REALTIME_CHANNEL &&
        typeof message.payload === 'string' &&
        /^[a-f0-9-]{36}$/i.test(message.payload)
      )
        bus.emit(message.payload);
    });
    try {
      await connection.connect();
      if (stopped) {
        await connection.end();
        return;
      }
      await connection.query(`LISTEN ${REALTIME_CHANNEL}`);
    } catch {
      void connection.end().catch(() => {});
      retry();
    }
  };
  await connect();
  const io = createRealtimeServer(
    server,
    {
      authenticate: async (token) => {
        try {
          return (await findUserByToken(token)) ?? null;
        } catch {
          return null;
        }
      },
      replay: replayRealtime,
      readNotification: markNotificationRead,
      subscribe: (userId, listener) => {
        bus.on(userId, listener);
        return () => {
          bus.off(userId, listener);
        };
      },
    },
    Array.isArray(env.corsOrigin) ? env.corsOrigin : ['http://localhost:5173'],
  );
  return {
    io,
    close: async () => {
      stopped = true;
      clearTimeout(reconnect);
      await client?.end().catch(() => {});
      await new Promise<void>((resolve) => io.close(() => resolve()));
    },
  };
}
