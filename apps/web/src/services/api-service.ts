// API client — đọc apps/api/README.md (envelope { data, meta })
// Base URL: constants.API_BASE_URL (VITE_API_URL trên Vercel)

import { API_BASE_URL } from '@/constants/constants';

export function getAuthHeaders(): HeadersInit {
  // TODO: đọc token từ localStorage (AUTH_STORAGE_KEY)
  return { 'Content-Type': 'application/json' };
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error((await res.json()).message ?? res.statusText);
  return res.json() as Promise<T>;
}
