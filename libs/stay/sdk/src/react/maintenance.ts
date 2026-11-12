import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createMaintenanceApi, type MaintenanceListQuery } from '../shared/maintenance.js';
import { useStaySdk } from './provider.js';

export function useMaintenance(query?: MaintenanceListQuery) {
  const api = createMaintenanceApi(useStaySdk());

  return useQuery({
    queryKey: ['stay', 'maintenance', 'list', query],
    queryFn: ({ signal }) => api.list(query, signal),
    enabled: Boolean(query?.buildingId),
    placeholderData: keepPreviousData,
  });
}

export function useMaintenanceCategories() {
  const api = createMaintenanceApi(useStaySdk());

  return useQuery({
    queryKey: ['stay', 'maintenance', 'categories'],
    queryFn: ({ signal }) => api.categories(signal),
  });
}

export function useMaintenanceDetail(id: string) {
  const api = createMaintenanceApi(useStaySdk());

  return useQuery({
    queryKey: ['stay', 'maintenance', 'detail', id],
    queryFn: ({ signal }) => api.detail(id, signal),
    enabled: Boolean(id),
  });
}

export function useMaintenanceMutations() {
  const api = createMaintenanceApi(useStaySdk());
  const client = useQueryClient();

  const refresh = () =>
    Promise.all(
      ['maintenance', 'rooms', 'requests', 'expenses', 'reports', 'portal'].map((area) =>
        client.invalidateQueries({ queryKey: ['stay', area] }),
      ),
    );
  const create = useMutation({ mutationFn: api.create, retry: false, onSuccess: refresh });
  const update = useMutation({ mutationFn: api.update, retry: false, onSuccess: refresh });
  const expense = useMutation({ mutationFn: api.expense, retry: false, onSuccess: refresh });

  return { create, update, expense };
}
