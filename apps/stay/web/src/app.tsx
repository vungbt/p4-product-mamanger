import { ToastProvider, UIProvider, type UiImageProps, type UiLinkProps } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Link } from 'react-router-dom';
import { CapabilityAbilityProvider } from '@/libraries/ability';
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
        <ToastProvider position="top-center" duration={3000}>
          <QueryProvider>
            <AuthProvider>
              <CapabilityAbilityProvider>
                <OfflineBanner />
                <AppRoutes />
              </CapabilityAbilityProvider>
            </AuthProvider>
          </QueryProvider>
        </ToastProvider>
      </UIProvider>
    </BrowserRouter>
  );
}
