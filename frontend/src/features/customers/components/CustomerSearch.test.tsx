import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../../context/LanguageContext';
import { CustomerSearch } from './CustomerSearch';

describe('CustomerSearch', () => {
  it('forwards the raw search text and exposes an accessible clear action', () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    render(
      <LanguageProvider initialLanguage="en">
        <CustomerSearch value="أحمد 010" onChange={onChange} onClear={onClear} />
      </LanguageProvider>,
    );

    const input = screen.getByRole('searchbox', { name: 'Search by name or phone number' });
    expect(input).toHaveValue('أحمد 010');
    expect(input).toHaveClass('cursor-text');
    fireEvent.change(input, { target: { value: 'رقم ٠١٠' } });
    expect(onChange).toHaveBeenCalledWith('رقم ٠١٠');
    const clearButton = screen.getByRole('button', { name: 'Clear search' });
    expect(clearButton).toHaveClass('cursor-pointer');
    expect(clearButton.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(clearButton).toHaveClass('hover:bg-cta-hover', 'hover:text-primary');
    const tooltip = clearButton.querySelector('.action-tooltip');
    expect(tooltip).toHaveTextContent('Clear search');
    expect(tooltip).toHaveAttribute('aria-hidden', 'true');
    fireEvent.click(clearButton);
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('localizes the clear tooltip in Egyptian Arabic', () => {
    render(
      <LanguageProvider initialLanguage="ar">
        <CustomerSearch value="أحمد" onChange={vi.fn()} onClear={vi.fn()} />
      </LanguageProvider>,
    );

    const clearButton = screen.getByRole('button', { name: 'مسح البحث' });
    expect(clearButton.querySelector('.action-tooltip')).toHaveTextContent('مسح البحث');
    expect(clearButton).toHaveAccessibleName('مسح البحث');
  });

  it('does not show a clear icon when the query is empty', () => {
    render(
      <LanguageProvider initialLanguage="en">
        <CustomerSearch value="" onChange={vi.fn()} onClear={vi.fn()} />
      </LanguageProvider>,
    );

    const search = screen.getByRole('searchbox', { name: 'Search by name or phone number' });
    expect(search.parentElement).toHaveAttribute('dir', 'ltr');
    expect(search).toHaveAttribute('dir', 'ltr');
    expect(search).toHaveClass('text-start');
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('aligns an empty Arabic search placeholder to the right', () => {
    render(
      <LanguageProvider initialLanguage="ar">
        <CustomerSearch value="" onChange={vi.fn()} onClear={vi.fn()} />
      </LanguageProvider>,
    );

    const search = screen.getByRole('searchbox', { name: 'البحث بالاسم أو رقم الموبايل' });
    expect(search).toHaveAttribute('dir', 'rtl');
    expect(search).toHaveClass('text-start');
  });

  it('positions the clear icon from the query direction rather than the page language', () => {
    const { unmount } = render(
      <LanguageProvider initialLanguage="ar">
        <CustomerSearch value="Sarah" onChange={vi.fn()} onClear={vi.fn()} />
      </LanguageProvider>,
    );
    const englishSearch = screen.getByRole('searchbox', { name: 'البحث بالاسم أو رقم الموبايل' });
    expect(englishSearch.parentElement).toHaveAttribute('dir', 'ltr');
    expect(englishSearch).toHaveAttribute('dir', 'ltr');
    unmount();

    render(
      <LanguageProvider initialLanguage="en">
        <CustomerSearch value="أحمد" onChange={vi.fn()} onClear={vi.fn()} />
      </LanguageProvider>,
    );
    const arabicSearch = screen.getByRole('searchbox', { name: 'Search by name or phone number' });
    expect(arabicSearch.parentElement).toHaveAttribute('dir', 'rtl');
    expect(arabicSearch).toHaveAttribute('dir', 'rtl');
  });
});
