import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unwrap } from '../shared/errors.js';
import type { components } from '../shared/generated.js';
import { portalKeys, usePortalSdk } from './portal.js';
import { useStaySdk } from './provider.js';

export type NotificationPreferencesInput = components['schemas']['NotificationPreferences'];
export type PushSubscriptionBody = components['schemas']['PushSubscriptionInput'];

/** Server-Sent Events URLs (same origin; EventSource sends the session cookie). */
export const NOTIFICATION_STREAMS = {
  staff: '/api/notifications/stream',
  portal: '/api/portal/notifications/stream',
} as const;

export const notificationKeys = {
  list: () => ['stay', 'notifications'] as const,
  settings: () => ['stay', 'notification-settings'] as const,
  portalList: () => [...portalKeys.all, 'notifications'] as const,
  portalSettings: () => [...portalKeys.all, 'notification-settings'] as const,
};

/* Staff -------------------------------------------------------------------- */

export function useNotificationSettings(options: { enabled?: boolean } = {}) {
  const sdk = useStaySdk();

  return useQuery({
    queryKey: notificationKeys.settings(),
    enabled: options.enabled ?? true,
    queryFn: async ({ signal }) =>
      unwrap(await sdk.GET('/api/me/notification-settings', { signal })).data,
  });
}

export function useUpdateNotificationSettings() {
  const sdk = useStaySdk();
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (body: NotificationPreferencesInput) =>
      unwrap(await sdk.PUT('/api/me/notification-settings', { body })).data,
    onSuccess: (data) => client.setQueryData(notificationKeys.settings(), data),
  });
}

export function usePushSubscription() {
  const sdk = useStaySdk();
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: notificationKeys.settings() });

  return {
    subscribe: useMutation({
      mutationFn: async (body: PushSubscriptionBody) =>
        unwrap(await sdk.POST('/api/me/push-subscriptions', { body })).data,
      onSuccess: refresh,
    }),
    unsubscribe: useMutation({
      mutationFn: async (endpoint: string) =>
        unwrap(await sdk.DELETE('/api/me/push-subscriptions', { body: { endpoint } })).data,
      onSuccess: refresh,
    }),
  };
}

/* Tenant portal ------------------------------------------------------------ */

export function usePortalNotifications(options: { refetchInterval?: number | false } = {}) {
  const sdk = usePortalSdk();

  return useQuery({
    queryKey: notificationKeys.portalList(),
    refetchInterval: options.refetchInterval ?? 30_000,
    queryFn: async ({ signal }) =>
      unwrap(await sdk.GET('/api/portal/notifications', { signal })).data,
  });
}

export function useMarkPortalNotificationRead() {
  const sdk = usePortalSdk();
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) =>
      unwrap(await sdk.POST('/api/portal/notifications/{id}/read', { params: { path: { id } } }))
        .data,
    onSuccess: () => client.invalidateQueries({ queryKey: notificationKeys.portalList() }),
  });
}

export function usePortalNotificationSettings() {
  const sdk = usePortalSdk();

  return useQuery({
    queryKey: notificationKeys.portalSettings(),
    queryFn: async ({ signal }) =>
      unwrap(await sdk.GET('/api/portal/notification-settings', { signal })).data,
  });
}

export function useUpdatePortalNotificationSettings() {
  const sdk = usePortalSdk();
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (body: NotificationPreferencesInput) =>
      unwrap(await sdk.PUT('/api/portal/notification-settings', { body })).data,
    onSuccess: (data) => client.setQueryData(notificationKeys.portalSettings(), data),
  });
}

export function usePortalPushSubscription() {
  const sdk = usePortalSdk();
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: notificationKeys.portalSettings() });

  return {
    subscribe: useMutation({
      mutationFn: async (body: PushSubscriptionBody) =>
        unwrap(await sdk.POST('/api/portal/push-subscriptions', { body })).data,
      onSuccess: refresh,
    }),
    unsubscribe: useMutation({
      mutationFn: async (endpoint: string) =>
        unwrap(await sdk.DELETE('/api/portal/push-subscriptions', { body: { endpoint } })).data,
      onSuccess: refresh,
    }),
  };
}
