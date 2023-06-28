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
import NodeBundlr from "@bundlr-network/client";

const MARKETPLACE_ADDRESS = 'RQFarhgXPXYkgRM0Lzv088MllseKQWEdnEiRUggteIo';
export const NODE2_BUNDLR_URL = 'https://node2.bundlr.network/';

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
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
  },
});

const logger = Pino({
  name: 'Delete Tx Script',
  level: 'debug',
});

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

const JWK: JWKInterface = JSON.parse(fs.readFileSync('wallet-marketplace.json').toString());

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

const bundlr = new NodeBundlr(NODE2_BUNDLR_URL, 'arweave', JWK);

const fakeDeleteScript = async (wallet: string, txid: string) => {
  // currently only marketplace address can fake delete scripts
  if (wallet !== MARKETPLACE_ADDRESS) {
    throw new Error('Loaded Wallet does not match Marketplace address');
  }
  const tags: Tag[] = [
    { name: 'Operation-Name', value: 'Script Deletion' },
    { name: 'Script-Transaction', value: txid }
  ]
  const result = await bundlr.upload('Script Deletion', { tags })
  logger.info(result.id);
}



const main = async () => {
  const [ ,, txid ] = process.argv;
  const wallet = await arweave.wallets.jwkToAddress(JWK);
  logger.info(`Loaded Wallet: ${wallet}`);
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
    if (!result.data.transactions.edges[0]) {
      throw new Error(`Could not Find Tx with id: ${txid}`)
    }
    const txTags = result.data.transactions.edges[0].node.tags;

    const operationName = txTags.find((tag: Tag) => tag.name === 'Operation-Name')?.value;
    
    switch (operationName) {
      case 'Model Creation':
        logger.info('Not Implemented');
        break;
      case 'Script Creation':
        await fakeDeleteScript(wallet, txid);
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
