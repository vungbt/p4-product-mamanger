import { setTimeout } from 'node:timers/promises';
import { logger } from '@p4/server-core';
import { deliverAutomationMail, runAutomations } from '@/modules/automation/automation.jobs.js';
import { deliverMemberInvitation } from '@/modules/members/members.jobs.js';
import { deliverNotifications } from '@/modules/notifications/notifications.delivery.js';
import { configuredTransports } from '@/modules/notifications/notifications.transports.js';

const SWEEP_MS = 30_000;
const IDLE_MS = 1000;

/**
 * Automation sweep and outbox delivery (email, push, invitations) until `signal` aborts.
 * Runs in `worker.ts` (own process) or inside the API when `STAY_INLINE_WORKER=true`, which saves
 * a Node process on small servers. Rows are claimed with skip-locked leases, so several loops
 * never deliver the same event twice.
 */
export async function runWorkerLoop(signal: AbortSignal) {
  // Disabled channels (no SMTP host / VAPID keys) are never queued.
  const transports = configuredTransports();
  let lastSweep = 0;

  while (!signal.aborted) {
    try {
      if (Date.now() - lastSweep >= SWEEP_MS) {
        await runAutomations(new Date());
        lastSweep = Date.now();
      }

      const invited = await deliverMemberInvitation(new Date());
      const legacy = await deliverAutomationMail(new Date());
      const delivered = await deliverNotifications(new Date(), transports);

      if (!invited && !legacy && !delivered) await idle(signal);
    } catch {
      logger.error('[stay-worker] Automation sweep/delivery failed');
      await idle(signal);
    }
  }
}

async function idle(signal: AbortSignal) {
  try {
    await setTimeout(IDLE_MS, undefined, { signal });
  } catch {
    // Aborted: the loop condition ends it.
  }
}
