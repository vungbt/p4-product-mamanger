import { useCallback, useEffect, useState } from 'react';
import type { ProcessApi, ProcessSnapshot } from '../shared/index.js';
import { isTerminalProcess } from '../shared/index.js';

export type { ProcessApi, ProcessIssue, ProcessSnapshot, ProcessState } from '../shared/index.js';

export interface ProcessEvents {
  subscribe(listener: (process: ProcessSnapshot) => void): () => void;
}
export function useProcess({
  id,
  api,
  events,
  pollInterval = 2000,
}: {
  id: string | null;
  api: ProcessApi;
  events?: ProcessEvents;
  pollInterval?: number;
}) {
  const [process, setProcess] = useState<ProcessSnapshot | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [refreshVersion, requestRefresh] = useState(0);
  const refresh = useCallback(() => requestRefresh((version) => version + 1), []);
  useEffect(() => {
    setProcess(null);
    setError(null);
    if (!id) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const update = (next: ProcessSnapshot) => {
      if (active && next.id === id)
        setProcess((previous) => (!previous || next.version >= previous.version ? next : previous));
    };
    const unsubscribe = events?.subscribe(update);
    const poll = async () => {
      try {
        const next = await api.getProcess(id, controller.signal);
        if (!active) return;
        update(next);
        setError(null);
        if (!isTerminalProcess(next.state))
          timer = setTimeout(() => void poll(), Math.max(1000, pollInterval));
      } catch (reason) {
        if (active) {
          setError(reason instanceof Error ? reason : new Error('process_unavailable'));
          timer = setTimeout(() => void poll(), Math.max(2000, pollInterval));
        }
      }
    };
    void poll();
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
      unsubscribe?.();
    };
  }, [id, api, events, pollInterval, refreshVersion]);
  return { process, error, refresh, pending: !!id && !process && !error };
}

export { createProcessApi, ProcessApiError } from './client.js';
