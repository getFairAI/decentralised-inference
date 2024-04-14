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

import { TAG_NAMES } from '@/constants';
import { commonUpdateQuery } from '@/utils/common';
import { NetworkStatus, gql, useLazyQuery } from '@apollo/client';
import { useEffect, useState } from 'react';

const useRequests = ({
  userAddr,
  scriptTransaction,
  conversationId,
  first,
}: {
  userAddr: string;
  scriptTransaction: string;
  conversationId: number;
  first?: number;
}) => {
  const [hasRequestNextPage, setHasRequestNextPage] = useState(false);
  const irysQuery = gql`
    query requestsOnIrys($tags: [TagFilter!], $owners: [String!], $first: Int, $after: String)  {
      transactions(tags: $tags, owners: $owners, first: $first, after: $after, order: DESC) {
        edges {
          node {
            id
            tags {
              name
              value
            }
            address
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  `;

  const [
    getChatRequests,
    {
      data: requestsData,
      loading: requestsLoading,
      error: requestError,
      networkStatus: requestNetworkStatus,
      fetchMore: requestFetchMore,
    },
  ] = useLazyQuery(irysQuery);
  useEffect(() => {
    if (!userAddr) {
      // skip fetching while user address is not loaded
      return;
    }
    getChatRequests({
      variables: {
        tags: [
          { name: TAG_NAMES.protocolName, values: ['FairAI'] },
          { name: TAG_NAMES.protocolVersion, values: ['2.0-test'] },
          { name: TAG_NAMES.operationName, values: ['Inference Request'] },
          { name: TAG_NAMES.scriptTransaction, values: [scriptTransaction] },
          { name: TAG_NAMES.conversationIdentifier, values: [conversationId.toString()] },
        ],
        owners: [ userAddr ],
        first: 10
      },
      context: {
        clientName: 'irys'
      },
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
    });
  }, [userAddr, conversationId, first]);

  useEffect(() => {
    if (requestsData && requestNetworkStatus === NetworkStatus.ready) {
      setHasRequestNextPage(requestsData.transactions.pageInfo.hasNextPage);
    }
  }, [requestsData, requestNetworkStatus, setHasRequestNextPage]);


  const fetchMore = () => {
    requestFetchMore({
      variables: {
        after: requestsData.transactions.pageInfo.endCursor,
      },
      updateQuery: commonUpdateQuery,
    });
  };

  return {
    requestsData,
    requestsLoading,
    requestError,
    requestNetworkStatus,
    hasRequestNextPage,
    fetchMore,
  };
};

export default useRequests;
