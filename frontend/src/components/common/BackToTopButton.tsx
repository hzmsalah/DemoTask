import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { scrollToTop } from './scrollToTop';

const SCROLL_THRESHOLD = 320;
const DEFAULT_BOTTOM_INSET = 24;
const FOOTER_GAP = 16;
const BUTTON_SIZE = 48;

export function BackToTopButton() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [bottomInset, setBottomInset] = useState(DEFAULT_BOTTOM_INSET);

  useEffect(() => {
    const updateVisibility = () => {
      const footer = document.getElementById('page-footer');
      const footerTop = footer?.getBoundingClientRect().top ?? window.innerHeight;
      const footerIsVisible = footer !== null && footerTop < window.innerHeight;
      const nextBottomInset = footerIsVisible
        ? Math.max(DEFAULT_BOTTOM_INSET, Math.ceil(window.innerHeight - footerTop + FOOTER_GAP))
        : DEFAULT_BOTTOM_INSET;
      const hasRoomAboveFooter = footer === null || footerTop >= BUTTON_SIZE + FOOTER_GAP;

      setBottomInset(nextBottomInset);
      setVisible(window.scrollY > SCROLL_THRESHOLD && hasRoomAboveFooter);
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility);
    return () => {
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
    };
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className="back-to-top-button fixed z-40 flex size-12 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-text shadow-lg transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none"
      style={{ insetBlockEnd: `${bottomInset}px` }}
      aria-label={t('backToTop')}
      title={t('backToTop')}
      onClick={scrollToTop}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
        <path d="M12 19V5m-7 7 7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
