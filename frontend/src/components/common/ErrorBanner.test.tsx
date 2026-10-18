import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../context/LanguageContext';
import { ErrorBanner } from './ErrorBanner';

describe('ErrorBanner', () => {
  it('announces the message and retries when requested', () => {
    const onRetry = vi.fn();
    render(
      <LanguageProvider initialLanguage="en">
        <ErrorBanner message="Could not connect." onRetry={onRetry} />
      </LanguageProvider>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Could not connect.');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
