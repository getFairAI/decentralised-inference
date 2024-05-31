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
export const MARKETPLACE_ADDRESS = 'RQFarhgXPXYkgRM0Lzv088MllseKQWEdnEiRUggteIo';

export const MARKETPLACE_EVM_ADDRESS = '0x611dEe04f236BbC45e3a6De266ABe2B2b32eab31'; // placeholder
export const REGISTRATION_USDC_FEE = 0.5; // operators needs to pay 0.5 USDC to register

export const U_CONTRACT_ID = 'KTzTXT_ANmF84fWEKHzWURD1LWd9QaFR9yfYUwH2Lxw';
export const U_DIVIDER = 1e6;
export const VOUCH_CONTRACT_ID = '_z0ch80z_daDUFqC9jHjfOL8nekJcok4ZRkE_UesYsk';
export const U_LOGO_SRC = 'https://arweave.net/J3WXX4OGa6wP5E9oLhNyqlN4deYI7ARjrd5se740ftE';

export const UCM_CONTRACT_ID = 'tfalT8Z-88riNtoXdF5ldaBtmsfcSmbMqWLh2DHJIbg';
export const UCM_DIVIDER = 1e6;

export const UDL_ID = 'yRj4a5KMctX_uOmKWCFJIjmY8DeJcusVk6-HzLiM_t8';

export const APACHE_ID = 'HO_Truhp5Y_RDLhy4tWyFUmp8xsYt6dx2_U278bEK9g';
export const CREATIVEML_PLUSPLUS_M_ID = '51_v_jW77YGTpCAtI6GG0D9p7WlAiHf_zoHCFX1yUDk';
export const CREATIVEML_M_ID = 'mR-ehDm3Gok5deOEGcskeNOxmDLp2h52KHZdSI1I3YI';
export const MIT_ID = '5nreaPQMmB6mTx_q1be49wjF_LIdAlXKEv81wEHNeek';
export const ATOMIC_ASSET_CONTRACT_SOURCE_ID = 'h9v17KHV4SXwdW2-JHU6a23f6R0YtbXZJJht8LfP8QM';

export const OLD_PROTOCOL_NAME = 'Fair Protocol';
export const PREVIOUS_VERSIONS = ['0.1', '0.3'];
export const OLD_PROTOCOL_VERSION = '1.0';

export const PROTOCOL_NAME = 'FairAI';
export const PROTOCOL_VERSION = '2.0';

export const MARKETPLACE_FEE = '0.5'; // u
export const OPERATOR_REGISTRATION_AR_FEE = '0.05'; // u

export const OPERATOR_PERCENTAGE_FEE = 0.7;
export const MARKETPLACE_PERCENTAGE_FEE = 0.1;
export const CURATOR_PERCENTAGE_FEE = 0.05;
export const CREATOR_PERCENTAGE_FEE = 0.15;

// Choose the latest script and operator
export const IS_TO_CHOOSE_MODEL_AUTOMATICALLY = true;

