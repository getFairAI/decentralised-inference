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

import CONFIG from '../config.json' assert { type: 'json' };
import fs from 'fs';
import NodeBundlr from '@bundlr-network/client/build/esm/node/index';
import Arweave from 'arweave';
import { JWKInterface } from 'arweave/node/lib/wallet';
import { default as Pino } from 'pino';
import { IEdge } from './interfaces';
import {
  APP_NAME_TAG,
  APP_VERSION_TAG,
  CONTENT_TYPE_TAG,
  CONVERSATION_IDENTIFIER_TAG,
  CREATOR_PERCENTAGE_FEE,
  CURATOR_PERCENTAGE_FEE,
  INFERENCE_TRANSACTION_TAG,
  INPUT_TAG,
  MARKETPLACE_PERCENTAGE_FEE,
  NET_ARWEAVE_URL,
  OPERATION_NAME_TAG,
  REQUEST_TRANSACTION_TAG,
  SCRIPT_CURATOR_TAG,
  SCRIPT_NAME_TAG,
  SCRIPT_USER_TAG,
  SEQUENCE_OWNER_TAG,
  UNIX_TIME_TAG,
  U_DIVIDER,
  VAULT_ADDRESS,
  secondInMS,
} from './constants';
import {
  getRequest,
  queryOperatorFee,
  queryTransactionAnswered,
  queryTransactionsReceived,
  queryCheckUserPayment,
  getModelOwner,
} from './queries';

let address: string;
let modelOwner: string;
let operatorFee: number;

const logger = Pino({
  name: 'ai-detector',
  level: 'debug',
});

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

const JWK: JWKInterface = JSON.parse(fs.readFileSync('wallet.json').toString());
// initailze the bundlr SDK
// const bundlr: Bundlr = new (Bundlr as any).default(
const bundlr = new NodeBundlr('https://node1.bundlr.network', 'arweave', JWK);

const sendToBundlr = async (
  response: string,
  appVersion: string,
  userAddress: string,
  requestTransaction: string,
  conversationIdentifier: string,
) => {
  // Get loaded balance in atomic units
  const atomicBalance = await bundlr.getLoadedBalance();
  logger.info(`node balance (atomic units) = ${atomicBalance}`);

  // Convert balance to an easier to read format
  const convertedBalance = bundlr.utils.fromAtomic(atomicBalance);
  logger.info(`node balance (converted) = ${convertedBalance}`);

  const tags = [
    { name: APP_NAME_TAG, value: 'Fair Protocol' },
    { name: APP_VERSION_TAG, value: appVersion },
    { name: SCRIPT_CURATOR_TAG, value: CONFIG.scriptCurator },
    { name: SCRIPT_NAME_TAG, value: CONFIG.scriptName },
    { name: SCRIPT_USER_TAG, value: userAddress },
    { name: REQUEST_TRANSACTION_TAG, value: requestTransaction },
    { name: OPERATION_NAME_TAG, value: 'Script Inference Response' },
    { name: CONVERSATION_IDENTIFIER_TAG, value: conversationIdentifier },
    { name: CONTENT_TYPE_TAG, value: 'text/plain' },
    { name: UNIX_TIME_TAG, value: (Date.now() / secondInMS).toString() },
  ];

  try {
    const transaction = await bundlr.upload(response, { tags });
    logger.info(`Data uploaded ==> https://arweave.net/${transaction.id}`);
  } catch (e) {
    // throw error to be handled by caller
    throw new Error(`Could not upload to bundlr: ${e}`);
  }
};

const inference = async function (requestTx: IEdge) {
  const requestData = await fetch(`${NET_ARWEAVE_URL}/${requestTx.node.id}`);
  const text = await (await requestData.blob()).text();
  logger.info(`User Prompt: ${text}`);

  const res = await fetch(`${CONFIG.url}/`, {
    method: 'POST',
    body: text,
  });
  const tempData: string = await res.text();

  return tempData;
};

const getOperatorFee = async (operatorAddress = address) => {
  const operatorRegistrationTxs: IEdge[] = await queryOperatorFee(operatorAddress);

  const firstValidRegistration = operatorRegistrationTxs[0];

  if (!firstValidRegistration) {
    throw new Error('Could Not Find Operator Registration.');
  }

  const tags = firstValidRegistration.node.tags;
  const feeIndex = tags.findIndex((tag) => tag.name === 'Operator-Fee');

  if (feeIndex < 0) {
    throw new Error('Could not find Operator Fee Tag for registration.');
  }

  const opFee = parseFloat(tags[feeIndex].value);
  if (Number.isNaN(opFee) || opFee <= 0) {
    throw new Error('Invalid Operator Fee Found for registration.');
  }

  return opFee;
};

