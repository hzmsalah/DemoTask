import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { TranslationKey } from '../../../locales/en';
import { ApiError, type CustomerField } from '../../../services/apiError';
import { useLanguage } from '../../../context/LanguageContext';
import type { CustomerInput } from '../types/customer.types';
import type { ValidationCode } from '../types/validationCodes';
import { normalizePhone } from '../utils/phone';
import { PhoneField } from './PhoneField';

const EMPTY_FORM: CustomerInput = { fullName: '', phoneNumber: '', email: '', address: '' };
const FIELD_ORDER: CustomerField[] = ['fullName', 'phoneNumber', 'email', 'address'];

type TFunction = (key: TranslationKey) => string;

function normalizedName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function validateField(field: CustomerField, values: CustomerInput): ValidationCode | null {
  switch (field) {
    case 'fullName': {
      const name = normalizedName(values.fullName);
      if (!name) return 'fullName.required';
      return name.length < 2 || name.length > 150 ? 'fullName.length' : null;
    }
    case 'phoneNumber':
      if (!values.phoneNumber.trim()) return 'phoneNumber.required';
      return normalizePhone(values.phoneNumber) ? null : 'phoneNumber.invalid';
    case 'email': {
      const email = values.email.trim();
      if (!email) return null;
      if (email.length > 100) return 'email.tooLong';
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : 'email.invalid';
    }
    case 'address':
      return values.address.length > 250 ? 'address.tooLong' : null;
  }
}

function validationText(code: ValidationCode, t: TFunction): string {
  return t(`validation.${code}` as TranslationKey);
}

interface CustomerFormProps {
  initial: CustomerInput | null;
  serverError: ApiError | null;
  saving: boolean;
  onSave: (input: CustomerInput) => Promise<void>;
  onCancel: () => void;
  onClearServerError: () => void;
  onSubmittingChange: (saving: boolean) => void;
}

