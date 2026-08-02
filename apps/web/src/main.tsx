import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';
import '@/i18n';
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
    <App />
  </StrictMode>,
);
