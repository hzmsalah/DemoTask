import { useId, useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import type { Customer } from '../types/customer.types';
import { CustomerCard } from './CustomerCard';
import { CustomerTableRow } from './CustomerTableRow';

interface CustomerListProps {
  items: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export function CustomerList({ items, onEdit, onDelete }: CustomerListProps) {
  const { t } = useLanguage();
  const cardGridId = useId();
  const [expandedCustomerIds, setExpandedCustomerIds] = useState<Set<string>>(() => new Set());
  const [expandAllPages, setExpandAllPages] = useState(false);
  const isCardExpanded = (id: string) => expandAllPages || expandedCustomerIds.has(id);
  const allCardsExpanded = items.length > 0 && items.every(({ id }) => isCardExpanded(id));

  const toggleAllCardDetails = () => {
    const expand = !allCardsExpanded;
    setExpandAllPages(expand);
    setExpandedCustomerIds((current) => {
      const next = new Set(current);
      for (const { id } of items) {
        if (expand) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const setCardDetailsExpanded = (id: string, expanded: boolean) => {
    if (expandAllPages) {
      setExpandAllPages(false);
    }
    setExpandedCustomerIds((current) => {
      const next = new Set(current);
      if (expandAllPages) {
        for (const item of items) next.add(item.id);
      }
      if (expanded) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <section id="customer-records" tabIndex={-1} aria-label={t('customerRecords')} className="scroll-mt-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface shadow-sm lg:block">
        <table className="w-full border-collapse text-center">
          <thead className="bg-primary text-sm text-primary-text">
            <tr>
              <th scope="col" className="px-4 py-3 text-center">{t('name')}</th>
              <th scope="col" className="px-4 py-3 text-center">{t('phone')}</th>
              <th scope="col" className="px-4 py-3 text-center">{t('email')}</th>
              <th scope="col" className="px-4 py-3 text-center">{t('address')}</th>
              <th scope="col" className="px-4 py-3 text-center">{t('firstVisit')}</th>
              <th scope="col" className="px-4 py-3 text-center">{t('lastVisit')}</th>
              <th scope="col" className="px-4 py-3 text-center">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((customer) => (
              <CustomerTableRow key={customer.id} customer={customer} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="lg:hidden">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 shadow-sm">
          <h2 className="text-base font-bold text-text-main">{t('customerRecords')}</h2>
          {items.length > 0 && (
            <button
              type="button"
              aria-expanded={allCardsExpanded}
              aria-controls={cardGridId}
              onClick={toggleAllCardDetails}
              className="shrink-0 cursor-pointer rounded-md border border-border px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-primary"
            >
              {allCardsExpanded ? t('hideAllDetails') : t('showAllDetails')}
            </button>
          )}
        </div>
        <div id={cardGridId} className="grid grid-cols-1 items-start gap-3 md:grid-cols-2">
          {items.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onEdit={onEdit}
              onDelete={onDelete}
              detailsExpanded={isCardExpanded(customer.id)}
              onDetailsExpandedChange={(expanded) => setCardDetailsExpanded(customer.id, expanded)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
