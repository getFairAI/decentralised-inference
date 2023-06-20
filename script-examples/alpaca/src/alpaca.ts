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
import Bundlr from '@bundlr-network/client';
import Arweave from 'arweave';
import { JWKInterface } from 'arweave/node/lib/wallet';
import { default as Pino } from 'pino';
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
  MAX_ALPACA_TOKENS,
  NET_ARWEAVE_URL,
  OPERATION_NAME_TAG,
  REQUEST_TOKENS_TAG,
  REQUEST_TRANSACTION_TAG,
  RESPONSE_TOKENS_TAG,
  SCRIPT_CURATOR_TAG,
  SCRIPT_NAME_TAG,
  SCRIPT_USER_TAG,
  SEQUENCE_OWNER_TAG,
  UNIX_TIME_TAG,
  VAULT_ADDRESS,
  secondInMS,
} from './constants';
import { AlpacaHttpResponse, IEdge } from './interfaces';
import {
  getRequest,
  queryOperatorFee,
  queryTransactionAnswered,
  queryTransactionsReceived,
  queryCheckUserPayment,
  getModelOwner,
  queryResponsesForRequests,
  queryRequestsForConversation,
} from './queries';
import AdmZip from 'adm-zip';

const logger = Pino({
  name: 'alpaca',
  level: 'debug',
});

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

const JWK: JWKInterface = JSON.parse(fs.readFileSync('wallet.json').toString());
const address = await arweave.wallets.jwkToAddress(JWK);

logger.info(`Wallet address: ${address}`);
let modelOwner: string;

// initailze the bundlr SDK
// const bundlr: Bundlr = new (Bundlr as any).default(
const bundlr = new Bundlr('https://node1.bundlr.network', 'arweave', JWK);

const sendToBundlr = async (
  response: AlpacaHttpResponse,
  appVersion: string,
  userAddress: string,
  requestTransaction: string,
  conversationIdentifier: string,
) => {
  // Get loaded balance in atomic units
  const atomicBalance = await bundlr.getLoadedBalance();
  // Convert balance to an easier to read format
  const convertedBalance = bundlr.utils.fromAtomic(atomicBalance);
  logger.info(`node balance (converted) = ${convertedBalance} AR`);

  const tags = [
    { name: APP_NAME_TAG, value: 'Fair Protocol' },
    { name: APP_VERSION_TAG, value: appVersion },
    { name: SCRIPT_CURATOR_TAG, value: CONFIG.scriptCurator },
    { name: SCRIPT_NAME_TAG, value: CONFIG.scriptName },
    { name: SCRIPT_USER_TAG, value: userAddress },
    { name: REQUEST_TRANSACTION_TAG, value: requestTransaction },
    { name: OPERATION_NAME_TAG, value: 'Script Inference Response' },
    { name: CONVERSATION_IDENTIFIER_TAG, value: conversationIdentifier },
    { name: CONTENT_TYPE_TAG, value: 'application/json' },
    { name: UNIX_TIME_TAG, value: (Date.now() / secondInMS).toString() },
  ];

  if (response.usage) {
    const promptTokens = response.usage.prompt_tokens;
    const responseTokens = response.usage.completion_tokens;
    tags.push({ name: REQUEST_TOKENS_TAG, value: `${promptTokens}` });
    tags.push({ name: RESPONSE_TOKENS_TAG, value: `${responseTokens}` });
  }

  try {
    const transaction = await bundlr.upload(response.output, { tags });

    logger.info(`Data uploaded ==> https://arweave.net/${transaction.id}`);
    return transaction.id;
  } catch (e) {
    // throw error to be handled by caller
    throw new Error(`Could not upload to bundlr: ${e}`);
  }
};

const parseMessage = async (tx: IEdge, requestTxOwner: string, promptPieces: string[]) => {
  const txData = await fetch(`${NET_ARWEAVE_URL}/${tx.node.id}`);
  let decodedTxData;
  if (txData.headers.get(CONTENT_TYPE_TAG)?.includes('text')) {
    decodedTxData = await (await txData.blob()).text();
  } else if (txData.headers.get(CONTENT_TYPE_TAG)?.includes('zip')) {
    const buffer = Buffer.from(new Uint8Array(await txData.arrayBuffer()));
    const zip = new AdmZip(buffer);

    // currently only supports one file in zip
    const firstFile = zip.getEntries()[0];
    if (firstFile.entryName.includes('.txt')) {
      decodedTxData = firstFile.getData().toString('utf8');
    } else {
      decodedTxData = null;
    }
  } else {
    decodedTxData = null;
  }

  if (decodedTxData && tx.node.owner.address === requestTxOwner) {
    promptPieces.push(`Me: ${decodedTxData}`);
  } else if (decodedTxData) {
    promptPieces.push(`Response: ${decodedTxData}`);
  } else {
    // skip
  }
};

