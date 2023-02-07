import Layout from '@/components/layout'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'

import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { createTheme, CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material';
import { useMemo } from 'react';
// import { WalletProvider } from '@/context/wallet';

const client = new ApolloClient({
  uri: "/api/graphql",
  cache: new InMemoryCache(),
});

export default function App({ Component, pageProps }: AppProps) {

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
      {/* <WalletProvider></WalletProvider> */}
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Layout>
            <Component {...pageProps} />
          </Layout>
      </ThemeProvider>
    </ApolloProvider>
  )
}
