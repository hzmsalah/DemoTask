import { Modal } from '../../../components/common/Modal';
import { useLanguage } from '../../../context/LanguageContext';
import type { ApiError } from '../../../services/apiError';
import type { Customer } from '../types/customer.types';

interface DeleteConfirmModalProps {
  customer: Customer | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  busy: boolean;
  error: ApiError | null;
}

export function DeleteConfirmModal({ customer, open, onClose, onConfirm, busy, error }: DeleteConfirmModalProps) {
  const { t } = useLanguage();

  return (
    <Modal
      open={open}
      title={t('confirmDelete')}
      onClose={onClose}
      describedBy="delete-description"
      initialFocusId="cancel-delete"
      locked={busy}
    >
      <div id="delete-description" className="space-y-2 text-text-muted">
        <p className="font-semibold text-text-main">{customer?.fullName}</p>
        <p>{t('deleteMessage')}</p>
      </div>
      {error && <p role="alert" className="mt-4 rounded-md bg-danger/10 p-3 text-sm text-danger">{t(error.key)}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <button
          id="cancel-delete"
          type="button"
          disabled={busy}
          onClick={onClose}
          className="cursor-pointer rounded-md border border-border px-4 py-2 text-text-main transition-colors enabled:hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('cancel')}
        </button>
        <button
          type="button"
          disabled={busy}
          aria-busy={busy}
          onClick={() => { void onConfirm(); }}
          className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-danger px-4 py-2 font-semibold text-danger-text transition-colors enabled:hover:bg-danger-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy && <span className="size-4 animate-spin rounded-full border-2 border-danger-text border-e-transparent motion-reduce:animate-none" aria-hidden="true" />}
          {busy ? t('deleting') : t('confirm')}
        </button>
      </div>
    </Modal>
  );
}
