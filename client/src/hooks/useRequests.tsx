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

import {
  INFERENCE_REQUEST,
  PROTOCOL_NAME,
  PROTOCOL_VERSION,
  RETROSPECTIVE_SOLUTION,
  TAG_NAMES,
} from '@/constants';
import { NetworkStatus, useLazyQuery } from '@apollo/client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { irysQuery } from '@/queries/graphql';
import { commonUpdateQuery } from '@/utils/common';
import { findByTagsDocument, findByTagsQuery } from '@fairai/evm-sdk';

const useRequests = ({
  userAddrs,
  solutionTx,
  conversationId,
  first,
  requestCaller,
}: {
  userAddrs: string[];
  requestCaller?: string;
  solutionTx?: string;
  conversationId?: number;
  first?: number;
}) => {
  const [hasRequestNextPage, setHasRequestNextPage] = useState(false);
  const [hasAORequestNextPage, setHasAORequestNextPage] = useState(false);

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
  const [
    getChatAoRequests,
    {
      data: requestsAOData,
      loading: requestsAOLoading,
      error: requestAOError,
      networkStatus: requestAONetworkStatus,
      fetchMore: requestAOFetchMore,
    },
  ] = useLazyQuery(findByTagsDocument);

  useEffect(() => {
    if (!userAddrs || userAddrs.length === 0) {
      // skip fetching while user address is not loaded
      return;
    }
    const tags = [
      { name: TAG_NAMES.operationName, values: [INFERENCE_REQUEST] },
      { name: TAG_NAMES.protocolVersion, values: [PROTOCOL_VERSION] },
      { name: TAG_NAMES.protocolName, values: [PROTOCOL_NAME] },
    ];

    if (conversationId && solutionTx === RETROSPECTIVE_SOLUTION) {
      //
      tags.splice(0, 0, { name: 'Conversation-ID', values: [conversationId.toString()] });
    } else if (conversationId) {
      tags.splice(0, 0, {
        name: TAG_NAMES.conversationIdentifier,
        values: [conversationId.toString()],
      });
    }

    if (solutionTx === RETROSPECTIVE_SOLUTION) {
      tags.splice(0, 0, { name: 'Request-Type', values: ['Report'] });
    }

    if (solutionTx) {
      tags.splice(0, 0, { name: TAG_NAMES.solutionTransaction, values: [solutionTx] });
    }

    getChatRequests({
      variables: {
        tags,
        owners: userAddrs,
        first: first ?? 10,
      },
      context: {
        clientName: 'irys',
      },
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
      notifyOnNetworkStatusChange: true,
    });

    // add request caller tag for ao requests and remove the owner tag
    if (requestCaller || userAddrs.length > 0) {
      tags.splice(0, 0, {
        name: 'Request-Caller',
        values: requestCaller ? [requestCaller] : userAddrs,
      });
    }

    getChatAoRequests({
      variables: {
        tags,
        first: first ?? 10,
      },
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
      notifyOnNetworkStatusChange: true,
    });
  }, [userAddrs, conversationId, first]);

  useEffect(() => {
    if (requestsData && requestNetworkStatus === NetworkStatus.ready) {
      setHasRequestNextPage(requestsData?.transactions?.pageInfo?.hasNextPage);
    }
  }, [requestsData, requestNetworkStatus, setHasRequestNextPage]);

  useEffect(() => {
    if (requestsAOData && requestAONetworkStatus === NetworkStatus.ready) {
      setHasAORequestNextPage(requestsAOData?.transactions?.pageInfo?.hasNextPage);
    }
  }, [requestsAOData, requestAONetworkStatus, setHasAORequestNextPage]);

  const handleFetchMore = useCallback(() => {
    if (requestsData?.transactions?.edges && requestsData.transactions.edges.length > 0) {
      const lastTx =
        requestsData?.transactions.edges[requestsData.transactions.edges.length - 1].cursor;
      requestFetchMore({
        variables: {
          after: lastTx,
        },
        updateQuery: commonUpdateQuery,
      });
    }
  }, [requestsData]);

  const handleAOFetchMore = useCallback(() => {
    if (requestsAOData?.transactions?.edges && requestsAOData.transactions.edges.length > 0) {
      const lastTx =
        requestsAOData?.transactions.edges[requestsAOData.transactions.edges.length - 1].cursor;
      requestAOFetchMore({
        variables: {
          after: lastTx,
        },
        updateQuery: (prev: findByTagsQuery, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return prev;
          }

          return Object.assign({}, prev, {
            transactions: {
              edges: [...prev.transactions.edges, ...fetchMoreResult.transactions.edges],
              pageInfo: fetchMoreResult.transactions.pageInfo,
            },
          });
        },
      });
    }
  }, [requestsAOData]);

  const joinedRequestsData = useMemo(() => {
    if (!requestsData && !requestsAOData) {
      return undefined;
    }

    if (!requestsData) {
      return requestsAOData;
    }
    if (!requestsAOData) {
      return requestsData;
    }

    const transactions = [
      ...requestsData.transactions.edges,
      ...requestsAOData.transactions.edges,
    ].sort((a, b) => {
      return b.node.timestamp - a.node.timestamp;
    });

    return {
      transactions: {
        edges: transactions,
        pageInfo: {
          hasNextPage:
            requestsData.transactions.pageInfo.hasNextPage ||
            requestsAOData.transactions.pageInfo.hasNextPage,
        },
      },
    };
  }, [requestsData, requestsAOData]);

  const joinedFetchMore = useCallback(() => {
    if (requestsData && requestsData.transactions.pageInfo.hasNextPage) {
      handleFetchMore();
    } else if (requestsAOData && requestsAOData.transactions.pageInfo.hasNextPage) {
      handleAOFetchMore();
    }
  }, [requestsData, requestsAOData, handleFetchMore, handleAOFetchMore]);

  return {
    requestsData: joinedRequestsData,
    requestsLoading: requestsLoading || requestsAOLoading,
    requestError: requestError || requestAOError,
    requestNetworkStatus: requestNetworkStatus || requestAONetworkStatus,
    hasRequestNextPage: hasRequestNextPage || hasAORequestNextPage,
    fetchMore: joinedFetchMore,
  };
};

export default useRequests;
