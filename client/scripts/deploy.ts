

import Bundlr from 'bundlr-custom';
import fs from 'fs';

const main = async () => {
  const wallet = './wallet.json';

  const jwk = JSON.parse(fs.readFileSync(wallet).toString());
  
  // NOTE: Depending on the version of JavaScript you use, you may need to use
  // the commented out line below to create a new Bundlr object.
  // const bundlr = new Bundlr("http://node1.bundlr.network", "arweave", jwk);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bundlr = new (Bundlr as any).default('http://node1.bundlr.network', 'arweave', jwk );
  
  // Get loaded balance in atomic units
  const atomicBalance = await bundlr.getLoadedBalance();
  console.log(`node balance (atomic units) = ${atomicBalance}`);
  
  // Convert balance to an easier to read format
  const convertedBalance = bundlr.utils.unitConverter(atomicBalance);
  console.log(`node balance (converted) = ${convertedBalance}`);
  
  // Print your wallet address
  console.log(`wallet address = ${bundlr.address}`);
  const dist = './dist/';
  const response = await bundlr.uploadFolder(dist, {
    indexFile: './dist/index.html', // optional index file (file the user will load when accessing the manifest)
    batchSize: 50, // number of items to upload at once
    keepDeleted: false   // whether to keep now deleted items from previous uploads
  }); // returns the manifest ID

  console.log(`SPA Uploaded https://arweave.net/${response?.id}`);
};

(async () => await main())();