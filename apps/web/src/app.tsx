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
import { createBrowserRouter, Link, RouterProvider, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '@/constants/constants';
import { AuthProvider } from '@/contexts/auth-context';
import CapabilityAbilityProvider from '@/libraries/capability-ability-provider';
import { UnsavedChangesProvider } from '@/libraries/forms/unsaved-changes';
import { uiTheme } from '@/libraries/ui-theme';
import RouteConfigs from '@/routing/config.route';
import MasterRoutes from '@/routing/master.route';

configureApiClient({ baseURL: API_BASE_URL });

// Keep library navigation on React Router and forward native link/ref/accessibility props.
function RouterUiLink({ href, ...props }: UiLinkProps) {
  return <Link {...props} to={href} />;
}

function useRouterAdapter() {
  return { pathname: useLocation().pathname };
}

function WebImage({ alt, ...props }: UiImageProps) {
  return <img decoding="async" loading="lazy" {...props} alt={alt} />;
}

function Root() {
  const { i18n } = useTranslation();

  return (
    <UIProvider
      theme={uiTheme}
      image={WebImage}
      link={RouterUiLink}
      router={useRouterAdapter}
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
            <CapabilityAbilityProvider>
              <UnsavedChangesProvider>
                <MasterRoutes routes={RouteConfigs} />
              </UnsavedChangesProvider>
            </CapabilityAbilityProvider>
          </AuthProvider>
        </ApiQueryProvider>
      </ToastProvider>
    </UIProvider>
  );
}

// Keep the existing route tree under a data router so forms can use useBlocker.
const router = createBrowserRouter([{ path: '*', element: <Root /> }]);

export default function App() {
  return <RouterProvider router={router} />;
}
