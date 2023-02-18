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