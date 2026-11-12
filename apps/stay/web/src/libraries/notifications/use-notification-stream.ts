import type { NotificationStreamEvent } from '@stay/shared';
import { useEffect, useRef, useState } from 'react';

/** Polling while the stream is down, and a slow safety refresh while it is up. */
export const POLL_FALLBACK_MS = 30_000;
export const POLL_CONNECTED_MS = 5 * 60_000;

/**
 * Server-Sent Events of new notifications (same-origin cookie). `onEvent` runs for each new
 * notification, `onReady` on every (re)connect to resynchronise the list. Returns whether the
 * stream is connected: callers poll faster while it is not (EventSource retries by itself).
 */
export function useNotificationStream(
  url: string,
  handlers: { onEvent: (event: NotificationStreamEvent) => void; onReady: () => void },
  enabled = true,
): boolean {
  const [connected, setConnected] = useState(false);
  const latest = useRef(handlers);

  latest.current = handlers;

  useEffect(() => {
    if (!enabled || typeof EventSource === 'undefined') return;
    const source = new EventSource(url, { withCredentials: true });

    source.addEventListener('ready', () => {
      setConnected(true);
      latest.current.onReady();
    });
    source.addEventListener('notification', (message) => {
      try {
        latest.current.onEvent(JSON.parse(message.data));
      } catch {
        latest.current.onReady();
      }
    });
    source.onerror = () => setConnected(false);

    return () => {
      source.close();
      setConnected(false);
    };
  }, [url, enabled]);

  return connected;
}
