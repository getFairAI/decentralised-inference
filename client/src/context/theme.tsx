import { ThemeProvider, darken, useMediaQuery } from '@mui/material';
import createTheme from '@mui/material/styles/createTheme';
import { ReactNode, createContext, useEffect, useMemo, useState } from 'react';

declare module '@mui/material/styles' {
  interface Palette {
    terciary: Palette['primary'];
    neutral: Palette['primary'];
    backdropContrast: Palette['primary'];
  }
  // allow configuration using `createTheme`
  interface PaletteOptions {
    terciary: PaletteOptions['primary'];
    neutral: PaletteOptions['primary'];
    backdropContrast: Palette['primary'];
  }
}

type themeOptions = 'light' | 'dark';
interface IAppThemeContext {
  currentTheme: themeOptions;
  toggleTheme: () => void;
}
const satoshiFont = "'Satoshi', sans-serif";
const lightTheme = createTheme({
  typography: {
    fontFamily: satoshiFont,
    h1: {
      fontSize: '40px',
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
    borderRadius: 8,
  },
  palette: {
    mode: 'light',
    background: {
      default: '#EDEDED',
      paper: '#EDEDED',
    },
    primary: {
      // light: will be calculated from palette.primary.main,
      light: '#464646',
      main: '#3aaaaa',
      dark: '#1F1F26',
      contrastText: '#EDEDED',
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
    },
    secondary: {
      // light: will be calculated from palette.primary.main,
      light: '#222222',
      main: '#222222',
      dark: '#222222',
      contrastText: '#D9D9D9',
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
    },
    terciary: {
      // light: will be calculated from palette.primary.main,
      light: '#6C6C6C', // D04C5A // FF9524
      main: '#6C6C6C',
      dark: '#6C6C6C',
      contrastText: '#151515',
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
    },
    neutral: {
      // light: will be calculated from palette.primary.main,
      light: '#6C6C6C',
      main: '#6C6C6C',
      dark: '#6C6C6C',
      contrastText: '#223745',
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
    },
    backdropContrast: {
      main: 'rgb(70,70,70)',
      light: 'rgb(70,70,70)',
      dark: 'rgb(70,70,70)',
      contrastText: 'rgb(70,70,70)',
    },
    warning: {
      main: '#F4BA61',
      light: '#F4BA61',
      dark: '#F4BA61',
    },
    error: {
      main: '#DC5141',
      light: '#DC5141',
      dark: '#DC5141',
    },
    text: {
      primary: '#464646',
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
            backgroundColor: darken('#C0C0C0', 0.4),
          },
          '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
            backgroundColor: darken('#C0C0C0', 0.4),
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: darken('#C0C0C0', 0.4),
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
      fontSize: '40px',
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
    backdropContrast: {
      main: 'rgb(70,70,70)',
      light: 'rgb(70,70,70)',
      dark: 'rgb(70,70,70)',
      contrastText: 'rgb(70,70,70)',
    },
    text: {
      primary: '#223745', // same as rgba(34,55,69,255)
      secondary: 'rgba(34,55,69, 0.6)',
      disabled: 'rgba(34,55,69,0.3)',
    },
  },
});

export const AppThemeContext = createContext<IAppThemeContext>({
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
  const value = useMemo(() => ({ currentTheme: mode, toggleTheme }), [mode, toggleTheme]);

  useEffect(() => {
    setMode('light'); // force light mode for now
  }, [prefersDarkMode]);

  return (
    <AppThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </AppThemeContext.Provider>
  );
};
