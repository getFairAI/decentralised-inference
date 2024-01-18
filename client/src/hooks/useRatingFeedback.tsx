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

import { DEFAULT_TAGS, TAG_NAMES, USER_FEEDBACK } from '@/constants';
import { QUERY_TX_WITH } from '@/queries/graphql';
import { NetworkStatus, useQuery } from '@apollo/client';
import FairSDKWeb from '@fair-protocol/sdk/web';
import { useEffect, useState } from 'react';

const useRatingFeedback = (userAddr: string) => {
  const [ isActiveUser, setIsActiveUser ] = useState(false);
  const [ showFeedback, setShowFeedback ] = useState(false);

  const { query: requestsQuery, variables: requestVars } = FairSDKWeb.utils.getRequestsQuery(userAddr);
  const {
    data: requestsData,
    networkStatus: requestNetworkStatus,
  } = useQuery(requestsQuery, { variables: requestVars });

  const {
    data: feedbackData
  } = useQuery(QUERY_TX_WITH, {
    variables: {
      tags: [
        ...DEFAULT_TAGS,
        { name: TAG_NAMES.operationName, values: [ USER_FEEDBACK ] },
      ],
      address: userAddr,
    }
  });

  useEffect(() => {
    if (requestsData && requestNetworkStatus === NetworkStatus.ready) {
      setIsActiveUser(requestsData.transactions.edges.length > 5); // is Active user if more than 5 requests
    }
  }, [requestsData, requestNetworkStatus, setIsActiveUser]);

  useEffect(() => {
    if (feedbackData) {
      const hasIgnoredFeedback = localStorage.getItem('ignoreFeedback');
      // show feedback if user has not ignored it, has not previously given feedback and is active user (has made more than 5 requests)
      setShowFeedback(hasIgnoredFeedback === null && feedbackData.transactions.edges.length === 0 && isActiveUser);
    }
  }, [ feedbackData, isActiveUser]);

  return { showFeedback, setShowFeedback };
};

export default useRatingFeedback;
