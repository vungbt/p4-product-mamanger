import { setTimeout } from 'node:timers/promises';
import { logger } from '@p4/server-core';
import { assertProductionConfig } from '@/configs/production.js';
import { deliverAutomationMail, runAutomations } from '@/modules/automation/automation.jobs.js';
import { deliverNotifications } from '@/modules/notifications/notifications.delivery.js';
import { configuredTransports } from '@/modules/notifications/notifications.transports.js';
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
  // Disabled channels (no SMTP host / VAPID keys) are never queued.
  const transports = configuredTransports();

  try {
    while (!stopped) {
      try {
        if (Date.now() - lastSweep >= 30_000) {
          await runAutomations(new Date());
          lastSweep = Date.now();
        }
        const legacy = await deliverAutomationMail(new Date());
        const delivered = await deliverNotifications(new Date(), transports);

        if (!legacy && !delivered) await setTimeout(1000);
      } catch {
        logger.error('[stay-worker] Automation sweep/delivery failed');
        await setTimeout(1000);
      }
    }
  } finally {
    await sequelize.close();
  }
}

main().catch(() => {
  logger.error('[stay-worker] Startup failed');
  process.exitCode = 1;
});