const checkUserPaidInferenceFees = async (
  txid: string,
  userAddress: string,
  creatorAddress: string,
  curatorAddress: string,
) => {
  const marketplaceShare = operatorFee * MARKETPLACE_PERCENTAGE_FEE;
  const curatorShare = operatorFee * CURATOR_PERCENTAGE_FEE;
  const creatorShare = operatorFee * CREATOR_PERCENTAGE_FEE;

  const marketpaceInput = JSON.stringify({
    function: 'transfer',
    target: VAULT_ADDRESS,
    qty: parseInt(marketplaceShare.toString(), 10).toString(),
  });

  const curatorInput = JSON.stringify({
    function: 'transfer',
    target: curatorAddress,
    qty: parseInt(curatorShare.toString(), 10).toString(),
  });

  const creatorInput = JSON.stringify({
    function: 'transfer',
    target: creatorAddress,
    qty: parseInt(creatorShare.toString(), 10).toString(),
  });

  const paymentTxs: IEdge[] = await queryCheckUserPayment(txid, userAddress, [
    marketpaceInput,
    curatorInput,
    creatorInput,
  ]);
  const necessaryPayments = 3;

  if (paymentTxs.length < necessaryPayments) {
    return false;
  } else {
    // find marketplace payment
    const marketplacePayment = paymentTxs.find((tx) =>
      tx.node.tags.find((tag) => tag.name === INPUT_TAG && tag.value === marketpaceInput),
    );

    if (!marketplacePayment) {
      return false;
    }

    // find curator payment
    const curatorPayment = paymentTxs.find((tx) =>
      tx.node.tags.find((tag) => tag.name === INPUT_TAG && tag.value === curatorInput),
    );

    if (!curatorPayment) {
      return false;
    }

    // find creator payment
    const creatorPayment = paymentTxs.find((tx) =>
      tx.node.tags.find((tag) => tag.name === INPUT_TAG && tag.value === creatorInput),
    );

    if (!creatorPayment) {
      return false;
    }
  }

  return true;
};

const processRequest = async (requestId: string, reqUserAddr: string) => {
  const requestTx: IEdge = await getRequest(requestId);
  if (!requestTx) {
    // If the request doesn't exist, skip
    logger.error(`Request ${requestId} does not exist. Skipping...`);
    return false;
  }

  const responseTxs: IEdge[] = await queryTransactionAnswered(requestId, address);
  if (responseTxs.length > 0) {
    // If the request has already been answered, we don't need to do anything
    logger.info(`Request ${requestId} has already been answered. Skipping...`);
    return true;
  }

  if (
    !(await checkUserPaidInferenceFees(
      requestTx.node.id,
      reqUserAddr,
      modelOwner,
      CONFIG.scriptCurator,
    ))
  ) {
    logger.error(`Could not find payment for request ${requestId}. Skipping...`);
    return false;
  }

  const appVersion = requestTx.node.tags.find((tag) => tag.name === 'App-Version')?.value;
  const conversationIdentifier = requestTx.node.tags.find(
    (tag) => tag.name === 'Conversation-Identifier',
  )?.value;
  if (!appVersion || !conversationIdentifier) {
    // If the request doesn't have the necessary tags, skip
    logger.error(`Request ${requestId} does not have the necessary tags.`);
    return false;
  }

  const inferenceResult = await inference(requestTx);
  logger.info(`Inference Result: ${inferenceResult}`);

  await sendToBundlr(
    inferenceResult,
    appVersion,
    requestTx.node.owner.address,
    requestTx.node.id,
    conversationIdentifier,
  );

  return true;
};

const lastProcessedTxs: string[] = [];

const start = async () => {
  try {
    // request only new txs
    const { requestTxs, hasNextPage } = await queryTransactionsReceived(address, operatorFee);

    const newRequestTxs = requestTxs.filter(
      (tx) => !lastProcessedTxs.find((txid) => txid === tx.node.id),
    );

    let fetchMore = hasNextPage;

    const pageSize = 10;
    // if lastProcessed request length is bigger than one page then script already processed all previous requests
    if (lastProcessedTxs.length <= pageSize) {
      while (fetchMore && newRequestTxs.length > 0) {
        const { requestTxs: nextPageTxs, hasNextPage: newHasNextPage } =
          await queryTransactionsReceived(
            address,
            operatorFee,
            newRequestTxs[newRequestTxs.length - 1].cursor,
          );

        newRequestTxs.push(...nextPageTxs);
        fetchMore = newHasNextPage;
      }
    }

    for (const edge of newRequestTxs) {
      logger.info(`Processing request ${edge.node.id} ...`);
      // Check if request already answered:
      const reqTxId = edge.node.tags.find((tag) => tag.name === INFERENCE_TRANSACTION_TAG)?.value;
      const reqUserAddr = edge.node.tags.find((tag) => tag.name === SEQUENCE_OWNER_TAG)?.value;

      let successRequest = false;

      if (reqTxId && reqUserAddr) {
        successRequest = await processRequest(reqTxId, reqUserAddr);
      } else {
        logger.error('No inference Tx or userAddr. Skipping...');
        // skip requests without inference transaction tag
      }

      if (successRequest) {
        // save latest tx id only for successful processed requests
        lastProcessedTxs.push(edge.node.id);
      } else {
        // if request was not processed successfully, do not add it to lastProcessedTxs
      }
    }
  } catch (e) {
    logger.error(`Errored with: ${e}`);
  }
  logger.info(`Sleeping for ${CONFIG.sleepTimeSeconds} second(s) ...`);
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  address = await arweave.wallets.jwkToAddress(JWK);

  logger.info(`Wallet address: ${address}`);

  try {
    modelOwner = await getModelOwner();
    logger.info(`Found Model owner: ${modelOwner}`);
  } catch (err) {
    logger.error('Error getting model owner');
    logger.info('Shutting down...');

    process.exit(1);
  }

  try {
    operatorFee = await getOperatorFee();
    logger.info(`Found Operator fee: ${operatorFee / U_DIVIDER} $u`);
  } catch (err) {
    logger.error('Error fetching operator fee');
    logger.info('Shutting down...');

    process.exit(1);
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    await start();
    await sleep(CONFIG.sleepTimeSeconds * secondInMS);
  }
})();
