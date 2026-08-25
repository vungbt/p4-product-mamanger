import {
  ApiQueryProvider,
  axiosClient,
  configureApiClient,
  refreshAuthSession,
  revokeAuthSession,
} from '@p4/api-client';
import type { AuthSession } from '@p4/auth';
import type { LoginResponse } from '@p4/shared';
import { Toaster } from '@p4/ui';
import { BrowserRouter } from 'react-router-dom';
import { API_BASE_URL } from '@/constants/constants';
import { AuthProvider } from '@/contexts/auth-context';
import RouteConfigs from '@/routing/config.route';
import MasterRoutes from '@/routing/master.route';

configureApiClient({ baseURL: API_BASE_URL });

function getApiErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message?: string }).message);
    if (message) return message;
  }
  return fallback;
}

async function loginWithApi(email: string, password: string): Promise<AuthSession> {
  try {
    const envelope = await axiosClient.post<
      { email: string; password: string },
      { data: LoginResponse }
    >('/auth/login', { email, password }, { authorization: false });
    return envelope.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'auth.loginFailed'));
  }
}

async function loginWithGoogleApi(credential: string): Promise<AuthSession> {
  try {
    const envelope = await axiosClient.post<{ credential: string }, { data: LoginResponse }>(
      '/auth/google',
      { credential },
      { authorization: false },
    );
    const session = envelope.data;

    if (!session.user.avatarUrl) {
      try {
        const [, payload] = credential.split('.');
        if (payload) {
          const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
            picture?: string;
          };
          if (json.picture) {
            session.user = { ...session.user, avatarUrl: json.picture };
          }
        }
      } catch {
        /* ignore */
      }
    }

    return session;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'auth.googleFailed'));
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <ApiQueryProvider enableDevtools={import.meta.env.DEV}>
        <AuthProvider
          onLogin={loginWithApi}
          onGoogleLogin={loginWithGoogleApi}
          onRefresh={refreshAuthSession}
          onLogout={revokeAuthSession}
        >
          <MasterRoutes routes={RouteConfigs} />
          <Toaster position="top-right" duration={3000} />
        </AuthProvider>
      </ApiQueryProvider>
    </BrowserRouter>
  );
}
