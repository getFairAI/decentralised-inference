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

import { NetworkStatus, useLazyQuery } from '@apollo/client';
import FairSDKWeb from '@fair-protocol/sdk/web';
import { useEffect, useState } from 'react';

const useRequests = ({
  userAddr,
  scriptName,
  scriptCurator,
  scriptOperator,
  conversationId,
  first,
}: {
  userAddr: string;
  scriptName: string;
  scriptCurator: string;
  scriptOperator: string;
  conversationId: number;
  first?: number;
}) => {
  const [hasRequestNextPage, setHasRequestNextPage] = useState(false);
  const { query: requestsQuery } = FairSDKWeb.utils.getRequestsQuery(userAddr);
  const [
    getChatRequests,
    {
      data: requestsData,
      loading: requestsLoading,
      error: requestError,
      networkStatus: requestNetworkStatus,
      fetchMore: requestFetchMore,
    },
  ] = useLazyQuery(requestsQuery);
  useEffect(() => {
    if (!userAddr) {
      // skip fetching while user address is not loaded
      return;
    }

    const { variables: queryParams } = FairSDKWeb.utils.getRequestsQuery(
      userAddr,
      scriptName,
      scriptCurator,
      scriptOperator,
      conversationId,
      first,
    );
    getChatRequests({ variables: queryParams, fetchPolicy: 'network-only', nextFetchPolicy: 'network-only' });
  }, [userAddr, scriptName, scriptCurator, scriptOperator, conversationId, first]);

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
    hasRequestNextPage,
    requestFetchMore,
  };
};

export default useRequests;
