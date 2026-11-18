import type { NotificationSettings } from '@stay/shared';
import { useEffect, useRef } from 'react';
import {
  type BrowserSubscription,
  type PushScope,
  pushPermission,
  rememberPrompt,
  subscribeBrowser,
  wasPrompted,
} from './push';

/**
 * After sign-in: asks for browser notification permission once per browser and scope, without a
 * button. A denial is remembered (never asked again automatically; the settings screen offers
 * re-enabling). When permission was already granted, the browser is re-registered silently.
 */
export function useAutoPush(
  scope: PushScope,
  settings: NotificationSettings | undefined,
  register: (subscription: BrowserSubscription) => Promise<unknown>,
) {
  const done = useRef(false);
  const latest = useRef(register);

  latest.current = register;

  useEffect(() => {
    if (done.current || !settings?.pushPublicKey || !settings.push) return;
    const permission = pushPermission();

    if (permission === 'unsupported' || permission === 'denied') return;
    if (permission === 'default' && wasPrompted(scope)) return;
    done.current = true;
    const publicKey = settings.pushPublicKey;

    void (async () => {
      try {
        // Granted earlier: re-register (idempotent; the browser may now belong to this person).
        const result = await subscribeBrowser(publicKey);

        if (typeof result === 'string') {
          rememberPrompt(scope, result);
          return;
        }
        rememberPrompt(scope, 'granted');
        await latest.current(result);
      } catch {
        // Push service unavailable (e.g. blocked by the browser): in-app notifications still work.
      }
    })();
  }, [scope, settings]);
}
