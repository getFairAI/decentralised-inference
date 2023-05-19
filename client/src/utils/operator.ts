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

import {
  N_PREVIOUS_BLOCKS,
  DEFAULT_TAGS,
  TAG_NAMES,
  INFERENCE_PERCENTAGE_FEE,
  VAULT_ADDRESS,
} from '@/constants';
import { IEdge } from '@/interfaces/arweave';
import {
  QUERY_REQUESTS_FOR_OPERATOR,
  QUERY_TX_WITH,
  QUERY_PAYMENT_TO_VAULT_WITH,
} from '@/queries/graphql';
import { client } from './apollo';
import { findTag } from './common';

const getOperatorRequests = async (address: string, scriptName: string, scriptCurator: string) => {
  const { data } = await client.query({
    query: QUERY_REQUESTS_FOR_OPERATOR,
    variables: {
      recipient: address,
      first: N_PREVIOUS_BLOCKS,
      tags: [
        ...DEFAULT_TAGS,
        { name: TAG_NAMES.scriptName, values: [scriptName] },
        { name: TAG_NAMES.scriptCurator, values: [scriptCurator] },
      ],
    },
  });

  return data.transactions.edges as IEdge[];
};

const hasOperatorAnswered = async (request: IEdge, opAddress: string) => {
  const responseTags = [
    ...DEFAULT_TAGS,
    { name: TAG_NAMES.requestTransaction, values: [findTag(request, 'inferenceTransaction')] },
    { name: TAG_NAMES.operationName, values: ['Script Inference Response'] },
  ];

  const { data } = await client.query({
    query: QUERY_TX_WITH,
    variables: { tags: responseTags, address: opAddress },
  });

  if (data.transactions.edges.length === 0) {
    return false;
  } else {
    return true;
  }
};

const hasOperatorDistributedFees = async (
  request: IEdge,
  operatorFee: string,
  opAddress: string,
) => {
  const distributionAmount = parseFloat(operatorFee) * INFERENCE_PERCENTAGE_FEE;
  const feeDistributionTags = [
    ...DEFAULT_TAGS,
    { name: TAG_NAMES.requestTransaction, values: [findTag(request, 'inferenceTransaction')] },
    { name: TAG_NAMES.operationName, values: ['Fee Redistribution'] },
  ];

  const { data } = await client.query({
    query: QUERY_PAYMENT_TO_VAULT_WITH,
    variables: { tags: feeDistributionTags, owner: opAddress, recipient: VAULT_ADDRESS },
  });

  if (data.transactions.edges.length === 0) {
    return false;
  } else {
    const paymentTx = data.transactions.edges[0];
    return distributionAmount === parseFloat(paymentTx.node.quantity.winston);
  }
};

export const isValidRegistration = async (
  operatorFee: string,
  opAddress: string,
  scriptName: string,
  scriptCurator: string,
) => {
  const lastRequests = await getOperatorRequests(opAddress, scriptName, scriptCurator);
  let isValid = true;
  // check if operator answere last 7 requests
  for (const request of lastRequests) {
    // check if operator has answered last 7 requests
    if (
      !(await hasOperatorAnswered(request, opAddress)) ||
      !(await hasOperatorDistributedFees(request, operatorFee, opAddress))
    ) {
      // if any of the last 7 requests has not been answered, the operator is not valid
      isValid = false;
      return isValid;
    }
  }

  return isValid;
};
