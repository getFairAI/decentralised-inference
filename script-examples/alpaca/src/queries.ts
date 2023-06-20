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

import { gql, ApolloClient, InMemoryCache } from '@apollo/client/core';
import CONFIG from '../config.json' assert { type: 'json' };
import {
  CONTRACT_TAG,
  CONVERSATION_IDENTIFIER_TAG,
  INFERENCE_TRANSACTION_TAG,
  INPUT_TAG,
  OPERATION_NAME_TAG,
  OPERATOR_PERCENTAGE_FEE,
  OPERATOR_REGISTRATION_AR_FEE,
  REQUEST_TRANSACTION_TAG,
  SCRIPT_CURATOR_TAG,
  SCRIPT_INFERENCE_REQUEST,
  SCRIPT_NAME_TAG,
  SCRIPT_OPERATOR_TAG,
  SCRIPT_USER_TAG,
  SEQUENCE_OWNER_TAG,
  U_CONTRACT_ID,
  U_DIVIDER,
  VAULT_ADDRESS,
} from './constants';
import { ITransactions } from './interfaces';

const clientGateway = new ApolloClient({
  uri: 'https://arweave.net:443/graphql',
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: 'no-cache',
    },
    watchQuery: {
      fetchPolicy: 'no-cache',
    },
  },
});

const gqlQuery = gql`
  query FIND_BY_TAGS($tags: [TagFilter!], $first: Int!, $after: String) {
    transactions(tags: $tags, first: $first, after: $after, sort: HEIGHT_DESC) {
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
        }
      }
    }
  }
`;

const parseQueryResult = (result: { data: { transactions: ITransactions } }) =>
  result.data.transactions.edges;

export const queryTransactionsReceived = async (address: string, opFee: number, after?: string) => {
  const feeShare = opFee * OPERATOR_PERCENTAGE_FEE;

  const paymentInput = JSON.stringify({
    function: 'transfer',
    target: address,
    qty: feeShare.toString(),
  });

  const tags = [
    {
      name: OPERATION_NAME_TAG,
      values: [SCRIPT_INFERENCE_REQUEST],
    },
    {
      name: SCRIPT_CURATOR_TAG,
      values: [CONFIG.scriptCurator],
    },
    {
      name: SCRIPT_NAME_TAG,
      values: [CONFIG.scriptName],
    },
    {
      name: INPUT_TAG,
      values: [paymentInput],
    },
    {
      name: CONTRACT_TAG,
      values: [U_CONTRACT_ID],
    },
    {
      name: SCRIPT_OPERATOR_TAG,
      values: [address],
    },
  ];

  const result = await clientGateway.query({
    query: gqlQuery,
    variables: { first: 10, tags, after },
  });

  return {
    requestTxs: parseQueryResult(result),
    hasNextPage: result.data.transactions.pageInfo.hasNextPage,
  };
};

export const getRequest = async (transactionId: string) => {
  const result = await clientGateway.query({
    query: gql`
      query tx($id: ID!) {
        transactions(first: 1, ids: [$id], sort: HEIGHT_DESC) {
          edges {
            node {
              id
              owner {
                address
                key
              }
              quantity {
                winston
                ar
              }
              tags {
                name
                value
              }
            }
          }
        }
      }
    `,
    variables: { id: transactionId },
  });

  return parseQueryResult(result)[0];
};
export const queryTransactionAnswered = async (transactionId: string, address: string) => {
  const tags = [
    {
      name: OPERATION_NAME_TAG,
      values: ['Script Inference Response'],
    },
    {
      name: SCRIPT_CURATOR_TAG,
      values: [CONFIG.scriptCurator],
    },
    {
      name: SCRIPT_NAME_TAG,
      values: [CONFIG.scriptName],
    },
    {
      name: REQUEST_TRANSACTION_TAG,
      values: [transactionId],
    },
  ];
  const result = await clientGateway.query({
    query: gql`
      query TransactionAnswered($tags: [TagFilter!], $owner: String!) {
        transactions(first: 1, tags: $tags, owners: [$owner], sort: HEIGHT_DESC) {
          edges {
            node {
              id
              owner {
                address
                key
              }
              quantity {
                winston
                ar
              }
              tags {
                name
                value
              }
            }
          }
        }
      }
    `,
    variables: { tags, owner: address },
  });

  return parseQueryResult(result);
};

export const queryCheckUserPayment = async (
  inferenceTransaction: string,
  userAddress: string,
  inputValues: string[],
) => {
  const tags = [
    {
      name: OPERATION_NAME_TAG,
      values: ['Inference Payment'],
    },
    {
      name: SCRIPT_CURATOR_TAG,
      values: [CONFIG.scriptCurator],
    },
    {
      name: SCRIPT_NAME_TAG,
      values: [CONFIG.scriptName],
    },
    {
      name: INFERENCE_TRANSACTION_TAG,
      values: [inferenceTransaction],
    },
    {
      name: CONTRACT_TAG,
      values: [U_CONTRACT_ID],
    },
    {
      name: SEQUENCE_OWNER_TAG,
      values: [userAddress],
    },
    {
      name: INPUT_TAG,
      values: inputValues,
    },
  ];
  const result = await clientGateway.query({
    query: gqlQuery,
    variables: { tags, first: 3 },
  });

  return parseQueryResult(result);
};

