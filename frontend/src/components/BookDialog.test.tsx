import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { BookDialog } from './BookDialog';
import { renderWithProviders } from '../test/utils';
import { server } from '../test/server';
import { apiBaseUrl } from '../api/client';

describe('BookDialog (create mode)', () => {
  it('submits the entered values and closes on success', async () => {
    let received: unknown = null;
    server.use(
      http.post(`${apiBaseUrl}/books`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ id: 42, ...(received as object), authors: [] }, { status: 201 });
      }),
    );

    const onClose = vi.fn();
    renderWithProviders(<BookDialog open mode="create" bookId={null} onClose={onClose} />);

    await userEvent.type(screen.getByTestId('book-title-input'), 'The Silmarillion');
    await userEvent.type(screen.getByTestId('book-description-input'), 'Tales of the Elder Days.');
    fireEvent.change(screen.getByTestId('book-date-input'), { target: { value: '1977-09-15' } });

    await userEvent.click(screen.getByTestId('book-save'));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(received).toEqual({
      title: 'The Silmarillion',
      shortDescription: 'Tales of the Elder Days.',
      publishDate: '1977-09-15',
      authorNames: [],
    });
  });

  it('keeps the save button disabled until required fields are filled', async () => {
    renderWithProviders(<BookDialog open mode="create" bookId={null} onClose={vi.fn()} />);

    expect(screen.getByTestId('book-save')).toBeDisabled();

    await userEvent.type(screen.getByTestId('book-title-input'), 'Only a title');
    expect(screen.getByTestId('book-save')).toBeDisabled();

    await userEvent.type(screen.getByTestId('book-description-input'), 'And a description.');
    fireEvent.change(screen.getByTestId('book-date-input'), { target: { value: '2001-01-01' } });
    expect(screen.getByTestId('book-save')).toBeEnabled();
  });

  it('surfaces a generic message and stays open when the save fails', async () => {
    server.use(http.post(`${apiBaseUrl}/books`, () => new HttpResponse(null, { status: 500 })));

    const onClose = vi.fn();
    renderWithProviders(<BookDialog open mode="create" bookId={null} onClose={onClose} />);

    await userEvent.type(screen.getByTestId('book-title-input'), 'The Silmarillion');
    await userEvent.type(screen.getByTestId('book-description-input'), 'Tales of the Elder Days.');
    fireEvent.change(screen.getByTestId('book-date-input'), { target: { value: '1977-09-15' } });
    await userEvent.click(screen.getByTestId('book-save'));

    // Generic, leak-free message from client.ts for 5xx — never the raw response body.
    const alert = await screen.findByTestId('save-error');
    expect(alert).toHaveTextContent('Something went wrong. Please try again.');
    // A failed save keeps the dialog open so the user can retry.
    expect(onClose).not.toHaveBeenCalled();
  });
});
