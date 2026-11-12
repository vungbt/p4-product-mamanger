import {
  MANAGER_PERMISSION_GROUPS,
  type MemberInput,
  type MemberInvitationInput,
} from '@stay/shared';
import type { FormBody } from '@/shared/input.js';

export function readMemberInput(body: FormBody): MemberInput {
  const buildingIds = body.strings('buildingIds', 100, 36);
  const groups = body.strings('permissionGroups', 4, 32);

  body.check(
    'buildingIds',
    Array.isArray(body.data.buildingIds) &&
      buildingIds.length === body.data.buildingIds.length &&
      buildingIds.length > 0 &&
      new Set(buildingIds).size === buildingIds.length &&
      buildingIds.every((id) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id),
      ),
  );
  const permissionGroups = MANAGER_PERMISSION_GROUPS.filter((group) => groups.includes(group));

  body.check(
    'permissionGroups',
    Array.isArray(body.data.permissionGroups) &&
      permissionGroups.length === body.data.permissionGroups.length,
  );
  body.assertValid();
  return { buildingIds, permissionGroups };
}

export function readInvitationInput(body: FormBody): MemberInvitationInput {
  const email = body.text('email', 254).toLowerCase();

  body.check('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  return { email, ...readMemberInput(body) };
}
