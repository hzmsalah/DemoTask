import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../../context/LanguageContext';
import { CustomerPagination } from './CustomerPagination';

describe('CustomerPagination', () => {
  it('shows totals and disables previous on the first page', () => {
    render(
      <LanguageProvider initialLanguage="en">
        <CustomerPagination page={1} totalPages={3} totalCount={41} onPageChange={vi.fn()} />
      </LanguageProvider>,
    );

    expect(screen.getByRole('navigation', { name: 'Customer pagination' })).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Total customers: 41')).toBeInTheDocument();
    const previous = screen.getByRole('button', { name: 'Previous' });
    const next = screen.getByRole('button', { name: 'Next' });
    expect(previous).toBeDisabled();
    expect(previous).toHaveClass('cursor-pointer', 'disabled:cursor-not-allowed');
    expect(previous).toHaveClass('enabled:hover:bg-surface-hover', 'enabled:hover:border-primary');
    expect(next).toBeEnabled();
    expect(next).toHaveClass('cursor-pointer', 'enabled:hover:bg-surface-hover', 'enabled:hover:border-primary');
  });

  it('requests the adjacent page when Next is activated', () => {
    const onPageChange = vi.fn();
    render(
      <LanguageProvider initialLanguage="en">
        <CustomerPagination page={1} totalPages={2} totalCount={21} onPageChange={onPageChange} />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
