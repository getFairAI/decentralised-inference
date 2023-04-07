import { ThemeProvider, createTheme, useMediaQuery } from '@mui/material';
import { ReactNode, createContext, useEffect, useMemo, useState } from 'react';

declare module '@mui/material/styles' {
  interface Palette {
    terciary: Palette['primary'];
    neutral: Palette['primary'];
  }
  // allow configuration using `createTheme`
  interface PaletteOptions {
    terciary: PaletteOptions['primary'];
    neutral: PaletteOptions['primary'];
  }
}

type themeOptions = 'light' | 'dark';
interface AppThemeContext {
  currentTheme: themeOptions;
  toggleTheme: () => void;
}
const satoshiFont = "'Satoshi', sans-serif";
const lightTheme = createTheme({
  typography: {
    fontFamily: satoshiFont,
    h1: {
      fontSize: '80px',
      fontWeight: '400',
      lineHeight: '106px',
    },
    h2: {
      fontWeight: '700',
      fontSize: '24px',
      lineHeight: '32px',
    },
    h3: {
      fontWeight: '700',
      fontSize: '20px',
      lineHeight: '27px',
    },
    h4: {
      fontWeight: '300',
      fontSize: '20px',
      lineHeight: '27px',
    },
    h5: {},
    h6: {
      fontWeight: '400',
      fontSize: '12px',
      lineHeight: '16px',
    },
  },
  shape: {
    borderRadius: 23,
  },
  palette: {
    mode: 'light',
    background: {
      default: '#FFFEFE',
      paper: '#FFFEFE',
    },
    primary: {
      // light: will be calculated from palette.primary.main,
      light: '#09ABE6',
      main: '#09ABE6',
      dark: '#09ABE6',
      contrastText: '#FFFFFF',
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
    },
    secondary: {
      // light: will be calculated from palette.primary.main,
      light: '#007099',
      main: '#007099',
      dark: '#007099',
      contrastText: '#FFFFFF',
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
    },
    terciary: {
      // light: will be calculated from palette.primary.main,
      light: '#FF9524', // D04C5A // FF9524
      main: '#FF9524',
      dark: '#FF9524',
      contrastText: '#223745',
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
    },
    neutral: {
      // light: will be calculated from palette.primary.main,
      light: '#C0C0C0',
      main: '#C0C0C0',
      dark: '#C0C0C0',
      contrastText: '#223745',
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
    },
    text: {
      primary: '#355064', // same as rgba(34,55,69,255)
      secondary: 'rgba(34,55,69, 0.6)',
      disabled: 'rgba(34,55,69,0.3)',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: '#C0C0C0 #C0C0C0',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: '#C0C0C0',
            minHeight: 24,
          },
          '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
            backgroundColor: '#C0C0C0',
          },
          '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
            backgroundColor: '#C0C0C0',
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#C0C0C0',
          },
          '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
            backgroundColor: '#C0C0C0',
          },
        },
      },
    },
  },
});

const darkTheme = createTheme({
  typography: {
    fontFamily: satoshiFont,
    h1: {
      fontSize: '80px',
      fontWeight: '400',
      lineHeight: '106px',
    },
    h2: {
      fontWeight: '700',
      fontSize: '24px',
      lineHeight: '32px',
    },
    h3: {
      fontWeight: '700',
      fontSize: '20px',
      lineHeight: '27px',
    },
    h4: {
      fontWeight: '300',
      fontSize: '20px',
      lineHeight: '27px',
    },
    h5: {},
    h6: {
      fontWeight: '400',
      fontSize: '12px',
      lineHeight: '16px',
    },
  },
  palette: {
    mode: 'dark',
    background: {
      default: '#000',
      paper: '#000',
    },
    primary: {
      // light: will be calculated from palette.primary.main,
      light: '#223745',
      main: '#223745',
      dark: '#223745',
      contrastText: '#FFFFFF',
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
    },
    secondary: {
      // light: will be calculated from palette.primary.main,
      light: '#355064',
      main: '#355064',
      dark: '#355064',
      contrastText: '#FFFFFF',
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
    },
    terciary: {
      // light: will be calculated from palette.primary.main,
      light: '#01DFF0',
      main: '#01DFF0',
      dark: '#01DFF0',
      contrastText: '#223745',
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
    },
    neutral: {
      // light: will be calculated from palette.primary.main,
      light: 'rgba(61, 61, 61, 0.98)',
      main: 'rgba(61, 61, 61, 0.98)',
      dark: 'rgba(61, 61, 61, 0.98)',
      contrastText: '#FAFAFA',
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
    },
    text: {
      primary: '#223745', // same as rgba(34,55,69,255)
      secondary: 'rgba(34,55,69, 0.6)',
      disabled: 'rgba(34,55,69,0.3)',
    },
  },
});

export const AppThemeContext = createContext<AppThemeContext>({
  currentTheme: 'light',
  toggleTheme: () => undefined,
});

export const AppThemeProvider = ({ children }: { children: ReactNode }) => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<themeOptions>('light');

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(() => (mode === 'light' ? lightTheme : darkTheme), [mode]);

  useEffect(() => {
    setMode('light'); // force light mode for now
  }, [prefersDarkMode]);

  return (
    <AppThemeContext.Provider value={{ currentTheme: mode, toggleTheme }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </AppThemeContext.Provider>
  );
};
