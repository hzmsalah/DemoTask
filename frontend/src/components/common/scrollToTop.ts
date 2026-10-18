const SCROLL_END_FALLBACK_MS = 1800;

function getScrollBehavior(): ScrollBehavior {
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  return prefersReducedMotion ? 'auto' : 'smooth';
}

export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: getScrollBehavior() });
}

export function scrollToTopAndWait(): Promise<void> {
  const behavior = getScrollBehavior();
  if (behavior === 'auto' || window.scrollY <= 0) {
    window.scrollTo({ top: 0, behavior });
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let timeoutId: number | undefined;
    const finish = () => {
      document.removeEventListener('scrollend', finish);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      resolve();
    };

    document.addEventListener('scrollend', finish, { once: true });
    timeoutId = window.setTimeout(finish, SCROLL_END_FALLBACK_MS);
    window.scrollTo({ top: 0, behavior });
  });
}
