import { STATIC_ADDRESS } from "@/constants";
import { gql } from "@apollo/client";

export const GET_IMAGES_TXIDS = gql`
  query {
    transactions(
      first: 100,
      tags: [
        {
          name: "Content-Type",
          values: ["image/png"]
        }
      ]
    ) {
      edges {
        node {
          id
        }
      }
    }
  }
`;

export const LIST_MODELS_QUERY = gql`
    query txs {
      transactions(
        first:100,
        tags: [
          {
            name: "AppName",
            values: ["Fair-protocol"]
          },
        ]
      )
      {
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

export const QUERY_REGISTERED_MODELS = gql`
  query txs {
    transactions(
      first: 25,
      recipients:["${STATIC_ADDRESS}"],
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
  }`;

export const get_registered_operators = (txid: string) => {
  return gql`
  query txs {
    transactions(
      first: 1,
      recipients:["${STATIC_ADDRESS}"],
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
          name: "Model-Transaction",
          values: ["${txid}"]
        },
        {
          name: "Operation-Name",
          values: ["Operator Registration"]
        }
      ],
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
  }`
}

export const get_cancelled_operators = (txid: string) => {
  return gql`
  query txs {
    transactions(
      first: 1,
      recipients:["${STATIC_ADDRESS}"],
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
          name: "Model-Transaction",
          values: ["${txid}"]
        },
        {
          name: "Operation-Name",
          values: ["Operator Cancellation"]
        }
      ],
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
  }`
}