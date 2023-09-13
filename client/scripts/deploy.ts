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

import Bundlr from 'bundlr-custom/build/esm/node/index';
import fs from 'fs';

const main = async () => {

  if (!fs.existsSync('./wallet.json')) {
    console.log('No wallet file found, please add a wallet.json file to the root of the project');
    return;
  }
  const wallet = './wallet.json';

  const jwk = JSON.parse(fs.readFileSync(wallet).toString());
  
  // NOTE: Depending on the version of JavaScript you use, you may need to use
  // the commented out line below to create a new Bundlr object.
  // const bundlr = new Bundlr("http://node1.bundlr.network", "arweave", jwk);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bundlr = new Bundlr('https://node1.bundlr.network', 'arweave', jwk );
  
  // Get loaded balance in atomic units
  const atomicBalance = await bundlr.getLoadedBalance();
  console.log(`node balance (atomic units) = ${atomicBalance}`);
  
  // Convert balance to an easier to read format
  const convertedBalance = bundlr.utils.unitConverter(atomicBalance);
  console.log(`node balance (converted) = ${convertedBalance}`);
  
  // Print your wallet address
  console.log(`wallet address = ${bundlr.address}`);
  const dist = './dist/';

  try {
    if (fs.existsSync('dist-id.txt')) {
      fs.rmSync('dist-id.txt');
    }
    if (fs.existsSync('dist-manifest.csv')) {
      fs.rmSync('dist-manifest.csv');
    }
    if (fs.existsSync('dist-manifest.json')) {
      fs.rmSync('dist-manifest.json');
    }
  } catch (error) {
    // files not found skip
    console.log('No previous deploy files found, skipping');
  }
  console.log('uploading');

  const response = await bundlr.uploadFolder(dist, {
    indexFile: 'index.html', // optional index file (file the user will load when accessing the manifest)
    batchSize: 50, // number of items to upload at once,
    keepDeleted: false, // keep deleted files in the manifest
    logFunction: async (log: string) => console.log(log), // optional function to handle logs
  }); // returns the manifest ID

  console.log(`SPA Uploaded https://arweave.net/${response?.id}`);
};

(async () => await main())();