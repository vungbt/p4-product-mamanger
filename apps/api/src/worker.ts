import { setTimeout } from 'node:timers/promises';
import { logger } from '@p4/server-core';
import { assertProductionConfig } from '@/configs/production.js';
import { eventHandlers, scheduledContentSweep } from '@/modules/jobs/handlers.js';
import { runNextEvent, sweepExpiredReservations } from '@/modules/jobs/jobs.service.js';
import { sweepProcessFiles } from '@/modules/processes/process-retention.service.js';
import { sequelize } from '@/sequelize/models/index.js';

let stopped = false;
process.on('SIGTERM', () => {
  stopped = true;
});
process.on('SIGINT', () => {
  stopped = true;
});
async function main() {
  assertProductionConfig();
  await sequelize.authenticate();
  let lastSweep = 0;
  try {
    while (!stopped) {
      if (Date.now() - lastSweep >= 30000) {
        try {
          await sequelize.query(
            "INSERT INTO worker_heartbeats (id,last_seen_at) VALUES ('commerce',NOW()) ON CONFLICT(id) DO UPDATE SET last_seen_at=NOW()",
          );
          await sweepExpiredReservations();
          await scheduledContentSweep();
          await sweepProcessFiles();
          lastSweep = Date.now();
        } catch {
          logger.error('[worker] Scheduled sweep failed');
        }
      }
      try {
        if (!(await runNextEvent(eventHandlers))) await setTimeout(1000);
      } catch {
        logger.error('[worker] Event claim failed');
        await setTimeout(1000);
      }
    }
  } finally {
    await sequelize.close();
  }
}
main().catch(() => {
  logger.error('[worker] Startup failed');
  process.exitCode = 1;
});
