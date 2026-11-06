import { createAuthClient } from 'better-auth/client';

export function createP4AuthClient(baseUrl: string) {
  return createAuthClient({
    baseURL: `${baseUrl.replace(/\/$/, '')}/auth`,
    fetchOptions: { credentials: 'include' },
  });
}
