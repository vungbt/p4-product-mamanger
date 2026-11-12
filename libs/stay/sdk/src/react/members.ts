import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createMemberApi, type MemberListQuery } from '../shared/members.js';
import { useStaySdk } from './provider.js';

const memberKeys = ['stay', 'members'] as const;

export function useMembers(query?: MemberListQuery) {
  const api = createMemberApi(useStaySdk());

  return useQuery({
    queryKey: [...memberKeys, query ?? {}],
    queryFn: ({ signal }) => api.list(query, signal),
    placeholderData: keepPreviousData,
  });
}

export function useMemberMutations() {
  const api = createMemberApi(useStaySdk());
  const client = useQueryClient();

  const refresh = () => client.invalidateQueries({ queryKey: memberKeys });

  const invite = useMutation({ mutationFn: api.invite, onSuccess: refresh, retry: false });
  const update = useMutation({ mutationFn: api.update, onSuccess: refresh, retry: false });
  const disable = useMutation({ mutationFn: api.disable, onSuccess: refresh, retry: false });

  return { invite, update, disable };
}
