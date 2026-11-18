import {
  keepPreviousData,
  mutationOptions,
  type QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { type AnnouncementListQuery, createAnnouncementApi } from '../shared/announcements.js';
import type { StaySdk } from '../shared/client.js';
import { useStaySdk } from './provider.js';

export const announcementKeys = {
  all: ['stay', 'announcements'] as const,
  list: (query?: AnnouncementListQuery) => ['stay', 'announcements', 'list', query ?? {}] as const,
};

export function announcementQueryOptions(sdk: StaySdk) {
  const api = createAnnouncementApi(sdk);

  return {
    list: (query?: AnnouncementListQuery) =>
      queryOptions({
        queryKey: announcementKeys.list(query),
        queryFn: ({ signal }) => api.list(query, signal),
        enabled: Boolean(query?.buildingId),
        placeholderData: keepPreviousData,
      }),
  };
}

export function announcementMutationOptions(sdk: StaySdk, client: QueryClient) {
  const api = createAnnouncementApi(sdk);
  const refresh = () => client.invalidateQueries({ queryKey: announcementKeys.all });

  return {
    create: () => mutationOptions({ mutationFn: api.create, retry: false, onSuccess: refresh }),
    update: () => mutationOptions({ mutationFn: api.update, retry: false, onSuccess: refresh }),
    archive: () => mutationOptions({ mutationFn: api.archive, retry: false, onSuccess: refresh }),
    remove: () => mutationOptions({ mutationFn: api.remove, retry: false, onSuccess: refresh }),
  };
}

export function useAnnouncements(query?: AnnouncementListQuery) {
  return useQuery(announcementQueryOptions(useStaySdk()).list(query));
}

function useAnnouncementMutations() {
  return announcementMutationOptions(useStaySdk(), useQueryClient());
}

export function useCreateAnnouncement() {
  return useMutation(useAnnouncementMutations().create());
}
export function useUpdateAnnouncement() {
  return useMutation(useAnnouncementMutations().update());
}
export function useArchiveAnnouncement() {
  return useMutation(useAnnouncementMutations().archive());
}
export function useDeleteAnnouncement() {
  return useMutation(useAnnouncementMutations().remove());
}
