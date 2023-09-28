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
  CREATOR_PERCENTAGE_FEE,
  CURATOR_PERCENTAGE_FEE,
  MARKETPLACE_PERCENTAGE_FEE,
  PROTOCOL_NAME,
  SCRIPT_INFERENCE_REQUEST,
  OPERATOR_REGISTRATION_PAYMENT_TAGS,
} from '@/constants';
import { IContractEdge, IContractQueryResult, IEdge, IQueryResult } from '@/interfaces/arweave';
import { QUERY_TX_WITH, FIND_BY_TAGS, QUERY_TX_WITH_OWNERS } from '@/queries/graphql';
import { client } from './apollo';
import { findTag } from './common';
import { gql } from '@apollo/client';

const inputFnName = 'transfer';
const DEFAULT_PAGE_SIZE = 10;
const RADIX = 10;

const FIND_BY_TAGS_WITH_OWNERS = gql`
  query FIND_BY_TAGS_WITH_OWNERS(
    $owners: [String!]
    $tags: [TagFilter!]
    $first: Int!
    $after: String
  ) {
    transactions(owners: $owners, tags: $tags, first: $first, after: $after, sort: HEIGHT_DESC) {
      pageInfo {
        hasNextPage
      }
      edges {
        cursor
        node {
          id
          tags {
            name
            value
          }
          owner {
            address
            key
          }
        }
      }
    }
  }
`;

const QUERY_TX_BY_ID = gql`
  query QUERY_TX_BY_ID($id: ID!) {
    transactions(ids: [$id], sort: HEIGHT_DESC, first: 1) {
      pageInfo {
        hasNextPage
      }
      edges {
        cursor
        node {
          id
          tags {
            name
            value
          }
          owner {
            address
            key
          }
        }
      }
    }
  }
`;

