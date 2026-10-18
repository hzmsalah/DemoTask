import { isValidPhoneNumber, parsePhoneNumberFromString } from 'libphonenumber-js/max';

const DEFAULT_REGION = 'EG';

export function toWesternDigits(value: string): string {
  return Array.from(value, (character) => {
    const codePoint = character.codePointAt(0);
    if (codePoint !== undefined && codePoint >= 0x0660 && codePoint <= 0x0669) {
      return String.fromCharCode(0x30 + codePoint - 0x0660);
    }
    if (codePoint !== undefined && codePoint >= 0x06f0 && codePoint <= 0x06f9) {
      return String.fromCharCode(0x30 + codePoint - 0x06f0);
    }
    return character;
  }).join('');
}

export function normalizePhone(input: string | null | undefined): string | null {
  if (!input || !input.trim()) return null;

  const normalized = toWesternDigits(input).trim();
  if (!isValidPhoneNumber(normalized, DEFAULT_REGION)) return null;
  const parsed = parsePhoneNumberFromString(normalized, DEFAULT_REGION);
  if (!parsed || parsed.ext) return null;
  return parsed.number;
}

export function isValidPhone(input: string | null | undefined): boolean {
  return normalizePhone(input) !== null;
}

/** Produces a searchable fragment; it deliberately does not validate phone numbers. */
export function normalizePhoneSearch(input: string): string {
  const value = toWesternDigits(input.trim()).replace(/[\s().-]/g, '');
  if (!value) return '';

  if (value.startsWith('+')) {
    return /^\+[0-9]+$/.test(value) ? value : '';
  }

  if (value.startsWith('00')) {
    const digits = value.slice(2);
    return /^[0-9]+$/.test(digits) ? `+${digits}` : '';
  }

  if (!/^[0-9]+$/.test(value)) return '';
  return value.replace(/^0+/, '');
}

export function formatPhoneForDisplay(value: string): string {
  const parsed = parsePhoneNumberFromString(value);
  return parsed?.isValid() ? parsed.formatInternational() : value;
}
