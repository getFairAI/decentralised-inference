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

import { gql } from '@apollo/client';
import CONFIG from '../config.json' assert { type: 'json' };

export const buildQueryTransactionsReceived = (address: string) => {
  return {
    query: gql`
    query {
        transactions(
          tags: [
            {
          name: "Operation-Name",
          values: ["Script Inference Request"]
        },
        {
          name: "Script-Curator",
          values: ["${CONFIG.scriptCurator}"]
        },
        {
          name: "Script-Name",
          values: ["${CONFIG.scriptName}"]
        },
        {
          name: "Script-Operator",
          values: ["${address}"]
        }
      ],
      sort: HEIGHT_DESC
        ) {
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
  };
};

export const buildQueryTransactionAnswered = (transactionId: string, address: string) => {
  return {
    query: gql`
  query {
      transactions(
        first: 1,
        owners:["${address}"],
        tags: [
          {
        name: "Operation-Name",
        values: ["Script Inference Response"]
      },
      {
        name: "Script-Curator",
        values: ["${CONFIG.scriptCurator}"]
      },
      {
        name: "Script-Name",
        values: ["${CONFIG.scriptName}"]
      },
      {
        name: "Request-Transaction",
        values: ["${transactionId}"]
      }
    ],
    sort: HEIGHT_DESC
      ) {
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
  };
};

export const buildQueryCheckUserScriptRequests = (userAddress: string) => {
  return {
    query: gql`
  query {
      transactions(
        owners:["${userAddress}"],
        tags: [
          {
        name: "Operation-Name",
        values: ["Script Inference Request"]
      },
      {
        name: "Script-Curator",
        values: ["${CONFIG.scriptCurator}"]
      },
      {
        name: "Script-Name",
        values: ["${CONFIG.scriptName}"]
      }
    ],
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
  };
};

export const buildQueryCheckUserPayment = (userAddress: string, inferenceTransaction: string) => {
  return {
    query: gql`
  query {
      transactions(
        first: 1,
        owners:["${userAddress}"],
        tags: [
          {
        name: "Operation-Name",
        values: ["Inference Payment"]
      },
      {
        name: "Script-Curator",
        values: ["${CONFIG.scriptCurator}"]
      },
      {
        name: "Script-Name",
        values: ["${CONFIG.scriptName}"]
      },
      {
        name: "Inference-Transaction",
        values: ["${inferenceTransaction}"]
      }
    ],
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
  };
};

export const buildQueryScriptFee = () => {
  return {
    query: gql`
  query {
      transactions(
        first: 1,
        owners:["${CONFIG.scriptCurator}"],
        tags: [
          {
        name: "Operation-Name",
        values: ["Script Creation"]
      },
      {
        name: "Script-Name",
        values: ["${CONFIG.scriptName}"]
      }
    ],
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
  };
};

export const buildQueryCheckUserCuratorPayment = (userAddress: string) => {
  return {
    query: gql`
  query {
      transactions(
        owners:["${userAddress}"],
        recipients:["${CONFIG.scriptCurator}"],
        tags: [
          {
        name: "Operation-Name",
        values: ["Script Fee Payment"]
      },
      {
        name: "Script-Curator",
        values: ["${CONFIG.scriptCurator}"]
      },
      {
        name: "Script-Name",
        values: ["${CONFIG.scriptName}"]
      }
    ],
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
  };
};

export const buildQueryOperatorFee = (address: string) => {
  return {
    query: gql`
  query {
      transactions(
        first: 1,
        owners:["${address}"],
        tags: [
          {
        name: "Operation-Name",
        values: ["Operator Registration"]
      },
      {
        name: "Script-Curator",
        values: ["${CONFIG.scriptCurator}"]
      },
      {
        name: "Script-Name",
        values: ["${CONFIG.scriptName}"]
      }
    ],
    sort: HEIGHT_DESC
      ) {
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
  };
};