import { type AuthSession, clearAuthSession, readAuthSession, writeAuthSession } from '@p4/auth';
import type { ApiError, LoginResponse } from '@p4/shared';
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
}

export function getAccessToken(): string | null {
  return readAuthSession()?.token ?? null;
}

export function getRefreshToken(): string | null {
  return readAuthSession()?.refreshToken ?? null;
}

export const instance = axios.create({
  baseURL: apiBaseURL,
  timeout: 15_000,
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

async function performRefresh(): Promise<AuthSession | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post<{ data: LoginResponse }>(`${apiBaseURL}/auth/refresh`, {
      refreshToken,
    });
    const next = data.data;
    const session: AuthSession = {
      token: next.token,
      refreshToken: next.refreshToken,
      user: next.user,
    };
    writeAuthSession(session);
    return session;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function refreshAuthSession(): Promise<AuthSession | null> {
  refreshPromise ??= performRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

export async function revokeAuthSession(session: AuthSession): Promise<void> {
  await axios.post(
    `${apiBaseURL}/auth/logout`,
    { refreshToken: session.refreshToken },
    { headers: { Authorization: `Bearer ${session.token}` } },
  );
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
