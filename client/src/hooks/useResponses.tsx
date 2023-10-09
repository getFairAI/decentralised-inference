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

import { NetworkStatus, gql, useLazyQuery } from '@apollo/client';
import FairSDKWeb from 'fair-protocol-sdk/web';
import { RefObject, useEffect, useState } from 'react';
import useOnScreen from './useOnScreen';
import { commonUpdateQuery } from '@/utils/common';

const useResponses = ({
  target,
  reqIds,
  userAddr,
  scriptName,
  scriptCurator,
  scriptOperators,
  conversationId,
  lastRequestId,
  first,
}: {
  target: RefObject<HTMLDivElement>;
  reqIds: string[];
  userAddr: string;
  scriptName: string;
  scriptCurator: string;
  scriptOperators: string[];
  conversationId: number;
  lastRequestId?: string;
  first?: number;
}) => {
  const [hasResponsesNextPage, setHasResponsesNextPage] = useState(false);
  const { query: responsesQuery } = FairSDKWeb.utils.getResponsesQuery(
    reqIds,
    userAddr,
    scriptName,
    scriptCurator,
    scriptOperators,
    conversationId,
    first,
  );
  const isOnScreen = useOnScreen(target);
  const [
    getChatResponses,
    {
      data: responsesData,
      error: responseError,
      loading: responsesLoading,
      networkStatus: responseNetworkStatus,
      fetchMore: responsesFetchMore,
    },
  ] = useLazyQuery(gql(responsesQuery));

  const [pollResponses, { data: responsesPollingData, stopPolling: stopResponsePolling }] =
    useLazyQuery(gql(responsesQuery), {
      fetchPolicy: 'no-cache',
      nextFetchPolicy: 'no-cache',
    });

  useEffect(() => {
    const { variables: queryParams } = FairSDKWeb.utils.getResponsesQuery(
      reqIds,
      userAddr,
      scriptName,
      scriptCurator,
      scriptOperators,
      conversationId,
      first,
    );
    if (reqIds.length > 0) {
      getChatResponses({ variables: queryParams });
    }

    if (lastRequestId) {
      stopResponsePolling();
      const pollReqIds = [lastRequestId];
      const { variables: pollQueryParams } = FairSDKWeb.utils.getResponsesQuery(
        pollReqIds,
        userAddr,
        scriptName,
        scriptCurator,
        scriptOperators,
        conversationId,
      );
      pollResponses({ variables: { ...pollQueryParams }, pollInterval: 10000 });
    }
  }, [
    reqIds,
    userAddr,
    scriptName,
    scriptCurator,
    scriptOperators,
    lastRequestId,
    conversationId,
    first,
  ]);

  useEffect(() => {
    if (responsesData && hasResponsesNextPage) {
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
  }, [isOnScreen, hasResponsesNextPage]);

  useEffect(() => {
    if (responsesData && responseNetworkStatus === NetworkStatus.ready) {
      setHasResponsesNextPage(responsesData.transactions.pageInfo.hasNextPage);
    }
  }, [responsesData, responseNetworkStatus, setHasResponsesNextPage]);

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
