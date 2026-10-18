export const validationCodes = [
  'fullName.required',
  'fullName.length',
  'phoneNumber.required',
  'phoneNumber.invalid',
  'phoneNumber.duplicate',
  'email.invalid',
  'email.tooLong',
  'address.tooLong',
] as const;

export type ValidationCode = (typeof validationCodes)[number];

export function isValidationCode(value: string): value is ValidationCode {
  return (validationCodes as readonly string[]).includes(value);
}
