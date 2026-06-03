import { useMemo, useState } from 'react';
import {
  Box,
  Chip,
  Pagination,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import type { BookChange } from '../api/types';

interface ChangeHistoryProps {
  changes: BookChange[];
  loading?: boolean;
  page?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
}

type ViewMode = 'timeline' | 'table';

const typeColor: Record<BookChange['changeType'], 'success' | 'info' | 'primary' | 'warning'> = {
  Created: 'success',
  Updated: 'info',
  AuthorAdded: 'primary',
  AuthorRemoved: 'warning',
};

/** Groups changes by their (already server-ordered) date into contiguous sections. */
function groupByDate(changes: BookChange[]): { date: string; items: BookChange[] }[] {
  const groups: { date: string; items: BookChange[] }[] = [];
  for (const change of changes) {
    const last = groups[groups.length - 1];
    if (last && last.date === change.date) last.items.push(change);
    else groups.push({ date: change.date, items: [change] });
  }
  return groups;
}

/**
 * Presentational change-log view for a single book. Renders the server-ordered, server-paged
 * changes either as a dated timeline or a table. Pure: grouping is the only logic it owns.
 */
export function ChangeHistory({ changes, loading, page, pageCount, onPageChange }: ChangeHistoryProps) {
  const [view, setView] = useState<ViewMode>('timeline');
  const groups = useMemo(() => groupByDate(changes), [changes]);

  if (loading) {
    return (
      <Stack spacing={1} data-testid="change-history-loading">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={48} />
        ))}
      </Stack>
    );
  }

  return (
    <Box data-testid="change-history">
      <Stack direction="row" sx={{ mb: 1, justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1">Change history</Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={view}
          onChange={(_, next: ViewMode | null) => next && setView(next)}
        >
          <ToggleButton value="timeline" data-testid="view-timeline">
            Timeline
          </ToggleButton>
          <ToggleButton value="table" data-testid="view-table">
            Table
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {changes.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No changes recorded.
        </Typography>
      ) : view === 'timeline' ? (
        <Stack spacing={2}>
          {groups.map((group) => (
            <Box key={group.date}>
              <Typography
                variant="overline"
                color="text.secondary"
                data-testid="change-date-group"
              >
                {group.date}
              </Typography>
              <Stack spacing={1} sx={{ borderLeft: '2px solid', borderColor: 'divider', pl: 2 }}>
                {group.items.map((change) => (
                  <Stack key={change.id} direction="row" spacing={1} sx={{ alignItems: 'center' }} data-testid="change-entry">
                    <Chip size="small" label={change.changeType} color={typeColor[change.changeType]} />
                    <Typography variant="body2">{change.description}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Field</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {changes.map((change) => (
              <TableRow key={change.id} data-testid="change-entry">
                <TableCell>{change.date}</TableCell>
                <TableCell>{change.field}</TableCell>
                <TableCell>{change.changeType}</TableCell>
                <TableCell>{change.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {pageCount && pageCount > 1 && onPageChange ? (
        <Stack sx={{ mt: 2, alignItems: 'center' }}>
          <Pagination
            count={pageCount}
            page={page ?? 1}
            onChange={(_, value) => onPageChange(value)}
            size="small"
          />
        </Stack>
      ) : null}
    </Box>
  );
}
