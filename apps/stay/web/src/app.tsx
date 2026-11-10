import { ToastProvider, UIProvider, type UiImageProps, type UiLinkProps } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
import { createBrowserRouter, Link, RouterProvider } from 'react-router-dom';
import { CapabilityAbilityProvider } from '@/libraries/ability';
import { UnsavedChangesProvider } from '@/libraries/forms/unsaved-changes';
import { OfflineBanner } from '@/libraries/offline-banner';
import { AuthProvider } from '@/libraries/session/auth-provider';
import { QueryProvider } from '@/libraries/session/query-provider';
import { uiTheme } from '@/libraries/ui-theme';
import AppRoutes from '@/routing/app-routes';

// Keep kit navigation (Sidebar, Breadcrumb) on React Router.
function RouterUiLink({ href, ...props }: UiLinkProps) {
  return <Link {...props} to={href} />;
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
      locale={i18n.resolvedLanguage === 'en' ? 'en-US' : 'vi-VN'}
    >
      <ToastProvider position="top-center" duration={3000}>
        <QueryProvider>
          <AuthProvider>
            <CapabilityAbilityProvider>
              <OfflineBanner />
              <UnsavedChangesProvider>
                <AppRoutes />
              </UnsavedChangesProvider>
            </CapabilityAbilityProvider>
          </AuthProvider>
        </QueryProvider>
      </ToastProvider>
    </UIProvider>
  );
}

// A data router so forms can block in-app navigation with unsaved changes (`useBlocker`);
// the app's own `<Routes>` stay below the single splat route.
const router = createBrowserRouter([{ path: '*', element: <Root /> }]);

export default function App() {
  return <RouterProvider router={router} />;
}
