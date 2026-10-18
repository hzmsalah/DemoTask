import { useLanguage } from '../../context/LanguageContext';

interface EmptyStateProps {
  searchTerm: string;
  onAddCustomer: () => void;
  onClearSearch: () => void;
}

export function EmptyState({ searchTerm, onAddCustomer, onClearSearch }: EmptyStateProps) {
  const { t } = useLanguage();
  const hasSearch = searchTerm.trim().length > 0;

  return (
    <section className="rounded-lg border border-dashed border-border bg-surface p-8 text-center sm:p-12" aria-live="polite">
      <h2 className="text-lg font-bold text-text-main">
        {hasSearch ? `${t('noSearchResults')} ${searchTerm.trim()}` : t('empty')}
      </h2>
      <p className="mt-2 text-text-muted">{hasSearch ? t('emptySearchHint') : t('emptyHint')}</p>
      <button
        type="button"
        onClick={hasSearch ? onClearSearch : onAddCustomer}
        className="mt-5 cursor-pointer rounded-md bg-primary px-4 py-2 font-semibold text-primary-text transition-colors hover:bg-cta-hover hover:text-primary"
      >
        {hasSearch ? t('clearSearch') : t('addFirstCustomer')}
      </button>
    </section>
  );
}
