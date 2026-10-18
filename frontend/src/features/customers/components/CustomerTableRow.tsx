import { useLanguage } from '../../../context/LanguageContext';
import type { Customer } from '../types/customer.types';
import { formatPhoneForDisplay } from '../utils/phone';

interface CustomerTableRowProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

function formatDate(value: string | null, language: 'ar' | 'en'): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const locale = language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

export function CustomerTableRow({ customer, onEdit, onDelete }: CustomerTableRowProps) {
  const { language, t } = useLanguage();

  return (
    <tr className="border-b border-border last:border-b-0">
      <th scope="row" className="px-4 py-3 text-center font-semibold text-text-main">{customer.fullName}</th>
      <td dir="ltr" className="px-4 py-3 text-center font-semibold text-text-main">{formatPhoneForDisplay(customer.phoneNumber)}</td>
      <td dir="ltr" className="px-4 py-3 text-center text-text-muted">{customer.email ?? t('noEmail')}</td>
      <td className="px-4 py-3 text-center text-text-muted">{customer.address ?? t('noAddress')}</td>
      <td className="px-4 py-3 text-center text-text-muted">{formatDate(customer.createdAt, language)}</td>
      <td className="px-4 py-3 text-center text-text-muted">{formatDate(customer.lastVisit, language)}</td>
      <td className="px-4 py-3 text-center">
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => onEdit(customer)} aria-label={`${t('edit')} ${customer.fullName}`} className="action-tooltip-trigger cursor-pointer rounded-md p-2 text-primary transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary">
            <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
              <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
              <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
            </svg>
            <span className="action-tooltip" aria-hidden="true">{t('edit')}</span>
          </button>
          <button type="button" onClick={() => onDelete(customer)} aria-label={`${t('delete')} ${customer.fullName}`} className="action-tooltip-trigger cursor-pointer rounded-md p-2 text-danger transition-colors hover:bg-danger/10 focus-visible:ring-2 focus-visible:ring-danger">
            <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
              <path fillRule="evenodd" clipRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" />
            </svg>
            <span className="action-tooltip" aria-hidden="true">{t('delete')}</span>
          </button>
        </div>
      </td>
    </tr>
  );
}