export function CustomerForm({
  initial,
  serverError,
  saving,
  onSave,
  onCancel,
  onClearServerError,
  onSubmittingChange,
}: CustomerFormProps) {
  const { t } = useLanguage();
  const [values, setValues] = useState<CustomerInput>(initial ?? EMPTY_FORM);
  const [touched, setTouched] = useState<Partial<Record<CustomerField, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [additionalOpen, setAdditionalOpen] = useState(Boolean(initial?.email || initial?.address));
  const submittingRef = useRef(false);
  const fullNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setValues(initial ?? EMPTY_FORM);
    setTouched({});
    setSubmitted(false);
    setAdditionalOpen(Boolean(initial?.email || initial?.address));
  }, [initial]);

  useEffect(() => {
    if (serverError?.fieldErrors.email || serverError?.fieldErrors.address) setAdditionalOpen(true);
  }, [serverError]);

  const fieldCode = (field: CustomerField): ValidationCode | null => {
    return serverError?.fieldErrors[field]
      ?? ((submitted || touched[field]) ? validateField(field, values) : null);
  };

  const fieldMessage = (field: CustomerField): string | undefined => {
    const code = fieldCode(field);
    return code ? validationText(code, t) : undefined;
  };

  const updateField = (field: CustomerField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    onClearServerError();
  };

  const blurField = (field: CustomerField) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const focusField = (field: CustomerField) => {
    if (field === 'fullName') fullNameRef.current?.focus();
    else if (field === 'phoneNumber') document.getElementById('phone-number')?.focus();
    else if (field === 'email') emailRef.current?.focus();
    else addressRef.current?.focus();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;
    setSubmitted(true);

    const firstInvalid = FIELD_ORDER.find((field) => (
      serverError?.fieldErrors[field] ?? validateField(field, values)
    ));
    if (firstInvalid) {
      if (firstInvalid === 'email' || firstInvalid === 'address') setAdditionalOpen(true);
      window.requestAnimationFrame(() => focusField(firstInvalid));
      return;
    }

    const phoneNumber = normalizePhone(values.phoneNumber);
    if (!phoneNumber) return;

    submittingRef.current = true;
    onSubmittingChange(true);
    try {
      await onSave({
        fullName: normalizedName(values.fullName),
        phoneNumber,
        email: values.email.trim(),
        address: values.address.trim(),
      });
    } catch {
      // The parent supplies a localized ApiError; current values remain unchanged.
    } finally {
      submittingRef.current = false;
      onSubmittingChange(false);
    }
  };

  const formError = serverError && Object.keys(serverError.fieldErrors).length === 0
    ? t(serverError.key)
    : undefined;

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <label htmlFor="fullName" className="mb-1 block text-sm font-semibold text-text-main">{t('name')}</label>
        <input
          ref={fullNameRef}
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          dir="auto"
          value={values.fullName}
          onChange={(event) => updateField('fullName', event.target.value)}
          onBlur={() => blurField('fullName')}
          aria-invalid={Boolean(fieldMessage('fullName'))}
          aria-describedby={fieldMessage('fullName') ? 'fullName-error' : undefined}
          className="w-full cursor-text rounded-md border border-border bg-surface px-3 py-2 text-text-main outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        {fieldMessage('fullName') && <p id="fullName-error" className="mt-1 text-sm text-danger" role="alert">{fieldMessage('fullName')}</p>}
      </div>

      <PhoneField
        value={values.phoneNumber}
        onChange={(value) => updateField('phoneNumber', value)}
        onBlur={() => blurField('phoneNumber')}
        error={fieldMessage('phoneNumber')}
      />

      <div>
        <button
          id="additional-data-toggle"
          type="button"
          aria-expanded={additionalOpen}
          aria-controls="additional-data-fields"
          onClick={() => setAdditionalOpen((open) => !open)}
          className="cursor-pointer rounded-md border border-border px-3 py-2 text-start font-semibold text-primary transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-primary"
        >
          {t('additionalData')}
        </button>
        <div id="additional-data-fields" hidden={!additionalOpen} className="mt-4 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-text-main">{t('email')}</label>
            <input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              dir="ltr"
              value={values.email}
              onChange={(event) => updateField('email', event.target.value)}
              onBlur={() => blurField('email')}
              aria-invalid={Boolean(fieldMessage('email'))}
              aria-describedby={fieldMessage('email') ? 'email-error' : undefined}
              className="w-full cursor-text rounded-md border border-border bg-surface px-3 py-2 text-start text-text-main outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            {fieldMessage('email') && <p id="email-error" className="mt-1 text-sm text-danger" role="alert">{fieldMessage('email')}</p>}
          </div>
          <div>
            <label htmlFor="address" className="mb-1 block text-sm font-semibold text-text-main">{t('address')}</label>
            <textarea
              ref={addressRef}
              id="address"
              name="address"
              rows={2}
              dir="auto"
              value={values.address}
              onChange={(event) => updateField('address', event.target.value)}
              onBlur={() => blurField('address')}
              aria-invalid={Boolean(fieldMessage('address'))}
              aria-describedby={fieldMessage('address') ? 'address-error' : undefined}
              className="w-full cursor-text rounded-md border border-border bg-surface px-3 py-2 text-text-main outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            {fieldMessage('address') && <p id="address-error" className="mt-1 text-sm text-danger" role="alert">{fieldMessage('address')}</p>}
          </div>
          <p className="text-sm text-text-muted">{t('visitHelper')}</p>
        </div>
      </div>

      {formError && <p role="alert" className="rounded-md bg-danger/10 p-3 text-sm text-danger">{formError}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" disabled={saving} onClick={onCancel} className="cursor-pointer rounded-md border border-border px-4 py-2 text-text-main transition-colors enabled:hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50">
          {t('cancel')}
        </button>
        <button type="submit" disabled={saving} aria-busy={saving} className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-transparent bg-primary px-4 py-2 font-semibold text-primary-text transition-colors enabled:hover:border-primary enabled:hover:bg-cta-hover enabled:hover:text-primary disabled:cursor-not-allowed disabled:opacity-60">
          {saving && <span className="size-4 animate-spin rounded-full border-2 border-primary-text border-e-transparent motion-reduce:animate-none" aria-hidden="true" />}
          {saving ? t('saving') : t('save')}
        </button>
      </div>
    </form>
  );
}
