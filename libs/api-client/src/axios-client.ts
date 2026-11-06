import { createP4AuthClient } from '@p4/api-sdk/auth';
import { createApiSdk } from '@p4/api-sdk/shared';
import { type AuthSession, clearAuthSession, readAuthSession, writeAuthSession } from '@p4/auth';
import type { ApiError } from '@p4/shared';
import axios, {
  type AxiosError,
  type AxiosRequestHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import queryString from 'query-string';

export type HeaderConf = {
  authorization?: boolean;
  locale?: string;
} & Record<string, unknown>;

export type Res<T = unknown> = T & {
  error?: boolean;
  message?: string;
};

export type ListParams<T = unknown> = T & {
  page?: number;
  pageSize?: number;
  q?: string;
};

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let apiBaseURL = '/api';

/** Call once from apps/web (main/app) — baseURL example: `/api` or `https://host/api` */
export function configureApiClient(options: { baseURL: string }) {
  apiBaseURL = options.baseURL.replace(/\/$/, '');
  instance.defaults.baseURL = apiBaseURL;
  authClient = undefined;
  sdkClient = undefined;
}

let authClient: ReturnType<typeof createP4AuthClient> | undefined;
let sdkClient: ReturnType<typeof createApiSdk> | undefined;

function absoluteApiUrl() {
  return new URL(
    apiBaseURL,
    typeof window === 'undefined' ? 'http://127.0.0.1:3001' : window.location.origin,
  ).href;
}

export function getAuthClient() {
  authClient ??= createP4AuthClient(absoluteApiUrl());
  return authClient;
}

export function getApiSdk() {
  sdkClient ??= createApiSdk({
    baseUrl: absoluteApiUrl().replace(/\/api\/?$/, ''),
    getToken: getAccessToken,
    getHeaders: () => ({
      'Accept-Language':
        typeof localStorage === 'undefined' ? 'vi' : (localStorage.getItem('p4_locale') ?? 'vi'),
    }),
  });
  return sdkClient;
}

export function getAccessToken(): string | null {
  return readAuthSession()?.token ?? null;
}

export const instance = axios.create({
  baseURL: apiBaseURL,
  timeout: 15_000,
  withCredentials: true,
  paramsSerializer: (params: Record<string, unknown>) =>
    queryString.stringify(params, {
      arrayFormat: 'bracket',
      skipNull: true,
      skipEmptyString: true,
    }),
});

export type NormalizedApiError = {
  success: false;
  status: number;
  message: string;
  code?: string;
  error: true;
  data: ApiError | null;
};

const normalizeAxiosError = (error: AxiosError<ApiError>): NormalizedApiError => {
  const response = error.response;
  const data = response?.data ?? null;
  return {
    success: false,
    status: response?.status || 500,
    message: data?.message || error.message || 'Unknown error',
    code: data?.code,
    error: true,
    data,
  };
};

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => config,
  (error: AxiosError) => Promise.reject(normalizeAxiosError(error as AxiosError<ApiError>)),
);

let refreshPromise: Promise<AuthSession | null> | null = null;
let authEpoch = 0;
let logoutPromise: Promise<void> | null = null;

async function performRefresh(epoch: number, persist = true): Promise<AuthSession | null> {
  if (logoutPromise) return null;
  try {
    const { data, error } = await getAuthClient().getSession();
    if (error || !data) {
      if (epoch === authEpoch && persist) clearAuthSession();
      return null;
    }
    const response = await axios.get<{ data: { user: import('@p4/shared').User } }>(
      `${apiBaseURL}/auth/me`,
      { withCredentials: true },
    );
    const session: AuthSession = { token: data.session.token, user: response.data.data.user };
    if (epoch !== authEpoch) return null;
    if (persist) writeAuthSession(session);
    return session;
  } catch {
    if (epoch === authEpoch && persist) clearAuthSession();
    return null;
  }
}

