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

import { PROTOCOL_NAME, PROTOCOL_VERSION, VAULT_ADDRESS } from '../constants';
import { gql } from '@apollo/client';

export const GET_LATEST_MODEL_ATTACHMENTS = gql`
  query GET_MODEL_ATTACHMENTS($tags: [TagFilter!], $owner: String!) {
    transactions(first: 1, tags: $tags, owners: [$owner], sort: HEIGHT_DESC) {
      edges {
        node {
          id
        }
      }
    }
  }
`;

export const GET_TX_OWNER = gql`
  query GET_TX($id: ID!) {
    transactions(first: 1, ids: [$id]) {
      edges {
        node {
          owner {
            address
          }
        }
      }
    }
  }
`;

export const GET_IMAGES_TXIDS = gql`
  query GET_IMAGES_TXIDS($first: Int, $after: String, $tags: [TagFilter!], $owner: String!) {
    transactions(first: $first, after: $after, tags: $tags, owners: [$owner]) {
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
`;

export const GET_TX = gql`
  query GET_TX($id: ID!) {
    transactions(ids: [$id]) {
      edges {
        cursor
        node {
          id
          signature
          recipient
          owner {
            address
            key
          }
          fee {
            winston
            ar
          }
          quantity {
            winston
            ar
          }
          data {
            size
            type
          }
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
          bundledIn {
            id
          }
        }
      }
    }
  }
`;

export const FIND_BY_TAGS = gql`
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
          owner {
            address
          }
        }
      }
    }
  }
`;

export const GET_LATEST_FEE_UPDATE = gql`
  query GET_LATEST_FEE_UPDATE($tags: [TagFilter!], $owner: String!) {
    transactions(first: 1, tags: $tags, sort: HEIGHT_DESC, owners: [$owner]) {
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
`;

export const LIST_OWN_MODELS_QUERY = gql`
  query LIST_MODELS_QUERY($owner: String!) {
    transactions(
      tags: [
        { name: "App-Name", values: ["${PROTOCOL_NAME}"] }
        { name: "App-Version", values: ["${PROTOCOL_VERSION}"] }
        { name: "Operation-Name", values: "Model Creation Payment" }
      ]
      recipients:["${VAULT_ADDRESS}"],
      owners: [$owner]
    ) {
      edges {
        cursor
        node {
          id
          signature
          recipient
          owner {
            address
            key
          }
          fee {
            winston
            ar
          }
          quantity {
            winston
            ar
          }
          data {
            size
            type
          }
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
          bundledIn {
            id
          }
        }
      }
    }
  }
`;

export const GET_MODELS_PAID_QUERY = gql`
  query GET_MODELS_PAID_QUERY($tags: [TagFilter!]) {
    transactions(tags: $tags) {
      edges {
        node {
          id
          tags {
            name
            value
          }
          owner {
            address
          }
        }
      }
    }
  }
`;

/*
  registered operators tags [
    {
          name: "App-Name",
          values: ["Fair Protocol"]
    },
    {
          name: "App-Version",
          values: ["v0.01"]
    },
    {
      name: "Model-Transaction",
      values: ["${txid}"]
    },
    {
      name: "Operation-Name",
      values: ["Operator Registration"]
    }
  ],
*/

/* Cancelled operators tags[
  {
    name: "App-Name",
    values: ["Fair Protocol"]
  },
  {
    name: "App-Version",
    values: ["v0.01"]
  },
  {
    name: "Model-Transaction",
    values: ["${txid}"]
  },
  {
    name: "Operation-Name",
    values: ["Operator Cancellation"]
  }
], */

export const QUERY_REGISTERED_OPERATORS = gql`
  query QUERY_REGISTERED_OPERATORS($tags: [TagFilter!], $first: Int, $after: String) {
    transactions(
      recipients:["${VAULT_ADDRESS}"],
      tags: $tags
      sort: HEIGHT_DESC,
      first: $first,
      after: $after
    )
    {
      pageInfo {
        hasNextPage
      }
      edges {
          cursor
          node {
              id
              signature
              recipient
              owner {
                  address
                  key
              }
              fee {
                  winston
                  ar
              }
              quantity {
                  winston
                  ar
              }
              data {
                  size
                  type
              }
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
              bundledIn {
                  id
              }
          }
      }
    }
  }
`;

