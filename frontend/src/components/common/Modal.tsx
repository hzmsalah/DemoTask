import { useEffect, useRef, type ReactNode } from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  describedBy?: string;
  initialFocusId?: string;
  locked?: boolean;
}

export function Modal({
  open,
  title,
  children,
  onClose,
  describedBy,
  initialFocusId,
  locked = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const lockedRef = useRef(locked);
  const { t } = useLanguage();
  onCloseRef.current = onClose;
  lockedRef.current = locked;

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const dialog = dialogRef.current;
    const target = initialFocusId ? document.getElementById(initialFocusId) : null;
    if (target instanceof HTMLElement && dialog?.contains(target)) target.focus();
    else closeRef.current?.focus();

    const focusableElements = () => {
      const selector = 'a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])';
      return Array.from(dialog?.querySelectorAll<HTMLElement>(selector) ?? [])
        .filter((element) => !element.closest('[hidden]') && element.getAttribute('aria-hidden') !== 'true');
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!lockedRef.current) {
          event.preventDefault();
          onCloseRef.current();
        }
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = focusableElements();
      if (focusable.length === 0) {
        event.preventDefault();
        dialog?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!dialog?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [initialFocusId, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-text-main/45 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !lockedRef.current) onCloseRef.current();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-lg rounded-lg border border-border bg-surface p-6 text-text-main shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={describedBy}
        aria-busy={locked}
        tabIndex={-1}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id="modal-title" className="text-xl font-bold">{title}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => { if (!lockedRef.current) onCloseRef.current(); }}
            aria-label={t('close')}
            disabled={locked}
            className="cursor-pointer rounded-md p-2 text-text-muted transition-colors enabled:hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
