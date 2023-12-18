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

import { createContext, Dispatch, ReactNode, useEffect, useMemo, useReducer, useRef } from 'react';
import { PermissionType, DispatchResult as ArConnectDispatchResult } from 'arconnect';
import arweave, { wallet } from '@/utils/arweave';
import _ from 'lodash';
import { isVouched } from '@/utils/vouch';
import { DispatchResult } from 'arweave-wallet-connector/lib/Arweave';
import Transaction from 'arweave/web/lib/transaction';
import { warp, connectToU, getUBalance, parseUBalance } from '@/utils/u';
import { connectToUCM } from '@/utils/ucm';
import FairSDKWeb from '@fair-protocol/sdk/web';
import StampJS, { StampJS as StampInstance, CountResult } from '@permaweb/stampjs';

interface StampsCount {
  [txid: string]: CountResult;
}
const arweaveApp = 'arweave.app';
const arConnect = 'arconnect';

const DEFAULT_PERMISSSIONS: PermissionType[] = [
  'ACCESS_PUBLIC_KEY',
  'SIGNATURE',
  'ACCESS_ADDRESS',
  'ACCESS_ALL_ADDRESSES',
  'SIGN_TRANSACTION',
  'DISPATCH',
];
type ArConnectAvailableAction = { type: 'arconnect_available' };
type WalletDisconnectAction = { type: 'wallet_disconnect' };
type WalletConnectedAction = {
  type: 'wallet_connected';
  wallet: typeof wallet.namespaces.arweaveWallet | typeof window.arweaveWallet;
};
type WalletAddressUpdatedAction = { type: 'wallet_address_updated'; address: string };
type WalletBalanceUpdatedAction = { type: 'wallet_balance_updated'; balance: number };
type WalletUBalanceUpdatedAction = { type: 'wallet_u_balance_updated'; balance: number };
type WalletPermissionsChangedAction = {
  type: 'wallet_permissions_changed';
  permissions: PermissionType[];
};
type WalletVouchedAction = { type: 'wallet_vouched'; isWalletVouched: boolean };
type StampInstanceSetAction = { type: 'stamp_instance_set'; stampInstance: StampInstance };
type WalletAction =
  | ArConnectAvailableAction
  | WalletConnectedAction
  | WalletDisconnectAction
  | WalletAddressUpdatedAction
  | WalletBalanceUpdatedAction
  | WalletUBalanceUpdatedAction
  | WalletPermissionsChangedAction
  | WalletVouchedAction
  | StampInstanceSetAction;

interface IWalletContext {
  isArConnectAvailable: boolean;
  walletInstance: typeof wallet.namespaces.arweaveWallet | typeof window.arweaveWallet;
  stampInstance: StampInstance;
  currentAddress: string;
  currentPermissions: PermissionType[];
  currentBalance: number;
  currentUBalance: number;
  isWalletVouched: boolean;
  countStamps: (txids: string[]) => Promise<StampsCount>;
  connectWallet: (walletInstance: 'arweave.app' | 'arconnect') => Promise<void>;
  updateBalance: () => Promise<void>;
  updateUBalance: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  dispatchTx: (tx: Transaction) => Promise<DispatchResult | ArConnectDispatchResult>;
}

const createActions = (dispatch: Dispatch<WalletAction>, state: IWalletContext) => {
  return {
    countStamps: async (txids: string[]) => state.stampInstance.counts(txids) as unknown as StampsCount,
    arConnectAvailable: async () => dispatch({ type: 'arconnect_available' }),
    walletDisconnect: async () => asyncDisconnectWallet(dispatch, state.walletInstance),
    arConnect: async () => asyncArConnectWallet(dispatch),
    arweaveAppConnect: async () => asyncArweaveAppConnect(dispatch),
    switchWallet: async (newAddress: string) => asyncWalletSwitch(dispatch, newAddress),
    updateBalance: async () =>
      asyncUpdateBalance(dispatch, state.currentAddress, state.currentBalance),
    updateUBalance: async () =>
      asyncUpdateUBalance(dispatch, state.currentAddress, state.currentUBalance),
  };
};

