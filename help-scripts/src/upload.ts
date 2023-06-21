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

import { JWKInterface } from "arweave/node/lib/wallet";
import fs from 'node:fs';
import path from 'node:path';
import Arweave from 'arweave';
import Pino from 'pino';
import Bundlr from "@bundlr-network/client";

interface ITag {
  name: string;
  value: string;
};

interface ChunkInfo {
  id: number;
  offset: number;
  size: number;
  totalUploaded: number;
};

interface ChunkError {
  id: number;
  offset: number;
  size: number;
  res: unknown;
};

const logger = Pino({
  name: 'kandinsky',
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
const bundlr = new Bundlr('https://node1.bundlr.network', 'arweave', JWK);

const nMandatoryArgs = 6;
const mb = 1024;
const elevation = 2
const nMB = 25;
const secondInMS = 1000;

(async () => {
  try {
    if (process.argv.length < nMandatoryArgs) {
      logger.error('Please provide a path to an image file, a model transaction ID, either "avatar" or "notes", and "forModel" or "forScript". arguments must be provided in this order');
      process.exit(1);
    }

    const [ ,, filePath, txid, attachmentRole, attachmentFor ] = process.argv;

    if (attachmentRole !== 'avatar' && attachmentRole !== 'notes') {
      logger.error('Attachment Role must be either "avatar" or "notes"');
      process.exit(1);
    }

    if (attachmentFor !== 'forModel' && attachmentFor !== 'forScript') {
      logger.error('Attachment For must be either "forModel" or "forScript"');
      process.exit(1);
    }
    
    const file = fs.readFileSync(filePath);
    if (!file) {
      logger.error(`Could not read file at path ${filePath}`);
      process.exit(1);
    }
    const extName = path.extname(filePath);
    const fileName = path.basename(filePath);

    const uploader = bundlr.uploader.chunkedUploader;
   
    const chunkSize = nMB * Math.pow(mb, elevation); // default is
    const totalChunks = Math.ceil(file.byteLength / chunkSize);

    /** Register Event Callbacks */
    // event callback: called for every chunk uploaded
    const handleUpload = (chunkInfo: ChunkInfo) => {
      const chunkNumber = chunkInfo.id + 1;
      // update the progress bar based on how much has been uploaded
      logger.info(`Uploaded chunk ${chunkNumber} of ${totalChunks}`);
    };

    // event callback: called if an error happens
    const handleError = (e: ChunkError) => {
      logger.error(`Error uploading chunk ${e.id} of ${totalChunks}`);
      logger.error(e.res);
    };

    // event callback: called when file is fully uploaded
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleDone = (_finishRes: unknown) => {
      logger.info('File upload complete');
    };

    uploader.on('chunkUpload', handleUpload);
    // event callback: called if an error happens
    uploader.on('chunkError', handleError);
    // event callback: called when file is fully uploaded
    uploader.on('done', handleDone);

    const tags: ITag[] = [];
    tags.push({ name: 'App-Name', value: 'Fair Protocol' });
    tags.push({ name: 'App-Version', value: '0.1' });
    tags.push({ name: 'Content-Type', value: extName });
    tags.push({ name: attachmentFor === 'forModel' ? 'Model-Transaction' : 'Script-Transaction', value: txid });
    tags.push({ name: 'Operation-Name', value: 'Model Attachment' });
    tags.push({ name: 'Attachment-Name', value: fileName });
    tags.push({ name: 'Attachment-Role', value: attachmentRole });
    tags.push({ name: 'Unix-Time', value: (Date.now() / secondInMS).toString() });

    // upload the file
    const res = await uploader.uploadData(file, { tags });
    logger.info(`Uploaded image to Arweave. Transaction ID: ${res.data.id}`);
    logger.info(`Arweave response: ${res.status} ${res.statusText}`);
  } catch (error) {
    logger.error(error);
  }
})();