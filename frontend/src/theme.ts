// src/theme.ts
import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    brand: {
      purple: string;
      accent: string;
    };
  }
  interface PaletteOptions {
    brand?: {
      purple?: string;
      accent?: string;
    };
  }
}

export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#0b0b0f', paper: '#111218' },
    text: { primary: '#e9e9ef', secondary: '#b5b6bf' },
    primary: { main: '#00E676' },
    secondary: { main: '#FF7C00' },
    brand: {
      purple: '#00E676',
      accent: '#FF7C00',
    },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: ['Inter','system-ui','Segoe UI','Roboto','Helvetica','Arial','sans-serif'].join(','),
    h5: { fontWeight: 700, letterSpacing: 0.2 },
    body2: { letterSpacing: 0.2 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(6px)',
        },
      },
    },
  },
});
