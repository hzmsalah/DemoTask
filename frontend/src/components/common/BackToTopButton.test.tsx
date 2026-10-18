import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../context/LanguageContext';
import { BackToTopButton } from './BackToTopButton';

let originalScrollY: PropertyDescriptor | undefined;
let originalInnerHeight: PropertyDescriptor | undefined;
let footerElement: HTMLElement | null = null;

function setScrollY(value: number) {
  Object.defineProperty(window, 'scrollY', { configurable: true, value });
}

function renderButton(language: 'ar' | 'en' = 'en') {
  return render(
    <LanguageProvider initialLanguage={language}>
      <BackToTopButton />
    </LanguageProvider>,
  );
}

describe('BackToTopButton', () => {
  beforeEach(() => {
    originalScrollY = Object.getOwnPropertyDescriptor(window, 'scrollY');
    originalInnerHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight');
    setScrollY(0);
  });

  afterEach(() => {
    if (originalScrollY) Object.defineProperty(window, 'scrollY', originalScrollY);
    else Reflect.deleteProperty(window, 'scrollY');
    if (originalInnerHeight) Object.defineProperty(window, 'innerHeight', originalInnerHeight);
    else Reflect.deleteProperty(window, 'innerHeight');
    footerElement?.remove();
    footerElement = null;
  });

  it('appears only after scrolling past the threshold and hides again near the top', () => {
    renderButton();
    expect(screen.queryByRole('button', { name: 'Back to top' })).not.toBeInTheDocument();

    act(() => {
      setScrollY(400);
      fireEvent.scroll(window);
    });
    expect(screen.getByRole('button', { name: 'Back to top' })).toBeInTheDocument();

    act(() => {
      setScrollY(0);
      fireEvent.scroll(window);
    });
    expect(screen.queryByRole('button', { name: 'Back to top' })).not.toBeInTheDocument();
  });

  it('positions above the footer and hides when it cannot fit without covering the disclaimer', () => {
    setScrollY(500);
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
    footerElement = document.createElement('footer');
    footerElement.id = 'page-footer';
    const footerBounds = vi.spyOn(footerElement, 'getBoundingClientRect');
    footerBounds.mockReturnValue({ top: 700 } as DOMRect);
    document.body.append(footerElement);

    renderButton();

    const button = screen.getByRole('button', { name: 'Back to top' });
    expect(button.style.insetBlockEnd).toBe('116px');

    act(() => {
      footerBounds.mockReturnValue({ top: 40 } as DOMRect);
      fireEvent.scroll(window);
    });
    expect(screen.queryByRole('button', { name: 'Back to top' })).not.toBeInTheDocument();
  });

  it('scrolls smoothly to the top when reduced motion is not requested', () => {
    setScrollY(500);
    const scrollTo = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    renderButton();

    fireEvent.click(screen.getByRole('button', { name: 'Back to top' }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('uses an Arabic accessible label and avoids smooth motion when the preference requests it', () => {
    setScrollY(500);
    const scrollTo = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    renderButton('ar');

    fireEvent.click(screen.getByRole('button', { name: 'الرجوع لأعلى' }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });
});