export const QUERY_CANCELLED_OPERATORS = gql`
  query QUERY_CANCELLED_OPERATORS($tags: [TagFilter!]) {
    transactions(
      first: 1,
      recipients:["${VAULT_ADDRESS}"],
      tags: $tags
      sort: HEIGHT_DESC
    )
    {
      edges {
        cursor
        node {
          id
          signature
          recipient
          owner {
            address
            key
          }
          fee {
            winston
            ar
          }
          quantity {
            winston
            ar
          }
          data {
            size
            type
          }
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
          bundledIn {
            id
          }
        }
      }
    }
  }
`;

export const QUERY_FEE_PAYMENT = gql`
  query QUERY_SCRIPT_FEE_PAYMENT($owner: String!, $tags: [TagFilter!], $recipient: String!) {
    transactions(first: 1, owners: [$owner], recipients: [$recipient], tags: $tags) {
      edges {
        node {
          id
          tags {
            name
            value
          }
          recipient
          quantity {
            winston
            ar
          }
        }
      }
    }
  }
`;

export const QUERY_OPERATOR_REGISTRATION_PAYMENT = gql`
  query QUERY_OPERATOR_REGISTRATION_PAYMENT(
    $owner: String!
    $tags: [TagFilter!]
    $recipient: String!
  ) {
    transactions(first: 1, owners: [$owner], recipients: [$recipient], tags: $tags) {
      edges {
        node {
          id
          tags {
            name
            value
          }
          recipient
          quantity {
            winston
            ar
          }
        }
      }
    }
  }
`;

export const QUERY_OPERATOR_RESULTS_RESPONSES = gql`
  query results_responses(
    $tagsResults: [TagFilter!]
    $tagsRequests: [TagFilter!]
    $owners: [String!]
  ) {
    results: transactions(tags: $tagsResults, owners: $owners, sort: HEIGHT_DESC) {
      edges {
        node {
          id
          owner {
            address
          }
        }
      }
    }
    requests: transactions(tags: $tagsRequests, recipients: $owners, sort: HEIGHT_DESC) {
      edges {
        node {
          id
          recipient
          owner {
            address
          }
        }
      }
    }
  }
`;

export const QUERY_PAID_FEE_OPERATORS = gql`
  query QUERY_PAID_FEE_OPERATORS(
    $tags: [TagFilter!]
    $owner: String!
    $minBlockHeight: Int!
    $first: Int,
    $after: String
  ) {
    transactions(
      recipients:["${VAULT_ADDRESS}"],
      tags: $tags,
      owners: [$owner],
      block: {min: $minBlockHeight},
      sort: HEIGHT_DESC,
      first: $first,
      after: $after
    )
    {
      pageInfo {
        hasNextPage
      }
      edges {
        cursor
        node {
          id
          signature
          recipient
          owner {
            address
            key
          }
          fee {
            winston
            ar
          }
          quantity {
            winston
            ar
          }
          data {
            size
            type
          }
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
          bundledIn {
            id
          }
        }
      }
    }
  }
`;

export const QUERY_INFERENCE_RESULTS = gql`
  query GET_INFERENCE_RESULTS($tags: [TagFilter!]) {
    transactions(tags: $tags) {
      edges {
        node {
          id
          address
          currency
          tags {
            name
            value
          }
          signature
          timestamp
          receipt {
            version
            signature
            timestamp
          }
        }
      }
    }
  }
`;

export const QUERY_CHAT_REQUESTS = gql`
  query QUERY_CHAT_REQUESTS(
    $address: String!
    $tagsRequests: [TagFilter!]
    $first: Int
    $after: String
  ) {
    transactions(
      tags: $tagsRequests
      owners: [$address]
      sort: HEIGHT_DESC
      first: $first
      after: $after
    ) {
      pageInfo {
        hasNextPage
      }
      edges {
        cursor
        node {
          id
          recipient
          tags {
            name
            value
          }
          owner {
            address
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
`;

export const QUERY_CHAT_RESPONSES = gql`
  query QUERY_CHAT_RESPONSES(
    $operators: [String!]
    $tagsResponses: [TagFilter!]
    $first: Int
    $after: String
  ) {
    transactions(
      tags: $tagsResponses
      owners: $operators
      sort: HEIGHT_DESC
      first: $first
      after: $after
    ) {
      pageInfo {
        hasNextPage
      }
      edges {
        cursor
        node {
          id
          recipient
          tags {
            name
            value
          }
          owner {
            address
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
`;

