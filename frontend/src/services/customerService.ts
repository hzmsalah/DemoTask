import type { Customer, CustomerInput, PagedResult } from '../features/customers/types/customer.types';
import { apiErrorFromResponse, ApiError, networkApiError } from './apiError';

async function request<T>(url: string, init: RequestInit = {}, signal?: AbortSignal): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers, signal });
  } catch (error) {
    if (signal?.aborted || (error instanceof Error && error.name === 'AbortError')) throw error;
    throw networkApiError();
  }

  if (!response.ok) throw await apiErrorFromResponse(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function customerBody(input: CustomerInput) {
  return {
    ...input,
    email: input.email.trim() || null,
    address: input.address.trim() || null,
  };
}

export function getCustomers(
  search: string,
  page: number,
  pageSize: number,
  signal?: AbortSignal,
): Promise<PagedResult<Customer>> {
  const params = new URLSearchParams();
  const term = search.trim();
  if (term) params.set('search', term);
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  return request<PagedResult<Customer>>(`/api/customers?${params.toString()}`, {}, signal);
}

export function getCustomer(id: string, signal?: AbortSignal): Promise<Customer> {
  return request<Customer>(`/api/customers/${encodeURIComponent(id)}`, {}, signal);
}

export function createCustomer(input: CustomerInput, signal?: AbortSignal): Promise<Customer> {
  return request<Customer>('/api/customers', { method: 'POST', body: JSON.stringify(customerBody(input)) }, signal);
}

export function updateCustomer(id: string, input: CustomerInput, signal?: AbortSignal): Promise<void> {
  return request<void>(`/api/customers/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(customerBody(input)) }, signal);
}

export function deleteCustomer(id: string, signal?: AbortSignal): Promise<void> {
  return request<void>(`/api/customers/${encodeURIComponent(id)}`, { method: 'DELETE' }, signal);
}

export { ApiError } from './apiError';
