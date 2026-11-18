import type { StaySdk } from './client.js';
import { unwrap } from './errors.js';
import type { components, paths } from './generated.js';

export type MemberListQuery = NonNullable<paths['/api/members']['get']['parameters']['query']>;
export type MemberInvitationInput = components['schemas']['MemberInvitationInput'];
export type MemberUpdateInput = components['schemas']['MemberInput'] & { version: number };

export function createMemberApi(sdk: StaySdk) {
  return {
    list: async (query?: MemberListQuery, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/members', { params: { query }, signal })),
    invite: async (body: MemberInvitationInput) =>
      unwrap(await sdk.POST('/api/members/invitations', { body })).data,
    update: async ({ id, body }: { id: string; body: MemberUpdateInput }) =>
      unwrap(await sdk.PUT('/api/members/{id}', { params: { path: { id } }, body })).data,
    disable: async (id: string) =>
      unwrap(await sdk.POST('/api/members/{id}/disable', { params: { path: { id } } })).data,
  };
}
