import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { LanguageProvider, type Language } from '../context/LanguageContext';

export function renderWithLanguage(ui: ReactElement, language: Language = 'en') {
  return render(<LanguageProvider initialLanguage={language}>{ui}</LanguageProvider>);
}
