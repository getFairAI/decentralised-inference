import Arweave from "arweave";
import { JWKInterface } from "arweave/node/lib/wallet";
import Pino from 'pino';
import fs from 'node:fs';
import NodeBundlr from "@bundlr-network/client";

const MARKETPLACE_ADDRESS = 'RQFarhgXPXYkgRM0Lzv088MllseKQWEdnEiRUggteIo';
const ATOMIC_TOKEN_CONTRACT_ID = 'h9v17KHV4SXwdW2-JHU6a23f6R0YtbXZJJht8LfP8QM'; 
const NODE2_BUNDLR_URL = 'https://node2.bundlr.network/';
const UDL_ID = 'yRj4a5KMctX_uOmKWCFJIjmY8DeJcusVk6-HzLiM_t8';

const logger = Pino({
  name: 'Create Collection',
  level: 'debug',
});

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

const JWK: JWKInterface = JSON.parse(fs.readFileSync('wallet-marketplace.json').toString());

const bundlr = new NodeBundlr(NODE2_BUNDLR_URL, 'arweave', JWK);

const collectionName = ''; // set collection name
const bannerTxID = '';
const thumbnailTxID = '';
const codeTxID = '';

const items = [
  '', // image txids
];

(async () => {

  const wallet = await arweave.wallets.jwkToAddress(JWK);
  logger.info(`Loaded Wallet: ${wallet}`);
  // currently only marketplace address can fake delete scripts
  if (wallet !== MARKETPLACE_ADDRESS) {
    throw new Error('Loaded Wallet is not Marketplace address');
  }
  const tags = [
    { name: 'Content-Type', value: 'application/json' },
    { name: 'Name', value: collectionName },
    { name: 'Data-Protocol', value: 'Collection' },
    { name: 'App-Name', value: 'SmartWeaveContract' },
    { name: 'App-Version', value: '0.3.0' },
    { name: 'Contract-Src', value: ATOMIC_TOKEN_CONTRACT_ID },
    {
      name: 'Init-State',
      value: JSON.stringify({
        firstOwner: MARKETPLACE_ADDRESS,
        canEvolve: false,
        balances: {
          [MARKETPLACE_ADDRESS]: 1,
        },
        name: 'Fair Protocol Collection',
        ticker: 'FPC',
      }),
    },
    { name: 'Title', value: 'Fair Protocol Collection' },
    { name: 'Description', value: 'Fair Protocol Collection' },
    { name: 'Type', value: 'Document' },
    { name: 'License', value: UDL_ID },
    { name: 'Commercial-Use', value: 'Allowed' },
    { name: 'Banner', value: bannerTxID },
    { name: 'Thumbnail', value: thumbnailTxID },
    { name: 'Collection-Code', value: codeTxID },
    { name: 'Creator', value: MARKETPLACE_ADDRESS }
  ]

  const result = await bundlr.upload(JSON.stringify({ type: 'Collection', items: items }), { tags })

  return result.id;
})();