import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../../context/LanguageContext';
import type { Customer } from '../types/customer.types';
import { CustomerList } from './CustomerList';

const customer: Customer = {
  id: 'a6d3901c-85a2-4e22-a09f-2fef5a13209f',
  fullName: 'Ada Lovelace',
  phoneNumber: '+201012345678',
  email: null,
  address: null,
  createdAt: '2026-10-17T10:00:00Z',
  lastVisit: null,
};

describe('CustomerList', () => {
  it('renders customer data in the table and card layouts', () => {
    render(
      <LanguageProvider initialLanguage="en">
        <CustomerList items={[customer]} onEdit={vi.fn()} onDelete={vi.fn()} />
      </LanguageProvider>,
    );

    expect(screen.getAllByText('Ada Lovelace')).toHaveLength(2);
    expect(screen.getAllByText('No email')).toHaveLength(2);
    expect(screen.getAllByText('No address')).toHaveLength(2);
    expect(screen.getAllByText('—')).toHaveLength(2);
    const phoneValues = screen.getAllByText(/^\+20/);
    expect(phoneValues).toHaveLength(2);
    expect(phoneValues.every((phone) => phone.classList.contains('font-semibold'))).toBe(true);

    const table = screen.getByRole('table');
    expect(table).toHaveClass('text-center');
    const tableHeader = table.querySelector('thead');
    if (!tableHeader) throw new Error('The desktop table header is missing.');
    expect(tableHeader).toHaveClass('bg-primary', 'text-primary-text');
    const tableCells = Array.from(table.querySelectorAll('th, td'));
    expect(tableCells.length).toBeGreaterThan(0);
    expect(tableCells.every((cell) => cell.classList.contains('text-center'))).toBe(true);
    const actions = table.querySelector('tbody tr td:last-child > div');
    if (!actions) throw new Error('The table actions are missing.');
    expect(actions).toHaveClass('justify-center');
    const tableEdit = within(table).getByRole('button', { name: 'Edit Ada Lovelace' });
    const tableDelete = within(table).getByRole('button', { name: 'Delete Ada Lovelace' });
    expect(tableEdit.querySelector('.action-tooltip')).toHaveTextContent('Edit');
    expect(tableDelete.querySelector('.action-tooltip')).toHaveTextContent('Delete');
    expect(tableEdit).toHaveAccessibleName('Edit Ada Lovelace');
    expect(tableDelete).toHaveAccessibleName('Delete Ada Lovelace');

    const card = screen.getByRole('article');
    expect(within(card).getByRole('button', { name: 'Edit Ada Lovelace' }).querySelector('.action-tooltip')).toBeNull();
    expect(card.parentElement).toHaveClass('grid-cols-1', 'items-start', 'md:grid-cols-2');
    expect(card.parentElement?.parentElement).toHaveClass('lg:hidden');
    const cardListHeading = screen.getByRole('heading', { name: 'Customer records' });
    const cardListToolbar = cardListHeading.parentElement;
    expect(cardListToolbar).toHaveClass('flex', 'items-center', 'justify-between');
    const showAllDetails = within(cardListToolbar as HTMLElement).getByRole('button', { name: 'Show all details' });
    expect(showAllDetails).toHaveClass('hover:bg-surface-hover');
    const detailsToggle = within(card).getByRole('button', { name: 'Additional Details' });
    expect(detailsToggle).toHaveClass('hover:bg-surface-hover');
    expect(detailsToggle).toHaveAttribute('aria-expanded', 'false');
    expect(within(card).getByText('No email')).not.toBeVisible();
    expect(within(card).getByText('No address')).not.toBeVisible();
  });

  it('reveals card email, address, and visit dates on demand', () => {
    render(
      <LanguageProvider initialLanguage="en">
        <CustomerList items={[customer]} onEdit={vi.fn()} onDelete={vi.fn()} />
      </LanguageProvider>,
    );

    const card = screen.getByRole('article');
    const detailsToggle = within(card).getByRole('button', { name: 'Additional Details' });
    const panelId = detailsToggle.getAttribute('aria-controls');
    const detailsPanel = panelId ? document.getElementById(panelId) : null;
    if (!detailsPanel) throw new Error('The customer details panel is missing.');
    expect(detailsPanel).not.toBeVisible();

    fireEvent.click(detailsToggle);

    expect(detailsToggle).toHaveAttribute('aria-expanded', 'true');
    expect(within(detailsPanel).getByText('No email')).toBeVisible();
    expect(within(detailsPanel).getByText('No address')).toBeVisible();
    expect(within(detailsPanel).getByText('First visit')).toBeVisible();
    expect(within(detailsPanel).getByText('Last visit')).toBeVisible();

    fireEvent.click(detailsToggle);
    expect(detailsToggle).toHaveAttribute('aria-expanded', 'false');
    expect(detailsPanel).not.toBeVisible();
  });

  it('keeps medium-grid disclosures independent between sibling cards', () => {
    const secondCustomer: Customer = {
      ...customer,
      id: 'f1471bbc-07f0-4d6e-a273-8ee06c48b726',
      fullName: 'Grace Hopper',
      phoneNumber: '+201055555555',
    };
    render(
      <LanguageProvider initialLanguage="en">
        <CustomerList items={[customer, secondCustomer]} onEdit={vi.fn()} onDelete={vi.fn()} />
      </LanguageProvider>,
    );

    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(2);
    expect(cards[0].parentElement).toHaveClass('items-start');
    const toggles = cards.map((card) => within(card).getByRole('button', { name: 'Additional Details' }));
    const panels = toggles.map((toggle) => {
      const panelId = toggle.getAttribute('aria-controls');
      const panel = panelId ? document.getElementById(panelId) : null;
      if (!panel) throw new Error('A customer details panel is missing.');
      return panel;
    });

    fireEvent.click(toggles[0]);

    expect(toggles[0]).toHaveAttribute('aria-expanded', 'true');
    expect(panels[0]).toBeVisible();
    expect(toggles[1]).toHaveAttribute('aria-expanded', 'false');
    expect(panels[1]).not.toBeVisible();
  });

  it('expands and collapses all current-page cards and stays synchronized with individual toggles', () => {
    const secondCustomer: Customer = {
      ...customer,
      id: 'f1471bbc-07f0-4d6e-a273-8ee06c48b726',
      fullName: 'Grace Hopper',
      phoneNumber: '+201055555555',
    };
    render(
      <LanguageProvider initialLanguage="en">
        <CustomerList items={[customer, secondCustomer]} onEdit={vi.fn()} onDelete={vi.fn()} />
      </LanguageProvider>,
    );

    const cards = screen.getAllByRole('article');
    const cardToggles = cards.map((card) => within(card).getByRole('button', { name: 'Additional Details' }));
    const detailsPanels = cardToggles.map((toggle) => {
      const panelId = toggle.getAttribute('aria-controls');
      const panel = panelId ? document.getElementById(panelId) : null;
      if (!panel) throw new Error('A customer details panel is missing.');
      return panel;
    });

    const showAll = () => screen.getByRole('button', { name: 'Show all details' });
    fireEvent.click(cardToggles[0]);
    expect(cardToggles[0]).toHaveAttribute('aria-expanded', 'true');
    expect(cardToggles[1]).toHaveAttribute('aria-expanded', 'false');
    expect(showAll()).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(showAll());
    expect(screen.getByRole('button', { name: 'Hide all details' })).toHaveAttribute('aria-expanded', 'true');
    expect(cardToggles.every((toggle) => toggle.getAttribute('aria-expanded') === 'true')).toBe(true);
    expect(detailsPanels.every((panel) => panel.hasAttribute('hidden') === false)).toBe(true);

    fireEvent.click(cardToggles[0]);
    expect(cardToggles[0]).toHaveAttribute('aria-expanded', 'false');
    expect(cardToggles[1]).toHaveAttribute('aria-expanded', 'true');
    expect(showAll()).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(showAll());
    fireEvent.click(screen.getByRole('button', { name: 'Hide all details' }));
    expect(screen.getByRole('button', { name: 'Show all details' })).toHaveAttribute('aria-expanded', 'false');
    expect(cardToggles.every((toggle) => toggle.getAttribute('aria-expanded') === 'false')).toBe(true);
    expect(detailsPanels.every((panel) => panel.hasAttribute('hidden'))).toBe(true);
  });

  it('carries show-all mode to new page items until an individual card is overridden', () => {
    const secondPageCustomers: Customer[] = [
      { ...customer, id: 'f1471bbc-07f0-4d6e-a273-8ee06c48b726', fullName: 'Grace Hopper' },
      { ...customer, id: 'e77f5f7d-9d6b-40cb-9b21-991d6a4f2b92', fullName: 'Katherine Johnson' },
    ];
    const props = { onEdit: vi.fn(), onDelete: vi.fn() };
    const { rerender } = render(
      <LanguageProvider initialLanguage="en">
        <CustomerList items={[customer]} {...props} />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show all details' }));
    rerender(
      <LanguageProvider initialLanguage="en">
        <CustomerList items={secondPageCustomers} {...props} />
      </LanguageProvider>,
    );

    let cards = screen.getAllByRole('article');
    let toggles = cards.map((card) => within(card).getByRole('button', { name: 'Additional Details' }));
    expect(toggles.every((toggle) => toggle.getAttribute('aria-expanded') === 'true')).toBe(true);
    expect(screen.getByRole('button', { name: 'Hide all details' })).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(toggles[0]);
    cards = screen.getAllByRole('article');
    toggles = cards.map((card) => within(card).getByRole('button', { name: 'Additional Details' }));
    expect(toggles[0]).toHaveAttribute('aria-expanded', 'false');
    expect(toggles[1]).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Show all details' })).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'Show all details' }));
    const thirdPageCustomer = { ...customer, id: '36123088-b4db-4bd8-8d14-aa5b8ad198d3', fullName: 'Dorothy Vaughan' };
    rerender(
      <LanguageProvider initialLanguage="en">
        <CustomerList items={[thirdPageCustomer]} {...props} />
      </LanguageProvider>,
    );
    expect(within(screen.getByRole('article')).getByRole('button', { name: 'Additional Details' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('localizes page-level detail controls in Egyptian Arabic', () => {
    render(
      <LanguageProvider initialLanguage="ar">
        <CustomerList items={[customer]} onEdit={vi.fn()} onDelete={vi.fn()} />
      </LanguageProvider>,
    );

    const card = screen.getByRole('article');
    expect(within(card).getByRole('button', { name: 'تفاصيل إضافية' })).toHaveAttribute('aria-expanded', 'false');
    const table = screen.getByRole('table');
    const editButton = within(table).getByRole('button', { name: 'تعديل Ada Lovelace' });
    const deleteButton = within(table).getByRole('button', { name: 'حذف Ada Lovelace' });
    expect(editButton.querySelector('.action-tooltip')).toHaveTextContent('تعديل');
    expect(deleteButton.querySelector('.action-tooltip')).toHaveTextContent('حذف');
    fireEvent.click(screen.getByRole('button', { name: 'عرض كل التفاصيل' }));
    expect(screen.getByRole('button', { name: 'إخفاء كل التفاصيل' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('invokes edit and delete callbacks for the selected customer', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <LanguageProvider initialLanguage="en">
        <CustomerList items={[customer]} onEdit={onEdit} onDelete={onDelete} />
      </LanguageProvider>,
    );

    const editButtons = screen.getAllByRole('button', { name: 'Edit Ada Lovelace' });
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete Ada Lovelace' });
    expect(editButtons.every((button) => button.classList.contains('cursor-pointer'))).toBe(true);
    expect(deleteButtons.every((button) => button.classList.contains('cursor-pointer'))).toBe(true);
    fireEvent.click(editButtons[0]);
    fireEvent.click(deleteButtons[0]);
    expect(onEdit).toHaveBeenCalledWith(customer);
    expect(onDelete).toHaveBeenCalledWith(customer);
  });
});
