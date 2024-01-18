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

import { DEFAULT_TAGS, SCRIPT_INFERENCE_REQUEST, SCRIPT_INFERENCE_RESPONSE, TAG_NAMES } from '@/constants';
import { IEdge } from '@/interfaces/arweave';
import { FIND_BY_TAGS, QUERY_CHAT_RESPONSES } from '@/queries/graphql';
import { findTag } from '@/utils/common';
import { useLazyQuery, useQuery } from '@apollo/client';
import _ from 'lodash';
import { useEffect, useState } from 'react';

const useOperatorBusy= (operatorAddr: string, currentUser: string) => {
  const [ isOperatorBusy, setIsOperatorBusy ] = useState(false);
  const [ necessaryResponses, setNecesaryResponses ] = useState(0);
  // query last 100 requests for operator
  
  const{
    data: requestsData,
    previousData: requestsPreviousData,
    startPolling: startPollingRequests,
    stopPolling: stopPollingRequests,
  } = useQuery(FIND_BY_TAGS, {
    variables: {
      tags: [
        ...DEFAULT_TAGS,
        { name: TAG_NAMES.operationName, values: [SCRIPT_INFERENCE_REQUEST] },
        { name: TAG_NAMES.scriptOperator, values: [ operatorAddr ] }
      ],
      first: 100
    },
    fetchPolicy: 'no-cache',
    nextFetchPolicy: 'no-cache',
  });

  const [ getOperatorResponses, {
    data: operatorResponsesData,
   }
  ] = useLazyQuery(QUERY_CHAT_RESPONSES);

  useEffect(() => {
    startPollingRequests(10000);

    return () => stopPollingRequests();
  }, [ startPollingRequests, stopPollingRequests ]);

  useEffect(() => {
    // filter out requests that are confirmed and not owned by current user
    if (requestsData && requestsData.transactions.edges.length > 0 && !_.isEqual(requestsData.transactions.edges, requestsPreviousData?.transactions?.edges)) {
      const txs = requestsData.transactions.edges;
      const { requestIds, nRequested } = txs
        .filter((request: IEdge) => request.node.block === null && request.node.owner.address !== currentUser)
        .reduce((acc: { requestIds: string[], nRequested: number }, request: IEdge) => {
          acc.requestIds.push(request.node.id);
          const nResponses = Number(findTag(request, 'nImages')) ?? 1;
          acc.nRequested += nResponses;

          return acc;
        }, { requestIds: [], nRequested: 0 });

      setNecesaryResponses(nRequested);
      if (nRequested > 0) {
        getOperatorResponses({
          variables: {
            tagsResponses: [
              ...DEFAULT_TAGS,
              { name: TAG_NAMES.operationName, values: [ SCRIPT_INFERENCE_RESPONSE ] },
              { name: TAG_NAMES.requestTransaction, values: requestIds },
            ],
            operators: [ operatorAddr ],
            first: nRequested
          },
          fetchPolicy: 'no-cache'
        });
      }
    }
  }, [ requestsData, requestsPreviousData, getOperatorResponses, operatorAddr, currentUser ]);

  useEffect(() => {
    if (operatorResponsesData && operatorResponsesData.transactions.edges.length > 0) {
      const txs = operatorResponsesData.transactions.edges;

      setIsOperatorBusy(txs.length < necessaryResponses);
    }
  }, [ operatorResponsesData, necessaryResponses ]);

  return isOperatorBusy;
};

export default useOperatorBusy;