export const QUERY_CHAT_REQUESTS_POLLING = gql`
  query QUERY_CHAT_REQUESTS($address: String!, $tagsRequests: [TagFilter!], $first: Int) {
    transactions(tags: $tagsRequests, owners: [$address], sort: HEIGHT_DESC, first: $first) {
      edges {
        node {
          id
          recipient
          tags {
            name
            value
          }
          owner {
            address
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
`;

export const QUERY_CHAT_RESPONSES_POLLING = gql`
  query QUERY_CHAT_RESPONSES($operators: [String!], $tagsResponses: [TagFilter!], $first: Int) {
    transactions(tags: $tagsResponses, owners: $operators, sort: HEIGHT_DESC, first: $first) {
      edges {
        node {
          id
          recipient
          tags {
            name
            value
          }
          owner {
            address
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
`;

/**
 * Get latest X inference payment requests for operator
 */
export const QUERY_REQUESTS_FOR_OPERATOR = gql`
  query QUERY_REQUESTS_FOR_OPERATOR(
    $recipient: String!
    $tags: [TagFilter!]
    $first: Int
    $after: String
  ) {
    transactions(
      tags: $tags
      recipients: [$recipient]
      first: $first
      after: $after
      sort: HEIGHT_DESC
    ) {
      edges {
        cursor
        node {
          id
          recipient
          tags {
            name
            value
          }
          block {
            height
            timestamp
          }
          quantity {
            ar
            winston
          }
          owner {
            address
          }
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

export const QUERY_RESPONSES_BY_OPERATOR = gql`
  query QUERY_RESPONSES_BY_OPERATOR(
    $owner: String!
    $tags: [TagFilter!]
    $first: Int
    $after: String
  ) {
    transactions(tags: $tags, owners: [$owner], first: $first, after: $after, sort: HEIGHT_DESC) {
      edges {
        cursor
        node {
          id
          owner {
            address
          }
          block {
            timestamp
            height
          }
          tags {
            name
            value
          }
          quantity {
            ar
          }
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

export const QUERY_FIRST_REGISTRATION = gql`
  query QUERY_RESPONSES_BY_OPERATOR($owner: String!, $tags: [TagFilter!], $after: String) {
    transactions(tags: $tags, owners: [$owner], first: 1, sort: HEIGHT_ASC, after: $after) {
      edges {
        node {
          id
          owner {
            address
          }
          block {
            timestamp
            height
          }
          tags {
            name
            value
          }
          quantity {
            ar
          }
        }
      }
    }
  }
`;

export const QUERY_OPERATOR_RECEIVED_HISTORY = gql`
  query QUERY_OPERATOR_RECEIVED_HISTORY(
    $address: String!
    $tags: [TagFilter!]
    $first: Int
    $after: String
  ) {
    transactions(
      tags: $tags
      recipients: [$address]
      sort: HEIGHT_DESC
      first: $first
      after: $after
    ) {
      edges {
        cursor
        node {
          id
          recipient
          owner {
            address
          }
          fee {
            ar
          }
          quantity {
            ar
          }
          tags {
            name
            value
          }
          block {
            timestamp
          }
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

export const QUERY_OPERATOR_SENT_HISTORY = gql`
  query QUERY_OPERATOR_SENT_HISTORY(
    $address: String!
    $tags: [TagFilter!]
    $first: Int
    $after: String
  ) {
    transactions(tags: $tags, owners: [$address], sort: HEIGHT_DESC, first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          recipient
          owner {
            address
          }
          fee {
            ar
          }
          quantity {
            ar
          }
          tags {
            name
            value
          }
          block {
            timestamp
          }
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

export const QUERY_USER_INTERACTIONS = gql`
  query QUERY_USER_INTERACTIONS(
    $address: String!
    $tags: [TagFilter!]
    $minBlockHeight: Int!
    $first: Int
    $after: String
  ) {
    transactions(
      tags: $tags
      owners: [$address]
      sort: HEIGHT_DESC
      block: { min: $minBlockHeight }
      first: $first
      after: $after
    ) {
      edges {
        cursor
        node {
          id
          recipient
          owner {
            address
          }
          fee {
            ar
          }
          quantity {
            ar
          }
          tags {
            name
            value
          }
          block {
            timestamp
          }
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

export const QUERY_TX_WITH = gql`
  query QUERY_TX_WITH($address: String!, $tags: [TagFilter!]) {
    transactions(tags: $tags, owners: [$address], sort: HEIGHT_DESC, first: 1) {
      edges {
        cursor
        node {
          id
          recipient
          owner {
            address
          }
          fee {
            ar
          }
          quantity {
            ar
            winston
          }
          tags {
            name
            value
          }
          block {
            timestamp
          }
        }
      }
    }
  }
`;

export const QUERY_TXS_WITH = gql`
  query QUERY_TX_WITH($address: String!, $tags: [TagFilter!], $first: Int, $after: String) {
    transactions(tags: $tags, owners: [$address], sort: HEIGHT_DESC, first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          recipient
          owner {
            address
          }
          fee {
            ar
          }
          quantity {
            ar
            winston
          }
          tags {
            name
            value
          }
          block {
            timestamp
          }
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

export const QUERY_PAYMENT_TO_VAULT_WITH = gql`
  query QUERY_PAYMENT_TO_VAULT_WITH($owner: String!, $tags: [TagFilter!], $recipient: String!) {
    transactions(
      tags: $tags
      owners: [$owner]
      sort: HEIGHT_DESC
      first: 1
      recipients: [$recipient]
    ) {
      edges {
        cursor
        node {
          id
          recipient
          owner {
            address
          }
          fee {
            ar
          }
          quantity {
            ar
            winston
          }
          tags {
            name
            value
          }
          block {
            timestamp
          }
        }
      }
    }
  }
`;

export const QUERY_CONVERSATIONS = gql`
  query QUERY_CONVERSATIONS($address: String!, $tags: [TagFilter!], $first: Int, $after: String) {
    transactions(tags: $tags, owners: [$address], sort: HEIGHT_DESC, first: $first, after: $after) {
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
      pageInfo {
        hasNextPage
      }
    }
  }
`;

export const QUERY_CONVERSATIONS_TX_ID = gql`
  query QUERY_CONVERSATIONS($address: String!, $tags: [TagFilter!], $first: Int, $after: String) {
    transactions(tags: $tags, owners: [$address], sort: HEIGHT_DESC, first: $first, after: $after) {
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
      pageInfo {
        hasNextPage
      }
    }
  }
`;

export const QUERY_REGISTERED_SCRIPTS = gql`
  query QUERY_REGISTERED_SCRIPTS(
    $tags: [TagFilter!]
    $recipients: [String!]
    $first: Int
    $after: String
    $addresses: [String!]
  ) {
    transactions(
      recipients: $recipients
      tags: $tags
      sort: HEIGHT_DESC
      first: $first
      after: $after
      owners: $addresses
    ) {
      pageInfo {
        hasNextPage
      }
      edges {
        cursor
        node {
          id
          signature
          recipient
          owner {
            address
            key
          }
          fee {
            winston
            ar
          }
          quantity {
            winston
            ar
          }
          data {
            size
            type
          }
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
          bundledIn {
            id
          }
        }
      }
    }
  }
`;

export const QUERY_USER_HAS_VOTED = gql`
  query QUERY_USER_HAS_VOTED($tags: [TagFilter!], $first: Int, $address: String!) {
    transactions(owners: [$address], tags: $tags, sort: HEIGHT_DESC, first: $first) {
      edges {
        cursor
        node {
          id
        }
      }
    }
  }
`;

export const QUERY_VOTES = gql`
  query QUERY_VOTES($tags: [TagFilter!], $first: Int, $after: String) {
    transactions(tags: $tags, sort: HEIGHT_DESC, first: $first, after: $after) {
      pageInfo {
        hasNextPage
      }
      edges {
        cursor
        node {
          id
          owner {
            address
            key
          }
        }
      }
    }
  }
`;

export const QUERY_TX_WITH_OWNERS = gql`
  query QUERY_TX_WITH_OWNERS($owners: [String!], $tags: [TagFilter!]) {
    transactions(owners: $owners, tags: $tags, sort: HEIGHT_DESC, first: 1) {
      pageInfo {
        hasNextPage
      }
      edges {
        cursor
        node {
          id
          owner {
            address
            key
          }
        }
      }
    }
  }
`;
