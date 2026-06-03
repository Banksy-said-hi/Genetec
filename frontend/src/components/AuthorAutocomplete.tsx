import { useState } from 'react';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { useAuthorSearch } from '../hooks/useAuthorSearch';

interface AuthorAutocompleteProps {
  value: string[];
  onChange: (names: string[]) => void;
  label?: string;
}

/**
 * Reusable multi-select author picker backed by GET /authors?search=.
 * `freeSolo` lets the user add a brand-new author name; the server find-or-creates it on save.
 * Shows a spinner while the search request is in flight.
 */
export function AuthorAutocomplete({ value, onChange, label = 'Authors' }: AuthorAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const { data: authors = [], isFetching } = useAuthorSearch(inputValue);
  const options = authors.map((a) => a.name);

  return (
    <Autocomplete
      multiple
      freeSolo
      options={options}
      value={value}
      inputValue={inputValue}
      // The server already filters; don't filter again on the client.
      filterOptions={(opts) => opts}
      onInputChange={(_, next) => setInputValue(next)}
      onChange={(_, next) => onChange(next as string[])}
      loading={isFetching}
      data-testid="author-autocomplete"
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder="Search authors…"
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              endAdornment: (
                <>
                  {isFetching ? (
                    <CircularProgress color="inherit" size={18} data-testid="author-spinner" />
                  ) : null}
                  {params.slotProps.input.endAdornment}
                </>
              ),
            },
            htmlInput: {
              ...params.slotProps.htmlInput,
              'data-testid': 'author-input',
            },
          }}
        />
      )}
    />
  );
}
