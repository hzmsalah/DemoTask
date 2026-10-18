import { useState } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithLanguage } from '../../../test/renderWithLanguage';
import { PhoneField } from './PhoneField';

function PhoneHarness({ initialValue = '', onChange }: { initialValue?: string; onChange: (value: string) => void }) {
  const [value, setValue] = useState(initialValue);
  return <PhoneField value={value} onChange={(next) => { setValue(next); onChange(next); }} />;
}

describe('PhoneField', () => {
  it('defaults to Egypt with an accessible country selector', () => {
    renderWithLanguage(<PhoneHarness onChange={vi.fn()} />);
    const countrySelector = screen.getByRole('combobox', { name: 'Phone country' });
    expect(countrySelector).toHaveValue('EG');
    expect(countrySelector).toHaveClass('cursor-pointer');
    expect(screen.getByLabelText('Phone number')).toHaveClass('cursor-text');
  });

  it('converts Arabic-Indic digits to the canonical Egyptian E.164 value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithLanguage(<PhoneHarness onChange={onChange} />);
    await user.type(screen.getByLabelText('Phone number'), '\u0660\u0661\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668');
    expect(onChange).toHaveBeenLastCalledWith('+201012345678');
  });

  it('switches country for an international number and localizes country controls', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithLanguage(<PhoneHarness onChange={onChange} />, 'ar');
    expect(screen.getByRole('combobox', { name: 'دولة رقم الموبايل' })).toHaveValue('EG');
    await user.type(screen.getByLabelText('رقم الموبايل'), '+966501234567');
    expect(onChange).toHaveBeenLastCalledWith('+966501234567');
    expect(screen.getByRole('combobox', { name: 'دولة رقم الموبايل' })).toHaveValue('SA');
  });
});
