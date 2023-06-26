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
  createContext,
  Dispatch,
  MutableRefObject,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { DEV_BUNDLR_URL, NODE1_BUNDLR_URL, NODE2_BUNDLR_URL } from '@/constants';
import { WalletContext } from './wallet';
import { ITag } from '@/interfaces/arweave';
import fileReaderStream from 'filereader-stream';
import BigNumber from 'bignumber.js';
import { ChunkError, ChunkInfo } from '@/interfaces/bundlr';
import { AxiosResponse } from 'axios';
import arweave, { wallet } from '@/utils/arweave';
import { WebBundlr } from 'bundlr-custom';
import { FundResponse, UploadResponse } from 'bundlr-custom/build/cjs/common/types';

export type bundlrNodeUrl =
  | typeof DEV_BUNDLR_URL
  | typeof NODE1_BUNDLR_URL
  | typeof NODE2_BUNDLR_URL;
type BundlrChangeNodeAction = { type: 'node_changed'; bundlr: WebBundlr };

type BundlrUpdateBalanceAction = { type: 'update_balance'; balance: number };
type BundlrUpdateLoadingAction = { type: 'update_loading'; isLoading: boolean };
type BundlrAction = BundlrChangeNodeAction | BundlrUpdateBalanceAction | BundlrUpdateLoadingAction;

interface BundlrContext {
  bundlr: WebBundlr | null;
  nodeBalance: number;
  isLoading: boolean;
  changeNode: (
    value: bundlrNodeUrl,
    walletInstance: typeof wallet.namespaces.arweaveWallet | typeof window.arweaveWallet,
  ) => Promise<void>;
  updateBalance: () => Promise<void>;
  fundNode: (value: string) => Promise<FundResponse>;
  retryConnection: () => Promise<void>;
  getPrice: (bytes: number, currency?: string) => Promise<BigNumber>;
  upload: (data: string, tags: ITag[]) => Promise<UploadResponse>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chunkUpload: (
    file: File,
    tags: ITag[],
    totalChunks: MutableRefObject<number>,
    handleUpload: (value: ChunkInfo) => void,
    handleError: (e: ChunkError) => void,
    handleDone: (value: unknown) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => Promise<AxiosResponse<UploadResponse, any>>;
}

const createActions = (dispatch: Dispatch<BundlrAction>, bundlr: WebBundlr | null) => {
  return {
    changeNode: async (
      value: bundlrNodeUrl,
      walletInstance: typeof wallet.namespaces.arweaveWallet | typeof window.arweaveWallet,
    ) => asyncChangeNode(dispatch, value, walletInstance),
    updateBalance: async () => asyncUpdateBalance(dispatch, bundlr),
    updateLoading: (isLoading: boolean) => dispatch({ type: 'update_loading', isLoading }),
  };
};

const asyncChangeNode = async (
  dispatch: Dispatch<BundlrAction>,
  node: bundlrNodeUrl,
  walletInstance: typeof wallet.namespaces.arweaveWallet | typeof window.arweaveWallet,
) => {
  if (!walletInstance) {
    return;
  }
  const bundlr = new WebBundlr(node, 'arweave', walletInstance, { providerInstance: arweave });
  try {
    await bundlr.ready();
    dispatch({ type: 'node_changed', bundlr });
    await asyncUpdateBalance(dispatch, bundlr);
  } catch (error) {
    console.log(error);
  }
};

const asyncUpdateBalance = async (dispatch: Dispatch<BundlrAction>, bundlr: WebBundlr | null) => {
  if (!bundlr) {
    dispatch({ type: 'update_balance', balance: 0 });
    dispatch({ type: 'update_loading', isLoading: false });
    return;
  }

  try {
    const balance = await bundlr.getLoadedBalance();
    const numberBalance = balance.toNumber();
    dispatch({ type: 'update_balance', balance: numberBalance });
  } catch (error) {
    dispatch({ type: 'update_balance', balance: 0 });
  }
  dispatch({ type: 'update_loading', isLoading: false });
};

const bundlrReducer = (
  state: { bundlr: WebBundlr | null; nodeBalance: number; isLoading: boolean },
  action?: BundlrAction,
) => {
  if (!action) {
    return state;
  }

  switch (action.type) {
    case 'node_changed':
      // eslint-disable-next-line no-case-declarations
      return {
        ...state,
        bundlr: action.bundlr,
      };
    case 'update_balance':
      return {
        ...state,
        nodeBalance: action.balance,
      };
    case 'update_loading':
      return {
        ...state,
        isLoading: action.isLoading,
      };
    default:
      return state;
  }
};

export const BundlrContext = createContext<BundlrContext>({
  bundlr: null,
  nodeBalance: 0,
  isLoading: false,
  retryConnection: async () => new Promise(() => null),
  getPrice: async () => new Promise(() => null),
  upload: async () => new Promise(() => null),
  chunkUpload: async () => new Promise(() => null),
  changeNode: async () => new Promise(() => null),
  updateBalance: async () => new Promise(() => null),
  fundNode: async () => new Promise(() => null),
});

export const BundlrProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(bundlrReducer, {
    bundlr: null,
    nodeBalance: 0,
    isLoading: false,
  });
  const { currentAddress, walletInstance } = useContext(WalletContext);
  const actions = useMemo(
    () => createActions(dispatch, state.bundlr),
    [state.bundlr, currentAddress, walletInstance],
  );

  useEffect(() => {
    if (currentAddress) {
      (async () => {
        actions.updateLoading(true);
        await actions.changeNode(NODE1_BUNDLR_URL, walletInstance);
      })();
    }
  }, [currentAddress, walletInstance]);

  const retryConnection = async () => state.bundlr?.ready();

  const getPrice = async (bytes: number, currency?: string) => {
    if (state.bundlr) {
      return currency ? state.bundlr.utils.getPrice(currency, bytes) : state.bundlr.getPrice(bytes);
    } else {
      return new BigNumber(0);
    }
  };

  const upload = async (data: string, tags: ITag[]) => {
    if (!state.bundlr) throw new Error('Bundlr not Initialized');
    return state.bundlr.upload(data, { tags });
  };

  const chunkUpload = async (
    file: File,
    tags: ITag[],
    totalChunks: MutableRefObject<number>,
    handleUpload: (value: ChunkInfo) => void,
    handleError: (e: ChunkError) => void,
    handleDone: (value: unknown) => void,
  ) => {
    if (!state.bundlr) throw new Error('Bundlr not Initialized');

    const uploader = state.bundlr.uploader.chunkedUploader;
    const chunkSize = 25 * (1024 * 1024); // default is

    // divide the total file size by the size of each chunk we'll upload
    if (file.size < chunkSize) totalChunks.current = 1;
    else {
      totalChunks.current = Math.floor(file.size / chunkSize);
    }
    /** Register Event Callbacks */
    // event callback: called for every chunk uploaded
    uploader.on('chunkUpload', handleUpload);
    // event callback: called if an error happens
    uploader.on('chunkError', handleError);
    // event callback: called when file is fully uploaded
    uploader.on('done', handleDone);
    // upload the file
    const readableStream = fileReaderStream(file);
    return uploader.uploadData(readableStream, { tags });
  };

  const fundNode = (value: string) => {
    if (!state.bundlr) throw new Error('Bundlr not Initialized');

    return state.bundlr.fund(value);
  };

  const value = useMemo(
    () => ({ ...state, ...actions, retryConnection, getPrice, upload, chunkUpload, fundNode }),
    [state, actions],
  );

  return <BundlrContext.Provider value={value}>{children}</BundlrContext.Provider>;
};
