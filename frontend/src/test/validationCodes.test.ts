import sharedCodes from '../../../shared/validation-codes.json';
import { describe, expect, it } from 'vitest';
import { ar } from '../locales/ar';
import { en } from '../locales/en';
import { validationCodes } from '../features/customers/types/validationCodes';

describe('validation code contract', () => {
  it('matches the shared code list exactly and translates every code in both locales', () => {
    expect([...validationCodes].sort()).toEqual([...sharedCodes].sort());
    for (const code of validationCodes) {
      const key = `validation.${code}` as const;
      expect(en[key]).not.toBe('');
      expect(ar[key]).not.toBe('');
    }
  });

  it('includes all generic API error messages in both locales', () => {
    const keys = ['error.validation', 'error.notFound', 'error.server', 'error.network'] as const;
    for (const key of keys) {
      expect(en[key]).not.toBe('');
      expect(ar[key]).not.toBe('');
    }
  });
});
