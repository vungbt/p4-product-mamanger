import type { StaySdk } from './client.js';
import { unwrap } from './errors.js';
import type { components, paths } from './generated.js';

export type AnnouncementListQuery = NonNullable<
  paths['/api/announcements']['get']['parameters']['query']
>;
export type AnnouncementCreateInput = components['schemas']['AnnouncementInput'];
export type AnnouncementUpdateInput = AnnouncementCreateInput & { version: number };

/** ST-25 O-32: announcements for tenants (whole building or rooms, pin, expiry). */
export function createAnnouncementApi(sdk: StaySdk) {
  return {
    list: async (query?: AnnouncementListQuery, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/announcements', { params: { query }, signal })),
    create: async (body: AnnouncementCreateInput) =>
      unwrap(await sdk.POST('/api/announcements', { body })).data,
    update: async ({ id, body }: { id: string; body: AnnouncementUpdateInput }) =>
      unwrap(await sdk.PUT('/api/announcements/{id}', { params: { path: { id } }, body })).data,
    archive: async (id: string) =>
      unwrap(await sdk.POST('/api/announcements/{id}/archive', { params: { path: { id } } })).data,
    remove: async (id: string) =>
      unwrap(await sdk.DELETE('/api/announcements/{id}', { params: { path: { id } } })).data,
  };
}
