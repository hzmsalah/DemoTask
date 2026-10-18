import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Customer, CustomerInput } from '../features/customers/types/customer.types';
import { ApiError, mapApiError } from './apiError';
import { createCustomer, deleteCustomer, getCustomer, getCustomers, updateCustomer } from './customerService';

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const customer: Customer = {
  id: 'a6d3901c-85a2-4e22-a09f-2fef5a13209f',
  fullName: 'Ada Lovelace',
  phoneNumber: '+201012345678',
  email: null,
  address: null,
  createdAt: '2026-10-17T10:00:00Z',
  lastVisit: null,
};

const input: CustomerInput = {
  fullName: 'Ada Lovelace',
  phoneNumber: '+201012345678',
  email: '  ',
  address: '',
};

describe('customerService', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('sends trimmed name and phone search terms to the API without client normalization', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ items: [], totalCount: 0, pageNumber: 1, pageSize: 20, totalPages: 0, hasPreviousPage: false, hasNextPage: false }));
    await getCustomers('  أحمد  ', 1, 20);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('/api/customers?search=%D8%A3%D8%AD%D9%85%D8%AF&page=1&pageSize=20');
  });

  it('omits an empty search parameter and uses the specified page size', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ items: [], totalCount: 0, pageNumber: 2, pageSize: 20, totalPages: 0, hasPreviousPage: true, hasNextPage: false }));
    await getCustomers('  ', 2, 20);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('/api/customers?page=2&pageSize=20');
  });

  it('uses the detail route and URL-encodes identifiers', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(customer));
    await getCustomer('customer/1');
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('/api/customers/customer%2F1');
  });

  it('sends null for blank optional values when creating', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(customer, 201));
    await createCustomer(input);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('/api/customers');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toMatchObject({ email: null, address: null });
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json');
  });

  it('handles 204 update and delete responses without parsing a body', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await updateCustomer(customer.id, input);
    await deleteCustomer(customer.id);
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('PUT');
    expect(fetchMock.mock.calls[1]?.[1]?.method).toBe('DELETE');
  });

  it('maps only known field codes and never retains server prose', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      title: 'secret title',
      detail: 'secret detail',
      errors: {
        PhoneNumber: ['phoneNumber.duplicate'],
        FullName: ['unknown internal message'],
        Internal: ['stack trace'],
      },
    }, 409));

    let caught: unknown;
    try {
      await createCustomer(input);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(ApiError);
    expect(caught).toMatchObject({ status: 409, key: 'error.validation', fieldErrors: { phoneNumber: 'phoneNumber.duplicate' } });
    expect((caught as Error).message).toBe('error.validation');
    expect(JSON.stringify(caught)).not.toContain('secret');
  });

  it('maps generic not-found, server, and network failures to localized keys', async () => {
    expect(mapApiError(404, { detail: 'hidden' })).toMatchObject({ key: 'error.notFound' });
    expect(mapApiError(503, { title: 'hidden' })).toMatchObject({ key: 'error.server' });
    fetchMock.mockRejectedValueOnce(new Error('private transport detail'));
    await expect(getCustomer(customer.id)).rejects.toMatchObject({ status: 0, key: 'error.network' });
  });
});
