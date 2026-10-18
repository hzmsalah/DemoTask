import { useLanguage } from '../../context/LanguageContext';

interface ErrorBannerProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  const { t } = useLanguage();

  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-danger/30 bg-danger/10 p-4 text-danger">
      <span>{message ?? t('requestError')}</span>
      <button
        type="button"
        onClick={onRetry}
        className="cursor-pointer rounded-md bg-danger px-4 py-2 font-semibold text-danger-text hover:bg-danger-hover"
      >
        {t('retry')}
      </button>
    </div>
  );
}
