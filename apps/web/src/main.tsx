import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import App from './app';
import '@p4/ui/theme/tokens.css';
import '@p4/ui/theme/themes.css';
import './styles/tailwind.css';
import './styles/global.scss';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('#root element not found');
}

createRoot(rootEl).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </StrictMode>,
);
