import createClient from 'openapi-fetch';
import type { paths } from './generated.js';

export interface ApiSdkOptions {
  baseUrl: string;
  getToken?: () => string | null | undefined | Promise<string | null | undefined>;
  getHeaders?: () => HeadersInit | Promise<HeadersInit>;
  fetch?: typeof globalThis.fetch;
  credentials?: RequestCredentials;
  onUnauthorized?: () => void | Promise<void>;
}

export function createApiSdk(options: ApiSdkOptions) {
  const client = createClient<paths>({
    baseUrl: options.baseUrl.replace(/\/$/, ''),
    credentials: options.credentials ?? 'include',
    ...(options.fetch ? { fetch: options.fetch } : {}),
  });
  client.use({
    async onRequest({ request }) {
      if (options.getHeaders)
        new Headers(await options.getHeaders()).forEach((value, key) => {
          request.headers.set(key, value);
        });
      const token = await options.getToken?.();
      if (token) request.headers.set('authorization', `Bearer ${token}`);
      return request;
    },
    async onResponse({ response }) {
      if (response.status === 401) await options.onUnauthorized?.();
      return response;
    },
  });
  return client;
}

export type ApiSdk = ReturnType<typeof createApiSdk>;