const asyncArConnectWallet = async (dispatch: Dispatch<WalletAction>) => {
  try {
    if (wallet.connected) {
      await wallet.disconnect();
    }
    const currentPermissions = await window.arweaveWallet.getPermissions();
    if (!_.isEqual(currentPermissions, DEFAULT_PERMISSSIONS)) {
      await window.arweaveWallet.connect(DEFAULT_PERMISSSIONS);
    }
    dispatch({ type: 'wallet_connected', wallet: window.arweaveWallet });
    localStorage.setItem('wallet', arConnect);
    const addr = await window.arweaveWallet.getActiveAddress();

    const winstonBalance = await arweave.wallets.getBalance(addr);
    dispatch({
      type: 'wallet_balance_updated',
      balance: parseFloat(arweave.ar.winstonToAr(winstonBalance)),
    });
    const isAddrVouched = await isVouched(addr);
    dispatch({ type: 'wallet_vouched', isWalletVouched: isAddrVouched });
    // connect wallet to contract
    connectToU();
    connectToUCM();
    await FairSDKWeb.connectWallet();
    await asyncUpdateUBalance(dispatch, addr, 0);

    // only load wallet adderss after fetching first balances
    dispatch({ type: 'wallet_address_updated', address: addr });

    const stampInstance = StampJS.init({
      warp,
      arweave,
      wallet: window.arweaveWallet,
      dre: 'https://dre-u.warp.cc/contract', 
      graphql: 'https://arweave.net/graphql' 
    });
    dispatch({ type: 'stamp_instance_set', stampInstance });
  } catch (error) {
    // manually remove arconnect overlay
    const overlays: NodeListOf<HTMLDivElement> = document.querySelectorAll(
      '.arconnect_connect_overlay_extension_temporary',
    );
    overlays.forEach((el) => el.remove());
  }
};

const asyncArweaveAppConnect = async (dispatch: Dispatch<WalletAction>) => {
  try {
    await wallet.connect();
    localStorage.setItem('wallet', arweaveApp);
    const walletInstance = wallet.namespaces.arweaveWallet;
    walletInstance.walletName = arweaveApp;
    dispatch({ type: 'wallet_connected', wallet: walletInstance });
    const addr = (await walletInstance.getActiveAddress()) as string;
    const winstonBalance = await arweave.wallets.getBalance(addr);
    dispatch({
      type: 'wallet_balance_updated',
      balance: parseFloat(arweave.ar.winstonToAr(winstonBalance)),
    });
    const isAddrVouched = await isVouched(addr);
    dispatch({ type: 'wallet_vouched', isWalletVouched: isAddrVouched });
    // connect wallet to contract
    connectToU();
    connectToUCM();
    await FairSDKWeb.connectWallet();
    await asyncUpdateUBalance(dispatch, addr, 0);

    // only load wallet adderss after fetching first balances
    dispatch({ type: 'wallet_address_updated', address: addr });

    const stampInstance = StampJS.init({
      warp,
      arweave,
      wallet: window.arweaveWallet,
      dre: 'https://dre-u.warp.cc/contract', 
      graphql: 'https://arweave.net/graphql' 
    });
    dispatch({ type: 'stamp_instance_set', stampInstance });
  } catch (error) {
    dispatch({ type: 'wallet_disconnect' });
    localStorage.removeItem('wallet');
  }
};

const asyncDisconnectWallet = async (
  dispatch: Dispatch<WalletAction>,
  walletInstance: typeof wallet.namespaces.arweaveWallet | typeof window.arweaveWallet,
) => {
  try {
    await walletInstance.disconnect();
    dispatch({ type: 'wallet_disconnect' });
    localStorage.removeItem('wallet');
  } catch (err) {
    dispatch({ type: 'wallet_disconnect' });
    localStorage.removeItem('wallet');
  }
};

const asyncWalletSwitch = async (dispatch: Dispatch<WalletAction>, newAddress: string) => {
  try {
    dispatch({ type: 'wallet_address_updated', address: newAddress });
    const winstonBalance = await arweave.wallets.getBalance(newAddress);
    dispatch({
      type: 'wallet_balance_updated',
      balance: parseFloat(arweave.ar.winstonToAr(winstonBalance)),
    });
    const isAddrVouched = await isVouched(newAddress);
    dispatch({ type: 'wallet_vouched', isWalletVouched: isAddrVouched });
  } catch (error) {
    dispatch({ type: 'wallet_disconnect' });
    localStorage.removeItem('wallet');
  }
};

const asyncUpdateBalance = async (
  dispatch: Dispatch<WalletAction>,
  addr: string,
  prevBalance: number,
) => {
  try {
    const winstonBalance = await arweave.wallets.getBalance(addr);
    const parsedBalance = parseFloat(arweave.ar.winstonToAr(winstonBalance));
    if (parsedBalance !== prevBalance) {
      dispatch({
        type: 'wallet_balance_updated',
        balance: parsedBalance,
      });
    }
  } catch (error) {
    dispatch({ type: 'wallet_disconnect' });
    localStorage.removeItem('wallet');
  }
};

const asyncUpdateUBalance = async (
  dispatch: Dispatch<WalletAction>,
  addr: string,
  prevBalance: number,
) => {
  try {
    const balance = await getUBalance(addr);
    const parsedBalance = parseUBalance(balance);
    if (parsedBalance !== prevBalance) {
      dispatch({
        type: 'wallet_u_balance_updated',
        balance: parsedBalance,
      });
    }
  } catch (error) {
    dispatch({
      type: 'wallet_u_balance_updated',
      balance: 0,
    });
  }
};

