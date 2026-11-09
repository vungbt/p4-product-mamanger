import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { applyBrandToDocument } from '@/brand';
import i18n from '@/i18n';
import App from './app';
import './styles/tailwind.css';

const rootElement = document.getElementById('root');

if (!rootElement) throw new Error('#root element not found');

applyBrandToDocument();

createRoot(rootElement).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </StrictMode>,
);
