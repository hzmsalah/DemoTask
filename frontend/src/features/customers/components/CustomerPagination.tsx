import { useLanguage } from '../../../context/LanguageContext';

interface CustomerPaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export function CustomerPagination({ page, totalPages, totalCount, onPageChange }: CustomerPaginationProps) {
  const { language, t } = useLanguage();
  const numberLocale = language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB';
  const number = (value: number) => new Intl.NumberFormat(numberLocale, { useGrouping: false }).format(value);

  return (
    <nav className="flex flex-wrap items-center justify-center gap-3 rounded-md border border-border bg-surface p-3" aria-label={t('pagination')}>
      <button
        type="button"
        aria-label={t('previous')}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="cursor-pointer rounded-md border border-border px-3 py-2 text-text-main transition-colors enabled:hover:bg-surface-hover enabled:hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {t('previous')}
      </button>
      <span className="text-sm text-text-muted" aria-live="polite">
        {t('page')} {number(page)} {t('of')} {number(totalPages)}
      </span>
      <button
        type="button"
        aria-label={t('next')}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="cursor-pointer rounded-md border border-border px-3 py-2 text-text-main transition-colors enabled:hover:bg-surface-hover enabled:hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {t('next')}
      </button>
      <span className="text-sm text-text-muted">{t('totalCustomers')}: {number(totalCount)}</span>
    </nav>
  );
}