export const TAG_NAMES = {
  protocolName: 'Protocol-Name',
  protocolVersion: 'Protocol-Version',
  appName: 'App-Name',
  customAppName: 'Custom-App-Name',
  appVersion: 'App-Version',
  customAppVersion: 'Custom-App-Version',
  contentType: 'Content-Type',
  unixTime: 'Unix-Time',
  modelName: 'Model-Name',
  modelCreator: 'Model-Creator',
  modelOperator: 'Model-Operator',
  modelTransaction: 'Model-Transaction',
  modelUser: 'Model-User',
  operationName: 'Operation-Name',
  notes: 'Notes',
  modelCategory: 'Model-Category',
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
  solutionName: 'Solution-Name',
  solutionCreator: 'Solution-Curator',
  solutionOperator: 'Solution-Operator',
  solutionUser: 'Solution-User',
  voteFor: 'Vote-For',
  votedTransaction: 'Voted-Transaction',
  fileName: 'File-Name',
  allowFiles: 'Allow-Files',
  allowText: 'Allow-Text',
  registrationTransaction: 'Registration-Transaction',
  registrationFee: 'Registration-Fee',
  input: 'Input',
  contract: 'Contract',
  sequencerOwner: 'Sequencer-Owner',
  updateFor: 'Update-For',
  previousVersions: 'Previous-Versions',
  txOrigin: 'Transaction-Origin',
  assetNames: 'Asset-Names',
  negativePrompt: 'Negative-Prompt',
  userCustomTags: 'User-Custom-Tags',
  nImages: 'N-Images',
  output: 'Output',
  outputConfiguration: 'Output-Configuration',
  contractSrc: 'Contract-Src',
  contractManifest: 'Contract-Manifest',
  initState: 'Init-State',
  license: 'License',
  derivation: 'Derivation',
  commercialUse: 'Commercial-Use',
  licenseFee: 'License-Fee',
  currency: 'Currency',
  expires: 'Expires',
  paymentAddress: 'Payment-Address',
  paymentMode: 'Payment-Mode',
  licenseConfig: 'License-Config',
  userRatingScore: 'User-Rating-Score',
  userRatingComment: 'User-Rating-Comment',
  generateAssets: 'Generate-Assets',
  rareweaveConfig: 'Rareweave-Config',
  termsVersion: 'Terms-Version',
  keywords: 'Keywords',
  solutionTransaction: 'Solution-Transaction',
  rewardsEvmAddress: 'Rewards-Evm-Address',
  privateMode: 'Private-Mode',
  encDataForOperator: 'Encrypted-Data-For-Operator',
};

export const TX_ORIGIN = 'Fair Protocol UI';

// Operation Names
export const MODEL_CREATION = 'Model Creation';

export const MODEL_DELETION = 'Model Deletion';

export const SOLUTION_CREATION = 'Solution Creation';

export const SOLUTION_DELETION = 'Solution Deletion';

export const MODEL_ATTACHMENT = 'Model Attachment';

export const MODEL_CREATION_PAYMENT = 'Model Creation Payment';

export const REGISTER_OPERATION = 'Operator Registration';

export const SAVE_REGISTER_OPERATION = 'Operator Registration Save';

export const CANCEL_OPERATION = 'Operator Cancellation';

export const MODEL_FEE_UPDATE = 'Model Fee Update';

export const MODEL_FEE_PAYMENT = 'Model Fee Payment';

export const MODEL_FEE_PAYMENT_SAVE = 'Model Fee Payment Save';

export const INFERENCE_REQUEST = 'Inference Request';

export const INFERENCE_PAYMENT = 'Inference Payment';

export const INFERENCE_RESPONSE = 'Inference Response';

export const INFERENCE_PAYMENT_DISTRIBUTION = 'Fee Redistribution';

export const CONVERSATION_START = 'Conversation Start';

export const UP_VOTE = 'Up Vote';

export const DOWN_VOTE = 'Down Vote';

export const VOTE_FOR_MODEL = 'Vote For Model';

export const VOTE_FOR_OPERATOR = 'Vote For Operator';

// Attachment Roles
export const AVATAR_ATTACHMENT = 'avatar';

export const NOTES_ATTACHMENT = 'notes';

export const USER_FEEDBACK = 'Marketplace User Rating Feedback';

export const TERMS_AGREEMENT = 'Terms Agreement';

export const TERMS_VERSION = '0.1';

// misc

export const DEV_ARWEAVE_URL = 'https://arweave.dev';
export const NET_ARWEAVE_URL = 'https://arweave.net';

export const N_PREVIOUS_BLOCKS = 7;
export const MIN_CONFIRMATIONS = 7;

export const DEFAULT_TAGS = [
  { name: TAG_NAMES.protocolName, values: [OLD_PROTOCOL_NAME] },
  { name: TAG_NAMES.protocolVersion, values: [OLD_PROTOCOL_VERSION] },
];

