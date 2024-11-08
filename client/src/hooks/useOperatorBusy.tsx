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

import { PROTOCOL_NAME, PROTOCOL_VERSION, INFERENCE_RESPONSE, TAG_NAMES } from '@/constants';
import { EVMWalletContext } from '@/context/evm-wallet';
import { QUERY_CHAT_RESPONSES } from '@/queries/graphql';
import { client } from '@/utils/apollo';
import { useLazyQuery } from '@apollo/client';
import { decodeTxMemo, findByIdDocument, subscribe } from '@fairai/evm-sdk';
import { useContext, useEffect, useState } from 'react';
import { Log } from 'viem';

const useOperatorBusy = (operatorAddr: string) => {
  const [isOperatorBusy, setIsOperatorBusy] = useState(false);
  const [necessaryResponses, setNecessaryResponses] = useState(0);
  const { currentAddress } = useContext(EVMWalletContext);
  // query last 100 requests for operator

  const [getOperatorResponses, { data: operatorResponsesData, startPolling, stopPolling }] =
    useLazyQuery(QUERY_CHAT_RESPONSES);

  const handleOperatorReceivedPayment = async (log: Log[]) => {
    setIsOperatorBusy(true);

    const arweaveRequest = await decodeTxMemo(log.pop()?.transactionHash as `0x${string}`);

    const { data } = await client.query({
      query: findByIdDocument,
      variables: { ids: [arweaveRequest] },
    });
    const tags = data.transactions.edges[0].node.tags;

    const necessaryResponses =
      parseFloat(tags.find((tag) => tag.name === TAG_NAMES.nImages)?.value as string) ?? 1;
    setNecessaryResponses(necessaryResponses);

    getOperatorResponses({
      variables: {
        tagsResponses: [
          { name: TAG_NAMES.protocolName, values: [PROTOCOL_NAME] },
          { name: TAG_NAMES.protocolVersion, values: [PROTOCOL_VERSION] },
          { name: TAG_NAMES.operationName, values: [INFERENCE_RESPONSE] },
          { name: TAG_NAMES.requestTransaction, values: [arweaveRequest] },
        ],
        operators: [operatorAddr],
        first: necessaryResponses,
      },
      fetchPolicy: 'no-cache',
    });
    startPolling(5000);
  };

  useEffect(() => {
    //
    let unwatch: () => void;
    if (currentAddress && operatorAddr) {
      unwatch = subscribe(operatorAddr as `0x${string}`, handleOperatorReceivedPayment);
    }

    return () => {
      if (unwatch) {
        unwatch();
      }
    };
  }, [operatorAddr, currentAddress]);

  useEffect(() => {
    if (operatorResponsesData && operatorResponsesData.transactions.edges.length > 0) {
      const txs = operatorResponsesData.transactions.edges;

      if (txs.length >= necessaryResponses) {
        setIsOperatorBusy(false);
        stopPolling();
      } else {
        setIsOperatorBusy(true);
      }
    }
  }, [operatorResponsesData, necessaryResponses]);

  return isOperatorBusy;
};

export default useOperatorBusy;
