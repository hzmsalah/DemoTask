import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'react-phone-number-input/style.css';
import './index.css';
import { LanguageProvider } from './context/LanguageContext';
import { CustomerPage } from './features/customers/CustomerPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <CustomerPage />
    </LanguageProvider>
  </StrictMode>,
);
