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
import { APP_NAME_TAG, APP_VERSION_TAG, CONTENT_TYPE_TAG, CONVERSATION_IDENTIFIER_TAG, MAX_ALPACA_TOKENS, NET_ARWEAVE_URL, OPERATION_NAME_TAG, PAYMENT_QUANTITY_TAG, PAYMENT_TARGET_TAG, REQUEST_TOKENS_TAG, REQUEST_TRANSACTION_TAG, RESPONSE_TOKENS_TAG, RESPONSE_TRANSACTION_TAG, SCRIPT_CURATOR_TAG, SCRIPT_NAME_TAG, SCRIPT_USER_TAG, UNIX_TIME_TAG, secondInMS, successStatusCode } from './constants';
import { AlpacaHttpResponse, IEdge } from './interfaces';
import { queryCheckUserCuratorPayment, queryCheckUserPayment, queryCheckUserScriptRequests, queryOperatorFee, queryRequestsForConversation, queryResponsesForRequests, queryScriptFee, queryTransactionAnswered, queryTransactionsReceived } from './queries';

const logger = Pino({
  name: 'alpaca',
  level: 'debug'
});

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

const JWK: JWKInterface = JSON.parse(fs.readFileSync('wallet.json').toString());
// initailze the bundlr SDK
// const bundlr: Bundlr = new (Bundlr as any).default(
const bundlr = new Bundlr('https://node1.bundlr.network', 'arweave', JWK);

const sendToBundlr = async (
  response: AlpacaHttpResponse,
  appVersion: string,
  userAddress: string,
  requestTransaction: string,
  conversationIdentifier: string,
  paymentQuantity: string,
) => {
  // Print your wallet address
  logger.info(`Wallet address: ${bundlr.address}`);

  // Check the price to upload 1MB of data
  // The function accepts a number of bytes, so to check the price of
  // 1MB, check the price of 1,048,576 bytes.
  const dataSizeToCheck = 1048576;
  const price1MBAtomic = await bundlr.getPrice(dataSizeToCheck);

  // To ensure accuracy when performing mathematical operations
  // on fractional numbers in JavaScript, it is common to use atomic units.
  // This is a way to represent a floating point (decimal) number using non-decimal notation.
  // Once we have the value in atomic units, we can convert it into something easier to read.
  const price1MBConverted = bundlr.utils.fromAtomic(price1MBAtomic);
  logger.info(`Uploading 1MB to Bundlr costs $${price1MBConverted}`);

  // Get loaded balance in atomic units
  const atomicBalance = await bundlr.getLoadedBalance();
  logger.info(`node balance (atomic units) = ${atomicBalance}`);

  // Convert balance to an easier to read format
  const convertedBalance = bundlr.utils.fromAtomic(atomicBalance);
  logger.info(`node balance (converted) = ${convertedBalance}`);

  const promptTokens = response.usage.prompt_tokens;
  const responseTokens = response.usage.completion_tokens;
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
    { name: PAYMENT_QUANTITY_TAG, value: paymentQuantity },
    { name: PAYMENT_TARGET_TAG, value: CONFIG.marketplaceWallet },
    { name: UNIX_TIME_TAG, value: (Date.now() / secondInMS).toString() },
    { name: REQUEST_TOKENS_TAG, value: `${promptTokens}` },
    { name: RESPONSE_TOKENS_TAG, value: `${responseTokens}` },
  ];

  try {
    const transaction = await bundlr.upload(response.output, { tags });

    logger.info(`Data uploaded ==> https://arweave.net/${transaction.id}`);
    return transaction.id;
  } catch (e) {
    // throw error to be handled by caller
    throw new Error(`Could not upload to bundlr: ${e}`);
  }
};

