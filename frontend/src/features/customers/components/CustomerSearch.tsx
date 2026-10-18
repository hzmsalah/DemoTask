import { useLanguage } from '../../../context/LanguageContext';

function getSearchDirection(value: string, fallbackLanguage: 'ar' | 'en'): 'rtl' | 'ltr' {
  const firstLetter = value.match(/\p{L}/u)?.[0];
  if (!firstLetter) return fallbackLanguage === 'ar' ? 'rtl' : 'ltr';
  return /[\u0590-\u08ff\uFB1D-\uFDFF\uFE70-\uFEFF]/u.test(firstLetter) ? 'rtl' : 'ltr';
}

interface CustomerSearchProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export function CustomerSearch({ value, onChange, onClear }: CustomerSearchProps) {
  const { language, t } = useLanguage();
  const direction = getSearchDirection(value, language);

  return (
    <div dir={direction} className="relative min-w-0 flex-1">
      <label className="sr-only" htmlFor="customer-search">{t('search')}</label>
      <input
        id="customer-search"
        type="search"
        dir={direction}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t('searchPlaceholder')}
        className="w-full cursor-text rounded-md border border-border bg-surface py-3 ps-4 pe-11 text-start text-text-main outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label={t('clearSearch')}
          className="search-clear-button action-tooltip-trigger cursor-pointer rounded-md p-2 text-text-muted transition-colors hover:bg-cta-hover hover:text-primary focus-visible:ring-2 focus-visible:ring-primary"
        >
          <svg className="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" focusable="false">
            <path d="m6 6 8 8M14 6l-8 8" strokeLinecap="round" />
          </svg>
          <span className="action-tooltip" aria-hidden="true">{t('clearSearch')}</span>
        </button>
      )}
    </div>
  );
}
