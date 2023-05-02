import { WebBundlr } from 'bundlr-custom';
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
import { FundResponse, UploadResponse } from 'bundlr-custom/build/common/types';
import { ChunkError, ChunkInfo } from '@/interfaces/bundlr';
import { AxiosResponse } from 'axios';

export type bundlrNodeUrl =
  | typeof DEV_BUNDLR_URL
  | typeof NODE1_BUNDLR_URL
  | typeof NODE2_BUNDLR_URL;
type BundlrChangeNodeAction = { type: 'node_changed'; bundlr: WebBundlr };

type BundlrUpdateBalanceAction = { type: 'update_balance'; balance: number };
type BundlrUpdateLoadingAction = { type: 'update_loading'; isLoading: boolean };
type BundlrAction = BundlrChangeNodeAction | BundlrUpdateBalanceAction | BundlrUpdateLoadingAction;

interface BundlrContext {
  bundlr?: WebBundlr;
  nodeBalance: number;
  isLoading: boolean;
  changeNode: (value: bundlrNodeUrl) => Promise<void>;
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

const createActions = (dispatch: Dispatch<BundlrAction>, bundlr?: WebBundlr) => {
  return {
    changeNode: async (value: bundlrNodeUrl) => asyncChangeNode(dispatch, value),
    updateBalance: async () => asyncUpdateBalance(dispatch, bundlr),
    updateLoading: (isLoading: boolean) => dispatch({ type: 'update_loading', isLoading }),
  };
};

const asyncChangeNode = async (dispatch: Dispatch<BundlrAction>, node: bundlrNodeUrl) => {
  if (!window.arweaveWallet) return;
  const bundlr = new WebBundlr(node, 'arweave', window.arweaveWallet);
  try {
    await bundlr.ready();
    dispatch({ type: 'node_changed', bundlr });
    await asyncUpdateBalance(dispatch, bundlr);
  } catch (error) {
    console.log(error);
  }
};

const asyncUpdateBalance = async (dispatch: Dispatch<BundlrAction>, bundlr?: WebBundlr) => {
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
  state: { bundlr?: WebBundlr; nodeBalance: number; isLoading: boolean },
  action?: BundlrAction,
) => {
  if (!action) return state;
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
  bundlr: undefined,
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
    bundlr: undefined,
    nodeBalance: 0,
    isLoading: false,
  });
  const actions = useMemo(() => createActions(dispatch, state.bundlr), [state.bundlr]);

  const walletState = useContext(WalletContext);

  useEffect(() => {
    const addressChanged = async () => {
      actions.updateLoading(true);
      await actions.changeNode(NODE1_BUNDLR_URL);
    };
    if (walletState.currentAddress) addressChanged();
  }, [walletState.currentAddress]);

  const retryConnection = async () => await state.bundlr?.ready();

  const getPrice = async (bytes: number, currency?: string) => {
    if (state.bundlr) {
      return currency
        ? await state.bundlr.utils.getPrice(currency, bytes)
        : await state.bundlr.getPrice(bytes);
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
