import { alpha, createTheme } from '@mui/material/styles';

const BRAND_PRIMARY = '#0ea5e9';
const BRAND_PRIMARY_DARK = '#38bdf8';
const BRAND_ACCENT = '#8b5cf6';
const BRAND_ACCENT_DARK = '#a78bfa';

export const createAppMuiTheme = (mode = 'light') =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? BRAND_PRIMARY_DARK : BRAND_PRIMARY,
      },
      secondary: {
        main: mode === 'dark' ? BRAND_ACCENT_DARK : BRAND_ACCENT,
      },
      background: mode === 'dark'
        ? {
          default: '#020617',
          paper: '#0f172a',
        }
        : {
          default: '#f8fafc',
          paper: '#ffffff',
        },
      text: mode === 'dark'
        ? {
          primary: '#e2e8f0',
          secondary: '#94a3b8',
        }
        : {
          primary: '#0f172a',
          secondary: '#64748b',
        }
    },
    shape: {
      borderRadius: 14
    },
    typography: {
      fontFamily: '"Poppins", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
      h1: { fontWeight: 800 },
      h2: { fontWeight: 800 },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      button: {
        fontWeight: 700,
        textTransform: 'none',
        letterSpacing: 0.2
      }
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            transition: 'background-color 180ms ease, color 180ms ease'
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${mode === 'dark' ? alpha('#94a3b8', 0.16) : '#e2e8f0'}`
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 20
          }
        }
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true
        },
        styleOverrides: {
          root: {
            borderRadius: 12,
            paddingInline: 16
          }
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999
          }
        }
      }
    }
  });
