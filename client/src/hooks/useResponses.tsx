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
import FairSDKWeb from '@fair-protocol/sdk/web';
import { useEffect } from 'react';
import { commonUpdateQuery } from '@/utils/common';
import { PROTOCOL_NAME, PROTOCOL_VERSION, INFERENCE_RESPONSE } from '@/constants';

const useResponses = ({
  reqIds,
  conversationId,
  lastRequestId,
  first,
}: {
  reqIds: string[];
  conversationId: number;
  lastRequestId?: string;
  first?: number;
}) => {
  const { query: responsesQuery } = FairSDKWeb.utils.getResponsesQuery(
    reqIds,
    undefined,
    undefined,
    undefined,
    [],
    conversationId,
    first,
  );

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

  useEffect(() => {
    const variables = {
      tags: [
        { name: 'Protocol-Name', values: [PROTOCOL_NAME] },
        { name: 'Protocol-Version', values: [PROTOCOL_VERSION] },
        { name: 'Operation-Name', values: [INFERENCE_RESPONSE] },
        { name: 'Request-Transaction', values: reqIds },
      ],
      first: 10,
    };
    if (reqIds.length > 0) {
      getChatResponses({ variables, fetchPolicy: 'network-only', nextFetchPolicy: 'network-only' });
    }

    if (lastRequestId) {
      stopResponsePolling();
      const pollReqIds = [lastRequestId];
      const variables = {
        tags: [
          { name: 'Protocol-Name', values: [PROTOCOL_NAME] },
          { name: 'Protocol-Version', values: [PROTOCOL_VERSION] },
          { name: 'Operation-Name', values: [INFERENCE_RESPONSE] },
          { name: 'Request-Transaction', values: pollReqIds },
        ],
        first: 10,
      };
      pollResponses({ variables, pollInterval: 10000 });
    }
  }, [reqIds, lastRequestId, conversationId, first]);

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

  return {
    responsesData,
    responsesLoading,
    responseError,
    responseNetworkStatus,
    responsesPollingData,
    stopResponsePolling,
  };
};

export default useResponses;