const inferenceWithContext = async (requestTx: IEdge, text: string, conversationIdentifier: string) => {
  // fetch old messages from same conversation
  const requestTxs = await queryRequestsForConversation(requestTx.node.owner.address, conversationIdentifier);
  // filter out current tx and tx newer than current;
  const pastTxs: IEdge[] = requestTxs.filter(
    (tx: IEdge) => tx.node.id !== requestTx.node.id
  );
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
    const responseTxs = await queryResponsesForRequests(requestTx.node.owner.address, conversationIdentifier, requestIds);

    const responsesToConsider: IEdge[] = [];

    let count = 0;
    responseTxs.forEach((curr) => {
      const promptTokens = curr.node.tags.find((tag) => tag.name === REQUEST_TOKENS_TAG)?.value;
      const responseTokens = curr.node.tags.find((tag) => tag.name === RESPONSE_TOKENS_TAG)?.value;
      const totalPairCount = parseInt(promptTokens ?? '0', 10) + parseInt(responseTokens ?? '0', 10);
      count = count + totalPairCount;
      if (count < MAX_ALPACA_TOKENS) {
        responsesToConsider.push(curr);
      }
    });

    // find requests pairs
    const requestsToConsider = pastTxs.filter(
      (pastTx) => responseTxs.findIndex(
        ((responseTx) => responseTx.node.tags.find(
          (tag) => tag.name === REQUEST_TRANSACTION_TAG
        )?.value === pastTx.node.id)
      ) >= 0
    );

    const allMessages = [ ...requestsToConsider, ...responsesToConsider ].sort((a, b) => {
      const aTime = parseFloat(a.node.tags.find((tag) => tag.name === UNIX_TIME_TAG)?.value ?? '');
      const bTime = parseFloat(b.node.tags.find((tag) => tag.name === UNIX_TIME_TAG)?.value ?? '');
      return aTime - bTime;
    });

    const promptPieces = ['Take into consideration the previous messages: {'];
    for (const tx of allMessages) {
      const txData = await fetch(`${NET_ARWEAVE_URL}/${tx.node.id}`);
      const decodedTxData = await (await txData.blob()).text();
      if (tx.node.owner.address === requestTx.node.owner.address) {
        promptPieces.push(`Me: ${decodedTxData}`);
      } else {
        promptPieces.push(`Response: ${decodedTxData}`);
      }
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

const inference = async (requestTx: IEdge, conversationIdentifier: string, useContext: boolean) => {
  const requestData = await fetch(`${NET_ARWEAVE_URL}/${requestTx.node.id}`);
  const text = await (await requestData.blob()).text();
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

const sendFee = async (
  quantity: string,
  appVersion: string,
  userAddress: string,
  requestTransaction: string,
  conversationIdentifier: string,
  responseTransaction: string,
) => {
  //  create a wallet-to-wallet transaction sending the marketplace fee to the target address
  const tx = await arweave.createTransaction(
    {
      target: CONFIG.marketplaceWallet,
      quantity,
    },
    JWK,
  );

  tx.addTag(APP_NAME_TAG, 'Fair Protocol');
  tx.addTag(APP_VERSION_TAG, appVersion);
  tx.addTag(SCRIPT_CURATOR_TAG, CONFIG.scriptCurator);
  tx.addTag(SCRIPT_NAME_TAG, CONFIG.scriptName);
  tx.addTag(SCRIPT_USER_TAG, userAddress);
  tx.addTag(REQUEST_TRANSACTION_TAG, requestTransaction);
  tx.addTag(OPERATION_NAME_TAG, 'Fee Redistribution');
  tx.addTag(CONVERSATION_IDENTIFIER_TAG, conversationIdentifier);
  tx.addTag(CONTENT_TYPE_TAG, 'application/json');
  tx.addTag(RESPONSE_TRANSACTION_TAG, responseTransaction);
  tx.addTag(UNIX_TIME_TAG, (Date.now() / secondInMS).toString());

  // you must sign the transaction with your key before posting
  await arweave.transactions.sign(tx, JWK);

  // post the transaction
  const res = await arweave.transactions.post(tx);
  if (res.status === successStatusCode) {
    logger.info('Fee paid successfully to the Marketplace.');
  } else {
    throw new Error(res.statusText);
  }
};

const getOperatorFee = async (address: string) => {
  const operatorRegistrationTxs: IEdge[] = await queryOperatorFee(address);

  let firstValidRegistration: IEdge | null = null;
  for (const tx of operatorRegistrationTxs) {
    const getTransactionStatus = await arweave.transactions.getStatus(tx.node.id);
    const isTransactionConfirmed =
      !!getTransactionStatus.confirmed &&
      getTransactionStatus.confirmed.number_of_confirmations > CONFIG.minBlockConfirmations;
    if (isTransactionConfirmed) {
      firstValidRegistration = tx;
      break;
    }
  }

  if (!firstValidRegistration) {
    throw new Error("Program didn't found any confirmed Operator Registration.");
  }

  const tags = firstValidRegistration.node.tags;
  const feeIndex = tags.findIndex((tag) => tag.name === 'Operator-Fee');
  
  if (feeIndex < 0) {
    throw new Error("Program didn't found a valid Operator-Fee tag.");
  }

  const operatorFee = parseFloat(tags[feeIndex].value);
  if (Number.isNaN(operatorFee) || operatorFee <= 0) {
    throw new Error('Invalid Operator Fee Found for registration.');
  }

  return operatorFee;
};

const getScriptFee = async () => {
  const ScriptFeeTxs = await queryScriptFee();
  const latestScriptTx: IEdge | null= ScriptFeeTxs.length > 0 ? ScriptFeeTxs[0] : null;

  if (!latestScriptTx) {
    throw new Error("Program didn't found any confirmed Script Creation.");
  }

  const scriptTags = latestScriptTx.node.tags;
  const scriptFeeIndex = scriptTags.findIndex((tag) => tag.name === 'Script-Fee');

  if (scriptFeeIndex < 0) {
    throw new Error("Program didn't found a valid Script-Fee tag.");
  }

  const scriptFee = parseFloat(scriptTags[scriptFeeIndex].value);
  if (Number.isNaN(scriptFee) || scriptFee <= 0) {
    throw new Error('Invalid Script Fee Found for Script Creation');
  }
  return scriptFee;
};

const checkuserPaidScriptFee = async (curatorAddress: string, scriptFee: number) => {
  const userCuratorPaymentEdges: IEdge[] = await queryCheckUserCuratorPayment(curatorAddress);
  const userCuratorPaymentEdge: IEdge | null = userCuratorPaymentEdges.length > 0 ? userCuratorPaymentEdges[0] : null;

  if (!userCuratorPaymentEdge) {
    throw new Error("Program didn't found any confirmed Curator Payment From the user.");
  }

  const { confirmed: userPaymentConfirmed } = await arweave.transactions.getStatus(
    userCuratorPaymentEdge.node.id,
  );
  const isTransactionConfirmed = userPaymentConfirmed && userPaymentConfirmed.number_of_confirmations > CONFIG.minBlockConfirmations;

  if (isTransactionConfirmed) {
    const totalAmountPaid = userCuratorPaymentEdges.reduce((a, b) => a + parseFloat(b.node.quantity.winston), 0);
    if (totalAmountPaid < scriptFee) {
      throw new Error('User has not paid curator the necessary amount');
    }
  } else {
    throw new Error('User Payments to the creator not yet confirmed.');
  }

  return true;
};

const checkUserPaidPastInferences = async (userAddress: string, operatorFee: number) => {
  const checkUserScriptRequestsEdges: IEdge[] = await queryCheckUserScriptRequests(userAddress);

  for (const scriptRequest of checkUserScriptRequestsEdges) {
    const checkUserPaymentEdges: IEdge[] = await queryCheckUserPayment(
      userAddress,
      scriptRequest.node.id,
    );

    if (checkUserPaymentEdges.length === 0 || operatorFee > parseFloat(checkUserPaymentEdges[0].node.quantity.winston)) {
      throw new Error('User has not paid the necessary amount to the operators for the previous requests');
    }
  }
  
  return true;
};

const processRequest = async (requestTx: IEdge, operatorFee: number, useContext: boolean) => {
  // Check if user has paid the curator:
  const scriptFee = await getScriptFee();
  // checkUserPaidScriptFee will throw an error if the user has not paid the curator
  await checkuserPaidScriptFee(requestTx.node.owner.address, scriptFee);

  await checkUserPaidPastInferences(requestTx.node.owner.address, operatorFee);

  const appVersion = requestTx.node.tags.find((tag) => tag.name === 'App-Version')?.value;
  const conversationIdentifier = requestTx.node.tags.find((tag) => tag.name === 'Conversation-Identifier')?.value;
  if (!appVersion || !conversationIdentifier) {
    throw new Error('Invalid App Version or Conversation Identifier');
  }

  const inferenceResult = await inference(requestTx, conversationIdentifier, useContext);
  logger.info(`Inference Result: ${inferenceResult.output}`);
    
  const quantity = (operatorFee * CONFIG.inferencePercentageFee).toString();
  const updloadResultId = await sendToBundlr(
    inferenceResult,
    appVersion,
    requestTx.node.owner.address,
    requestTx.node.id,
    conversationIdentifier,
    quantity,
  );
  
  if (updloadResultId) {
    await sendFee( 
      quantity,
      appVersion,
      requestTx.node.owner.address,
      requestTx.node.id,
      conversationIdentifier,
      updloadResultId,
    );
  }
};

const start = async (useContext = false) => {
  try {
    const address = await arweave.wallets.jwkToAddress(JWK);

    const operatorFee = await getOperatorFee(address);

    const requestTxs: IEdge[] = await queryTransactionsReceived(address);

    for (const edge of requestTxs) {
      // Check if request already answered:
      const responseTxs: IEdge[] = await queryTransactionAnswered(edge.node.id, address);
      
      if (responseTxs.length === 0) {
        processRequest(edge, operatorFee, useContext);
      } else {
        // Request already answered; skip
      }
    }
  } catch (e) {
    logger.error(`Errored with: ${e}`);
  }
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  const firstArgIdx = 2;
  const useContext = process.argv[firstArgIdx] === 'with-context';
  logger.info('Starting with Context: '+ useContext);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await start(useContext);
    await sleep(CONFIG.sleepTimeSeconds * secondInMS);
    logger.info(`Slept for ${CONFIG.sleepTimeSeconds} second(s). Restarting cycle now...`);
  }
})();