import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unwrap } from '../shared/errors.js';
import type { paths } from '../shared/generated.js';
import { useStaySdk } from './provider.js';

export type AutomationSettingsInput =
  paths['/api/buildings/{id}/automation']['put']['requestBody']['content']['application/json'];

export function useAutomationSettings(id: string) {
  const sdk = useStaySdk();

  return useQuery({
    queryKey: ['stay', 'automation', id],
    enabled: Boolean(id),
    queryFn: async ({ signal }) =>
      unwrap(await sdk.GET('/api/buildings/{id}/automation', { params: { path: { id } }, signal }))
        .data,
  });
}

export function useUpdateAutomationSettings(id: string) {
  const sdk = useStaySdk();
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (body: AutomationSettingsInput) =>
      unwrap(await sdk.PUT('/api/buildings/{id}/automation', { params: { path: { id } }, body }))
        .data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['stay', 'automation', id] }),
  });
}

export function useNotifications() {
  const sdk = useStaySdk();

  return useQuery({
    queryKey: ['stay', 'notifications'],
    refetchInterval: 30_000,
    queryFn: async ({ signal }) => unwrap(await sdk.GET('/api/notifications', { signal })).data,
  });
}

export function useMarkNotificationRead() {
  const sdk = useStaySdk();
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) =>
      unwrap(await sdk.POST('/api/notifications/{id}/read', { params: { path: { id } } })).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['stay', 'notifications'] }),
  });
}
