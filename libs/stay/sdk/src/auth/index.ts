import { createAuthClient } from 'better-auth/client';

/**
 * Better Auth client for the Stay API; `baseUrl` is the API base including `/api`
 * (e.g. `http://127.0.0.1:3011/api`). Sessions use HttpOnly `stay.*` cookies.
 */
export function createStayAuthClient(baseUrl: string) {
  return createAuthClient({
    baseURL: `${baseUrl.replace(/\/$/, '')}/auth`,
    fetchOptions: { credentials: 'include' },
  });
}

export type StayAuthClient = ReturnType<typeof createStayAuthClient>;
