import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../context/LanguageContext';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('offers to add the first customer when there are no records', () => {
    const onAddCustomer = vi.fn();
    render(
      <LanguageProvider initialLanguage="en">
        <EmptyState searchTerm="" onAddCustomer={onAddCustomer} onClearSearch={vi.fn()} />
      </LanguageProvider>,
    );

    expect(screen.getByText('No customers yet')).toBeInTheDocument();
    const addFirstCustomer = screen.getByRole('button', { name: 'Add the first customer' });
    expect(addFirstCustomer).toHaveClass('hover:bg-cta-hover', 'hover:text-primary');
    fireEvent.click(addFirstCustomer);
    expect(onAddCustomer).toHaveBeenCalledOnce();
  });

  it('shows the search term and clears it when no results match', () => {
    const onClearSearch = vi.fn();
    render(
      <LanguageProvider initialLanguage="en">
        <EmptyState searchTerm="Ada" onAddCustomer={vi.fn()} onClearSearch={onClearSearch} />
      </LanguageProvider>,
    );

    expect(screen.getByText('No results for Ada')).toBeInTheDocument();
    const clearSearch = screen.getByRole('button', { name: 'Clear search' });
    expect(clearSearch).toHaveClass('hover:bg-cta-hover', 'hover:text-primary');
    fireEvent.click(clearSearch);
    expect(onClearSearch).toHaveBeenCalledOnce();
  });
});
