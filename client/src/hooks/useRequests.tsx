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

import { INFERENCE_REQUEST, PROTOCOL_NAME, PROTOCOL_VERSION, RETROSPECTIVE_SOLUTION, TAG_NAMES } from '@/constants';
import { IMessage } from '@/interfaces/common';
import ao from '@/utils/ao';
import { getData } from '@/utils/arweave';
import { useEffect, useState } from 'react';

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
  const [requests, setRequests] = useState<IMessage[]>([]);
  const [hasRequestNextPage, setHasRequestNextPage] = useState(false);

  useEffect(() => {
    (async () => {

      if (!userAddrs || userAddrs.length === 0) {
        // skip fetching while user address is not loaded
        return;
      }
      const tags = [
        { name: TAG_NAMES.protocolName, values: [PROTOCOL_NAME] },
        { name: TAG_NAMES.protocolVersion, values: [PROTOCOL_VERSION] },
        { name: TAG_NAMES.operationName, values: [INFERENCE_REQUEST] },
      ];
      if (solutionTx) {
        tags.push({ name: TAG_NAMES.solutionTransaction, values: [solutionTx] });
      }
  
      if (conversationId && solutionTx === RETROSPECTIVE_SOLUTION) {
        //
        tags.push({ name: 'Conversation-ID', values: [conversationId.toString()] });
      } else if (conversationId) {
        tags.push({ name: TAG_NAMES.conversationIdentifier, values: [conversationId.toString()] });
      }
  
      if (solutionTx === RETROSPECTIVE_SOLUTION) {
        tags.push({ name: 'Request-Type', values: ['Report'] });
      }

      try {
        const result = await ao.dryrun({
          process: 'h9AowtfL42rKUEV9C-LjsP5yWitnZh9n1cKLBZjipk8',
          tags,
        });
        const { Messages: [ { Data: requestsStr } ] } = result;

        const parsedRequests: IMessage[] = [];     
        
        for (const el of JSON.parse(requestsStr)) {
          const {
            Id: id,
            'Request-Caller': from,
            'File-Name': fileName,
            'TagArray': tags,
            'Conversation-Identifier': cid,
            'Block-Height': height,
            'Unix-Time': timestamp,
            'Content-Type': contentType,
          } = el;
          const data = await getData(id, fileName);
          const to = '';

          parsedRequests.push({
            id,
            from,
            to,
            msg: data,
            tags,
            cid,
            height,
            type: 'request',
            timestamp,
            contentType,
          });
        }
        
        setRequests(parsedRequests);
      } catch (err) {
        console.error('Error fetching requests', err);
      }
    })();
  }, [ ao, userAddrs, solutionTx, conversationId, first ]);

  return {
    requestsData: requests,
    /* requestsLoading,
    requestError,
    requestNetworkStatus, */
    hasRequestNextPage,
    /* fetchMore, */
  };
};

export default useRequests;
