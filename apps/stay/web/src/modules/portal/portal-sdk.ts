import { createPortalSdk } from '@stay/sdk/portal';
import { currentLocale } from '@/i18n';

export let accountContractId: string | undefined;

export function selectAccountContract(id: string | undefined) {
  accountContractId = id;
}

let sdk: ReturnType<typeof createPortalSdk> | undefined;

/**
 * Tenant portal client (ST-25): same-origin `/api`, authenticated only by the HttpOnly portal
 * cookie. Separate from the staff client, so a portal 401 never touches the staff session.
 */
export function getPortalSdk() {
  sdk ??= createPortalSdk({
    baseUrl: window.location.origin,
    getHeaders: () => ({
      'Accept-Language': currentLocale(),
      ...(window.location.pathname.startsWith('/my') && accountContractId
        ? { 'X-Stay-Contract': accountContractId }
        : {}),
    }),
  });
  return sdk;
}
