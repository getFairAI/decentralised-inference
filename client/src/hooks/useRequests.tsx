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

const useRequests = ({
  target,
  userAddr,
  scriptName,
  scriptCurator,
  scriptOperator,
  conversationId,
  first,
}: {
  target: RefObject<HTMLDivElement>;
  userAddr: string;
  scriptName: string;
  scriptCurator: string;
  scriptOperator: string;
  conversationId: number;
  first?: number;
}) => {
  const [hasRequestNextPage, setHasRequestNextPage] = useState(false);
  const { query: requestsQuery } = FairSDKWeb.utils.getRequestsQuery(userAddr);
  const isOnScreen = useOnScreen(target);
  const [
    getChatRequests,
    {
      data: requestsData,
      loading: requestsLoading,
      error: requestError,
      networkStatus: requestNetworkStatus,
      fetchMore: requestFetchMore,
    },
  ] = useLazyQuery(gql(requestsQuery));

  const [pollRequests, { data: requestsPollingData, stopPolling: stopRequestPolling }] =
    useLazyQuery(gql(requestsQuery), {
      fetchPolicy: 'no-cache',
      nextFetchPolicy: 'no-cache',
    });

  useEffect(() => {
    const { variables: queryParams } = FairSDKWeb.utils.getRequestsQuery(
      userAddr,
      scriptName,
      scriptCurator,
      scriptOperator,
      conversationId,
      first,
    );
    getChatRequests({ variables: queryParams });
    stopRequestPolling();
    pollRequests({ variables: queryParams, pollInterval: 10000 });
  }, [userAddr, scriptName, scriptCurator, scriptOperator, conversationId, first]);

  useEffect(() => {
    if (isOnScreen && hasRequestNextPage) {
      if (!requestsData) {
        return;
      }

      requestFetchMore({
        variables: {
          after:
            requestsData.transactions.edges.length > 0
              ? requestsData.transactions.edges[requestsData.transactions.edges.length - 1].cursor
              : undefined,
        },
        updateQuery: commonUpdateQuery,
      });
    }
  }, [isOnScreen, hasRequestNextPage]);

  useEffect(() => {
    if (requestsData && requestNetworkStatus === NetworkStatus.ready) {
      setHasRequestNextPage(requestsData.transactions.pageInfo.hasNextPage);
    }
  }, [requestsData, requestNetworkStatus, setHasRequestNextPage]);

  return {
    requestsData,
    requestsLoading,
    requestError,
    requestNetworkStatus,
    requestsPollingData,
    stopRequestPolling,
  };
};

export default useRequests;
