import { createTheme } from '@mui/material/styles';

// Editorial pairing: Playfair Display for headings/titles, Source Serif 4 for body text.
const bodyFont = '"Source Serif 4", Georgia, "Times New Roman", serif';
const displayFont = '"Playfair Display", Georgia, serif';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#3949ab' },
    background: { default: '#f5f6fa' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: bodyFont,
    h1: { fontFamily: displayFont },
    h2: { fontFamily: displayFont },
    h3: { fontFamily: displayFont },
    h4: { fontFamily: displayFont },
    h5: { fontFamily: displayFont, fontWeight: 600 },
    h6: { fontFamily: displayFont, fontWeight: 600 },
  },
});
