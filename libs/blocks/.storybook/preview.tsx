import { UIProvider } from '@itclabs/react-ui';
import type { Decorator, Preview } from '@storybook/react-vite';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { blockResources } from '../locales';
import './tailwind.css';

const i18n = i18next.createInstance();
void i18n.use(initReactI18next).init({
  resources: blockResources,
  lng: 'vi',
  fallbackLng: 'vi',
  defaultNS: 'blocks',
  interpolation: { escapeValue: false },
});
const withKit: Decorator = (Story) => (
  <I18nextProvider i18n={i18n}>
    <UIProvider locale="vi-VN">
      <div className="min-h-screen bg-canvas p-6 text-ink">
        <Story />
      </div>
    </UIProvider>
  </I18nextProvider>
);
const preview: Preview = { decorators: [withKit], parameters: { a11y: { test: 'todo' } } };
export default preview;
