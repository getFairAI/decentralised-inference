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

export const VAULT_ADDRESS = 'tXd-BOaxmxtgswzwMLnryROAYlX5uDC9-XK2P4VNCQQ';

export const APP_NAME = 'Fair Protocol';
export const APP_VERSION = '0.1';

export const MARKETPLACE_FEE = '0.1';
export const OPERATOR_REGISTRATION_AR_FEE = '0.05';
export const INFERENCE_PERCENTAGE_FEE = 0.05;

export const TAG_NAMES = {
  appName: 'App-Name',
  appVersion: 'App-Version',
  contentType: 'Content-Type',
  unixTime: 'Unix-Time',
  modelName: 'Model-Name',
  modelCreator: 'Model-Creator',
  modelOperator: 'Model-Operator',
  modelTransaction: 'Model-Transaction',
  modelFee: 'Model-Fee',
  modelUser: 'Model-User',
  operationName: 'Operation-Name',
  notes: 'Notes',
  category: 'Category',
  avatarUrl: 'AvatarUrl',
  description: 'Description',
  operatorName: 'Operator-Name',
  operatorFee: 'Operator-Fee',
  conversationIdentifier: 'Conversation-Identifier',
  inferenceTransaction: 'Inference-Transaction',
  requestTransaction: 'Request-Transaction',
  responseTransaction: 'Response-Transaction',
  attachmentName: 'Attachment-Name',
  attachmentRole: 'Attachment-Role',
  saveTransaction: 'Save-Transaction',
  paymentQuantity: 'Payment-Quantity',
  paymentTarget: 'Payment-Target',
  scriptTransaction: 'Script-Transaction',
  scriptName: 'Script-Name',
  scriptCurator: 'Script-Curator',
  scriptOperator: 'Script-Operator',
  scriptUser: 'Script-User',
  scriptFee: 'Script-Fee',
  voteFor: 'Vote-For',
  votedTransaction: 'Voted-Transaction',
  fileName: 'File-Name',
  allowFiles: 'Allow-Files',
  allowText: 'Allow-Text',
};

// Operation Names
export const MODEL_CREATION = 'Model Creation';

export const SCRIPT_CREATION = 'Script Creation';

export const SCRIPT_CREATION_PAYMENT = 'Script Creation Payment';

export const MODEL_ATTACHMENT = 'Model Attachment';

export const MODEL_CREATION_PAYMENT = 'Model Creation Payment';

export const REGISTER_OPERATION = 'Operator Registration';

export const SAVE_REGISTER_OPERATION = 'Operator Registration Save';

export const CANCEL_OPERATION = 'Operator Cancellation';

export const MODEL_FEE_UPDATE = 'Model Fee Update';

export const MODEL_FEE_PAYMENT = 'Model Fee Payment';

export const MODEL_FEE_PAYMENT_SAVE = 'Model Fee Payment Save';

export const SCRIPT_INFERENCE_REQUEST = 'Script Inference Request';

export const INFERENCE_PAYMENT = 'Inference Payment';

export const SCRIPT_INFERENCE_RESPONSE = 'Script Inference Response';

export const INFERENCE_PAYMENT_DISTRIBUTION = 'Fee Redistribution';

export const CONVERSATION_START = 'Conversation Start';

export const SCRIPT_FEE_PAYMENT = 'Script Fee Payment';

export const SCRIPT_FEE_PAYMENT_SAVE = 'Script Fee Payment Save';

export const UP_VOTE = 'Up Vote';

export const DOWN_VOTE = 'Down Vote';

export const VOTE_FOR_MODEL = 'Vote For Model';

export const VOTE_FOR_SCRIPT = 'Vote For Script';

export const VOTE_FOR_OPERATOR = 'Vote For Operator';

// Attachment Roles
export const AVATAR_ATTACHMENT = 'avatar';

export const NOTES_ATTACHMENT = 'notes';

// misc
export const DEV_BUNDLR_URL = 'https://devnet.bundlr.network/';
export const NODE1_BUNDLR_URL = 'https://node1.bundlr.network';
export const NODE2_BUNDLR_URL = 'https://node2.bundlr.network/';

export const DEV_ARWEAVE_URL = 'https://arweave.dev';
export const NET_ARWEAVE_URL = 'https://arweave.net';

export const N_PREVIOUS_BLOCKS = 7;
export const MIN_CONFIRMATIONS = 7;

export const DEFAULT_TAGS = [
  { name: TAG_NAMES.appName, values: [APP_NAME] },
  { name: TAG_NAMES.appVersion, values: [APP_VERSION] },
];

export const GITHUB_LINK = 'https://github.com/FAIR-Protocol/decentralized-inference';
export const DISCORD_LINK = 'https://discord.gg/GRf7CukfXf';
export const WHITEPAPER_LINK =
  'https://lqcpjipmt2d2daazjknargowboxuhn3wgealzbqdsjmwxbgli52q.arweave.net/XAT0oeyeh6GAGUqaCJnWC69Dt3YxALyGA5JZa4TLR3U';
export const TWITTER_LINK = 'https://twitter.com/fairAIprotocol';

export const operatorHeaders = [
  'Address',
  'Name',
  'Registration',
  'Fee (AR)',
  'Status',
  'Stamps',
  'Selected',
];

export const scriptHeaders = ['Creator', 'Name', 'Registration', 'Fee (AR)', 'Stamps', 'Selected'];

export const secondInMS = 1000;
export const defaultDecimalPlaces = 4;
export const successStatusCode = 200;
export const textContentType = 'text/plain';
