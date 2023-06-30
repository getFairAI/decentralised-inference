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

import { DEV_ARWEAVE_URL, NET_ARWEAVE_URL } from '../constants';
import { ITag, ITransactions } from '../interfaces/arweave';
import {
  ApolloClient,
  ApolloLink,
  ApolloQueryResult,
  FetchMoreQueryOptions,
  from,
  HttpLink,
  InMemoryCache,
  OperationVariables,
  split,
} from '@apollo/client';

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

export type fetchMoreFn = <
  TFetchData = unknown,
  TFetchVars extends OperationVariables = { tags: ITag[]; first: number },
>(
  fetchMoreOptions: FetchMoreQueryOptions<TFetchVars, TFetchData> & {
    updateQuery?: (
      previousQueryResult: TFetchData,
      options: {
        fetchMoreResult: TFetchData;
        variables: TFetchVars;
      },
    ) => TFetchData;
  },
) => Promise<ApolloQueryResult<TFetchData | undefined>>;
