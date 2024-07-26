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

import { PROTOCOL_NAME, PROTOCOL_VERSION, TAG_NAMES, USER_FEEDBACK } from '@/constants';
import { NetworkStatus, gql, useQuery } from '@apollo/client';
import { useEffect, useState } from 'react';
import useRequests from './useRequests';

const irysQuery = gql`
  query requestsOnIrys($tags: [TagFilter!], $owners: [String!], $first: Int, $after: String) {
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

const useRatingFeedback = (userAddrs: string[]) => {
  const [isActiveUser, setIsActiveUser] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const { requestsData, requestNetworkStatus } = useRequests({
    userAddrs,
  });

  const { data: feedbackData } = useQuery(irysQuery, {
    variables: {
      tags: [
        {
          name: TAG_NAMES.protocolName,
          values: [PROTOCOL_NAME],
        },
        {
          name: TAG_NAMES.protocolVersion,
          values: [PROTOCOL_VERSION],
        },
        { name: TAG_NAMES.operationName, values: [USER_FEEDBACK] },
      ],
      owners: userAddrs,
    },
    context: {
      clientName: 'irys',
    },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    skip: !userAddrs || userAddrs.length === 0,
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
      setShowFeedback(
        hasIgnoredFeedback === null && feedbackData.transactions.edges.length === 0 && isActiveUser,
      );
    }
  }, [feedbackData, isActiveUser]);

  return { showFeedback, setShowFeedback };
};

export default useRatingFeedback;
