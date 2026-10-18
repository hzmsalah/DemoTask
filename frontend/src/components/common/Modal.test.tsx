import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../context/LanguageContext';
import { Modal } from './Modal';

function ModalHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open dialog</button>
      <Modal open={open} title="Customer details" onClose={() => setOpen(false)} initialFocusId="modal-first">
        <input id="modal-first" aria-label="First field" />
        <button id="modal-last" type="button">Last action</button>
      </Modal>
    </>
  );
}

describe('Modal', () => {
  it('focuses its first field, closes on Escape, and restores trigger focus', async () => {
    const user = userEvent.setup();
    render(<LanguageProvider initialLanguage="en"><ModalHarness /></LanguageProvider>);
    const trigger = screen.getByRole('button', { name: 'Open dialog' });
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Customer details' })).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByLabelText('First field')).toHaveFocus();

    fireEvent.keyDown(document.activeElement ?? document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('wraps Tab and Shift+Tab within the dialog', () => {
    render(
      <LanguageProvider initialLanguage="en">
        <Modal open title="Focus trap" onClose={vi.fn()} initialFocusId="modal-first">
          <input id="modal-first" aria-label="First field" />
          <button id="modal-last" type="button">Last action</button>
        </Modal>
      </LanguageProvider>,
    );
    const close = screen.getByRole('button', { name: 'Close dialog' });
    expect(close).toHaveClass('enabled:hover:bg-surface-hover');
    const last = screen.getByRole('button', { name: 'Last action' });
    close.focus();
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(close).toHaveFocus();
  });

  it('cannot be dismissed with Escape or backdrop clicks while locked', () => {
    const onClose = vi.fn();
    render(
      <LanguageProvider initialLanguage="en">
        <Modal open title="Saving" onClose={onClose} locked>
          <button type="button">Save</button>
        </Modal>
      </LanguageProvider>,
    );
    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.parentElement;
    expect(backdrop).not.toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });
    if (backdrop) fireEvent.mouseDown(backdrop);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeDisabled();
  });
});
