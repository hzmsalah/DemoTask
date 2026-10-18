import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Customer, PagedResult } from './types/customer.types';
import { LanguageProvider } from '../../context/LanguageContext';
import { CustomerPage } from './CustomerPage';

const fetchMock = vi.fn<typeof fetch>();

function page(items: Customer[]): PagedResult<Customer> {
  return {
    items,
    totalCount: items.length,
    pageNumber: 1,
    pageSize: 20,
    totalPages: Math.ceil(items.length / 20),
    hasPreviousPage: false,
    hasNextPage: false,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function renderPage() {
  return render(<LanguageProvider initialLanguage="en"><CustomerPage /></LanguageProvider>);
}

describe('CustomerPage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('shows the initial loading status and then the returned customer list', async () => {
    const customer: Customer = {
      id: 'a6d3901c-85a2-4e22-a09f-2fef5a13209f',
      fullName: 'Ada Lovelace',
      phoneNumber: '+201012345678',
      email: 'ada@example.com',
      address: 'Cairo',
      createdAt: '2026-10-17T10:00:00Z',
      lastVisit: null,
    };
    let resolveFetch: ((response: Response) => void) | undefined;
    fetchMock.mockImplementationOnce(() => new Promise<Response>((resolve) => { resolveFetch = resolve; }));
    const { container } = renderPage();

    const brandMark = container.querySelector('header img');
    expect(brandMark).toHaveAttribute('src', '/brand/shaghaf-mark.svg');
    expect(brandMark).toHaveAttribute('alt', '');
    expect(screen.getByText('Record, organize & update customer data')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading customers...');
    await act(async () => {
      resolveFetch?.(jsonResponse(page([customer])));
      await Promise.resolve();
    });
    expect(await screen.findAllByText('Ada Lovelace')).toHaveLength(2);
    expect(screen.getAllByText('Last visit').length).toBeGreaterThan(0);
  });

  it('shows the GitHub repository link and localized disclaimers', async () => {
    const englishDisclaimer = [
      'This is a proof-of-concept React & ASP.NET project built around Shaghaf’s business model using mock data.',
      'It is not a production-grade customer management system (which would require end-to-end authentication and external API integrations)',
      'but rather a demonstration of how I would architect the backend and structure the frontend interface.',
    ].join(' ');
    const arabicDisclaimer = [
      "ده مشروع تجريبي معمول بـ React و ASP.NET بداتا وهمية ومبني على فكرة وموديل شغل 'شغف'.",
      'دي مش صفحة رسمية لإدارة العملاء (لأن ده أكيد هيحتاج نظام تسجيل دخول وتأمين وربط بـ APIs تانية)',
      'لكن ده مجرد تطبيق عملي بيوضّح طريقتي في تنظيم الـ Frontend وتقسيم وكتابة الـ Backend.',
    ].join(' ');
    fetchMock.mockResolvedValue(jsonResponse(page([])));
    renderPage();

    const footer = await screen.findByRole('contentinfo', { name: 'About this project' });
    expect(footer).toHaveClass('border-t-4', 'border-brand-accent', 'bg-surface');
    expect(within(footer).getByText('GitHub repository:')).toBeInTheDocument();
    const repositoryLink = within(footer).getByRole('link', { name: 'hzmsalah/DemoTask' });
    expect(repositoryLink).toHaveAttribute('href', 'https://github.com/hzmsalah/DemoTask');
    expect(repositoryLink).toHaveClass('underline', 'hover:text-primary-hover');
    expect(within(footer).queryByText('Live demo:')).not.toBeInTheDocument();
    expect(within(footer).queryByText('Hosted link coming soon')).not.toBeInTheDocument();
    expect(within(footer).getByText(englishDisclaimer)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Switch language' }));
    const arabicFooter = screen.getByRole('contentinfo', { name: 'عن المشروع' });
    expect(within(arabicFooter).getByText('مستودع GitHub:')).toBeInTheDocument();
    expect(within(arabicFooter).getByRole('link', { name: 'hzmsalah/DemoTask' })).toHaveAttribute('href', 'https://github.com/hzmsalah/DemoTask');
    expect(within(arabicFooter).queryByText('عرض تجريبي:')).not.toBeInTheDocument();
    expect(within(arabicFooter).queryByText('رابط الاستضافة قريبًا')).not.toBeInTheDocument();
    expect(within(arabicFooter).getByText(arabicDisclaimer)).toBeInTheDocument();
  });

  it('shows the requested Egyptian Arabic subtitle after switching language', async () => {
    fetchMock.mockResolvedValue(jsonResponse(page([])));
    renderPage();
    expect(await screen.findByText('No customers yet')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Switch language' }));
    expect(screen.getByText('سجّل، نظّم وحدِّث بيانات العملاء.')).toBeInTheDocument();
  });

  it('shows a localized retry after a network failure', async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('private network details'))
      .mockResolvedValueOnce(jsonResponse(page([])));
    renderPage();

    expect(await screen.findByText('Could not connect. Check your connection and try again.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No customers yet')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('shows the search-specific empty state and clears back to the unfiltered empty state', async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async () => jsonResponse(page([])));
    renderPage();
    await screen.findByText('No customers yet');

    await user.type(screen.getByRole('searchbox', { name: 'Search by name or phone number' }), 'Cairo');
    expect(await screen.findByText('No results for Cairo')).toBeInTheDocument();
    const clearActions = screen.getAllByRole('button', { name: 'Clear search' });
    await user.click(clearActions[clearActions.length - 1]);
    expect(await screen.findByText('No customers yet')).toBeInTheDocument();
  });

  it('edits an existing customer and confirms deletion through the list actions', async () => {
    const user = userEvent.setup();
    const id = 'a6d3901c-85a2-4e22-a09f-2fef5a13209f';
    let stored: Customer | null = {
      id,
      fullName: 'Ada Lovelace',
      phoneNumber: '+201012345678',
      email: null,
      address: null,
      createdAt: '2026-10-17T10:00:00Z',
      lastVisit: null,
    };
    fetchMock.mockImplementation(async (_input, init) => {
      if (init?.method === 'PUT') {
        const body = JSON.parse(String(init.body)) as Pick<Customer, 'fullName' | 'phoneNumber' | 'email' | 'address'>;
        if (stored) stored = { ...stored, ...body };
        return new Response(null, { status: 204 });
      }
      if (init?.method === 'DELETE') {
        stored = null;
        return new Response(null, { status: 204 });
      }
      return jsonResponse(page(stored ? [stored] : []));
    });

    renderPage();
    expect(await screen.findAllByText('Ada Lovelace')).toHaveLength(2);
    await user.click(screen.getAllByRole('button', { name: 'Edit Ada Lovelace' })[0]);
    const name = screen.getByLabelText('Full name');
    await user.clear(name);
    await user.type(name, 'Grace Hopper');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Customer updated successfully.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText('Grace Hopper')).toHaveLength(2));
    const updateCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT');
    expect(String(updateCall?.[0])).toContain(id);
    expect(JSON.parse(String(updateCall?.[1]?.body))).toMatchObject({ fullName: 'Grace Hopper', phoneNumber: '+201012345678' });

    await user.click(screen.getAllByRole('button', { name: 'Delete Grace Hopper' })[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete customer' }));
    expect(await screen.findByText('Customer deleted successfully.')).toBeInTheDocument();
    expect(await screen.findByText('No customers yet')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(true);
  });

  it('creates a customer, sends blank optional fields as null, and refreshes the list', async () => {
    const user = userEvent.setup();
    let stored: Customer[] = [];
    fetchMock.mockImplementation(async (_input, init) => {
      if (init?.method === 'POST') {
        const body = JSON.parse(String(init.body)) as { fullName: string; phoneNumber: string; email: string | null; address: string | null };
        const created: Customer = {
          id: 'b7e4012d-96b3-5f33-b10a-3c0f6b2431a0',
          fullName: body.fullName,
          phoneNumber: body.phoneNumber,
          email: body.email,
          address: body.address,
          createdAt: '2026-10-17T10:00:00Z',
          lastVisit: null,
        };
        stored = [created];
        return jsonResponse(created, 201);
      }
      return jsonResponse(page(stored));
    });
    renderPage();
    await screen.findByText('No customers yet');
    const addCustomerButton = screen.getByRole('button', { name: /Add customer/ });
    expect(addCustomerButton).toHaveClass('hover:bg-cta-hover', 'hover:text-primary', 'hover:border-primary');
    await user.click(addCustomerButton);
    await user.type(screen.getByLabelText('Full name'), 'Mona Hassan');
    await user.type(screen.getByLabelText('Phone number'), '01012345678');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Customer added successfully.')).toBeInTheDocument();
    expect(await screen.findAllByText('Mona Hassan')).toHaveLength(2);
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(post).toBeDefined();
    expect(JSON.parse(String(post?.[1]?.body))).toMatchObject({ email: null, address: null });
  });

  it('smoothly scrolls to the page top, focuses results, and keeps show-all mode on the next page', async () => {
    const firstCustomer: Customer = {
      id: 'a6d3901c-85a2-4e22-a09f-2fef5a13209f',
      fullName: 'Ada Lovelace',
      phoneNumber: '+201012345678',
      email: null,
      address: null,
      createdAt: '2026-10-17T10:00:00Z',
      lastVisit: null,
    };
    const secondCustomer: Customer = {
      ...firstCustomer,
      id: 'f1471bbc-07f0-4d6e-a273-8ee06c48b726',
      fullName: 'Grace Hopper',
    };
    const originalScrollY = Object.getOwnPropertyDescriptor(window, 'scrollY');
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 500 });
    const scrollTo = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    fetchMock.mockImplementation(async (input) => {
      const requestedPage = Number(new URL(String(input), 'http://localhost').searchParams.get('page') ?? '1');
      const result = page([requestedPage === 1 ? firstCustomer : secondCustomer]);
      return jsonResponse({
        ...result,
        totalCount: 21,
        pageNumber: requestedPage,
        pageSize: 20,
        totalPages: 2,
        hasPreviousPage: requestedPage > 1,
        hasNextPage: requestedPage < 2,
      });
    });

    try {
      renderPage();
      expect(await screen.findAllByText('Ada Lovelace')).toHaveLength(2);
      fireEvent.click(screen.getByRole('button', { name: 'Show all details' }));
      expect(within(screen.getByRole('article')).getByRole('button', { name: 'Additional Details' })).toHaveAttribute('aria-expanded', 'true');

      fireEvent.click(screen.getByRole('button', { name: 'Next' }));

      expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
      expect(fetchMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        document.dispatchEvent(new Event('scrollend'));
        await Promise.resolve();
      });

      expect(document.activeElement).toHaveAttribute('id', 'customer-records');
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
      expect(await screen.findAllByText('Grace Hopper')).toHaveLength(2);
      expect(within(screen.getByRole('article')).getByRole('button', { name: 'Additional Details' })).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('button', { name: 'Hide all details' })).toHaveAttribute('aria-expanded', 'true');
    } finally {
      vi.unstubAllGlobals();
      if (originalScrollY) Object.defineProperty(window, 'scrollY', originalScrollY);
      else Reflect.deleteProperty(window, 'scrollY');
    }
  });
});
