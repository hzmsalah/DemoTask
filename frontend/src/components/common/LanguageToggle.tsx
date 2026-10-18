import { useLanguage } from '../../context/LanguageContext';

export function LanguageToggle() {
  const { t, toggle } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t('languageLabel')}
      className="cursor-pointer rounded-md border border-border bg-surface px-3 py-2 text-sm font-semibold text-text-main hover:bg-bg"
    >
      {t('language')}
    </button>
  );
}
