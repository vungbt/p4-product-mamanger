import { createI18n } from '@p4/i18n';
import type { Decorator, Preview } from '@storybook/react-vite';
import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { uiResources } from '../locales';
import '../theme/tokens.css';
import '../theme/themes.css';
import './tailwind.css';

const i18n = createI18n({ resources: uiResources, defaultNS: 'ui' });

// Toggle .dark on <html> matching the mechanism in libs/ui/theme/use-dark-mode.ts + darkMode:'class'
// in tailwind.preset — so every component can be viewed in both themes right in Storybook.
const withCanvas: Decorator = (Story, context) => {
  const mode = (context.globals.theme as string) ?? 'light';
  const portal = (context.globals.portal as string) ?? 'admin';

  useEffect(() => {
    void i18n.changeLanguage(context.globals.locale === 'en' ? 'en' : 'vi');
  }, [context.globals.locale]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  return (
    <div
      data-portal={portal}
      className="min-h-screen bg-neutral-bg p-8 font-primary text-neutral-text-primary transition-colors"
    >
      <I18nextProvider i18n={i18n}>
        <Story />
      </I18nextProvider>
    </div>
  );
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
    backgrounds: { disable: true },
  },
  globalTypes: {
    locale: {
      description: 'Ngôn ngữ UI',
      toolbar: {
        title: 'Language',
        icon: 'globe',
        items: [
          { value: 'vi', title: 'Tiếng Việt' },
          { value: 'en', title: 'English' },
        ],
        dynamicTitle: true,
      },
    },
    theme: {
      description: 'Sáng / tối — khớp .dark class (darkMode: "class" trong tailwind.preset)',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    portal: {
      description: 'Portal accent — khớp data-portal trong theme/themes.css',
      toolbar: {
        title: 'Portal',
        icon: 'grow',
        items: [
          { value: 'admin', title: 'Admin' },
          { value: 'storefront', title: 'Storefront' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    locale: 'vi',
    theme: 'light',
    portal: 'admin',
  },
  decorators: [withCanvas],
};

export default preview;
