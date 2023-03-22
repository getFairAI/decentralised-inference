import { DEV_ARWEAVE_URL, NET_ARWEAVE_URL } from '@/constants';
import { ITransactions } from '@/interfaces/arweave';
import { ApolloClient, ApolloLink, from, HttpLink, InMemoryCache, split } from '@apollo/client';

const mapLink = new ApolloLink((operation, forward) =>
  forward(operation).map((result) => {
    if (operation.operationName === 'history') {
      const nested = result.data as { owned: ITransactions; received: ITransactions };
      const parsedResult = {
        ...result,
        data: {
          owned: nested.owned.edges,
          received: nested.received.edges,
        },
      };

      return parsedResult;
    } else {
      return result;
    }
  }), 
);

export const client = new ApolloClient({
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
      fetchPolicy: 'network-only',
      errorPolicy: 'ignore',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
  },
});
