import type { Decorator, Preview } from '@storybook/react-vite';
import { useEffect } from 'react';
import '../theme/tokens.css';
import '../theme/themes.css';
import './tailwind.css';

// Toggle .dark on <html> matching the mechanism in libs/ui/theme/use-dark-mode.ts + darkMode:'class'
// in tailwind.preset — so every component can be viewed in both themes right in Storybook.
const withCanvas: Decorator = (Story, context) => {
  const mode = (context.globals.theme as string) ?? 'light';
  const portal = (context.globals.portal as string) ?? 'admin';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  return (
    <div
      data-portal={portal}
      className="min-h-screen bg-neutral-bg p-8 font-primary text-neutral-text-primary transition-colors"
    >
      <Story />
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
    theme: 'light',
    portal: 'admin',
  },
  decorators: [withCanvas],
};

export default preview;
