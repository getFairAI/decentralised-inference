import { MARKETPLACE_ADDRESS } from '@/constants';
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

export const LIST_LATEST_MODELS_QUERY = gql`
  query LIST_MODELS_QUERY($first: Int!) {
    transactions(
      tags: [
        { name: "App-Name", values: ["Fair Protocol"] }
        { name: "Operation-Name", values: "Model Creation Payment" }
      ]
      recipients:["${MARKETPLACE_ADDRESS}"],
      first: $first
      sort: HEIGHT_DESC
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

export const LIST_MODELS_QUERY = gql`
  query LIST_MODELS_QUERY($first: Int!, $after: String) {
    transactions(
      tags: [
        { name: "App-Name", values: ["Fair Protocol"] }
        { name: "Operation-Name", values: "Model Creation Payment" }
      ]
      recipients:["${MARKETPLACE_ADDRESS}"],
      first: $first
      after: $after,
      sort: HEIGHT_DESC
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
        { name: "App-Name", values: ["Fair Protocol"] }
        { name: "Operation-Name", values: "Model Creation Payment" }
      ]
      recipients:["${MARKETPLACE_ADDRESS}"],
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

export const QUERY_REGISTERED_MODELS = gql`
  query QUERY_REGISTERED_MODELS {
    transactions(
      first: 25,
      recipients:["${MARKETPLACE_ADDRESS}"],
      tags: [
        {
              name: "App-Name",
              values: ["Fair Protocol"]
        },
        {
              name: "App-Version",
              values: ["v0.01"]
        },
        {
          name: "Opearation-Name",
          values: ["Model Creation"]
        }
      ]
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
      recipients:["${MARKETPLACE_ADDRESS}"],
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
      recipients:["${MARKETPLACE_ADDRESS}"],
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

export const QUERY_MODEL_FEE_PAYMENT = gql`
  query QUERY_MODEL_FEE_PAYMENT($owner: String!, $tags: [TagFilter!], $recipient: String!) {
    transactions(first: 1, owners: [$owner], recipients: [$recipient], tags: $tags) {
      edges {
        node {
          id
          tags {
            name
            value
          }
          quantity {
            winston
            ar
          }
        }
      }
    }
  }
`;

// availability could be replaced with something more meaningful
/* export const QUERY_OPERATORS_AVAILABILITY = gql`
  query QUERY_OPERATORS_AVAILABILITY($tags: [TagFilter!]) {
    transactions (
      recipients:["${MARKETPLACE_ADDRESS}"],
      tags: $tags
      sort: HEIGHT_DESC
    )
    {
      edges {
        cursor
        node {
          id
          anchor
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
`; */

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
      recipients:["${MARKETPLACE_ADDRESS}"],
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
  query QUERY_RESPONSES_BY_OPERATOR($owner: String!, $tags: [TagFilter!]) {
    transactions(tags: $tags, owners: [$owner], first: 1, sort: HEIGHT_ASC) {
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