export async function loginAuthSession(email: string, password: string): Promise<AuthSession> {
  await logoutPromise;
  const epoch = ++authEpoch;
  refreshPromise = null;
  clearAuthSession();
  const result = await getAuthClient().signIn.email({ email, password });
  if (result.error) throw new Error(result.error.message ?? 'auth.loginFailed');
  const session = await performRefresh(epoch, false);
  if (!session) throw new Error('auth.loginFailed');
  return session;
}

export async function loginGoogleAuthSession(credential: string): Promise<AuthSession> {
  await logoutPromise;
  const epoch = ++authEpoch;
  refreshPromise = null;
  clearAuthSession();
  const result = await getAuthClient().signIn.social({
    provider: 'google',
    idToken: { token: credential },
  });
  if (result.error) throw new Error(result.error.message ?? 'auth.googleFailed');
  const session = await performRefresh(epoch, false);
  if (!session) throw new Error('auth.googleFailed');
  return session;
}

export function refreshAuthSession(): Promise<AuthSession | null> {
  if (!refreshPromise) {
    const pending: Promise<AuthSession | null> = performRefresh(authEpoch).finally(() => {
      if (refreshPromise === pending) refreshPromise = null;
    });
    refreshPromise = pending;
  }
  return refreshPromise;
}

export function revokeAuthSession(_session?: AuthSession): Promise<void> {
  ++authEpoch;
  refreshPromise = null;
  clearAuthSession();
  logoutPromise ??= getAuthClient()
    .signOut()
    .then(() => undefined)
    .finally(() => {
      logoutPromise = null;
    });
  return logoutPromise;
}

instance.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  async (error: AxiosError<ApiError>) => {
    const original = error.config as RetryConfig | undefined;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry) {
      original._retry = true;
      const nextSession = await refreshAuthSession();
      if (nextSession) {
        original.headers = {
          ...original.headers,
          Authorization: `Bearer ${nextSession.token}`,
        } as AxiosRequestHeaders;
        return instance.request(original);
      }
    }

    return Promise.reject(normalizeAxiosError(error));
  },
);

export async function getHeader(headerConf: HeaderConf = {}): Promise<AxiosRequestHeaders> {
  const { authorization = true, locale, ...rest } = headerConf;
  const headers: Record<string, unknown> = {
    'Content-Type': 'application/json',
    ...rest,
  };

  if (authorization) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  if (locale) {
    headers['Accept-Language'] = locale;
  } else {
    try {
      const stored = localStorage.getItem('p4_locale');
      if (stored) headers['Accept-Language'] = stored;
    } catch {
      /* ignore */
    }
  }

  return headers as AxiosRequestHeaders;
}

/** Response interceptor has already unwrapped `response.data` (the API envelope). */
export const axiosClient = {
  async get<ReqType, ResType>(url: string, params?: ReqType, headerConf?: HeaderConf) {
    const headers = await getHeader(headerConf);
    return instance.get(url, { params, headers }) as Promise<ResType>;
  },

  async post<ReqType, ResType>(url: string, data?: ReqType, headerConf?: HeaderConf) {
    const headers = await getHeader(headerConf);
    return instance.post(url, data, { headers }) as Promise<ResType>;
  },

  async put<ReqType, ResType>(url: string, data?: ReqType, headerConf?: HeaderConf) {
    const headers = await getHeader(headerConf);
    return instance.put(url, data, { headers }) as Promise<ResType>;
  },

  async patch<ReqType, ResType>(url: string, data?: ReqType, headerConf?: HeaderConf) {
    const headers = await getHeader(headerConf);
    return instance.patch(url, data, { headers }) as Promise<ResType>;
  },

  async delete<ReqType, ResType>(url: string, data?: ReqType, headerConf?: HeaderConf) {
    const headers = await getHeader(headerConf);
    return instance.delete(url, { data, headers }) as Promise<ResType>;
  },
};