const getRequestsQuery = (
  userAddress?: string,
  scriptName?: string,
  scriptCurator?: string,
  scriptOperator?: string,
  currenctConversationId?: number,
  first = DEFAULT_PAGE_SIZE,
  after?: string,
) => {
  const tags = [
    ...DEFAULT_TAGS,
    { name: TAG_NAMES.operationName, values: [SCRIPT_INFERENCE_REQUEST] },
  ];
  if (scriptName) {
    tags.push({ name: TAG_NAMES.scriptName, values: [scriptName] });
  }

  if (scriptCurator) {
    tags.push({ name: TAG_NAMES.scriptCurator, values: [scriptCurator] });
  }

  if (scriptOperator) {
    tags.push({ name: TAG_NAMES.scriptOperator, values: [scriptOperator] });
  }

  if (currenctConversationId) {
    tags.push({ name: TAG_NAMES.conversationIdentifier, values: [`${currenctConversationId}`] });
  }

  if (userAddress) {
    return {
      query: FIND_BY_TAGS_WITH_OWNERS,
      variables: {
        owners: [userAddress],
        tags,
        first,
        after,
      },
    };
  } else {
    return {
      query: FIND_BY_TAGS,
      variables: {
        tags,
        first,
        after,
      },
    };
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

const queryCheckUserPayment = async (
  inferenceTransaction: string,
  userAddress: string,
  scriptId: string,
) => {
  const tags = [
    {
      name: TAG_NAMES.protocolName,
      values: [PROTOCOL_NAME],
    },
    {
      name: TAG_NAMES.operationName,
      values: [INFERENCE_PAYMENT],
    },
    {
      name: TAG_NAMES.scriptTransaction,
      values: [scriptId],
    },
    {
      name: TAG_NAMES.inferenceTransaction,
      values: [inferenceTransaction],
    },
    {
      name: TAG_NAMES.contract,
      values: [U_CONTRACT_ID],
    },
    {
      name: TAG_NAMES.sequencerOwner,
      values: [userAddress],
    },
  ];

  const { data: result}: {data: IQueryResult} = await client.query({
    query: FIND_BY_TAGS, 
    variables: { tags, first: 4 },
  });

  return result.transactions.edges;
};

export const checkUserPaidInferenceFees = async (
  txid: string,
  userAddress: string,
  creatorAddress: string,
  curatorAddress: string,
  operatorFee: number,
  scriptId: string,
) => {
  const marketplaceShare = operatorFee * MARKETPLACE_PERCENTAGE_FEE;
  const curatorShare = operatorFee * CURATOR_PERCENTAGE_FEE;
  const creatorShare = operatorFee * CREATOR_PERCENTAGE_FEE;

  const paymentTxs = await queryCheckUserPayment(txid, userAddress, scriptId);
  const necessaryPayments = 3;

  if (paymentTxs.length < necessaryPayments) {
    return false;
  } else {
    const validPayments = paymentTxs.filter((tx) => {
      try {
        const input = findTag(tx, 'input');
        if (!input) {
          return false;
        }

        const inputObj = JSON.parse(input);
        const qty = parseInt(inputObj.qty, 10);
        if (inputObj.function !== inputFnName) {
          return false;
        } else if (qty >= marketplaceShare && inputObj.target === VAULT_ADDRESS) {
          return true;
        } else if (qty >= curatorShare && inputObj.target === curatorAddress) {
          return true;
        } else if (qty >= creatorShare && inputObj.target === creatorAddress) {
          return true;
        } else {
          return false;
        }
      } catch (error) {
        return false;
      }
    });

    return validPayments.length >= necessaryPayments;
  }
};

// app logic
const checkLastRequests = async (
  operatorAddr: string,
  operatorFee: string,
  scriptName: string,
  scriptCurator: string,
  isStableDiffusion?: boolean,
) => {
  const { query, variables } = getRequestsQuery(
    undefined,
    scriptName,
    scriptCurator,
    operatorAddr,
    undefined,
    N_PREVIOUS_BLOCKS,
  );

  const { data }: {data: IQueryResult} = await client.query({
    query,
    variables,
  });

  const baseFee = parseFloat(operatorFee);

  const validTxs: IEdge[] = [];
  for (const requestTx of data.transactions.edges) {
    const nImages = findTag(requestTx, 'nImages');
    const userAddr = requestTx.node.owner.address;
    const creatorAddr = findTag(requestTx, 'modelCreator') as string;
    const curatorAddr = findTag(requestTx, 'scriptCurator') as string;
    const scriptId = findTag(requestTx, 'scriptTransaction') as string;

    let isValidRequest = false;
    if (
      isStableDiffusion &&
      nImages &&
      (parseInt(nImages, RADIX) > 0 || parseInt(nImages, RADIX) < 10)
    ) {
      const actualFee = baseFee * parseInt(nImages, RADIX);

      isValidRequest = await checkUserPaidInferenceFees(
        requestTx.node.id,
        userAddr,
        creatorAddr,
        curatorAddr,
        actualFee,
        scriptId,
      );
    } else if (isStableDiffusion) {
      // default nImages
      const defaultNImages = 4;
      const actualFee = baseFee * defaultNImages;

      isValidRequest = await checkUserPaidInferenceFees(
        requestTx.node.id,
        userAddr,
        creatorAddr,
        curatorAddr,
        actualFee,
        scriptId,
      );
    } else {
      isValidRequest = await checkUserPaidInferenceFees(
        requestTx.node.id,
        userAddr,
        creatorAddr,
        curatorAddr,
        baseFee,
        scriptId,
      );
    }

    if (isValidRequest) {
      const hasAnswered = await hasOperatorAnswered(requestTx, operatorAddr);
      if (hasAnswered) {
        validTxs.push(requestTx);
      }
    } else {
      // ignore
      validTxs.push(requestTx);
    }
  }

  return validTxs.length === data.transactions.edges.length;
};

interface ITagFilter {
  name: string;
  values: string[];
};

const hasOperatorAnswered = async (request: IEdge | IContractEdge, opAddress: string) => {
  const responseTags: ITagFilter[] = [
    ...DEFAULT_TAGS,
    {
      name: TAG_NAMES.requestTransaction,
      values: [findTag(request, 'inferenceTransaction') as string],
    },
    { name: TAG_NAMES.operationName, values: [SCRIPT_INFERENCE_RESPONSE] },
  ];

  const { data }= await client.query({
    query: QUERY_TX_WITH_OWNERS,
    variables: {
      tags: responseTags,
      owners: [ opAddress],
    }
  });

  if (data.transactions.edges.length === 0) {
    return false;
  } else {
    return true;
  }
};

const isValidRegistration = async (
  txid: string,
  operatorFee: string,
  opAddress: string,
  scriptName: string,
  scriptCurator: string,
  isStableDiffusion?: boolean,
) => {
  const isCancelledTx = await isCancelled(txid, opAddress);
  if (isCancelledTx) {
    return false;
  }

  return checkLastRequests(opAddress, operatorFee, scriptName, scriptCurator, isStableDiffusion);
};

const getOperatorQueryForScript = (
  scriptId: string,
  scriptName?: string,
  scriptCurator?: string,
  first = DEFAULT_PAGE_SIZE,
  after?: string,
) => {
  const tags = [
    ...DEFAULT_TAGS,
    ...OPERATOR_REGISTRATION_PAYMENT_TAGS,
    { name: TAG_NAMES.scriptTransaction, values: [scriptId] },
  ];

  if (scriptName && scriptCurator) {
    tags.push({ name: TAG_NAMES.scriptName, values: [scriptName] });
    tags.push({ name: TAG_NAMES.scriptCurator, values: [scriptCurator] });
  }

  return {
    query: FIND_BY_TAGS,
    variables: {
      tags,
      first,
      after,
    },
  };
};

export const checkHasOperators = async (
  scriptTx: IEdge | IContractEdge,
  filtered: Array<IEdge | IContractEdge>,
) => {
  const elementsPerPage = 5;

  const scriptId = (findTag(scriptTx, 'scriptTransaction') as string) ?? scriptTx.node.id;
  const scriptName = findTag(scriptTx, 'scriptName') as string;
  const scriptCurator = findTag(scriptTx, 'scriptCurator') as string;
  const isStableDiffusion = findTag(scriptTx, 'outputConfiguration') as string;

  const { variables } = getOperatorQueryForScript(
    scriptId,
    scriptName,
    scriptCurator,
    elementsPerPage,
  );

  const queryResult = await findByTags(variables.tags, variables.first, variables.after);

  if (queryResult.transactions.edges.length === 0) {
    filtered.splice(
      filtered.findIndex((el) => el.node.id === scriptTx.node.id),
      1,
    );
  } else {
    let hasAtLeastOneValid = false;
    for (const registration of queryResult.transactions.edges) {
      const opFee = findTag(registration, 'operatorFee') as string;
      const registrationOwner =
        (findTag(registration, 'sequencerOwner') as string) ?? registration.node.owner.address;

      if (
        await isValidRegistration(
          registration.node.id,
          opFee,
          registrationOwner,
          scriptName,
          scriptCurator,
          !!isStableDiffusion && isStableDiffusion === 'stable-diffusion',
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

const findByTags = async (tags: ITagFilter[], first: number, after?: string) => {
  const { data }: {data: IContractQueryResult} = await client.query({
    query: FIND_BY_TAGS,
    variables: {
      tags,
      first,
      after,
    }
  });

  return data;
};

const getById = async (txid: string) => {
  const {data}: {data: IQueryResult} = await client.query({
    query: QUERY_TX_BY_ID,
    variables: {
      id: txid,
    }
  });

  return data.transactions.edges[0];
};

export const checkOpResponses = async (el: IContractEdge, filtered: IEdge[]) => {
  const opFee = findTag(el, 'operatorFee') as string;
  const scriptName = findTag(el, 'scriptName') as string;
  const scriptCurator = findTag(el, 'scriptCurator') as string;
  const registrationOwner = (findTag(el, 'sequencerOwner') as string) ?? el.node.owner.address;
  const scriptTx = await getById(findTag(el, 'scriptTransaction') as string);
  const isStableDiffusion = findTag(scriptTx, 'outputConfiguration') as string;

  if (
    !(await isValidRegistration(
      el.node.id,
      opFee,
      registrationOwner,
      scriptName,
      scriptCurator,
      !!isStableDiffusion && isStableDiffusion === 'stable-diffusion',
    ))
  ) {
    filtered.splice(
      filtered.findIndex((existing) => el.node.id === existing.node.id),
      1,
    );
  }
};

