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

import {
  APP_NAME,
  APP_VERSION,
  AVATAR_ATTACHMENT,
  MODEL_ATTACHMENT,
  NET_ARWEAVE_URL,
  NOTES_ATTACHMENT,
  TAG_NAMES,
  defaultDecimalPlaces,
  secondInMS,
  successStatusCode,
} from '@/constants';
import { IContractEdge, IEdge, ITag, ITransactions } from '@/interfaces/arweave';
import { ChunkError, ChunkInfo } from '@/interfaces/bundlr';
import { AxiosResponse } from 'axios';
import BigNumber from 'bignumber.js';
import { UploadResponse } from 'bundlr-custom/build/cjs/common/types';
import { EnqueueSnackbar } from 'notistack';

export const formatNumbers = (value: string) => {
  try {
    return parseFloat(value).toFixed(defaultDecimalPlaces);
  } catch (error) {
    return '0';
  }
};

export const genLoadingArray = (numElements: number) =>
  Array.from({ length: numElements }, (_, index) => index);

type tagName = keyof typeof TAG_NAMES;
export const findTag = (tx: IEdge | IContractEdge, tagName: tagName) =>
  tx.node.tags.find((tag) => tag.name === TAG_NAMES[tagName])?.value;

export const findTagsWithKeyword = (
  tx: IEdge | IContractEdge,
  tagNames: string[],
  searchKeyword: string,
): boolean =>
  tx.node.tags.some(
    (tag) =>
      tagNames.includes(tag.name) &&
      tag.value.toLowerCase()?.includes(searchKeyword.toLowerCase().trim()),
  );

interface QueryContent {
  transactions: ITransactions;
}

export const commonUpdateQuery = (
  prev: QueryContent,
  { fetchMoreResult }: { fetchMoreResult: QueryContent },
) => {
  if (!fetchMoreResult) {
    return prev;
  }
  const newData: IEdge[] = fetchMoreResult.transactions.edges;
  newData.sort((a: IEdge, b: IEdge) => {
    const aTimestamp =
      parseInt(findTag(a, 'unixTime') ?? '', 10) ??
      a.node.block?.timestamp ??
      Date.now() / secondInMS;
    const bTimestamp =
      parseInt(findTag(b, 'unixTime') ?? '', 10) ??
      b.node.block?.timestamp ??
      Date.now() / secondInMS;

    return aTimestamp - bTimestamp;
  });

  const merged: IEdge[] = prev?.transactions?.edges ? prev.transactions.edges.slice(0) : [];
  for (const i of newData) {
    if (!merged.find((el: IEdge) => el.node.id === i.node.id)) {
      merged.push(i);
    }
  }

  return Object.assign({}, prev, {
    transactions: {
      edges: merged,
      pageInfo: fetchMoreResult.transactions.pageInfo,
    },
  });
};

export const printSize = (args: File | number) => {
  let size;
  if (typeof args === 'number') {
    size = args;
  } else {
    size = args.size;
  }

  const kb = 1024;
  const mbElevation = 2;
  const mb = Math.pow(kb, mbElevation);
  const gbElevation = 3;
  const gb = Math.pow(kb, gbElevation);
  const divider = 100;

  if (size < kb) {
    return `${size} bytes`;
  } else if (size < mb) {
    const kbSize = size / kb;
    return `${Math.round((kbSize + Number.EPSILON) * divider) / divider} KB`;
  } else if (size < gb) {
    const mbSize = size / mb;
    return `${Math.round((mbSize + Number.EPSILON) * divider) / divider} MB`;
  } else {
    const gbSize = size / gb;
    return `${Math.round((gbSize + Number.EPSILON) * divider) / divider} GB`;
  }
};

