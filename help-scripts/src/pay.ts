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

import { ApolloClient, InMemoryCache, gql } from "@apollo/client/core";
import Arweave from "arweave";
import { JWKInterface } from "arweave/node/lib/wallet";
import Pino from 'pino';
import fs from 'node:fs';
import { WarpFactory } from "warp-contracts";

const U_CONTRACT_ID = 'KTzTXT_ANmF84fWEKHzWURD1LWd9QaFR9yfYUwH2Lxw';
const VAULT_ADDRESS = 'tXd-BOaxmxtgswzwMLnryROAYlX5uDC9-XK2P4VNCQQ';
const MARKETPLACE_FEE = 0.1;
const U_DIVIDER = 1e6;

interface Tag {
  name: string;
  value: string;
}

const client = new ApolloClient({
  // uri: 'http://localhost:1984/graphql',
  cache: new InMemoryCache(),
  uri: 'https://arweave.net/graphql',
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
      errorPolicy: 'ignore',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
  },
});

const logger = Pino({
  name: 'Pay Tx Script',
  level: 'debug',
});

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

const warp = WarpFactory.forMainnet();

const contract = warp.contract(U_CONTRACT_ID).setEvaluationOptions({
  remoteStateSyncSource: 'https://dre-6.warp.cc/contract',
  remoteStateSyncEnabled: true,
  unsafeClient: 'skip',
  allowBigInt: true,
  internalWrites: true,
});

const JWK: JWKInterface = JSON.parse(fs.readFileSync('wallet.json').toString());

const getById = gql`
  query($id: ID!) {
    transactions(ids: [$id], first: 1) {
      edges {
        node {
          owner {
            address
          }
          tags {
            name
            value
          }
        }
      }
    }
  }
`;

const payModelCreation = async (txid: string, owner: string, tags: Tag[]) => {
  const wallet = await arweave.wallets.jwkToAddress(JWK);
  if (owner !== wallet) {
    throw new Error('Loaded Wallet does not match owner of transaction');
  }
  contract.connect(JWK);
  tags = tags.map((tag) => {
    if (tag.name === 'Operation-Name') {
      return {
        value: 'Model Creation Payment',
        name: tag.name,
      };
    }
    return tag;
  });
  tags.push({
    name: 'Model-Transaction',
    value: txid,
  })
  const result = await contract.writeInteraction(
    {
      function: 'transfer',
      target: VAULT_ADDRESS,
      qty: MARKETPLACE_FEE * U_DIVIDER,
    },
    { tags, strict: true },
  );
  logger.info(result);
}



const main = async () => {
  const [ ,, txid ] = process.argv;
  
  try {
    if (!txid) {
      throw new Error('Missing Argument: Transaction ID');
    }

    const result = await client.query({
      query: getById,
      variables: {
        id: txid,
      },
    });
    const txTags = result.data.transactions.edges[0].node.tags;
    const owner = result.data.transactions.edges[0].node.owner.address;

    const operationName = txTags.find((tag: Tag) => tag.name === 'Operation-Name')?.value;
    
    switch (operationName) {
      case 'Model Creation':
        await payModelCreation(txid, owner, txTags);
        break;
      case 'Script Creation':
        logger.info('Not Implemented');
        break;
      case 'Operator Registration':
        logger.info('Not Implemented');
        break;
      default:
        logger.error(`Operation name ${operationName} not recognized`);
    }
  } catch (error) {
    logger.error(error);
  }
};

(async () => main())();
