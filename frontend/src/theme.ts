import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#3949ab' },
    background: { default: '#f5f6fa' },
  },
  shape: { borderRadius: 8 },
});