export const download = (name: string, txid: string) => {
  const a = document.createElement('a');
  a.href = `${NET_ARWEAVE_URL}/${txid}`;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const parseUnixTimestamp = (timestamp: number | string) => {
  if (typeof timestamp === 'string') {
    return new Date(parseFloat(timestamp) * secondInMS).toLocaleString();
  } else {
    return new Date(timestamp * secondInMS).toLocaleString();
  }
};

const start = 0;
const firstSliceEnd = 6;
const secondSliceStart = -2;

export const displayShortTxOrAddr = (addrOrTx: string) =>
  `${addrOrTx.slice(start, firstSliceEnd)}...${addrOrTx.slice(secondSliceStart)}`;

export const bundlrUpload = async ({
  fileToUpload,
  tags,
  nodeBalance,
  totalChunks,
  successMessage,
  chunkUpload,
  enqueueSnackbar,
  setSnackbarOpen,
  setProgress,
  showSuccessSnackbar,
  getPrice,
}: {
  fileToUpload: File;
  tags: ITag[];
  nodeBalance: number;
  totalChunks: React.MutableRefObject<number>;
  successMessage: string;
  chunkUpload: (
    file: File,
    tags: ITag[],
    totalChunks: React.MutableRefObject<number>,
    handleUpload: (value: ChunkInfo) => void,
    handleError: (e: ChunkError) => void,
    handleDone: (value: unknown) => void,
  ) => Promise<AxiosResponse<UploadResponse, unknown>>;
  enqueueSnackbar: EnqueueSnackbar;
  setSnackbarOpen: (open: boolean) => void;
  setProgress: (progress: number) => void;
  showSuccessSnackbar: (id: string, message: string) => void;
  getPrice: (size: number) => Promise<BigNumber>;
}) => {
  const filePrice = await getPrice(fileToUpload.size);
  if (filePrice.toNumber() > nodeBalance) {
    enqueueSnackbar('Not Enought Balance in Bundlr Node', { variant: 'error' });
  }
  const finishedPercentage = 100;

  /** Register Event Callbacks */
  // event callback: called for every chunk uploaded
  const handleUpload = (chunkInfo: ChunkInfo) => {
    const chunkNumber = chunkInfo.id + 1;
    // update the progress bar based on how much has been uploaded
    if (chunkNumber >= totalChunks.current) {
      setProgress(finishedPercentage);
    } else {
      setProgress((chunkNumber / totalChunks.current) * finishedPercentage);
    }
  };

  // event callback: called if an error happens
  const handleError = (e: ChunkError) => {
    setSnackbarOpen(false);
    enqueueSnackbar(
      `Error uploading chunk number ${e.id} - ${(e.res as { statusText: string }).statusText}`,
      { variant: 'error' },
    );
  };

  // event callback: called when file is fully uploaded
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDone = (_finishRes: unknown) => {
    // set the progress bar to 100
    setProgress(finishedPercentage);
    setSnackbarOpen(false);
  };

  const res = await chunkUpload(
    fileToUpload,
    tags,
    totalChunks,
    handleUpload,
    handleError,
    handleDone,
  );
  if (res.status === successStatusCode) {
    showSuccessSnackbar(res.data.id, successMessage);
  } else {
    throw new Error(res.statusText);
  }

  return res;
};

export const uploadAvatarImage = async (
  refTx: string,
  extraProps: {
    nodeBalance: number;
    totalChunks: React.MutableRefObject<number>;
    chunkUpload: (
      file: File,
      tags: ITag[],
      totalChunks: React.MutableRefObject<number>,
      handleUpload: (value: ChunkInfo) => void,
      handleError: (e: ChunkError) => void,
      handleDone: (value: unknown) => void,
    ) => Promise<AxiosResponse<UploadResponse, unknown>>;
    enqueueSnackbar: EnqueueSnackbar;
    setSnackbarOpen: (open: boolean) => void;
    setProgress: (progress: number) => void;
    getPrice: (size: number) => Promise<BigNumber>;
    showSuccessSnackbar: (id: string, message: string) => void;
  },
  imageFor: 'script' | 'model',
  image?: File,
) => {
  if (!image || !(image instanceof File)) {
    return;
  }

  // upload the file
  const tags = [];
  tags.push({ name: TAG_NAMES.appName, value: APP_NAME });
  tags.push({ name: TAG_NAMES.appVersion, value: APP_VERSION });
  tags.push({ name: TAG_NAMES.contentType, value: image.type });
  tags.push({ name: TAG_NAMES.operationName, value: MODEL_ATTACHMENT });
  tags.push({ name: TAG_NAMES.attachmentName, value: image.name });
  tags.push({ name: TAG_NAMES.attachmentRole, value: AVATAR_ATTACHMENT });
  tags.push({ name: TAG_NAMES.unixTime, value: (Date.now() / secondInMS).toString() });
  if (imageFor === 'script') {
    tags.push({ name: TAG_NAMES.scriptTransaction, value: refTx });
  } else if (imageFor === 'model') {
    tags.push({ name: TAG_NAMES.modelTransaction, value: refTx });
  } else {
    throw new Error('Can only Upload Attachments for Models or Scripts');
  }
  extraProps.setSnackbarOpen(true);

  await bundlrUpload({
    ...extraProps,
    tags,
    showSuccessSnackbar: extraProps.showSuccessSnackbar,
    fileToUpload: image,
    successMessage: 'Avatar Uploaded Successfully.',
  });
};

export const uploadUsageNotes = async (
  refTx: string,
  refName: string,
  usageNotes: string,
  extraProps: {
    nodeBalance: number;
    totalChunks: React.MutableRefObject<number>;
    chunkUpload: (
      file: File,
      tags: ITag[],
      totalChunks: React.MutableRefObject<number>,
      handleUpload: (value: ChunkInfo) => void,
      handleError: (e: ChunkError) => void,
      handleDone: (value: unknown) => void,
    ) => Promise<AxiosResponse<UploadResponse, unknown>>;
    enqueueSnackbar: EnqueueSnackbar;
    setSnackbarOpen: (open: boolean) => void;
    setProgress: (progress: number) => void;
    getPrice: (size: number) => Promise<BigNumber>;
    showSuccessSnackbar: (id: string, message: string) => void;
  },
  notesFor: 'script' | 'model',
) => {
  const file = new File([usageNotes], `${refName}-usage.md`, {
    type: 'text/markdown',
  });

  // upload the file
  const tags = [];
  tags.push({ name: TAG_NAMES.appName, value: APP_NAME });
  tags.push({ name: TAG_NAMES.appVersion, value: APP_VERSION });
  tags.push({ name: TAG_NAMES.contentType, value: file.type });
  tags.push({ name: TAG_NAMES.operationName, value: MODEL_ATTACHMENT });
  tags.push({ name: TAG_NAMES.attachmentName, value: file.name });
  tags.push({ name: TAG_NAMES.attachmentRole, value: NOTES_ATTACHMENT });
  tags.push({ name: TAG_NAMES.unixTime, value: (Date.now() / secondInMS).toString() });
  extraProps.setSnackbarOpen(true);
  if (notesFor === 'script') {
    tags.push({ name: TAG_NAMES.scriptTransaction, value: refTx });
  } else if (notesFor === 'model') {
    tags.push({ name: TAG_NAMES.modelTransaction, value: refTx });
  } else {
    throw new Error('Can only Upload Attachments for Models or Scripts');
  }

  await bundlrUpload({
    ...extraProps,
    tags,
    showSuccessSnackbar: extraProps.showSuccessSnackbar,
    fileToUpload: file,
    successMessage: 'Usage Notes Uploaded Successfully',
  });
};
