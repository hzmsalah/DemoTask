import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Customer, PagedResult } from '../types/customer.types';
import { useCustomers } from './useCustomers';

const fetchMock = vi.fn<typeof fetch>();

function customer(name: string, id: string): Customer {
  return {
    id,
    fullName: name,
    phoneNumber: '+201012345678',
    email: null,
    address: null,
    createdAt: '2026-10-17T10:00:00Z',
    lastVisit: null,
  };
}

function pageResult(pageNumber: number, items: Customer[], totalCount: number): PagedResult<Customer> {
  const pageSize = 20;
  const totalPages = Math.ceil(totalCount / pageSize);
  return {
    items,
    totalCount,
    pageNumber,
    pageSize,
    totalPages,
    hasPreviousPage: pageNumber > 1,
    hasNextPage: pageNumber < totalPages,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('useCustomers', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(jsonResponse(pageResult(1, [], 0)));
  });

  it('resets page synchronously and sends trimmed Arabic text after 350ms', async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = new URL(String(input), 'http://localhost');
      const pageNumber = Number(url.searchParams.get('page'));
      return jsonResponse(pageResult(pageNumber, [], 45));
    });
    const { result } = renderHook(() => useCustomers());
    await waitFor(() => expect(result.current.status).toBe('success'));

    act(() => result.current.setPage(3));
    await waitFor(() => expect(result.current.page).toBe(3));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    act(() => result.current.setSearch('  أحمد  '));
    expect(result.current.page).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3), { timeout: 1500 });
    expect(String(fetchMock.mock.calls[2]?.[0])).toContain('search=%D8%A3%D8%AD%D9%85%D8%AF&page=1&pageSize=20');
  });

  it('aborts the old fetch and ignores its late response', async () => {
    let oldSignal: AbortSignal | null | undefined;
    let resolveOld: ((response: Response) => void) | undefined;
    const oldCustomer = customer('Stale result', 'old-id');
    const newCustomer = customer('Current result', 'new-id');
    fetchMock
      .mockImplementationOnce((_input, init) => {
        oldSignal = init?.signal;
        return new Promise<Response>((resolve) => { resolveOld = resolve; });
      })
      .mockResolvedValueOnce(jsonResponse(pageResult(1, [newCustomer], 1)));

    const { result } = renderHook(() => useCustomers());
    act(() => result.current.setSearch('new'));
    expect(oldSignal?.aborted).toBe(true);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2), { timeout: 1500 });
    await waitFor(() => expect(result.current.customers[0]?.fullName).toBe('Current result'));

    await act(async () => {
      resolveOld?.(jsonResponse(pageResult(1, [oldCustomer], 1)));
      await Promise.resolve();
    });
    expect(result.current.customers[0]?.fullName).toBe('Current result');
  });

  it('moves to the previous page after deleting its last row', async () => {
    const first = customer('First page', 'first-id');
    const last = customer('Last page', 'last-id');
    fetchMock.mockImplementation(async (input, init) => {
      if (init?.method === 'DELETE') return new Response(null, { status: 204 });
      const url = new URL(String(input), 'http://localhost');
      const pageNumber = Number(url.searchParams.get('page'));
      return jsonResponse(pageResult(pageNumber, [pageNumber === 2 ? last : first], 21));
    });

    const { result } = renderHook(() => useCustomers());
    await waitFor(() => expect(result.current.status).toBe('success'));
    act(() => result.current.setPage(2));
    await waitFor(() => expect(result.current.page).toBe(2));
    await waitFor(() => expect(result.current.customers[0]?.id).toBe('last-id'));

    await act(async () => { await result.current.remove(last.id); });
    await waitFor(() => expect(result.current.page).toBe(1));
    await waitFor(() => expect(String(fetchMock.mock.calls.at(-1)?.[0])).toContain('page=1&pageSize=20'));
  });
});