const walletReducer = (state: IWalletContext, action?: WalletAction) => {
  if (!action) {
    return state;
  }

  switch (action.type) {
    case 'wallet_connected':
      return { ...state, walletInstance: action.wallet };
    case 'arconnect_available':
      return { ...state, isArConnectAvailable: true };
    case 'wallet_address_updated':
      // eslint-disable-next-line no-case-declarations
      return { ...state, currentAddress: action.address };
    case 'wallet_balance_updated':
      return { ...state, currentBalance: action.balance };
    case 'wallet_u_balance_updated':
      return { ...state, currentUBalance: action.balance };
    case 'wallet_permissions_changed':
      return { ...state, currentPermissions: action.permissions };
    case 'wallet_disconnect': {
      return {
        ...state,
        currentAddress: '',
        currentPermissions: [],
        currentBalance: 0,
        isWalletVouched: false,
      };
    }
    case 'wallet_vouched': {
      return {
        ...state,
        isWalletVouched: action.isWalletVouched,
      };
    }
    case 'stamp_instance_set': {
      return {
        ...state,
        stampInstance: action.stampInstance,
      };
    }
    default:
      return state;
  }
};

const dispatchTx = async (tx: Transaction) => {
  if (localStorage.getItem('wallet') === arConnect && window.arweaveWallet) {
    return window.arweaveWallet.dispatch(tx);
  } else if (localStorage.getItem('wallet') === arweaveApp && wallet) {
    return wallet.dispatch(tx);
  } else {
    throw new Error('No wallet connected');
  }
};

const initialState: IWalletContext = {
  isArConnectAvailable: false,
  currentAddress: '',
  currentPermissions: [],
  currentBalance: 0,
  currentUBalance: 0,
  isWalletVouched: false,
  walletInstance: wallet.namespaces.arweaveWallet,
  stampInstance: {} as StampInstance,
  countStamps: async () => ({} as StampsCount),
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  connectWallet: async () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  updateBalance: async () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  updateUBalance: async () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  disconnectWallet: async () => {},
  dispatchTx,
};

export const WalletContext = createContext<IWalletContext>(initialState);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(walletReducer, initialState);
  const actions = createActions(dispatch, state);

  const connectWalletSubscriptionRef = useRef<boolean>(false);
  const switchWalletSubscriptionRef = useRef<boolean>(false);

  const value: IWalletContext = useMemo(
    () => ({
      ...state,
      countStamps: actions.countStamps,
      connectWallet: (walletInstance: 'arweave.app' | 'arconnect') =>
        walletInstance === arConnect ? actions.arConnect() : actions.arweaveAppConnect(),
      updateBalance: actions.updateBalance,
      updateUBalance: actions.updateUBalance,
      disconnectWallet: actions.walletDisconnect,
    }),
    [state, actions],
  );

  const walletSwitched = async (event: { detail: { address: string } }) => {
    if (localStorage.getItem('wallet') === arConnect) {
      await actions.switchWallet(event.detail.address);
    }
  };

  const arConnectLoaded = async () => {
    await actions.arConnectAvailable();
    // if default wallet is arconnect, connect to it automatically
    if (localStorage.getItem('wallet') === arConnect) {
      await actions.arConnect();
    }
  };

  useEffect(() => {
    // only subscribe walletLoaded if arweave wallet does not exist
    // only subscribe if not subscribed already
    if (!window.arweaveWallet && !connectWalletSubscriptionRef.current) {
      window.addEventListener('arweaveWalletLoaded', () => {
        (async () => arConnectLoaded())();
      });
      connectWalletSubscriptionRef.current = true;
    } else if (window.arweaveWallet) {
      (async () => arConnectLoaded())();
    } else {
      // ignore
    }

    if (!switchWalletSubscriptionRef.current) {
      window.addEventListener('walletSwitch', (event: { detail: { address: string } }) => {
        (async () => walletSwitched(event))();
      });
      switchWalletSubscriptionRef.current = true;
    }

    return () => {
      if (connectWalletSubscriptionRef.current) {
        window.removeEventListener('arweaveWalletLoaded', () => {
          (async () => arConnectLoaded())();
        });
        connectWalletSubscriptionRef.current = false;
      }
      if (switchWalletSubscriptionRef.current) {
        window.removeEventListener('walletSwitch', (event: { detail: { address: string } }) => {
          (async () => walletSwitched(event))();
        });
        switchWalletSubscriptionRef.current = false;
      }
    };
  }, [window.arweaveWallet]);

  const arweaveAppWalletSwitched = (event: string | undefined) => {
    (async () => {
      if (event) {
        await actions.switchWallet(event);
      }
    })();
  };

  useEffect(() => {
    if (localStorage.getItem('wallet') === arweaveApp) {
      (async () => {
        await actions.arweaveAppConnect();
      })();
      wallet.on('change', arweaveAppWalletSwitched);
    }
    return () => {
      wallet.off('change', arweaveAppWalletSwitched);
    };
  }, []);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
