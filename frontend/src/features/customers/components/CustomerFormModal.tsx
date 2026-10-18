import { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import type { ApiError } from '../../../services/apiError';
import type { CustomerInput } from '../types/customer.types';
import { CustomerForm } from './CustomerForm';
import { Modal } from '../../../components/common/Modal';

interface CustomerFormModalProps {
  open: boolean;
  initial: CustomerInput | null;
  serverError: ApiError | null;
  onClose: () => void;
  onSave: (input: CustomerInput) => Promise<void>;
  onClearServerError: () => void;
}

export function CustomerFormModal({
  open,
  initial,
  serverError,
  onClose,
  onSave,
  onClearServerError,
}: CustomerFormModalProps) {
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);

  return (
    <Modal
      open={open}
      title={initial ? t('editCustomer') : t('addCustomer')}
      onClose={onClose}
      initialFocusId="fullName"
      locked={saving}
    >
      <CustomerForm
        initial={initial}
        serverError={serverError}
        saving={saving}
        onSave={onSave}
        onCancel={onClose}
        onClearServerError={onClearServerError}
        onSubmittingChange={setSaving}
      />
    </Modal>
  );
}
