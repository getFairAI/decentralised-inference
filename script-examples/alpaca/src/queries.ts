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
import { scriptCurator, scriptName } from '../config.json' assert { type: 'json' };
import {
  CONVERSATION_IDENTIFIER_TAG,
  INFERENCE_TRANSACTION_TAG,
  OPERATION_NAME_TAG,
  REQUEST_TRANSACTION_TAG,
  SCRIPT_CURATOR_TAG,
  SCRIPT_INFERENCE_REQUEST,
  SCRIPT_NAME_TAG,
  SCRIPT_OPERATOR_TAG,
  SCRIPT_USER_TAG,
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

const parseQueryResult = (result: { data: { transactions: ITransactions } }) =>
  result.data.transactions.edges;

export const queryTransactionsReceived = async (address: string) => {
  const tags = [
    {
      name: OPERATION_NAME_TAG,
      values: [SCRIPT_INFERENCE_REQUEST],
    },
    {
      name: SCRIPT_CURATOR_TAG,
      values: [scriptCurator],
    },
    {
      name: SCRIPT_NAME_TAG,
      values: [scriptName],
    },
    {
      name: SCRIPT_OPERATOR_TAG,
      values: [address],
    },
  ];
  const result = await clientGateway.query({
    query: gql`
      query TransactionsReceived($tags: [TagFilter!]) {
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
    variables: { tags },
  });

  return parseQueryResult(result);
};

export const queryTransactionAnswered = async (transactionId: string, address: string) => {
  const tags = [
    {
      name: OPERATION_NAME_TAG,
      values: ['Script Inference Response'],
    },
    {
      name: SCRIPT_CURATOR_TAG,
      values: [scriptCurator],
    },
    {
      name: SCRIPT_NAME_TAG,
      values: [scriptName],
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

export const queryCheckUserScriptRequests = async (userAddress: string) => {
  const tags = [
    {
      name: OPERATION_NAME_TAG,
      values: [SCRIPT_INFERENCE_REQUEST],
    },
    {
      name: SCRIPT_CURATOR_TAG,
      values: [scriptCurator],
    },
    {
      name: SCRIPT_NAME_TAG,
      values: [scriptName],
    },
  ];
  const result = await clientGateway.query({
    query: gql`
      query CheckUserScriptRequests($tags: [TagFilter!], $owner: String!) {
        transactions(owners: [$owner], tags: $tags, sort: HEIGHT_DESC) {
          edges {
            node {
              id
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
    variables: { tags, owner: userAddress },
  });

  return parseQueryResult(result);
};

export const queryCheckUserPayment = async (userAddress: string, inferenceTransaction: string) => {
  const tags = [
    {
      name: OPERATION_NAME_TAG,
      values: ['Inference Payment'],
    },
    {
      name: SCRIPT_CURATOR_TAG,
      values: [scriptCurator],
    },
    {
      name: SCRIPT_NAME_TAG,
      values: [scriptName],
    },
    {
      name: INFERENCE_TRANSACTION_TAG,
      values: [inferenceTransaction],
    },
  ];
  const result = await clientGateway.query({
    query: gql`
      query CheckUserPayment (tags: [TagFilter!], owner: String!){
        transactions(
          first: 1,
          owners:[ $owner ],
          tags: $tags
          sort: HEIGHT_DESC
        ) {
          edges {
            node {
              id
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
    variables: { tags, owner: userAddress },
  });

  return parseQueryResult(result);
};

export const queryScriptFee = async () => {
  const tags = [
    {
      name: OPERATION_NAME_TAG,
      values: ['Script Creation'],
    },
    {
      name: SCRIPT_NAME_TAG,
      values: [scriptName],
    },
  ];
  const result = await clientGateway.query({
    query: gql`
      query ScriptFee($tags: [TagFilter!], $owner: String!) {
        transactions(first: 1, owners: [$owner], tags: $tags, sort: HEIGHT_DESC) {
          edges {
            node {
              id
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
    variables: { tags, owner: scriptCurator },
  });

  return parseQueryResult(result);
};

export const queryCheckUserCuratorPayment = async (userAddress: string) => {
  const tags = [
    {
      name: OPERATION_NAME_TAG,
      values: ['Script Fee Payment'],
    },
    {
      name: SCRIPT_CURATOR_TAG,
      values: [scriptCurator],
    },
    {
      name: SCRIPT_NAME_TAG,
      values: [scriptName],
    },
  ];
  const result = await clientGateway.query({
    query: gql`
      query CheckUserCuratorPayment($tags: [TagFilter!], $owner: String!, $recipient: String!) {
        transactions(owners: [$owner], recipients: [$recipient], tags: $tags, sort: HEIGHT_DESC) {
          edges {
            node {
              id
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
    variables: { tags, owner: userAddress, recipient: scriptCurator },
  });

  return parseQueryResult(result);
};

export const queryOperatorFee = async (address: string) => {
  const tags = [
    {
      name: OPERATION_NAME_TAG,
      values: ['Operator Registration'],
    },
    {
      name: SCRIPT_CURATOR_TAG,
      values: [scriptCurator],
    },
    {
      name: SCRIPT_NAME_TAG,
      values: [scriptName],
    },
  ];
  const result = await clientGateway.query({
    query: gql`
      query OperatorFee($tags: [TagFilter!], $owner: String!) {
        transactions(first: 1, owners: [$owner], tags: $tags, sort: HEIGHT_DESC) {
          edges {
            node {
              id
              tags {
                name
                value
              }
              block {
                id
                timestamp
                height
                previous
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

export const queryRequestsForConversation = async (userAddr: string, cid: string) => {
  const tags = [
    {
      name: OPERATION_NAME_TAG,
      values: [SCRIPT_INFERENCE_REQUEST],
    },
    {
      name: SCRIPT_CURATOR_TAG,
      values: [scriptCurator],
    },
    {
      name: SCRIPT_NAME_TAG,
      values: [scriptName],
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
      values: [scriptCurator],
    },
    {
      name: SCRIPT_NAME_TAG,
      values: [scriptName],
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
