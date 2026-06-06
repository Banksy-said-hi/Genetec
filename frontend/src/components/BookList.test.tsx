import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookList } from './BookList';
import type { Book } from '../api/types';
import { renderWithProviders } from '../test/utils';

function book(id: number, title: string): Book {
  return {
    id,
    title,
    shortDescription: `Description ${id}`,
    publishDate: '2000-01-01',
    authors: [{ id: 1, name: 'Jane Doe' }],
  };
}

function setup(overrides: Partial<Parameters<typeof BookList>[0]> = {}) {
  const props = {
    rows: [book(1, 'The Hobbit'), book(2, 'War and Peace')],
    rowCount: 45,
    loading: false,
    page: 1,
    pageSize: 20,
    onPageChange: vi.fn(),
    sortField: 'title',
    sortDir: 'asc' as const,
    onSortChange: vi.fn(),
    search: '',
    onSearchChange: vi.fn(),
    onRowClick: vi.fn(),
    ...overrides,
  };
  renderWithProviders(<BookList {...props} />);
  return props;
}

describe('BookList', () => {
  it('renders a row for each book with its author', () => {
    setup();
    expect(screen.getByText('The Hobbit')).toBeInTheDocument();
    expect(screen.getByText('War and Peace')).toBeInTheDocument();
    expect(screen.getAllByText('Jane Doe').length).toBeGreaterThan(0);
  });

  it('requests the next page when the pagination control is used', async () => {
    const props = setup();
    await userEvent.click(screen.getByRole('button', { name: /go to page 2/i }));
    expect(props.onPageChange).toHaveBeenCalledWith(2);
  });

  it('toggles sort direction when the active column header is clicked', async () => {
    const props = setup({ sortField: 'title', sortDir: 'asc' });
    await userEvent.click(screen.getByRole('button', { name: /title/i }));
    expect(props.onSortChange).toHaveBeenCalledWith('title', 'desc');
  });

  it('sorts a new column ascending', async () => {
    const props = setup({ sortField: 'title', sortDir: 'asc' });
    await userEvent.click(screen.getByRole('button', { name: /published/i }));
    expect(props.onSortChange).toHaveBeenCalledWith('publishDate', 'asc');
  });

  it('reports search input changes', async () => {
    const props = setup();
    await userEvent.type(screen.getByTestId('book-search'), 'hob');
    expect(props.onSearchChange).toHaveBeenCalled();
  });

  it('invokes onRowClick with the book id when a row is clicked', async () => {
    const props = setup();
    await userEvent.click(screen.getAllByTestId('book-row')[0]);
    expect(props.onRowClick).toHaveBeenCalledWith(1);
  });
});
