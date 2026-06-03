import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
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
    rowCount: 25,
    loading: false,
    paginationModel: { page: 0, pageSize: 10 } as GridPaginationModel,
    onPaginationModelChange: vi.fn(),
    sortModel: [] as GridSortModel,
    onSortModelChange: vi.fn(),
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
    await userEvent.click(screen.getByRole('button', { name: /go to next page/i }));
    expect(props.onPaginationModelChange).toHaveBeenCalled();
    const model = props.onPaginationModelChange.mock.calls.at(-1)![0] as GridPaginationModel;
    expect(model.page).toBe(1);
  });

  it('reports search input changes', async () => {
    const props = setup();
    await userEvent.type(screen.getByTestId('book-search'), 'hob');
    expect(props.onSearchChange).toHaveBeenCalled();
  });
});
