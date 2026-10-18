import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LanguageToggle } from '../../../components/common/LanguageToggle';
import { ApiError } from '../../../services/apiError';
import { renderWithLanguage } from '../../../test/renderWithLanguage';
import type { CustomerInput } from '../types/customer.types';
import { CustomerForm } from './CustomerForm';
import { useState } from 'react';

function renderForm(options: {
  initial?: CustomerInput | null;
  serverError?: ApiError | null;
  language?: 'ar' | 'en';
  onSave?: (input: CustomerInput) => Promise<void>;
} = {}) {
  const onSave = options.onSave ?? vi.fn(async () => undefined);
  const onSubmittingChange = vi.fn();
  const onClearServerError = vi.fn();
  const onCancel = vi.fn();
  const form = (
    <CustomerForm
      initial={options.initial ?? null}
      serverError={options.serverError ?? null}
      saving={false}
      onSave={onSave}
      onCancel={onCancel}
      onClearServerError={onClearServerError}
      onSubmittingChange={onSubmittingChange}
    />
  );
  renderWithLanguage(options.language === 'ar' ? <>{form}<LanguageToggle /></> : form, options.language ?? 'en');
  return { onSave, onSubmittingChange, onClearServerError, onCancel };
}

const existingCustomer: CustomerInput = {
  fullName: 'Mona Hassan',
  phoneNumber: '+966501234567',
  email: 'mona@example.com',
  address: 'Cairo',
};

describe('CustomerForm', () => {
  it('shows only name and phone by default and reveals optional fields on demand', async () => {
    const user = userEvent.setup();
    renderForm();
    const toggle = screen.getByRole('button', { name: 'Additional Details' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveClass('cursor-pointer', 'hover:bg-surface-hover');
    const saveButton = screen.getByRole('button', { name: 'Save' });
    expect(saveButton).toHaveClass('enabled:hover:bg-cta-hover', 'enabled:hover:text-primary', 'enabled:hover:border-primary');
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    expect(cancelButton).toHaveClass('enabled:hover:bg-surface-hover');
    expect(screen.getByLabelText('Full name')).toHaveClass('cursor-text');
    expect(screen.getByLabelText('Phone number')).toHaveClass('cursor-text');
    expect(screen.getByLabelText('Email')).not.toBeVisible();
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByLabelText('Email')).toBeVisible();
    expect(screen.getByText('First and last visits are recorded automatically for reporting.')).toBeInTheDocument();
  });

  it('opens optional fields and selects the existing international country in edit mode', () => {
    renderForm({ initial: existingCustomer });
    expect(screen.getByRole('button', { name: 'Additional Details' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByLabelText('Full name')).toHaveValue('Mona Hassan');
    expect(screen.getByLabelText('Email')).toHaveValue('mona@example.com');
    expect(screen.getByLabelText('Address')).toHaveValue('Cairo');
    expect(screen.getByRole('combobox', { name: 'Phone country' })).toHaveValue('SA');
  });

  it('shows field errors after blur and updates them live while editing', async () => {
    const user = userEvent.setup();
    renderForm();
    const name = screen.getByLabelText('Full name');
    await user.type(name, 'A');
    fireEvent.blur(name);
    expect(screen.getByText('Name must be between 2 and 150 characters.')).toBeInTheDocument();
    await user.type(name, 'da');
    expect(screen.queryByText('Name must be between 2 and 150 characters.')).not.toBeInTheDocument();
  });

  it('shows all required errors on submit, focuses the first invalid field, and supports live language changes', async () => {
    const user = userEvent.setup();
    renderForm({ language: 'ar' });
    expect(screen.getByRole('button', { name: 'تفاصيل إضافية' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'حفظ' }));
    expect(screen.getByText('الاسم مطلوب.')).toBeInTheDocument();
    expect(screen.getByText('رقم الموبايل مطلوب.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('الاسم بالكامل')).toHaveFocus());
    await user.click(screen.getByRole('button', { name: 'التبديل للإنجليزية' }));
    expect(screen.getByText('Name is required.')).toBeInTheDocument();
    expect(screen.getByText('Phone number is required.')).toBeInTheDocument();
  });

  it('maps a known backend duplicate code to the same localized field message', () => {
    renderForm({ serverError: new ApiError(409, 'error.validation', { phoneNumber: 'phoneNumber.duplicate' }) });
    expect(screen.getByText('A customer with this phone number already exists.')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone number')).toHaveAttribute('aria-invalid', 'true');
  });

  it('locks the save button and ignores duplicate submissions while a save is pending', async () => {
    const user = userEvent.setup();
    let completeSave: (() => void) | undefined;
    const onSave = vi.fn((_input: CustomerInput) => new Promise<void>((resolve) => { completeSave = resolve; }));

    function SavingHarness() {
      const [saving, setSaving] = useState(false);
      return (
        <CustomerForm
          initial={null}
          serverError={null}
          saving={saving}
          onSave={onSave}
          onCancel={vi.fn()}
          onClearServerError={vi.fn()}
          onSubmittingChange={setSaving}
        />
      );
    }

    renderWithLanguage(<SavingHarness />, 'en');
    await user.type(screen.getByLabelText('Full name'), 'Mona Hassan');
    await user.type(screen.getByLabelText('Phone number'), '01012345678');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    const savingButton = screen.getByRole('button', { name: 'Saving...' });
    expect(savingButton).toBeDisabled();
    expect(savingButton).toHaveClass('cursor-pointer', 'disabled:cursor-not-allowed');
    const form = screen.getByLabelText('Full name').closest('form');
    if (!form) throw new Error('The customer form is not rendered.');
    fireEvent.submit(form);
    expect(onSave).toHaveBeenCalledOnce();

    completeSave?.();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled());
  });

  it('keeps the submit button enabled for validation and retains values after a failed save', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(async () => { throw new Error('private server text'); });
    renderForm({ onSave });
    const name = screen.getByLabelText('Full name');
    const phone = screen.getByLabelText('Phone number');
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    await user.type(name, 'Mona Hassan');
    await user.type(phone, '01012345678');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(name).toHaveValue('Mona Hassan');
    expect((phone as HTMLInputElement).value).toContain('010');
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });
});
