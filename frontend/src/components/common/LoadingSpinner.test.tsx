import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LanguageProvider } from '../../context/LanguageContext';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('announces a localized loading status', () => {
    render(
      <LanguageProvider initialLanguage="en">
        <LoadingSpinner />
      </LanguageProvider>,
    );
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading customers...');

    const mark = status.querySelector('img');
    expect(mark).not.toBeNull();
    expect(mark).toHaveAttribute('src', '/brand/shaghaf-mark.svg');
    expect(mark).toHaveAttribute('alt', '');
    expect(mark).toHaveAttribute('aria-hidden', 'true');
    expect(mark).toHaveClass('shaghaf-loading-mark');
  });
});
