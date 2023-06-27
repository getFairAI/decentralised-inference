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
  VAULT_ADDRESS,
  CANCEL_OPERATION,
  U_CONTRACT_ID,
  INFERENCE_PAYMENT,
  SCRIPT_INFERENCE_RESPONSE,
  OPERATOR_REGISTRATION_AR_FEE,
  U_DIVIDER,
  REGISTER_OPERATION,
} from '@/constants';
import { IEdge } from '@/interfaces/arweave';
import { QUERY_TX_WITH, FIND_BY_TAGS } from '@/queries/graphql';
import { client } from './apollo';
import { findTag } from './common';

const getOperatorRequests = async (
  address: string,
  operatorFee: string,
  scriptName: string,
  scriptCurator: string,
) => {
  const qty = parseFloat(operatorFee);
  const requestPaymentsInputNumber = JSON.stringify({
    function: 'transfer',
    target: address,
    qty,
  });
  const requestPaymentsInputStr = JSON.stringify({
    function: 'transfer',
    target: address,
    qty: qty.toString(),
  });
  const { data } = await client.query({
    query: FIND_BY_TAGS,
    variables: {
      first: N_PREVIOUS_BLOCKS,
      tags: [
        ...DEFAULT_TAGS,
        { name: TAG_NAMES.contract, values: [U_CONTRACT_ID] },
        { name: TAG_NAMES.input, values: [requestPaymentsInputNumber, requestPaymentsInputStr] },
        { name: TAG_NAMES.operationName, values: [INFERENCE_PAYMENT] },
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
    { name: TAG_NAMES.operationName, values: [SCRIPT_INFERENCE_RESPONSE] },
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

const isCancelled = async (txid: string, opAdress: string) => {
  const cancelTags = [
    ...DEFAULT_TAGS,
    { name: TAG_NAMES.operationName, values: [CANCEL_OPERATION] },
    { name: TAG_NAMES.registrationTransaction, values: [txid] },
  ];
  const { data } = await client.query({
    query: QUERY_TX_WITH,
    variables: { tags: cancelTags, address: opAdress },
  });

  return data.transactions.edges.length > 0;
};

export const isValidRegistration = async (
  txid: string,
  operatorFee: string,
  opAddress: string,
  scriptName: string,
  scriptCurator: string,
) => {
  const isCancelledTx = await isCancelled(txid, opAddress);
  if (isCancelledTx) {
    return false;
  }

  const lastRequests = await getOperatorRequests(opAddress, operatorFee, scriptName, scriptCurator);
  for (const request of lastRequests) {
    // check if operator has answered last 7 requests
    if (!(await hasOperatorAnswered(request, opAddress))) {
      // if any of the last 7 requests has not been answered, the operator is not valid
      return false;
    }
  }

  return true;
};

export const checkHasOperators = async (scriptTx: IEdge, filtered: IEdge[]) => {
  const elementsPerPage = 5;

  const operatorRegistrationInputNumber = JSON.stringify({
    function: 'transfer',
    target: VAULT_ADDRESS,
    qty: parseFloat(OPERATOR_REGISTRATION_AR_FEE) * U_DIVIDER,
  });
  const operatorRegistrationInputStr = JSON.stringify({
    function: 'transfer',
    target: VAULT_ADDRESS,
    qty: (parseFloat(OPERATOR_REGISTRATION_AR_FEE) * U_DIVIDER).toString(),
  });

  const registrationTags = [
    ...DEFAULT_TAGS,
    {
      name: TAG_NAMES.operationName,
      values: [REGISTER_OPERATION],
    },
    {
      name: TAG_NAMES.scriptCurator,
      values: [findTag(scriptTx, 'sequencerOwner')],
    },
    {
      name: TAG_NAMES.scriptName,
      values: [findTag(scriptTx, 'scriptName')],
    },
    { name: TAG_NAMES.contract, values: [U_CONTRACT_ID] },
    {
      name: TAG_NAMES.input,
      values: [operatorRegistrationInputNumber, operatorRegistrationInputStr],
    },
  ];
  const queryResult = await client.query({
    query: FIND_BY_TAGS,
    variables: { tags: registrationTags, first: elementsPerPage },
  });

  if (queryResult.data.transactions.edges.length === 0) {
    filtered.splice(
      filtered.findIndex((el) => el.node.id === scriptTx.node.id),
      1,
    );
  } else {
    let hasAtLeastOneValid = false;
    for (const registration of queryResult.data.transactions.edges) {
      const opFee = findTag(registration, 'operatorFee') as string;
      const scriptName = findTag(registration, 'scriptName') as string;
      const scriptCurator = findTag(registration, 'scriptCurator') as string;
      const registrationOwner = findTag(registration, 'sequencerOwner') as string;

      if (
        await isValidRegistration(
          registration.node.id,
          opFee,
          registrationOwner,
          scriptName,
          scriptCurator,
        )
      ) {
        filtered.push(scriptTx);
        hasAtLeastOneValid = true;
      }
    }
    const arrayPos = filtered.findIndex((existing) => scriptTx.node.id === existing.node.id);
    if (!hasAtLeastOneValid && arrayPos >= 0) {
      filtered.splice(arrayPos, 1);
    }
  }
};
