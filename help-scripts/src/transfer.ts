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
import { LoggerFactory, WarpFactory } from "warp-contracts";

interface AtomicAssetState {
  name: string;
  ticker: string;
  firstOwner: string;
  balances: { [address: string]: number };
  claimable: Array<{ txid: string; to: string }>;
};

interface Tag {
  name: string;
  value: string;
};

interface Tx {
  cursor: string;
  node: {
    tags: Tag[];
    id: string;
  }
};

const ATOMIC_ASSET_IDS = [
  '2QTojDXm5rysfoV7ViJn3mj7yklX_5vA_viIOh6PlOw',
  '_zrc9nFd07a3cVbcU6TitbwnmuS2QE88Z7gsf1va23E',
  '37n5Z9NZUUPuXPdbbjXa2iYb9Wl39nAjkaSoz5DsxZQ',
  // 'zbUdQQvEunxn-QCWeH1Ea2d1EZAAFTl9EUF8qjIPQtY', - has no contracts
  'h9v17KHV4SXwdW2-JHU6a23f6R0YtbXZJJht8LfP8QM'
];
const BURN_ADDRESS = '';

const client = new ApolloClient({
  // uri: 'http://localhost:1984/graphql',
  cache: new InMemoryCache(),
  uri: 'https://arweave.net/graphql',
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
  },
});

const logger = Pino({
  name: 'Transfer Assets Script',
  level: 'debug',
});

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

const warp = WarpFactory.forMainnet();
LoggerFactory.INST.logLevel('error');

const JWK: JWKInterface = JSON.parse(fs.readFileSync('wallet.json').toString());

const query = gql`
  query($tags: [TagFilter!], $first: Int, $after: String) {
    transactions(tags: $tags, first: $first, after: $after) {
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

(async () => {
  const wallet = await arweave.wallets.jwkToAddress(JWK);

  const tags = [
    { name: 'Contract-Src', values: ATOMIC_ASSET_IDS },
    /*  { name: 'Title', values: ['Fair Protocol NFT'] } */
  ]

  const first = 100;
  const logs: string[] = [];
  let after = null;
  let hasNextPage = false;

  const processedIds = new Set<string>();
  let nAssetsWithUdl = 0;

  do {
    // find all contracts with the given contract id and the 'Fair Protocol NFT' title
    try {
      const { data } = await client.query({
        query,
        variables: {
          tags,
          first,
          after
        }
      });

      const txs: Tx[] = data.transactions.edges;
      after = txs[txs.length - 1].cursor;
      hasNextPage = data.transactions.pageInfo.hasNextPage;

      const filteredTxs = txs.filter(tx => 
        !processedIds.has(tx.node.id) && tx.node.tags.findIndex((tag) => tag.name === 'Collection-Code') < 0
          && tx.node.tags.findIndex((tag) => tag.name === 'Init-State') >= 0
      );

      for (const tx of filteredTxs) {
        const title = tx.node.tags.find((tag) => tag.name === 'Title')?.value;
        const operationName = tx.node.tags.find((tag) => tag.name === 'Operation-Name')?.value;
        const license = tx.node.tags.find((tag) => tag.name === 'License')?.value;
        logger.info(`Processing ${tx.node.id}`);
        logger.info(`Title: ${title}`);
        logger.info(`Operation Name: ${operationName}`);
        try {
          const contract = warp.contract(tx.node.id).connect(JWK).setEvaluationOptions({
            unsafeClient: 'skip', allowBigInt: true, internalWrites: true, useConstructor: false,
            remoteStateSyncSource: 'https://dre-u.warp.cc/contract',
            remoteStateSyncEnabled: true,
          });
          const { result }: { result: { balance: number }} = await contract.viewState({ function: 'balance', target: wallet });
          const balance = result.balance;
         /*  result.
          const { cachedValue } = await contract.readState();
      
          const balance = (cachedValue as GenericState).state.balances[wallet]; */

          if (balance > 0) {
            logger.info(`Found ${balance} tokens in ${tx.node.id}`);
            logs.push(`Found ${balance} tokens in ${tx.node.id}`);
          /*  const result = await contract.writeInteraction({
              function: 'transfer',
              qty: balance,
              target: BURN_ADDRESS
            });

            logs.push(`Burned ${balance} tokens in ${tx.node.id}; txid: ${result?.originalTxId}`); */
          } else {
            logger.info(`Found no tokens in ${tx.node.id}`);
            logs.push(`Found no tokens in ${tx.node.id}`);
          }
        } catch (error) {
          logger.error(error);
          logs.push(`Found error processing ${tx.node.id}`);
          // not an atomic asset contract or no
        }
        processedIds.add(tx.node.id);
        if (license) {
          nAssetsWithUdl++;
        }
        logger.info('----');
      }

      if (filteredTxs.length === 0) {
        logger.info('No txs matching filters found, Fetching next...');
      } else {
        logger.info(`Processed ${processedIds.size} contracts`);
      }
    } catch (error) {
      logger.error(error);
      const timestamp = Date.now();
      fs.writeFileSync(`transfer-logs-${timestamp}.txt`, logs.join('\n'));
      process.exit(1);
    }
  } while (hasNextPage);

  const timestamp = Date.now();
  fs.writeFileSync(`transfer-logs-${timestamp}.txt`, logs.join('\n'));
})();