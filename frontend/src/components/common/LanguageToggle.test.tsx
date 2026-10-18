import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LanguageProvider } from '../../context/LanguageContext';
import { LanguageToggle } from './LanguageToggle';

describe('LanguageToggle', () => {
  it('defaults to Egyptian Arabic and switches document direction to English', () => {
    render(
      <LanguageProvider>
        <LanguageToggle />
      </LanguageProvider>,
    );

    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    fireEvent.click(screen.getByRole('button', { name: 'التبديل للإنجليزية' }));
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(screen.getByRole('button', { name: 'Switch language' })).toHaveTextContent('Arabic');
  });
});
