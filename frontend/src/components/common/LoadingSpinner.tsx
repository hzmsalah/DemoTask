import { useLanguage } from '../../context/LanguageContext';

export function LoadingSpinner() {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-center gap-3 p-12 text-text-muted" role="status" aria-live="polite">
      <img src="/brand/shaghaf-mark.svg" alt="" aria-hidden="true" className="size-10 shrink-0 shaghaf-loading-mark" />
      <span>{t('loading')}</span>
    </div>
  );
}
