import { ToastProvider, UIProvider, type UiImageProps, type UiLinkProps } from '@itclabs/react-ui';
import {
  ApiQueryProvider,
  axiosClient,
  configureApiClient,
  refreshAuthSession,
  revokeAuthSession,
} from '@p4/api-client';
import type { AuthSession } from '@p4/auth';
import type { LoginResponse } from '@p4/shared';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Link } from 'react-router-dom';
import { API_BASE_URL } from '@/constants/constants';
import { AuthProvider } from '@/contexts/auth-context';
import { uiTheme } from '@/libraries/ui-theme';
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

// Keep library navigation on React Router and forward native link/ref/accessibility props.
function RouterUiLink({ href, ...props }: UiLinkProps) {
  return <Link {...props} to={href} />;
}

function WebImage({ alt, ...props }: UiImageProps) {
  return <img decoding="async" loading="lazy" {...props} alt={alt} />;
}

export default function App() {
  const { i18n } = useTranslation();
  return (
    <BrowserRouter>
      <UIProvider
        theme={uiTheme}
        image={WebImage}
        link={RouterUiLink}
        locale={i18n.resolvedLanguage === 'en' ? 'en-US' : 'vi-VN'}
      >
        <ToastProvider position="top-right" duration={3000}>
          <ApiQueryProvider enableDevtools={import.meta.env.DEV}>
            <AuthProvider
              onLogin={loginWithApi}
              onGoogleLogin={loginWithGoogleApi}
              onRefresh={refreshAuthSession}
              onLogout={revokeAuthSession}
            >
              <MasterRoutes routes={RouteConfigs} />
            </AuthProvider>
          </ApiQueryProvider>
        </ToastProvider>
      </UIProvider>
    </BrowserRouter>
  );
}
