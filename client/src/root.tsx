import { ApolloClient, ApolloLink, ApolloProvider, from, HttpLink, InMemoryCache } from '@apollo/client';
import { createTheme, CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material';
import { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import Layout from './components/layout';
import { ITransactions } from './interfaces/arweave';

const mapLink  = new ApolloLink((operation, forward) => 
  forward(operation).map((result) => {
    if (operation.operationName === 'results_responses') {
      const nested = (result.data as { results: ITransactions, requests: ITransactions });
      const parsedResult = {
        ...result,
        data: {
          results: nested.results.edges,
          requests: nested.requests.edges
        }
      };

      return parsedResult;
    } else if (operation.operationName === 'history') {
      const nested = (result.data as { owned: ITransactions, received: ITransactions });
      const parsedResult = {
        ...result,
        data: {
          owned: nested.owned.edges,
          received: nested.received.edges
        }
      };

      return parsedResult;
    }
    const parsedResult = {
      ...result,
      data: (result.data as { transactions: ITransactions }).transactions.edges
    };
    operation.setContext({ data: parsedResult.data, vars: operation.variables });
    return parsedResult;
  }
));

const client = new ApolloClient({
  // uri: 'http://localhost:1984/graphql',
  cache: new InMemoryCache(),
  link: from([
    // chainRequestLink,
    mapLink,
    new HttpLink({ uri: 'https://arweave.net/graphql' }),
  ]),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'ignore',
    },
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
  }
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
        <CssBaseline />
        <Layout>
          <Outlet />
        </Layout>
      </ThemeProvider>
    </ApolloProvider>
  )
};

export default Root;