import React, { useMemo } from 'react';
import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material';
import { createAppMuiTheme } from './muiTheme';
import { useTheme as useAppTheme } from '../context/ThemeContext';

const MuiDesignSystemProvider = ({ children }) => {
  const { theme } = useAppTheme();
  const muiTheme = useMemo(
    () => createAppMuiTheme(theme === 'dark' ? 'dark' : 'light'),
    [theme]
  );

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

export default MuiDesignSystemProvider;
