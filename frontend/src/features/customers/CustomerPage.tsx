import { useEffect, useMemo, useState } from 'react';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { EmptyState } from '../../components/common/EmptyState';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { BackToTopButton } from '../../components/common/BackToTopButton';
import { scrollToTopAndWait } from '../../components/common/scrollToTop';
import { useLanguage } from '../../context/LanguageContext';
import type { TranslationKey } from '../../locales/en';
import { ApiError, networkApiError } from '../../services/apiError';
import type { Customer, CustomerInput } from './types/customer.types';
import { CustomerFormModal } from './components/CustomerFormModal';
import { CustomerList } from './components/CustomerList';
import { CustomerPagination } from './components/CustomerPagination';
import { CustomerSearch } from './components/CustomerSearch';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { useCustomers } from './hooks/useCustomers';

function toFormInput(customer: Customer): CustomerInput {
  return {
    fullName: customer.fullName,
    phoneNumber: customer.phoneNumber,
    email: customer.email ?? '',
    address: customer.address ?? '',
  };
}

function normalizeApiError(error: unknown): ApiError {
  return error instanceof ApiError ? error : networkApiError();
}

export function CustomerPage() {
  const { t } = useLanguage();
  const data = useCustomers();
  const [formCustomer, setFormCustomer] = useState<Customer | null | undefined>(undefined);
  const [formError, setFormError] = useState<ApiError | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleteError, setDeleteError] = useState<ApiError | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [successKey, setSuccessKey] = useState<TranslationKey | null>(null);
  const initialForm = useMemo(() => formCustomer ? toFormInput(formCustomer) : null, [formCustomer]);

  useEffect(() => {
    if (!successKey) return;
    const timeout = window.setTimeout(() => setSuccessKey(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [successKey]);

  const openCreate = () => {
    setFormError(null);
    setSuccessKey(null);
    setFormCustomer(null);
  };

  const openEdit = (customer: Customer) => {
    setFormError(null);
    setSuccessKey(null);
    setFormCustomer(customer);
  };

  const openDelete = (customer: Customer) => {
    setDeleteError(null);
    setDeleteTarget(customer);
  };

  const closeForm = () => {
    setFormCustomer(undefined);
    setFormError(null);
  };

  const closeDelete = () => {
    if (deleteBusy) return;
    setDeleteTarget(null);
    setDeleteError(null);
  };

  const saveCustomer = async (input: CustomerInput) => {
    setFormError(null);
    const isEdit = Boolean(formCustomer);
    try {
      if (isEdit && formCustomer) await data.update(formCustomer.id, input);
      else await data.create(input);
      setFormCustomer(undefined);
      setSuccessKey(isEdit ? 'savedUpdate' : 'savedCreate');
    } catch (error) {
      const apiError = normalizeApiError(error);
      setFormError(apiError);
      throw apiError;
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await data.remove(deleteTarget.id);
      setDeleteTarget(null);
      setSuccessKey('deleted');
    } catch (error) {
      setDeleteError(normalizeApiError(error));
    } finally {
      setDeleteBusy(false);
    }
  };

  const changePage = async (page: number) => {
    await scrollToTopAndWait();
    document.getElementById('customer-records')?.focus({ preventScroll: true });
    data.setPage(page);
  };

  const hasCustomers = data.customers.length > 0;
  const showInitialLoading = data.status === 'loading' && !hasCustomers;
  const showInitialError = data.status === 'error' && !hasCustomers;

  return (
    <div className="flex min-h-screen flex-col bg-bg text-text-main">
      <header className="border-b-4 border-brand-accent bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/brand/shaghaf-mark.svg" alt="" aria-hidden="true" className="size-12 shrink-0 object-contain sm:size-16" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-primary sm:text-2xl">{t('appTitle')}</h1>
              <p className="mt-1 text-sm text-text-muted">{t('appSubtitle')}</p>
            </div>
          </div>
          <LanguageToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <CustomerSearch value={data.search} onChange={data.setSearch} onClear={() => data.setSearch('')} />
          <button type="button" onClick={openCreate} className="cursor-pointer rounded-md border border-transparent bg-primary px-5 py-3 font-bold text-primary-text shadow-sm transition-colors hover:border-primary hover:bg-cta-hover hover:text-primary">
            + {t('addCustomer')}
          </button>
        </div>

        {successKey && <p role="status" aria-live="polite" className="rounded-md bg-success/10 p-3 text-success">{t(successKey)}</p>}

        {showInitialLoading ? (
          <LoadingSpinner />
        ) : showInitialError ? (
          <ErrorBanner message={t(data.error?.key ?? 'error.network')} onRetry={data.reload} />
        ) : data.customers.length === 0 ? (
          <div aria-busy={data.isFetching}>
            {data.error && <ErrorBanner message={t(data.error.key)} onRetry={data.reload} />}
            <EmptyState
              searchTerm={data.search}
              onAddCustomer={openCreate}
              onClearSearch={() => data.setSearch('')}
            />
          </div>
        ) : (
          <>
            {data.error && <ErrorBanner message={t(data.error.key)} onRetry={data.reload} />}
            <div aria-busy={data.isFetching} className={data.isFetching ? 'opacity-60' : undefined}>
              <CustomerList items={data.customers} onEdit={openEdit} onDelete={openDelete} />
            </div>
            <CustomerPagination page={data.page} totalPages={data.totalPages} totalCount={data.totalCount} onPageChange={changePage} />
          </>
        )}
      </main>

      <footer id="page-footer" aria-label={t('footerTitle')} className="border-t-4 border-brand-accent bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-start">
            <h2 className="text-sm font-semibold text-primary">{t('footerTitle')}</h2>
            <div className="flex flex-col gap-2 text-sm text-text-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
              <p><span className="font-semibold text-text-main">{t('githubRepository')}:</span>{' '}<span>{t('githubPlaceholder')}</span></p>
            </div>
          </div>
          <p className="mt-4 text-start text-sm leading-relaxed text-text-muted">{t('footerDisclaimer')}</p>
        </div>
      </footer>

      <CustomerFormModal
        open={formCustomer !== undefined}
        initial={initialForm}
        serverError={formError}
        onClose={closeForm}
        onSave={saveCustomer}
        onClearServerError={() => setFormError(null)}
      />

      <DeleteConfirmModal
        customer={deleteTarget}
        open={deleteTarget !== null}
        onClose={closeDelete}
        onConfirm={confirmDelete}
        busy={deleteBusy}
        error={deleteError}
      />
      <BackToTopButton />
    </div>
  );
}