// add smartWeaveContract tags so atomic tokens can be picked up
export const DEFAULT_TAGS_FOR_ASSETS = [
  ...DEFAULT_TAGS,
  { name: TAG_NAMES.appName, values: ['SmartWeaveContract'] },
  { name: TAG_NAMES.appVersion, values: ['0.3.0'] },
];

export const GITHUB_LINK = 'https://github.com/FAIR-Protocol/decentralized-inference';
export const DISCORD_LINK = 'https://discord.gg/GRf7CukfXf';
export const WHITEPAPER_LINK =
  'https://lqcpjipmt2d2daazjknargowboxuhn3wgealzbqdsjmwxbgli52q.arweave.net/XAT0oeyeh6GAGUqaCJnWC69Dt3YxALyGA5JZa4TLR3U';
export const TWITTER_LINK = 'https://twitter.com/fairAIprotocol';
export const STUDIO_LINK = 'https://fairstudio.ar-io.dev/';

export const secondInMS = 1000;
export const defaultDecimalPlaces = 4;
export const successStatusCode = 200;
export const textContentType = 'text/plain';

export const modelPaymentInputStr = JSON.stringify({
  function: 'transfer',
  target: VAULT_ADDRESS,
  qty: (parseFloat(MARKETPLACE_FEE) * U_DIVIDER).toString(),
});

export const modelPaymentInputNumber = JSON.stringify({
  function: 'transfer',
  target: VAULT_ADDRESS,
  qty: parseFloat(MARKETPLACE_FEE) * U_DIVIDER,
});

export const operatorPaymentInputStr = JSON.stringify({
  function: 'transfer',
  target: VAULT_ADDRESS,
  qty: (parseFloat(OPERATOR_REGISTRATION_AR_FEE) * U_DIVIDER).toString(),
});

export const operatorPaymentInputNumber = JSON.stringify({
  function: 'transfer',
  target: VAULT_ADDRESS,
  qty: parseFloat(OPERATOR_REGISTRATION_AR_FEE) * U_DIVIDER,
});

export const MODEL_CREATION_PAYMENT_TAGS = [
  { name: TAG_NAMES.operationName, values: [MODEL_CREATION_PAYMENT] },
  { name: TAG_NAMES.contract, values: [U_CONTRACT_ID] },
  { name: TAG_NAMES.input, values: [modelPaymentInputStr, modelPaymentInputNumber] },
];

export const OPERATOR_REGISTRATION_PAYMENT_TAGS = [
  { name: TAG_NAMES.operationName, values: [REGISTER_OPERATION] },
  { name: TAG_NAMES.contract, values: [U_CONTRACT_ID] },
  { name: TAG_NAMES.input, values: [operatorPaymentInputStr, operatorPaymentInputNumber] },
];

const kb = 1024;
const maxKb = 100;

export const MAX_MESSAGE_SIZE = kb * maxKb;

export const BAZAR_ASSETS_LINK = 'https://bazar.ar-io.dev/#/asset/';
export const RAREWEAVE_ASSET_LIST_LINK = 'https://rareweave.store/nft';

export const CREATE_WALLET_LINK = 'https://docs.arweave.org/info/wallets/arweave-wallet';
export const BUY_USDC_LINK = 'https://www.kraken.com/learn/buy-usdc-usdc';
export const BUY_ARB_LINK = 'https://www.kraken.com/learn/buy-arbitrum-arb';

export const IRYS_TXS_EXPLORER = 'https://explorer.irys.xyz/transactions';
export const WARP_ASSETS_EXPLORER = 'https://sonar.warp.cc/#/app/contract';
export const VIEWBLOCK_TXS_EXPLORER = 'https://viewblock.io/arweave/tx';

export const MIN_U_BALANCE = 1;
