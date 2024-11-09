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

import { useLazyQuery } from '@apollo/client';
import { useCallback, useEffect, useMemo } from 'react';
import { commonUpdateQuery } from '@/utils/common';
import { PROTOCOL_NAME, PROTOCOL_VERSION, INFERENCE_RESPONSE } from '@/constants';
import { responsesQuery } from '@/queries/graphql';

const useResponses = ({
  reqIds,
  conversationId,
  lastRequestId,
  first,
  owners,
}: {
  reqIds: string[];
  conversationId: number;
  lastRequestId?: string;
  first?: number;
  owners?: string[];
}) => {
  const [
    getChatAOResponses,
    {
      data: responsesAOData,
      error: responseAOError,
      loading: responsesAOLoading,
      networkStatus: responseAONetworkStatus,
      fetchMore: responsesAOFetchMore,
    },
  ] = useLazyQuery(responsesQuery);
  const [
    getChatResponses,
    {
      data: responsesData,
      error: responseError,
      loading: responsesLoading,
      networkStatus: responseNetworkStatus,
      fetchMore: responsesFetchMore,
    },
  ] = useLazyQuery(responsesQuery);

  const [pollResponses, { data: responsesPollingData, stopPolling: stopResponsePolling }] =
    useLazyQuery(responsesQuery, {
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
    });
  const [pollAOResponses, { data: responsesAOPollingData, stopPolling: stopResponseAOPolling }] =
    useLazyQuery(responsesQuery, {
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
    });

  useEffect(() => {
    if (reqIds.length > 0) {
      const AOvariables = {
        tags: [{ name: 'Pushed-For', values: reqIds }],
        recipients: ['ARrzKTW93CuLRbcOo63YlA3l1VEuw8OvZ43RcRMzBnM'],
        owners: undefined,
        first: 100,
      };
      getChatAOResponses({
        variables: AOvariables,
        fetchPolicy: 'network-only',
        nextFetchPolicy: 'network-only',
        notifyOnNetworkStatusChange: true,
      });
      const variables = {
        tags: [
          { name: 'Request-Transaction', values: reqIds },
          { name: 'Operation-Name', values: [INFERENCE_RESPONSE] },
          { name: 'Protocol-Name', values: [PROTOCOL_NAME] },
          { name: 'Protocol-Version', values: [PROTOCOL_VERSION] },
        ],
        owners: ['SsoNc_AAEgS1S0cMVUUg3qRUTuNtwQyzsQbGrtTAs-Q'],
        first: 10,
      };
      getChatResponses({
        variables,
        fetchPolicy: 'network-only',
        nextFetchPolicy: 'network-only',
        notifyOnNetworkStatusChange: true,
      });
    }

    if (lastRequestId) {
      stopResponsePolling();
      stopResponseAOPolling();
      const pollReqIds = [lastRequestId];
      const variables = {
        tags: [
          { name: 'Request-Transaction', values: pollReqIds },
          { name: 'Operation-Name', values: [INFERENCE_RESPONSE] },
          { name: 'Protocol-Name', values: [PROTOCOL_NAME] },
          { name: 'Protocol-Version', values: [PROTOCOL_VERSION] },
        ],
        owners: ['SsoNc_AAEgS1S0cMVUUg3qRUTuNtwQyzsQbGrtTAs-Q'],
        first: 10,
      };
      pollResponses({ variables, pollInterval: 10000, notifyOnNetworkStatusChange: true });
      const AOvariables = {
        tags: [{ name: 'Pushed-For', values: pollReqIds }],
        recipients: ['ARrzKTW93CuLRbcOo63YlA3l1VEuw8OvZ43RcRMzBnM'],
        owners: undefined,
        first: 10,
      };
      pollAOResponses({
        variables: AOvariables,
        pollInterval: 10000,
        notifyOnNetworkStatusChange: true,
      });
    }
  }, [reqIds, lastRequestId, conversationId, first, owners]);

  useEffect(() => {
    if (responsesData?.transactions?.pageInfo?.hasNextPage) {
      responsesFetchMore({
        variables: {
          after:
            responsesData.transactions.edges.length > 0
              ? responsesData.transactions.edges[responsesData.transactions.edges.length - 1].cursor
              : undefined,
        },
        updateQuery: commonUpdateQuery,
      });
    }
  }, [responsesData]);

  useEffect(() => {
    if (responsesAOData?.transactions?.pageInfo?.hasNextPage) {
      responsesAOFetchMore({
        variables: {
          after:
            responsesAOData.transactions.edges.length > 0
              ? responsesAOData.transactions.edges[responsesAOData.transactions.edges.length - 1]
                  .cursor
              : undefined,
        },
        updateQuery: commonUpdateQuery,
      });
    }
  }, [responsesAOData]);

  const joinedResponsesData = useMemo(() => {
    if (!responsesData && !responsesAOData) {
      return undefined;
    }

    if (!responsesData) {
      return responsesAOData;
    }
    if (!responsesAOData) {
      return responsesData;
    }

    const transactions = [
      ...responsesData.transactions.edges,
      ...responsesAOData.transactions.edges,
    ].sort((a, b) => {
      return b.node.timestamp - a.node.timestamp;
    });

    return {
      transactions: {
        edges: transactions,
        pageInfo: {
          hasNextPage:
            responsesData.transactions.pageInfo.hasNextPage ||
            responsesAOData.transactions.pageInfo.hasNextPage,
        },
      },
    };
  }, [responsesData, responsesAOData]);

  const joinedResponsesPollingData = useMemo(() => {
    if (!responsesPollingData && !responsesAOPollingData) {
      return undefined;
    }

    if (!responsesPollingData) {
      return responsesAOPollingData;
    }
    if (!responsesAOPollingData) {
      return responsesPollingData;
    }

    const transactions = [
      ...responsesPollingData.transactions.edges,
      ...responsesAOPollingData.transactions.edges,
    ].sort((a, b) => {
      return b.node.timestamp - a.node.timestamp;
    });

    return {
      transactions: {
        edges: transactions,
        pageInfo: {
          hasNextPage:
            responsesPollingData.transactions.pageInfo.hasNextPage ||
            responsesAOPollingData.transactions.pageInfo.hasNextPage,
        },
      },
    };
  }, [responsesPollingData, responsesAOPollingData]);

  const stopJoinedResponsesPolling = useCallback(() => {
    if (stopResponsePolling) {
      stopResponsePolling();
    }

    if (stopResponseAOPolling) {
      stopResponseAOPolling();
    }
  }, [stopResponsePolling, stopResponseAOPolling]);

  return {
    responsesData: joinedResponsesData,
    responsesLoading: responsesLoading || responsesAOLoading,
    responseError: responseError || responseAOError,
    responseNetworkStatus: responseNetworkStatus || responseAONetworkStatus,
    responsesPollingData: joinedResponsesPollingData,
    stopResponsePolling: stopJoinedResponsesPolling,
  };
};

export default useResponses;
