import { useLanguage } from '../../../context/LanguageContext';
import type { Customer } from '../types/customer.types';
import { formatPhoneForDisplay } from '../utils/phone';

interface CustomerCardProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  detailsExpanded: boolean;
  onDetailsExpandedChange: (expanded: boolean) => void;
}

function formatDate(value: string | null, language: 'ar' | 'en'): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const locale = language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

export function CustomerCard({ customer, onEdit, onDelete, detailsExpanded, onDetailsExpandedChange }: CustomerCardProps) {
  const { language, t } = useLanguage();
  const detailsId = `customer-details-${customer.id}`;

  return (
    <article className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-bold text-text-main">{customer.fullName}</h2>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => onEdit(customer)} aria-label={`${t('edit')} ${customer.fullName}`} className="cursor-pointer rounded-md p-2 text-primary transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary">
            <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
              <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
              <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
            </svg>
          </button>
          <button type="button" onClick={() => onDelete(customer)} aria-label={`${t('delete')} ${customer.fullName}`} className="cursor-pointer rounded-md p-2 text-danger transition-colors hover:bg-danger/10 focus-visible:ring-2 focus-visible:ring-danger">
            <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
              <path fillRule="evenodd" clipRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" />
            </svg>
          </button>
        </div>
      </div>
      <dl className="mt-4 grid gap-3 text-sm">
        <div>
          <dt className="font-semibold text-text-muted">{t('phone')}</dt>
          <dd dir="ltr" className="text-start font-semibold text-text-main">{formatPhoneForDisplay(customer.phoneNumber)}</dd>
        </div>
      </dl>
      <button
        type="button"
        aria-expanded={detailsExpanded}
        aria-controls={detailsId}
        onClick={() => onDetailsExpandedChange(!detailsExpanded)}
        className="mt-3 inline-flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-start text-sm font-semibold text-primary transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span>{t('additionalData')}</span>
        <svg className={`size-4 transition-transform ${detailsExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" focusable="false">
          <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div id={detailsId} hidden={!detailsExpanded}>
        <dl className="mt-3 grid gap-3 text-sm">
          <div>
            <dt className="font-semibold text-text-muted">{t('email')}</dt>
            <dd dir="ltr" className="text-start text-text-main">{customer.email ?? t('noEmail')}</dd>
          </div>
          <div>
            <dt className="font-semibold text-text-muted">{t('address')}</dt>
            <dd className="text-text-main">{customer.address ?? t('noAddress')}</dd>
          </div>
          <div>
            <dt className="font-semibold text-text-muted">{t('firstVisit')}</dt>
            <dd className="text-text-main">{formatDate(customer.createdAt, language)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-text-muted">{t('lastVisit')}</dt>
            <dd className="text-text-main">{formatDate(customer.lastVisit, language)}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
