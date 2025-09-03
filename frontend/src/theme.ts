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
    background: { default: '#000000', paper: '#1a1a1a' },
    text: { primary: '#ffffff', secondary: '#cccccc' },
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
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(6px)',
        },
      },
    },
  },
});
