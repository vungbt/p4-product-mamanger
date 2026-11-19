'use client';

import { useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../shared/errors.js';
import {
  createUploadApi,
  type UploadSession,
  type UploadTicket,
  type VerifiedUpload,
} from '../shared/uploads.js';
import { useApiSdk } from './provider.js';

export type UploadItem = {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'verifying' | 'completed' | 'error';
  error?: string;
  result?: VerifiedUpload;
};

/** Each file keeps its ticket across retries; only server-verified results escape this hook. */
export function useTicketUpload({
  purpose,
  resourceId,
  mode = 'single',
  failureMessage,
}: {
  purpose: UploadTicket['purpose'];
  resourceId?: string;
  mode?: 'single' | 'batch';
  failureMessage: string;
}) {
  const sdk = useApiSdk();

  const api = createUploadApi(sdk, { baseUrl: sdk.baseUrl });

  const [items, setItems] = useState<UploadItem[]>([]);

  const transfers = useRef(new Map<string, UploadSession>());

  const previews = useRef(new Map<string, string>());

  const active = useRef(new Set<string>());

  const batches = useRef(new Set<AbortController>());

  useEffect(
    () => () => {
      for (const batch of batches.current) batch.abort();
      for (const transfer of transfers.current.values()) transfer.controller.abort();
      for (const preview of previews.current.values()) URL.revokeObjectURL(preview);
      transfers.current.clear();
      previews.current.clear();
    },
    [],
  );

  const patch = (id: string, change: Partial<UploadItem>) => {
    if (!previews.current.has(id)) return;
    setItems((previous) =>
      previous.map((item) => (item.id === id ? { ...item, ...change } : item)),
    );
  };

  const run = async (item: UploadItem) => {
    if (!previews.current.has(item.id) || active.current.has(item.id) || item.result) return;
    active.current.add(item.id);
    const session = transfers.current.get(item.id) ?? {
      sent: false,
      attempted: false,
      controller: new AbortController(),
    };
    transfers.current.set(item.id, session);
    patch(item.id, { status: 'uploading', error: undefined });

    try {
      const result = await api.uploadFile({
        file: item.file,
        purpose,
        resourceId,
        session,
        failureMessage,
        onProgress: (progress) => patch(item.id, { progress }),
        onVerifying: () => patch(item.id, { status: 'verifying', progress: 100 }),
      });
      patch(item.id, { status: 'completed', progress: 100, result });
    } catch (error) {
      patch(item.id, { status: 'error', error: getErrorMessage(error, failureMessage) });
    } finally {
      active.current.delete(item.id);
    }
  };

  const runBatch = async (next: UploadItem[]) => {
    const controller = new AbortController();
    batches.current.add(controller);
    const sessions = next.map((item) => {
      const session: UploadSession = {
        sent: false,
        attempted: false,
        controller: new AbortController(),
      };
      transfers.current.set(item.id, session);
      active.current.add(item.id);
      patch(item.id, { status: 'uploading', error: undefined });
      return session;
    });
    try {
      const batch = await api.uploadFiles(
        next.map((item) => item.file),
        {
          purpose,
          resourceId,
          sessions,
          signal: controller.signal,
          onProgress: (index, progress) => {
            const item = next[index];
            if (item) patch(item.id, { progress });
          },
          onVerifying: (index) => {
            const item = next[index];
            if (item) patch(item.id, { status: 'verifying', progress: 100 });
          },
        },
      );
      const results = await api.verifyBatch(batch, { signal: controller.signal });
      results.forEach((result, index) => {
        const item = next[index];
        const session = sessions[index];
        if (!item || !session || session.controller.signal.aborted) return;
        if (result.status === 'fulfilled') {
          session.result = result.value;
          patch(item.id, { status: 'completed', progress: 100, result: result.value });
        } else
          patch(item.id, {
            status: 'error',
            error: getErrorMessage(result.reason, failureMessage),
          });
      });
    } catch (error) {
      for (const item of next)
        patch(item.id, { status: 'error', error: getErrorMessage(error, failureMessage) });
    } finally {
      for (const item of next) active.current.delete(item.id);
      batches.current.delete(controller);
    }
  };

  const add = (files: readonly File[]) => {
    const next = files.map((file): UploadItem => {
      const id = crypto.randomUUID();
      const preview = URL.createObjectURL(file);
      previews.current.set(id, preview);
      return { id, file, preview, status: 'pending', progress: 0 };
    });
    setItems((previous) => [...previous, ...next]);
    if (!next.length) return;
    if (mode === 'batch') void runBatch(next);
    else for (const item of next) void run(item);
  };

  const remove = (id: string) => {
    transfers.current.get(id)?.controller.abort();
    transfers.current.delete(id);
    const preview = previews.current.get(id);
    if (preview) URL.revokeObjectURL(preview);
    previews.current.delete(id);
    setItems((previous) => previous.filter((item) => item.id !== id));
  };

  return {
    items,
    add,
    remove,
    retry: run,
    clear: () => {
      for (const id of previews.current.keys()) remove(id);
    },
    busy: items.some((item) => ['pending', 'uploading', 'verifying'].includes(item.status)),
    results: items.flatMap((item) => (item.result ? [item.result] : [])),
  };
}
