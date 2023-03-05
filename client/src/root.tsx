import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  from,
  HttpLink,
  InMemoryCache,
  split,
} from '@apollo/client';
import { createTheme, CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import Layout from './components/layout';
import { DEV_ARWEAVE_URL, NET_ARWEAVE_URL } from './constants';
import { ITransactions } from './interfaces/arweave';

const mapLink = new ApolloLink((operation, forward) =>
  forward(operation).map((result) => {
    if (
      operation.operationName === 'results_responses' ||
      operation.operationName === 'chat_history'
    ) {
      const nested = result.data as { results: ITransactions; requests: ITransactions };
      const parsedResult = {
        ...result,
        data: {
          results: nested.results.edges,
          requests: nested.requests.edges,
        },
      };

      return parsedResult;
    } else if (operation.operationName === 'history') {
      const nested = result.data as { owned: ITransactions; received: ITransactions };
      const parsedResult = {
        ...result,
        data: {
          owned: nested.owned.edges,
          received: nested.received.edges,
        },
      };

      return parsedResult;
    }
    const parsedResult = {
      ...result,
      data: (result.data as { transactions: ITransactions }).transactions.edges,
    };
    operation.setContext({ data: parsedResult.data, vars: operation.variables });
    return parsedResult;
  }),
);

const client = new ApolloClient({
  // uri: 'http://localhost:1984/graphql',
  cache: new InMemoryCache(),
  link: split(
    () => true, // default to arweave net
    from([
      // chainRequestLink,
      mapLink,
      new HttpLink({ uri: NET_ARWEAVE_URL + '/graphql' }),
    ]),
    from([
      // chainRequestLink,
      mapLink,
      new HttpLink({ uri: DEV_ARWEAVE_URL + '/graphql' }),
    ]),
  ),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'ignore',
    },
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
  },
});

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
          <CssBaseline />
          <Layout>
            <Outlet />
          </Layout>
        </SnackbarProvider>
      </ThemeProvider>
    </ApolloProvider>
  );
};

export default Root;
