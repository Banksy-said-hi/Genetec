import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChangeHistory } from './ChangeHistory';
import type { BookChange } from '../api/types';

function change(partial: Partial<BookChange>): BookChange {
  return {
    id: 1,
    bookId: 1,
    timestamp: '2024-01-01T00:00:00Z',
    date: '2024-01-01',
    field: 'Title',
    changeType: 'Updated',
    oldValue: null,
    newValue: null,
    description: 'A change',
    ...partial,
  };
}

describe('ChangeHistory', () => {
  it('groups changes by date into one section per distinct date', () => {
    const changes = [
      change({ id: 1, date: '2024-03-02', description: 'Title was changed to "B"' }),
      change({ id: 2, date: '2024-03-02', description: 'Short description was changed to "x"' }),
      change({ id: 3, date: '2024-03-01', description: 'Book "A" was created', changeType: 'Created' }),
    ];

    render(<ChangeHistory changes={changes} />);

    const groups = screen.getAllByTestId('change-date-group');
    expect(groups).toHaveLength(2);
    expect(groups[0]).toHaveTextContent('2024-03-02');
    expect(groups[1]).toHaveTextContent('2024-03-01');
    expect(screen.getByText('Title was changed to "B"')).toBeInTheDocument();
    expect(screen.getByText('Book "A" was created')).toBeInTheDocument();
  });

  it('renders a skeleton placeholder while loading', () => {
    render(<ChangeHistory changes={[]} loading />);
    expect(screen.getByTestId('change-history-loading')).toBeInTheDocument();
  });

  it('shows an empty message when there are no changes', () => {
    render(<ChangeHistory changes={[]} />);
    expect(screen.getByText('No changes recorded.')).toBeInTheDocument();
  });

  it('renders the table view when toggled', async () => {
    render(
      <ChangeHistory changes={[change({ field: 'Title', description: 'Title was changed to "B"' })]} />,
    );

    // Timeline (default) has no column headers; the table view does.
    expect(screen.queryByText('Field')).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('view-table'));

    // The table-only "Field" header proves we switched, and the row still renders.
    expect(screen.getByText('Field')).toBeInTheDocument();
    expect(screen.getByText('Title was changed to "B"')).toBeInTheDocument();
  });
});
