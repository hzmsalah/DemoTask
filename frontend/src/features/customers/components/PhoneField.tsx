import { forwardRef, type ComponentPropsWithoutRef, type ChangeEvent } from 'react';
import arLabels from 'react-phone-number-input/locale/ar';
import enLabels from 'react-phone-number-input/locale/en';
import PhoneInput from 'react-phone-number-input/max';
import { useLanguage } from '../../../context/LanguageContext';
import { toWesternDigits } from '../utils/phone';

const WesternDigitInput = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<'input'>>(
  function WesternDigitInput({ onChange, ...props }, ref) {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.currentTarget;
      const westernValue = toWesternDigits(input.value);
      if (westernValue !== input.value) {
        const selection = input.selectionStart;
        input.value = westernValue;
        if (selection !== null) input.setSelectionRange(selection, selection);
      }
      onChange?.(event);
    };

    return <input {...props} ref={ref} className={`cursor-text ${props.className ?? ''}`.trim()} onChange={handleChange} />;
  },
);

interface PhoneFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  onBlur?: () => void;
}

export function PhoneField({ value, onChange, error, onBlur }: PhoneFieldProps) {
  const { language, t } = useLanguage();
  const labels = language === 'ar' ? arLabels : enLabels;

  return (
    <div>
      <label htmlFor="phone-number" className="mb-1 block text-sm font-semibold text-text-main">
        {t('phone')}
      </label>
      <div dir="ltr" className={`rounded-md border bg-surface px-3 py-2 ${error ? 'border-danger' : 'border-border'}`}>
        <PhoneInput
          id="phone-number"
          type="tel"
          autoComplete="tel"
          defaultCountry="EG"
          value={value || undefined}
          onChange={(nextValue) => onChange(nextValue ?? '')}
          onBlur={onBlur}
          labels={labels}
          inputComponent={WesternDigitInput}
          countrySelectProps={{ 'aria-label': t('phoneCountry'), className: 'cursor-pointer disabled:cursor-not-allowed' }}
          placeholder={t('phonePlaceholder')}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'phone-number-error' : undefined}
          className="PhoneInput"
        />
      </div>
      {error && <p id="phone-number-error" className="mt-1 text-sm text-danger" role="alert">{error}</p>}
    </div>
  );
}
