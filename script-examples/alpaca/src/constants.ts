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

export const APP_VERSION_TAG = 'App-Version';
export const CONVERSATION_IDENTIFIER_TAG = 'Conversation-Identifier';
export const APP_NAME_TAG = 'App-Name';
export const CONTENT_TYPE_TAG = 'Content-Type';
export const UNIX_TIME_TAG = 'Unix-Time';
export const SCRIPT_CURATOR_TAG = 'Script-Curator';
export const SCRIPT_NAME_TAG = 'Script-Name';
export const SCRIPT_USER_TAG = 'Script-User';
export const SCRIPT_OPERATOR_TAG = 'Script-Operator';
export const REQUEST_TRANSACTION_TAG = 'Request-Transaction';
export const RESPONSE_TRANSACTION_TAG = 'Response-Transaction';
export const OPERATION_NAME_TAG = 'Operation-Name';
export const PAYMENT_QUANTITY_TAG = 'Payment-Quantity';
export const PAYMENT_TARGET_TAG = 'Payment-Target';
export const REQUEST_TOKENS_TAG = 'Request-Tokens';
export const RESPONSE_TOKENS_TAG = 'Response-Tokens';
export const INFERENCE_TRANSACTION_TAG = 'Inference-Transaction';

export const SCRIPT_INFERENCE_REQUEST = 'Script Inference Request';

export const NET_ARWEAVE_URL = 'https://arweave.net';
export const secondInMS = 1000;
export const successStatusCode = 200;

// https://github.com/facebookresearch/llama/issues/148
// according to discussing llama was trained on 2048 tokens so we will use the same number
// for the max tokens allowed to be passed in context
export const MAX_ALPACA_TOKENS = 2048;
