import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../../context/LanguageContext';
import type { Customer } from '../types/customer.types';
import { DeleteConfirmModal } from './DeleteConfirmModal';

const customer: Customer = {
  id: 'a6d3901c-85a2-4e22-a09f-2fef5a13209f',
  fullName: 'Ada Lovelace',
  phoneNumber: '+201012345678',
  email: null,
  address: null,
  createdAt: '2026-10-17T10:00:00Z',
  lastVisit: null,
};

describe('DeleteConfirmModal', () => {
  it('names the customer and puts initial focus on Cancel', () => {
    render(
      <LanguageProvider initialLanguage="en">
        <DeleteConfirmModal customer={customer} open onClose={vi.fn()} onConfirm={vi.fn()} busy={false} error={null} />
      </LanguageProvider>,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    expect(cancel).toHaveFocus();
    expect(cancel).toHaveClass('enabled:hover:bg-surface-hover');
    expect(screen.getByRole('button', { name: 'Delete customer' })).toHaveClass('enabled:hover:bg-danger-hover');
  });

  it('confirms once and lets Escape cancel without confirming', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <LanguageProvider initialLanguage="en">
        <DeleteConfirmModal customer={customer} open onClose={onClose} onConfirm={onConfirm} busy={false} error={null} />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete customer' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
