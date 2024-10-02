/*
 * Fair Protocol, open source decentralised inference marketplace for artificial intelligence.
 * Copyright (C) 2023 Fair Protocol
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 */

import { NET_ARWEAVE_URL } from '../constants';
import { ApolloClient, from, HttpLink, InMemoryCache, split, Observable } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { enqueueSnackbar } from 'notistack';

const retryTimeout = 2000;

const errorLink = onError(({ graphQLErrors, operation, forward }) => {
  if (graphQLErrors && graphQLErrors[0]?.message === 'query timed out') {
    // retry the request with exponential increase in delay
    enqueueSnackbar('Query timed out. Retrying...', { variant: 'info' });
    return new Observable((observer) => {
      const timer = setTimeout(() => {
        forward(operation).subscribe({
          next: observer.next.bind(observer),
          error: observer.error.bind(observer),
          complete: observer.complete.bind(observer),
        });
      }, retryTimeout);

      return () => clearTimeout(timer);
    });
  }

  // To retry on network errors, we recommend the RetryLink
  // instead of the onError link. This just logs the error.
  // if (networkError) {
  //   console.log(`[Network error]: ${networkError}`);
  // }
});

const irysUrl = 'https://arweave.mainnet.irys.xyz/graphql';

export const client = new ApolloClient({
  // uri: 'http://localhost:1984/graphql',
  cache: new InMemoryCache(),
  link: from([
    errorLink,
    split(
      (operation) =>
        !operation.getContext().clientName || operation.getContext().clientName === 'arweave', // by default use arweave
      new HttpLink({ uri: NET_ARWEAVE_URL + '/graphql' }),
      new HttpLink({ uri: irysUrl }),
    ),
  ]),
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
