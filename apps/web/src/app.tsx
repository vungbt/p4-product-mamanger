import { ToastProvider, UIProvider, type UiImageProps, type UiLinkProps } from '@itclabs/react-ui';
import {
  ApiQueryProvider,
  configureApiClient,
  loginAuthSession,
  loginGoogleAuthSession,
  refreshAuthSession,
  revokeAuthSession,
} from '@p4/api-client';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Link } from 'react-router-dom';
import { API_BASE_URL } from '@/constants/constants';
import { AuthProvider } from '@/contexts/auth-context';
import { uiTheme } from '@/libraries/ui-theme';
import RouteConfigs from '@/routing/config.route';
import MasterRoutes from '@/routing/master.route';

configureApiClient({ baseURL: API_BASE_URL });

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
              onLogin={loginAuthSession}
              onGoogleLogin={loginGoogleAuthSession}
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