const inferenceWithContext = async (
  requestTx: IEdge,
  text: string,
  conversationIdentifier: string,
) => {
  // fetch old messages from same conversation
  const requestTxs = await queryRequestsForConversation(
    requestTx.node.owner.address,
    conversationIdentifier,
  );
  // filter out current tx and tx newer than current;
  const pastTxs: IEdge[] = requestTxs.filter((tx: IEdge) => tx.node.id !== requestTx.node.id);
  if (pastTxs.length === 0) {
    // if no previous requests
    const res = await fetch(CONFIG.url, {
      method: 'POST',
      body: text,
    });
    const response: AlpacaHttpResponse = await res.json();
    return response;
  } else {
    const requestIds = pastTxs.map((tx) => tx.node.id);
    // find responses for past requests found
    const responseTxs = await queryResponsesForRequests(
      requestTx.node.owner.address,
      conversationIdentifier,
      requestIds,
    );

    const responsesToConsider: IEdge[] = [];

    let count = 0;
    responseTxs.forEach((curr) => {
      const promptTokens =
        curr.node.tags.find((tag) => tag.name === REQUEST_TOKENS_TAG)?.value ?? '0';
      const responseTokens =
        curr.node.tags.find((tag) => tag.name === RESPONSE_TOKENS_TAG)?.value ?? '0';
      const totalPairCount = parseInt(promptTokens, 10) + parseInt(responseTokens, 10);
      count = count + totalPairCount;
      if (count < MAX_ALPACA_TOKENS) {
        responsesToConsider.push(curr);
      }
    });

    // find requests pairs
    const requestsToConsider = pastTxs.filter(
      (pastTx) =>
        responseTxs.findIndex(
          (responseTx) =>
            responseTx.node.tags.find((tag) => tag.name === REQUEST_TRANSACTION_TAG)?.value ===
            pastTx.node.id,
        ) >= 0,
    );

    const allMessages = [...requestsToConsider, ...responsesToConsider].sort((a, b) => {
      const aTime = parseFloat(a.node.tags.find((tag) => tag.name === UNIX_TIME_TAG)?.value ?? '');
      const bTime = parseFloat(b.node.tags.find((tag) => tag.name === UNIX_TIME_TAG)?.value ?? '');
      return aTime - bTime;
    });

    const promptPieces = ['Take into consideration the previous messages: {'];
    for (const tx of allMessages) {
      await parseMessage(tx, requestTx.node.owner.address, promptPieces);
    }
    promptPieces.push('}');

    promptPieces.push(` Answer the following: ${text}`);
    const res = await fetch(CONFIG.url, {
      method: 'POST',
      body: promptPieces.join(' '),
    });
    const response: AlpacaHttpResponse = await res.json();
    return response;
  }
};

const inference = async (
  requestTx: IEdge,
  conversationIdentifier: string,
  useContext: boolean,
  allowFiles: boolean,
) => {
  const requestData = await fetch(`${NET_ARWEAVE_URL}/${requestTx.node.id}`);
  let text: string;
  if (allowFiles) {
    if (requestData.headers.get(CONTENT_TYPE_TAG)?.includes('text')) {
      text = await (await requestData.blob()).text();
    } else if (requestData.headers.get(CONTENT_TYPE_TAG)?.includes('zip')) {
      const buffer = Buffer.from(new Uint8Array(await requestData.arrayBuffer()));
      const zip = new AdmZip(buffer);

      // currently only supports one file in zip
      const firstFile = zip.getEntries()[0];
      if (!firstFile.entryName.includes('.txt')) {
        text = firstFile.getData().toString('utf8');
      } else {
        return {
          output: 'Request Error: Files need to have .txt extension when inside zip folder',
        } as AlpacaHttpResponse;
      }
    } else {
      return { output: 'Request Error: File type not supported' } as AlpacaHttpResponse;
    }
  } else {
    text = await (await requestData.blob()).text();
  }

  logger.info(`User Prompt: ${text}`);

  if (useContext) {
    return inferenceWithContext(requestTx, text, conversationIdentifier);
  } else {
    const res = await fetch(CONFIG.url, {
      method: 'POST',
      body: text,
    });
    const response: AlpacaHttpResponse = await res.json();
    return response;
  }
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

  const operatorFee = parseFloat(tags[feeIndex].value);
  if (Number.isNaN(operatorFee) || operatorFee <= 0) {
    throw new Error('Invalid Operator Fee Found for registration.');
  }

  return operatorFee;
};

