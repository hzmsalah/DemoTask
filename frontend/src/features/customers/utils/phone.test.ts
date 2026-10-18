import vectors from '../../../../../shared/phone-vectors.json';
import { describe, expect, it } from 'vitest';
import { formatPhoneForDisplay, isValidPhone, normalizePhone, normalizePhoneSearch, toWesternDigits } from './phone';

describe('shared phone vectors', () => {
  for (const vector of vectors.valid) {
    it(`normalizes ${vector.input} to E.164`, () => {
      expect(normalizePhone(vector.input)).toBe(vector.e164);
      expect(isValidPhone(vector.input)).toBe(true);
    });
  }

  for (const vector of vectors.invalid) {
    it(`rejects invalid input ${String(vector.input)}`, () => {
      expect(normalizePhone(vector.input)).toBeNull();
      expect(isValidPhone(vector.input)).toBe(false);
    });
  }

  for (const vector of vectors.search) {
    it(`normalizes search fragment ${vector.input}`, () => {
      expect(normalizePhoneSearch(vector.input)).toBe(vector.fragment);
    });
  }

  it('formats valid E.164 numbers for display without changing the stored value', () => {
    expect(formatPhoneForDisplay('+201012345678')).toMatch(/^\+20/);
    expect(toWesternDigits('\u0660\u0661\u06f2')).toBe('012');
  });
});
