import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthorAutocomplete } from './AuthorAutocomplete';
import { renderWithProviders } from '../test/utils';

describe('AuthorAutocomplete', () => {
  it('queries the API as the user types and shows matching options', async () => {
    renderWithProviders(<AuthorAutocomplete value={[]} onChange={vi.fn()} />);

    await userEvent.type(screen.getByTestId('author-input'), 'Tol');

    // The option only appears if the debounced request to GET /authors?search=Tol resolved.
    await waitFor(() => expect(screen.getByText('J.R.R. Tolkien')).toBeInTheDocument());
  });

  it('emits the selected author name through onChange', async () => {
    const onChange = vi.fn();
    renderWithProviders(<AuthorAutocomplete value={[]} onChange={onChange} />);

    await userEvent.type(screen.getByTestId('author-input'), 'Lewis');
    await waitFor(() => expect(screen.getByText('C.S. Lewis')).toBeInTheDocument());
    await userEvent.click(screen.getByText('C.S. Lewis'));

    expect(onChange).toHaveBeenCalledWith(['C.S. Lewis']);
  });

  it('renders the currently selected authors as chips', () => {
    renderWithProviders(<AuthorAutocomplete value={['Existing Author']} onChange={vi.fn()} />);
    expect(screen.getByText('Existing Author')).toBeInTheDocument();
  });
});