export const queryOperatorFee = async (address: string) => {
  const operatorPaymentInputStr = JSON.stringify({
    function: 'transfer',
    target: VAULT_ADDRESS,
    qty: (parseFloat(OPERATOR_REGISTRATION_AR_FEE) * U_DIVIDER).toString(),
  });

  const operatorPaymentInputNumber = JSON.stringify({
    function: 'transfer',
    target: VAULT_ADDRESS,
    qty: parseFloat(OPERATOR_REGISTRATION_AR_FEE) * U_DIVIDER,
  });
  const tags = [
    {
      name: OPERATION_NAME_TAG,
      values: ['Operator Registration'],
    },
    {
      name: SCRIPT_CURATOR_TAG,
      values: [CONFIG.scriptCurator],
    },
    {
      name: SCRIPT_NAME_TAG,
      values: [CONFIG.scriptName],
    },
    {
      name: INPUT_TAG,
      values: [operatorPaymentInputStr, operatorPaymentInputNumber],
    },
    {
      name: CONTRACT_TAG,
      values: [U_CONTRACT_ID],
    },
    {
      name: SEQUENCE_OWNER_TAG,
      values: [address],
    },
  ];

  const result = await clientGateway.query({
    query: gqlQuery,
    variables: { tags, first: 1 },
  });

  return parseQueryResult(result);
};

export const getModelOwner = async () => {
  const tags = [
    {
      name: OPERATION_NAME_TAG,
      values: ['Script Creation'],
    },
    {
      name: SCRIPT_NAME_TAG,
      values: [CONFIG.scriptName],
    },
  ];

  const result = await clientGateway.query({
    query: gql`
      query tx($tags: [TagFilter!], $first: Int, $owners: [String!]) {
        transactions(first: $first, tags: $tags, owners: $owners, sort: HEIGHT_DESC) {
          edges {
            node {
              id
              tags {
                name
                value
              }
            }
          }
        }
      }
    `,
    variables: { tags, first: 1, owner: [CONFIG.scriptCurator] },
  });

  const tx = parseQueryResult(result)[0];

  const creatorAddr = tx.node.tags.find((tag) => tag.name === 'Model-Creator')?.value;

  if (!creatorAddr) {
    throw new Error('Model creator not found');
  }

  return creatorAddr;
};

export const queryRequestsForConversation = async (userAddr: string, cid: string) => {
  const tags = [
    {
      name: OPERATION_NAME_TAG,
      values: [SCRIPT_INFERENCE_REQUEST],
    },
    {
      name: SCRIPT_CURATOR_TAG,
      values: [CONFIG.scriptCurator],
    },
    {
      name: SCRIPT_NAME_TAG,
      values: [CONFIG.scriptName],
    },
    {
      name: CONVERSATION_IDENTIFIER_TAG,
      values: [cid],
    },
  ];

  const result = await clientGateway.query({
    query: gql`
      query RequestsForConversation($tags: [TagFilter!], $owner: String!) {
        transactions(tags: $tags, owners: [$owner], sort: HEIGHT_DESC) {
          edges {
            node {
              id
              owner {
                address
                key
              }
              quantity {
                winston
                ar
              }
              tags {
                name
                value
              }
            }
          }
        }
      }
    `,
    variables: { tags, owner: userAddr },
  });

  return parseQueryResult(result);
};

export const queryResponsesForRequests = async (
  userAddr: string,
  cid: string,
  requestIds: string[],
) => {
  const tags = [
    {
      name: OPERATION_NAME_TAG,
      values: ['Script Inference Response'],
    },
    {
      name: SCRIPT_CURATOR_TAG,
      values: [CONFIG.scriptCurator],
    },
    {
      name: SCRIPT_NAME_TAG,
      values: [CONFIG.scriptName],
    },
    {
      name: SCRIPT_USER_TAG,
      values: [userAddr],
    },
    {
      name: CONVERSATION_IDENTIFIER_TAG,
      values: [cid],
    },
    {
      name: REQUEST_TRANSACTION_TAG,
      values: requestIds,
    },
  ];

  const result = await clientGateway.query({
    query: gql`
      query ResponsesForRequests($tags: [TagFilter!]) {
        transactions(tags: $tags, sort: HEIGHT_DESC) {
          edges {
            node {
              id
              owner {
                address
                key
              }
              quantity {
                winston
                ar
              }
              tags {
                name
                value
              }
            }
          }
        }
      }
    `,
    variables: { tags, owner: userAddr },
  });

  return parseQueryResult(result);
};
