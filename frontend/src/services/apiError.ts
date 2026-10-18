import { isValidationCode, type ValidationCode } from '../features/customers/types/validationCodes';

export type CustomerField = 'fullName' | 'phoneNumber' | 'email' | 'address';
export type GenericErrorKey = 'error.validation' | 'error.notFound' | 'error.server' | 'error.network';
export type FieldErrors = Partial<Record<CustomerField, ValidationCode>>;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly key: GenericErrorKey,
    public readonly fieldErrors: FieldErrors = {},
  ) {
    super(key);
    this.name = 'ApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mapFieldName(value: string): CustomerField | null {
  switch (value.toLowerCase()) {
    case 'fullname': return 'fullName';
    case 'phonenumber': return 'phoneNumber';
    case 'email': return 'email';
    case 'address': return 'address';
    default: return null;
  }
}

function genericKey(status: number): GenericErrorKey {
  if (status === 0) return 'error.network';
  if (status === 404) return 'error.notFound';
  if (status >= 500) return 'error.server';
  return 'error.validation';
}

export function mapApiError(status: number, body: unknown): ApiError {
  const fieldErrors: FieldErrors = {};
  const root = isRecord(body) ? body : {};
  const rawErrors = root.errors;

  if ((status === 400 || status === 409) && isRecord(rawErrors)) {
    for (const [rawField, rawValues] of Object.entries(rawErrors)) {
      const field = mapFieldName(rawField);
      const values = Array.isArray(rawValues) ? rawValues : [rawValues];
      const code = values.find((value): value is ValidationCode => typeof value === 'string' && isValidationCode(value));
      if (field && code) fieldErrors[field] = code;
    }
  }

  return new ApiError(status, genericKey(status), fieldErrors);
}

export async function apiErrorFromResponse(response: Response): Promise<ApiError> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }
  return mapApiError(response.status, body);
}

export function networkApiError(): ApiError {
  return new ApiError(0, 'error.network');
}
