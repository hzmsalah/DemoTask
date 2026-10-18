import { useCallback, useEffect, useState } from 'react';
import { ApiError, networkApiError } from '../../../services/apiError';
import { createCustomer, deleteCustomer, getCustomers, updateCustomer } from '../../../services/customerService';
import type { Customer, CustomerInput } from '../types/customer.types';
import { useDebounce } from './useDebounce';

const PAGE_SIZE = 20;
type RequestStatus = 'loading' | 'success' | 'error';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPageState] = useState(1);
  const [search, setSearchState] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [hasSucceeded, setHasSucceeded] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPageState(1);
  }, []);

  const setPage = useCallback((value: number) => {
    setPageState(Math.max(1, Math.min(Math.trunc(value), totalPages)));
  }, [totalPages]);

  const reload = useCallback(() => setReloadCount((current) => current + 1), []);

  useEffect(() => {
    let active = true;
    if (search !== debouncedSearch) {
      setIsFetching(true);
      return () => { active = false; };
    }

    const controller = new AbortController();
    setIsFetching(true);
    setError(null);

    getCustomers(debouncedSearch, page, PAGE_SIZE, controller.signal)
      .then((result) => {
        if (!active) return;
        if (result.totalCount > 0 && page > result.totalPages) {
          setPageState(Math.max(1, result.totalPages));
          return;
        }
        setCustomers(result.items);
        setTotalCount(result.totalCount);
        setHasSucceeded(true);
      })
      .catch((requestError: unknown) => {
        if (!active || controller.signal.aborted) return;
        if (requestError instanceof ApiError) setError(requestError);
        else setError(networkApiError());
      })
      .finally(() => {
        if (active) setIsFetching(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [debouncedSearch, page, reloadCount, search]);

  const create = useCallback(async (input: CustomerInput): Promise<void> => {
    await createCustomer(input);
    setPageState(1);
    reload();
  }, [reload]);

  const update = useCallback(async (id: string, input: CustomerInput): Promise<void> => {
    await updateCustomer(id, input);
    reload();
  }, [reload]);

  const remove = useCallback(async (id: string): Promise<void> => {
    await deleteCustomer(id);
    if (page > 1 && customers.length === 1) setPageState(page - 1);
    else reload();
  }, [customers.length, page, reload]);

  const status: RequestStatus = !hasSucceeded && isFetching
    ? 'loading'
    : error
      ? 'error'
      : 'success';

  return {
    customers,
    totalCount,
    page,
    totalPages,
    search,
    status,
    isFetching,
    error,
    setSearch,
    setPage,
    reload,
    create,
    update,
    remove,
  };
}
