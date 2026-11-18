import { createPortalSdk } from '@stay/sdk/portal';
import { currentLocale } from '@/i18n';

let sdk: ReturnType<typeof createPortalSdk> | undefined;

/**
 * Tenant portal client (ST-25): same-origin `/api`, authenticated only by the HttpOnly portal
 * cookie. Separate from the staff client, so a portal 401 never touches the staff session.
 */
export function getPortalSdk() {
  sdk ??= createPortalSdk({
    baseUrl: window.location.origin,
    getHeaders: () => ({ 'Accept-Language': currentLocale() }),
  });
  return sdk;
}