const checkUserPaidInferenceFees = async (
  txid: string,
  userAddress: string,
  creatorAddress: string,
  curatorAddress: string,
  operatorFee: number,
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

const processRequest = async (
  requestId: string,
  reqUserAddr: string,
  operatorFee: number,
  useContext: boolean,
  allowFiles: boolean,
) => {
  const requestTx: IEdge = await getRequest(requestId);
  if (!requestTx) {
    // If the request doesn't exist, skip

    return;
  }

  const responseTxs: IEdge[] = await queryTransactionAnswered(requestId, address);
  if (responseTxs.length > 0) {
    // If the request has already been answered, we don't need to do anything
    return;
  }

  if (
    !(await checkUserPaidInferenceFees(
      requestTx.node.id,
      reqUserAddr,
      modelOwner,
      CONFIG.scriptCurator,
      operatorFee,
    ))
  ) {
    return;
  }

  const appVersion = requestTx.node.tags.find((tag) => tag.name === 'App-Version')?.value;
  const conversationIdentifier = requestTx.node.tags.find(
    (tag) => tag.name === 'Conversation-Identifier',
  )?.value;

  if (!appVersion || !conversationIdentifier) {
    // If the request doesn't have the necessary tags, skip

    return;
  }

  const inferenceResult = await inference(
    requestTx,
    conversationIdentifier,
    useContext,
    allowFiles,
  );
  logger.info(`Inference Result: ${inferenceResult.output}`);

  await sendToBundlr(
    inferenceResult,
    appVersion,
    requestTx.node.owner.address,
    requestTx.node.id,
    conversationIdentifier,
  );
};

let lastProcessedTx: string | null = null;

const start = async (useContext = false, allowFiles = false) => {
  try {
    const operatorFee = await getOperatorFee();
    const { requestTxs, hasNextPage } = await queryTransactionsReceived(address, operatorFee);

    if (requestTxs.length === 0 || requestTxs[0].node.id === lastProcessedTx) {
      // No new requests

      return;
    }

    let fetchMore = hasNextPage;

    while (fetchMore) {
      const { requestTxs: newRequestTxs, hasNextPage: newHasNextPage } =
        await queryTransactionsReceived(
          address,
          operatorFee,
          requestTxs[requestTxs.length - 1].cursor,
        );

      requestTxs.push(...newRequestTxs);
      fetchMore = newHasNextPage;
    }

    for (const edge of requestTxs) {
      // Check if request already answered:
      const reqTxId = edge.node.tags.find((tag) => tag.name === INFERENCE_TRANSACTION_TAG)?.value;
      const reqUserAddr = edge.node.tags.find((tag) => tag.name === SEQUENCE_OWNER_TAG)?.value;

      if (reqTxId && reqUserAddr) {
        await processRequest(reqTxId, reqUserAddr, operatorFee, useContext, allowFiles);
      } else {
        // skip requests without inference transaction tag
      }
    }

    // save latest tx id
    lastProcessedTx = requestTxs.length > 0 ? requestTxs[0].node.id : null;
  } catch (e) {
    logger.error(`Errored with: ${e}`);
  }
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  try {
    modelOwner = await getModelOwner();
  } catch (err) {
    logger.error('Error getting model owner');
    logger.info('Shutting down');

    process.exit(1);
  }
  const useContext = !!process.argv.find((el) => el === 'with-context');
  logger.info('Starting with Context: ' + useContext);

  const allowFiles = !!process.argv.find((el) => el === 'allow-files');
  logger.info('Starting with Allow Files: ' + allowFiles);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    await start(useContext, allowFiles);
    await sleep(CONFIG.sleepTimeSeconds * secondInMS);
    logger.info(`Slept for ${CONFIG.sleepTimeSeconds} second(s). Restarting cycle now...`);
  }
})();
