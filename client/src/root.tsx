import { ApolloProvider } from '@apollo/client';
import { createTheme, CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import Layout from './components/layout';
import { BundlrProvider } from './context/bundlr';
import { WalletProvider } from './context/wallet';
import { client } from './utils/apollo';

export const Root = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
        },
      }),
    [prefersDarkMode],
  );

  return (
    <ApolloProvider client={client}>
      <ThemeProvider theme={theme}>
        <SnackbarProvider maxSnack={3}>
          <WalletProvider>
            <BundlrProvider>
              <CssBaseline />
              <Layout>
                <Outlet />
              </Layout>
            </BundlrProvider>
          </WalletProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </ApolloProvider>
  );
};

export default Root;
